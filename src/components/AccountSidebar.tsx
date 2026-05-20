"use client";

import s from "@/app/account/account.module.css";

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
  return (
    <nav className={s.sidebar}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`${s["sidebar-item"]} ${activeTab === tab.key ? s["sidebar-item-active"] : ""}`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
