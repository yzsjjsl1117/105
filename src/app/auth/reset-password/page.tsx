"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBreakpoint } from "@/lib/useBreakpoint";

function ResetForm() {
  const { isMobile } = useBreakpoint();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("无效的重置链接");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess("密码已重置，即将跳转...");
      setTimeout(() => router.push("/auth/login"), 2000);
    } else {
      setError(data.message);
    }
  }

  const inputStyle = {
    width: "100%",
    height: "52px",
    padding: "0 20px",
    fontSize: "15px",
    border: "1px solid #e0dbd2",
    borderRadius: "14px",
    outline: "none",
    background: "#fdfcf9",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f6f2", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "80px 20px 40px" : "80px 40px 60px" }}>
      <div style={{
        background: "rgba(255,255,255,.72)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(0,0,0,.04)", boxShadow: "0 10px 40px rgba(0,0,0,.06)",
        borderRadius: "24px", padding: isMobile ? "40px 28px" : "56px 48px",
        maxWidth: "420px", width: "100%",
      }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "28px", color: "#1a3a2a", margin: "0 0 6px" }}>设置新密码</h1>
          <p style={{ fontSize: "14px", color: "#8b867c", margin: 0 }}>请输入您的新密码</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input type="password" placeholder="新密码" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="确认新密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle} />
          {error && <p style={{ color: "#dc2626", fontSize: "13px", margin: 0 }}>{error}</p>}
          {success && <p style={{ color: "#16a34a", fontSize: "13px", margin: 0 }}>{success}</p>}
          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", height: "52px", fontSize: "16px", fontWeight: 600,
              border: "none", borderRadius: "14px", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1, marginTop: "4px",
              background: "linear-gradient(135deg, #183f2c, #28563f)",
              color: "#fff",
              boxShadow: "0 8px 24px rgba(24,63,44,.25)",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {loading ? "重置中..." : "重置密码"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: "center", color: "#888", marginTop: "120px" }}>加载中...</p>}>
      <ResetForm />
    </Suspense>
  );
}
