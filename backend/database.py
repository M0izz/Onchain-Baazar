"""
database.py — Onchain Bazaar

SQLAlchemy 2.0 async engine, ORM models, and session factory.
All DB interaction goes through the async session obtained via get_db().
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Float, Integer,
    String, Text, ForeignKey, JSON,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship

from config import settings

# ─── Engine & Session Factory ─────────────────────────────────────────────────

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        yield session


# ─── Base ─────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ─── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: str = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password: str = Column(String(255), nullable=False)
    display_name: str = Column(String(100), nullable=True)
    wallet_address: str = Column(String(42), nullable=True)
    is_admin: bool = Column(Boolean, default=False, nullable=False)
    created_at: datetime = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    sessions = relationship("AltanaSession", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: str = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: str = Column(String(255), nullable=False, unique=True)
    expires_at: datetime = Column(DateTime(timezone=True), nullable=False)
    created_at: datetime = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="refresh_tokens")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: str = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: str = Column(String(255), nullable=False, unique=True)
    expires_at: datetime = Column(DateTime(timezone=True), nullable=False)
    used: bool = Column(Boolean, default=False, nullable=False)
    created_at: datetime = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User")


class AltanaSession(Base):
    """Persistent replacement for the in-memory session_ledger dict."""
    __tablename__ = "altana_sessions"

    session_id: str = Column(String(66), primary_key=True)   # "0x" + 64 hex chars
    user_id: str = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_address: str = Column(String(42), nullable=False, index=True)
    agent_id: str = Column(String(100), nullable=False)
    agent_name: str = Column(String(200), nullable=True)
    agent_contract: str = Column(String(42), nullable=True)
    spend_cap_bnb: float = Column(Float, nullable=False)
    spent_amount_bnb: float = Column(Float, default=0.0, nullable=False)
    created_at: int = Column(BigInteger, nullable=False)        # unix timestamp
    expires_at: int = Column(BigInteger, nullable=False)
    duration_hours: int = Column(Integer, nullable=False)
    status: str = Column(String(20), default="active", nullable=False, index=True)
    tx_hash: str = Column(String(66), nullable=True)
    revoked_at: int = Column(BigInteger, nullable=True)
    revoke_tx_hash: str = Column(String(66), nullable=True)
    nonce: int = Column(Integer, default=0, nullable=False)
    source: str = Column(String(20), default="local", nullable=False)
    activity_log: list = Column(JSON, default=list, nullable=False)

    user = relationship("User", back_populates="sessions")
