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
      <div className="modal-content max-w-4xl p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0B90B]/10 text-[#F0B90B] flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Side-by-Side Agent Comparison</h2>
              <p className="text-xs text-gray-400">Comparing ERC-8004 telemetry & execution parameters on BSC Testnet</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 px-4 text-gray-400 font-semibold w-1/3">Attribute</th>
                
                {/* Agent A Header */}
                <th className="py-4 px-4 bg-[#121826]/40 rounded-t-xl w-1/3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{agentA.icon}</span>
                    <span className="font-bold text-sm text-white">{agentA.name}</span>
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
                <th className="py-4 px-4 bg-[#121826]/80 rounded-t-xl w-1/3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{agentB.icon}</span>
                    <span className="font-bold text-sm text-white">{agentB.name}</span>
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

            <tbody className="divide-y divide-white/5">
              {comparisonAttributes.map((attr, index) => {
                const valA = attr.getVal(agentA);
                const valB = attr.getVal(agentB);

                return (
                  <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-gray-400 font-medium">{attr.label}</td>
                    
                    {/* Val A */}
                    <td className={`py-3 px-4 bg-[#121826]/20 ${attr.highlight ? "font-bold text-[#0ECB81]" : "text-gray-200"}`}>
                      {attr.isLink ? (
                        <a
                          href={formatBscScanAddressLink(agentA.contractAddress)}
                          target="_blank"
                          rel="noreferrer"
                          className="mono text-[#F0B90B] hover:underline"
                        >
                          {valA}
                        </a>
                      ) : attr.isBool ? (
                        <span className="inline-flex items-center gap-1 text-[#0ECB81] font-semibold">
                          <Check size={14} /> {valA}
                        </span>
                      ) : (
                        valA
                      )}
                    </td>

                    {/* Val B */}
                    <td className={`py-3 px-4 bg-[#121826]/40 ${attr.highlight ? "font-bold text-[#0ECB81]" : "text-gray-200"}`}>
                      {attr.isLink ? (
                        <a
                          href={formatBscScanAddressLink(agentB.contractAddress)}
                          target="_blank"
                          rel="noreferrer"
                          className="mono text-[#F0B90B] hover:underline"
                        >
                          {valB}
                        </a>
                      ) : attr.isBool ? (
                        <span className="inline-flex items-center gap-1 text-[#0ECB81] font-semibold">
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
        <div className="mt-6 p-3 rounded-xl bg-[#0D111A] border border-white/5 flex items-center justify-between text-xs text-gray-400">
          <span>All metrics indexed from BSC Testnet (Chain ID: 97) via Altana session logs.</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-semibold">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
