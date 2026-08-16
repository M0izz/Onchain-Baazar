import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AgentDirectory from "./components/AgentDirectory";
import AgentCompareModal from "./components/AgentCompareModal";
import HireModal from "./components/HireModal";
import ActiveSessionsDrawer from "./components/ActiveSessionsDrawer";
import PancakeSwapPanel from "./components/PancakeSwapPanel";
import TermiXReport from "./components/TermiXReport";
import AuthModal from "./components/auth/AuthModal";
import ResetPasswordPage from "./components/auth/ResetPasswordPage";
import UserProfilePanel from "./components/UserProfilePanel";
import AdminPanel from "./components/AdminPanel";

import { AGENTS_DATA } from "./data/agents";
import {
  BSC_TESTNET_CHAIN_ID,
  BSC_TESTNET_RPC,
  CONTRACT_ADDRESSES,
  ALTANA_SESSION_MANAGER_ABI,
  switchToBscTestnet
} from "./utils/web3";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ── Protected Tab Wrapper ──────────────────────────────────────────────────────
// If the user tries to navigate to a protected tab without being logged in,
// redirect them back to the marketplace and prompt sign-in.
const PROTECTED_TABS = ["pancakeswap", "sessions"];

function AppContent() {
  const { isAuthenticated, accessToken, loading: authLoading } = useAuth();

  // ── URL-based reset token detection ────────────────────────────────────────
  const resetToken = new URLSearchParams(window.location.search).get("token");

  // ── State ──────────────────────────────────────────────────────────────────
  const [account, setAccount] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [activeTab, setActiveTab] = useState("landing");
  const [isDevMode, setIsDevMode] = useState(false);

  // Data
  const [agents, setAgents] = useState(AGENTS_DATA);
  const [protocolStats, setProtocolStats] = useState(null);
  const [matrixData, setMatrixData] = useState(null);
  const [userSessions, setUserSessions] = useState([]);

  // Modals & Drawers
  const [selectedAgentForHire, setSelectedAgentForHire] = useState(null);
  const [comparedAgents, setComparedAgents] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isSessionsDrawerOpen, setIsSessionsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("login");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // ── Fetch initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [agentsRes, statsRes, matrixRes] = await Promise.all([
          fetch(`${API_BASE}/agents`).catch(() => null),
          fetch(`${API_BASE}/stats`).catch(() => null),
          fetch(`${API_BASE}/termix-matrix`).catch(() => null),
        ]);
        if (agentsRes?.ok) { const d = await agentsRes.json(); if (d.agents) setAgents(d.agents); }
        if (statsRes?.ok) { const s = await statsRes.json(); setProtocolStats(s); }
        if (matrixRes?.ok) { const m = await matrixRes.json(); setMatrixData(m); }
      } catch (err) {
        console.warn("Backend indexer offline, using local data:", err);
      }
    }
    loadData();
  }, []);

  // Fetch sessions when auth state or account changes
  useEffect(() => {
    if (isAuthenticated && (account || isDevMode)) {
      const addr = account || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      fetchUserSessions(addr);
    }
  }, [isAuthenticated, account]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab navigation with auth guard ─────────────────────────────────────────
  const navigateTo = (tab) => {
    if (PROTECTED_TABS.includes(tab) && !isAuthenticated) {
      setAuthModalTab("login");
      setIsAuthModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  // ── Wallet ─────────────────────────────────────────────────────────────────
  const connectWallet = async () => {
    if (!window.ethereum) {
      const devWallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      setAccount(devWallet);
      setIsDevMode(true);
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const network = await provider.getNetwork();
        setIsCorrectNetwork(Number(network.chainId) === BSC_TESTNET_CHAIN_ID);
        fetchUserSessions(accounts[0]);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setUserSessions([]);
  };

  // ── Sessions ───────────────────────────────────────────────────────────────
  const fetchUserSessions = async (walletAddr) => {
    if (!walletAddr || !isAuthenticated) return;
    try {
      const res = await fetch(`${API_BASE}/sessions/${walletAddr}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) { const data = await res.json(); setUserSessions(data.sessions || []); }
    } catch (err) {
      console.warn("Could not fetch sessions:", err);
    }
  };

  const handleConfirmHire = async ({ agentId, agentName, agentContract, spendCapBNB, durationHours }) => {
    const userAddr = account || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    let txHash = null;

    if (window.ethereum && account && !isDevMode) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const sessionManager = new ethers.Contract(CONTRACT_ADDRESSES.AltanaSessionManager, ALTANA_SESSION_MANAGER_ABI, signer);
        const spendCapWei = ethers.parseEther(spendCapBNB.toString());
        const durationSeconds = durationHours * 3600;
        const permHash = ethers.ZeroHash;
        const tx = await sessionManager.createSession(agentContract, spendCapWei, durationSeconds, permHash);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      } catch (onchainErr) {
        console.warn("Onchain session tx rejected or simulated:", onchainErr);
      }
    }

    const res = await fetch(`${API_BASE}/sessions/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userAddress: userAddr, agentId, spendCapBNB, durationHours, txHash }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to register session"); }
    const data = await res.json();
    fetchUserSessions(userAddr);
    return data;
  };

  const handleRevokeSession = async (sessionId) => {
    const userAddr = account || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    let revokeTxHash = null;

    if (window.ethereum && account && !isDevMode) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const sessionManager = new ethers.Contract(CONTRACT_ADDRESSES.AltanaSessionManager, ALTANA_SESSION_MANAGER_ABI, signer);
        const tx = await sessionManager.revokeSession(sessionId);
        const receipt = await tx.wait();
        revokeTxHash = receipt.hash;
      } catch (e) { console.warn("Onchain revoke simulated:", e); }
    }

    const res = await fetch(`${API_BASE}/sessions/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sessionId, userAddress: userAddr, txHash: revokeTxHash }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to revoke session"); }
    fetchUserSessions(userAddr);
  };

  const handleExtendSession = async ({ sessionId, additionalHours, additionalCapBNB }) => {
    const userAddr = account || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    let extendTxHash = null;

    if (window.ethereum && account && !isDevMode) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const sessionManager = new ethers.Contract(CONTRACT_ADDRESSES.AltanaSessionManager, ALTANA_SESSION_MANAGER_ABI, signer);
        const tx = await sessionManager.extendSession(sessionId, additionalHours * 3600, ethers.parseEther((additionalCapBNB || 0).toString()));
        const receipt = await tx.wait();
        extendTxHash = receipt.hash;
      } catch (e) { console.warn("Onchain extend simulated:", e); }
    }

    const res = await fetch(`${API_BASE}/sessions/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sessionId, userAddress: userAddr, additionalHours, additionalCapBNB: additionalCapBNB || 0, txHash: extendTxHash }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to extend session"); }
    fetchUserSessions(userAddr);
  };

  const handleExecuteAgentTask = async ({ sessionId, agentId, taskType, amountBNB }) => {
    const res = await fetch(`${API_BASE}/agents/simulate-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sessionId, agentId, taskType, amountBNB }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Task execution failed"); }
    const data = await res.json();
    if (account) fetchUserSessions(account);
    return data;
  };

  const handleToggleCompare = (agent, clearAll = false) => {
    if (clearAll) { setComparedAgents([]); return; }
    if (!agent) return;
    if (comparedAgents.some((a) => a.id === agent.id)) {
      setComparedAgents(comparedAgents.filter((a) => a.id !== agent.id));
    } else {
      setComparedAgents(comparedAgents.length >= 2 ? [comparedAgents[1], agent] : [...comparedAgents, agent]);
    }
  };

  const activeSessionsOnly = userSessions.filter((s) => s.status === "active");

  // ── Password Reset Page (URL-driven) ───────────────────────────────────────
  if (resetToken) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onDone={() => {
          // Clear the token from URL and go to marketplace
          window.history.replaceState({}, "", "/");
          setActiveTab("marketplace");
        }}
      />
    );
  }

  // ── Auth loading splash ────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#EAE6D9] flex items-center justify-center">
        <div className="text-center">
          <img src="/bazaar-robot.png" alt="Loading" className="w-12 h-12 mx-auto mb-3 animate-pulse" />
          <p className="text-[#4A4A43] font-plex-mono text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EAE6D9] text-[#1B1B18]">

      <Navbar
        account={account}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        onSwitchNetwork={switchToBscTestnet}
        isCorrectNetwork={isCorrectNetwork}
        activeSessionsCount={activeSessionsOnly.length}
        onOpenSessions={() => setIsSessionsDrawerOpen(true)}
        activeTab={activeTab}
        setActiveTab={navigateTo}
        isDevMode={isDevMode}
        setIsDevMode={setIsDevMode}
        onOpenAuthModal={() => { setAuthModalTab("login"); setIsAuthModalOpen(true); }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content — each tab is keyed so the fade-in re-triggers on switch */}
      <main className="flex-1">
        {activeTab === "landing" && (
          <div key="landing" className="tab-view">
            <LandingPage
              onExploreMarketplace={() => navigateTo("marketplace")}
              onLaunchPancakeTerminal={() => navigateTo("pancakeswap")}
              onViewTermiX={() => navigateTo("termix")}
              account={account}
              onConnect={connectWallet}
              onSelectAgentForHire={(agent) => {
                if (!account) connectWallet();
                setSelectedAgentForHire(agent);
              }}
            />
          </div>
        )}

        {activeTab === "marketplace" && (
          <div key="marketplace" className="tab-view">
            <AgentDirectory
              agents={agents}
              onHireAgent={(agent) => {
                if (!account) connectWallet();
                setSelectedAgentForHire(agent);
              }}
              comparedAgents={comparedAgents}
              onToggleCompare={handleToggleCompare}
              onOpenCompareModal={() => setIsCompareModalOpen(true)}
              onLaunchPancakeTerminal={() => navigateTo("pancakeswap")}
              stats={protocolStats}
            />
          </div>
        )}

        {activeTab === "pancakeswap" && (
          <div key="pancakeswap" className="tab-view">
            <PancakeSwapPanel
              activeSessions={activeSessionsOnly}
              onExecuteAgentTask={handleExecuteAgentTask}
              isDevMode={isDevMode}
            />
          </div>
        )}

        {activeTab === "termix" && (
          <div key="termix" className="tab-view">
            <TermiXReport matrixData={matrixData} />
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <HireModal
        isOpen={!!selectedAgentForHire}
        onClose={() => setSelectedAgentForHire(null)}
        agent={selectedAgentForHire}
        account={account}
        onConfirmHire={handleConfirmHire}
        isDevMode={isDevMode}
      />

      <AgentCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        agents={comparedAgents}
        onHire={(agent) => setSelectedAgentForHire(agent)}
      />

      <ActiveSessionsDrawer
        isOpen={isSessionsDrawerOpen}
        onClose={() => setIsSessionsDrawerOpen(false)}
        sessions={userSessions}
        onRevokeSession={handleRevokeSession}
        onExtendSession={handleExtendSession}
        onRefresh={() => account && fetchUserSessions(account)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      <UserProfilePanel
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Footer */}
      {activeTab !== "landing" && (
        <footer className="border-t border-[#1B1B18]/20 py-6 px-4 text-center text-xs text-[#4A4A43] bg-[#E0DBC9] font-plex-mono">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/bazaar-robot.png" alt="Bazaar Mascot" className="w-5 h-5 object-contain" />
              <span className="font-zilla font-bold text-[#1B1B18] text-sm">ONCHAIN.BAZAAR</span>
              <span>— Built for BNB Smart Chain "Build the Era" Hackathon</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://testnet.bscscan.com" target="_blank" rel="noreferrer" className="hover:text-[#1B1B18] underline">
                BscScan Testnet
              </a>
              <a href="https://developer.pancakeswap.finance" target="_blank" rel="noreferrer" className="hover:text-[#1B1B18] underline">
                PancakeSwap Docs
              </a>
              <span className="text-[#8C6A1E]">Chain ID: 97</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// ── Root export — wraps everything in AuthProvider ─────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
