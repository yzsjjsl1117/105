"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useBreakpoint } from "@/lib/useBreakpoint";

const NAV_ITEMS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/products", label: "商品管理" },
  { href: "/admin/orders", label: "订单管理" },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const { isMobile } = useBreakpoint();

  return (
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: isMobile ? "8px 16px" : "8px 64px 8px 44px", background: "#fff",
      borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : "32px" }}>
        <Link href="/admin" style={{
          fontFamily: "var(--font-serif-cn)", fontSize: isMobile ? "16px" : "18px",
          color: "#1a3a2a", textDecoration: "none", fontWeight: 600,
        }}>
          瀹岭后台
        </Link>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontSize: isMobile ? "12px" : "14px",
                color: isActive ? "#1a3a2a" : "#888",
                textDecoration: "none",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <button onClick={() => signOut({ redirect: false })} style={{ fontSize: isMobile ? "12px" : "13px", color: "#888", background: "none", border: "none", cursor: "pointer" }}>
        退出登录
      </button>
    </nav>
  );
}
