# 购物车 + 下单 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为瀹岭电商平台添加购物车（游客 localStorage + 登录 DB Hybrid 模式）和下单流程（选地址 → 确认 → 创建订单）。

**Architecture:** React Context 提供即时 UI 响应，API 做持久化。游客用 localStorage，登录用户用 CartItem 表，登录时 merge。下单用 Prisma 事务原子执行库存校验 + 扣减 + 订单创建。

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7, React Context, Tailwind CSS 4 (inline styles for precise layout)

---

## 文件结构

```
创建:
  src/context/CartContext.tsx                # 购物车 Context + Provider
  src/app/api/cart/route.ts                  # 购物车 GET/POST/DELETE
  src/app/api/cart/[id]/route.ts            # 购物车单条 PUT/DELETE
  src/app/api/cart/merge/route.ts           # 游客→登录合并 POST
  src/app/api/orders/route.ts               # 订单 POST（下单）+ GET（列表）
  src/app/api/orders/[id]/route.ts          # 订单详情 GET
  src/app/cart/page.tsx                      # 购物车页面
  src/app/checkout/page.tsx                  # 下单确认页
  src/components/AddToCart.tsx              # 加购组件（数量 + 按钮）
  src/components/MiniCart.tsx               # 迷你购物车下拉面板

修改:
  src/components/ShopNavbar.tsx              # 集成 MiniCart + 购物车角标
  src/app/products/[slug]/page.tsx           # 添加 AddToCart + 调整按钮
  src/app/api/account/orders/route.ts        # 替换 stub 为真实订单列表
  src/app/layout.tsx                         # 不预加载 CartContext（shop 页面自行包裹）
```

---

### Task 1: 购物车 API（CRUD + Merge）

**Files:**
- Create: `src/app/api/cart/route.ts`
- Create: `src/app/api/cart/[id]/route.ts`
- Create: `src/app/api/cart/merge/route.ts`

**Context:** CartItem 表已存在（id, userId, productId, quantity）。游客通过 body 传递 items 数组获取购物车数据，登录用户通过 session 自动识别。

- [ ] **Step 1: 创建购物车主路由 GET/POST/DELETE**

创建 `src/app/api/cart/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const cartInclude = {
  product: {
    select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (session?.user?.id) {
      // 登录用户：从 DB 读取
      const items = await prisma.cartItem.findMany({
        where: { userId: session.user.id },
        include: cartInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, data: items });
    }

    // 游客：从 body 读取 items，返回完整产品信息
    const body = await request.json().catch(() => ({}));
    const guestItems: { productId: string; quantity: number }[] = body.items || [];
    if (guestItems.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const productIds = guestItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
    });

    const data = guestItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return { id: `guest-${item.productId}`, productId: item.productId, quantity: item.quantity, product };
    });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("Get cart error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "无效的商品或数量" },
        { status: 400 }
      );
    }

    if (session?.user?.id) {
      // 登录用户：写 DB
      const existing = await prisma.cartItem.findFirst({
        where: { userId: session.user.id, productId },
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: { userId: session.user.id, productId, quantity },
        });
      }

      const items = await prisma.cartItem.findMany({
        where: { userId: session.user.id },
        include: cartInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, data: items }, { status: 201 });
    }

    // 游客：返回操作结果让客户端存 localStorage
    return NextResponse.json({
      success: true,
      data: { productId, quantity },
    });
  } catch (e) {
    console.error("Add to cart error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (session?.user?.id) {
      await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
    }
    return NextResponse.json({ success: true, message: "购物车已清空" });
  } catch (e) {
    console.error("Clear cart error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 创建购物车单条路由 PUT/DELETE**

创建 `src/app/api/cart/[id]/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const { quantity } = await request.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "无效的数量" },
        { status: 400 }
      );
    }

    if (session?.user?.id) {
      const item = await prisma.cartItem.findUnique({ where: { id } });
      if (!item || item.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "NOT_FOUND", message: "购物车项不存在" },
          { status: 404 }
        );
      }
      await prisma.cartItem.update({ where: { id }, data: { quantity } });
    }

    return NextResponse.json({ success: true, data: { id, quantity } });
  } catch (e) {
    console.error("Update cart item error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (session?.user?.id) {
      const item = await prisma.cartItem.findUnique({ where: { id } });
      if (!item || item.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "NOT_FOUND", message: "购物车项不存在" },
          { status: 404 }
        );
      }
      await prisma.cartItem.delete({ where: { id } });
    }

    return NextResponse.json({ success: true, message: "已删除" });
  } catch (e) {
    console.error("Delete cart item error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: 创建合并路由 POST**

创建 `src/app/api/cart/merge/route.ts`：

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
    const guestItems: { productId: string; quantity: number }[] = body.items || [];

    for (const item of guestItems) {
      if (!item.productId || !item.quantity) continue;
      const existing = await prisma.cartItem.findFirst({
        where: { userId: session.user.id, productId: item.productId },
      });
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.max(existing.quantity, item.quantity) },
        });
      } else {
        await prisma.cartItem.create({
          data: { userId: session.user.id, productId: item.productId, quantity: item.quantity },
        });
      }
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (e) {
    console.error("Merge cart error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: 提交**

```bash
git add src/app/api/cart/
git commit -m "feat: add cart API endpoints (CRUD + merge)"
```

---

### Task 2: 订单 API（下单 + 列表 + 详情）

**Files:**
- Create: `src/app/api/orders/route.ts`
- Create: `src/app/api/orders/[id]/route.ts`

- [ ] **Step 1: 创建订单路由 POST + GET**

创建 `src/app/api/orders/route.ts`：

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
    const { addressId, items } = body as {
      addressId: string;
      items: { productId: string; quantity: number }[];
    };

    if (!addressId) {
      return NextResponse.json(
        { success: false, error: "ADDRESS_REQUIRED", message: "请选择收货地址" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "购物车为空" },
        { status: 400 }
      );
    }

    // 验证地址归属
    const address = await prisma.shippingAddress.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "地址不存在" },
        { status: 404 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      // 1. 校验库存 & 计算总价
      let total = 0;
      const productUpdates: { id: string; price: number; quantity: number }[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`OUT_OF_STOCK:产品「${item.productId}」不存在`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`OUT_OF_STOCK:产品「${product.name}」库存不足，仅剩 ${product.stock} 件`);
        }
        total += Number(product.price) * item.quantity;
        productUpdates.push({ id: product.id, price: Number(product.price), quantity: item.quantity });
      }

      // 2. 扣减库存
      for (const pu of productUpdates) {
        await tx.product.update({
          where: { id: pu.id },
          data: { stock: { decrement: pu.quantity } },
        });
      }

      // 3. 创建订单
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total,
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

      // 4. 清空购物车对应项
      const productIds = items.map((i) => i.productId);
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id, productId: { in: productIds } },
      });

      return newOrder;
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (e) {
    console.error("Create order error:", e);
    if (e instanceof Error && e.message.startsWith("OUT_OF_STOCK:")) {
      return NextResponse.json(
        { success: false, error: "OUT_OF_STOCK", message: e.message.replace("OUT_OF_STOCK:", "") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "请先登录" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, images: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (e) {
    console.error("Get orders error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 创建订单详情路由 GET**

创建 `src/app/api/orders/[id]/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
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
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, images: true } },
          },
        },
      },
    });

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "订单不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (e) {
    console.error("Get order detail error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: 更新账户订单 stub 为真实查询**

替换 `src/app/api/account/orders/route.ts`：

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "请先登录" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, images: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (e) {
    console.error("Get orders error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: 提交**

```bash
git add src/app/api/orders/ src/app/api/account/orders/route.ts
git commit -m "feat: add order API (create, list, detail) and replace orders stub"
```

---

### Task 3: CartContext（购物车状态管理）

**Files:**
- Create: `src/context/CartContext.tsx`

- [ ] **Step 1: 创建 CartContext**

```typescript
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSession } from "next-auth/react";

interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalCount: number;
  totalPrice: number;
  mergeCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "yueling_cart";

function loadGuestCart(): { productId: string; quantity: number }[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGuestCart(items: { productId: string; quantity: number }[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 初始化
  useEffect(() => {
    async function init() {
      setLoading(true);
      if (session?.user?.id) {
        const res = await fetch("/api/cart");
        const data = await res.json();
        if (data.success) setItems(data.data);
      } else {
        const guestItems = loadGuestCart();
        if (guestItems.length > 0) {
          const res = await fetch("/api/cart", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: guestItems }),
          });
          const data = await res.json();
          if (data.success) setItems(data.data);
        }
      }
      setLoading(false);
    }
    init();
  }, [session?.user?.id]);

  const addItem = useCallback(async (productId: string, quantity: number) => {
    // 乐观更新：先加到本地
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { id: `temp-${productId}`, productId, quantity, product: {} as CartProduct }];
    });

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();

    if (data.success && !session?.user?.id) {
      // 游客：存 localStorage
      const guestItems = loadGuestCart();
      const idx = guestItems.findIndex((i) => i.productId === productId);
      if (idx >= 0) {
        guestItems[idx].quantity += quantity;
      } else {
        guestItems.push({ productId, quantity });
      }
      saveGuestCart(guestItems);
      // 重新获取完整数据
      const refreshRes = await fetch("/api/cart", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: guestItems }),
      });
      const refreshData = await refreshRes.json();
      if (refreshData.success) setItems(refreshData.data);
    } else if (data.success && session?.user?.id) {
      // 登录用户：直接使用服务端返回的数据
      setItems(data.data);
    }
  }, [session?.user?.id]);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));

    await fetch(`/api/cart/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });

    if (!session?.user?.id) {
      // 游客：更新 localStorage
      const item = items.find((i) => i.id === id);
      if (item) {
        const guestItems = loadGuestCart();
        const idx = guestItems.findIndex((i) => i.productId === item.productId);
        if (idx >= 0) guestItems[idx].quantity = quantity;
        saveGuestCart(guestItems);
      }
    }
  }, [session?.user?.id, items]);

  const removeItem = useCallback(async (id: string) => {
    const target = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));

    await fetch(`/api/cart/${id}`, { method: "DELETE" });

    if (!session?.user?.id && target) {
      const guestItems = loadGuestCart().filter((i) => i.productId !== target.productId);
      saveGuestCart(guestItems);
    }
  }, [session?.user?.id, items]);

  const clearCart = useCallback(async () => {
    setItems([]);
    await fetch("/api/cart", { method: "DELETE" });
    if (!session?.user?.id) saveGuestCart([]);
  }, [session?.user?.id]);

  const mergeCart = useCallback(async () => {
    if (!session?.user?.id) return;
    const guestItems = loadGuestCart();
    if (guestItems.length === 0) {
      // 直接加载服务端购物车
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success) setItems(data.data);
      return;
    }

    const res = await fetch("/api/cart/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: guestItems }),
    });
    const data = await res.json();
    if (data.success) {
      setItems(data.data);
      saveGuestCart([]);
    }
  }, [session?.user?.id]);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + Number(i.product?.price || 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addItem, updateQuantity, removeItem, clearCart, totalCount, totalPrice, mergeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/context/CartContext.tsx
git commit -m "feat: add CartContext with hybrid guest/logged-in state"
```

---

### Task 4: AddToCart 组件 + 产品详情页集成

**Files:**
- Create: `src/components/AddToCart.tsx`
- Modify: `src/app/products/[slug]/page.tsx`

- [ ] **Step 1: 创建 AddToCart 组件**

```typescript
"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function AddToCart({ productId }: { productId: string }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    setLoading(true);
    await addItem(productId, quantity);
    setLoading(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: "6px", overflow: "hidden" }}>
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          style={{ width: "32px", height: "36px", border: "none", background: "#f9fafb", cursor: "pointer", fontSize: "16px", color: "#555" }}
        >
          −
        </button>
        <span style={{ width: "40px", textAlign: "center", fontSize: "14px", fontWeight: 600, lineHeight: "36px" }}>{quantity}</span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          style={{ width: "32px", height: "36px", border: "none", background: "#f9fafb", cursor: "pointer", fontSize: "16px", color: "#555" }}
        >
          +
        </button>
      </div>
      <button
        onClick={handleAdd}
        disabled={loading || added}
        style={{
          padding: "10px 24px",
          fontSize: "14px",
          fontWeight: 600,
          border: "none",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
          background: added ? "#16a34a" : "#1a3a2a",
          color: "#fff",
          transition: "background 0.3s",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {added ? "已加入 ✓" : loading ? "加入中..." : "加入购物车"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 修改产品详情页**

在 `src/app/products/[slug]/page.tsx` 中：

1. 将 `import ShopNavbar` 和 `import AddToCart` 添加到 imports
2. 将 "立即购买" 和 "加入购物车" 按钮区域替换为使用 AddToCart 组件
3. "立即购买" 改为 Link 跳转到 `/cart?buyNow=${productId}&quantity=N`（后续在 /cart 页面处理）

找到原有按钮区域并替换：

```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <button className="relative overflow-hidden bg-gradient-to-r from-green-900 to-green-800 text-white px-10 py-4 rounded-full text-lg font-medium cursor-pointer flex-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-900/40">
    立即购买
  </button>
  <button className="bg-white/70 backdrop-blur-xl border border-green-800/10 text-green-800 px-10 py-4 rounded-full text-lg font-medium cursor-pointer hover:bg-green-800 hover:text-white transition-all flex-1">
    加入购物车
  </button>
</div>
```

替换为：

```tsx
<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
  <AddToCart productId={product.id} />
  <Link
    href="/cart"
    style={{
      display: "inline-block",
      padding: "10px 24px",
      fontSize: "14px",
      fontWeight: 600,
      background: "#fff",
      color: "#1a3a2a",
      border: "1px solid #1a3a2a",
      borderRadius: "6px",
      textAlign: "center",
      textDecoration: "none",
    }}
  >
    查看购物车
  </Link>
</div>
```

- [ ] **Step 3: 提交**

```bash
git add src/components/AddToCart.tsx src/app/products/\[slug\]/page.tsx
git commit -m "feat: add AddToCart component and integrate into product detail"
```

---

### Task 5: ShopNavbar 集成 MiniCart + 购物车角标

**Files:**
- Create: `src/components/MiniCart.tsx`
- Modify: `src/components/ShopNavbar.tsx`

- [ ] **Step 1: 创建 MiniCart 组件**

```typescript
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
```

- [ ] **Step 2: 更新 ShopNavbar**

在 `src/components/ShopNavbar.tsx` 中：将 🛒 Link 替换为 MiniCart 组件。因为 ShopNavbar 需要 CartContext，我们需要包装它。

但 ShopNavbar 用在产品详情页（Server Component），不能直接用 CartProvider。解决方案：ShopNavbar 内部使用 MiniCart（MiniCart 内部用 useCart），如果 ShopNavbar 不在 CartProvider 内会报错。

最佳方案：ShopNavbar 仍为客户端组件，但 MiniCart 单独包裹。将购物车图标区域改为：

```tsx
import MiniCart from "./MiniCart";

// 在右侧区域替换 🛒 Link：
<MiniCart />
```

同时移除不再需要的 `import Link from "next/link"` 如果仅用于 Logo。

- [ ] **Step 3: 提交**

```bash
git add src/components/MiniCart.tsx src/components/ShopNavbar.tsx
git commit -m "feat: add MiniCart dropdown and integrate with ShopNavbar"
```

---

### Task 6: 购物车页面 /cart

**Files:**
- Create: `src/app/cart/page.tsx`
- Create: `src/app/cart/CartContent.tsx`

- [ ] **Step 1: 创建 cart layout（无 Navbar，nav 由 CartContent 处理）**

创建 `src/app/cart/page.tsx`：

```typescript
import CartContent from "./CartContent";

export default function CartPage() {
  return <CartContent />;
}
```

- [ ] **Step 2: 创建 CartContent 客户端组件**

创建 `src/app/cart/CartContent.tsx`：

```typescript
"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import ShopNavbar from "@/components/ShopNavbar";

export default function CartContent() {
  const { items, loading, updateQuantity, removeItem, totalCount, totalPrice } = useCart();

  if (loading) {
    return (
      <>
        <ShopNavbar />
        <div style={{ paddingTop: "80px", textAlign: "center", color: "#888" }}>加载中...</div>
      </>
    );
  }

  return (
    <>
      <ShopNavbar />
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
            {/* 表头 */}
            <div style={{ display: "flex", padding: "0 0 12px", borderBottom: "2px solid #e0e0e0", marginBottom: "16px", fontSize: "13px", color: "#888" }}>
              <span style={{ flex: 1 }}>商品</span>
              <span style={{ width: "120px", textAlign: "center" }}>单价</span>
              <span style={{ width: "140px", textAlign: "center" }}>数量</span>
              <span style={{ width: "100px", textAlign: "right" }}>小计</span>
              <span style={{ width: "60px" }} />
            </div>

            {/* 商品行 */}
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
                  >
                    −
                  </button>
                  <input
                    value={item.quantity}
                    readOnly
                    style={{ width: "44px", height: "28px", border: "1px solid #d1d5db", borderLeft: "none", borderRight: "none", textAlign: "center", fontSize: "13px", outline: "none" }}
                  />
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{ width: "28px", height: "28px", border: "1px solid #d1d5db", background: "#fff", borderRadius: "0 4px 4px 0", cursor: "pointer", fontSize: "14px" }}
                  >
                    +
                  </button>
                </div>

                <div style={{ width: "100px", textAlign: "right", fontSize: "15px", fontWeight: 600, color: "#1a3a2a" }}>
                  ¥{(Number(item.product?.price) || 0) * item.quantity}
                </div>

                <div style={{ width: "60px", textAlign: "center" }}>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{ fontSize: "12px", color: "#999", border: "none", background: "none", cursor: "pointer" }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}

            {/* 结算栏 */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "24px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e0e0e0" }}>
              <span style={{ fontSize: "14px", color: "#666" }}>共 <b>{totalCount}</b> 件</span>
              <span style={{ fontSize: "14px", color: "#888" }}>合计</span>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#1a3a2a" }}>¥{totalPrice}</span>
              <Link
                href="/checkout"
                style={{ padding: "12px 32px", background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}
              >
                去结算
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/cart/
git commit -m "feat: add cart page with quantity controls and checkout link"
```

---

### Task 7: 下单确认页 /checkout

**Files:**
- Create: `src/app/checkout/page.tsx`
- Create: `src/app/checkout/CheckoutContent.tsx`

- [ ] **Step 1: 创建 checkout 页面**

创建 `src/app/checkout/page.tsx`：

```typescript
import CheckoutContent from "./CheckoutContent";

export default function CheckoutPage() {
  return <CheckoutContent />;
}
```

- [ ] **Step 2: 创建 CheckoutContent 客户端组件**

创建 `src/app/checkout/CheckoutContent.tsx`：

```typescript
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

        {/* 收货地址 */}
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

        {/* 商品清单 */}
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
```

- [ ] **Step 3: 提交**

```bash
git add src/app/checkout/
git commit -m "feat: add checkout page with address selection and order creation"
```

---

### Task 8: 为电商页面包裹 CartProvider

**Files:**
- Create: `src/app/(shop)/layout.tsx`
- Create: `src/app/(shop)/...` (移动相关页面)

> **注意：** Next.js Route Groups `(shop)` 允许共享 layout 而不影响 URL。

**简化方案：** 不做路由重组。在每个需要 CartProvider 的页面各自包裹。更简单的做法是创建一个 `ShopLayout` 客户端组件：

创建 `src/components/ShopLayout.tsx`：

```typescript
"use client";

import { CartProvider } from "@/context/CartContext";
import ShopNavbar from "./ShopNavbar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}
```

然后在 cart/page.tsx 和 checkout 页面中使用 ShopLayout（包含 ShopNavbar + CartProvider），同时产品详情页也包裹 ShopLayout。

- [ ] **Step 1: 更新产品详情页使用 ShopLayout**

将产品详情页的 `ShopNavbar` 替换为 `ShopLayout`（包裹内容）。

修改 `src/app/products/[slug]/page.tsx`：

```tsx
import ShopLayout from "@/components/ShopLayout";

// 在 return 中：
<ShopLayout>
  <div className="pt-24 pb-16 px-6" style={{ background: "#F8F7F4" }}>
    ... 现有内容 ...
  </div>
</ShopLayout>
```

移除单独的 `<ShopNavbar />`。

- [ ] **Step 2: 更新购物车和结算页使用 ShopLayout**

购物车页面（CartContent）和结算页（CheckoutContent）改为不含 ShopNavbar，由页面级的 ShopLayout 包裹。

- [ ] **Step 3: 提交**

```bash
git add src/components/ShopLayout.tsx src/app/products/\[slug\]/page.tsx src/app/cart/ src/app/checkout/
git commit -m "feat: add ShopLayout with CartProvider for all shop pages"
```

---

### Task 9: 登录时自动合并购物车

**Files:**
- Modify: `src/context/CartContext.tsx`

CartContext 中已包含 `mergeCart` 方法。需要在登录成功后自动调用。监听 `useSession` 变化：

在 CartContext 的 `useEffect` 初始化中，检测到 session 从 null → user 时，调用 mergeCart。当前初始化逻辑已经通过 `[session?.user?.id]` 依赖触发重新加载，但这个只加载服务端购物车没有 merge。需要调整：

在 init 中调用 mergeCart 而不是简单的 get：

当前代码在登录后直接 GET /api/cart，应该改为先尝试 merge。

修改 CartContext 初始化部分，session 存在时先 mergeArchive 再加载。

- [ ] **Step 1: 更新 CartContext 初始化逻辑**

CartContext 的 useEffect 中，当 `session?.user?.id` 存在时：

```typescript
useEffect(() => {
  async function init() {
    setLoading(true);
    if (session?.user?.id) {
      // 登录用户：先合并游客数据，再加载
      const guestItems = loadGuestCart();
      if (guestItems.length > 0) {
        const mergeRes = await fetch("/api/cart/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: guestItems }),
        });
        const mergeData = await mergeRes.json();
        if (mergeData.success) {
          setItems(mergeData.data);
          saveGuestCart([]);
          setLoading(false);
          return;
        }
      }
      // 没有游客数据，直接加载
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success) setItems(data.data);
    } else {
      // 游客：加载 localStorage 数据
      const guestItems = loadGuestCart();
      if (guestItems.length > 0) {
        const res = await fetch("/api/cart", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: guestItems }),
        });
        const data = await res.json();
        if (data.success) setItems(data.data);
      } else {
        setItems([]);
      }
    }
    setLoading(false);
  }
  init();
}, [session?.user?.id]);
```

- [ ] **Step 2: 提交**

```bash
git add src/context/CartContext.tsx
git commit -m "feat: auto-merge guest cart on login"
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

1. 游客状态下浏览产品详情页 → 调整数量 → 加入购物车 → Mini-cart 角标更新
2. 点击购物车图标 → Mini-cart 面板显示商品 → 点击查看购物车 → /cart 页面完整列表
3. /cart 页面修改数量 → 删除商品 → 清空测试
4. 登录账号 → 游客购物车自动合并到登录购物车
5. /checkout 选择地址 → 确认商品 → 提交订单
6. 查看订单列表 → 订单详情

- [ ] **Step 4: 提交（如有修复）**

```bash
git add -A
git commit -m "fix: integration fixes for cart and order system"
```

---

## 验证清单

完成后逐项确认：

- [ ] 游客加购：产品详情页 AddToCart 工作，localStorage 持久化
- [ ] 游客加购后刷新页面购物车仍在
- [ ] Mini-cart 角标显示正确数量
- [ ] Mini-cart 面板显示商品预览 + 总计
- [ ] 登录后游客购物车自动合并
- [ ] /cart 页面列表完整、数量+/-/删除正常
- [ ] /checkout 地址可选、商品清单正确
- [ ] 提交订单成功，库存扣减
- [ ] 库存不足时拒绝并提示
- [ ] 未登录访问 /cart 正常工作（游客模式）
- [ ] 未登录访问 /checkout 正常（但提交时需登录）
- [ ] 订单列表显示历史订单
