"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useBreakpoint } from "@/lib/useBreakpoint";

const STATUS_TABS = [
  { key: "", label: "全部" },
  { key: "pending_payment", label: "待付款" },
  { key: "paid", label: "已支付" },
  { key: "shipped", label: "已发货" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
  { key: "expired", label: "已过期" },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "待付款", color: "#d97706", bg: "#fef3c7" },
  paid: { label: "已支付", color: "#059669", bg: "#d1fae5" },
  shipped: { label: "已发货", color: "#2563eb", bg: "#dbeafe" },
  completed: { label: "已完成", color: "#7c3aed", bg: "#ede9fe" },
  cancelled: { label: "已取消", color: "#dc2626", bg: "#fee2e2" },
  expired: { label: "已过期", color: "#9ca3af", bg: "#f3f4f6" },
};

interface Order {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  user: { name: string; email: string };
  items: { quantity: number; product: { name: string } }[];
}

export default function AdminOrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    setLoading(true);
    const url = statusFilter
      ? `/api/admin/orders?status=${statusFilter}`
      : "/api/admin/orders";
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.data); })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  async function updateStatus(orderId: string, status: string) {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2D24", marginBottom: "24px" }}>订单管理</h2>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => (
          <span key={tab.key} onClick={() => setStatusFilter(tab.key)}
            style={{
              fontSize: "12px", padding: "4px 12px", borderRadius: "4px", cursor: "pointer",
              color: statusFilter === tab.key ? "#fff" : "#888",
              background: statusFilter === tab.key ? "#1a3a2a" : "transparent",
              border: "1px solid #e5e7eb",
            }}>
            {tab.label}
          </span>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#888", padding: "60px 0" }}>加载中...</p>
      ) : orders.length === 0 ? (
        <p style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>暂无订单</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: isMobile ? "700px" : undefined }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
              <th style={{ padding: "10px 8px", fontFamily: "monospace", fontSize: "12px" }}>订单号</th>
              <th style={{ padding: "10px 8px" }}>用户</th>
              <th style={{ padding: "10px 8px" }}>商品</th>
              <th style={{ padding: "10px 8px", width: "90px" }}>金额</th>
              <th style={{ padding: "10px 8px", width: "80px" }}>状态</th>
              <th style={{ padding: "10px 8px", width: "130px" }}>时间</th>
              <th style={{ padding: "10px 8px", width: "160px" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const s = STATUS_MAP[order.status] || { label: order.status, color: "#888", bg: "#f3f4f6" };
              return (
                <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px 8px", fontFamily: "monospace", fontSize: "11px" }}>{order.id.slice(0, 8)}...</td>
                  <td style={{ padding: "10px 8px" }}>{order.user.name || order.user.email}</td>
                  <td style={{ padding: "10px 8px", color: "#888" }}>
                    {order.items.slice(0, 2).map((i) => `${i.product.name}×${i.quantity}`).join("、")}
                    {order.items.length > 2 && ` 等${order.items.length}件`}
                  </td>
                  <td style={{ padding: "10px 8px", fontWeight: 600 }}>¥{Number(order.total)}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "3px", fontSize: "11px", fontWeight: 600, color: s.color, background: s.bg }}>
                      {s.label}
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", fontSize: "11px", color: "#888" }}>
                    {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <Link href={`/admin/orders/${order.id}`} style={{ fontSize: "11px", color: "#1a3a2a", textDecoration: "none", marginRight: "8px" }}>
                      详情
                    </Link>
                    {order.status === "paid" && (
                      <button onClick={() => updateStatus(order.id, "shipped")}
                        style={{ fontSize: "11px", color: "#2563eb", border: "none", background: "none", cursor: "pointer", marginRight: "4px" }}>
                        标记发货
                      </button>
                    )}
                    {(order.status === "paid" || order.status === "shipped") && (
                      <button onClick={() => updateStatus(order.id, "completed")}
                        style={{ fontSize: "11px", color: "#7c3aed", border: "none", background: "none", cursor: "pointer" }}>
                        标记完成
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
