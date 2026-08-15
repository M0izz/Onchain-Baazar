import { CONTRACT_ADDRESSES } from "../utils/web3";

export const AGENTS_DATA = [
  {
    id: "syrup-sentinel",
    name: "SyrupSentinel",
    category: "DEX Automation",
    tagline: "Autonomous PancakeSwap v3 Concentrated LP Rebalancer",
    description: "Monitors PancakeSwap v3 pool ticks 24/7 and triggers automated non-custodial rebalances when prices drift out of range. Enforced under user Altana spend caps.",
    contractAddress: CONTRACT_ADDRESSES.SyrupSentinel,
    verified: true,
    uptimePercent: 99.98,
    successRate: 99.4,
    totalJobs: 1428,
    totalVolumeProtectedBNB: 482.6,
    gasSavedBNB: 18.4,
    avgExecutionLatencyMs: 480,
    feeSchedule: "0.1% per rebalance",
    safetyScore: 99,
    author: "PancakeOps Labs",
    altanaCompatible: true,
    pancakeTrack: true,
    tags: ["PancakeSwap v3", "Concentrated LP", "Slippage Guard", "Altana Session"],
    icon: "Layers",
    color: "#F0B90B",
    stats: {
      aprBoost: "+18.7%",
      ilMitigation: "94.2%",
      rebalances24h: 37,
      activeUsers: 142
    },
    capabilities: [
      "Sub-second tick boundary monitoring",
      "Dynamic slippage guard with fallback to v2",
      "Cryptographic Altana spend cap verification",
      "Automatic uncollected fee compounding"
    ]
  },
  {
    id: "venus-guardian",
    name: "VenusGuardian",
    category: "Risk & Lending",
    tagline: "24/7 Venus Protocol Health-Factor Liquidation Guard",
    description: "Protects borrowing positions on Venus Protocol by automatically boosting collateral or repaying debt when volatile price swings push the health factor below safety thresholds.",
    contractAddress: CONTRACT_ADDRESSES.VenusGuardian,
    verified: true,
    uptimePercent: 99.99,
    successRate: 100.0,
    totalJobs: 864,
    totalVolumeProtectedBNB: 1240.5,
    gasSavedBNB: 34.2,
    avgExecutionLatencyMs: 320,
    feeSchedule: "0.05% of averted liquidation",
    safetyScore: 100,
    author: "Venus Safety Core",
    altanaCompatible: true,
    pancakeTrack: false,
    tags: ["Venus Protocol", "Liquidation Guard", "Health Factor", "Altana Session"],
    icon: "ShieldCheck",
    color: "#0ECB81",
    stats: {
      liquidationsAverted: 29,
      capitalSaved: "$420K+",
      avgResponse: "320ms",
      activePositions: 88
    },
    capabilities: [
      "Health-factor threshold auto-trigger (<1.20 HF)",
      "Zero-slippage borrow debt adjustment",
      "Emergency flash-collateral injection",
      "100% onchain verifiable transaction trail"
    ]
  },
  {
    id: "yield-max",
    name: "YieldMax",
    category: "Yield Optimizer",
    tagline: "Gas-Optimized Multi-Pool Yield Compounding",
    description: "Automates multi-pool harvesting and reinvestment. Batches reward claims into single MultiCall transactions to slash gas costs by 42% while maximizing APY.",
    contractAddress: CONTRACT_ADDRESSES.YieldMax,
    verified: true,
    uptimePercent: 99.92,
    successRate: 98.9,
    totalJobs: 2150,
    totalVolumeProtectedBNB: 915.2,
    gasSavedBNB: 48.7,
    avgExecutionLatencyMs: 650,
    feeSchedule: "1.5% of compounded yield",
    safetyScore: 97,
    author: "YieldEngineers DAO",
    altanaCompatible: true,
    pancakeTrack: false,
    tags: ["Auto-Compound", "Multi-Pool", "Batch Gas Saver", "Altana Session"],
    icon: "TrendingUp",
    color: "#00F0FF",
    stats: {
      apyUplift: "+3.4%",
      gasDiscount: "42%",
      harvestBatches: 612,
      poolsManaged: 16
    },
    capabilities: [
      "Dynamic threshold compounding (Yield > 10x Gas)",
      "Batch MultiCall reward claiming",
      "Cross-DEX optimal reinvestment routing",
      "Whitelist-only pool interaction guard"
    ]
  },
  {
    id: "chain-watch",
    name: "ChainWatch",
    category: "Security Monitoring",
    tagline: "Real-Time Exploit Detection & Emergency Session Halt",
    description: "Analyzes mempool and block logs on BNB Smart Chain for anomalous contract drain patterns. Pauses linked Altana sessions instantly when threats are flagged.",
    contractAddress: CONTRACT_ADDRESSES.ChainWatch,
    verified: true,
    uptimePercent: 100.0,
    successRate: 100.0,
    totalJobs: 5420,
    totalVolumeProtectedBNB: 3100.0,
    gasSavedBNB: 12.1,
    avgExecutionLatencyMs: 190,
    feeSchedule: "Free Tier / 0.01 tBNB/mo Premium",
    safetyScore: 99,
    author: "Sentinels Security",
    altanaCompatible: true,
    pancakeTrack: false,
    tags: ["Exploit Detector", "Emergency Halt", "Anomaly Feed", "Altana Session"],
    icon: "Eye",
    color: "#A855F7",
    stats: {
      anomaliesCaught: 14,
      alertsBroadcast: 412,
      latency: "190ms",
      monitoredProtocols: 34
    },
    capabilities: [
      "Mempool sandwich & frontrunning detection",
      "Oracle manipulation anomaly triggers",
      "Automated session emergency pause",
      "Public onchain telemetry ledger"
    ]
  }
];

export const CATEGORIES = [
  "All",
  "DEX Automation",
  "Risk & Lending",
  "Yield Optimizer",
  "Security Monitoring"
];
