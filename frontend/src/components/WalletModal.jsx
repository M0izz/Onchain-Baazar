import React, { useState } from "react";
import { X, Wallet, Check, AlertCircle, ExternalLink, ShieldCheck, Cpu, Copy, ArrowRight } from "lucide-react";
import { formatAddress, switchToBscTestnet, BSC_TESTNET_CHAIN_ID, BSCSCAN_TESTNET_URL } from "../utils/web3";

export default function WalletModal({
  isOpen,
  onClose,
  account,
  isCorrectNetwork,
  isDevMode,
  onConnectRealWallet,
  onConnectCustomAddress,
  onEnableDevMode,
  onDisconnect
}) {
  const [customAddr, setCustomAddr] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const hasInjectedWallet = typeof window !== "undefined" && !!window.ethereum;

  const handleRealConnect = async () => {
    setError("");
    setConnecting(true);
    try {
      if (!hasInjectedWallet) {
        throw new Error("No Web3 wallet extension (like MetaMask) was detected in this browser. Install MetaMask or use Dev Sandbox.");
      }
      await onConnectRealWallet();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setError("");
    const trimmed = customAddr.trim();
    if (!trimmed.startsWith("0x") || trimmed.length !== 42) {
      setError("Please enter a valid 42-character EVM address starting with 0x");
      return;
    }
    onConnectCustomAddress(trimmed);
    onClose();
  };

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#14213D]/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#F3F0E4] border border-[#1B1B18]/25 shadow-2xl rounded-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1B1B18]/15">
          <div className="flex items-center gap-2.5">
            <Wallet size={20} className="text-[#14213D]" />
            <h2 className="font-zilla font-bold text-[#1B1B18] text-lg">
              {account ? "Wallet Connected" : "Connect Wallet"}
            </h2>
          </div>
          <button
            id="wallet-modal-close"
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-[#1B1B18]/10 text-[#4A4A43] hover:text-[#1B1B18] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-[#B23A2E]/10 border border-[#B23A2E]/30 rounded-sm text-[#B23A2E] text-xs font-plex-mono">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── If Already Connected: Show Active Info & Management ── */}
          {account ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#EAE6D9] border border-[#1B1B18]/15 rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-plex-mono text-[#4A4A43] uppercase tracking-wider">Active Signer</span>
                  {isDevMode ? (
                    <span className="px-2 py-0.5 bg-[#8C6A1E]/15 border border-[#8C6A1E]/30 text-[#8C6A1E] text-[10px] font-plex-mono rounded-sm font-semibold">
                      DEV SANDBOX
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#2F6845]/15 border border-[#2F6845]/30 text-[#2F6845] text-[10px] font-plex-mono rounded-sm font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2F6845] animate-pulse" />
                      LIVE BSC TESTNET
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between font-plex-mono text-sm font-bold text-[#1B1B18] bg-[#F3F0E4] p-2.5 rounded-sm border border-[#1B1B18]/10">
                  <span className="truncate">{account}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={handleCopy}
                      title="Copy Address"
                      className="p-1 hover:bg-[#1B1B18]/10 rounded-sm text-[#4A4A43] transition-colors"
                    >
                      {copied ? <Check size={14} className="text-[#2F6845]" /> : <Copy size={14} />}
                    </button>
                    <a
                      href={`${BSCSCAN_TESTNET_URL}/address/${account}`}
                      target="_blank"
                      rel="noreferrer"
                      title="View on BscScan"
                      className="p-1 hover:bg-[#1B1B18]/10 rounded-sm text-[#4A4A43] transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                {!isDevMode && !isCorrectNetwork && (
                  <div className="flex items-center justify-between p-2.5 bg-[#B23A2E]/10 border border-[#B23A2E]/30 rounded-sm text-xs font-plex-mono">
                    <span className="text-[#B23A2E]">Wrong Network (Needs Chain 97)</span>
                    <button
                      onClick={switchToBscTestnet}
                      className="px-2 py-1 bg-[#14213D] text-[#EAE6D9] rounded-sm font-semibold hover:bg-[#0d1830]"
                    >
                      Switch to BSC
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {isDevMode ? (
                  <button
                    onClick={handleRealConnect}
                    className="py-2 px-3 bg-[#14213D] hover:bg-[#0d1830] text-[#EAE6D9] text-xs font-plex-mono font-semibold rounded-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Wallet size={13} />
                    <span>Switch to MetaMask</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { onEnableDevMode(); onClose(); }}
                    className="py-2 px-3 border border-[#8C6A1E]/40 text-[#8C6A1E] hover:bg-[#8C6A1E]/10 text-xs font-plex-mono font-semibold rounded-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Cpu size={13} />
                    <span>Use Dev Sandbox</span>
                  </button>
                )}

                <button
                  onClick={() => { onDisconnect(); onClose(); }}
                  className="py-2 px-3 border border-[#B23A2E]/40 text-[#B23A2E] hover:bg-[#B23A2E]/10 text-xs font-plex-mono font-semibold rounded-sm transition-colors"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          ) : (
            /* ── If Not Connected: Choose Connection Method ── */
            <div className="space-y-4">
              {/* 1. Real MetaMask / Browser Wallet */}
              <div className="p-4 bg-[#EAE6D9] border border-[#1B1B18]/20 rounded-sm hover:border-[#14213D] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-sm bg-[#14213D] text-[#EAE6D9] flex items-center justify-center">
                      <Wallet size={16} />
                    </div>
                    <div>
                      <p className="font-zilla font-bold text-sm text-[#1B1B18]">MetaMask & Web3 Wallets</p>
                      <p className="text-[11px] font-plex-mono text-[#4A4A43]">Live BSC Testnet Signer</p>
                    </div>
                  </div>
                  {hasInjectedWallet ? (
                    <span className="px-2 py-0.5 bg-[#2F6845]/15 text-[#2F6845] text-[10px] font-plex-mono rounded-sm font-semibold">
                      Detected
                    </span>
                  ) : (
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-plex-mono text-[#8C6A1E] hover:underline flex items-center gap-0.5"
                    >
                      Install <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                <p className="text-xs text-[#4A4A43] mb-3 font-plex-sans leading-relaxed">
                  Connect your real browser wallet to sign transactions on Binance Smart Chain Testnet (Chain ID 97).
                </p>

                <button
                  id="connect-metamask-btn"
                  onClick={handleRealConnect}
                  disabled={connecting}
                  className="w-full py-2.5 px-4 bg-[#14213D] hover:bg-[#0d1830] disabled:opacity-60 text-[#EAE6D9] font-plex-mono font-semibold text-xs rounded-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Wallet size={14} />
                  <span>{connecting ? "Connecting..." : "Connect Browser Wallet"}</span>
                </button>
              </div>

              {/* 2. Dev Sandbox Mode */}
              <div className="p-4 bg-[#E0DBC9]/60 border border-[#8C6A1E]/30 rounded-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-sm bg-[#8C6A1E] text-[#EAE6D9] flex items-center justify-center">
                      <Cpu size={16} />
                    </div>
                    <div>
                      <p className="font-zilla font-bold text-sm text-[#1B1B18]">Dev Sandbox Simulator</p>
                      <p className="text-[11px] font-plex-mono text-[#8C6A1E]">Instant Testing (No Gas)</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-[#8C6A1E]/15 text-[#8C6A1E] text-[10px] font-plex-mono rounded-sm font-semibold">
                    1-Click
                  </span>
                </div>
                <p className="text-xs text-[#4A4A43] mb-3 font-plex-sans leading-relaxed">
                  Use simulated pre-funded test address (<span className="font-plex-mono font-semibold">0x7099...79C8</span>) with instant task execution for quick testing.
                </p>
                <button
                  id="connect-dev-sandbox-btn"
                  onClick={() => { onEnableDevMode(); onClose(); }}
                  className="w-full py-2 px-4 border border-[#8C6A1E] hover:bg-[#8C6A1E]/10 text-[#8C6A1E] font-plex-mono font-semibold text-xs rounded-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Cpu size={14} />
                  <span>Launch Dev Sandbox</span>
                </button>
              </div>

              {/* 3. Custom EVM Address */}
              <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-[#1B1B18]/15 space-y-2">
                <label className="block text-xs font-semibold font-plex-mono text-[#4A4A43] uppercase tracking-wider">
                  Or paste custom testnet address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={customAddr}
                    onChange={(e) => { setCustomAddr(e.target.value); setError(""); }}
                    className="flex-1 bg-[#EAE6D9] border border-[#1B1B18]/25 rounded-sm py-2 px-3 text-xs font-plex-mono text-[#1B1B18] placeholder:text-[#4A4A43]/50 focus:outline-none focus:border-[#14213D]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#14213D] hover:bg-[#0d1830] text-[#EAE6D9] text-xs font-plex-mono font-semibold rounded-sm transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
