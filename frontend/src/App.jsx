import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AgentDirectory from "./components/AgentDirectory";
import AgentCompareModal from "./components/AgentCompareModal";
import HireModal from "./components/HireModal";
import ActiveSessionsDrawer from "./components/ActiveSessionsDrawer";
import PancakeSwapPanel from "./components/PancakeSwapPanel";
import TermiXReport from "./components/TermiXReport";

import { AGENTS_DATA } from "./data/agents";
import {
  BSC_TESTNET_CHAIN_ID,
  BSC_TESTNET_RPC,
  CONTRACT_ADDRESSES,
  ALTANA_SESSION_MANAGER_ABI,
  switchToBscTestnet
} from "./utils/web3";

const API_BASE = "http://localhost:8000/api";

export default function App() {
  // State
  const [account, setAccount] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [activeTab, setActiveTab] = useState("landing"); // 'landing' | 'marketplace' | 'pancakeswap' | 'termix'
  const [isDevMode, setIsDevMode] = useState(false);

  // Data State
  const [agents, setAgents] = useState(AGENTS_DATA);
  const [protocolStats, setProtocolStats] = useState(null);
  const [matrixData, setMatrixData] = useState(null);
  const [userSessions, setUserSessions] = useState([]);

  // Modals & Drawers
  const [selectedAgentForHire, setSelectedAgentForHire] = useState(null);
  const [comparedAgents, setComparedAgents] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isSessionsDrawerOpen, setIsSessionsDrawerOpen] = useState(false);

  // Fetch initial data from backend with fallback
  useEffect(() => {
    async function loadData() {
      try {
        const [agentsRes, statsRes, matrixRes] = await Promise.all([
          fetch(`${API_BASE}/agents`).catch(() => null),
          fetch(`${API_BASE}/stats`).catch(() => null),
          fetch(`${API_BASE}/termix-matrix`).catch(() => null),
        ]);

        if (agentsRes && agentsRes.ok) {
          const d = await agentsRes.json();
          if (d.agents) setAgents(d.agents);
        }
        if (statsRes && statsRes.ok) {
          const s = await statsRes.json();
          setProtocolStats(s);
        }
        if (matrixRes && matrixRes.ok) {
          const m = await matrixRes.json();
          setMatrixData(m);
        }
      } catch (err) {
        console.warn("Backend indexer offline, using local testnet registry data:", err);
      }
    }
    loadData();
  }, []);

  // Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      // If no wallet extension, fall back to Dev Sandbox test wallet
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

  // Fetch User Active Sessions
  const fetchUserSessions = async (walletAddr) => {
    if (!walletAddr) return;
    try {
      const res = await fetch(`${API_BASE}/sessions/${walletAddr}`);
      if (res.ok) {
        const data = await res.json();
        setUserSessions(data.sessions || []);
      }
    } catch (err) {
      console.warn("Could not fetch sessions from indexer:", err);
    }
  };

  // Hire Agent Flow (Altana Session Key creation)
  const handleConfirmHire = async ({ agentId, agentName, agentContract, spendCapBNB, durationHours }) => {
    const userAddr = account || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    let txHash = null;

    // If MetaMask connected on BSC Testnet, attempt onchain session creation
    if (window.ethereum && account && !isDevMode) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const sessionManager = new ethers.Contract(
          CONTRACT_ADDRESSES.AltanaSessionManager,
          ALTANA_SESSION_MANAGER_ABI,
          signer
        );

        const spendCapWei = ethers.parseEther(spendCapBNB.toString());
        const durationSeconds = durationHours * 3600;
        const permHash = ethers.ZeroHash;

        const tx = await sessionManager.createSession(
          agentContract,
          spendCapWei,
          durationSeconds,
          permHash
        );
        const receipt = await tx.wait();
        txHash = receipt.hash;
      } catch (onchainErr) {
        console.warn("Onchain session tx rejected or simulated:", onchainErr);
        // Fall back to indexer session ledger registration
      }
    }

    // Register session in backend indexer
    const res = await fetch(`${API_BASE}/sessions/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userAddress: userAddr,
        agentId: agentId,
        spendCapBNB: spendCapBNB,
        durationHours: durationHours,
        txHash: txHash
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to register session");
    }

    const data = await res.json();
    fetchUserSessions(userAddr);
    return data;
  };

  // Revoke Session (1-Click Emergency Revocation)
  const handleRevokeSession = async (sessionId) => {
    const userAddr = account || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    let revokeTxHash = null;

    if (window.ethereum && account && !isDevMode) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const sessionManager = new ethers.Contract(
          CONTRACT_ADDRESSES.AltanaSessionManager,
          ALTANA_SESSION_MANAGER_ABI,
          signer
        );
        const tx = await sessionManager.revokeSession(sessionId);
        const receipt = await tx.wait();
        revokeTxHash = receipt.hash;
      } catch (e) {
        console.warn("Onchain revoke simulated:", e);
      }
    }

    const res = await fetch(`${API_BASE}/sessions/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId,
        userAddress: userAddr,
        txHash: revokeTxHash
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to revoke session");
    }

    fetchUserSessions(userAddr);
  };

  // Extend Session Duration and/or Spend Cap
  const handleExtendSession = async ({ sessionId, additionalHours, additionalCapBNB }) => {
    const userAddr = account || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    let extendTxHash = null;

    if (window.ethereum && account && !isDevMode) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const sessionManager = new ethers.Contract(
          CONTRACT_ADDRESSES.AltanaSessionManager,
          ALTANA_SESSION_MANAGER_ABI,
          signer
        );
        const additionalSeconds = additionalHours * 3600;
        const additionalCapWei = ethers.parseEther((additionalCapBNB || 0).toString());
        const tx = await sessionManager.extendSession(sessionId, additionalSeconds, additionalCapWei);
        const receipt = await tx.wait();
        extendTxHash = receipt.hash;
      } catch (e) {
        console.warn("Onchain extend simulated:", e);
      }
    }

    const res = await fetch(`${API_BASE}/sessions/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        userAddress: userAddr,
        additionalHours,
        additionalCapBNB: additionalCapBNB || 0,
        txHash: extendTxHash,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to extend session");
    }

    fetchUserSessions(userAddr);
  };

  // Execute Agent Task (PancakeSwap LP Rebalance or Simulation)
  const handleExecuteAgentTask = async ({ sessionId, agentId, taskType, amountBNB }) => {
    const res = await fetch(`${API_BASE}/agents/simulate-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        agentId,
        taskType,
        amountBNB
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Task execution failed");
    }

    const data = await res.json();
    if (account) fetchUserSessions(account);
    return data;
  };

  // Comparison Handlers
  const handleToggleCompare = (agent, clearAll = false) => {
    if (clearAll) {
      setComparedAgents([]);
      return;
    }
    if (!agent) return;

    if (comparedAgents.some((a) => a.id === agent.id)) {
      setComparedAgents(comparedAgents.filter((a) => a.id !== agent.id));
    } else {
      if (comparedAgents.length >= 2) {
        setComparedAgents([comparedAgents[1], agent]);
      } else {
        setComparedAgents([...comparedAgents, agent]);
      }
    }
  };

  const activeSessionsOnly = userSessions.filter((s) => s.status === "active");

  return (
    <div className="min-h-screen flex flex-col bg-[#EAE6D9] text-[#1B1B18]">
      
      {/* Top Navbar */}
      <Navbar
        account={account}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        onSwitchNetwork={switchToBscTestnet}
        isCorrectNetwork={isCorrectNetwork}
        activeSessionsCount={activeSessionsOnly.length}
        onOpenSessions={() => setIsSessionsDrawerOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDevMode={isDevMode}
        setIsDevMode={setIsDevMode}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === "landing" && (
          <LandingPage
            onExploreMarketplace={() => setActiveTab("marketplace")}
            onLaunchPancakeTerminal={() => setActiveTab("pancakeswap")}
            onViewTermiX={() => setActiveTab("termix")}
            account={account}
            onConnect={connectWallet}
            onSelectAgentForHire={(agent) => {
              if (!account) {
                connectWallet();
              }
              setSelectedAgentForHire(agent);
            }}
          />
        )}

        {activeTab === "marketplace" && (
          <AgentDirectory
            agents={agents}
            onHireAgent={(agent) => {
              if (!account) {
                connectWallet();
              }
              setSelectedAgentForHire(agent);
            }}
            comparedAgents={comparedAgents}
            onToggleCompare={handleToggleCompare}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
            onLaunchPancakeTerminal={() => setActiveTab("pancakeswap")}
            stats={protocolStats}
          />
        )}

        {activeTab === "pancakeswap" && (
          <PancakeSwapPanel
            activeSessions={activeSessionsOnly}
            onExecuteAgentTask={handleExecuteAgentTask}
            isDevMode={isDevMode}
          />
        )}

        {activeTab === "termix" && (
          <TermiXReport matrixData={matrixData} />
        )}
      </main>

      {/* Modals & Slide-out Drawers */}
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
        onHire={(agent) => {
          setSelectedAgentForHire(agent);
        }}
      />

      <ActiveSessionsDrawer
        isOpen={isSessionsDrawerOpen}
        onClose={() => setIsSessionsDrawerOpen(false)}
        sessions={userSessions}
        onRevokeSession={handleRevokeSession}
        onExtendSession={handleExtendSession}
        onRefresh={() => account && fetchUserSessions(account)}
      />

      {/* Footer (shown on app views) */}
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
