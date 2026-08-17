/**
 * Contract Addresses — Onchain Bazaar V2
 *
 * Loads deployed addresses from src/contracts/addresses.js.
 * This file is either the stub (before deployment) or the auto-generated
 * real addresses (populated by contracts/scripts/sync-addresses.js after deploy).
 */
import { DEPLOYED_ADDRESSES } from "../contracts/addresses.js";

import { ethers } from "ethers";

export const BSC_TESTNET_CHAIN_ID = 97;
export const BSC_TESTNET_CHAIN_ID_HEX = "0x61";
export const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
export const BSCSCAN_TESTNET_URL = "https://testnet.bscscan.com";

// Placeholder defaults (replaced by real addresses once deploy:testnet is run)
const _DEFAULTS = {
  AltanaSessionManager: "0x7B9926B64fFe3aA122C3949D63b8D6d75E6a59F1",
  SyrupSentinel: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  VenusGuardian: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  YieldMax: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  ChainWatch: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  PancakeV3Router: "0x1b81D678ffb0C8B614EB42968695da4e8C5A8c93",
  PancakeV2Router: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
  // PancakeSwap v3 testnet WBNB/BUSD pool
  PancakeWbnbBusdPool: "0x85FAF240a5D2dF7e2C6A3912170327f311c97aFd",
  // BSC Testnet tokens
  WBNB: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  BUSD: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",
  USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
};

export const CONTRACT_ADDRESSES = {
  AltanaSessionManager: DEPLOYED_ADDRESSES?.AltanaSessionManager || _DEFAULTS.AltanaSessionManager,
  SyrupSentinel: DEPLOYED_ADDRESSES?.SyrupSentinelAgent || _DEFAULTS.SyrupSentinel,
  VenusGuardian: DEPLOYED_ADDRESSES?.VenusGuardianAgent || _DEFAULTS.VenusGuardian,
  YieldMax: DEPLOYED_ADDRESSES?.YieldMaxAgent || _DEFAULTS.YieldMax,
  ChainWatch: DEPLOYED_ADDRESSES?.ChainWatchAgent || _DEFAULTS.ChainWatch,
  PancakeV3Router: DEPLOYED_ADDRESSES?.PancakeV3Router || _DEFAULTS.PancakeV3Router,
  PancakeV2Router: DEPLOYED_ADDRESSES?.PancakeV2Router || _DEFAULTS.PancakeV2Router,
  PancakeWbnbBusdPool: _DEFAULTS.PancakeWbnbBusdPool,
  WBNB: _DEFAULTS.WBNB,
  BUSD: _DEFAULTS.BUSD,
  USDT: _DEFAULTS.USDT,
};

export const ALTANA_SESSION_MANAGER_ABI = [
  "function createSession(address agent, uint256 spendCapWei, uint256 durationSeconds, bytes32 permissionsHash) external payable returns (bytes32 sessionId)",
  "function executeWithSession(bytes32 sessionId, address target, uint256 spendAmountWei, bytes calldata data) external payable returns (bool success, bytes memory returnData)",
  "function revokeSession(bytes32 sessionId) external",
  "function extendSession(bytes32 sessionId, uint256 additionalSeconds, uint256 additionalCapWei) external",
  "function getSession(bytes32 sessionId) external view returns (tuple(address user, address agent, uint256 spendCapWei, uint256 spentAmountWei, uint256 createdAt, uint256 expiresAt, bool active, bytes32 permissionsHash, uint256 nonce))",
  "function getUserSessions(address user) external view returns (bytes32[])",
  "function isSessionValid(bytes32 sessionId) external view returns (bool isValid, uint256 remainingSpendWei)",
  "function totalSessionsCreated() external view returns (uint256)",
  "function totalSessionsRevoked() external view returns (uint256)",
  "function totalSpendExecutedWei() external view returns (uint256)",
  "event SessionCreated(bytes32 indexed sessionId, address indexed user, address indexed agent, uint256 spendCapWei, uint256 expiresAt, bytes32 permissionsHash)",
  "event SessionExecuted(bytes32 indexed sessionId, address indexed agent, address target, uint256 amountSpentWei, uint256 remainingSpendWei, uint256 nonce)",
  "event SessionRevoked(bytes32 indexed sessionId, address indexed user, address indexed agent, uint256 remainingSpendWei, uint256 timestamp)",
];

export const SYRUP_SENTINEL_ABI = [
  "function rebalanceLPRange(bytes32 sessionId, address pool, int24 newLowerTick, int24 newUpperTick, uint256 swapAmountWei) external payable returns (bool)",
  "function getAgentDetails() external view returns (string memory name, string memory category, string memory uri, uint256 totalTasks, uint256 successRate, uint256 volumeProtected, uint256 gasScore)",
  "event RangeRebalanced(bytes32 indexed sessionId, address indexed pool, int24 oldLowerTick, int24 oldUpperTick, int24 newLowerTick, int24 newUpperTick, uint256 amountSwappedWei, uint256 gasSavedWei)",
];

export function formatAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatBscScanAddressLink(address) {
  return `${BSCSCAN_TESTNET_URL}/address/${address}`;
}

export function formatBscScanTxLink(txHash) {
  return `${BSCSCAN_TESTNET_URL}/tx/${txHash}`;
}

export function formatBscScanTokenLink(address) {
  return `${BSCSCAN_TESTNET_URL}/token/${address}`;
}

export function formatRelativeTime(unixTs) {
  const diff = Math.floor(Date.now() / 1000) - unixTs;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatCountdown(expiresAt) {
  const diff = expiresAt - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s left`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s left`;
  return `${s}s left`;
}

export async function switchToBscTestnet() {
  if (!window.ethereum) throw new Error("MetaMask or Web3 wallet not detected");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_TESTNET_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BSC_TESTNET_CHAIN_ID_HEX,
            chainName: "BNB Smart Chain Testnet",
            nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
            rpcUrls: [BSC_TESTNET_RPC],
            blockExplorerUrls: [BSCSCAN_TESTNET_URL],
          },
        ],
      });
      return true;
    }
    throw switchError;
  }
}
