"""
tests/test_sessions.py — Session CRUD tests (DB-backed).

Run with:  pytest backend/tests/test_sessions.py -v
"""

import pytest
from httpx import AsyncClient, ASGITransport
import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test_sessions.db")

from main import app
from database import Base, engine


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _register_and_token(client) -> tuple[str, str]:
    """Helper: register a user and return (access_token, wallet_address)."""
    wallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    reg = await client.post("/api/auth/register", json={
        "email": "tester@example.com",
        "password": "testpass123",
        "display_name": "Tester",
    })
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    # Link wallet to profile
    await client.patch("/api/users/me",
        json={"wallet_address": wallet},
        headers={"Authorization": f"Bearer {token}"},
    )
    return token, wallet


# ── Register Session ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_session(client):
    async with client as c:
        token, wallet = await _register_and_token(c)
        r = await c.post("/api/sessions/register",
            json={
                "userAddress": wallet,
                "agentId": "syrup-sentinel",
                "spendCapBNB": 0.5,
                "durationHours": 24,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert data["session"]["status"] == "active"
    assert data["session"]["spendCapBNB"] == 0.5


@pytest.mark.asyncio
async def test_register_session_requires_auth(client):
    async with client as c:
        r = await c.post("/api/sessions/register",
            json={
                "userAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                "agentId": "syrup-sentinel",
                "spendCapBNB": 0.5,
                "durationHours": 24,
            },
        )
    assert r.status_code == 401


# ── Get Sessions ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_sessions(client):
    async with client as c:
        token, wallet = await _register_and_token(c)
        # Create a session first
        await c.post("/api/sessions/register",
            json={"userAddress": wallet, "agentId": "syrup-sentinel", "spendCapBNB": 0.5, "durationHours": 24},
            headers={"Authorization": f"Bearer {token}"},
        )
        r = await c.get(f"/api/sessions/{wallet}",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 200
    data = r.json()
    assert data["totalSessions"] == 1
    assert len(data["activeSessions"]) == 1


# ── Revoke Session ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_revoke_session(client):
    async with client as c:
        token, wallet = await _register_and_token(c)
        reg = await c.post("/api/sessions/register",
            json={"userAddress": wallet, "agentId": "syrup-sentinel", "spendCapBNB": 1.0, "durationHours": 12},
            headers={"Authorization": f"Bearer {token}"},
        )
        session_id = reg.json()["session"]["sessionId"]
        r = await c.post("/api/sessions/revoke",
            json={"sessionId": session_id, "userAddress": wallet},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 200
    assert r.json()["success"] is True


@pytest.mark.asyncio
async def test_revoke_session_twice_fails(client):
    async with client as c:
        token, wallet = await _register_and_token(c)
        reg = await c.post("/api/sessions/register",
            json={"userAddress": wallet, "agentId": "syrup-sentinel", "spendCapBNB": 1.0, "durationHours": 12},
            headers={"Authorization": f"Bearer {token}"},
        )
        session_id = reg.json()["session"]["sessionId"]
        await c.post("/api/sessions/revoke",
            json={"sessionId": session_id, "userAddress": wallet},
            headers={"Authorization": f"Bearer {token}"},
        )
        r = await c.post("/api/sessions/revoke",
            json={"sessionId": session_id, "userAddress": wallet},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 400


# ── Extend Session ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_extend_session(client):
    async with client as c:
        token, wallet = await _register_and_token(c)
        reg = await c.post("/api/sessions/register",
            json={"userAddress": wallet, "agentId": "syrup-sentinel", "spendCapBNB": 1.0, "durationHours": 24},
            headers={"Authorization": f"Bearer {token}"},
        )
        session_id = reg.json()["session"]["sessionId"]
        original_expires = reg.json()["session"]["expiresAt"]
        r = await c.post("/api/sessions/extend",
            json={"sessionId": session_id, "userAddress": wallet, "additionalHours": 12, "additionalCapBNB": 0.5},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 200
    data = r.json()
    assert data["newExpiresAt"] == original_expires + 12 * 3600
    assert abs(data["newSpendCapBNB"] - 1.5) < 0.001


# ── Spend Cap ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_simulate_task_exceeds_cap(client):
    async with client as c:
        token, wallet = await _register_and_token(c)
        reg = await c.post("/api/sessions/register",
            json={"userAddress": wallet, "agentId": "syrup-sentinel", "spendCapBNB": 0.1, "durationHours": 24},
            headers={"Authorization": f"Bearer {token}"},
        )
        session_id = reg.json()["session"]["sessionId"]
        r = await c.post("/api/agents/simulate-task",
            json={"sessionId": session_id, "agentId": "syrup-sentinel", "taskType": "lp_rebalance", "amountBNB": 5.0},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 400
    assert "cap exceeded" in r.json()["detail"].lower()
