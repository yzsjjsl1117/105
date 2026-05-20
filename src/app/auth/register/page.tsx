"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBreakpoint } from "@/lib/useBreakpoint";

export default function RegisterPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword, phone: phone || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/account");
    router.refresh();
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

  const content = (
    <div style={{ maxWidth: "420px", width: "100%" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "28px", color: "#1a3a2a", margin: "0 0 6px" }}>
          创建账号
        </h1>
        <p style={{ fontSize: "14px", color: "#8b867c", margin: 0 }}>加入瀹岭，开启茶之旅</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <input type="text" placeholder="用户名" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        <input type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="确认密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle} />
        <input type="tel" placeholder="手机号（选填）" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
        {error && <p style={{ color: "#dc2626", fontSize: "13px", margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
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
          {loading ? "注册中..." : "注 册"}
        </button>
        <p style={{ fontSize: "13px", color: "#8b867c", textAlign: "center", margin: 0 }}>
          已有账号？<Link href="/auth/login" style={{ color: "#1a3a2a", fontWeight: 600 }}>立即登录</Link>
        </p>
      </form>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8f6f2", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "80px 20px 40px" : "80px 40px 60px" }}>
      <div style={{
        background: "rgba(255,255,255,.72)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(0,0,0,.04)", boxShadow: "0 10px 40px rgba(0,0,0,.06)",
        borderRadius: "24px", padding: isMobile ? "40px 28px" : "56px 48px",
        maxWidth: "480px", width: "100%",
      }}>
        {content}
      </div>
    </div>
  );
}
