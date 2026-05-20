"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import MiniCart from "./MiniCart";
import { useBreakpoint } from "@/lib/useBreakpoint";

export default function ShopNavbar() {
  const { data: session } = useSession();
  const { isMobile } = useBreakpoint();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: scrolled ? "rgba(246, 243, 238, 0.99)" : "rgba(246, 243, 238, 0.97)",
        borderBottom: scrolled ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(0, 0, 0, 0.05)",
        boxShadow: scrolled ? "0 4px 20px rgba(0, 0, 0, 0.08)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "8px 16px" : "8px 64px 8px 44px" }}>
        <div className="flex items-center justify-between">
          {/* 左侧：品牌（点击返回首页） */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <img
              src="/images/LOGO_transparent.png"
              alt="瀹岭"
              className="h-10 w-auto shrink-0"
            />
            <span className="font-serif-cn font-semibold text-[#1F2D24]" style={{ fontSize: isMobile ? "16px" : "20px" }}>瀹岭</span>
          </Link>

          {/* 右侧：购物车 + 登录/注册 */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "20px" }}>
            {/* 购物车图标 */}
            <MiniCart />

            {/* 登录状态 */}
            {session ? (
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "16px" }}>
                <Link
                  href="/account"
                  style={{ fontSize: isMobile ? "12px" : "14px", color: "#1F2D24", textDecoration: "none" }}
                >
                  {session.user?.name}
                </Link>
                <button
                  onClick={() => signOut({ redirect: false })}
                  style={{ fontSize: isMobile ? "12px" : "14px", color: "#888", background: "none", border: "none", cursor: "pointer" }}
                >
                  退出登录
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "16px" }}>
                <Link
                  href="/auth/login"
                  style={{ fontSize: isMobile ? "12px" : "14px", color: "#1F2D24", textDecoration: "none" }}
                >
                  登录
                </Link>
                <Link
                  href="/auth/register"
                  style={{ fontSize: isMobile ? "12px" : "14px", color: "#1F2D24", textDecoration: "none" }}
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
