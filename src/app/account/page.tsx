import type { Metadata } from "next";
import AccountContent from "./AccountContent";
import ShopLayout from "@/components/ShopLayout";

export const metadata: Metadata = { title: "个人中心 - 瀹岭" };

export default function AccountPage() {
  return (
    <ShopLayout>
      <AccountContent />
    </ShopLayout>
  );
}
