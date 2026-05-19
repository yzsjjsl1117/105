"use client";

import { useState, useEffect } from "react";
import { useBreakpoint } from "@/lib/useBreakpoint";

interface Profile {
  name: string;
  email: string;
  phone: string;
}

export default function ProfileForm() {
  const { isMobile } = useBreakpoint();
  const [profile, setProfile] = useState<Profile>({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProfile(d.data); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name, phone: profile.phone || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess("保存成功");
    } else {
      setError(data.message);
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>基本信息</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "flex-start", width: isMobile ? "100%" : undefined }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "60px", fontSize: "14px", color: "#666", textAlign: "center" }}>用户名</span>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
            style={{ width: isMobile ? "100%" : "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "60px", fontSize: "14px", color: "#666", textAlign: "center" }}>邮箱</span>
          <input
            type="email"
            value={profile.email}
            disabled
            style={{ width: isMobile ? "100%" : "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e7eb", borderRadius: "6px", outline: "none", background: "#f9fafb", color: "#999" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "60px", fontSize: "14px", color: "#666", textAlign: "center" }}>手机号</span>
          <input
            type="tel"
            placeholder="选填"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            style={{ width: isMobile ? "100%" : "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
          />
        </div>
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "13px" }}>{success}</p>}
        <div style={{ marginTop: "8px", width: isMobile ? "100%" : "392px", display: "flex", justifyContent: "center" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "140px", padding: "9px", fontSize: "14px", fontWeight: 600,
              background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "保存中..." : "保存修改"}
          </button>
        </div>
      </form>
    </div>
  );
}
