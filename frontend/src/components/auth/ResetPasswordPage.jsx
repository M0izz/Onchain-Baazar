import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle, AlertCircle, Loader, Eye, EyeOff } from "lucide-react";

/**
 * ResetPasswordPage
 *
 * Rendered when the URL contains ?token=<reset_token>.
 * Allows the user to set a new password.
 */
export default function ResetPasswordPage({ token, onDone }) {
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success' | 'error'
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setStatus("loading");
    try {
      await resetPassword(token, password);
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#EAE6D9] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#F3F0E4] border border-[#1B1B18]/20 shadow-xl rounded-sm p-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <img src="/bazaar-robot.png" alt="Onchain Bazaar" className="w-8 h-8 object-contain" />
          <span className="font-bold text-[#1B1B18] font-zilla text-xl">ONCHAIN.BAZAAR</span>
        </div>

        {status === "success" ? (
          <div className="text-center py-4">
            <CheckCircle size={40} className="text-[#2F6845] mx-auto mb-3" />
            <h2 className="font-zilla font-bold text-[#1B1B18] text-xl mb-2">Password Updated</h2>
            <p className="text-sm text-[#4A4A43] font-plex-mono mb-6">
              Your password has been changed successfully.
            </p>
            <button
              id="reset-pw-go-home"
              onClick={onDone}
              className="bg-[#14213D] hover:bg-[#0d1830] text-[#EAE6D9] font-semibold py-2.5 px-6 rounded-sm font-plex-mono text-sm transition-colors"
            >
              Go to Marketplace
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="font-zilla font-bold text-[#1B1B18] text-xl mb-1">Reset Password</h2>
              <p className="text-sm text-[#4A4A43] font-plex-mono">Enter your new password below.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#B23A2E]/10 border border-[#B23A2E]/30 rounded-sm text-[#B23A2E] text-sm">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold text-[#4A4A43] uppercase tracking-wider mb-1.5 font-plex-mono">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  required
                  minLength={8}
                  className="w-full bg-[#EAE6D9] border border-[#1B1B18]/20 rounded-sm py-2.5 pl-3 pr-10 text-sm text-[#1B1B18] focus:outline-none focus:border-[#14213D] font-plex-mono"
                />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4A43]">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-[#4A4A43]/70 font-plex-mono">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-[#4A4A43] uppercase tracking-wider mb-1.5 font-plex-mono">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                required
                className="w-full bg-[#EAE6D9] border border-[#1B1B18]/20 rounded-sm py-2.5 px-3 text-sm text-[#1B1B18] focus:outline-none focus:border-[#14213D] font-plex-mono"
              />
            </div>

            <button
              id="reset-pw-submit"
              type="submit"
              disabled={status === "loading"}
              className="w-full flex items-center justify-center gap-2 bg-[#14213D] hover:bg-[#0d1830] disabled:opacity-60 text-[#EAE6D9] font-semibold py-2.5 rounded-sm transition-colors font-plex-mono text-sm"
            >
              {status === "loading" && <Loader size={14} className="animate-spin" />}
              Set New Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
