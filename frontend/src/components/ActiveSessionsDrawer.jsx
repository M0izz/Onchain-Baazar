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

  // Real-time countdown refresh every 1s
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => forceRefresh((n) => n + 1), 1000);
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

      <div className="drawer-panel bg-[#F3F0E4] border-l border-[#1B1B18]/30 text-[#1B1B18]">
        {/* Header */}
        <div className="p-5 border-b border-[#1B1B18]/20 bg-[#EAE6D9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#1B1B18]/30 bg-[#F3F0E4] text-[#2F6845] flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="font-zilla text-lg font-bold text-[#1B1B18]">Altana Sessions</h2>
              <p className="text-xs text-[#4A4A43] font-plex-sans">
                <span className="text-[#2F6845] font-semibold">{activeSessions.length} active</span>
                {closedSessions.length > 0 && <span> · {closedSessions.length} closed</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="w-8 h-8 rounded-[2px] bg-[#E0DBC9] hover:bg-[#EAE6D9] flex items-center justify-center text-[#4A4A43] hover:text-[#1B1B18] border border-[#1B1B18]/20 transition-colors"
              title="Sync from indexer"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[2px] bg-[#E0DBC9] hover:bg-[#EAE6D9] flex items-center justify-center text-[#4A4A43] hover:text-[#1B1B18] border border-[#1B1B18]/20"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-plex-mono">
          {sessions.length === 0 && (
            <div className="py-16 text-center space-y-3 font-plex-sans">
              <div className="w-12 h-12 rounded-full border border-[#1B1B18]/30 bg-[#EAE6D9] flex items-center justify-center mx-auto text-[#4A4A43]">
                <Clock size={24} />
              </div>
              <p className="text-sm font-semibold text-[#1B1B18]">No sessions yet</p>
              <p className="text-xs text-[#4A4A43] max-w-xs mx-auto">
                Hire an agent to create a spend-capped, revocable session key.
              </p>
            </div>
          )}

          {/* Active Sessions */}
          {activeSessions.map((s) => {
            const progress = calcProgress(s.spentAmountBNB, s.spendCapBNB);
            const isExpanding = expandedId === s.sessionId;

            return (
              <div
                key={s.sessionId}
                className="bg-[#EAE6D9] border border-[#1B1B18]/30 rounded-[2px] overflow-hidden shadow-sm transition-all"
              >
                {/* Session Card Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-zilla font-bold text-base text-[#1B1B18]">{s.agentName}</span>
                        <span className="badge badge-emerald text-[10px] flex items-center gap-1">
                          <span className="pulse-dot" /> Active
                        </span>
                        {s.source === "onchain" && (
                          <span className="badge badge-cyan text-[10px]">Onchain</span>
                        )}
                      </div>
                      <span className="mono text-[11px] text-[#4A4A43]">
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
                  <div className="bg-[#F3F0E4] p-3 rounded-[2px] border border-[#1B1B18]/20 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#4A4A43]">Spend Allowance</span>
                      <span className="mono font-bold text-[#1B1B18]">
                        {(s.spentAmountBNB || 0).toFixed(4)} / {s.spendCapBNB} tBNB
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1B1B18]/10 overflow-hidden">
                      <div
                        className="h-full bg-[#14213D] transition-all duration-700 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#4A4A43]">
                      <span>
                        {((s.spendCapBNB || 0) - (s.spentAmountBNB || 0)).toFixed(4)} tBNB left
                      </span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Expiry & Links Row */}
                  <div className="flex items-center justify-between mt-3 text-xs text-[#4A4A43]">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#14213D]" />
                      <span className={s.expiresAt && (s.expiresAt - Date.now() / 1000) < 3600 ? "text-[#B23A2E] font-bold" : ""}>
                        {s.expiresAt ? formatCountdown(s.expiresAt) : "No expiry set"}
                      </span>
                    </div>
                    <a
                      href={formatBscScanTxLink(s.txHash || "0xabc")}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#4A4A43] hover:text-[#1B1B18] flex items-center gap-1"
                    >
                      <span>BscScan</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  {/* Activity Log (last 1 entry preview) */}
                  {s.activityLog?.length > 0 && (
                    <div className="mt-3 text-[11px] bg-[#E0DBC9] rounded-[2px] px-2.5 py-1.5 border border-[#1B1B18]/20 flex items-center justify-between">
                      <span className="text-[#4A4A43] truncate max-w-[220px]">
                        {s.activityLog[0].action}
                      </span>
                      {s.activityLog[0].amountBNB > 0 && (
                        <span className="mono text-[#B23A2E] font-semibold shrink-0 ml-2">
                          -{s.activityLog[0].amountBNB} BNB
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Extend Session Accordion */}
                <div className="border-t border-[#1B1B18]/20">
                  <button
                    onClick={() => setExpandedId(isExpanding ? null : s.sessionId)}
                    className="w-full flex items-center justify-between px-4 py-2 text-xs text-[#4A4A43] hover:text-[#1B1B18] hover:bg-black/5 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus size={13} className="text-[#8C6A1E]" />
                      <span>Extend Session Duration / Cap</span>
                    </span>
                    {isExpanding ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanding && (
                    <div className="px-4 pb-4 space-y-3 bg-[#E0DBC9] border-t border-[#1B1B18]/20 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block mb-1">
                            Additional Hours
                          </span>
                          <div className="flex gap-1">
                            {[1, 24, 168].map((h) => (
                              <button
                                key={h}
                                onClick={() => setExtendHours(h)}
                                className={`flex-1 py-1 rounded-[2px] text-[11px] font-bold transition-all ${
                                  extendHours === h
                                    ? "bg-[#14213D] text-[#EAE6D9]"
                                    : "bg-[#EAE6D9] text-[#1B1B18] border border-[#1B1B18]/20 hover:bg-[#F3F0E4]"
                                }`}
                              >
                                {h === 168 ? "7d" : `${h}h`}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8C6A1E] uppercase font-semibold block mb-1">
                            Extra Cap (tBNB)
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={extendCapBNB}
                            onChange={(e) => setExtendCapBNB(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#EAE6D9] border border-[#1B1B18]/30 rounded-[2px] px-2 py-1 text-xs text-[#1B1B18] mono"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleExtend(s.sessionId)}
                        disabled={extendingId === s.sessionId}
                        className="btn-secondary w-full justify-center text-xs py-2 border-[#1B1B18]/30 hover:border-[#1B1B18] text-[#1B1B18]"
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
            <div className="pt-2 font-plex-mono">
              <p className="text-[10px] text-[#8C6A1E] uppercase font-semibold mb-2">Closed Sessions</p>
              {closedSessions.map((s) => (
                <div
                  key={s.sessionId}
                  className="p-3 rounded-[2px] bg-[#E0DBC9]/60 border border-[#1B1B18]/15 opacity-70 mb-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1B1B18]">{s.agentName}</span>
                    <span className={`badge ${s.status === "revoked" ? "badge-gray" : "badge-gray"} text-[10px]`}>
                      {s.status === "revoked" ? "Revoked" : "Expired"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[#4A4A43]">
                    <span className="mono">{formatAddress(s.sessionId)}</span>
                    {s.revokeTxHash && (
                      <a
                        href={formatBscScanTxLink(s.revokeTxHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[#1B1B18] flex items-center gap-1"
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
        <div className="px-5 py-3 border-t border-[#1B1B18]/20 bg-[#EAE6D9] text-[11px] text-[#4A4A43] text-center font-plex-mono">
          Revocation is immediate & verifiable on{" "}
          <a href={BSCSCAN_TESTNET_URL} target="_blank" rel="noreferrer" className="hover:text-[#1B1B18] underline">
            BscScan Testnet
          </a>
        </div>
      </div>
    </>
  );
}
