# 支付基础设施 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为瀹岭电商平台添加支付基础设施：模拟支付、订单生命周期（待支付/已支付/已过期/已取消）、支付页面、订单详情页、订单列表升级。

**Architecture:** 路径 C — 模拟支付 + 完整基础设施。POST /api/payment/pay 内部模拟支付，将来替换为微信/支付宝 SDK 即可。订单 30 分钟超时自动取消（前端倒计时 + 服务端兜底）。下单即扣库存，取消/过期回滚。

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7, React, Tailwind CSS 4 (inline styles for precise layout)

---

## 文件结构

```
创建:
  src/app/api/payment/pay/route.ts          # 模拟支付 POST
  src/app/api/orders/[id]/cancel/route.ts   # 取消订单 POST
  src/lib/orders.ts                         # 过期订单自动取消
  src/app/payment/[orderId]/page.tsx        # 支付页容器
  src/app/payment/PaymentContent.tsx        # 支付页客户端组件
  src/app/payment/success/page.tsx          # 支付成功页容器
  src/app/payment/success/PaymentSuccessContent.tsx
  src/app/orders/[id]/page.tsx              # 订单详情页容器
  src/app/orders/[id]/OrderDetailClient.tsx # 订单详情客户端组件

修改:
  src/app/api/orders/route.ts              # 下单时创建 PaymentRecord + status=pending_payment
  src/app/api/orders/[id]/route.ts         # 查询时自动取消过期订单
  src/app/account/OrderList.tsx            # 从空壳改为真实订单列表
```

---

### Task 1: 过期订单自动取消工具函数

**Files:**
- Create: `src/lib/orders.ts`

- [ ] **Step 1: 创建 cancelExpiredOrders 函数**

```typescript
import { prisma } from "./prisma";

const EXPIRE_MINUTES = 30;

export async function cancelExpiredOrders(userId: string) {
  const expireTime = new Date(Date.now() - EXPIRE_MINUTES * 60 * 1000);

  const expiredOrders = await prisma.order.findMany({
    where: {
      userId,
      status: "pending_payment",
      createdAt: { lt: expireTime },
    },
    include: { items: true },
  });

  for (const order of expiredOrders) {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "expired" },
      });
      await tx.paymentRecord.updateMany({
        where: { orderId: order.id, status: "pending" },
        data: { status: "failed" },
      });
    });
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/orders.ts
git commit -m "feat: add expired order auto-cancellation utility"
```

---

### Task 2: 修改下单 API — 添加 PaymentRecord + status

**Files:**
- Modify: `src/app/api/orders/route.ts`

- [ ] **Step 1: 更新 POST 处理逻辑**

在下单事务中增加：

1. `status` 设为 `"pending_payment"`（取代默认值）
2. 创建 PaymentRecord（`status: "pending"`）

事务内修改订单创建部分：

```typescript
const newOrder = await tx.order.create({
  data: {
    userId: session.user.id,
    total,
    status: "pending_payment",
    items: {
      create: productUpdates.map((pu) => ({
        productId: pu.id,
        quantity: pu.quantity,
        price: pu.price,
      })),
    },
  },
  include: {
    items: {
      include: {
        product: { select: { id: true, name: true, slug: true, images: true } },
      },
    },
  },
});

// 创建支付记录
await tx.paymentRecord.create({
  data: {
    orderId: newOrder.id,
    method: "",
    amount: total,
    status: "pending",
  },
});
```

- [ ] **Step 2: 更新 GET 处理逻辑**

在查询订单列表前，先调用 `cancelExpiredOrders` 兜底：

```typescript
// 在 GET 函数中，auth 检查通过后：
await cancelExpiredOrders(session.user.id);

const orders = await prisma.order.findMany({
  // ... 现有查询
});
```

- [ ] **Step 3: 提交**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat: add PaymentRecord creation and auto-expiry to orders API"
```

---

### Task 3: 修改订单详情 API — 添加过期兜底

**Files:**
- Modify: `src/app/api/orders/[id]/route.ts`

- [ ] **Step 1: 在 GET 中加入过期检查**

```typescript
import { cancelExpiredOrders } from "@/lib/orders";

// 在 GET 函数中，auth 检查通过后，查询订单前：
await cancelExpiredOrders(session.user.id);
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/orders/\[id\]/route.ts
git commit -m "feat: add auto-expiry check to order detail API"
```

---

### Task 4: 取消订单 API

**Files:**
- Create: `src/app/api/orders/[id]/cancel/route.ts`

- [ ] **Step 1: 创建取消订单路由**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "请先登录" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "订单不存在" },
        { status: 404 }
      );
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { success: false, error: "ORDER_NOT_CANCELLABLE", message: "当前订单状态不允许取消" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id },
        data: { status: "cancelled" },
      });

      await tx.paymentRecord.updateMany({
        where: { orderId: id, status: "pending" },
        data: { status: "failed" },
      });
    });

    return NextResponse.json({ success: true, message: "订单已取消" });
  } catch (e) {
    console.error("Cancel order error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/orders/\[id\]/cancel/route.ts
git commit -m "feat: add order cancellation API with stock rollback"
```

---

### Task 5: 模拟支付 API

**Files:**
- Create: `src/app/api/payment/pay/route.ts`

- [ ] **Step 1: 创建模拟支付路由**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, method } = body as { orderId: string; method: string };

    if (!orderId || !method) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "缺少订单号或支付方式" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "订单不存在" },
        { status: 404 }
      );
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { success: false, error: "ORDER_NOT_PAYABLE", message: "订单无法支付" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "paid", paymentMethod: method },
      });

      await tx.paymentRecord.updateMany({
        where: { orderId, status: "pending" },
        data: { status: "completed", method },
      });
    });

    return NextResponse.json({ success: true, message: "支付成功" });
  } catch (e) {
    console.error("Payment error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/payment/pay/route.ts
git commit -m "feat: add mock payment API endpoint"
```

---

### Task 6: 支付页面

**Files:**
- Create: `src/app/payment/[orderId]/page.tsx`
- Create: `src/app/payment/PaymentContent.tsx`

- [ ] **Step 1: 创建支付页容器（服务端组件）**

创建 `src/app/payment/[orderId]/page.tsx`：

```typescript
import PaymentContent from "../PaymentContent";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <PaymentContent orderId={orderId} />;
}
```

- [ ] **Step 2: 创建 PaymentContent 客户端组件**

创建 `src/app/payment/PaymentContent.tsx`：

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShopNavbar from "@/components/ShopNavbar";

const EXPIRE_SECONDS = 30 * 60; // 30 分钟

export default function PaymentContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [method, setMethod] = useState("wechat");
  const [timeLeft, setTimeLeft] = useState(EXPIRE_SECONDS);
  const [order, setOrder] = useState<{ total: number; status: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrder(d.data);
        else setError("订单不存在");
      });
  }, [orderId]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      fetch(`/api/orders/${orderId}/cancel`, { method: "POST" })
        .then(() => router.push(`/orders/${orderId}`));
    }
  }, [timeLeft, orderId, router]);

  async function handlePay() {
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
      router.push(`/payment/success?orderId=${orderId}&amount=${order?.total}&method=${method}`);
    } else {
      setError(data.message);
    }
  }

  async function handleCancel() {
    await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    router.push(`/orders/${orderId}`);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!order) {
    return (
      <>
        <ShopNavbar />
        <div style={{ paddingTop: "120px", textAlign: "center", color: "#888" }}>加载中...</div>
      </>
    );
  }

  if (order.status !== "pending_payment") {
    return (
      <>
        <ShopNavbar />
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: "#888", marginBottom: "24px" }}>该订单无法支付</p>
          <Link href={`/orders/${orderId}`} style={{ color: "#1a3a2a" }}>查看订单详情 →</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <ShopNavbar />
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "96px 24px 48px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1F2D24", marginBottom: "24px" }}>确认支付</h2>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", fontSize: "14px" }}>
          <span style={{ color: "#888" }}>支付金额</span>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#1a3a2a" }}>¥{Number(order.total)}</span>
        </div>

        <div style={{
          background: timeLeft < 300 ? "#fef2f2" : "#f0f9f0",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "24px",
          textAlign: "center",
          fontSize: "13px",
          color: timeLeft < 300 ? "#dc2626" : "#16a34a",
        }}>
          {timeLeft > 0
            ? `请在 ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} 内完成支付`
            : "订单已超时，正在取消..."}
        </div>

        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>支付方式</h3>
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          {[
            { key: "wechat", label: "微信支付", icon: "💚" },
            { key: "alipay", label: "支付宝", icon: "💙" },
          ].map((m) => (
            <div
              key={m.key}
              onClick={() => setMethod(m.key)}
              style={{
                flex: 1,
                padding: "16px",
                border: method === m.key ? "2px solid #1a3a2a" : "1px solid #e5e7eb",
                borderRadius: "8px",
                textAlign: "center",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "6px" }}>{m.icon}</div>
              {m.label}
            </div>
          ))}
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

        <button
          onClick={handlePay}
          disabled={loading || timeLeft === 0}
          style={{
            width: "100%", padding: "12px", marginBottom: "12px",
            background: "#1a3a2a", color: "#fff", border: "none",
            borderRadius: "6px", fontSize: "15px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || timeLeft === 0 ? 0.7 : 1,
          }}
        >
          {loading ? "处理中..." : "确认支付"}
        </button>

        <button
          onClick={handleCancel}
          style={{
            width: "100%", padding: "12px",
            background: "#fff", color: "#888", border: "1px solid #e5e7eb",
            borderRadius: "6px", fontSize: "14px", cursor: "pointer",
          }}
        >
          取消订单
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/payment/
git commit -m "feat: add payment page with countdown and mock payment"
```

---

### Task 7: 支付成功页

**Files:**
- Create: `src/app/payment/success/page.tsx`
- Create: `src/app/payment/success/PaymentSuccessContent.tsx`

- [ ] **Step 1: 创建支付成功页容器**

创建 `src/app/payment/success/page.tsx`：

```typescript
import PaymentSuccessContent from "./PaymentSuccessContent";

export default function PaymentSuccessPage() {
  return <PaymentSuccessContent />;
}
```

- [ ] **Step 2: 创建 PaymentSuccessContent 客户端组件**

创建 `src/app/payment/success/PaymentSuccessContent.tsx`：

```typescript
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ShopNavbar from "@/components/ShopNavbar";

const METHOD_LABELS: Record<string, string> = {
  wechat: "微信支付",
  alipay: "支付宝",
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const amount = searchParams.get("amount") || "0";
  const method = searchParams.get("method") || "";

  return (
    <>
      <ShopNavbar />
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "120px 24px 48px", textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1a3a2a", marginBottom: "8px" }}>支付成功</h2>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px" }}>
          感谢您的购买
        </p>

        <div style={{
          background: "#f9fafb", borderRadius: "8px", padding: "16px 24px",
          marginBottom: "24px", textAlign: "left", fontSize: "13px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#888" }}>订单编号</span>
            <span style={{ fontFamily: "monospace" }}>{orderId.slice(0, 8)}...</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#888" }}>支付金额</span>
            <span style={{ fontWeight: 600 }}>¥{Number(amount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888" }}>支付方式</span>
            <span>{METHOD_LABELS[method] || method}</span>
          </div>
        </div>

        <Link
          href={`/orders/${orderId}`}
          style={{
            display: "inline-block", marginRight: "12px", padding: "10px 24px",
            background: "#1a3a2a", color: "#fff", borderRadius: "6px",
            fontSize: "14px", textDecoration: "none",
          }}
        >
          查看订单
        </Link>
        <Link
          href="/"
          style={{
            display: "inline-block", padding: "10px 24px",
            background: "#fff", color: "#1a3a2a",
            border: "1px solid #1a3a2a", borderRadius: "6px",
            fontSize: "14px", textDecoration: "none",
          }}
        >
          返回首页
        </Link>
      </div>
    </>
  );
}

export default function PaymentSuccessContent() {
  return (
    <Suspense fallback={<div style={{ paddingTop: "120px", textAlign: "center", color: "#888" }}>加载中...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/payment/success/
git commit -m "feat: add payment success page"
```

---

### Task 8: 订单详情页

**Files:**
- Create: `src/app/orders/[id]/page.tsx`
- Create: `src/app/orders/[id]/OrderDetailClient.tsx`

- [ ] **Step 1: 创建订单详情页容器（服务端组件）**

创建 `src/app/orders/[id]/page.tsx`：

```typescript
import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailClient orderId={id} />;
}
```

- [ ] **Step 2: 创建 OrderDetailClient 客户端组件**

创建 `src/app/orders/[id]/OrderDetailClient.tsx`：

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShopNavbar from "@/components/ShopNavbar";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "待付款", color: "#d97706", bg: "#fef3c7" },
  paid: { label: "已支付", color: "#059669", bg: "#d1fae5" },
  expired: { label: "已过期", color: "#9ca3af", bg: "#f3f4f6" },
  cancelled: { label: "已取消", color: "#dc2626", bg: "#fee2e2" },
};

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
    product: { id: string; name: string; slug: string; images: string[] };
  }[];
}

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrder(d.data);
        else setError("订单不存在");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  async function handleCancel() {
    const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setOrder((prev) => prev ? { ...prev, status: "cancelled" } : prev);
    }
  }

  if (loading) {
    return (
      <>
        <ShopNavbar />
        <div style={{ paddingTop: "120px", textAlign: "center", color: "#888" }}>加载中...</div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <ShopNavbar />
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: "#888", marginBottom: "24px" }}>{error || "订单不存在"}</p>
          <Link href="/account" style={{ color: "#1a3a2a" }}>返回个人中心 →</Link>
        </div>
      </>
    );
  }

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "#888", bg: "#f3f4f6" };

  return (
    <>
      <ShopNavbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "96px 24px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1F2D24" }}>订单详情</h2>
          <span style={{
            padding: "4px 12px", borderRadius: "4px", fontSize: "13px", fontWeight: 600,
            color: statusInfo.color, background: statusInfo.bg,
          }}>
            {statusInfo.label}
          </span>
        </div>

        {/* 商品列表 */}
        <div style={{ marginBottom: "24px" }}>
          {order.items.map((item) => (
            <div key={item.id} style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "6px", overflow: "hidden", background: "#f0ebe0", flexShrink: 0 }}>
                {item.product.images?.[0] && (
                  <img src={item.product.images[0]} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <Link href={`/products/${item.product.slug}`} style={{ fontSize: "14px", color: "#333", textDecoration: "none" }}>
                  {item.product.name}
                </Link>
                <p style={{ fontSize: "12px", color: "#888", margin: "4px 0 0" }}>×{item.quantity}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "14px", fontWeight: 600 }}>¥{Number(item.price) * item.quantity}</p>
                <p style={{ fontSize: "12px", color: "#888" }}>单价 ¥{Number(item.price)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 订单信息 */}
        <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "16px", marginBottom: "24px", fontSize: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#888" }}>订单编号</span>
            <span style={{ fontFamily: "monospace" }}>{order.id}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#888" }}>下单时间</span>
            <span>{new Date(order.createdAt).toLocaleString("zh-CN")}</span>
          </div>
          {order.paymentMethod && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#888" }}>支付方式</span>
              <span>{order.paymentMethod === "wechat" ? "微信支付" : "支付宝"}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
            <span style={{ fontWeight: 600 }}>实付金额</span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1a3a2a" }}>¥{Number(order.total)}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: "flex", gap: "12px" }}>
          {order.status === "pending_payment" && (
            <>
              <Link
                href={`/payment/${order.id}`}
                style={{
                  flex: 1, padding: "12px", textAlign: "center",
                  background: "#1a3a2a", color: "#fff", borderRadius: "6px",
                  fontSize: "14px", fontWeight: 600, textDecoration: "none",
                }}
              >
                去支付
              </Link>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1, padding: "12px",
                  background: "#fff", color: "#dc2626", border: "1px solid #dc2626",
                  borderRadius: "6px", fontSize: "14px", cursor: "pointer",
                }}
              >
                取消订单
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/orders/
git commit -m "feat: add order detail page with status label and action buttons"
```

---

### Task 9: 升级订单列表组件 — 从空壳到真实数据

**Files:**
- Modify: `src/app/account/OrderList.tsx`

- [ ] **Step 1: 替换为真实订单列表**

将空壳组件替换为功能完整的订单列表。关键功能：

1. 筛选 tab：全部 / 待付款 / 已支付 / 已取消
2. 订单卡片：订单号、状态标签、商品缩略图、总价、时间
3. 操作按钮：去支付（pending_payment）/ 取消（pending_payment）/ 查看详情
4. 在组件挂载时调用 `GET /api/account/orders` 获取数据

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "待付款", color: "#d97706", bg: "#fef3c7" },
  paid: { label: "已支付", color: "#059669", bg: "#d1fae5" },
  expired: { label: "已过期", color: "#9ca3af", bg: "#f3f4f6" },
  cancelled: { label: "已取消", color: "#dc2626", bg: "#fee2e2" },
};

const TABS = [
  { key: "", label: "全部" },
  { key: "pending_payment", label: "待付款" },
  { key: "paid", label: "已支付" },
  { key: "cancelled", label: "已取消" },
];

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string; slug: string; images: string[] };
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderList() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const res = await fetch("/api/account/orders");
    const data = await res.json();
    if (data.success) setOrders(data.data);
    setLoading(false);
  }

  async function handleCancel(orderId: string) {
    await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    fetchOrders();
  }

  const filtered = activeTab
    ? orders.filter((o) => o.status === activeTab)
    : orders;

  if (loading) {
    return <p style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>加载中...</p>;
  }

  return (
    <div>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>我的订单</h3>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        {TABS.map((tab) => (
          <span
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              fontSize: "13px", padding: "4px 12px", borderRadius: "4px", cursor: "pointer",
              color: activeTab === tab.key ? "#fff" : "#888",
              background: activeTab === tab.key ? "#1a3a2a" : "transparent",
            }}
          >
            {tab.label}
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>暂无订单</p>
      ) : (
        filtered.map((order) => {
          const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "#888", bg: "#f3f4f6" };
          return (
            <div key={order.id} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "12px", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: "#fafafa", fontSize: "12px", color: "#888" }}>
                <span>{new Date(order.createdAt).toLocaleString("zh-CN")}</span>
                <span>{order.id.slice(0, 8)}...</span>
              </div>
              <div style={{ padding: "12px 16px" }}>
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "4px", background: "#f0ebe0", flexShrink: 0, overflow: "hidden" }}>
                      {item.product.images?.[0] && (
                        <img src={item.product.images[0]} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                    <span style={{ flex: 1, fontSize: "13px" }}>{item.product.name}</span>
                    <span style={{ fontSize: "12px", color: "#888" }}>×{item.quantity}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p style={{ fontSize: "12px", color: "#aaa", margin: "4px 0" }}>...共 {order.items.length} 件商品</p>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid #f0f0f0" }}>
                <span style={{ fontSize: "13px" }}>
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: "3px", fontSize: "11px", fontWeight: 600,
                    color: statusInfo.color, background: statusInfo.bg, marginRight: "8px",
                  }}>
                    {statusInfo.label}
                  </span>
                  合计 <b style={{ color: "#1a3a2a" }}>¥{Number(order.total)}</b>
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {order.status === "pending_payment" && (
                    <>
                      <Link
                        href={`/payment/${order.id}`}
                        style={{ padding: "6px 14px", fontSize: "12px", background: "#1a3a2a", color: "#fff", borderRadius: "4px", textDecoration: "none" }}
                      >
                        去支付
                      </Link>
                      <button
                        onClick={() => handleCancel(order.id)}
                        style={{ padding: "6px 12px", fontSize: "12px", color: "#888", border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", cursor: "pointer" }}
                      >
                        取消
                      </button>
                    </>
                  )}
                  <Link
                    href={`/orders/${order.id}`}
                    style={{ padding: "6px 12px", fontSize: "12px", color: "#1a3a2a", border: "1px solid #d1d5db", borderRadius: "4px", textDecoration: "none" }}
                  >
                    详情
                  </Link>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/account/OrderList.tsx
git commit -m "feat: upgrade OrderList from stub to real order data with filters"
```

---

### Task 10: 集成验证

- [ ] **Step 1: 确保编译通过**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: 确保构建通过**

```bash
npm run build
```

- [ ] **Step 3: 端到端测试**

1. 下单 → 跳转到支付页 → 选择支付方式 → 确认支付 → 跳转成功页
2. 支付页倒计时正常工作，倒计时归零自动取消
3. 支付成功页显示订单号、金额、支付方式
4. 订单详情页显示完整信息（商品、金额、状态、操作按钮）
5. 订单列表显示真实订单，筛选 tab 正常工作
6. 取消订单后库存回滚（检查 Prisma Studio）
7. 过期订单在查询时被自动取消

- [ ] **Step 4: 提交（如有修复）**

```bash
git add -A
git commit -m "fix: integration fixes for payment infrastructure"
```

---

## 验证清单

完成后逐项确认：

- [ ] 下单成功后自动创建 PaymentRecord（status=pending）
- [ ] 支付页显示订单金额 + 支付方式选择
- [ ] 30 分钟倒计时正常，归零自动取消
- [ ] 模拟支付成功后 order.status → paid，PaymentRecord → completed
- [ ] 支付成功页显示订单信息
- [ ] 取消订单成功，库存回滚，order.status → cancelled
- [ ] 过期订单查询时自动取消
- [ ] 订单详情页显示完整信息 + 状态标签 + 操作按钮
- [ ] 订单列表显示真实数据 + 筛选 tab + 操作按钮
- [ ] 已支付/已取消/已过期的订单不可再次支付
- [ ] 待付款状态订单允许取消，其他状态不允许
