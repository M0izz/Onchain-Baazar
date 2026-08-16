import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const STORAGE_KEY = "onchain_bazaar_rt";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for a stored refresh token
  const refreshTimerRef = useRef(null);

  // ── Token refresh ─────────────────────────────────────────────────────────
  const scheduleRefresh = useCallback((token, expiresInMs) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Refresh 60 s before expiry
    const delay = Math.max(expiresInMs - 60_000, 5_000);
    refreshTimerRef.current = setTimeout(() => silentRefresh(token), delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const silentRefresh = useCallback(async (rt) => {
    const storedRt = rt || localStorage.getItem(STORAGE_KEY);
    if (!storedRt) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: storedRt }),
      });
      if (!res.ok) { logout(); return; }
      const data = await res.json();
      localStorage.setItem(STORAGE_KEY, data.refresh_token);
      setAccessToken(data.access_token);
      // Decode exp from JWT (base64 middle segment)
      const [, payload] = data.access_token.split(".");
      const { exp, sub } = JSON.parse(atob(payload));
      const expiresInMs = exp * 1000 - Date.now();
      scheduleRefresh(data.refresh_token, expiresInMs);
      // Fetch full user profile if not set
      setUser((prev) => prev || { id: sub });
      fetchMe(data.access_token);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [scheduleRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bootstrap on mount
  useEffect(() => {
    const storedRt = localStorage.getItem(STORAGE_KEY);
    if (storedRt) {
      silentRefresh(storedRt);
    } else {
      setLoading(false);
    }
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [silentRefresh]);

  // ── API helpers ───────────────────────────────────────────────────────────
  const fetchMe = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUser(await res.json());
    } catch { /* ignore */ }
  };

  const _handleAuthResponse = (data) => {
    localStorage.setItem(STORAGE_KEY, data.refresh_token);
    setAccessToken(data.access_token);
    setUser(data.user);
    const [, payload] = data.access_token.split(".");
    const { exp } = JSON.parse(atob(payload));
    scheduleRefresh(data.refresh_token, exp * 1000 - Date.now());
  };

  // ── Public API ────────────────────────────────────────────────────────────
  const register = async (email, password, displayName) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }
    _handleAuthResponse(await res.json());
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }
    _handleAuthResponse(await res.json());
  };

  const logout = useCallback(async () => {
    const storedRt = localStorage.getItem(STORAGE_KEY);
    if (storedRt) {
      fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: storedRt }),
      }).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setUser(null);
    setAccessToken(null);
  }, []);

  const updateProfile = async (fields) => {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(fields),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Update failed"); }
    const updated = await res.json();
    setUser((prev) => ({ ...prev, ...updated }));
  };

  const forgotPassword = async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Request failed"); }
  };

  const resetPassword = async (token, newPassword) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Reset failed"); }
  };

  const value = {
    user,
    accessToken,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
