"""
auth.py — Onchain Bazaar

Authentication helpers:
  - Password hashing with bcrypt
  - JWT access token creation & verification
  - Refresh token creation & rotation
  - Password reset token flow
  - Email dispatch via Resend API
  - FastAPI dependency: get_current_user / get_current_admin
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import AltanaSession, PasswordResetToken, RefreshToken, User, get_db

bearer_scheme = HTTPBearer(auto_error=False)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _sha256(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─── JWT ──────────────────────────────────────────────────────────────────────

def create_access_token(user_id: str, is_admin: bool) -> str:
    expire = _now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "is_admin": is_admin,
        "exp": expire,
        "iat": _now(),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def _decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise JWTError("Wrong token type")
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ─── FastAPI Dependencies ──────────────────────────────────────────────────────

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = _decode_access_token(credentials.credentials)
    user_id: str = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


# ─── Refresh Tokens ───────────────────────────────────────────────────────────

async def create_refresh_token(user_id: str, db: AsyncSession) -> str:
    raw = secrets.token_urlsafe(48)
    hashed = _sha256(raw)
    expires = _now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token_hash=hashed,
        expires_at=expires,
    ))
    await db.commit()
    return raw


async def rotate_refresh_token(raw_token: str, db: AsyncSession) -> tuple[str, "User"]:
    """Validates old refresh token, deletes it, returns (new_raw_token, user)."""
    hashed = _sha256(raw_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == hashed)
    )
    rt = result.scalar_one_or_none()
    if not rt or rt.expires_at.replace(tzinfo=timezone.utc) < _now():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalid or expired")
    user_id = rt.user_id
    await db.delete(rt)
    await db.flush()
    new_raw = await create_refresh_token(user_id, db)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    return new_raw, user


# ─── Registration / Login ─────────────────────────────────────────────────────

async def register_user(email: str, password: str, display_name: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        id=str(uuid.uuid4()),
        email=email.lower(),
        hashed_password=_hash_password(password),
        display_name=display_name or email.split("@")[0],
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(email: str, password: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if not user or not _verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return user


# ─── Password Reset ───────────────────────────────────────────────────────────

async def request_password_reset(email: str, db: AsyncSession) -> None:
    """Always returns without error to avoid email enumeration."""
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if not user:
        return  # Silent — do not reveal whether email exists

    raw_token = secrets.token_urlsafe(32)
    hashed = _sha256(raw_token)
    expires = _now() + timedelta(hours=1)

    # Invalidate any existing unused tokens for this user
    existing = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,  # noqa: E712
        )
    )
    for old in existing.scalars():
        old.used = True

    db.add(PasswordResetToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash=hashed,
        expires_at=expires,
    ))
    await db.commit()

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    await _send_reset_email(user.email, user.display_name or "there", reset_url)


async def complete_password_reset(raw_token: str, new_password: str, db: AsyncSession) -> None:
    hashed = _sha256(raw_token)
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == hashed,
            PasswordResetToken.used == False,  # noqa: E712
        )
    )
    prt = result.scalar_one_or_none()
    if not prt or prt.expires_at.replace(tzinfo=timezone.utc) < _now():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token invalid or expired")

    result = await db.execute(select(User).where(User.id == prt.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    user.hashed_password = _hash_password(new_password)
    prt.used = True
    await db.commit()


# ─── Email (Resend) ───────────────────────────────────────────────────────────

async def _send_reset_email(to_email: str, name: str, reset_url: str) -> None:
    if not settings.RESEND_API_KEY:
        import logging
        logging.getLogger("auth").warning("RESEND_API_KEY not set — skipping reset email")
        return

    payload = {
        "from": f"Onchain Bazaar <noreply@{settings.EMAIL_FROM_DOMAIN}>",
        "to": [to_email],
        "subject": "Reset your Onchain Bazaar password",
        "html": f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#1B1B18">Password Reset</h2>
          <p>Hi {name},</p>
          <p>We received a request to reset your Onchain Bazaar password.
             Click the button below — this link expires in <strong>1 hour</strong>.</p>
          <a href="{reset_url}"
             style="display:inline-block;margin:24px 0;padding:12px 24px;
                    background:#8C6A1E;color:#fff;border-radius:6px;
                    text-decoration:none;font-weight:600">
            Reset Password
          </a>
          <p style="font-size:12px;color:#6b7280">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        """,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            json=payload,
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            timeout=10,
        )
        resp.raise_for_status()
