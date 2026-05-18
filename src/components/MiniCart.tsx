"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function MiniCart() {
  const { items, totalCount, totalPrice } = useCart();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayItems = items.slice(0, 3);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ fontSize: "22px", background: "none", border: "none", cursor: "pointer", position: "relative", padding: "4px" }}
      >
        🛒
        {totalCount > 0 && (
          <span style={{
            position: "absolute", top: "-2px", right: "-6px",
            background: "#dc2626", color: "#fff", fontSize: "10px",
            fontWeight: 700, minWidth: "18px", height: "18px",
            borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: "8px",
          width: "300px", background: "#fff", borderRadius: "8px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb",
          zIndex: 100, padding: "12px",
        }}>
          {displayItems.length === 0 ? (
            <p style={{ textAlign: "center", color: "#aaa", fontSize: "13px", padding: "20px 0" }}>购物车是空的</p>
          ) : (
            <>
              {displayItems.map((item) => (
                <div key={item.id} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ width: "44px", height: "44px", background: "#f0ebe0", borderRadius: "4px", flexShrink: 0, overflow: "hidden" }}>
                    {item.product?.images?.[0] && (
                      <img src={item.product.images[0]} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.product?.name || "加载中..."}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", color: "#888" }}>×{item.quantity}</span>
                      <span style={{ fontSize: "13px", color: "#8A6A42" }}>¥{(Number(item.product?.price) || 0) * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "13px" }}>
                <span style={{ color: "#666" }}>共 {totalCount} 件</span>
                <span style={{ fontWeight: 700, color: "#1a3a2a" }}>¥{totalPrice}</span>
              </div>
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                style={{
                  display: "block", textAlign: "center", padding: "8px",
                  background: "#1a3a2a", color: "#fff", borderRadius: "6px",
                  fontSize: "13px", textDecoration: "none",
                }}
              >
                查看购物车 →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
