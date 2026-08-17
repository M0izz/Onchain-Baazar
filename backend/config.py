import os
import json
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env file if present
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path)

# Try to load deployed addresses from contracts/deployments.json
def _load_deployments() -> dict:
    """Walk up from backend/ to find contracts/deployments.json."""
    base = Path(__file__).parent.parent
    candidates = [
        base / "contracts" / "deployments.json",
        base / "deployments.json",
    ]
    for path in candidates:
        if path.exists():
            try:
                data = json.loads(path.read_text())
                return data.get("contracts", {})
            except Exception:
                pass
    return {}

_deployed = _load_deployments()

class Settings(BaseModel):
    PROJECT_NAME: str = "Onchain Bazaar Indexer"
    CHAIN_ID: int = 97
    NETWORK_NAME: str = "BSC Testnet"

    # ── Database ──────────────────────────────────────────────────────────────
    # asyncpg driver URL for SQLAlchemy: postgresql+asyncpg://user:pass@host/db
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/onchain_bazaar",
    )

    # ── JWT Auth ──────────────────────────────────────────────────────────────
    JWT_SECRET: str = os.getenv("JWT_SECRET", "CHANGE_ME_IN_PRODUCTION_USE_RANDOM_32_CHARS")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

    # ── Email (Resend) ────────────────────────────────────────────────────────
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM_DOMAIN: str = os.getenv("EMAIL_FROM_DOMAIN", "onchainbazaar.xyz")

    # ── Frontend (for reset-password links) ───────────────────────────────────
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    BSC_TESTNET_RPC: str = os.getenv(
        "BSC_TESTNET_RPC",
        "https://data-seed-prebsc-1-s1.binance.org:8545/"
    )
    BSC_TESTNET_WS: str = os.getenv(
        "BSC_TESTNET_WS",
        "wss://bsc-testnet.publicnode.com"
    )

    BSCSCAN_API_URL: str = "https://api-testnet.bscscan.com/api"
    BSCSCAN_API_KEY: str = os.getenv("BSCSCAN_API_KEY", "YourApiKeyToken")

    # Contract addresses — prefer env var, then deployments.json, then hardcoded defaults
    ALTANA_SESSION_MANAGER_ADDR: str = os.getenv(
        "ALTANA_SESSION_MANAGER",
        _deployed.get("AltanaSessionManager", "0x7B9926B64fFe3aA122C3949D63b8D6d75E6a59F1")
    )
    SYRUP_SENTINEL_ADDR: str = os.getenv(
        "SYRUP_SENTINEL",
        _deployed.get("SyrupSentinelAgent", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")
    )
    VENUS_GUARDIAN_ADDR: str = os.getenv(
        "VENUS_GUARDIAN",
        _deployed.get("VenusGuardianAgent", "0x90F79bf6EB2c4f870365E785982E1f101E93b906")
    )
    YIELD_MAX_ADDR: str = os.getenv(
        "YIELD_MAX",
        _deployed.get("YieldMaxAgent", "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")
    )
    CHAIN_WATCH_ADDR: str = os.getenv(
        "CHAIN_WATCH",
        _deployed.get("ChainWatchAgent", "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc")
    )

    # PancakeSwap official BSC Testnet addresses
    PANCAKE_V3_ROUTER: str = "0x1B81D678fFB0c8B614eb42968695Da4E8c5A8c93"
    PANCAKE_V2_ROUTER: str = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"

    # PancakeSwap v3 testnet WBNB/BUSD pools (0.05% fee tier)
    PANCAKE_V3_WBNB_BUSD_POOL: str = "0x85FAF240a5D2dF7e2C6A3912170327f311c97aFd"
    WBNB_ADDRESS: str = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
    BUSD_ADDRESS: str = "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee"
    USDT_ADDRESS: str = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"

    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "10"))
    POLL_INTERVAL_SECONDS: int = int(os.getenv("POLL_INTERVAL_SECONDS", "15"))

settings = Settings()
