import React, { useState } from "react";
import { BarChart3, Download, Zap, Shield, TrendingUp, Clock, AlertCircle, ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function TermiXReport({ matrixData }) {
  const [downloaded, setDownloaded] = useState(false);

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(matrixData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TermiX_Agent_Advantage_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 lg:px-8">
      
      {/* Report Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold mb-2">
            <BarChart3 size={14} />
            <span>TermiX Quantified Benchmark Suite</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Agent Advantage Matrix
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mt-1">
            Quantified empirical deltas comparing standard manual trader operations against ERC-8004 Altana-capped AI agents across 3 BNB Smart Chain workflows.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2 border-[#00F0FF]/30 hover:border-[#00F0FF] text-white"
        >
          <Download size={14} className="text-[#00F0FF]" />
          <span>{downloaded ? "Report Exported!" : "Export Matrix (JSON)"}</span>
        </button>
      </div>

      {/* 3 Core Task Benchmark Cards */}
      <div className="space-y-6">
        {matrixData?.tasks?.map((task, index) => (
          <div
            key={task.taskId}
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 hover:border-[#F0B90B]/40 transition-all"
          >
            
            {/* Task Title & Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#F0B90B]/10 text-[#F0B90B] flex items-center justify-center font-bold text-sm">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">{task.taskName}</h3>
                  <span className="text-[11px] text-gray-400">{task.category}</span>
                </div>
              </div>

              {/* Quantified Delta Highlights Pill */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-emerald text-[11px] py-1 px-2.5">
                  {task.deltaAdvantage.latencyImprovement}
                </span>
                <span className="badge badge-gold text-[11px] py-1 px-2.5">
                  {task.deltaAdvantage.yieldBoostPercent}
                </span>
                <span className="badge badge-cyan text-[11px] py-1 px-2.5">
                  {task.deltaAdvantage.gasSavingsPercent}
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison Grid (Manual Trader vs AI Agent) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left: Manual Human Trader */}
              <div className="bg-[#07090E]/80 p-5 rounded-2xl border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Clock size={14} /> Manual Human Trader
                  </span>
                  <span className="badge badge-gray text-[10px]">Baseline</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Execution Latency</span>
                    <p className="text-gray-300 font-medium">{task.manual.executionLatency}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Risk Profile / IL</span>
                    <p className="text-rose-300 font-medium">{task.manual.impermanentLossRisk}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Gas Efficiency</span>
                    <p className="text-gray-300 font-medium">{task.manual.gasEfficiency}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Slippage & MEV Risk</span>
                    <p className="text-gray-400 font-medium">{task.manual.slippageTolerance}</p>
                  </div>
                </div>
              </div>

              {/* Right: ERC-8004 Altana Agent */}
              <div className="bg-[#121826]/90 p-5 rounded-2xl border border-[#0ECB81]/40 space-y-3 shadow-lg shadow-[#0ECB81]/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0ECB81] flex items-center gap-1.5">
                    <Zap size={14} /> ERC-8004 AI Agent (Altana Capped)
                  </span>
                  <span className="badge badge-emerald text-[10px]">Automated</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Execution Latency</span>
                    <p className="text-[#0ECB81] font-bold">{task.agent.executionLatency}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Risk Profile / IL</span>
                    <p className="text-white font-medium">{task.agent.impermanentLossRisk}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Gas Efficiency</span>
                    <p className="text-[#F0B90B] font-bold">{task.agent.gasEfficiency}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Safety Bounds</span>
                    <p className="text-[#00F0FF] font-medium">{task.agent.slippageTolerance}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Summary Bar */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5 text-gray-300">
                <Shield size={14} className="text-[#0ECB81]" />
                <span>Enforcement: {task.deltaAdvantage.safetyGuards}</span>
              </span>
              <span className="text-[11px] text-gray-500">Benchmark Data Indexed from BSC Testnet</span>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
