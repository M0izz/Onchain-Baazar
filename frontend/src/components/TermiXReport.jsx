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
    <section className="py-8 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 text-[#1B1B18]">
      
      {/* Report Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] bg-[#E0DBC9] border border-[#1B1B18]/20 text-[#8C6A1E] text-xs font-plex-mono font-semibold mb-2">
            <BarChart3 size={14} />
            <span>TermiX Quantified Benchmark Suite</span>
          </div>
          <h1 className="font-zilla text-2xl sm:text-4xl font-bold text-[#1B1B18]">
            Agent Advantage Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[#4A4A43] max-w-2xl mt-1 font-plex-sans leading-relaxed">
            Quantified empirical deltas comparing standard manual trader operations against ERC-8004 Altana-capped AI agents across 3 BNB Smart Chain workflows.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2 border-[#1B1B18]/30 hover:border-[#1B1B18] text-[#1B1B18]"
        >
          <Download size={14} className="text-[#8C6A1E]" />
          <span>{downloaded ? "Report Exported!" : "Export Matrix (JSON)"}</span>
        </button>
      </div>

      {/* 3 Core Task Benchmark Cards */}
      <div className="space-y-6">
        {matrixData?.tasks?.map((task, index) => (
          <div
            key={task.taskId}
            className="bg-[#F3F0E4] p-6 sm:p-8 rounded-[2px] border border-[#1B1B18]/30 hover:border-[#1B1B18] transition-all"
          >
            
            {/* Task Title & Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-[#1B1B18]/20">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full border border-[#1B1B18]/30 bg-[#EAE6D9] text-[#14213D] flex items-center justify-center font-plex-mono font-bold text-xs">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-zilla text-xl font-bold text-[#1B1B18]">{task.taskName}</h3>
                  <span className="text-[11px] text-[#4A4A43] font-plex-mono">{task.category}</span>
                </div>
              </div>

              {/* Quantified Delta Highlights Pill */}
              <div className="flex flex-wrap items-center gap-2 font-plex-mono">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-plex-mono">
              
              {/* Left: Manual Human Trader */}
              <div className="bg-[#EAE6D9] p-5 rounded-[2px] border border-[#B23A2E]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B23A2E] flex items-center gap-1.5">
                    <Clock size={14} /> Manual Human Trader
                  </span>
                  <span className="badge badge-gray text-[10px]">Baseline</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#4A4A43] block text-[11px]">Execution Latency</span>
                    <p className="text-[#1B1B18] font-medium">{task.manual.executionLatency}</p>
                  </div>
                  <div>
                    <span className="text-[#4A4A43] block text-[11px]">Risk Profile / IL</span>
                    <p className="text-[#B23A2E] font-medium">{task.manual.impermanentLossRisk}</p>
                  </div>
                  <div>
                    <span className="text-[#4A4A43] block text-[11px]">Gas Efficiency</span>
                    <p className="text-[#1B1B18] font-medium">{task.manual.gasEfficiency}</p>
                  </div>
                  <div>
                    <span className="text-[#4A4A43] block text-[11px]">Slippage & MEV Risk</span>
                    <p className="text-[#4A4A43] font-medium">{task.manual.slippageTolerance}</p>
                  </div>
                </div>
              </div>

              {/* Right: ERC-8004 Altana Agent */}
              <div className="bg-[#E0DBC9] p-5 rounded-[2px] border border-[#2F6845] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2F6845] flex items-center gap-1.5">
                    <Zap size={14} /> ERC-8004 AI Agent (Altana Capped)
                  </span>
                  <span className="badge badge-emerald text-[10px]">Automated</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#4A4A43] block text-[11px]">Execution Latency</span>
                    <p className="text-[#2F6845] font-bold">{task.agent.executionLatency}</p>
                  </div>
                  <div>
                    <span className="text-[#4A4A43] block text-[11px]">Risk Profile / IL</span>
                    <p className="text-[#1B1B18] font-medium">{task.agent.impermanentLossRisk}</p>
                  </div>
                  <div>
                    <span className="text-[#4A4A43] block text-[11px]">Gas Efficiency</span>
                    <p className="text-[#8C6A1E] font-bold">{task.agent.gasEfficiency}</p>
                  </div>
                  <div>
                    <span className="text-[#4A4A43] block text-[11px]">Safety Bounds</span>
                    <p className="text-[#14213D] font-medium">{task.agent.slippageTolerance}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Summary Bar */}
            <div className="mt-4 pt-3 border-t border-[#1B1B18]/20 flex items-center justify-between text-xs text-[#4A4A43] font-plex-mono">
              <span className="flex items-center gap-1.5 text-[#1B1B18]">
                <Shield size={14} className="text-[#2F6845]" />
                <span>Enforcement: {task.deltaAdvantage.safetyGuards}</span>
              </span>
              <span className="text-[11px] text-[#4A4A43]">Benchmark Data Indexed from BSC Testnet</span>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
