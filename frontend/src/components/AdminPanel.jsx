import React, { useEffect, useState } from "react";
import { Users, Mail, Wallet, Calendar, Shield, X, Loader, AlertCircle, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function AdminPanel({ isOpen, onClose }) {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/users/?limit=200`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.wallet_address || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#14213D]/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-4xl bg-[#F3F0E4] border border-[#1B1B18]/20 shadow-2xl rounded-sm flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1B1B18]/15">
          <div className="flex items-center gap-2.5">
            <Shield size={18} className="text-[#8C6A1E]" />
            <h2 className="font-zilla font-bold text-[#1B1B18] text-lg">Admin — User Management</h2>
            <span className="ml-2 px-2 py-0.5 bg-[#8C6A1E]/15 border border-[#8C6A1E]/30 text-[#8C6A1E] text-xs font-plex-mono rounded-sm">
              {users.length} users
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="admin-refresh-btn"
              onClick={fetchUsers}
              disabled={loading}
              className="text-xs text-[#4A4A43] hover:text-[#1B1B18] font-plex-mono border border-[#1B1B18]/20 px-3 py-1.5 rounded-sm hover:bg-[#1B1B18]/5 transition-colors"
            >
              {loading ? <Loader size={12} className="animate-spin inline mr-1" /> : null}
              Refresh
            </button>
            <button
              id="admin-panel-close"
              onClick={onClose}
              className="p-1.5 rounded-sm hover:bg-[#1B1B18]/10 text-[#4A4A43] hover:text-[#1B1B18] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[#1B1B18]/10">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A43]" />
            <input
              id="admin-search"
              type="text"
              placeholder="Search by email, name, or wallet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#EAE6D9] border border-[#1B1B18]/20 rounded-sm py-2 pl-8 pr-3 text-sm text-[#1B1B18] placeholder:text-[#4A4A43]/50 focus:outline-none focus:border-[#14213D] font-plex-mono"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="flex items-center gap-2 m-6 p-3 bg-[#B23A2E]/10 border border-[#B23A2E]/30 rounded-sm text-[#B23A2E] text-sm font-plex-mono">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {loading && !users.length ? (
            <div className="flex items-center justify-center py-16 text-[#4A4A43]">
              <Loader size={20} className="animate-spin mr-2" />
              <span className="font-plex-mono text-sm">Loading users...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#4A4A43]">
              <Users size={32} className="mb-3 opacity-30" />
              <p className="font-plex-mono text-sm">{search ? "No users match your search" : "No users yet"}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1B1B18]/15 bg-[#EAE6D9]/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#4A4A43] uppercase tracking-wider font-plex-mono">
                    <span className="flex items-center gap-1.5"><Mail size={11} /> Email</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A4A43] uppercase tracking-wider font-plex-mono">
                    <span className="flex items-center gap-1.5"><Users size={11} /> Name</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A4A43] uppercase tracking-wider font-plex-mono hidden lg:table-cell">
                    <span className="flex items-center gap-1.5"><Wallet size={11} /> Wallet</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A4A43] uppercase tracking-wider font-plex-mono hidden md:table-cell">
                    <span className="flex items-center gap-1.5"><Calendar size={11} /> Joined</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A4A43] uppercase tracking-wider font-plex-mono">Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-[#1B1B18]/8 hover:bg-[#EAE6D9]/40 transition-colors ${i % 2 === 0 ? "" : "bg-[#EAE6D9]/20"}`}
                  >
                    <td className="px-6 py-3 font-plex-mono text-[#1B1B18]">{u.email}</td>
                    <td className="px-4 py-3 text-[#1B1B18]">{u.display_name || <span className="text-[#4A4A43]/50 italic">—</span>}</td>
                    <td className="px-4 py-3 font-plex-mono text-[#4A4A43] hidden lg:table-cell text-xs">
                      {u.wallet_address
                        ? `${u.wallet_address.slice(0, 6)}…${u.wallet_address.slice(-4)}`
                        : <span className="text-[#4A4A43]/40 italic">not linked</span>}
                    </td>
                    <td className="px-4 py-3 font-plex-mono text-[#4A4A43] text-xs hidden md:table-cell">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_admin ? (
                        <span className="px-2 py-0.5 bg-[#8C6A1E]/15 border border-[#8C6A1E]/40 text-[#8C6A1E] text-xs font-plex-mono rounded-sm uppercase">Admin</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#14213D]/8 border border-[#14213D]/20 text-[#14213D] text-xs font-plex-mono rounded-sm uppercase">User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1B1B18]/15 text-xs text-[#4A4A43] font-plex-mono">
          Showing {filtered.length} of {users.length} registered users
        </div>
      </div>
    </div>
  );
}
