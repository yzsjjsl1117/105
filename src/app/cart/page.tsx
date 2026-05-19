import type { Metadata } from "next";
import ShopLayout from "@/components/ShopLayout";
import CartContent from "./CartContent";

export const metadata: Metadata = { title: "购物车 - 瀹岭" };

export default function CartPage() {
  return (
    <ShopLayout>
      <CartContent />
    </ShopLayout>
  );
}
