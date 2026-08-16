import React, { useRef, useState } from "react";
import { ShieldCheck, Zap, Layers, BarChart3, ExternalLink, Home, User, Shield, LogOut, ChevronDown } from "lucide-react";
import { formatAddress, BSCSCAN_TESTNET_URL } from "../utils/web3";
import { useAuth } from "../context/AuthContext";

export default function Navbar({
  account,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  isCorrectNetwork,
  activeSessionsCount,
  onOpenSessions,
  activeTab,
  setActiveTab,
  isDevMode,
  setIsDevMode,
  onOpenProfile,
  onOpenAdmin,
  onOpenAuthModal,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    onDisconnect();
  };

  const initials = user
    ? (user.display_name || user.email || "?")[0].toUpperCase()
    : null;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#EAE6D9]/95 border-b border-[#1B1B18]/20 px-3 sm:px-6 lg:px-8 py-2.5 text-[#1B1B18]">
      <div className="max-w-[1440px] mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-2 sm:gap-4">

        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveTab("landing")}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform shrink-0">
            <img src="/bazaar-robot.png" alt="Onchain Bazaar Mascot" className="w-full h-full object-contain filter drop-shadow-sm" />
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-zilla font-extrabold text-lg sm:text-xl tracking-tight text-[#1B1B18] group-hover:text-[#14213D] transition-colors whitespace-nowrap">
                ONCHAIN<span className="text-[#8C6A1E]">.BAZAAR</span>
              </span>
              <span className="badge badge-gold text-[9px] sm:text-[10px] py-0.5 px-1.5 whitespace-nowrap font-plex-mono">BNB Chain</span>
            </div>
            <p className="hidden sm:block text-[10.5px] text-[#4A4A43] font-medium font-plex-sans whitespace-nowrap">
              ERC-8004 AI Agent Marketplace
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#E0DBC9] p-1 rounded-[2px] border border-[#1B1B18]/20 overflow-x-auto shrink-0 max-w-full">
          <button
            onClick={() => setActiveTab("landing")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-[2px] text-xs font-plex-mono font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "landing"
                ? "bg-[#14213D] text-[#EAE6D9] shadow-sm font-semibold"
                : "text-[#4A4A43] hover:text-[#1B1B18] hover:bg-black/5"
            }`}
          >
            <Home size={14} className="shrink-0" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("marketplace")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-[2px] text-xs font-plex-mono font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "marketplace"
                ? "bg-[#14213D] text-[#EAE6D9] shadow-sm font-semibold"
                : "text-[#4A4A43] hover:text-[#1B1B18] hover:bg-black/5"
            }`}
          >
            <Zap size={14} className="shrink-0" />
            <span>Agent Directory</span>
          </button>

          <button
            onClick={() => setActiveTab("pancakeswap")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-[2px] text-xs font-plex-mono font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "pancakeswap"
                ? "bg-[#14213D] text-[#EAE6D9] shadow-sm font-semibold"
                : "text-[#4A4A43] hover:text-[#1B1B18] hover:bg-black/5"
            }`}
          >
            <Layers size={14} className="shrink-0" />
            <span className="hidden xl:inline">PancakeSwap Terminal</span>
            <span className="xl:hidden">PancakeSwap</span>
          </button>

          <button
            onClick={() => setActiveTab("termix")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-[2px] text-xs font-plex-mono font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "termix"
                ? "bg-[#14213D] text-[#EAE6D9] shadow-sm font-semibold"
                : "text-[#4A4A43] hover:text-[#1B1B18] hover:bg-black/5"
            }`}
          >
            <BarChart3 size={14} className="shrink-0" />
            <span className="hidden xl:inline">TermiX Matrix</span>
            <span className="xl:hidden">TermiX</span>
          </button>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

          {/* Network Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] bg-[#E0DBC9] border border-[#1B1B18]/20 text-xs font-plex-mono whitespace-nowrap shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#2F6845] animate-pulse shrink-0" />
            <span className="text-[#1B1B18] font-medium whitespace-nowrap">BSC Testnet (97)</span>
            <a
              href={BSCSCAN_TESTNET_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[#4A4A43] hover:text-[#1B1B18] shrink-0"
              title="View on BscScan"
            >
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Active Sessions Button */}
          <button
            onClick={onOpenSessions}
            className="btn-secondary text-xs py-1.5 px-2.5 sm:px-3 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ShieldCheck size={15} className="text-[#2F6845] shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Active Sessions</span>
            {activeSessionsCount > 0 ? (
              <span className="w-4 h-4 rounded-full bg-[#2F6845] text-white font-mono font-extrabold text-[10px] flex items-center justify-center shrink-0">
                {activeSessionsCount}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#1B1B18]/30 shrink-0" />
            )}
          </button>

          {/* Wallet Connect Button */}
          {account ? (
            <button
              onClick={onDisconnect}
              className="btn-secondary text-xs py-1.5 px-2.5 sm:px-3 flex items-center gap-1.5 border-[#1B1B18]/30 hover:border-[#1B1B18] whitespace-nowrap shrink-0"
            >
              <div className="w-2 h-2 rounded-full bg-[#2F6845] shrink-0" />
              <span className="mono font-semibold whitespace-nowrap">{formatAddress(account)}</span>
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="btn-secondary text-xs py-1.5 px-2.5 sm:px-3 whitespace-nowrap shrink-0"
            >
              Connect Wallet
            </button>
          )}

          {/* ── User Account Section ───────────────────────────────────── */}
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                id="navbar-user-menu-btn"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-[2px] bg-[#14213D] text-[#EAE6D9] hover:bg-[#0d1830] transition-colors text-xs font-plex-mono shrink-0"
              >
                {/* Avatar initial */}
                <span className="w-5 h-5 rounded-sm bg-[#8C6A1E] flex items-center justify-center text-[10px] font-bold shrink-0">
                  {initials}
                </span>
                <span className="hidden sm:block max-w-[80px] truncate">
                  {user?.display_name || user?.email?.split("@")[0]}
                </span>
                <ChevronDown size={12} className={`shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[#F3F0E4] border border-[#1B1B18]/20 shadow-lg rounded-sm overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-[#1B1B18]/10">
                    <p className="text-xs font-semibold text-[#1B1B18] truncate">{user?.display_name || "User"}</p>
                    <p className="text-[10px] text-[#4A4A43] font-plex-mono truncate">{user?.email}</p>
                  </div>
                  <button
                    id="navbar-profile-link"
                    onClick={() => { setUserMenuOpen(false); onOpenProfile(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1B1B18] hover:bg-[#EAE6D9] transition-colors font-plex-mono"
                  >
                    <User size={12} /> My Profile
                  </button>
                  {user?.is_admin && (
                    <button
                      id="navbar-admin-link"
                      onClick={() => { setUserMenuOpen(false); onOpenAdmin(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#8C6A1E] hover:bg-[#EAE6D9] transition-colors font-plex-mono"
                    >
                      <Shield size={12} /> Admin Panel
                    </button>
                  )}
                  <div className="border-t border-[#1B1B18]/10">
                    <button
                      id="navbar-logout-btn"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#B23A2E] hover:bg-[#B23A2E]/8 transition-colors font-plex-mono"
                    >
                      <LogOut size={12} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="navbar-signin-btn"
              onClick={onOpenAuthModal}
              className="btn-primary text-xs py-1.5 px-3.5 sm:px-4 whitespace-nowrap shrink-0 font-semibold"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Dev Mode Banner */}
      {isDevMode && (
        <div className="mt-3 max-w-7xl mx-auto py-1.5 px-4 bg-[#E0DBC9] border border-[#8C6A1E]/40 rounded-[2px] flex items-center justify-between text-[11px] text-[#1B1B18] font-plex-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold px-1.5 py-0.5 bg-[#8C6A1E] text-white rounded-[2px] text-[10px] tracking-wider shrink-0">[DEV SANDBOX ACTIVE]</span>
            <span>Simulated instant confirmations enabled for local sandbox testing. Switch to live BSC Testnet signer anytime.</span>
          </div>
          <button
            onClick={() => setIsDevMode(false)}
            className="underline hover:text-[#14213D] font-medium shrink-0"
          >
            Disable Sandbox
          </button>
        </div>
      )}
    </header>
  );
}
