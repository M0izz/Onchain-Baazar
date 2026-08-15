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
    <section className="py-8 max-w-7xl mx-auto px-4 lg:px-8">
      
      {/* Hero Protocol Banner */}
      <div className="relative rounded-3xl p-8 mb-10 overflow-hidden border border-white/10 bg-gradient-to-b from-[#121826]/90 to-[#07090E]/90 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F0B90B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#0ECB81]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-[#F0B90B] text-xs font-bold mb-4">
              <Sparkles size={14} />
              <span>BNB Smart Chain AI Agent Marketplace</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Provable Trust. <br />
              <span className="bg-gradient-to-r from-[#F0B90B] via-[#FCD535] to-[#0ECB81] bg-clip-text text-transparent">
                Spend-Capped AI Execution.
              </span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6">
              Discover, compare, and delegate tasks to verified ERC-8004 AI agents. Every interaction runs through an <strong>Altana spend-capped session</strong> with 1-click onchain emergency revocation.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <div className="glass-panel p-4 rounded-2xl bg-[#0D111A]/80 border-white/5">
              <div className="flex items-center gap-2 text-[#0ECB81] mb-1">
                <Shield size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Volume Protected</span>
              </div>
              <p className="font-display text-2xl font-bold text-white">{stats?.totalVolumeProtectedBNB || "5,738"} BNB</p>
              <span className="text-[11px] text-gray-500">Across 4 reference agents</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl bg-[#0D111A]/80 border-white/5">
              <div className="flex items-center gap-2 text-[#F0B90B] mb-1">
                <Zap size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Gas Saved</span>
              </div>
              <p className="font-display text-2xl font-bold text-[#F0B90B]">{stats?.totalGasSavedBNB || "113.4"} BNB</p>
              <span className="text-[11px] text-gray-500">Via batching & smart routing</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl bg-[#0D111A]/80 border-white/5">
              <div className="flex items-center gap-2 text-[#00F0FF] mb-1">
                <Cpu size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tasks Executed</span>
              </div>
              <p className="font-display text-2xl font-bold text-white">{stats?.totalAgentTasksExecuted || "9,862"}</p>
              <span className="text-[11px] text-gray-500">99.4% aggregate success rate</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl bg-[#0D111A]/80 border-white/5">
              <div className="flex items-center gap-2 text-[#F0B90B] mb-1">
                <TrendingUp size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Altana Sessions</span>
              </div>
              <p className="font-display text-2xl font-bold text-[#0ECB81]">100% Capped</p>
              <span className="text-[11px] text-gray-500">Zero unconstrained keys</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Comparison Tray (Sticky when 2 agents selected) */}
      {comparedAgents.length > 0 && (
        <div className="sticky top-20 z-40 mb-6 p-4 rounded-2xl bg-[#121826]/95 border border-[#0ECB81]/40 shadow-xl shadow-[#0ECB81]/10 backdrop-blur-md flex items-center justify-between gap-4 animate-slideUp">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#0ECB81]/20 text-[#0ECB81] flex items-center justify-center font-bold text-sm">
              {comparedAgents.length}
            </span>
            <div>
              <p className="text-xs font-bold text-white">
                {comparedAgents.length === 1 ? "1 Agent Selected for Comparison" : "2 Agents Ready to Compare"}
              </p>
              <p className="text-[11px] text-gray-400">
                {comparedAgents.map((a) => a.name).join(" vs ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {comparedAgents.length === 2 && (
              <button
                onClick={onOpenCompareModal}
                className="btn-primary text-xs py-2 px-4 shadow-emerald"
              >
                <span>Compare Side-by-Side</span>
                <Sliders size={14} />
              </button>
            )}
            <button
              onClick={() => onToggleCompare(null, true)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#F0B90B] text-black shadow-md shadow-[#F0B90B]/20"
                  : "bg-[#121826]/70 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, tag, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121826]/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F0B90B]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#121826]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#F0B90B]"
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
          <p className="text-gray-400 text-sm">No AI agents found matching your query.</p>
        </div>
      )}

    </section>
  );
}
