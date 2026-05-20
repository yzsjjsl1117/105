"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function BuyNowButton({ productId }: { productId: string }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);

  async function handleBuyNow() {
    setLoading(true);
    await addItem(productId, 1);
    router.push("/checkout");
  }

  return (
    <button
      onClick={handleBuyNow}
      disabled={loading}
      style={{
        width: "240px", height: "54px", fontSize: "14px", fontWeight: 600,
        background: "#1a3a2a", color: "#fff", border: "none",
        borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        boxShadow: "0 2px 8px rgba(26,58,42,0.15)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(26,58,42,0.25)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(26,58,42,0.15)"; }}
    >
      {loading ? "处理中..." : "立即购买"}
    </button>
  );
}
