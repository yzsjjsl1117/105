"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "待付款", color: "#d97706", bg: "#fef3c7" },
  paid: { label: "已支付", color: "#059669", bg: "#d1fae5" },
  shipped: { label: "已发货", color: "#2563eb", bg: "#dbeafe" },
  completed: { label: "已完成", color: "#7c3aed", bg: "#ede9fe" },
  cancelled: { label: "已取消", color: "#dc2626", bg: "#fee2e2" },
  expired: { label: "已过期", color: "#9ca3af", bg: "#f3f4f6" },
};

interface OrderData {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { id: string; name: string; slug: string; images: string[] };
  }[];
}

export default function AdminOrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrder(d.data); })
      .finally(() => setLoading(false));
  }, [orderId]);

  async function updateStatus(status: string) {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrder((prev) => prev ? { ...prev, status } : prev);
  }

  if (loading) return <p style={{ textAlign: "center", color: "#888", padding: "60px 0" }}>加载中...</p>;
  if (!order) return <p style={{ textAlign: "center", color: "#888", padding: "60px 0" }}>订单不存在</p>;

  const s = STATUS_MAP[order.status] || { label: order.status, color: "#888", bg: "#f3f4f6" };

  return (
    <div style={{ maxWidth: "700px" }}>
      <Link href="/admin/orders" style={{ fontSize: "13px", color: "#1a3a2a", textDecoration: "none" }}>← 返回订单列表</Link>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2D24", marginTop: "16px", marginBottom: "24px" }}>
        订单详情
        <span style={{ marginLeft: "12px", padding: "3px 10px", borderRadius: "4px", fontSize: "13px", fontWeight: 600, color: s.color, background: s.bg }}>
          {s.label}
        </span>
      </h2>

      <div style={{ background: "#fff", borderRadius: "8px", padding: "16px", marginBottom: "16px", border: "1px solid #e5e7eb", fontSize: "13px" }}>
        <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{order.user.name}</p>
        <p style={{ margin: 0, color: "#888" }}>{order.user.email}</p>
      </div>

      {order.items.map((item) => (
        <div key={item.id} style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "4px", overflow: "hidden", background: "#f0ebe0", flexShrink: 0 }}>
            {item.product.images?.[0] && <img src={item.product.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "14px", margin: 0 }}>{item.product.name}</p>
            <p style={{ fontSize: "12px", color: "#888", margin: "2px 0 0" }}>×{item.quantity}</p>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>¥{Number(item.price) * item.quantity}</span>
        </div>
      ))}

      <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "16px", marginTop: "16px", fontSize: "13px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ color: "#888" }}>订单编号</span>
          <span style={{ fontFamily: "monospace" }}>{order.id}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ color: "#888" }}>下单时间</span>
          <span>{new Date(order.createdAt).toLocaleString("zh-CN")}</span>
        </div>
        {order.paymentMethod && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "#888" }}>支付方式</span>
            <span>{order.paymentMethod === "wechat" ? "微信支付" : order.paymentMethod === "alipay" ? "支付宝" : order.paymentMethod}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
          <span style={{ fontWeight: 600 }}>总金额</span>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#1a3a2a" }}>¥{Number(order.total)}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        {order.status === "paid" && (
          <button onClick={() => updateStatus("shipped")}
            style={{ padding: "10px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer" }}>
            标记发货
          </button>
        )}
        {(order.status === "paid" || order.status === "shipped") && (
          <button onClick={() => updateStatus("completed")}
            style={{ padding: "10px 28px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer" }}>
            标记完成
          </button>
        )}
      </div>
    </div>
  );
}
