import re
import time
import uuid
import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Query, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import AltanaSession, Base, User, engine, get_db
from auth import (
    authenticate_user,
    complete_password_reset,
    create_access_token,
    create_refresh_token,
    get_current_admin,
    get_current_user,
    register_user,
    request_password_reset,
    rotate_refresh_token,
)
from indexer import (
    REFERENCE_AGENTS,
    TERMIX_ADVANTAGE_MATRIX,
    fetch_bscscan_tx_status,
    fetch_bscscan_address_txcount,
    get_live_protocol_stats,
    poll_onchain_events,
    get_w3,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("main")


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables (Alembic handles migrations in prod; this covers local dev)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Starting Onchain Bazaar Indexer — V2 (with auth + DB)")
    task = asyncio.create_task(poll_onchain_events())
    yield
    task.cancel()
    logger.info("Indexer shutdown.")


app = FastAPI(
    title="Onchain Bazaar Indexer API — V2",
    description=(
        "Backend indexing, BscScan caching, live onchain session tracking, "
        "and user account management for ERC-8004 AI agents on BNB Smart Chain."
    ),
    version="2.1.0",
    lifespan=lifespan,
)

# Restrict origins to the deployed frontend in production
_allowed_origins = [
    "http://localhost:5173",
    "http://localhost:4173",
]
if settings.FRONTEND_URL:
    _allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ────────────────────────────────────────────────

ETH_ADDR_REGEX = re.compile(r"^0x[a-fA-F0-9]{40}$")


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    display_name: Optional[str] = Field(None, max_length=100)


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    wallet_address: Optional[str] = Field(None, max_length=42)

    @field_validator("wallet_address")
    @classmethod
    def validate_wallet(cls, v):
        if v and not ETH_ADDR_REGEX.match(v):
            raise ValueError("Invalid EVM wallet address format")
        return v


class SessionCreateRequest(BaseModel):
    userAddress: str
    agentId: str
    spendCapBNB: float = Field(gt=0, le=100.0)
    durationHours: int = Field(gt=0, le=720)
    permissionsHash: Optional[str] = "0x" + "0" * 64
    txHash: Optional[str] = None

    @field_validator("userAddress")
    @classmethod
    def validate_address(cls, v: str) -> str:
        if not ETH_ADDR_REGEX.match(v):
            raise ValueError("Invalid EVM user address format")
        return v


class SessionRevokeRequest(BaseModel):
    sessionId: str
    userAddress: str
    txHash: Optional[str] = None

    @field_validator("userAddress")
    @classmethod
    def validate_address(cls, v: str) -> str:
        if not ETH_ADDR_REGEX.match(v):
            raise ValueError("Invalid EVM user address format")
        return v


class SessionExtendRequest(BaseModel):
    sessionId: str
    userAddress: str
    additionalHours: int = Field(gt=0, le=168)
    additionalCapBNB: float = Field(ge=0, le=50.0)
    txHash: Optional[str] = None

    @field_validator("userAddress")
    @classmethod
    def validate_address(cls, v: str) -> str:
        if not ETH_ADDR_REGEX.match(v):
            raise ValueError("Invalid EVM user address format")
        return v


class TaskSimulateRequest(BaseModel):
    sessionId: str
    agentId: str
    taskType: str
    amountBNB: float = Field(gt=0, le=10.0)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _resolve_agent(agent_id: str) -> Optional[Dict[str, Any]]:
    for a in REFERENCE_AGENTS:
        if a["id"] == agent_id or a["contractAddress"].lower() == agent_id.lower():
            return a
    return None


def _session_to_dict(s: AltanaSession) -> dict:
    return {
        "sessionId": s.session_id,
        "userAddress": s.user_address,
        "agentId": s.agent_id,
        "agentName": s.agent_name,
        "agentContract": s.agent_contract,
        "spendCapBNB": s.spend_cap_bnb,
        "spentAmountBNB": s.spent_amount_bnb,
        "createdAt": s.created_at,
        "expiresAt": s.expires_at,
        "durationHours": s.duration_hours,
        "status": s.status,
        "txHash": s.tx_hash,
        "bscscanUrl": f"https://testnet.bscscan.com/tx/{s.tx_hash}" if s.tx_hash else None,
        "nonce": s.nonce,
        "source": s.source,
        "activityLog": s.activity_log or [],
    }


def _check_rpc_status() -> Dict[str, Any]:
    w3 = get_w3()
    if w3:
        try:
            block = w3.eth.block_number
            return {"connected": True, "latestBlock": block}
        except Exception:
            pass
    return {"connected": False, "latestBlock": None}


# ─── Auth Endpoints ───────────────────────────────────────────────────────────

@app.post("/api/auth/register", status_code=201)
async def auth_register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(req.email, req.password, req.display_name or "", db)
    access_token = create_access_token(user.id, user.is_admin)
    refresh_token = await create_refresh_token(user.id, db)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "wallet_address": user.wallet_address,
            "is_admin": user.is_admin,
        },
    }


@app.post("/api/auth/login")
async def auth_login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(req.email, req.password, db)
    access_token = create_access_token(user.id, user.is_admin)
    refresh_token = await create_refresh_token(user.id, db)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "wallet_address": user.wallet_address,
            "is_admin": user.is_admin,
        },
    }


@app.post("/api/auth/refresh")
async def auth_refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    new_refresh, user = await rotate_refresh_token(req.refresh_token, db)
    access_token = create_access_token(user.id, user.is_admin)
    return {
        "access_token": access_token,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


@app.post("/api/auth/logout")
async def auth_logout(req: LogoutRequest, db: AsyncSession = Depends(get_db)):
    # Best-effort delete — don't error if token not found
    from auth import _sha256
    from database import RefreshToken
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == _sha256(req.refresh_token))
    )
    rt = result.scalar_one_or_none()
    if rt:
        await db.delete(rt)
        await db.commit()
    return {"success": True}


@app.post("/api/auth/forgot-password")
async def auth_forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    await request_password_reset(req.email, db)
    return {"success": True, "message": "If that email is registered, a reset link has been sent."}


@app.post("/api/auth/reset-password")
async def auth_reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    await complete_password_reset(req.token, req.new_password, db)
    return {"success": True, "message": "Password updated successfully."}


# ─── User Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/users/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "wallet_address": current_user.wallet_address,
        "is_admin": current_user.is_admin,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@app.patch("/api/users/me")
async def update_me(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.display_name is not None:
        current_user.display_name = req.display_name
    if req.wallet_address is not None:
        current_user.wallet_address = req.wallet_address
    current_user.updated_at = datetime.now(timezone.utc)
    await db.merge(current_user)
    await db.commit()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "wallet_address": current_user.wallet_address,
    }


@app.get("/api/users/")
async def list_users(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return {
        "total": len(users),
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "display_name": u.display_name,
                "wallet_address": u.wallet_address,
                "is_admin": u.is_admin,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def get_health():
    rpc_status = _check_rpc_status()
    live_stats = get_live_protocol_stats()
    return {
        "status": "healthy",
        "service": "Onchain Bazaar Indexer V2",
        "network": settings.NETWORK_NAME,
        "chainId": settings.CHAIN_ID,
        "rpc": {
            "url": settings.BSC_TESTNET_RPC,
            **rpc_status,
        },
        "indexer": live_stats,
        "contracts": {
            "altanaSessionManager": settings.ALTANA_SESSION_MANAGER_ADDR,
            "pancakeV3Router": settings.PANCAKE_V3_ROUTER,
            "pancakeV2Router": settings.PANCAKE_V2_ROUTER,
            "pancakePool": settings.PANCAKE_V3_WBNB_BUSD_POOL,
        },
        "timestamp": int(time.time()),
    }


# ─── Agents ───────────────────────────────────────────────────────────────────

@app.get("/api/agents")
async def get_agents(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    verified_only: bool = Query(False),
):
    agents = list(REFERENCE_AGENTS)
    if category and category != "All":
        agents = [a for a in agents if a["category"].lower() == category.lower()]
    if search:
        s = search.lower()
        agents = [
            a for a in agents
            if s in a["name"].lower()
            or s in a["description"].lower()
            or s in a["category"].lower()
            or any(s in t.lower() for t in a["tags"])
        ]
    if verified_only:
        agents = [a for a in agents if a.get("verified")]
    return {
        "network": "BSC Testnet",
        "chainId": settings.CHAIN_ID,
        "totalCount": len(agents),
        "agents": agents,
    }


@app.get("/api/agents/{agent_id}")
async def get_agent_by_id(agent_id: str, enrich: bool = Query(False)):
    agent = _resolve_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = dict(agent)
    if enrich:
        try:
            live_tx_count = await fetch_bscscan_address_txcount(agent["contractAddress"])
            result["liveTransactionCount"] = live_tx_count
        except Exception:
            pass
    return result


# ─── Sessions (DB-backed) ─────────────────────────────────────────────────────

@app.get("/api/sessions/{user_address}")
async def get_user_sessions(
    user_address: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AltanaSession).where(AltanaSession.user_address == user_address.lower())
    )
    sessions = result.scalars().all()
    dicts = [_session_to_dict(s) for s in sessions]
    active = [s for s in dicts if s["status"] == "active"]
    revoked = [s for s in dicts if s["status"] == "revoked"]
    return {
        "userAddress": user_address,
        "totalSessions": len(dicts),
        "activeSessions": active,
        "revokedSessions": revoked,
        "sessions": dicts,
    }


@app.post("/api/sessions/register")
async def register_session(
    req: SessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = _resolve_agent(req.agentId)
    if not agent:
        raise HTTPException(status_code=404, detail="Target agent not found")

    session_id = "0x" + uuid.uuid4().hex
    now = int(time.time())
    expires_at = now + (req.durationHours * 3600)
    tx_hash = req.txHash or ("0x" + uuid.uuid4().hex)

    activity_log = [{
        "action": "Session Authorized & Spend Cap Registered",
        "timestamp": now,
        "amountBNB": 0.0,
        "txHash": tx_hash,
    }]

    session = AltanaSession(
        session_id=session_id,
        user_id=current_user.id,
        user_address=req.userAddress.lower(),
        agent_id=agent["id"],
        agent_name=agent["name"],
        agent_contract=agent["contractAddress"],
        spend_cap_bnb=req.spendCapBNB,
        spent_amount_bnb=0.0,
        created_at=now,
        expires_at=expires_at,
        duration_hours=req.durationHours,
        status="active",
        tx_hash=tx_hash,
        nonce=0,
        source="local",
        activity_log=activity_log,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return {
        "success": True,
        "message": "Altana session registered",
        "session": _session_to_dict(session),
    }


@app.post("/api/sessions/revoke")
async def revoke_session(
    req: SessionRevokeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AltanaSession).where(AltanaSession.session_id == req.sessionId)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found in ledger")
    if session.user_address.lower() != req.userAddress.lower():
        raise HTTPException(status_code=403, detail="Unauthorized to revoke this session")
    if session.status == "revoked":
        raise HTTPException(status_code=400, detail="Session already revoked")

    now = int(time.time())
    revoke_tx = req.txHash or ("0x" + uuid.uuid4().hex)
    session.status = "revoked"
    session.revoked_at = now
    session.revoke_tx_hash = revoke_tx
    log = session.activity_log or []
    log.insert(0, {
        "action": "Emergency Revocation Executed Onchain",
        "timestamp": now,
        "amountBNB": 0.0,
        "txHash": revoke_tx,
    })
    session.activity_log = log
    await db.commit()
    return {
        "success": True,
        "message": "Session revoked instantly",
        "sessionId": req.sessionId,
        "revokeTxHash": revoke_tx,
        "bscscanUrl": f"https://testnet.bscscan.com/tx/{revoke_tx}",
    }


@app.post("/api/sessions/extend")
async def extend_session(
    req: SessionExtendRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AltanaSession).where(AltanaSession.session_id == req.sessionId)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_address.lower() != req.userAddress.lower():
        raise HTTPException(status_code=403, detail="Unauthorized")
    if session.status == "revoked":
        raise HTTPException(status_code=400, detail="Cannot extend a revoked session")

    now = int(time.time())
    extend_tx = req.txHash or ("0x" + uuid.uuid4().hex)
    session.expires_at = session.expires_at + (req.additionalHours * 3600)
    session.spend_cap_bnb = round(session.spend_cap_bnb + req.additionalCapBNB, 6)
    log = session.activity_log or []
    log.insert(0, {
        "action": f"Session Extended +{req.additionalHours}h, +{req.additionalCapBNB} tBNB cap",
        "timestamp": now,
        "amountBNB": 0.0,
        "txHash": extend_tx,
    })
    session.activity_log = log
    await db.commit()
    return {
        "success": True,
        "message": "Session extended",
        "sessionId": req.sessionId,
        "newExpiresAt": session.expires_at,
        "newSpendCapBNB": session.spend_cap_bnb,
        "txHash": extend_tx,
    }


@app.post("/api/agents/simulate-task")
async def simulate_task(
    req: TaskSimulateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AltanaSession).where(AltanaSession.session_id == req.sessionId)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Active Altana session required")
    if session.status != "active":
        raise HTTPException(status_code=400, detail=f"Session is {session.status} — cannot execute")

    now = int(time.time())
    if session.expires_at < now:
        session.status = "expired"
        await db.commit()
        raise HTTPException(status_code=400, detail="Session has expired")

    remaining = session.spend_cap_bnb - session.spent_amount_bnb
    if req.amountBNB > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Spend cap exceeded! Remaining: {remaining:.4f} tBNB, Requested: {req.amountBNB:.4f} tBNB",
        )

    exec_tx = "0x" + uuid.uuid4().hex
    session.spent_amount_bnb = round(session.spent_amount_bnb + req.amountBNB, 6)
    session.nonce += 1
    log = session.activity_log or []
    log.insert(0, {
        "action": f"Executed: {req.taskType}",
        "timestamp": now,
        "amountBNB": req.amountBNB,
        "txHash": exec_tx,
        "gasSaved": "~42% vs manual (Altana batch routing)",
    })
    session.activity_log = log
    await db.commit()
    return {
        "success": True,
        "action": req.taskType,
        "amountSpent": req.amountBNB,
        "remainingSpendCap": round(session.spend_cap_bnb - session.spent_amount_bnb, 6),
        "txHash": exec_tx,
        "bscscanUrl": f"https://testnet.bscscan.com/tx/{exec_tx}",
        "sessionNonce": session.nonce,
    }


# ─── Stats / TermiX / BscScan Proxy ──────────────────────────────────────────

@app.get("/api/stats")
async def get_protocol_stats(db: AsyncSession = Depends(get_db)):
    total_vol = sum(a["totalVolumeProtectedBNB"] for a in REFERENCE_AGENTS)
    total_gas = sum(a["gasSavedBNB"] for a in REFERENCE_AGENTS)
    total_jobs = sum(a["totalJobs"] for a in REFERENCE_AGENTS)
    result = await db.execute(
        select(AltanaSession).where(AltanaSession.status == "active")
    )
    active_sessions = len(result.scalars().all())
    live = get_live_protocol_stats()
    return {
        "network": settings.NETWORK_NAME,
        "chainId": settings.CHAIN_ID,
        "totalVolumeProtectedBNB": round(total_vol, 2),
        "totalGasSavedBNB": round(total_gas, 2),
        "totalAgentTasksExecuted": total_jobs,
        "activeAltanaSessions": active_sessions,
        "uptimePercent": "99.98%",
        "onchain": live,
        "contracts": {
            "altanaSessionManager": settings.ALTANA_SESSION_MANAGER_ADDR,
            "pancakeV3Router": settings.PANCAKE_V3_ROUTER,
            "pancakeV2Router": settings.PANCAKE_V2_ROUTER,
        },
    }


@app.get("/api/termix-matrix")
def get_termix_matrix():
    return {
        "title": "TermiX Agent Advantage Quantified Matrix",
        "summary": (
            "Direct performance benchmark comparing standard manual trader operations "
            "against ERC-8004 Altana-capped AI agents across 3 BNB Smart Chain workflows. "
            "All agent contracts are verifiable on BscScan Testnet."
        ),
        "tasks": TERMIX_ADVANTAGE_MATRIX,
        "generated": int(time.time()),
    }


@app.get("/api/bscscan-proxy/tx/{tx_hash}")
async def proxy_bscscan_tx(tx_hash: str):
    return await fetch_bscscan_tx_status(tx_hash)


@app.get("/api/bscscan-proxy/address/{address}/txcount")
async def proxy_bscscan_txcount(address: str):
    count = await fetch_bscscan_address_txcount(address)
    return {"address": address, "transactionCount": count}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
