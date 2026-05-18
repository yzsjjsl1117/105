"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartContent() {
  const { items, loading, updateQuantity, removeItem, totalCount, totalPrice } = useCart();

  if (loading) {
    return (
      <div style={{ paddingTop: "80px", textAlign: "center", color: "#888" }}>加载中...</div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "96px 24px 48px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1F2D24", marginBottom: "32px" }}>购物车</h2>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: "15px", color: "#888", marginBottom: "24px" }}>购物车是空的</p>
            <Link href="/#products" style={{ padding: "10px 24px", background: "#1a3a2a", color: "#fff", borderRadius: "6px", fontSize: "14px", textDecoration: "none" }}>
              去选购茶叶
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", padding: "0 0 12px", borderBottom: "2px solid #e0e0e0", marginBottom: "16px", fontSize: "13px", color: "#888" }}>
              <span style={{ flex: 1 }}>商品</span>
              <span style={{ width: "120px", textAlign: "center" }}>单价</span>
              <span style={{ width: "140px", textAlign: "center" }}>数量</span>
              <span style={{ width: "100px", textAlign: "right" }}>小计</span>
              <span style={{ width: "60px" }} />
            </div>

            {/* Items */}
            {items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "6px", overflow: "hidden", background: "#f0ebe0", flexShrink: 0 }}>
                    {item.product?.images?.[0] && (
                      <img src={item.product.images[0]} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <Link href={`/products/${item.product?.slug}`} style={{ fontSize: "15px", color: "#333", textDecoration: "none" }}>
                    {item.product?.name || "加载中..."}
                  </Link>
                </div>

                <div style={{ width: "120px", textAlign: "center", fontSize: "14px", color: "#555" }}>
                  ¥{Number(item.product?.price || 0)}
                </div>

                <div style={{ width: "140px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    style={{ width: "28px", height: "28px", border: "1px solid #d1d5db", background: "#fff", borderRadius: "4px 0 0 4px", cursor: "pointer", fontSize: "14px" }}
                  >−</button>
                  <input value={item.quantity} readOnly style={{ width: "44px", height: "28px", border: "1px solid #d1d5db", borderLeft: "none", borderRight: "none", textAlign: "center", fontSize: "13px", outline: "none" }} />
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{ width: "28px", height: "28px", border: "1px solid #d1d5db", background: "#fff", borderRadius: "0 4px 4px 0", cursor: "pointer", fontSize: "14px" }}
                  >+</button>
                </div>

                <div style={{ width: "100px", textAlign: "right", fontSize: "15px", fontWeight: 600, color: "#1a3a2a" }}>
                  ¥{(Number(item.product?.price) || 0) * item.quantity}
                </div>

                <div style={{ width: "60px", textAlign: "center" }}>
                  <button onClick={() => removeItem(item.id)} style={{ fontSize: "12px", color: "#999", border: "none", background: "none", cursor: "pointer" }}>删除</button>
                </div>
              </div>
            ))}

            {/* Checkout bar */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "24px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e0e0e0" }}>
              <span style={{ fontSize: "14px", color: "#666" }}>共 <b>{totalCount}</b> 件</span>
              <span style={{ fontSize: "14px", color: "#888" }}>合计</span>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#1a3a2a" }}>¥{totalPrice}</span>
              <Link href="/checkout" style={{ padding: "12px 32px", background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}>
                去结算
              </Link>
            </div>
          </>
        )}
    </div>
  );
}
