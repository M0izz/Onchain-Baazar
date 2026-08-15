import React from "react";
import { ShieldCheck, ExternalLink, ArrowRight, Layers, TrendingUp, Eye, Sliders } from "lucide-react";
import { formatAddress, formatBscScanAddressLink } from "../utils/web3";

const ICON_MAP = {
  Layers: Layers,
  ShieldCheck: ShieldCheck,
  TrendingUp: TrendingUp,
  Eye: Eye,
};

export default function AgentCard({
  agent,
  onHire,
  onCompare,
  isCompared,
  onLaunchTerminal
}) {
  const IconComponent = ICON_MAP[agent.icon] || Layers;

  return (
    <div className="glass-panel p-6 flex flex-col justify-between group hover:border-[#F0B90B]/50 transition-all duration-300 relative overflow-hidden">
      
      {/* Top Ambient Glow */}
      <div 
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-30"
        style={{ backgroundColor: agent.color || '#F0B90B' }}
      />

      <div>
        {/* Header: Icon, Name, Category & Verified Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl border border-white/10 shadow-inner bg-[#121826]/80 text-[#F0B90B]"
              style={{ borderColor: `${agent.color}40`, color: agent.color || '#F0B90B' }}
            >
              <IconComponent size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-white group-hover:text-[#F0B90B] transition-colors">
                  {agent.name}
                </h3>
                {agent.verified && (
                  <div className="flex items-center gap-1 text-[#0ECB81]" title="ERC-8004 Verified on BSC Testnet">
                    <ShieldCheck size={16} />
                  </div>
                )}
              </div>
              <span className="badge badge-gray text-[10px] mt-1">{agent.category}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="pulse-dot" />
              <span className="text-xs font-bold text-[#0ECB81]">{agent.uptimePercent}%</span>
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Uptime</span>
          </div>
        </div>

        {/* Contract Address Pill with BscScan Link */}
        <div className="flex items-center justify-between bg-[#07090E]/60 px-3 py-1.5 rounded-lg border border-white/5 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Contract:</span>
            <span className="mono text-gray-300 font-medium">{formatAddress(agent.contractAddress)}</span>
          </div>
          <a
            href={formatBscScanAddressLink(agent.contractAddress)}
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-[#F0B90B] flex items-center gap-1 text-[11px] transition-colors"
            title="Inspect Bytecode on BscScan"
          >
            <span>BscScan</span>
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Tagline & Description */}
        <p className="text-xs text-gray-300 font-medium mb-1 line-clamp-1">{agent.tagline}</p>
        <p className="text-xs text-gray-400 mb-5 line-clamp-2 leading-relaxed">
          {agent.description}
        </p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-5 bg-[#0D111A]/80 p-3 rounded-xl border border-white/5">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Success Rate</span>
            <span className="font-display font-bold text-sm text-[#0ECB81]">{agent.successRate}%</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Protected Vol</span>
            <span className="font-display font-bold text-sm text-white">{agent.totalVolumeProtectedBNB} BNB</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Latency</span>
            <span className="font-display font-bold text-sm text-[#00F0FF]">{agent.avgExecutionLatencyMs}ms</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Fee Schedule</span>
            <span className="font-display font-bold text-xs text-gray-300 truncate block" title={agent.feeSchedule}>
              {agent.feeSchedule}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {agent.tags.map((tag, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-400 font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          
          {/* Hire Button */}
          <button
            onClick={() => onHire(agent)}
            className="btn-primary flex-1 justify-center text-xs py-2.5 font-bold"
          >
            <span>Hire via Altana</span>
            <ArrowRight size={14} />
          </button>

          {/* Compare Toggle */}
          <button
            onClick={() => onCompare(agent)}
            className={`btn-secondary text-xs px-3 py-2.5 ${
              isCompared ? "border-[#0ECB81] bg-[#0ECB81]/15 text-[#0ECB81]" : ""
            }`}
            title="Add to side-by-side comparison"
          >
            <Sliders size={14} />
            <span className="hidden sm:inline">{isCompared ? "Selected" : "Compare"}</span>
          </button>
        </div>

        {/* PancakeSwap Dedicated Launch Button */}
        {agent.pancakeTrack && onLaunchTerminal && (
          <button
            onClick={onLaunchTerminal}
            className="w-full py-1.5 px-3 rounded-lg bg-[#F0B90B]/10 hover:bg-[#F0B90B]/20 text-[#F0B90B] border border-[#F0B90B]/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Layers size={13} />
            <span>Launch PancakeSwap Terminal</span>
          </button>
        )}
      </div>
    </div>
  );
}
