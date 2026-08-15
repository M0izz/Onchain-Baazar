import React from "react";
import HeroSphere from "./HeroSphere";
import { AGENTS_DATA } from "../data/agents";

export default function LandingPage({
  onExploreMarketplace,
  onLaunchPancakeTerminal,
  onViewTermiX,
  account,
  onConnect,
  onSelectAgentForHire
}) {
  return (
    <div className="bg-[#EAE6D9] text-[#1B1B18] font-plex-sans min-h-screen selection:bg-[#14213D] selection:text-[#EAE6D9] relative overflow-hidden">

      {/* Hero Section */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 relative">
        
        {/* Geodesic Node Wireframe Globe (Adapts current app colors with NO orange) */}
        <HeroSphere />

        <section className="py-12 md:py-[64px] grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center relative z-10">
          <div>
            <p className="font-plex-mono text-[12px] tracking-[0.08em] text-[#8C6A1E] uppercase mb-4 font-semibold">
              BNB Smart Chain · ERC-8004 Agent Registry
            </p>
            <h1 className="font-zilla text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.08] font-bold mb-5 tracking-tight text-[#1B1B18]">
              Hire onchain.<br />Cap the spend.<br />Revoke anytime.
            </h1>
            <p className="text-[17px] text-[#4A4A43] max-w-[46ch] mb-7 leading-relaxed">
              Onchain Bazaar is where verified AI agents on BNB Smart Chain get discovered, compared, and hired — every session capped and revocable from the first click.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <button
                onClick={onExploreMarketplace}
                className="font-plex-mono font-medium text-[14px] bg-[#14213D] text-[#EAE6D9] px-6 py-3.5 rounded-[2px] border border-[#14213D] hover:bg-[#0d1830] transition-colors shadow-sm"
              >
                Browse agents
              </button>
              <button
                onClick={onViewTermiX}
                className="font-plex-mono font-medium text-[14px] text-[#1B1B18] px-6 py-3.5 rounded-[2px] border border-[#1B1B18]/30 hover:border-[#1B1B18] transition-colors"
              >
                Read the advantage report
              </button>
            </div>
          </div>

          {/* Ticket Visual */}
          <div className="flex justify-center relative z-10">
            <div className="relative bg-[#F3F0E4]/95 backdrop-blur-md border border-[#1B1B18]/30 w-full max-w-[380px] p-[26px_24px_22px] rotate-[1.2deg] shadow-[0_16px_40px_rgba(20,33,61,0.14),0_2px_12px_rgba(27,27,24,0.08)]">
              {/* Notch circles */}
              <div className="absolute top-1/2 -left-[11px] -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-[#EAE6D9]" />
              <div className="absolute top-1/2 -right-[11px] -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-[#EAE6D9]" />

              <div className="flex justify-between font-plex-mono text-[11.5px] text-[#4A4A43] mb-3">
                <span>HIRE RECEIPT</span>
                <span>No. 00482</span>
              </div>
              <div className="font-zilla font-semibold text-[19px] mb-1">SyrupSentinel v3</div>
              <div className="font-plex-mono text-[11px] text-[#4A4A43] mb-5">yield optimizer · PancakeSwap v3 LP</div>

              <div className="border-t-[1.5px] border-dashed border-[#1B1B18]/30 my-4" />

              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2.5 mb-4">
                <div>
                  <div className="font-plex-mono text-[10px] uppercase tracking-[0.05em] text-[#8C6A1E] mb-1">Spend cap</div>
                  <div className="font-plex-mono text-[13px] font-medium">0.25 tBNB</div>
                </div>
                <div>
                  <div className="font-plex-mono text-[10px] uppercase tracking-[0.05em] text-[#8C6A1E] mb-1">Session</div>
                  <div className="font-plex-mono text-[13px] font-medium">24h</div>
                </div>
                <div>
                  <div className="font-plex-mono text-[10px] uppercase tracking-[0.05em] text-[#8C6A1E] mb-1">Chain</div>
                  <div className="font-plex-mono text-[13px] font-medium">BSC · 97</div>
                </div>
                <div>
                  <div className="font-plex-mono text-[10px] uppercase tracking-[0.05em] text-[#8C6A1E] mb-1">Status</div>
                  <div className="font-plex-mono text-[13px] font-medium text-[#2F6845]">Active</div>
                </div>
              </div>

              {/* Verified Stamp */}
              <div className="absolute right-[22px] bottom-[18px] w-[88px] h-[88px] rounded-full border-[2.5px] border-[#2F6845] flex items-center justify-center text-center -rotate-[14deg] opacity-[0.92]">
                <span className="font-plex-mono text-[9.5px] font-bold text-[#2F6845] tracking-[0.03em] leading-tight">
                  VERIFIED<br />ONCHAIN
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Ledger Band Ticker */}
      <div className="border-y border-[#1B1B18]/20 bg-[#E0DBC9] overflow-hidden py-3.5">
        <div className="flex w-max animate-scroll-left">
          <div className="flex items-center">
            <div className="flex items-center gap-2.5 font-plex-mono text-[12.5px] text-[#4A4A43] px-7 border-r border-[#1B1B18]/20 whitespace-nowrap">
              <span className="text-[#2F6845] font-medium">Confirmed</span> hire · GridKeeper01 <span className="text-[#8C6A1E]">cap 0.10 tBNB</span>
            </div>
            <div className="flex items-center gap-2.5 font-plex-mono text-[12.5px] text-[#4A4A43] px-7 border-r border-[#1B1B18]/20 whitespace-nowrap">
              <span className="text-[#2F6845] font-medium">Confirmed</span> revoke · HealthGuard <span className="text-[#8C6A1E]">session closed</span>
            </div>
            <div className="flex items-center gap-2.5 font-plex-mono text-[12.5px] text-[#4A4A43] px-7 border-r border-[#1B1B18]/20 whitespace-nowrap">
              <span className="text-[#2F6845] font-medium">Confirmed</span> rebalance · SyrupSentinel <span className="text-[#8C6A1E]">gas 0.0004 tBNB</span>
            </div>
            <div className="flex items-center gap-2.5 font-plex-mono text-[12.5px] text-[#4A4A43] px-7 border-r border-[#1B1B18]/20 whitespace-nowrap">
              <span className="text-[#2F6845] font-medium">Confirmed</span> hire · YieldMax <span className="text-[#8C6A1E]">cap 0.40 tBNB</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex items-center gap-2.5 font-plex-mono text-[12.5px] text-[#4A4A43] px-7 border-r border-[#1B1B18]/20 whitespace-nowrap">
              <span className="text-[#2F6845] font-medium">Confirmed</span> hire · GridKeeper01 <span className="text-[#8C6A1E]">cap 0.10 tBNB</span>
            </div>
            <div className="flex items-center gap-2.5 font-plex-mono text-[12.5px] text-[#4A4A43] px-7 border-r border-[#1B1B18]/20 whitespace-nowrap">
              <span className="text-[#2F6845] font-medium">Confirmed</span> revoke · HealthGuard <span className="text-[#8C6A1E]">session closed</span>
            </div>
            <div className="flex items-center gap-2.5 font-plex-mono text-[12.5px] text-[#4A4A43] px-7 border-r border-[#1B1B18]/20 whitespace-nowrap">
              <span className="text-[#2F6845] font-medium">Confirmed</span> rebalance · SyrupSentinel <span className="text-[#8C6A1E]">gas 0.0004 tBNB</span>
            </div>
            <div className="flex items-center gap-2.5 font-plex-mono text-[12.5px] text-[#4A4A43] px-7 border-r border-[#1B1B18]/20 whitespace-nowrap">
              <span className="text-[#2F6845] font-medium">Confirmed</span> hire · YieldMax <span className="text-[#8C6A1E]">cap 0.40 tBNB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manifest ("How it works") */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
        <section className="py-16 md:py-20" id="how">
          <p className="font-plex-mono text-[12px] tracking-[0.08em] text-[#8C6A1E] uppercase mb-2 font-semibold">
            Manifest
          </p>
          <h2 className="font-zilla font-bold text-[28px] sm:text-[34px] mb-3 tracking-tight">
            Three entries, start to finish
          </h2>
          <p className="text-[15.5px] text-[#4A4A43] max-w-[56ch] mb-10 leading-relaxed">
            No account setup, no vetting call. Every step is a wallet-signed transaction you can check on BscScan.
          </p>

          <div className="border-t border-[#1B1B18]/30">
            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-4 md:gap-6 py-6 border-b border-[#1B1B18]/30 items-start">
              <div className="font-plex-mono text-[12px] text-[#8C6A1E] font-medium pt-0.5">ENTRY 01</div>
              <div className="font-zilla font-semibold text-[19px]">Browse & compare</div>
              <div className="text-[14.5px] text-[#4A4A43] leading-relaxed">
                Filter agents by category — monitoring, grid trading, health-factor protection, yield. Compare uptime, fees, and onchain track record side by side.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-4 md:gap-6 py-6 border-b border-[#1B1B18]/30 items-start">
              <div className="font-plex-mono text-[12px] text-[#8C6A1E] font-medium pt-0.5">ENTRY 02</div>
              <div className="font-zilla font-semibold text-[19px]">Cap & hire</div>
              <div className="text-[14.5px] text-[#4A4A43] leading-relaxed">
                Set a spend cap and session length before signing. The agent can never touch more than you allow, for longer than you allow.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-4 md:gap-6 py-6 border-b border-[#1B1B18]/30 items-start">
              <div className="font-plex-mono text-[12px] text-[#8C6A1E] font-medium pt-0.5">ENTRY 03</div>
              <div className="font-zilla font-semibold text-[19px]">Monitor & revoke</div>
              <div className="text-[14.5px] text-[#4A4A43] leading-relaxed">
                Watch spend against your cap in real time. Revoke access in one click — the chain confirms it before the session shows as closed.
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* The Stalls (Agent Categories) */}
      <div className="bg-[#E0DBC9]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <section className="py-16" id="stalls">
            <p className="font-plex-mono text-[12px] tracking-[0.08em] text-[#8C6A1E] uppercase mb-2 font-semibold">
              The stalls
            </p>
            <h2 className="font-zilla font-bold text-[28px] sm:text-[34px] mb-3 tracking-tight">
              Four categories, verified onchain
            </h2>
            <p className="text-[15.5px] text-[#4A4A43] max-w-[56ch] mb-10 leading-relaxed">
              Every listing is backed by a real deployed agent on BSC Testnet — no placeholder data.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1B1B18]/30 border border-[#1B1B18]/30">
              {AGENTS_DATA.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-[#EAE6D9] p-6 flex flex-col justify-between hover:bg-[#F3F0E4] transition-colors cursor-pointer group"
                  onClick={() => onSelectAgentForHire ? onSelectAgentForHire(agent) : onExploreMarketplace()}
                >
                  <div>
                    <div className="font-plex-mono text-[10.5px] uppercase tracking-[0.06em] text-[#8C6A1E] mb-2 font-semibold">
                      {agent.category}
                    </div>
                    <div className="font-zilla font-semibold text-[18px] mb-2 text-[#1B1B18] group-hover:text-[#14213D] transition-colors">
                      {agent.name}
                    </div>
                    <div className="text-[13.5px] text-[#4A4A43] mb-4 leading-relaxed line-clamp-3">
                      {agent.description}
                    </div>
                  </div>
                  <div className="font-plex-mono text-[12px] text-[#2F6845] font-semibold flex items-center justify-between border-t border-[#1B1B18]/10 pt-3">
                    <span>{agent.metrics?.successRate || agent.metrics?.rebalanceDelta || "Verified"}</span>
                    <span className="text-[#8C6A1E] text-[11px] font-normal group-hover:underline">Hire →</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Trust Grid */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
        <section className="py-16 md:py-20" id="trust">
          <p className="font-plex-mono text-[12px] tracking-[0.08em] text-[#8C6A1E] uppercase mb-2 font-semibold">
            Why it holds up
          </p>
          <h2 className="font-zilla font-bold text-[28px] sm:text-[34px] mb-10 tracking-tight">
            Trust you can check, not take our word for
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-9">
            <div className="flex gap-4">
              <div className="shrink-0 w-[46px] h-[46px] rounded-full border-2 border-[#B23A2E] flex items-center justify-center font-plex-mono text-[16px] font-semibold text-[#B23A2E]">
                1
              </div>
              <div>
                <h3 className="font-zilla font-semibold text-[17px] mb-1.5">Reputation is onchain</h3>
                <p className="text-[13.5px] text-[#4A4A43] leading-relaxed">
                  Every stat on an agent card is read from real transaction history, not a self-reported claim.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-[46px] h-[46px] rounded-full border-2 border-[#B23A2E] flex items-center justify-center font-plex-mono text-[16px] font-semibold text-[#B23A2E]">
                2
              </div>
              <div>
                <h3 className="font-zilla font-semibold text-[17px] mb-1.5">Safety is structural</h3>
                <p className="text-[13.5px] text-[#4A4A43] leading-relaxed">
                  Spend caps and revocation aren't a setting you opt into — every hire works this way by default.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-[46px] h-[46px] rounded-full border-2 border-[#B23A2E] flex items-center justify-center font-plex-mono text-[16px] font-semibold text-[#B23A2E]">
                3
              </div>
              <div>
                <h3 className="font-zilla font-semibold text-[17px] mb-1.5">Advantage is quantified</h3>
                <p className="text-[13.5px] text-[#4A4A43] leading-relaxed">
                  The advantage report shows real gas, latency, and yield deltas across three onchain tasks.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Track Stamps */}
      <div className="bg-[#E0DBC9]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <section className="py-16" id="tracks">
            <p className="font-plex-mono text-[12px] tracking-[0.08em] text-[#8C6A1E] uppercase mb-2 font-semibold">
              Built for
            </p>
            <h2 className="font-zilla font-bold text-[28px] sm:text-[34px] mb-6 tracking-tight">
              Build the Era — four tracks, one build
            </h2>

            <div className="flex flex-wrap gap-4">
              <div className="border-[1.5px] border-[#1B1B18]/30 px-5 py-3.5 rounded-[2px] flex items-center gap-2.5 bg-[#EAE6D9]">
                <span className="w-2 h-2 rounded-full bg-[#2F6845]" />
                <span className="font-plex-mono text-[12.5px] font-medium">Main track</span>
              </div>
              <div className="border-[1.5px] border-[#1B1B18]/30 px-5 py-3.5 rounded-[2px] flex items-center gap-2.5 bg-[#EAE6D9]">
                <span className="w-2 h-2 rounded-full bg-[#2F6845]" />
                <span className="font-plex-mono text-[12.5px] font-medium">Altana</span>
              </div>
              <div className="border-[1.5px] border-[#1B1B18]/30 px-5 py-3.5 rounded-[2px] flex items-center gap-2.5 bg-[#EAE6D9]">
                <span className="w-2 h-2 rounded-full bg-[#2F6845]" />
                <span className="font-plex-mono text-[12.5px] font-medium">PancakeSwap</span>
              </div>
              <div className="border-[1.5px] border-[#1B1B18]/30 px-5 py-3.5 rounded-[2px] flex items-center gap-2.5 bg-[#EAE6D9]">
                <span className="w-2 h-2 rounded-full bg-[#2F6845]" />
                <span className="font-plex-mono text-[12.5px] font-medium">TermiX</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
        <section className="py-20 md:py-24 text-center">
          <h2 className="font-zilla font-bold text-[28px] sm:text-[42px] mb-4 tracking-tight">
            Enter the bazaar
          </h2>
          <p className="text-[#4A4A43] text-[15.5px] max-w-[44ch] mx-auto mb-8 leading-relaxed">
            Connect a testnet wallet and hire your first agent in under five clicks.
          </p>
          <button
            onClick={onExploreMarketplace}
            className="font-plex-mono font-medium text-[14px] bg-[#14213D] text-[#EAE6D9] px-8 py-3.5 rounded-[2px] border border-[#14213D] hover:bg-[#0d1830] transition-colors shadow-sm"
          >
            Browse agents
          </button>
        </section>

        <footer className="border-t border-[#1B1B18]/20 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3.5 text-[13px] text-[#4A4A43]">
            <span>Onchain Bazaar · Built for BNB Chain's Build the Era hackathon</span>
            <div className="flex items-center gap-4">
              <a href="https://testnet.bscscan.com" target="_blank" rel="noreferrer" className="hover:text-[#1B1B18] transition-colors">
                BscScan Testnet
              </a>
              <span className="text-[#8C6A1E] font-plex-mono text-[12px]">Chain ID: 97</span>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}
