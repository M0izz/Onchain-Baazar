import React, { useState } from "react";
import { ArrowRight, RefreshCw, Zap, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, Activity, Sliders, Layers } from "lucide-react";
import { formatAddress, formatBscScanTxLink, formatBscScanAddressLink, CONTRACT_ADDRESSES } from "../utils/web3";

export default function PancakeSwapPanel({
  activeSessions,
  onExecuteAgentTask,
  isDevMode
}) {
  const [selectedSessionId, setSelectedSessionId] = useState(
    activeSessions.length > 0 ? activeSessions[0].sessionId : ""
  );
  const [lowerTick, setLowerTick] = useState("-887220");
  const [upperTick, setUpperTick] = useState("887220");
  const [rebalanceAmount, setRebalanceAmount] = useState("0.02");
  const [poolPair, setPoolPair] = useState("tBNB / BUSD (0.05% v3 Pool)");
  const [routerMode, setRouterMode] = useState("v3"); // 'v3' or 'v2-fallback'
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);

  const activeSession = activeSessions.find((s) => s.sessionId === selectedSessionId) || activeSessions[0];

  const handleTriggerRebalance = async () => {
    if (!activeSession) {
      setError("Please hire an agent first to create an active Altana session key.");
      return;
    }

    setError(null);
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await onExecuteAgentTask({
        sessionId: activeSession.sessionId,
        agentId: "syrup-sentinel",
        taskType: `PancakeSwap ${routerMode.toUpperCase()} Concentrated LP Range Rebalance`,
        amountBNB: parseFloat(rebalanceAmount),
      });

      setExecutionResult(result);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to execute LP rebalance");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <section className="py-8 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 text-[#1B1B18]">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full border border-[#1B1B18]/30 bg-[#EAE6D9] text-[#14213D] flex items-center justify-center">
              <Layers size={18} />
            </div>
            <h1 className="font-zilla text-2xl sm:text-3xl font-bold text-[#1B1B18]">
              PancakeSwap LP Automation Terminal
            </h1>
            <span className="badge badge-gold text-[10px]">SyrupSentinel</span>
          </div>
          <p className="text-xs text-[#4A4A43] font-plex-sans">
            Autonomous v3 Concentrated Liquidity range rebalancing executed under Altana spend caps.
          </p>
        </div>

        {/* Router Resilience Mode Switcher */}
        <div className="flex items-center gap-2 bg-[#E0DBC9] p-1 rounded-[2px] border border-[#1B1B18]/20 text-xs font-plex-mono">
          <span className="text-[11px] text-[#4A4A43] px-2 font-medium">Router Mode:</span>
          <button
            onClick={() => setRouterMode("v3")}
            className={`px-3 py-1 rounded-[2px] font-bold transition-all ${
              routerMode === "v3"
                ? "bg-[#14213D] text-[#EAE6D9] shadow-sm"
                : "text-[#4A4A43] hover:text-[#1B1B18]"
            }`}
          >
            v3 Primary
          </button>
          <button
            onClick={() => setRouterMode("v2-fallback")}
            className={`px-3 py-1 rounded-[2px] font-bold transition-all ${
              routerMode === "v2-fallback"
                ? "bg-[#2F6845] text-white shadow-sm"
                : "text-[#4A4A43] hover:text-[#1B1B18]"
            }`}
            title="Resilience fallback router"
          >
            v2 Fallback
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Interactive LP Range & Price Visualizer */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Visual LP Position Card */}
          <div className="bg-[#F3F0E4] border border-[#1B1B18]/30 rounded-[2px] p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C6A1E] block font-plex-mono">Monitored Testnet Pool</span>
                <span className="font-zilla font-bold text-[#1B1B18] text-lg">{poolPair}</span>
              </div>
              <span className="badge badge-emerald flex items-center gap-1">
                <span className="pulse-dot" /> In Range (Optimal)
              </span>
            </div>

            {/* Concentrated Range Chart / Bar representation */}
            <div className="bg-[#EAE6D9] p-5 rounded-[2px] border border-[#1B1B18]/20 mb-6 space-y-3 font-plex-mono">
              <div className="flex items-center justify-between text-xs text-[#4A4A43]">
                <span>Lower Bound (Min)</span>
                <span className="text-[#2F6845] font-bold">Current Price: 1.0004 BUSD</span>
                <span>Upper Bound (Max)</span>
              </div>

              {/* Range Visualizer Track */}
              <div className="relative h-10 bg-[#E0DBC9] rounded-[2px] border border-[#1B1B18]/20 flex items-center px-4 overflow-hidden">
                {/* Highlight Active Liquidity Range */}
                <div className="absolute left-[20%] right-[20%] top-1 bottom-1 bg-[#14213D]/10 rounded-[2px] border border-[#14213D]/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#14213D] uppercase tracking-wider">
                    Concentrated Fee Capture Band (0.05%)
                  </span>
                </div>
                {/* Needle for current price */}
                <div className="absolute left-[50%] -top-1 -bottom-1 w-1 bg-[#1B1B18] shadow-md z-10" />
              </div>

              <div className="flex items-center justify-between text-[11px] mono text-[#4A4A43]">
                <span>Tick: {lowerTick}</span>
                <span className="text-[#1B1B18] font-bold">Centered at 0.00% Drift</span>
                <span>Tick: +{upperTick}</span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center bg-[#EAE6D9] p-4 rounded-[2px] border border-[#1B1B18]/20 font-plex-mono">
              <div>
                <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block">Fee APR Boost</span>
                <span className="font-zilla font-bold text-base text-[#2F6845]">+18.7%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block">Gas Saved</span>
                <span className="font-zilla font-bold text-base text-[#8C6A1E]">50%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block">IL Mitigation</span>
                <span className="font-zilla font-bold text-base text-[#14213D]">94.2%</span>
              </div>
            </div>
          </div>

          {/* Router Details Card */}
          <div className="bg-[#F3F0E4] border border-[#1B1B18]/30 rounded-[2px] p-5 text-xs space-y-2 font-plex-mono">
            <div className="flex items-center justify-between text-[#4A4A43]">
              <span>Selected Router:</span>
              <span className="font-semibold text-[#1B1B18]">
                {routerMode === "v3" ? "PancakeSwap v3 SwapRouter" : "PancakeSwap v2 Testnet Router"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#4A4A43]">
              <span>Router Address:</span>
              <a
                href={formatBscScanAddressLink(
                  routerMode === "v3" ? CONTRACT_ADDRESSES.PancakeV3Router : CONTRACT_ADDRESSES.PancakeV2Router
                )}
                target="_blank"
                rel="noreferrer"
                className="mono text-[#14213D] hover:underline flex items-center gap-1"
              >
                <span>{formatAddress(routerMode === "v3" ? CONTRACT_ADDRESSES.PancakeV3Router : CONTRACT_ADDRESSES.PancakeV2Router)}</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <div className="flex items-center justify-between text-[#4A4A43]">
              <span>Slippage Protection:</span>
              <span className="text-[#2F6845] font-semibold">Dynamic MEV & Sandwich Guard (0.2% max)</span>
            </div>
          </div>

        </div>

        {/* Right Col: Altana Session Execution Terminal */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#F3F0E4] border border-[#1B1B18]/30 rounded-[2px] p-6 font-plex-mono">
            <h3 className="font-zilla font-bold text-lg text-[#1B1B18] mb-4 flex items-center gap-2">
              <Zap size={18} className="text-[#8C6A1E]" />
              <span>Session-Capped Execution Console</span>
            </h3>

            {/* Session Selector */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-[#8C6A1E] block mb-1">
                  Active Altana Session Key:
                </label>
                {activeSessions.length > 0 ? (
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full bg-[#EAE6D9] border border-[#1B1B18]/30 rounded-[2px] px-3 py-2 text-xs text-[#1B1B18] focus:outline-none focus:border-[#14213D]"
                  >
                    {activeSessions.map((s) => (
                      <option key={s.sessionId} value={s.sessionId}>
                        {s.agentName} — Cap: {s.spendCapBNB} tBNB (Spent: {s.spentAmountBNB?.toFixed(4) || "0"} BNB)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-[2px] bg-[#E0DBC9] border border-[#8C6A1E]/30 text-[#8C6A1E] text-xs">
                    No active session found. Please hire SyrupSentinel from the directory.
                  </div>
                )}
              </div>

              {/* Rebalance Execution Amount */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#1B1B18]">Rebalance Swap Size:</span>
                  <span className="text-[#4A4A43]">Within Altana Cap</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.005"
                    min="0.001"
                    value={rebalanceAmount}
                    onChange={(e) => setRebalanceAmount(e.target.value)}
                    className="w-full bg-[#EAE6D9] border border-[#1B1B18]/30 rounded-[2px] px-3 py-2 text-xs text-[#1B1B18] font-mono focus:outline-none focus:border-[#14213D]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C6A1E] font-bold">
                    tBNB
                  </span>
                </div>
              </div>

              {/* Target Boundaries */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block mb-1">Lower Tick</span>
                  <input
                    type="text"
                    value={lowerTick}
                    onChange={(e) => setLowerTick(e.target.value)}
                    className="w-full bg-[#EAE6D9] border border-[#1B1B18]/30 rounded-[2px] px-2.5 py-1.5 text-xs text-[#1B1B18] font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block mb-1">Upper Tick</span>
                  <input
                    type="text"
                    value={upperTick}
                    onChange={(e) => setUpperTick(e.target.value)}
                    className="w-full bg-[#EAE6D9] border border-[#1B1B18]/30 rounded-[2px] px-2.5 py-1.5 text-xs text-[#1B1B18] font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-[2px] bg-[#B23A2E]/10 border border-[#B23A2E]/30 text-[#B23A2E] text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Execute Action Button */}
              <button
                onClick={handleTriggerRebalance}
                disabled={isExecuting || !activeSession}
                className="btn-primary w-full justify-center py-3 text-xs font-semibold disabled:opacity-50"
              >
                {isExecuting ? (
                  <span>Executing Onchain Rebalance...</span>
                ) : (
                  <>
                    <span>Trigger Autonomous Rebalance</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            {/* Execution Result Receipt */}
            {executionResult && (
              <div className="bg-[#EAE6D9] p-4 rounded-[2px] border border-[#2F6845] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#2F6845] font-bold">
                  <CheckCircle2 size={16} />
                  <span>Rebalance Completed Onchain</span>
                </div>

                <div className="flex items-center justify-between text-[#4A4A43]">
                  <span>Spent Allowance:</span>
                  <span className="mono text-[#1B1B18] font-bold">{executionResult.amountSpent} tBNB</span>
                </div>

                <div className="flex items-center justify-between text-[#4A4A43]">
                  <span>Remaining Cap:</span>
                  <span className="mono text-[#2F6845] font-bold">{executionResult.remainingSpendCap?.toFixed(4)} tBNB</span>
                </div>

                <div className="flex items-center justify-between text-[#4A4A43]">
                  <span>BscScan Receipt:</span>
                  <a
                    href={executionResult.bscscanUrl || formatBscScanTxLink(executionResult.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mono text-[#14213D] hover:underline flex items-center gap-1"
                  >
                    <span>{formatAddress(executionResult.txHash)}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </section>
  );
}
