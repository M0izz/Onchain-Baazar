"""
tests/test_auth.py — Auth endpoint integration tests.

Run with:  pytest backend/tests/test_auth.py -v
Requires:  pip install httpx pytest pytest-asyncio
"""

import pytest
from httpx import AsyncClient, ASGITransport

# Import app after setting a test DATABASE_URL so SQLAlchemy
# doesn't try to connect to production Postgres.
import os
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test_auth.db")

from main import app
from database import Base, engine


@pytest.fixture(autouse=True)
async def setup_db():
    """Create all tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


# ── Register ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_success(client):
    async with client as c:
        r = await c.post("/api/auth/register", json={
            "email": "alice@example.com",
            "password": "securepass1",
            "display_name": "Alice"
        })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["display_name"] == "Alice"


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "pass12345"}
    async with client as c:
        await c.post("/api/auth/register", json=payload)
        r = await c.post("/api/auth/register", json=payload)
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_register_short_password(client):
    async with client as c:
        r = await c.post("/api/auth/register", json={
            "email": "short@example.com", "password": "abc"
        })
    assert r.status_code == 422


# ── Login ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_success(client):
    async with client as c:
        await c.post("/api/auth/register", json={
            "email": "bob@example.com", "password": "mypassword1"
        })
        r = await c.post("/api/auth/login", json={
            "email": "bob@example.com", "password": "mypassword1"
        })
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    async with client as c:
        await c.post("/api/auth/register", json={
            "email": "carol@example.com", "password": "rightpass1"
        })
        r = await c.post("/api/auth/login", json={
            "email": "carol@example.com", "password": "wrongpass"
        })
    assert r.status_code == 401


# ── Protected route ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_me_authenticated(client):
    async with client as c:
        reg = await c.post("/api/auth/register", json={
            "email": "dave@example.com", "password": "davespass1"
        })
        token = reg.json()["access_token"]
        r = await c.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "dave@example.com"


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client):
    async with client as c:
        r = await c.get("/api/users/me")
    assert r.status_code == 401


# ── Refresh ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_refresh_token_rotation(client):
    async with client as c:
        reg = await c.post("/api/auth/register", json={
            "email": "eve@example.com", "password": "evepassword"
        })
        rt = reg.json()["refresh_token"]
        r = await c.post("/api/auth/refresh", json={"refresh_token": rt})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    # New refresh token must differ (rotation)
    assert data["refresh_token"] != rt


@pytest.mark.asyncio
async def test_refresh_invalid_token(client):
    async with client as c:
        r = await c.post("/api/auth/refresh", json={"refresh_token": "invalid.token.value"})
    assert r.status_code == 401


# ── Logout ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_logout_invalidates_refresh_token(client):
    async with client as c:
        reg = await c.post("/api/auth/register", json={
            "email": "frank@example.com", "password": "frankpass1"
        })
        rt = reg.json()["refresh_token"]
        await c.post("/api/auth/logout", json={"refresh_token": rt})
        # Refresh should now fail
        r = await c.post("/api/auth/refresh", json={"refresh_token": rt})
    assert r.status_code == 401


# ── Profile Update ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_profile(client):
    async with client as c:
        reg = await c.post("/api/auth/register", json={
            "email": "grace@example.com", "password": "gracepass1"
        })
        token = reg.json()["access_token"]
        r = await c.patch(
            "/api/users/me",
            json={"display_name": "GraceUpdated", "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 200
    data = r.json()
    assert data["display_name"] == "GraceUpdated"
    assert "0x70997970" in data["wallet_address"]


@pytest.mark.asyncio
async def test_update_profile_invalid_wallet(client):
    async with client as c:
        reg = await c.post("/api/auth/register", json={
            "email": "henry@example.com", "password": "henrypass1"
        })
        token = reg.json()["access_token"]
        r = await c.patch(
            "/api/users/me",
            json={"wallet_address": "not-a-valid-address"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 422
