"use client";

import { useBreakpoint } from "@/lib/useBreakpoint";

type Tab = "profile" | "orders" | "addresses" | "password";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { key: Tab; label: string }[] = [
  { key: "profile", label: "个人信息" },
  { key: "orders", label: "我的订单" },
  { key: "addresses", label: "收货地址" },
  { key: "password", label: "修改密码" },
];

export default function AccountSidebar({ activeTab, onTabChange }: Props) {
  const { isMobile } = useBreakpoint();

  return (
    <nav
      style={{
        display: "flex",
        flexDirection: isMobile ? "row" : "column",
        width: isMobile ? "100%" : "180px",
        borderBottom: isMobile ? "1px solid #e0e0e0" : undefined,
        borderRight: isMobile ? undefined : "1px solid #e0e0e0",
        paddingRight: isMobile ? 0 : "16px",
        paddingBottom: isMobile ? "8px" : 0,
        marginBottom: isMobile ? "8px" : 0,
        flexShrink: 0,
        overflowX: isMobile ? "auto" : "visible",
        whiteSpace: isMobile ? "nowrap" : "normal",
        gap: isMobile ? "4px" : 0,
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            padding: "12px 16px",
            fontSize: "14px",
            cursor: "pointer",
            borderRadius: "4px",
            marginBottom: isMobile ? 0 : "4px",
            color: activeTab === tab.key ? "#fff" : "#555",
            background: activeTab === tab.key ? "#1a3a2a" : "transparent",
            fontWeight: activeTab === tab.key ? 600 : 400,
            flexShrink: 0,
          }}
        >
          {tab.label}
        </div>
      ))}
    </nav>
  );
}
