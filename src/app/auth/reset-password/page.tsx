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

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "24px", color: "#1a3a2a", margin: "0 0 4px" }}>瀹岭</h1>
        <p style={{ fontSize: "16px", color: "#333", fontWeight: 600 }}>设置新密码</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <input type="password" placeholder="新密码" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: isMobile ? "100%" : "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        <input type="password" placeholder="确认新密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: isMobile ? "100%" : "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "13px" }}>{success}</p>}
        <button type="submit" disabled={loading} style={{ width: "170px", padding: "10px", fontSize: "14px", fontWeight: 600, background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "重置中..." : "重置密码"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: "center", color: "#888" }}>加载中...</p>}>
      <ResetForm />
    </Suspense>
  );
}
