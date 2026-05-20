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
      .then((d) => { if (d.success) setProfile({ ...d.data, phone: d.data.phone || "" }); });
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
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", color: "#2b312c" }}>基本信息</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "flex-start", width: isMobile ? "100%" : undefined }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "60px", fontSize: "14px", color: "#8d918b", textAlign: "center" }}>用户名</span>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
            style={{ width: isMobile ? "100%" : "320px", height: "54px", padding: "0 16px", fontSize: "14px", background: "#fcfaf7", border: "1px solid #e8e1d8", borderRadius: "16px", outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#29543f"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,84,63,.08)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#e8e1d8"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "60px", fontSize: "14px", color: "#8d918b", textAlign: "center" }}>邮箱</span>
          <input
            type="email"
            value={profile.email}
            disabled
            style={{ width: isMobile ? "100%" : "320px", height: "52px", padding: "0 16px", fontSize: "14px", background: "rgba(255,255,255,.45)", border: "1px solid #e5e7eb", borderRadius: "14px", outline: "none", color: "#999", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "60px", fontSize: "14px", color: "#8d918b", textAlign: "center" }}>手机号</span>
          <input
            type="tel"
            placeholder="选填"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            style={{ width: isMobile ? "100%" : "320px", height: "54px", padding: "0 16px", fontSize: "14px", background: "#fcfaf7", border: "1px solid #e8e1d8", borderRadius: "16px", outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#29543f"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(41,84,63,.08)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#e8e1d8"; e.currentTarget.style.boxShadow = "none"; }}
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
              background: "linear-gradient(135deg, #29543f, #183f2c)",
              color: "#fff", border: "none", borderRadius: "14px",
              boxShadow: "0 10px 24px rgba(24,63,44,.18)",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              transition: "transform 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "linear-gradient(135deg, #2f5e46, #204835)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = "linear-gradient(135deg, #29543f, #183f2c)"; }}
          >
            {loading ? "保存中..." : "保存修改"}
          </button>
        </div>
      </form>
    </div>
  );
}
