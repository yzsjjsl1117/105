"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function AddToCart({ productId }: { productId: string }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    setLoading(true);
    await addItem(productId, quantity);
    setLoading(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: "6px", overflow: "hidden" }}>
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          style={{ width: "32px", height: "36px", border: "none", background: "#f9fafb", cursor: "pointer", fontSize: "16px", color: "#555" }}
        >
          −
        </button>
        <span style={{ width: "40px", textAlign: "center", fontSize: "14px", fontWeight: 600, lineHeight: "36px" }}>{quantity}</span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          style={{ width: "32px", height: "36px", border: "none", background: "#f9fafb", cursor: "pointer", fontSize: "16px", color: "#555" }}
        >
          +
        </button>
      </div>
      <button
        onClick={handleAdd}
        disabled={loading || added}
        style={{
          padding: "10px 24px",
          fontSize: "14px",
          fontWeight: 600,
          border: "none",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
          background: added ? "#16a34a" : "#1a3a2a",
          color: "#fff",
          transition: "background 0.3s",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {added ? "已加入 ✓" : loading ? "加入中..." : "加入购物车"}
      </button>
    </div>
  );
}
