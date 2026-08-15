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
    <div className="bg-[#F3F0E4] border border-[#1B1B18]/30 rounded-[2px] p-6 flex flex-col justify-between group hover:border-[#1B1B18] transition-all duration-200 relative overflow-hidden text-[#1B1B18]">
      
      <div>
        {/* Header: Icon, Name, Category & Verified Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full border-2 border-[#1B1B18]/30 flex items-center justify-center bg-[#EAE6D9] text-[#14213D]"
            >
              <IconComponent size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-zilla text-lg font-bold text-[#1B1B18] group-hover:text-[#14213D] transition-colors">
                  {agent.name}
                </h3>
                {agent.verified && (
                  <div className="flex items-center gap-1 text-[#2F6845]" title="ERC-8004 Verified on BSC Testnet">
                    <ShieldCheck size={16} />
                  </div>
                )}
              </div>
              <span className="badge badge-gold text-[10px] mt-1">{agent.category}</span>
            </div>
          </div>

          <div className="text-right font-plex-mono">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="pulse-dot" />
              <span className="text-xs font-bold text-[#2F6845]">{agent.uptimePercent}%</span>
            </div>
            <span className="text-[10px] text-[#4A4A43] uppercase tracking-wider">Uptime</span>
          </div>
        </div>

        {/* Contract Address Pill with BscScan Link */}
        <div className="flex items-center justify-between bg-[#EAE6D9] px-3 py-1.5 rounded-[2px] border border-[#1B1B18]/20 mb-4 text-xs font-plex-mono">
          <div className="flex items-center gap-1.5 text-[#4A4A43]">
            <span className="text-[10px] uppercase tracking-wider text-[#8C6A1E]">Contract:</span>
            <span className="mono text-[#1B1B18] font-medium">{formatAddress(agent.contractAddress)}</span>
          </div>
          <a
            href={formatBscScanAddressLink(agent.contractAddress)}
            target="_blank"
            rel="noreferrer"
            className="text-[#4A4A43] hover:text-[#1B1B18] flex items-center gap-1 text-[11px] transition-colors"
            title="Inspect Bytecode on BscScan"
          >
            <span>BscScan</span>
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Tagline & Description */}
        <p className="text-xs text-[#1B1B18] font-semibold mb-1 line-clamp-1 font-plex-sans">{agent.tagline}</p>
        <p className="text-xs text-[#4A4A43] mb-5 line-clamp-2 leading-relaxed font-plex-sans">
          {agent.description}
        </p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-5 bg-[#EAE6D9] p-3 rounded-[2px] border border-[#1B1B18]/20 font-plex-mono">
          <div>
            <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block">Success Rate</span>
            <span className="font-zilla font-bold text-sm text-[#2F6845]">{agent.successRate}%</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block">Protected Vol</span>
            <span className="font-zilla font-bold text-sm text-[#1B1B18]">{agent.totalVolumeProtectedBNB} BNB</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block">Latency</span>
            <span className="font-zilla font-bold text-sm text-[#14213D]">{agent.avgExecutionLatencyMs}ms</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block">Fee Schedule</span>
            <span className="font-zilla font-bold text-xs text-[#1B1B18] truncate block" title={agent.feeSchedule}>
              {agent.feeSchedule}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5 font-plex-mono">
          {agent.tags.map((tag, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[#E0DBC9] text-[#4A4A43] border border-[#1B1B18]/20 font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-[#1B1B18]/20 font-plex-mono">
        <div className="flex items-center gap-2">
          
          {/* Hire Button */}
          <button
            onClick={() => onHire(agent)}
            className="btn-primary flex-1 justify-center text-xs py-2.5 font-semibold"
          >
            <span>Hire via Altana</span>
            <ArrowRight size={14} />
          </button>

          {/* Compare Toggle */}
          <button
            onClick={() => onCompare(agent)}
            className={`btn-secondary text-xs px-3 py-2.5 ${
              isCompared ? "border-[#2F6845] bg-[#2F6845]/15 text-[#2F6845]" : ""
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
            className="w-full py-1.5 px-3 rounded-[2px] bg-[#E0DBC9] hover:bg-[#EAE6D9] text-[#1B1B18] border border-[#1B1B18]/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Layers size={13} />
            <span>Launch PancakeSwap Terminal</span>
          </button>
        )}
      </div>
    </div>
  );
}
