import { Suspense } from "react";
import ShopLayout from "@/components/ShopLayout";
import PaymentSuccessContent from "./PaymentSuccessContent";

export default function PaymentSuccessPage() {
  return (
    <ShopLayout>
      <Suspense fallback={<div style={{ maxWidth: "500px", margin: "0 auto", padding: "120px 24px 48px", textAlign: "center", color: "#888" }}>加载中...</div>}>
        <PaymentSuccessContent />
      </Suspense>
    </ShopLayout>
  );
}
