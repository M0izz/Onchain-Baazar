import React from "react";
import { X, Check, ShieldCheck, Zap, Sliders, ArrowRight } from "lucide-react";
import { formatAddress, formatBscScanAddressLink } from "../utils/web3";

export default function AgentCompareModal({
  isOpen,
  onClose,
  agents,
  onHire
}) {
  if (!isOpen || agents.length < 2) return null;

  const [agentA, agentB] = agents;

  const comparisonAttributes = [
    { label: "Category", getVal: (a) => a.category },
    { label: "Safety Score", getVal: (a) => `${a.safetyScore} / 100`, highlight: true },
    { label: "Success Rate", getVal: (a) => `${a.successRate}%`, highlight: true },
    { label: "Historical Uptime", getVal: (a) => `${a.uptimePercent}%` },
    { label: "Execution Latency", getVal: (a) => `${a.avgExecutionLatencyMs} ms`, highlight: true },
    { label: "Volume Protected", getVal: (a) => `${a.totalVolumeProtectedBNB} BNB` },
    { label: "Gas Saved", getVal: (a) => `${a.gasSavedBNB} BNB` },
    { label: "Fee Schedule", getVal: (a) => a.feeSchedule },
    { label: "Altana Spend Cap Enforced", getVal: () => "Yes (Cryptographic Onchain)", isBool: true },
    { label: "1-Click Emergency Revocation", getVal: () => "Supported", isBool: true },
    { label: "Contract Address", getVal: (a) => formatAddress(a.contractAddress), isLink: true },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl p-6 relative bg-[#F3F0E4] border border-[#1B1B18]/30 rounded-[2px] text-[#1B1B18]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1B1B18]/20 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-[#1B1B18]/30 bg-[#EAE6D9] text-[#14213D] flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="font-zilla text-xl font-bold text-[#1B1B18]">Side-by-Side Agent Comparison</h2>
              <p className="text-xs text-[#4A4A43] font-plex-sans">Comparing ERC-8004 telemetry & execution parameters on BSC Testnet</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[2px] bg-[#E0DBC9] hover:bg-[#EAE6D9] flex items-center justify-center text-[#4A4A43] hover:text-[#1B1B18] border border-[#1B1B18]/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto font-plex-mono">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1B1B18]/30">
                <th className="py-4 px-4 text-[#4A4A43] font-semibold w-1/3">Attribute</th>
                
                {/* Agent A Header */}
                <th className="py-4 px-4 bg-[#EAE6D9] rounded-t-[2px] w-1/3 border-x border-[#1B1B18]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-zilla font-bold text-base text-[#1B1B18]">{agentA.name}</span>
                  </div>
                  <button
                    onClick={() => { onClose(); onHire(agentA); }}
                    className="btn-primary text-[11px] py-1.5 px-3 w-full justify-center"
                  >
                    <span>Hire {agentA.name}</span>
                    <ArrowRight size={12} />
                  </button>
                </th>

                {/* Agent B Header */}
                <th className="py-4 px-4 bg-[#E0DBC9] rounded-t-[2px] w-1/3 border-r border-[#1B1B18]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-zilla font-bold text-base text-[#1B1B18]">{agentB.name}</span>
                  </div>
                  <button
                    onClick={() => { onClose(); onHire(agentB); }}
                    className="btn-primary text-[11px] py-1.5 px-3 w-full justify-center"
                  >
                    <span>Hire {agentB.name}</span>
                    <ArrowRight size={12} />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1B1B18]/15">
              {comparisonAttributes.map((attr, index) => {
                const valA = attr.getVal(agentA);
                const valB = attr.getVal(agentB);

                return (
                  <tr key={index} className="hover:bg-black/5 transition-colors">
                    <td className="py-3 px-4 text-[#4A4A43] font-medium">{attr.label}</td>
                    
                    {/* Val A */}
                    <td className={`py-3 px-4 bg-[#EAE6D9]/70 border-x border-[#1B1B18]/10 ${attr.highlight ? "font-bold text-[#2F6845]" : "text-[#1B1B18]"}`}>
                      {attr.isLink ? (
                        <a
                          href={formatBscScanAddressLink(agentA.contractAddress)}
                          target="_blank"
                          rel="noreferrer"
                          className="mono text-[#14213D] hover:underline"
                        >
                          {valA}
                        </a>
                      ) : attr.isBool ? (
                        <span className="inline-flex items-center gap-1 text-[#2F6845] font-semibold">
                          <Check size={14} /> {valA}
                        </span>
                      ) : (
                        valA
                      )}
                    </td>

                    {/* Val B */}
                    <td className={`py-3 px-4 bg-[#E0DBC9]/70 border-r border-[#1B1B18]/10 ${attr.highlight ? "font-bold text-[#2F6845]" : "text-[#1B1B18]"}`}>
                      {attr.isLink ? (
                        <a
                          href={formatBscScanAddressLink(agentB.contractAddress)}
                          target="_blank"
                          rel="noreferrer"
                          className="mono text-[#14213D] hover:underline"
                        >
                          {valB}
                        </a>
                      ) : attr.isBool ? (
                        <span className="inline-flex items-center gap-1 text-[#2F6845] font-semibold">
                          <Check size={14} /> {valB}
                        </span>
                      ) : (
                        valB
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-3 rounded-[2px] bg-[#EAE6D9] border border-[#1B1B18]/20 flex items-center justify-between text-xs text-[#4A4A43] font-plex-mono">
          <span>All metrics indexed from BSC Testnet (Chain ID: 97) via Altana session logs.</span>
          <button onClick={onClose} className="text-[#1B1B18] hover:underline font-semibold">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
