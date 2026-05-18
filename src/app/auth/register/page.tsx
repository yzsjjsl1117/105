"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

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

    // 注册成功 → 自动登录
    await signIn("credentials", { email, password, redirect: false });
    router.push("/account");
    router.refresh();
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "24px", color: "#1a3a2a", margin: "0 0 4px" }}>
          瀹岭
        </h1>
        <p style={{ fontSize: "16px", color: "#333", fontWeight: 600 }}>创建账号</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <input type="text" placeholder="用户名" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        <input type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        <input type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        <input type="password" placeholder="确认密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        <input type="tel" placeholder="手机号（选填）" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: "170px", padding: "10px", fontSize: "14px", fontWeight: 600, background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "注册中..." : "注 册"}
        </button>
        <p style={{ fontSize: "13px", color: "#888" }}>
          已有账号？<Link href="/auth/login" style={{ color: "#1a3a2a" }}>立即登录</Link>
        </p>
      </form>
    </div>
  );
}
