import React, { useState, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AuthModal({ isOpen, onClose, initialTab = "login" }) {
  const { login, register, forgotPassword } = useAuth();
  const [tab, setTab] = useState(initialTab); // 'login' | 'register' | 'forgot'

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab || "login");
      setError("");
    }
  }, [isOpen, initialTab]);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register fields
  const [regEmail, setRegEmail] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  // Forgot fields
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const clearError = () => setError("");
  const switchTab = (t) => { setTab(t); setError(""); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); 
    if (regPassword !== regConfirm) { setError("Passwords do not match"); return; }
    if (regPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await register(regEmail.trim(), regPassword, regName.trim());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#14213D]/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#F3F0E4] border border-[#1B1B18]/20 shadow-2xl rounded-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1B1B18]/15">
          <div className="flex items-center gap-3">
            <img src="/bazaar-robot.png" alt="Onchain Bazaar" className="w-7 h-7 object-contain" />
            <span className="font-bold text-[#1B1B18] font-zilla text-lg">ONCHAIN.BAZAAR</span>
          </div>
          <button
            id="auth-modal-close"
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-[#1B1B18]/10 text-[#4A4A43] hover:text-[#1B1B18] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab bar (login / register) */}
        {tab !== "forgot" && (
          <div className="flex border-b border-[#1B1B18]/15">
            {["login", "register"].map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-3 text-sm font-semibold font-plex-mono uppercase tracking-wider transition-colors ${
                  tab === t
                    ? "text-[#14213D] border-b-2 border-[#14213D]"
                    : "text-[#4A4A43] hover:text-[#1B1B18]"
                }`}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
        )}

        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-[#B23A2E]/10 border border-[#B23A2E]/30 rounded-sm text-[#B23A2E] text-sm">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Login Form ─────────────────────────────────────────────── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field
                id="login-email"
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(v) => { setLoginEmail(v); clearError(); }}
                placeholder="you@example.com"
                icon={<Mail size={14} />}
                required
              />
              <PasswordField
                id="login-password"
                label="Password"
                value={loginPassword}
                onChange={(v) => { setLoginPassword(v); clearError(); }}
                show={showLoginPw}
                onToggle={() => setShowLoginPw((s) => !s)}
                required
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchTab("forgot")}
                  className="text-xs text-[#8C6A1E] hover:underline font-plex-mono"
                >
                  Forgot password?
                </button>
              </div>
              <SubmitBtn loading={loading} label="Sign In" id="login-submit" />
              <p className="text-center text-xs text-[#4A4A43] font-plex-mono">
                No account?{" "}
                <button type="button" onClick={() => switchTab("register")} className="text-[#14213D] underline">
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* ── Register Form ───────────────────────────────────────────── */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field
                id="reg-name"
                label="Display Name"
                type="text"
                value={regName}
                onChange={(v) => { setRegName(v); clearError(); }}
                placeholder="Satoshi"
                icon={<User size={14} />}
              />
              <Field
                id="reg-email"
                label="Email"
                type="email"
                value={regEmail}
                onChange={(v) => { setRegEmail(v); clearError(); }}
                placeholder="you@example.com"
                icon={<Mail size={14} />}
                required
              />
              <PasswordField
                id="reg-password"
                label="Password"
                value={regPassword}
                onChange={(v) => { setRegPassword(v); clearError(); }}
                show={showRegPw}
                onToggle={() => setShowRegPw((s) => !s)}
                hint="Minimum 8 characters"
                required
              />
              <PasswordField
                id="reg-confirm"
                label="Confirm Password"
                value={regConfirm}
                onChange={(v) => { setRegConfirm(v); clearError(); }}
                show={showRegPw}
                onToggle={() => setShowRegPw((s) => !s)}
                required
              />
              <SubmitBtn loading={loading} label="Create Account" id="register-submit" />
              <p className="text-center text-xs text-[#4A4A43] font-plex-mono">
                Already have an account?{" "}
                <button type="button" onClick={() => switchTab("login")} className="text-[#14213D] underline">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* ── Forgot Password Form ────────────────────────────────────── */}
          {tab === "forgot" && (
            forgotSent ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">📬</div>
                <h3 className="font-zilla font-bold text-[#1B1B18] text-lg mb-2">Check your inbox</h3>
                <p className="text-sm text-[#4A4A43] font-plex-mono mb-4">
                  If <span className="text-[#1B1B18] font-semibold">{forgotEmail}</span> is registered,
                  a reset link has been sent. It expires in 1 hour.
                </p>
                <button
                  onClick={() => switchTab("login")}
                  className="text-xs text-[#14213D] underline font-plex-mono"
                >
                  ← Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => switchTab("login")}
                    className="text-xs text-[#4A4A43] hover:text-[#1B1B18] font-plex-mono flex items-center gap-1"
                  >
                    ← Back to sign in
                  </button>
                </div>
                <p className="text-sm text-[#4A4A43] font-plex-mono">
                  Enter your email and we'll send a password reset link.
                </p>
                <Field
                  id="forgot-email"
                  label="Email"
                  type="email"
                  value={forgotEmail}
                  onChange={(v) => { setForgotEmail(v); clearError(); }}
                  placeholder="you@example.com"
                  icon={<Mail size={14} />}
                  required
                />
                <SubmitBtn loading={loading} label="Send Reset Link" id="forgot-submit" />
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Field({ id, label, type, value, onChange, placeholder, icon, hint, required }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#4A4A43] uppercase tracking-wider mb-1.5 font-plex-mono">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A43]">{icon}</span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-[#EAE6D9] border border-[#1B1B18]/20 rounded-sm py-2.5 pr-3 text-sm text-[#1B1B18] placeholder:text-[#4A4A43]/50 focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]/20 font-plex-mono transition-colors ${icon ? "pl-9" : "pl-3"}`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-[#4A4A43]/70 font-plex-mono">{hint}</p>}
    </div>
  );
}

function PasswordField({ id, label, value, onChange, show, onToggle, hint, required }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#4A4A43] uppercase tracking-wider mb-1.5 font-plex-mono">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A43]">
          <Lock size={14} />
        </span>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full bg-[#EAE6D9] border border-[#1B1B18]/20 rounded-sm py-2.5 pl-9 pr-10 text-sm text-[#1B1B18] placeholder:text-[#4A4A43]/50 focus:outline-none focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D]/20 font-plex-mono transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4A43] hover:text-[#1B1B18]"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-[#4A4A43]/70 font-plex-mono">{hint}</p>}
    </div>
  );
}

function SubmitBtn({ loading, label, id }) {
  return (
    <button
      id={id}
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-[#14213D] hover:bg-[#0d1830] disabled:opacity-60 text-[#EAE6D9] font-semibold py-2.5 rounded-sm transition-colors font-plex-mono text-sm tracking-wide"
    >
      {loading && <Loader size={14} className="animate-spin" />}
      {label}
    </button>
  );
}
