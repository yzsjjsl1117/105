"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBreakpoint } from "@/lib/useBreakpoint";

interface OrderData {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
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

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const { isMobile } = useBreakpoint();
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrder(d.data);
        else setError("订单不存在");
      });
  }, [orderId]);

  async function handleCancel() {
    setCancelling(true);
    const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      fetch(`/api/orders/${orderId}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setOrder(d.data); });
    }
    setCancelling(false);
  }

  if (error) {
    return (
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: isMobile ? "80px 16px 24px" : "120px 24px 48px", textAlign: "center" }}>
        <p style={{ color: "#dc2626", marginBottom: "24px" }}>{error}</p>
        <Link href="/account" style={{ padding: "10px 24px", background: "#1a3a2a", color: "#fff", borderRadius: "6px", fontSize: "14px", textDecoration: "none" }}>
          返回个人中心
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: isMobile ? "80px 16px 24px" : "120px 24px 48px", textAlign: "center", color: "#888" }}>
        加载中...
      </div>
    );
  }

  const createdAtStr = new Date(order.createdAt).toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  const created = new Date(order.createdAt).getTime();
  const elapsed = Math.floor((Date.now() - created) / 1000);
  const remaining = Math.max(0, 30 * 60 - elapsed);
  const timeStr = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: isMobile ? "80px 16px 24px" : "96px 24px 48px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1F2D24", marginBottom: "24px" }}>订单详情</h2>

      <div style={{
        padding: "12px 16px", borderRadius: "8px", marginBottom: "24px",
        background: order.status === "pending_payment" ? "#FFF7ED"
          : order.status === "paid" ? "#F0FDF4"
          : order.status === "shipped" ? "#EFF6FF"
          : order.status === "completed" ? "#F5F3FF"
          : "#F3F4F6",
        border: order.status === "pending_payment" ? "1px solid #FED7AA"
          : order.status === "paid" ? "1px solid #BBF7D0"
          : order.status === "shipped" ? "1px solid #BFDBFE"
          : order.status === "completed" ? "1px solid #DDD6FE"
          : "1px solid #E5E7EB",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>
          订单状态：{STATUS_LABELS[order.status] || order.status}
        </span>
        {order.status === "pending_payment" && (
          <span style={{ fontSize: "13px", color: "#EA580C" }}>剩余 {timeStr}</span>
        )}
      </div>

      <div style={{ fontSize: "13px", color: "#888", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>订单号</span>
          <span>{order.id.slice(0, 8)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>下单时间</span>
          <span>{createdAtStr}</span>
        </div>
        {order.paymentMethod && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>支付方式</span>
            <span>{order.paymentMethod === "wechat" ? "微信支付" : order.paymentMethod === "alipay" ? "支付宝" : order.paymentMethod}</span>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>商品信息</h3>
      {order.items.map((item) => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "6px", overflow: "hidden", background: "#f0ebe0", flexShrink: 0 }}>
            {item.product?.images?.[0] && (
              <img src={item.product.images[0]} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Link href={`/products/${item.product?.slug}`} style={{ fontSize: "14px", color: "#333", textDecoration: "none", display: "block" }}>
              {item.product?.name}
            </Link>
            <span style={{ fontSize: "12px", color: "#888" }}>×{item.quantity}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "13px", color: "#555" }}>¥{Number(item.price)}</span>
            <br />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a3a2a" }}>¥{Number(item.price) * item.quantity}</span>
          </div>
        </div>
      ))}

      <hr style={{ margin: "16px 0", borderColor: "#e0e0e0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: 700 }}>
        <span>合计</span>
        <span style={{ color: "#1a3a2a" }}>¥{Number(order.total)}</span>
      </div>

      <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
        {order.status === "pending_payment" && (
          <>
            <Link
              href={`/payment/${order.id}`}
              style={{
                flex: 1, padding: "12px", textAlign: "center",
                background: "#1a3a2a", color: "#fff",
                borderRadius: "6px", fontSize: "15px", fontWeight: 600,
                textDecoration: "none",
              }}
            >
              去支付
            </Link>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                flex: 1, padding: "12px",
                background: "#fff", color: "#888",
                border: "1px solid #e5e7eb", borderRadius: "6px",
                fontSize: "15px", cursor: cancelling ? "not-allowed" : "pointer",
              }}
            >
              {cancelling ? "取消中..." : "取消订单"}
            </button>
          </>
        )}
        <Link
          href="/account"
          style={{
            flex: 1, padding: "12px", textAlign: "center",
            background: "#fff", color: "#333",
            border: "1px solid #d1d5db", borderRadius: "6px",
            fontSize: "15px", textDecoration: "none",
          }}
        >
          返回订单列表
        </Link>
      </div>
    </div>
  );
}
