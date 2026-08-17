import React, { useEffect, useRef, useState } from "react";
import {
  ShieldCheck, Zap, Layers, BarChart3, ExternalLink,
  Home, User, Shield, LogOut, ChevronDown, Menu, X,
  HelpCircle, Store, Award, Flag, LogIn, Wallet
} from "lucide-react";
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
  onOpenWalletModal,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const menuRef = useRef(null);
  const mobileRef = useRef(null);

  const initials = user ? (user.display_name || user.email || "?")[0].toUpperCase() : null;

  // ── Intersection Observer for Landing Page sections when logged out ────────
  useEffect(() => {
    if (isAuthenticated || activeTab !== "landing") return;

    const sectionIds = ["overview", "how", "stalls", "trust", "tracks"];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 100;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAuthenticated, activeTab]);

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

  // ── Smooth Scroll to Landing Section ───────────────────────────────────────
  const scrollToSection = (id) => {
    if (activeTab !== "landing") {
      setActiveTab("landing");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 80);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  // ── Tab Navigation for Logged In users ─────────────────────────────────────
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  // Logged-out landing page sections
  const LANDING_SECTIONS = [
    { id: "overview", label: "Overview", Icon: Home },
    { id: "how",      label: "How It Works", Icon: HelpCircle },
    { id: "stalls",   label: "Agent Stalls", Icon: Store },
    { id: "trust",    label: "Trust & Safety", Icon: Award },
    { id: "tracks",   label: "Tracks", Icon: Flag },
  ];

  // Logged-in workspace tabs (compact text on desktop to prevent overflow)
  const APP_TABS = [
    { id: "marketplace",  label: "Agent Directory",     shortLabel: "Directory",   Icon: Zap },
    { id: "pancakeswap",  label: "PancakeSwap",         shortLabel: "PancakeSwap", Icon: Layers },
    { id: "termix",       label: "TermiX Matrix",       shortLabel: "TermiX",      Icon: BarChart3 },
    { id: "landing",      label: "Overview",            shortLabel: "Overview",    Icon: Home },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#EAE6D9]/97 backdrop-blur-md border-b border-[#1B1B18]/20 text-[#1B1B18]">
        {/* ── Main Bar (fluid, robust flex layout without overflow clipping) ── */}
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-2 flex items-center justify-between gap-2">

          {/* 1. Brand Logo & Title */}
          <div
            onClick={() => {
              if (isAuthenticated) {
                handleTabChange("marketplace");
              } else {
                scrollToSection("overview");
              }
            }}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img src="/bazaar-robot.png" alt="Onchain Bazaar Mascot" className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-zilla font-extrabold text-base sm:text-lg tracking-tight whitespace-nowrap text-[#1B1B18] group-hover:text-[#14213D] transition-colors">
                  ONCHAIN<span className="text-[#8C6A1E]">.BAZAAR</span>
                </span>
                <span className="hidden sm:inline badge badge-gold text-[9px] py-0.5 px-1.5 whitespace-nowrap font-plex-mono">
                  BNB
                </span>
              </div>
            </div>
          </div>

          {/* 2. Center Navigation Links (Desktop) */}
          {isAuthenticated ? (
            /* ── Logged-in App Workspace Tabs ── */
            <nav aria-label="App navigation" className="hidden lg:flex items-center gap-0.5 bg-[#E0DBC9] p-0.5 rounded-[2px] border border-[#1B1B18]/20 shrink-0">
              {APP_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  className={`
                    px-2 xl:px-2.5 py-1 rounded-[2px] text-xs font-plex-mono font-medium flex items-center gap-1 whitespace-nowrap transition-all
                    ${activeTab === tab.id
                      ? "bg-[#14213D] text-[#EAE6D9] shadow-sm font-semibold"
                      : "text-[#4A4A43] hover:text-[#1B1B18] hover:bg-black/5"
                    }
                  `}
                >
                  <tab.Icon size={12} className="shrink-0" />
                  <span className="hidden xl:inline">{tab.label}</span>
                  <span className="xl:hidden">{tab.shortLabel}</span>
                </button>
              ))}
            </nav>
          ) : (
            /* ── Logged-out Landing Page Section Smooth-Scroll Links ── */
            <nav aria-label="Page sections navigation" className="hidden lg:flex items-center gap-0.5 bg-[#E0DBC9] p-0.5 rounded-[2px] border border-[#1B1B18]/20 shrink-0">
              {LANDING_SECTIONS.map((sec) => {
                const isActive = activeTab === "landing" && activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`
                      px-2 xl:px-2.5 py-1 rounded-[2px] text-xs font-plex-mono font-medium flex items-center gap-1.5 whitespace-nowrap transition-all
                      ${isActive
                        ? "bg-[#14213D] text-[#EAE6D9] shadow-sm font-semibold"
                        : "text-[#4A4A43] hover:text-[#1B1B18] hover:bg-black/5"
                      }
                    `}
                  >
                    <sec.Icon size={12} className="shrink-0" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* 3. Right Side Actions (Always cleanly aligned, no cut-off) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Active Sessions Indicator (Logged In only) */}
            {isAuthenticated && (
              <button
                onClick={onOpenSessions}
                title="Active Sessions"
                className="btn-secondary text-xs py-1 px-2 sm:px-2.5 flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <ShieldCheck size={13} className="text-[#2F6845] shrink-0" />
                <span className="hidden xl:inline whitespace-nowrap text-xs">Sessions</span>
                {activeSessionsCount > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-[#2F6845] text-white font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                    {activeSessionsCount}
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1B18]/30 shrink-0" />
                )}
              </button>
            )}

            {/* Wallet Button -> Opens Wallet Connection Modal */}
            <button
              id="navbar-wallet-btn"
              type="button"
              onClick={onOpenWalletModal || onConnect}
              className={`btn-secondary text-xs py-1 px-2 sm:px-2.5 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                account ? "border-[#1B1B18]/30 hover:border-[#1B1B18]" : ""
              }`}
            >
              {account ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-[#2F6845] shrink-0" />
                  <span className="mono font-semibold text-xs whitespace-nowrap">{formatAddress(account)}</span>
                </>
              ) : (
                <>
                  <Wallet size={12} className="shrink-0" />
                  <span className="whitespace-nowrap">Connect Wallet</span>
                </>
              )}
            </button>

            {/* ── User Account & Sign Out vs Sign In ── */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1 shrink-0">
                {/* User Dropdown Button */}
                <div className="relative shrink-0" ref={menuRef}>
                  <button
                    id="navbar-user-menu-btn"
                    type="button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[#14213D] text-[#EAE6D9] hover:bg-[#0d1830] transition-colors text-xs font-plex-mono shrink-0 shadow-sm"
                  >
                    <span className="w-4 h-4 rounded-sm bg-[#8C6A1E] flex items-center justify-center text-[9px] font-bold shrink-0">
                      {initials}
                    </span>
                    <span className="hidden sm:block max-w-[64px] md:max-w-[80px] truncate text-xs">
                      {user?.display_name || user?.email?.split("@")[0]}
                    </span>
                    <ChevronDown size={11} className={`shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#F3F0E4] border border-[#1B1B18]/20 shadow-xl rounded-sm overflow-hidden z-50">
                      <div className="px-3.5 py-2.5 border-b border-[#1B1B18]/10 bg-[#EAE6D9]/50">
                        <p className="text-xs font-semibold text-[#1B1B18] truncate">{user?.display_name || "User"}</p>
                        <p className="text-[10px] text-[#4A4A43] font-plex-mono truncate">{user?.email}</p>
                      </div>
                      <button
                        id="navbar-profile-link"
                        type="button"
                        onClick={() => { setUserMenuOpen(false); onOpenProfile(); }}
                        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-[#1B1B18] hover:bg-[#EAE6D9] transition-colors font-plex-mono"
                      >
                        <User size={13} /> My Profile
                      </button>
                      {user?.is_admin && (
                        <button
                          id="navbar-admin-link"
                          type="button"
                          onClick={() => { setUserMenuOpen(false); onOpenAdmin(); }}
                          className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-[#8C6A1E] hover:bg-[#EAE6D9] transition-colors font-plex-mono"
                        >
                          <Shield size={13} /> Admin Panel
                        </button>
                      )}
                      <div className="border-t border-[#1B1B18]/10">
                        <button
                          id="navbar-dropdown-logout-btn"
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-[#B23A2E] hover:bg-[#B23A2E]/10 transition-colors font-plex-mono font-semibold"
                        >
                          <LogOut size={13} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Visible Sign Out Button */}
                <button
                  id="navbar-direct-logout-btn"
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex items-center gap-1 py-1 px-1.5 sm:px-2 text-xs font-plex-mono font-medium text-[#B23A2E] hover:text-[#8C1E14] border border-[#B23A2E]/30 hover:border-[#B23A2E] rounded-[2px] hover:bg-[#B23A2E]/10 transition-colors shrink-0"
                >
                  <LogOut size={12} />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              /* Sign In Button — Clean, unclipped, always prominent */
              <button
                id="navbar-signin-btn"
                type="button"
                onClick={onOpenAuthModal}
                className="btn-primary text-xs py-1 px-3 sm:px-3.5 whitespace-nowrap shrink-0 font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <LogIn size={12} className="shrink-0" />
                <span>Sign In</span>
              </button>
            )}

            {/* Hamburger Button (< lg) */}
            <button
              id="navbar-hamburger"
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden flex items-center justify-center w-7 h-7 rounded-sm border border-[#1B1B18]/25 text-[#1B1B18] hover:bg-[#1B1B18]/8 transition-colors shrink-0 ml-0.5"
            >
              {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          </div>
        </div>

        {/* Dev Mode Banner */}
        {isDevMode && (
          <div className="px-4 py-1 bg-[#E0DBC9] border-t border-[#8C6A1E]/40 flex items-center justify-between text-[11px] text-[#1B1B18] font-plex-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold px-1.5 py-0.5 bg-[#8C6A1E] text-white rounded-[2px] text-[10px] tracking-wider shrink-0">[DEV SANDBOX ACTIVE]</span>
              <span className="truncate">Simulated instant confirmations enabled. Switch to live BSC Testnet signer anytime.</span>
            </div>
            <button onClick={() => setIsDevMode(false)} className="underline hover:text-[#14213D] font-medium shrink-0 ml-3">
              Disable
            </button>
          </div>
        )}

        {/* ── Mobile Responsive Drawer (< lg) ─────────────────────────────── */}
        {mobileMenuOpen && (
          <div
            ref={mobileRef}
            className="lg:hidden bg-[#F3F0E4] border-t border-[#1B1B18]/15 shadow-xl transition-all"
          >
            {isAuthenticated ? (
              /* Mobile Logged In App Navigation */
              <>
                <div className="px-3 py-2 border-b border-[#1B1B18]/10 space-y-1">
                  <p className="text-[10px] font-plex-mono text-[#4A4A43] uppercase tracking-wider px-2 py-1">App Workspace</p>
                  {APP_TABS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTabChange(t.id)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 text-xs font-plex-mono font-medium rounded-sm transition-colors
                        ${activeTab === t.id ? "bg-[#14213D] text-[#EAE6D9]" : "text-[#1B1B18] hover:bg-[#1B1B18]/5"}
                      `}
                    >
                      <t.Icon size={14} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="px-3 py-2 border-b border-[#1B1B18]/10">
                  <button
                    onClick={() => { onOpenSessions(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-plex-mono text-[#1B1B18] rounded-sm hover:bg-[#1B1B18]/5 transition-colors"
                  >
                    <ShieldCheck size={14} className="text-[#2F6845]" />
                    <span>Active Sessions</span>
                    {activeSessionsCount > 0 && (
                      <span className="ml-auto w-4 h-4 rounded-full bg-[#2F6845] text-white text-[9px] font-bold flex items-center justify-center">
                        {activeSessionsCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Mobile User Profile & Direct Sign Out */}
                <div className="p-3 bg-[#EAE6D9]/50 border-b border-[#1B1B18]/10 flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-6 h-6 rounded-sm bg-[#8C6A1E] text-white flex items-center justify-center text-xs font-bold">
                      {initials}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-[#1B1B18]">{user?.display_name || "User"}</p>
                      <p className="text-[10px] text-[#4A4A43] font-plex-mono truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => { onOpenProfile(); setMobileMenuOpen(false); }}
                      className="flex-1 py-1.5 text-xs font-plex-mono border border-[#1B1B18]/20 rounded-sm hover:bg-[#1B1B18]/5"
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-plex-mono font-semibold text-[#B23A2E] border border-[#B23A2E]/30 rounded-sm hover:bg-[#B23A2E]/10"
                    >
                      <LogOut size={12} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Mobile Logged Out Landing Page Scroll Links */
              <div className="px-3 py-2 border-b border-[#1B1B18]/10 space-y-1">
                <p className="text-[10px] font-plex-mono text-[#4A4A43] uppercase tracking-wider px-2 py-1">Page Sections</p>
                {LANDING_SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-plex-mono text-[#1B1B18] hover:bg-[#1B1B18]/5 rounded-sm transition-colors"
                  >
                    <sec.Icon size={14} className="text-[#8C6A1E]" />
                    <span>{sec.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Network Info */}
            <div className="px-4 py-2 flex items-center justify-between text-xs font-plex-mono text-[#4A4A43]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#2F6845] animate-pulse" />
                <span>BSC Testnet (97)</span>
              </div>
              <a href={BSCSCAN_TESTNET_URL} target="_blank" rel="noreferrer" className="hover:text-[#1B1B18]">
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
