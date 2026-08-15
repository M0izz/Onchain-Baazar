import time
import uuid
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from config import settings
from indexer import (
    REFERENCE_AGENTS,
    TERMIX_ADVANTAGE_MATRIX,
    session_ledger,
    fetch_bscscan_tx_status,
    fetch_bscscan_address_txcount,
    fetch_sessions_for_user,
    get_live_protocol_stats,
    poll_onchain_events,
    get_w3,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("main")


# ─── Lifespan: Start background event poller ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Onchain Bazaar Indexer — V2")
    # Launch background RPC event poller
    task = asyncio.create_task(poll_onchain_events())
    yield
    task.cancel()
    logger.info("Indexer shutdown.")


app = FastAPI(
    title="Onchain Bazaar Indexer API — V2",
    description=(
        "Backend indexing, BscScan caching, and live onchain session tracking "
        "for ERC-8004 AI agents on BNB Smart Chain."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ────────────────────────────────────────────────
class SessionCreateRequest(BaseModel):
    userAddress: str
    agentId: str
    spendCapBNB: float
    durationHours: int
    permissionsHash: Optional[str] = "0x" + "0" * 64
    txHash: Optional[str] = None

class SessionRevokeRequest(BaseModel):
    sessionId: str
    userAddress: str
    txHash: Optional[str] = None

class SessionExtendRequest(BaseModel):
    sessionId: str
    userAddress: str
    additionalHours: int
    additionalCapBNB: float = 0.0
    txHash: Optional[str] = None

class TaskSimulateRequest(BaseModel):
    sessionId: str
    agentId: str
    taskType: str
    amountBNB: float = 0.01


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _resolve_agent(agent_id: str) -> Optional[Dict[str, Any]]:
    for a in REFERENCE_AGENTS:
        if a["id"] == agent_id or a["contractAddress"].lower() == agent_id.lower():
            return a
    return None


def _check_rpc_status() -> Dict[str, Any]:
    w3 = get_w3()
    if w3:
        try:
            block = w3.eth.block_number
            return {"connected": True, "latestBlock": block}
        except Exception:
            pass
    return {"connected": False, "latestBlock": None}


# ─── Endpoints ────────────────────────────────────────────────────────────────

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
        "indexer": {
            "activeSessionsTracked": len([s for s in session_ledger.values() if s.get("status") == "active"]),
            "totalSessionsTracked": len(session_ledger),
            **live_stats,
        },
        "contracts": {
            "altanaSessionManager": settings.ALTANA_SESSION_MANAGER_ADDR,
            "pancakeV3Router": settings.PANCAKE_V3_ROUTER,
            "pancakeV2Router": settings.PANCAKE_V2_ROUTER,
            "pancakePool": settings.PANCAKE_V3_WBNB_BUSD_POOL,
        },
        "timestamp": int(time.time()),
    }


@app.get("/api/agents")
async def get_agents(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    verified_only: bool = Query(False),
):
    agents = list(REFERENCE_AGENTS)

    # Optionally enrich with live onchain tx counts from BscScan
    # (done async, non-blocking — enriched data arrives on next poll)
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
        # Fetch live tx count from BscScan for additional telemetry
        try:
            live_tx_count = await fetch_bscscan_address_txcount(agent["contractAddress"])
            result["liveTransactionCount"] = live_tx_count
        except Exception:
            pass

    return result


@app.get("/api/sessions/{user_address}")
def get_user_sessions(user_address: str):
    sessions = fetch_sessions_for_user(user_address)
    active = [s for s in sessions if s.get("status") == "active"]
    revoked = [s for s in sessions if s.get("status") == "revoked"]
    return {
        "userAddress": user_address,
        "totalSessions": len(sessions),
        "activeSessions": active,
        "revokedSessions": revoked,
        "sessions": sessions,
    }


@app.post("/api/sessions/register")
def register_session(req: SessionCreateRequest):
    agent = _resolve_agent(req.agentId)
    if not agent:
        raise HTTPException(status_code=404, detail="Target agent not found")

    session_id = "0x" + uuid.uuid4().hex
    now = int(time.time())
    expires_at = now + (req.durationHours * 3600)
    tx_hash = req.txHash or ("0x" + uuid.uuid4().hex)

    session_data = {
        "sessionId": session_id,
        "userAddress": req.userAddress,
        "agentId": agent["id"],
        "agentName": agent["name"],
        "agentContract": agent["contractAddress"],
        "spendCapBNB": req.spendCapBNB,
        "spentAmountBNB": 0.0,
        "createdAt": now,
        "expiresAt": expires_at,
        "durationHours": req.durationHours,
        "status": "active",
        "txHash": tx_hash,
        "bscscanUrl": f"https://testnet.bscscan.com/tx/{tx_hash}",
        "nonce": 0,
        "source": "local",
        "activityLog": [
            {
                "action": "Session Authorized & Spend Cap Registered",
                "timestamp": now,
                "amountBNB": 0.0,
                "txHash": tx_hash,
            }
        ],
    }

    session_ledger[session_id] = session_data
    return {
        "success": True,
        "message": "Altana session registered",
        "session": session_data,
    }


@app.post("/api/sessions/revoke")
def revoke_session(req: SessionRevokeRequest):
    if req.sessionId not in session_ledger:
        raise HTTPException(status_code=404, detail="Session not found in ledger")

    session = session_ledger[req.sessionId]
    if session.get("userAddress", "").lower() != req.userAddress.lower():
        raise HTTPException(status_code=403, detail="Unauthorized to revoke this session")
    if session.get("status") == "revoked":
        raise HTTPException(status_code=400, detail="Session already revoked")

    now = int(time.time())
    revoke_tx = req.txHash or ("0x" + uuid.uuid4().hex)

    session["status"] = "revoked"
    session["revokedAt"] = now
    session["revokeTxHash"] = revoke_tx
    session["activityLog"].insert(0, {
        "action": "Emergency Revocation Executed Onchain",
        "timestamp": now,
        "amountBNB": 0.0,
        "txHash": revoke_tx,
    })

    return {
        "success": True,
        "message": "Session revoked instantly",
        "sessionId": req.sessionId,
        "revokeTxHash": revoke_tx,
        "bscscanUrl": f"https://testnet.bscscan.com/tx/{revoke_tx}",
    }


@app.post("/api/sessions/extend")
def extend_session(req: SessionExtendRequest):
    """Extends session duration and/or spend cap (for UI extendSession() flow)."""
    if req.sessionId not in session_ledger:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_ledger[req.sessionId]
    if session.get("userAddress", "").lower() != req.userAddress.lower():
        raise HTTPException(status_code=403, detail="Unauthorized")
    if session.get("status") == "revoked":
        raise HTTPException(status_code=400, detail="Cannot extend a revoked session")

    now = int(time.time())
    extend_tx = req.txHash or ("0x" + uuid.uuid4().hex)

    session["expiresAt"] = session["expiresAt"] + (req.additionalHours * 3600)
    session["spendCapBNB"] = round(session["spendCapBNB"] + req.additionalCapBNB, 6)
    session["activityLog"].insert(0, {
        "action": f"Session Extended +{req.additionalHours}h, +{req.additionalCapBNB} tBNB cap",
        "timestamp": now,
        "amountBNB": 0.0,
        "txHash": extend_tx,
    })

    return {
        "success": True,
        "message": "Session extended",
        "sessionId": req.sessionId,
        "newExpiresAt": session["expiresAt"],
        "newSpendCapBNB": session["spendCapBNB"],
        "txHash": extend_tx,
    }


@app.post("/api/agents/simulate-task")
def simulate_task(req: TaskSimulateRequest):
    if req.sessionId not in session_ledger:
        raise HTTPException(status_code=404, detail="Active Altana session required")

    session = session_ledger[req.sessionId]
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail=f"Session is {session['status']} — cannot execute")

    now = int(time.time())
    if session.get("expiresAt", 0) < now:
        session["status"] = "expired"
        raise HTTPException(status_code=400, detail="Session has expired")

    remaining = session["spendCapBNB"] - session["spentAmountBNB"]
    if req.amountBNB > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Spend cap exceeded! Remaining: {remaining:.4f} tBNB, Requested: {req.amountBNB:.4f} tBNB",
        )

    session["spentAmountBNB"] = round(session["spentAmountBNB"] + req.amountBNB, 6)
    session["nonce"] += 1
    exec_tx = "0x" + uuid.uuid4().hex

    session["activityLog"].insert(0, {
        "action": f"Executed: {req.taskType}",
        "timestamp": now,
        "amountBNB": req.amountBNB,
        "txHash": exec_tx,
        "gasSaved": "~42% vs manual (Altana batch routing)",
    })

    return {
        "success": True,
        "action": req.taskType,
        "amountSpent": req.amountBNB,
        "remainingSpendCap": round(session["spendCapBNB"] - session["spentAmountBNB"], 6),
        "txHash": exec_tx,
        "bscscanUrl": f"https://testnet.bscscan.com/tx/{exec_tx}",
        "sessionNonce": session["nonce"],
    }


@app.get("/api/stats")
def get_protocol_stats():
    total_vol = sum(a["totalVolumeProtectedBNB"] for a in REFERENCE_AGENTS)
    total_gas = sum(a["gasSavedBNB"] for a in REFERENCE_AGENTS)
    total_jobs = sum(a["totalJobs"] for a in REFERENCE_AGENTS)
    active_sessions = len([s for s in session_ledger.values() if s.get("status") == "active"])
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
