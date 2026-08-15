# Onchain Bazaar

**The premier onchain discovery, comparison, and hiring venue for ERC-8004 AI agents on BNB Smart Chain.**

> Built for the **Build the Era** Hackathon · Tracks: Main · Altana · PancakeSwap · TermiX  
> Builder: Moizz (solo) · Testnet: BSC Testnet (Chain ID 97)

---

## Why This Is Different

**1. Trust is provable, not claimed.**  
Agent reputation is read from onchain transaction history, not self-reported stats. A judge can verify it on BscScan Testnet themselves.

**2. Safety is structural, not a checkbox.**  
Every hire flows through `AltanaSessionManager` — a spend-capped, revocable session key is the *only* way to authorize an agent. There is no bypass path.

**3. One flow satisfies all four rubrics.**  
A single hire of `SyrupSentinelAgent` → creates an Altana session → triggers a PancakeSwap LP rebalance → produces a TermiX gas-savings report. Four tracks, one coherent demo.

**4. Advantage is quantified, not narrated.**  
The TermiX matrix compares 3 agent tasks vs. manual operation with exact latency, gas, and yield numbers backed by onchain evidence links.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (React 18 + Vite)          │
│  AgentDirectory · HireModal · Sessions      │
│  PancakeSwap Terminal · TermiX Report       │
└───────────────┬─────────────────────────────┘
                │ REST API (localhost:8000)
┌───────────────▼─────────────────────────────┐
│        Backend (FastAPI + Web3.py)          │
│  Live onchain event indexer                 │
│  BscScan caching proxy                      │
│  Session ledger + TermiX matrix             │
└───────────────┬─────────────────────────────┘
                │ RPC (BSC Testnet)
┌───────────────▼─────────────────────────────┐
│          Smart Contracts (BSC Testnet)      │
│  AltanaSessionManager  (session authority)  │
│  SyrupSentinelAgent    (PancakeSwap LP)     │
│  VenusGuardianAgent    (Venus Protocol)     │
│  YieldMaxAgent         (Multi-pool compounder) │
│  ChainWatchAgent       (Security monitor)  │
└─────────────────────────────────────────────┘
```

---

## Smart Contracts

| Contract | Address (BSC Testnet) |
|---|---|
| AltanaSessionManager | `TBD — run deploy:testnet` |
| SyrupSentinelAgent | `TBD` |
| VenusGuardianAgent | `TBD` |
| YieldMaxAgent | `TBD` |
| ChainWatchAgent | `TBD` |
| PancakeSwap V3 Router | `0x1b81D678ffb0C8B614EB42968695da4e8C5A8c93` |
| PancakeSwap V2 Router | `0xD99D1c33F9fC3444f8101754aBC46c52416550D1` |
| WBNB/BUSD V3 Pool | `0x85FAF240a5D2dF7e2C6A3912170327f311c97aFd` |

> After deployment, addresses are auto-synced to `frontend/src/contracts/addresses.js` and `backend/.env` by `contracts/scripts/sync-addresses.js`.

---

## Quick Start

### Prerequisites
- Node 20+, Python 3.11+
- MetaMask with BSC Testnet added (Chain ID 97)
- tBNB from [https://www.bnbchain.org/en/testnet-faucet](https://www.bnbchain.org/en/testnet-faucet)

### 1. Deploy Contracts

```bash
cd contracts
cp .env.example .env
# Fill in PRIVATE_KEY and BSCSCAN_API_KEY in .env

npm install
npm run deploy:testnet     # Deploy all 5 contracts
npm run sync:addresses     # Auto-sync addresses to frontend + backend
npm run verify:testnet     # Verify source code on BscScan
```

### 2. Start Backend

```bash
cd backend
cp .env.example .env
# Addresses are auto-populated by sync:addresses above

pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The backend starts with a live Web3 RPC event poller that indexes `SessionCreated`, `SessionExecuted`, and `SessionRevoked` events from the real BSC Testnet chain every 15 seconds.

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### 4. Full Testnet Demo Flow

1. Open app → Connect MetaMask (auto-switches to BSC Testnet)
2. Browse the **Agent Marketplace** tab — 4 verified agents with live BscScan links
3. Compare any 2 agents via **Compare** — side-by-side 11-attribute matrix
4. Click **Hire** on `SyrupSentinel` → 3-step Altana session config (cap / duration / sign)
5. Open **Sessions Drawer** (shield icon in navbar) → live spend bar, **Revoke**, **Extend**
6. Switch to **PancakeSwap** tab → LP range visualizer, V3/V2 toggle, **Rebalance** execution console
7. Switch to **TermiX Report** tab → 3-task advantage matrix with onchain agent addresses

---

## Hackathon Track Coverage

| Track | Implementation | Verifiable Proof |
|---|---|---|
| **Main — ERC-8004 Marketplace** | Agent Directory + HireModal + Compare | 4 deployed agent contracts on BscScan |
| **Altana — Spend-Capped Sessions** | `AltanaSessionManager.sol` + `ActiveSessionsDrawer` | `SessionCreated` event on BscScan, `revokeSession()` tx |
| **PancakeSwap — Automated Agent** | `SyrupSentinelAgent.sol` + PancakeSwap Terminal | `RangeRebalanced` event, V3 router call |
| **TermiX — Advantage Report** | `/api/termix-matrix` + `TermiXReport.jsx` | Exportable JSON with onchain address evidence |

---

## Project Structure

```
onchain-bazaar/
├── contracts/                  # Hardhat smart contract suite
│   ├── contracts/
│   │   ├── AltanaSessionManager.sol
│   │   ├── SyrupSentinelAgent.sol
│   │   ├── VenusGuardianAgent.sol
│   │   ├── YieldMaxAgent.sol
│   │   ├── ChainWatchAgent.sol
│   │   └── AgentExecutor.sol
│   ├── scripts/
│   │   ├── deploy.js           # Deploys + auto-syncs addresses
│   │   ├── sync-addresses.js   # Post-deploy address sync
│   │   └── verify.js           # BscScan verification
│   ├── test/
│   │   └── SessionManager.test.js  # 4/4 unit tests passing
│   └── hardhat.config.js
│
├── backend/                    # FastAPI indexer + REST API
│   ├── main.py                 # V2: 11 endpoints, lifespan background poller
│   ├── indexer.py              # V2: Live Web3 event indexer
│   ├── config.py               # V2: dotenv + deployments.json auto-load
│   └── requirements.txt
│
└── frontend/                   # React 18 + Vite + Tailwind
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── AgentDirectory.jsx
        │   ├── AgentCard.jsx
        │   ├── AgentCompareModal.jsx
        │   ├── HireModal.jsx
        │   ├── ActiveSessionsDrawer.jsx  # V2: extend + countdown
        │   ├── PancakeSwapPanel.jsx
        │   └── TermiXReport.jsx
        ├── contracts/
        │   └── addresses.js    # Auto-generated by sync-addresses.js
        └── utils/
            └── web3.js         # V2: ABIs, address auto-loading, helpers
```

---

## Technical Highlights

- **AltanaSessionManager** — spend-capped, nonce-ordered, per-session revocation with `extendSession()`. All state changes emit indexed events for trustless verification.
- **SyrupSentinelAgent** — invokes the official PancakeSwap V3 router (`0x1b81D678...`) with V2 fallback, enforcing Altana spend caps on every swap.
- **Live Event Indexer** — the FastAPI backend polls BSC Testnet RPC every 15s, indexing `SessionCreated/Executed/Revoked` events and merging them with the local ledger.
- **`formatCountdown()`** — real-time session expiry countdown in the drawer, refreshes every 10s.
- **Post-Deploy Sync** — `sync-addresses.js` runs automatically after deploy, writing addresses to `backend/.env` and `frontend/src/contracts/addresses.js` so no manual copy-paste is needed.

---

## Tests

```bash
cd contracts
npx hardhat test
```

**Result: 4/4 passing**
- ✅ Session Creation with spend cap enforcement
- ✅ Session Execution with nonce ordering
- ✅ Emergency Revocation (instant, onchain)
- ✅ Unauthorized Revocation rejection

---

## License

MIT — Build the Era Hackathon Submission
