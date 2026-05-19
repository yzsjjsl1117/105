"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBreakpoint } from "@/lib/useBreakpoint";

interface OrderData {
  id: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function PaymentContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const { isMobile } = useBreakpoint();
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setOrder(d.data);
          if (d.data.status !== "pending_payment") {
            setExpired(true);
            return;
          }
          const created = new Date(d.data.createdAt).getTime();
          const elapsed = Math.floor((Date.now() - created) / 1000);
          const remaining = Math.max(0, 30 * 60 - elapsed);
          setTimeLeft(remaining);
          if (remaining <= 0) {
            setExpired(true);
          }
        } else {
          setError("订单不存在");
        }
      });
  }, [orderId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  async function handleCancel() {
    if (cancelled || expired) return;
    const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setCancelled(true);
    }
  }

  async function handlePay() {
    if (!method) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/payment/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, method }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      router.push(`/payment/success?orderId=${orderId}`);
    } else {
      setError(data.message);
    }
  }

  if (error && !order) {
    return (
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: isMobile ? "80px 16px 24px" : "120px 24px 48px", textAlign: "center" }}>
        <p style={{ fontSize: "15px", color: "#dc2626", marginBottom: "24px" }}>{error}</p>
        <Link href="/" style={{ padding: "10px 24px", background: "#1a3a2a", color: "#fff", borderRadius: "6px", fontSize: "14px", textDecoration: "none" }}>
          返回首页
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

  if (cancelled) {
    return (
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: isMobile ? "80px 16px 24px" : "120px 24px 48px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏰</div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2D24", marginBottom: "8px" }}>订单已取消</h2>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px" }}>订单号：{order.id.slice(0, 8)}</p>
        <Link href="/account" style={{ padding: "10px 24px", background: "#1a3a2a", color: "#fff", borderRadius: "6px", fontSize: "14px", textDecoration: "none", display: "inline-block", marginRight: "12px" }}>
          查看订单
        </Link>
        <Link href="/" style={{ padding: "10px 24px", background: "#fff", color: "#1a3a2a", border: "1px solid #1a3a2a", borderRadius: "6px", fontSize: "14px", textDecoration: "none", display: "inline-block" }}>
          返回首页
        </Link>
      </div>
    );
  }

  if (expired || order.status !== "pending_payment") {
    return (
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: isMobile ? "80px 16px 24px" : "120px 24px 48px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏰</div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2D24", marginBottom: "8px" }}>订单已超时</h2>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px" }}>支付超时，订单已自动取消。库存已返还。</p>
        <Link href="/account" style={{ padding: "10px 24px", background: "#1a3a2a", color: "#fff", borderRadius: "6px", fontSize: "14px", textDecoration: "none", display: "inline-block", marginRight: "12px" }}>
          查看订单
        </Link>
        <Link href="/" style={{ padding: "10px 24px", background: "#fff", color: "#1a3a2a", border: "1px solid #1a3a2a", borderRadius: "6px", fontSize: "14px", textDecoration: "none", display: "inline-block" }}>
          返回首页
        </Link>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: isMobile ? "80px 16px 24px" : "96px 24px 48px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1F2D24", marginBottom: "8px" }}>确认支付</h2>
      <p style={{ fontSize: "13px", color: "#888", marginBottom: "32px" }}>
        支付剩余时间：<span style={{ color: timeLeft < 300 ? "#dc2626" : "#1a3a2a", fontWeight: 600 }}>{timeStr}</span>
      </p>

      {/* Order Summary */}
      <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#888", marginBottom: "4px" }}>
          <span>订单号</span>
          <span>{order.id.slice(0, 8)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: 700, color: "#1a3a2a" }}>
          <span>应付金额</span>
          <span>¥{Number(order.total)}</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>选择支付方式</h3>
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <div
          onClick={() => setMethod("wechat")}
          style={{
            flex: 1, padding: "16px", borderRadius: "8px", textAlign: "center",
            border: method === "wechat" ? "2px solid #1a3a2a" : "1px solid #e5e7eb",
            background: method === "wechat" ? "#f0f7f2" : "#fff",
            cursor: "pointer", transition: "border 0.2s",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "4px" }}>💬</div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#07C160" }}>微信支付</div>
        </div>
        <div
          onClick={() => setMethod("alipay")}
          style={{
            flex: 1, padding: "16px", borderRadius: "8px", textAlign: "center",
            border: method === "alipay" ? "2px solid #1a3a2a" : "1px solid #e5e7eb",
            background: method === "alipay" ? "#f0f4f8" : "#fff",
            cursor: "pointer", transition: "border 0.2s",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "4px" }}>🔵</div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1677FF" }}>支付宝</div>
        </div>
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

      <button
        onClick={handlePay}
        disabled={!method || loading}
        style={{
          width: "100%", padding: "12px", marginBottom: "12px",
          background: method ? "#1a3a2a" : "#d1d5db", color: "#fff",
          border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 600,
          cursor: method && !loading ? "pointer" : "not-allowed",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "处理中..." : "确认支付"}
      </button>

      <button
        onClick={handleCancel}
        disabled={loading}
        style={{
          width: "100%", padding: "10px",
          background: "#fff", color: "#888",
          border: "1px solid #e5e7eb", borderRadius: "6px",
          fontSize: "14px", cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        取消订单
      </button>
    </div>
  );
}
