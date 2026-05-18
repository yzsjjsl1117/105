"use client";

import { useState } from "react";
import AccountSidebar from "@/components/AccountSidebar";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";
import AddressList from "./AddressList";
import OrderList from "./OrderList";

type Tab = "profile" | "orders" | "addresses" | "password";

export default function AccountContent() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div style={{ display: "flex", gap: "24px" }}>
      <AccountSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ flex: 1 }}>
        {activeTab === "profile" && <ProfileForm />}
        {activeTab === "orders" && <OrderList />}
        {activeTab === "addresses" && <AddressList />}
        {activeTab === "password" && <PasswordForm />}
      </div>
    </div>
  );
}
