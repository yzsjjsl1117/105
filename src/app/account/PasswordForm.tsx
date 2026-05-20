"use client";

import { useState } from "react";
import { useBreakpoint } from "@/lib/useBreakpoint";

export default function PasswordForm() {
  const { isMobile } = useBreakpoint();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess("密码修改成功");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(data.message);
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", color: "#2b312c" }}>修改密码</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "80px", fontSize: "14px", color: "#8d918b", textAlign: "center" }}>当前密码</span>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={{ width: isMobile ? "100%" : "320px", height: "54px", padding: "0 16px", fontSize: "14px", background: "#fcfaf7", border: "1px solid #e8e1d8", borderRadius: "16px", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "80px", fontSize: "14px", color: "#8d918b", textAlign: "center" }}>新密码</span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ width: isMobile ? "100%" : "320px", height: "54px", padding: "0 16px", fontSize: "14px", background: "#fcfaf7", border: "1px solid #e8e1d8", borderRadius: "16px", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "80px", fontSize: "14px", color: "#8d918b", textAlign: "center" }}>确认新密码</span>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: isMobile ? "100%" : "320px", height: "54px", padding: "0 16px", fontSize: "14px", background: "#fcfaf7", border: "1px solid #e8e1d8", borderRadius: "16px", outline: "none", boxSizing: "border-box" }} />
        </div>
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "13px" }}>{success}</p>}
        <div style={{ marginTop: "8px", width: isMobile ? "100%" : "412px", display: "flex", justifyContent: "center" }}>
          <button type="submit" disabled={loading} style={{ width: "140px", padding: "9px", fontSize: "14px", fontWeight: 600, background: "linear-gradient(135deg, #29543f, #183f2c)", color: "#fff", border: "none", borderRadius: "14px", boxShadow: "0 10px 24px rgba(24,63,44,.18)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "transform 0.2s ease, background 0.2s ease" }} onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "linear-gradient(135deg, #2f5e46, #204835)"; } }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = "linear-gradient(135deg, #29543f, #183f2c)"; }} >
            {loading ? "修改中..." : "修改密码"}
          </button>
        </div>
      </form>
    </div>
  );
}
