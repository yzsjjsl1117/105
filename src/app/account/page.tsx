import type { Metadata } from "next";
import AccountContent from "./AccountContent";

export const metadata: Metadata = { title: "个人中心 - 瀹岭" };

export default function AccountPage() {
  return <AccountContent />;
}
