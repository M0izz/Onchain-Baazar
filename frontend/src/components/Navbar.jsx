import React, { useEffect, useRef, useState } from "react";
import {
  ShieldCheck, Zap, Layers, BarChart3, ExternalLink,
  Home, User, Shield, LogOut, ChevronDown, Menu, X,
} from "lucide-react";
import { formatAddress, BSCSCAN_TESTNET_URL } from "../utils/web3";
import { useAuth } from "../context/AuthContext";

// ── Navbar height used for scroll-margin-top on landing sections ──────────────
export const NAVBAR_HEIGHT = 56; // px — keep in sync with py-2.5 + content

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const mobileRef = useRef(null);

  const initials = user ? (user.display_name || user.email || "?")[0].toUpperCase() : null;

  // Close menus on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on tab change
  useEffect(() => { setMobileMenuOpen(false); }, [activeTab]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
    onDisconnect();
  };

  // ── Navigation handler ──────────────────────────────────────────────────────
  // On the landing page, "Overview" scrolls to the hero (top).
  // Other tabs switch the view normally. Smooth tab fade is handled in App.jsx.
  const handleNav = (tab) => {
    if (tab === "landing" && activeTab === "landing") {
      // Already on landing — scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setActiveTab(tab);
    }
    setMobileMenuOpen(false);
  };

  // Tab config — single source of truth
  const TABS = [
    { id: "landing",      label: "Overview",            shortLabel: "Overview",   Icon: Home },
    { id: "marketplace",  label: "Agent Directory",     shortLabel: "Directory",  Icon: Zap },
    { id: "pancakeswap",  label: "PancakeSwap Terminal", shortLabel: "PancakeSwap", Icon: Layers },
    { id: "termix",       label: "TermiX Matrix",       shortLabel: "TermiX",     Icon: BarChart3 },
  ];

  const tabBtn = (tab, mobile = false) => (
    <button
      key={tab.id}
      onClick={() => handleNav(tab.id)}
      aria-current={activeTab === tab.id ? "page" : undefined}
      className={`
        flex items-center gap-1.5 whitespace-nowrap transition-all font-plex-mono font-medium
        ${mobile
          ? `w-full px-4 py-3 text-sm rounded-sm ${activeTab === tab.id ? "bg-[#14213D] text-[#EAE6D9]" : "text-[#1B1B18] hover:bg-[#1B1B18]/8"}`
          : `px-2.5 lg:px-3 py-1.5 rounded-[2px] text-xs ${activeTab === tab.id ? "bg-[#14213D] text-[#EAE6D9] shadow-sm font-semibold" : "text-[#4A4A43] hover:text-[#1B1B18] hover:bg-black/5"}`
        }
      `}
    >
      <tab.Icon size={mobile ? 15 : 13} className="shrink-0" />
      {mobile ? tab.label : (
        <>
          <span className="hidden xl:inline">{tab.label}</span>
          <span className="xl:hidden">{tab.shortLabel}</span>
        </>
      )}
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#EAE6D9]/97 backdrop-blur-md border-b border-[#1B1B18]/20 text-[#1B1B18]">
        {/* ── Main bar ─────────────────────────────────────────────────────── */}
        <div className="
          w-full px-3 sm:px-5 lg:px-8 py-2.5
          flex items-center gap-2 lg:gap-3
          overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        ">

          {/* Brand — always visible, never shrinks */}
          <div
            onClick={() => handleNav("landing")}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img src="/bazaar-robot.png" alt="Onchain Bazaar Mascot" className="w-full h-full object-contain" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-zilla font-extrabold text-lg tracking-tight whitespace-nowrap group-hover:text-[#14213D] transition-colors">
                  ONCHAIN<span className="text-[#8C6A1E]">.BAZAAR</span>
                </span>
                <span className="hidden sm:inline badge badge-gold text-[9px] py-0.5 px-1.5 whitespace-nowrap font-plex-mono">
                  BNB Chain
                </span>
              </div>
              <p className="hidden lg:block text-[10px] text-[#4A4A43] font-plex-sans whitespace-nowrap leading-none mt-0.5">
                ERC-8004 AI Agent Marketplace
              </p>
            </div>
          </div>

          {/* ── Desktop nav tabs — hidden below lg ───────────────────────── */}
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center gap-0.5 bg-[#E0DBC9] p-1 rounded-[2px] border border-[#1B1B18]/20 shrink-0 ml-1"
          >
            {TABS.map((t) => tabBtn(t))}
          </nav>

          {/* Spacer — pushes actions to right on desktop */}
          <div className="flex-1 min-w-0" />

          {/* ── Right-side actions — always visible, flex-shrink: 0 ───────── */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Network badge — desktop only */}
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-1.5 rounded-[2px] bg-[#E0DBC9] border border-[#1B1B18]/20 text-xs font-plex-mono whitespace-nowrap shrink-0">
              <div className="w-2 h-2 rounded-full bg-[#2F6845] animate-pulse shrink-0" />
              <span className="text-[#1B1B18] font-medium">BSC Testnet (97)</span>
              <a
                href={BSCSCAN_TESTNET_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[#4A4A43] hover:text-[#1B1B18] shrink-0"
                title="View on BscScan"
              >
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Active Sessions — icon-only on mobile */}
            <button
              onClick={onOpenSessions}
              title="Active Sessions"
              className="btn-secondary text-xs py-1.5 px-2 sm:px-2.5 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <ShieldCheck size={14} className="text-[#2F6845] shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">Active Sessions</span>
              {activeSessionsCount > 0 ? (
                <span className="w-4 h-4 rounded-full bg-[#2F6845] text-white font-mono font-extrabold text-[10px] flex items-center justify-center shrink-0">
                  {activeSessionsCount}
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#1B1B18]/25 shrink-0" />
              )}
            </button>

            {/* Wallet — always visible */}
            {account ? (
              <button
                onClick={onDisconnect}
                className="btn-secondary text-xs py-1.5 px-2 sm:px-2.5 flex items-center gap-1.5 border-[#1B1B18]/30 hover:border-[#1B1B18] whitespace-nowrap shrink-0"
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

            {/* User account / Sign In */}
            {isAuthenticated ? (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  id="navbar-user-menu-btn"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-[2px] bg-[#14213D] text-[#EAE6D9] hover:bg-[#0d1830] transition-colors text-xs font-plex-mono shrink-0"
                >
                  <span className="w-5 h-5 rounded-sm bg-[#8C6A1E] flex items-center justify-center text-[10px] font-bold shrink-0">
                    {initials}
                  </span>
                  <span className="hidden sm:block max-w-[72px] truncate">
                    {user?.display_name || user?.email?.split("@")[0]}
                  </span>
                  <ChevronDown size={11} className={`shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* User dropdown */}
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
                className="btn-primary text-xs py-1.5 px-3 sm:px-3.5 whitespace-nowrap shrink-0 font-semibold"
              >
                Sign In
              </button>
            )}

            {/* ── Hamburger — visible below lg ───────────────────────────── */}
            <button
              id="navbar-hamburger"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-sm border border-[#1B1B18]/25 text-[#1B1B18] hover:bg-[#1B1B18]/8 transition-colors shrink-0"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Dev Mode Banner */}
        {isDevMode && (
          <div className="px-4 py-1.5 bg-[#E0DBC9] border-t border-[#8C6A1E]/40 flex items-center justify-between text-[11px] text-[#1B1B18] font-plex-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold px-1.5 py-0.5 bg-[#8C6A1E] text-white rounded-[2px] text-[10px] tracking-wider shrink-0">[DEV]</span>
              <span className="truncate">Simulated confirmations active. Switch to live BSC Testnet signer anytime.</span>
            </div>
            <button onClick={() => setIsDevMode(false)} className="underline hover:text-[#14213D] font-medium shrink-0 ml-3">
              Disable
            </button>
          </div>
        )}

        {/* ── Mobile drawer — slides down below lg ─────────────────────────── */}
        {mobileMenuOpen && (
          <div
            ref={mobileRef}
            className="lg:hidden bg-[#F3F0E4] border-t border-[#1B1B18]/15 shadow-lg"
          >
            {/* Nav tabs */}
            <div className="px-3 py-2 border-b border-[#1B1B18]/10">
              <p className="text-[10px] font-plex-mono text-[#4A4A43] uppercase tracking-wider px-1 py-1">Navigate</p>
              {TABS.map((t) => tabBtn(t, true))}
            </div>

            {/* Secondary items */}
            <div className="px-3 py-2 border-b border-[#1B1B18]/10">
              <p className="text-[10px] font-plex-mono text-[#4A4A43] uppercase tracking-wider px-1 py-1">Network</p>
              <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-plex-mono text-[#1B1B18]">
                <div className="w-2 h-2 rounded-full bg-[#2F6845] animate-pulse" />
                <span>BSC Testnet (97)</span>
                <a href={BSCSCAN_TESTNET_URL} target="_blank" rel="noreferrer" className="ml-auto text-[#4A4A43]">
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Sessions shortcut */}
            <div className="px-3 py-2">
              <button
                onClick={() => { onOpenSessions(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-plex-mono text-[#1B1B18] rounded-sm hover:bg-[#EAE6D9] transition-colors"
              >
                <ShieldCheck size={15} className="text-[#2F6845]" />
                Active Sessions
                {activeSessionsCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-[#2F6845] text-white text-[10px] font-bold flex items-center justify-center">
                    {activeSessionsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
