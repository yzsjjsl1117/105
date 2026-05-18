"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("邮箱或密码错误");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "24px", color: "#1a3a2a", margin: "0 0 4px" }}>
          瀹岭
        </h1>
        <p style={{ fontSize: "16px", color: "#333", fontWeight: 600 }}>欢迎回来</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <input
          type="email"
          placeholder="邮箱地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "320px", padding: "10px 12px", fontSize: "14px",
            border: "1px solid #d1d5db", borderRadius: "6px", outline: "none",
          }}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "320px", padding: "10px 12px", fontSize: "14px",
            border: "1px solid #d1d5db", borderRadius: "6px", outline: "none",
          }}
        />
        <div style={{ width: "320px", textAlign: "right" }}>
          <Link href="/auth/forgot-password" style={{ fontSize: "12px", color: "#888" }}>
            忘记密码？
          </Link>
        </div>
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "170px", padding: "10px", fontSize: "14px", fontWeight: 600,
            background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "登录中..." : "登 录"}
        </button>
        <p style={{ fontSize: "13px", color: "#888" }}>
          还没有账号？<Link href="/auth/register" style={{ color: "#1a3a2a" }}>立即注册</Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: "center", color: "#888" }}>加载中...</p>}>
      <LoginForm />
    </Suspense>
  );
}
