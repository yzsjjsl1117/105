"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useBreakpoint } from "@/lib/useBreakpoint";
import styles from "./login.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const { isMobile } = useBreakpoint();

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

  const inputStyle = {
    width: "100%",
    height: "52px",
    padding: "0 20px",
    fontSize: "15px",
    border: "1px solid rgba(31,42,36,.08)",
    borderRadius: "14px",
    outline: "none",
    background: "rgba(255,255,255,.45)",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box" as const,
  };

  const cardContent = (
    <div style={{ maxWidth: "420px", width: "100%" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "28px", color: "#1a3a2a", margin: "0 0 6px" }}>
          欢迎回来
        </h1>
        <p style={{ fontSize: "14px", color: "#8b867c", margin: 0 }}>登录您的瀹岭账号</p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        onFocusCapture={(e) => {
          const target = e.target;
          if (target instanceof HTMLInputElement) {
            target.style.borderColor = "#2f5b45";
            target.style.boxShadow = "0 0 0 4px rgba(47,91,69,.08)";
          }
        }}
        onBlurCapture={(e) => {
          const target = e.target;
          if (target instanceof HTMLInputElement) {
            target.style.borderColor = "rgba(31,42,36,.08)";
            target.style.boxShadow = "none";
          }
        }}
      >
        <input
          type="email"
          placeholder="邮箱地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <div style={{ textAlign: "right" }}>
          <Link href="/auth/forgot-password" style={{ fontSize: "13px", color: "#8b867c", textDecoration: "none" }}>
            忘记密码？
          </Link>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: "13px", margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "160px",
            height: "52px",
            fontSize: "16px",
            fontWeight: 600,
            border: "none",
            borderRadius: "14px",
            alignSelf: "center",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.8 : 1,
            background: "linear-gradient(135deg, #29543f, #183f2c)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(24,63,44,.25)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            marginTop: "4px",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {loading ? "登录中..." : "登 录"}
        </button>

        <p style={{ fontSize: "13px", color: "#8b867c", textAlign: "center", margin: 0 }}>
          还没有账号？<Link href="/auth/register" style={{ color: "#1a3a2a", fontWeight: 600 }}>立即注册</Link>
        </p>
      </form>
    </div>
  );

  // Mobile: simple centered card
  if (isMobile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F6F0E6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px 40px",
        }}
      >
        <div className={styles.card} style={{ padding: "40px 28px", width: "100%" }}>
          {cardContent}
        </div>
      </div>
    );
  }

  // Desktop: slogan overlay + login card
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F4EDE2",
        position: "relative",
      }}
    >
      {/* Slogan 图叠加在背景上 */}
      <div
        style={{
          position: "absolute",
          top: "56px",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <img
          src="/images/slogan.png"
          alt=""
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "auto",
            height: "100%",
            objectFit: "contain",
            objectPosition: "left center",
            maskImage: "linear-gradient(to right, black 0%, black 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 0%, black 60%, transparent 100%)",
          }}
        />
      </div>

      {/* Login form — right aligned */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "80px 10% 60px 0px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className={styles.card} style={{ padding: "56px 48px", maxWidth: "460px", width: "100%" }}>
          {cardContent}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: "center", color: "#888", marginTop: "120px" }}>加载中...</p>}>
      <LoginForm />
    </Suspense>
  );
}
