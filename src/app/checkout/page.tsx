import type { Metadata } from "next";
import ShopLayout from "@/components/ShopLayout";
import CheckoutContent from "./CheckoutContent";

export const metadata: Metadata = { title: "确认下单 - 瀹岭" };

export default function CheckoutPage() {
  return (
    <ShopLayout>
      <CheckoutContent />
    </ShopLayout>
  );
}
