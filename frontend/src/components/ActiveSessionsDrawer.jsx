import React, { useState, useEffect } from "react";
import {
  X, ShieldCheck, Clock, ExternalLink, RefreshCw,
  AlertOctagon, CheckCircle2, Plus, ChevronDown, ChevronUp,
  Activity
} from "lucide-react";
import { formatAddress, formatBscScanTxLink, formatCountdown, BSCSCAN_TESTNET_URL } from "../utils/web3";

export default function ActiveSessionsDrawer({
  isOpen,
  onClose,
  sessions,
  onRevokeSession,
  onExtendSession,
  onRefresh
}) {
  if (!isOpen) return null;

  const [revokingId, setRevokingId] = useState(null);
  const [extendingId, setExtendingId] = useState(null);
  const [extendHours, setExtendHours] = useState(24);
  const [extendCapBNB, setExtendCapBNB] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [, forceRefresh] = useState(0);

  // Real-time countdown refresh every 10s
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => forceRefresh((n) => n + 1), 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleRevoke = async (sessionId) => {
    setRevokingId(sessionId);
    try {
      await onRevokeSession(sessionId);
    } catch (err) {
      console.error("Revoke error:", err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleExtend = async (sessionId) => {
    setExtendingId(sessionId);
    try {
      await onExtendSession({ sessionId, additionalHours: extendHours, additionalCapBNB: extendCapBNB });
      setExpandedId(null);
    } catch (err) {
      console.error("Extend error:", err);
    } finally {
      setExtendingId(null);
    }
  };

  const calcProgress = (spent, cap) => {
    if (!cap || cap === 0) return 0;
    return Math.min((spent / cap) * 100, 100);
  };

  const getProgressColor = (pct) => {
    if (pct > 80) return "from-[#F6465D] to-[#F6465D]";
    if (pct > 50) return "from-[#F0B90B] to-[#FCD535]";
    return "from-[#0ECB81] to-[#00F0FF]";
  };

  const activeSessions = sessions.filter((s) => s.status === "active");
  const closedSessions = sessions.filter((s) => s.status !== "active");

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />

      <div className="drawer-panel">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0ECB81]/15 text-[#0ECB81] flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Altana Sessions</h2>
              <p className="text-xs text-gray-400">
                <span className="text-[#0ECB81] font-semibold">{activeSessions.length} active</span>
                {closedSessions.length > 0 && <span> · {closedSessions.length} closed</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              title="Sync from indexer"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {sessions.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-gray-500">
                <Clock size={24} />
              </div>
              <p className="text-sm font-semibold text-gray-300">No sessions yet</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Hire an agent to create a spend-capped, revocable session key.
              </p>
            </div>
          )}

          {/* Active Sessions */}
          {activeSessions.map((s) => {
            const progress = calcProgress(s.spentAmountBNB, s.spendCapBNB);
            const progressColor = getProgressColor(progress);
            const isExpanding = expandedId === s.sessionId;

            return (
              <div
                key={s.sessionId}
                className="bg-[#121826] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                {/* Session Card Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{s.agentName}</span>
                        <span className="badge badge-emerald text-[10px] flex items-center gap-1">
                          <span className="pulse-dot" /> Active
                        </span>
                        {s.source === "onchain" && (
                          <span className="badge badge-cyan text-[10px]">Onchain</span>
                        )}
                      </div>
                      <span className="mono text-[11px] text-gray-400">
                        {formatAddress(s.sessionId)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRevoke(s.sessionId)}
                      disabled={revokingId === s.sessionId}
                      className="btn-danger text-[11px] py-1.5 px-2.5 shrink-0"
                    >
                      <AlertOctagon size={12} />
                      <span>{revokingId === s.sessionId ? "Revoking…" : "Revoke"}</span>
                    </button>
                  </div>

                  {/* Spend Progress Bar */}
                  <div className="bg-[#07090E] p-3 rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Spend Allowance</span>
                      <span className="mono font-bold text-white">
                        {(s.spentAmountBNB || 0).toFixed(4)} / {s.spendCapBNB} tBNB
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-700 rounded-full`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>
                        {((s.spendCapBNB || 0) - (s.spentAmountBNB || 0)).toFixed(4)} tBNB left
                      </span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Expiry & Links Row */}
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#00F0FF]" />
                      <span className={s.expiresAt && (s.expiresAt - Date.now() / 1000) < 3600 ? "text-[#F0B90B]" : ""}>
                        {s.expiresAt ? formatCountdown(s.expiresAt) : "No expiry set"}
                      </span>
                    </div>
                    <a
                      href={formatBscScanTxLink(s.txHash || "0xabc")}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-[#F0B90B] flex items-center gap-1"
                    >
                      <span>BscScan</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  {/* Activity Log (last 1 entry preview) */}
                  {s.activityLog?.length > 0 && (
                    <div className="mt-3 text-[11px] bg-black/30 rounded-lg px-2.5 py-1.5 border border-white/5 flex items-center justify-between">
                      <span className="text-gray-400 truncate max-w-[220px]">
                        {s.activityLog[0].action}
                      </span>
                      {s.activityLog[0].amountBNB > 0 && (
                        <span className="mono text-[#F6465D] font-semibold shrink-0 ml-2">
                          -{s.activityLog[0].amountBNB} BNB
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Extend Session Accordion */}
                <div className="border-t border-white/5">
                  <button
                    onClick={() => setExpandedId(isExpanding ? null : s.sessionId)}
                    className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus size={13} className="text-[#F0B90B]" />
                      <span>Extend Session Duration / Cap</span>
                    </span>
                    {isExpanding ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanding && (
                    <div className="px-4 pb-4 space-y-3 bg-[#0D111A]/80 border-t border-white/5 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">
                            Additional Hours
                          </span>
                          <div className="flex gap-1">
                            {[1, 24, 168].map((h) => (
                              <button
                                key={h}
                                onClick={() => setExtendHours(h)}
                                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  extendHours === h
                                    ? "bg-[#F0B90B] text-black"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                                }`}
                              >
                                {h === 168 ? "7d" : `${h}h`}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">
                            Extra Cap (tBNB)
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={extendCapBNB}
                            onChange={(e) => setExtendCapBNB(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#07090E] border border-white/10 rounded-lg px-2 py-1 text-xs text-white mono"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleExtend(s.sessionId)}
                        disabled={extendingId === s.sessionId}
                        className="btn-secondary w-full justify-center text-xs py-2 border-[#F0B90B]/30 hover:border-[#F0B90B] text-[#F0B90B]"
                      >
                        {extendingId === s.sessionId ? "Extending…" : `Extend +${extendHours}h${extendCapBNB > 0 ? ` +${extendCapBNB} tBNB` : ""}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Closed Sessions */}
          {closedSessions.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Closed Sessions</p>
              {closedSessions.map((s) => (
                <div
                  key={s.sessionId}
                  className="p-3 rounded-xl bg-[#0B0D14]/70 border border-white/5 opacity-60 mb-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-300">{s.agentName}</span>
                    <span className={`badge ${s.status === "revoked" ? "badge-gray" : "badge-gray"} text-[10px]`}>
                      {s.status === "revoked" ? "Revoked" : "Expired"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-gray-500">
                    <span className="mono">{formatAddress(s.sessionId)}</span>
                    {s.revokeTxHash && (
                      <a
                        href={formatBscScanTxLink(s.revokeTxHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-white flex items-center gap-1"
                      >
                        <span>Revoke Tx</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#07090E]/80 text-[11px] text-gray-500 text-center">
          Revocation is immediate & verifiable on{" "}
          <a href={BSCSCAN_TESTNET_URL} target="_blank" rel="noreferrer" className="hover:text-[#F0B90B]">
            BscScan Testnet
          </a>
        </div>
      </div>
    </>
  );
}
