"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import ShopNavbar from "@/components/ShopNavbar";

interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

export default function CheckoutContent() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setAddresses(d.data);
          const defaultAddr = d.data.find((a: Address) => a.isDefault);
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
          else if (d.data.length > 0) setSelectedAddressId(d.data[0].id);
        }
      });
  }, []);

  async function handleSubmit() {
    setError("");
    if (!selectedAddressId) {
      setError("请选择收货地址");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId: selectedAddressId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess(`订单号：${data.data.id}`);
      await clearCart();
    } else {
      setError(data.message);
    }
  }

  if (success) {
    return (
      <>
        <ShopNavbar />
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "120px 24px 48px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1a3a2a", marginBottom: "8px" }}>下单成功！</h2>
          <p style={{ fontSize: "14px", color: "#888", marginBottom: "8px" }}>{success}</p>
          <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "24px" }}>支付功能即将上线</p>
          <Link href="/account" style={{ padding: "10px 24px", background: "#1a3a2a", color: "#fff", borderRadius: "6px", fontSize: "14px", textDecoration: "none", display: "inline-block", marginRight: "12px" }}>
            查看订单
          </Link>
          <Link href="/" style={{ padding: "10px 24px", background: "#fff", color: "#1a3a2a", border: "1px solid #1a3a2a", borderRadius: "6px", fontSize: "14px", textDecoration: "none", display: "inline-block" }}>
            返回首页
          </Link>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <ShopNavbar />
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "120px 24px 48px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: "#888", marginBottom: "24px" }}>没有待下单的商品</p>
          <Link href="/cart" style={{ padding: "10px 24px", background: "#1a3a2a", color: "#fff", borderRadius: "6px", fontSize: "14px", textDecoration: "none" }}>
            返回购物车
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <ShopNavbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "96px 24px 48px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1F2D24", marginBottom: "32px" }}>确认下单</h2>

        {/* Shipping Address */}
        <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>收货地址</h3>
        {addresses.map((addr) => (
          <div
            key={addr.id}
            onClick={() => setSelectedAddressId(addr.id)}
            style={{
              padding: "12px",
              border: selectedAddressId === addr.id ? "2px solid #1a3a2a" : "1px solid #e5e7eb",
              borderRadius: "6px",
              marginBottom: "8px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            <b>{addr.name}</b> {addr.phone}
            {addr.isDefault && <span style={{ background: "#1a3a2a", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "3px", marginLeft: "8px" }}>默认</span>}
            <br />
            <span style={{ color: "#888" }}>{addr.province}{addr.city}{addr.district} {addr.detail}</span>
          </div>
        ))}

        {/* Order Items */}
        <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "24px 0 12px" }}>商品清单</h3>
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", padding: "8px 0" }}>
            <span>{item.product?.name} × {item.quantity}</span>
            <span style={{ color: "#555" }}>¥{(Number(item.product?.price) || 0) * item.quantity}</span>
          </div>
        ))}

        <hr style={{ margin: "16px 0", borderColor: "#e0e0e0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: 700 }}>
          <span>合计</span>
          <span style={{ color: "#1a3a2a" }}>¥{totalPrice}</span>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "12px" }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", marginTop: "24px", padding: "12px",
            background: "#1a3a2a", color: "#fff", border: "none",
            borderRadius: "6px", fontSize: "15px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "提交中..." : "提交订单"}
        </button>
      </div>
    </>
  );
}
