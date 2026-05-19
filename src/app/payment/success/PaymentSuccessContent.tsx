"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useBreakpoint } from "@/lib/useBreakpoint";

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { isMobile } = useBreakpoint();
  const orderId = searchParams.get("orderId");
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTotal(Number(d.data.total));
        }
      });
  }, [orderId]);

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: isMobile ? "80px 16px 24px" : "120px 24px 48px", textAlign: "center" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1a3a2a", marginBottom: "8px" }}>支付成功！</h2>
      {orderId && (
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "4px" }}>
          订单号：{orderId.slice(0, 8)}
        </p>
      )}
      {total !== null && (
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#1a3a2a", marginBottom: "24px" }}>
          ¥{total}
        </p>
      )}
      <Link
        href={orderId ? `/orders/${orderId}` : "/account"}
        style={{ padding: "10px 24px", background: "#1a3a2a", color: "#fff", borderRadius: "6px", fontSize: "14px", textDecoration: "none", display: "inline-block", marginRight: "12px" }}
      >
        查看订单
      </Link>
      <Link
        href="/"
        style={{ padding: "10px 24px", background: "#fff", color: "#1a3a2a", border: "1px solid #1a3a2a", borderRadius: "6px", fontSize: "14px", textDecoration: "none", display: "inline-block" }}
      >
        返回首页
      </Link>
    </div>
  );
}
