import React, { useState } from "react";
import { X, ShieldCheck, Key, Lock, Clock, DollarSign, CheckCircle2, ArrowRight, ExternalLink, AlertTriangle } from "lucide-react";
import { formatAddress, formatBscScanAddressLink, formatBscScanTxLink } from "../utils/web3";

export default function HireModal({
  isOpen,
  onClose,
  agent,
  account,
  onConfirmHire,
  isDevMode
}) {
  if (!isOpen || !agent) return null;

  const [spendCap, setSpendCap] = useState("0.05");
  const [durationHours, setDurationHours] = useState(24);
  const [step, setStep] = useState(1); // 1: Config, 2: Signing, 3: Success
  const [txReceipt, setTxReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const SPEND_CAP_PRESETS = ["0.01", "0.05", "0.1", "0.5"];
  const DURATION_PRESETS = [
    { label: "1 Hour", value: 1 },
    { label: "24 Hours", value: 24 },
    { label: "7 Days", value: 168 },
  ];

  const handleHireSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    setStep(2);

    try {
      const result = await onConfirmHire({
        agentId: agent.id,
        agentName: agent.name,
        agentContract: agent.contractAddress,
        spendCapBNB: parseFloat(spendCap),
        durationHours: durationHours,
      });

      setTxReceipt(result);
      setStep(3);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create Altana session onchain");
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setTxReceipt(null);
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[#121826] border border-white/10"
              style={{ color: agent.color }}
            >
              {agent.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Hire {agent.name}</h2>
                <span className="badge badge-emerald text-[10px]">Altana Protected</span>
              </div>
              <p className="text-xs text-gray-400">Cryptographically spend-capped agent session</p>
            </div>
          </div>

          <button
            onClick={resetModal}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step 1: Configuration Form */}
        {step === 1 && (
          <div className="space-y-6">
            
            {/* Safety Guarantee Notice */}
            <div className="p-3.5 rounded-xl bg-[#0ECB81]/10 border border-[#0ECB81]/30 flex items-start gap-3">
              <ShieldCheck className="text-[#0ECB81] shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-white font-semibold block mb-0.5">Altana Non-Custodial Guarantee</strong>
                The agent cannot exceed your spend cap or execute outside whitelist permissions. You retain 1-click emergency revocation at all times.
              </div>
            </div>

            {/* Spend Cap Setting */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-[#F0B90B]" />
                  <span>Maximum Spend Cap (tBNB)</span>
                </label>
                <span className="text-xs text-gray-400">Hard onchain ceiling</span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-2">
                {SPEND_CAP_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSpendCap(preset)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      spendCap === preset
                        ? "bg-[#F0B90B] text-black shadow-md shadow-[#F0B90B]/20"
                        : "bg-[#121826] text-gray-300 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    {preset} tBNB
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={spendCap}
                  onChange={(e) => setSpendCap(e.target.value)}
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#F0B90B]"
                  placeholder="Custom spend cap in tBNB"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                  tBNB
                </span>
              </div>
            </div>

            {/* Session Expiry Duration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-[#00F0FF]" />
                  <span>Session Duration</span>
                </label>
                <span className="text-xs text-gray-400">Auto-expires after time</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDurationHours(d.value)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      durationHours === d.value
                        ? "bg-[#00F0FF] text-black shadow-md shadow-[#00F0FF]/20"
                        : "bg-[#121826] text-gray-300 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Contract Whitelist summary */}
            <div className="bg-[#07090E]/80 p-3 rounded-xl border border-white/5 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-gray-400">
                <span>Agent Contract:</span>
                <span className="mono text-white font-medium">{formatAddress(agent.contractAddress)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Session Policy:</span>
                <span className="text-[#0ECB81] font-semibold">Strict Spend Cap + Nonce Check</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Network:</span>
                <span className="text-white">BNB Smart Chain Testnet (97)</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleHireSubmit}
              disabled={isSubmitting || !spendCap || parseFloat(spendCap) <= 0}
              className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-gold disabled:opacity-50"
            >
              <span>Authorize Altana Session & Sign</span>
              <ArrowRight size={16} />
            </button>

          </div>
        )}

        {/* Step 2: Signing / In Progress */}
        {step === 2 && (
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F0B90B]/10 text-[#F0B90B] border border-[#F0B90B]/30 flex items-center justify-center mx-auto animate-spin">
              <Key size={28} />
            </div>
            <h3 className="text-lg font-bold text-white">Signing Altana Session Key</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Please confirm the transaction in your connected wallet to register the spend cap and expiry on BSC Testnet.
            </p>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && txReceipt && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-white">Session Activated!</h3>
              <p className="text-xs text-gray-300 max-w-sm mx-auto">
                {agent.name} is now authorized to execute tasks up to <strong>{spendCap} tBNB</strong> over the next <strong>{durationHours} hours</strong>.
              </p>
            </div>

            {/* Tx Details Card */}
            <div className="bg-[#07090E] p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-400">
                <span>Session ID:</span>
                <span className="mono text-white">{formatAddress(txReceipt.session?.sessionId || "0x9f4a...b321")}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Spend Cap:</span>
                <span className="font-bold text-[#F0B90B]">{spendCap} tBNB</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Transaction Hash:</span>
                <a
                  href={formatBscScanTxLink(txReceipt.session?.txHash || "0xabc")}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-[#00F0FF] hover:underline flex items-center gap-1"
                >
                  <span>{formatAddress(txReceipt.session?.txHash || "0x1234567890abcdef")}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <button
              onClick={resetModal}
              className="btn-primary w-full justify-center py-2.5 text-xs font-bold"
            >
              View in Active Sessions Drawer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
