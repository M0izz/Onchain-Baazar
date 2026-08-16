import React, { useState } from "react";
import { User, Mail, Wallet, Calendar, Edit2, Check, X, Loader, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function UserProfilePanel({ isOpen, onClose }) {
  const { user, updateProfile, logout } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [editingWallet, setEditingWallet] = useState(false);
  const [nameVal, setNameVal] = useState(user?.display_name || "");
  const [walletVal, setWalletVal] = useState(user?.wallet_address || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen || !user) return null;

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const save = async (fields) => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await updateProfile(fields);
      setSuccess("Saved!");
      setEditingName(false);
      setEditingWallet(false);
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#14213D]/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-[#F3F0E4] border border-[#1B1B18]/20 shadow-2xl rounded-sm mt-16 mr-0 flex flex-col max-h-[calc(100vh-5rem)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1B1B18]/15">
          <h2 className="font-zilla font-bold text-[#1B1B18] text-lg">My Profile</h2>
          <button
            id="profile-panel-close"
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-[#1B1B18]/10 text-[#4A4A43] hover:text-[#1B1B18] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-sm bg-[#14213D] flex items-center justify-center text-[#EAE6D9] font-zilla font-bold text-2xl select-none">
              {(user.display_name || user.email || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[#1B1B18] font-zilla">{user.display_name || "Unnamed"}</p>
              <p className="text-xs text-[#4A4A43] font-plex-mono">{user.email}</p>
              {user.is_admin && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-[#8C6A1E]/20 border border-[#8C6A1E]/40 text-[#8C6A1E] text-xs font-plex-mono rounded-sm uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#B23A2E]/10 border border-[#B23A2E]/30 rounded-sm text-[#B23A2E] text-xs font-plex-mono">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-[#2F6845]/10 border border-[#2F6845]/30 rounded-sm text-[#2F6845] text-xs font-plex-mono">
              <Check size={12} /> {success}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-4">
            {/* Display Name */}
            <ProfileField
              id="profile-display-name"
              icon={<User size={14} />}
              label="Display Name"
              editing={editingName}
              value={nameVal}
              displayValue={user.display_name || "Not set"}
              onChange={setNameVal}
              onEdit={() => { setNameVal(user.display_name || ""); setEditingName(true); }}
              onCancel={() => setEditingName(false)}
              onSave={() => save({ display_name: nameVal })}
              saving={saving}
            />

            {/* Email (read-only) */}
            <div>
              <p className="text-xs font-semibold text-[#4A4A43] uppercase tracking-wider mb-1.5 font-plex-mono flex items-center gap-1.5">
                <Mail size={12} /> Email
              </p>
              <p className="text-sm text-[#1B1B18] font-plex-mono bg-[#EAE6D9]/60 border border-[#1B1B18]/10 rounded-sm px-3 py-2">
                {user.email}
              </p>
            </div>

            {/* Wallet Address */}
            <ProfileField
              id="profile-wallet-address"
              icon={<Wallet size={14} />}
              label="Wallet Address"
              editing={editingWallet}
              value={walletVal}
              displayValue={
                user.wallet_address
                  ? `${user.wallet_address.slice(0, 6)}…${user.wallet_address.slice(-4)}`
                  : "Not linked"
              }
              onChange={setWalletVal}
              onEdit={() => { setWalletVal(user.wallet_address || ""); setEditingWallet(true); }}
              onCancel={() => setEditingWallet(false)}
              onSave={() => save({ wallet_address: walletVal })}
              saving={saving}
              placeholder="0x..."
              mono
            />

            {/* Joined */}
            <div>
              <p className="text-xs font-semibold text-[#4A4A43] uppercase tracking-wider mb-1.5 font-plex-mono flex items-center gap-1.5">
                <Calendar size={12} /> Member Since
              </p>
              <p className="text-sm text-[#4A4A43] font-plex-mono">{joined}</p>
            </div>
          </div>

          {/* Logout */}
          <div className="pt-2 border-t border-[#1B1B18]/15">
            <button
              id="profile-logout-btn"
              onClick={handleLogout}
              className="w-full py-2 text-sm font-semibold text-[#B23A2E] border border-[#B23A2E]/30 rounded-sm hover:bg-[#B23A2E]/10 transition-colors font-plex-mono"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ id, icon, label, editing, value, displayValue, onChange, onEdit, onCancel, onSave, saving, placeholder, mono }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#4A4A43] uppercase tracking-wider mb-1.5 font-plex-mono flex items-center gap-1.5">
        {icon} {label}
      </p>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 bg-[#EAE6D9] border border-[#14213D]/50 rounded-sm py-2 px-3 text-sm text-[#1B1B18] focus:outline-none focus:border-[#14213D] ${mono ? "font-plex-mono" : ""}`}
          />
          <button
            onClick={onSave}
            disabled={saving}
            className="p-2 bg-[#14213D] text-[#EAE6D9] rounded-sm hover:bg-[#0d1830] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader size={13} className="animate-spin" /> : <Check size={13} />}
          </button>
          <button onClick={onCancel} className="p-2 text-[#4A4A43] border border-[#1B1B18]/20 rounded-sm hover:bg-[#1B1B18]/10 transition-colors">
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between group">
          <span className={`text-sm text-[#1B1B18] ${mono ? "font-plex-mono" : ""}`}>{displayValue}</span>
          <button
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 p-1 text-[#4A4A43] hover:text-[#14213D] transition-all"
          >
            <Edit2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
