import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://onchain-bazaar-backend.onrender.com/api";
const RT_KEY = "onchain_bazaar_rt";
const AT_KEY = "onchain_bazaar_at";
const USER_KEY = "onchain_bazaar_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize synchronously from localStorage so there is zero latency / zero null window
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => {
    try {
      return localStorage.getItem(AT_KEY) || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const refreshTimerRef = useRef(null);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const storedRt = localStorage.getItem(RT_KEY);
    if (storedRt) {
      fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: storedRt }),
      }).catch(() => {});
    }
    localStorage.removeItem(RT_KEY);
    localStorage.removeItem(AT_KEY);
    localStorage.removeItem(USER_KEY);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setUser(null);
    setAccessToken(null);
    setLoading(false);
  }, []);

  // ── Fetch Profile ───────────────────────────────────────────────────────────
  const fetchMe = useCallback(async (token) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ── Token Refresh ───────────────────────────────────────────────────────────
  const silentRefresh = useCallback(async (rt) => {
    const storedRt = rt || localStorage.getItem(RT_KEY);
    if (!storedRt) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: storedRt }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        // Token invalid or expired in DB
        logout();
        return;
      }

      const data = await res.json();
      localStorage.setItem(RT_KEY, data.refresh_token);
      localStorage.setItem(AT_KEY, data.access_token);
      setAccessToken(data.access_token);

      try {
        const [, payload] = data.access_token.split(".");
        const { exp, sub } = JSON.parse(atob(payload));
        const expiresInMs = exp * 1000 - Date.now();
        const delay = Math.max(expiresInMs - 60_000, 60_000);
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => silentRefresh(data.refresh_token), delay);

        setUser((prev) => {
          const updated = prev || { id: sub };
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
          return updated;
        });
        fetchMe(data.access_token);
      } catch (e) {
        console.warn("JWT parse error:", e);
      }
    } catch (err) {
      console.warn("Silent refresh error:", err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [logout, fetchMe]);

  // ── Bootstrap on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    const storedRt = localStorage.getItem(RT_KEY);
    if (storedRt) {
      silentRefresh(storedRt);
    } else {
      setLoading(false);
    }

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle Auth Success ────────────────────────────────────────────────────
  const _handleAuthResponse = (data) => {
    localStorage.setItem(RT_KEY, data.refresh_token);
    localStorage.setItem(AT_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    setAccessToken(data.access_token);
    setUser(data.user);

    try {
      const [, payload] = data.access_token.split(".");
      const { exp } = JSON.parse(atob(payload));
      const expiresInMs = exp * 1000 - Date.now();
      const delay = Math.max(expiresInMs - 60_000, 60_000);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => silentRefresh(data.refresh_token), delay);
    } catch (e) {
      console.warn("JWT error:", e);
    }
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

  const updateProfile = async (fields) => {
    const token = accessToken || localStorage.getItem(AT_KEY);
    const res = await fetch(`${API_BASE}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.detail || "Update failed");
    }
    const updated = await res.json();
    setUser((prev) => {
      const u = { ...prev, ...updated };
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      return u;
    });
  };

  const forgotPassword = async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.detail || "Request failed");
    }
  };

  const resetPassword = async (token, newPassword) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.detail || "Reset failed");
    }
  };

  const value = {
    user,
    accessToken: accessToken || (typeof localStorage !== "undefined" ? localStorage.getItem(AT_KEY) : null),
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
