import React from "react";
import { ShieldCheck, Zap, Activity, ExternalLink, SlidersHorizontal, BarChart3, Radio, RefreshCw } from "lucide-react";
import { formatAddress, BSCSCAN_TESTNET_URL } from "../utils/web3";

export default function Navbar({
  account,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  isCorrectNetwork,
  activeSessionsCount,
  onOpenSessions,
  activeTab,
  setActiveTab,
  isDevMode,
  setIsDevMode
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#07090E]/90 border-b border-white/10 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab("marketplace")} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F0B90B] to-[#FCD535] p-0.5 shadow-lg shadow-[#F0B90B]/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B0E14] rounded-[10px] flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl tracking-tight text-white group-hover:text-[#F0B90B] transition-colors">
                  ONCHAIN<span className="text-[#F0B90B]">.BAZAAR</span>
                </span>
                <span className="badge badge-gold text-[10px] py-0.5 px-2">BNB Chain</span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">ERC-8004 AI Agent Marketplace</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#121826]/70 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "marketplace"
                  ? "bg-[#F0B90B] text-black shadow-md shadow-[#F0B90B]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Zap size={14} /> Agent Directory
            </button>

            <button
              onClick={() => setActiveTab("pancakeswap")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "pancakeswap"
                  ? "bg-[#F0B90B] text-black shadow-md shadow-[#F0B90B]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              🥞 PancakeSwap Terminal
            </button>

            <button
              onClick={() => setActiveTab("termix")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "termix"
                  ? "bg-[#F0B90B] text-black shadow-md shadow-[#F0B90B]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart3 size={14} /> TermiX Matrix
            </button>
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          
          {/* Network Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121826] border border-white/10 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#0ECB81] animate-pulse" />
            <span className="text-gray-300 font-medium">BSC Testnet (97)</span>
            <a 
              href={BSCSCAN_TESTNET_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="text-gray-500 hover:text-[#F0B90B]"
              title="View on BscScan"
            >
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Active Altana Sessions Button */}
          <button
            onClick={onOpenSessions}
            className="btn-secondary relative text-xs py-2 px-3 flex items-center gap-2"
          >
            <ShieldCheck size={16} className="text-[#0ECB81]" />
            <span className="hidden sm:inline">Active Sessions</span>
            {activeSessionsCount > 0 ? (
              <span className="w-5 h-5 rounded-full bg-[#0ECB81] text-black font-extrabold text-[11px] flex items-center justify-center">
                {activeSessionsCount}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-gray-500" />
            )}
          </button>

          {/* Wallet Connect Button */}
          {account ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onDisconnect}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-2 border-[#F0B90B]/30 hover:border-[#F0B90B]"
              >
                <div className="w-2 h-2 rounded-full bg-[#F0B90B]" />
                <span className="mono font-semibold">{formatAddress(account)}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              className="btn-primary text-xs py-2 px-4"
            >
              Connect Wallet
            </button>
          )}

        </div>
      </div>

      {/* Dev Mode Banner if enabled */}
      {isDevMode && (
        <div className="mt-2.5 max-w-7xl mx-auto py-1 px-3 bg-amber-950/50 border border-amber-500/30 rounded-lg flex items-center justify-between text-[11px] text-amber-200">
          <div className="flex items-center gap-2">
            <span className="font-bold px-1.5 py-0.5 bg-amber-500 text-black rounded text-[10px] tracking-wider">[DEV SANDBOX ACTIVE]</span>
            <span>Simulated instant confirmations enabled for local sandbox testing. Switch to live BSC Testnet signer anytime.</span>
          </div>
          <button 
            onClick={() => setIsDevMode(false)}
            className="underline hover:text-white font-medium"
          >
            Disable Sandbox
          </button>
        </div>
      )}
    </header>
  );
}
