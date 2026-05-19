"use client";

import { useState } from "react";
import { useBreakpoint } from "@/lib/useBreakpoint";
import AccountSidebar from "@/components/AccountSidebar";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";
import AddressList from "./AddressList";
import OrderList from "./OrderList";

type Tab = "profile" | "orders" | "addresses" | "password";

export default function AccountContent() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { isMobile } = useBreakpoint();

  return (
    <div style={{ maxWidth: isMobile ? "100%" : "800px", margin: "0 auto", padding: isMobile ? "24px 16px" : "48px 24px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "32px" }}>个人中心</h2>
      <div style={{ display: "flex", gap: isMobile ? "16px" : "24px", flexDirection: isMobile ? "column" : "row" }}>
        <AccountSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ flex: 1 }}>
          {activeTab === "profile" && <ProfileForm />}
          {activeTab === "orders" && <OrderList />}
          {activeTab === "addresses" && <AddressList />}
          {activeTab === "password" && <PasswordForm />}
        </div>
      </div>
    </div>
  );
}
