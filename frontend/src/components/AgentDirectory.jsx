import React, { useState, useMemo } from "react";
import { Search, Filter, Sliders, Shield, Zap, Sparkles, TrendingUp, Cpu } from "lucide-react";
import AgentCard from "./AgentCard";
import { CATEGORIES } from "../data/agents";

export default function AgentDirectory({
  agents,
  onHireAgent,
  comparedAgents,
  onToggleCompare,
  onOpenCompareModal,
  onLaunchPancakeTerminal,
  stats
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("reputation");

  const filteredAgents = useMemo(() => {
    return agents
      .filter((agent) => {
        const matchesCategory =
          selectedCategory === "All" || agent.category === selectedCategory;
        const matchesSearch =
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "reputation") return b.safetyScore - a.safetyScore;
        if (sortBy === "volume") return b.totalVolumeProtectedBNB - a.totalVolumeProtectedBNB;
        if (sortBy === "latency") return a.avgExecutionLatencyMs - b.avgExecutionLatencyMs;
        if (sortBy === "success") return b.successRate - a.successRate;
        return 0;
      });
  }, [agents, selectedCategory, searchQuery, sortBy]);

  return (
    <section className="py-8 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 text-[#1B1B18]">
      
      {/* Hero Protocol Banner */}
      <div className="relative rounded-[2px] p-6 sm:p-8 mb-10 overflow-hidden border border-[#1B1B18]/30 bg-[#E0DBC9]">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] bg-[#EAE6D9] border border-[#1B1B18]/20 text-[#8C6A1E] text-xs font-plex-mono font-semibold mb-4">
              <Sparkles size={14} />
              <span>BNB Smart Chain AI Agent Marketplace</span>
            </div>
            <h1 className="font-zilla text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1B1B18] tracking-tight mb-4 leading-tight">
              Provable Trust.<br />
              <span className="text-[#8C6A1E]">
                Spend-Capped AI Execution.
              </span>
            </h1>
            <p className="text-[#4A4A43] text-sm sm:text-base leading-relaxed mb-6 font-plex-sans">
              Discover, compare, and delegate tasks to verified ERC-8004 AI agents. Every interaction runs through an <strong className="text-[#1B1B18]">Altana spend-capped session</strong> with 1-click onchain emergency revocation.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <div className="p-4 rounded-[2px] bg-[#EAE6D9] border border-[#1B1B18]/20 font-plex-mono">
              <div className="flex items-center gap-2 text-[#2F6845] mb-1">
                <Shield size={16} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C6A1E]">Volume Protected</span>
              </div>
              <p className="font-zilla text-2xl font-bold text-[#1B1B18]">{stats?.totalVolumeProtectedBNB || "5,738"} BNB</p>
              <span className="text-[11px] text-[#4A4A43]">Across reference agents</span>
            </div>

            <div className="p-4 rounded-[2px] bg-[#EAE6D9] border border-[#1B1B18]/20 font-plex-mono">
              <div className="flex items-center gap-2 text-[#8C6A1E] mb-1">
                <Zap size={16} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C6A1E]">Gas Saved</span>
              </div>
              <p className="font-zilla text-2xl font-bold text-[#8C6A1E]">{stats?.totalGasSavedBNB || "113.4"} BNB</p>
              <span className="text-[11px] text-[#4A4A43]">Batching & smart routing</span>
            </div>

            <div className="p-4 rounded-[2px] bg-[#EAE6D9] border border-[#1B1B18]/20 font-plex-mono">
              <div className="flex items-center gap-2 text-[#14213D] mb-1">
                <Cpu size={16} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C6A1E]">Tasks Executed</span>
              </div>
              <p className="font-zilla text-2xl font-bold text-[#1B1B18]">{stats?.totalAgentTasksExecuted || "9,862"}</p>
              <span className="text-[11px] text-[#4A4A43]">99.4% success rate</span>
            </div>

            <div className="p-4 rounded-[2px] bg-[#EAE6D9] border border-[#1B1B18]/20 font-plex-mono">
              <div className="flex items-center gap-2 text-[#2F6845] mb-1">
                <TrendingUp size={16} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C6A1E]">Altana Sessions</span>
              </div>
              <p className="font-zilla text-2xl font-bold text-[#2F6845]">100% Capped</p>
              <span className="text-[11px] text-[#4A4A43]">Zero unconstrained keys</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Comparison Tray */}
      {comparedAgents.length > 0 && (
        <div className="sticky top-20 z-40 mb-6 p-4 rounded-[2px] bg-[#E0DBC9] border border-[#1B1B18]/40 shadow-md flex items-center justify-between gap-4 font-plex-mono">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full border border-[#2F6845] text-[#2F6845] flex items-center justify-center font-bold text-xs">
              {comparedAgents.length}
            </span>
            <div>
              <p className="text-xs font-bold text-[#1B1B18]">
                {comparedAgents.length === 1 ? "1 Agent Selected for Comparison" : "2 Agents Ready to Compare"}
              </p>
              <p className="text-[11px] text-[#4A4A43]">
                {comparedAgents.map((a) => a.name).join(" vs ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {comparedAgents.length === 2 && (
              <button
                onClick={onOpenCompareModal}
                className="btn-primary text-xs py-2 px-4"
              >
                <span>Compare Side-by-Side</span>
                <Sliders size={14} />
              </button>
            )}
            <button
              onClick={() => onToggleCompare(null, true)}
              className="text-xs text-[#4A4A43] hover:text-[#1B1B18] px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none font-plex-mono">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-[2px] text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#14213D] text-[#EAE6D9] shadow-sm"
                  : "bg-[#E0DBC9] text-[#4A4A43] hover:text-[#1B1B18] border border-[#1B1B18]/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto font-plex-mono">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A43]" />
            <input
              type="text"
              placeholder="Search by name, tag, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#EAE6D9] border border-[#1B1B18]/30 rounded-[2px] pl-9 pr-3 py-2 text-xs text-[#1B1B18] placeholder-[#4A4A43] focus:outline-none focus:border-[#14213D]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#EAE6D9] border border-[#1B1B18]/30 rounded-[2px] px-3 py-2 text-xs text-[#1B1B18] focus:outline-none focus:border-[#14213D]"
          >
            <option value="reputation">Sort: Safety Score</option>
            <option value="volume">Sort: Volume Protected</option>
            <option value="latency">Sort: Lowest Latency</option>
            <option value="success">Sort: Success Rate</option>
          </select>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="agents-grid">
        {filteredAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onHire={onHireAgent}
            onCompare={() => onToggleCompare(agent)}
            isCompared={comparedAgents.some((a) => a.id === agent.id)}
            onLaunchTerminal={agent.pancakeTrack ? onLaunchPancakeTerminal : undefined}
          />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="glass-panel p-12 text-center my-8">
          <p className="text-[#4A4A43] text-sm">No AI agents found matching your query.</p>
        </div>
      )}

    </section>
  );
}
