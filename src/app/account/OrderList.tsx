"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBreakpoint } from "@/lib/useBreakpoint";

interface OrderSummary {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: {
    id: string;
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[];
    };
  }[];
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "待支付",
  pending: "处理中",
  paid: "已支付",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
  expired: "已过期",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "#EA580C",
  pending: "#6B7280",
  paid: "#16A34A",
  shipped: "#2563EB",
  completed: "#7C3AED",
  cancelled: "#9CA3AF",
  expired: "#9CA3AF",
};

const TABS = [
  { label: "全部", value: "" },
  { label: "待付款", value: "pending_payment" },
  { label: "已支付", value: "paid" },
  { label: "已发货", value: "shipped" },
  { label: "已完成", value: "completed" },
  { label: "已取消", value: "cancelled,expired" },
];

export default function OrderList() {
  const { isMobile } = useBreakpoint();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrders(d.data);
        setLoading(false);
      });
  }, []);

  async function handleCancel(orderId: string) {
    setCancellingId(orderId);
    const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );
    }
    setCancellingId(null);
  }

  const filteredOrders = activeTab
    ? orders.filter((o) => activeTab.split(",").includes(o.status))
    : orders;

  if (loading) {
    return (
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>我的订单</h3>
        <p style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "0" : undefined }}>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>我的订单</h3>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", overflowX: isMobile ? "auto" : "visible", whiteSpace: "nowrap" }}>
        {TABS.map((tab) => (
          <span
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              fontSize: "13px", padding: "4px 12px", borderRadius: "4px",
              color: activeTab === tab.value ? "#fff" : "#888",
              background: activeTab === tab.value ? "#1a3a2a" : "transparent",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </span>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <p style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>暂无订单</p>
      ) : (
        filteredOrders.map((order) => (
          <div
            key={order.id}
            style={{
              padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>
                {new Date(order.createdAt).toLocaleString("zh-CN", {
                  month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: STATUS_COLORS[order.status] || "#888" }}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "8px", flex: 1, overflow: "hidden" }}>
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      width: "48px", height: "48px", borderRadius: "6px",
                      overflow: "hidden", background: "#f0ebe0", flexShrink: 0,
                    }}
                  >
                    {item.product?.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a3a2a", marginBottom: "8px" }}>
                  ¥{Number(order.total)}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {order.status === "pending_payment" && (
                    <>
                      <Link
                        href={`/payment/${order.id}`}
                        style={{
                          padding: "4px 12px", fontSize: "12px", fontWeight: 600,
                          background: "#1a3a2a", color: "#fff", borderRadius: "4px",
                          textDecoration: "none",
                        }}
                      >
                        去支付
                      </Link>
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        style={{
                          padding: "4px 12px", fontSize: "12px",
                          background: "#fff", color: "#888",
                          border: "1px solid #e5e7eb", borderRadius: "4px",
                          cursor: cancellingId === order.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {cancellingId === order.id ? "取消中..." : "取消"}
                      </button>
                    </>
                  )}
                  <Link
                    href={`/orders/${order.id}`}
                    style={{
                      padding: "4px 12px", fontSize: "12px",
                      background: "#fff", color: "#333",
                      border: "1px solid #d1d5db", borderRadius: "4px",
                      textDecoration: "none",
                    }}
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
