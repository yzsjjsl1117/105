"use client";

import { useState } from "react";
import { useBreakpoint } from "@/lib/useBreakpoint";
import AccountSidebar from "@/components/AccountSidebar";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";
import AddressList from "./AddressList";
import OrderList from "./OrderList";
import s from "./account.module.css";

type Tab = "profile" | "orders" | "addresses" | "password";

export default function AccountContent() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const tabLabels: Record<Tab, string> = {
    profile: "个人信息",
    orders: "我的订单",
    addresses: "收货地址",
    password: "修改密码",
  };

  return (
    <div className={s.page}>
      {/* 顶部横幅 — 全宽 */}
      <div className={s.banner} style={{ overflow: "hidden" }}>
        <img src="/images/banner.png" alt="" />
      </div>

      {/* 主体 */}
      <div className={s.container}>
        <div className={s.body}>
          <AccountSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <div className={s["content-card"]}>
            {activeTab === "profile" && <ProfileForm />}
            {activeTab === "orders" && <OrderList />}
            {activeTab === "addresses" && <AddressList />}
            {activeTab === "password" && <PasswordForm />}
          </div>
        </div>
      </div>

    </div>
  );
}
