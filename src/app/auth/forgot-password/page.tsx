"use client";

import { useState } from "react";
import Link from "next/link";
import { useBreakpoint } from "@/lib/useBreakpoint";

export default function ForgotPasswordPage() {
  const { isMobile } = useBreakpoint();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess(data.message);
    } else {
      setError(data.message);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "24px", color: "#1a3a2a", margin: "0 0 4px" }}>瀹岭</h1>
        <p style={{ fontSize: "16px", color: "#333", fontWeight: 600 }}>找回密码</p>
        <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>输入注册邮箱，我们将发送重置链接</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <input type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: isMobile ? "100%" : "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "13px" }}>{success}</p>}
        <button type="submit" disabled={loading} style={{ width: "170px", padding: "10px", fontSize: "14px", fontWeight: 600, background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "发送中..." : "发送重置链接"}
        </button>
        <p style={{ fontSize: "13px", color: "#888" }}>
          <Link href="/auth/login" style={{ color: "#1a3a2a" }}>← 返回登录</Link>
        </p>
      </form>
    </div>
  );
}
