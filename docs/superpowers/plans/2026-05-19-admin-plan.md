# 后台管理 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为瀹岭电商平台添加后台管理系统：管理员入口与权限控制、商品 CRUD（含 Supabase Storage 图片上传）、订单管理（状态扩展 shipped/completed）、概览 Dashboard。

**Architecture:** 基于现有 User.role 字段（`admin` / `customer`）做权限控制。中间件轻量检查登录，API 和页面层校验 role。商品图片通过 Supabase Storage 上传。订单状态机扩展为 `pending_payment → paid → shipped → completed`。后台使用独立布局 AdminLayout（顶部导航 + 内容区）。

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7, Supabase Storage (`@supabase/supabase-js`), Tailwind CSS 4

---

## 文件结构

```
创建:
  src/app/admin/layout.tsx                     # AdminLayout
  src/components/AdminNavbar.tsx               # 后台顶部导航
  src/app/admin/page.tsx                       # Dashboard 概览
  src/app/admin/products/page.tsx              # 商品列表
  src/app/admin/products/new/page.tsx          # 新建商品
  src/app/admin/products/[id]/edit/page.tsx    # 编辑商品
  src/app/admin/products/ProductList.tsx       # 商品列表客户端组件
  src/app/admin/products/ProductForm.tsx       # 商品表单客户端组件（新建/编辑复用）
  src/components/ImageUpload.tsx               # 图片上传组件
  src/app/admin/orders/page.tsx                # 订单列表
  src/app/admin/orders/AdminOrderList.tsx      # 订单列表客户端组件
  src/app/admin/orders/[id]/page.tsx           # 订单详情
  src/app/admin/orders/[id]/AdminOrderDetail.tsx
  src/app/api/admin/stats/route.ts             # 概览统计 API
  src/app/api/admin/upload/route.ts            # 图片上传 API
  src/app/api/admin/products/route.ts          # 商品列表/新建 API
  src/app/api/admin/products/[id]/route.ts     # 商品详情/编辑/删除 API
  src/app/api/admin/orders/route.ts            # 订单列表 API
  src/app/api/admin/orders/[id]/route.ts       # 订单详情 API
  src/app/api/admin/orders/[id]/status/route.ts # 订单状态更新 API

修改:
  src/middleware.ts              # 添加 /admin/* 路由保护（登录检查）
  prisma/seed.ts                 # 添加 admin 用户
  src/lib/orders.ts              # 无需改动（cancelExpiredOrders 逻辑不受影响）
  src/app/account/OrderList.tsx  # 新增 shipped/completed 状态筛选 + 标签
  src/app/orders/[id]/OrderDetailClient.tsx  # 新增 shipped/completed 状态标签

新增依赖:
  @supabase/supabase-js          # Supabase Storage SDK
```

---

### Task 1: 安装 Supabase Storage SDK + 配置

**Files:**
- 安装依赖
- 修改: `.env`（添加 Supabase 配置）

- [ ] **Step 1: 安装 SDK**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: 确认环境变量**

检查 `.env` 中是否已有 Supabase 配置。需要：

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx          # 服务端操作 Storage 所需（service_role key）
SUPABASE_ANON_KEY=xxx             # 可选，仅客户端使用
```

如果没有 `SUPABASE_SERVICE_KEY`，需从 Supabase Dashboard → Project Settings → API → service_role key 获取。

- [ ] **Step 3: Supabase Dashboard → Storage → 创建 bucket**

手动操作：
1. 打开 Supabase Dashboard
2. Storage → New Bucket
3. 名称：`products`
4. 勾选 "Public bucket"
5. 创建

- [ ] **Step 4: 提交**

```bash
git add package.json package-lock.json .env
git commit -m "chore: add @supabase/supabase-js and configure Storage"
```

---

### Task 2: 中间件扩展 + AdminLayout + AdminNavbar

**Files:**
- Modify: `src/middleware.ts`
- Create: `src/app/admin/layout.tsx`
- Create: `src/components/AdminNavbar.tsx`
- Create: `src/app/admin/not-found.tsx`（403 处理）

- [ ] **Step 1: 扩展中间件 — 添加 /admin/* 登录检查**

在 `src/middleware.ts` 的 matcher 中添加 `/admin/:path*`：

```typescript
export const config = {
  matcher: ["/account/:path*", "/auth/:path*", "/admin/:path*"],
};
```

路由守卫逻辑中，`/admin/*` 未登录 → 重定向 `/auth/login?callbackUrl=...`（与 `/account/*` 相同）。

- [ ] **Step 2: 创建 AdminLayout**

创建 `src/app/admin/layout.tsx`：

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminNavbar from "@/components/AdminNavbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "48px", fontWeight: 700, color: "#1a3a2a", marginBottom: "8px" }}>403</h1>
          <p style={{ fontSize: "16px", color: "#888" }}>无权访问后台管理</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <AdminNavbar />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 AdminNavbar**

创建 `src/components/AdminNavbar.tsx`：

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/products", label: "商品管理" },
  { href: "/admin/orders", label: "订单管理" },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 64px 8px 44px", background: "#fff",
      borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <Link href="/admin" style={{
          fontFamily: "var(--font-serif-cn)", fontSize: "18px",
          color: "#1a3a2a", textDecoration: "none", fontWeight: 600,
        }}>
          瀹岭后台
        </Link>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              fontSize: "14px",
              color: pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)) ? "#1a3a2a" : "#888",
              textDecoration: "none",
              fontWeight: pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)) ? 600 : 400,
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <a href="/api/auth/signout" style={{ fontSize: "13px", color: "#888", textDecoration: "none" }}>
        退出
      </a>
    </nav>
  );
}
```

- [ ] **Step 4: 提交**

```bash
git add src/middleware.ts src/app/admin/layout.tsx src/components/AdminNavbar.tsx
git commit -m "feat: add admin layout with auth + role protection"
```

---

### Task 3: 概览 Dashboard

**Files:**
- Create: `src/app/api/admin/stats/route.ts`
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: 创建统计 API**

创建 `src/app/api/admin/stats/route.ts`：

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [todayOrders, pendingOrders, totalProducts, recentSales] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: { in: ["pending_payment", "paid"] } } }),
    prisma.product.count(),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: ["paid", "shipped", "completed"] },
      },
      _sum: { total: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      todayOrders,
      pendingOrders,
      totalProducts,
      recentSales: Number(recentSales._sum.total || 0),
    },
  });
}
```

- [ ] **Step 2: 创建 Dashboard 页面**

创建 `src/app/admin/page.tsx`：

```typescript
import Link from "next/link";

async function getStats() {
  // 开发环境直接用 fetch 调用 API（服务端组件可以直接 import prisma，但为了一致性用 fetch）
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:105";
  const res = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { cookie: "" },  // 服务端 fetch 需要手动传 cookie
    cache: "no-store",
  });
  // 注意：Server Component 中 fetch 自己的 API 需要处理 cookie。
  // 更好的方案：直接 import prisma 查询。
  return null; // stub — 将在 Task 3 Step 2 中用直接查询替代
}

export default function AdminDashboard() {
  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2D24", marginBottom: "24px" }}>概览</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "今日订单", value: "--", href: "/admin/orders" },
          { label: "待处理", value: "--", href: "/admin/orders?status=paid" },
          { label: "商品总数", value: "--", href: "/admin/products" },
          { label: "近7日销售额", value: "¥--", href: "/admin/orders" },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            style={{
              background: "#fff", borderRadius: "8px", padding: "20px",
              border: "1px solid #e5e7eb", textDecoration: "none",
              transition: "box-shadow 0.2s",
            }}
          >
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 8px" }}>{card.label}</p>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#1a3a2a", margin: 0 }}>{card.value}</p>
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <Link href="/admin/products/new" style={{
          padding: "10px 24px", background: "#1a3a2a", color: "#fff",
          borderRadius: "6px", fontSize: "14px", textDecoration: "none",
        }}>
          新建商品
        </Link>
        <Link href="/admin/orders" style={{
          padding: "10px 24px", background: "#fff", color: "#1a3a2a",
          border: "1px solid #1a3a2a", borderRadius: "6px",
          fontSize: "14px", textDecoration: "none",
        }}>
          查看所有订单
        </Link>
      </div>

      {/* 图表扩展预留区 */}
      <div style={{ marginTop: "32px", minHeight: "200px" }} />
    </div>
  );
}
```

> **注意：** Server Component 无法直接调用自己的 API Route。实际实现时，Dashboard 作为 Server Component 直接 import prisma 查询统计数据，不通过 API Route。`/api/admin/stats` 可为将来客户端扩展保留。

- [ ] **Step 3: 提交**

```bash
git add src/app/api/admin/stats/route.ts src/app/admin/page.tsx
git commit -m "feat: add admin dashboard with stats cards"
```

---

### Task 4: 图片上传 API

**Files:**
- Create: `src/app/api/admin/upload/route.ts`

- [ ] **Step 1: 创建上传 API**

创建 `src/app/api/admin/upload/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ success: false, error: "VALIDATION_ERROR", message: "请选择文件" }, { status: 400 });
    }

    // 限制文件大小 5MB，类型为图片
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "VALIDATION_ERROR", message: "图片大小不能超过 5MB" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "VALIDATION_ERROR", message: "仅支持图片文件" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.type.split("/")[1]}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ success: false, error: "SERVER_ERROR", message: "上传失败" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName);

    return NextResponse.json({ success: true, data: { url: urlData.publicUrl } });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ success: false, error: "SERVER_ERROR", message: "服务器错误" }, { status: 500 });
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/admin/upload/route.ts
git commit -m "feat: add image upload API with Supabase Storage"
```

---

### Task 5: ImageUpload 组件

**Files:**
- Create: `src/components/ImageUpload.tsx`

- [ ] **Step 1: 创建 ImageUpload 组件**

```typescript
"use client";

import { useState, useRef } from "react";

interface Props {
  images: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export default function ImageUpload({ images, onChange, max = 6 }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [...images];

    for (const file of Array.from(files)) {
      if (newUrls.length >= max) break;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        newUrls.push(data.data.url);
        onChange(newUrls);
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
        {images.map((url, i) => (
          <div key={i} style={{ width: "100px", height: "100px", borderRadius: "6px", overflow: "hidden", position: "relative", border: "1px solid #e5e7eb" }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => removeImage(i)}
              style={{
                position: "absolute", top: "4px", right: "4px",
                width: "20px", height: "20px", borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", color: "#fff",
                border: "none", cursor: "pointer", fontSize: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < max && (
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              width: "100px", height: "100px", borderRadius: "6px",
              border: "2px dashed #d1d5db", display: "flex",
              alignItems: "center", justifyContent: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.5 : 1,
              fontSize: "24px", color: "#aaa",
            }}
          >
            {uploading ? "⏳" : "+"}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        style={{ display: "none" }}
      />
      <p style={{ fontSize: "11px", color: "#aaa" }}>
        支持 JPG/PNG/WebP，每张最大 5MB，最多 {max} 张
      </p>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/ImageUpload.tsx
git commit -m "feat: add ImageUpload component"
```

---

### Task 6: 商品管理 API

**Files:**
- Create: `src/app/api/admin/products/route.ts`
- Create: `src/app/api/admin/products/[id]/route.ts`

- [ ] **Step 1: 创建商品列表/新建 API**

创建 `src/app/api/admin/products/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function requireAdmin(session: any) {
  if (!session?.user?.id) return false;
  return true;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const products = await prisma.product.findMany({
    include: { category: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: products });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const { name, subtitle, englishName, slug, description, price, stock, categoryId, images, featured, specs, features, brewing, storage } = body;

  if (!name || !slug || !price) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "名称、slug 和价格不能为空" },
      { status: 400 }
    );
  }

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "SLUG_TAKEN", message: "该 slug 已被使用" },
      { status: 409 }
    );
  }

  const product = await prisma.product.create({
    data: {
      name, slug,
      subtitle: subtitle || "",
      englishName: englishName || "",
      description: description || "",
      price,
      stock: stock || 0,
      categoryId: categoryId || null,
      images: images || [],
      featured: featured || false,
      specs: specs || "",
      features: features || [],
      brewing: brewing || {},
      storage: storage || "",
    },
  });

  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
```

- [ ] **Step 2: 创建单个商品详情/编辑/删除 API**

创建 `src/app/api/admin/products/[id]/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!product) {
    return NextResponse.json({ success: false, error: "NOT_FOUND", message: "商品不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: product });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, subtitle, englishName, slug, description, price, stock, categoryId, images, featured, specs, features, brewing, storage } = body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "NOT_FOUND", message: "商品不存在" }, { status: 404 });
  }

  // 检查 slug 冲突（排除自身）
  if (slug && slug !== existing.slug) {
    const slugConflict = await prisma.product.findUnique({ where: { slug } });
    if (slugConflict) {
      return NextResponse.json(
        { success: false, error: "SLUG_TAKEN", message: "该 slug 已被使用" },
        { status: 409 }
      );
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name, slug,
      subtitle: subtitle || "",
      englishName: englishName || "",
      description: description || "",
      price,
      stock: stock || 0,
      categoryId: categoryId || null,
      images: images || [],
      featured: featured || false,
      specs: specs || "",
      features: features || [],
      brewing: brewing || {},
      storage: storage || "",
    },
  });

  return NextResponse.json({ success: true, data: product });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true, message: "商品已删除" });
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/api/admin/products/
git commit -m "feat: add admin product CRUD API"
```

---

### Task 7: 商品列表页面

**Files:**
- Create: `src/app/admin/products/page.tsx`
- Create: `src/app/admin/products/ProductList.tsx`

- [ ] **Step 1: 创建产品列表容器（服务端组件）**

创建 `src/app/admin/products/page.tsx`：

```typescript
import ProductList from "./ProductList";

export default function AdminProductsPage() {
  return <ProductList />;
}
```

- [ ] **Step 2: 创建 ProductList 客户端组件**

创建 `src/app/admin/products/ProductList.tsx`：

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  featured: boolean;
  category?: { id: string; name: string } | null;
}

export default function ProductList() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确定删除「${name}」？此操作不可撤销。`)) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <p style={{ textAlign: "center", color: "#888", padding: "60px 0" }}>加载中...</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2D24" }}>商品管理</h2>
        <Link
          href="/admin/products/new"
          style={{ padding: "8px 20px", background: "#1a3a2a", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}
        >
          新建商品
        </Link>
      </div>

      {products.length === 0 ? (
        <p style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>暂无商品</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
              <th style={{ padding: "10px 8px", width: "60px" }}>图片</th>
              <th style={{ padding: "10px 8px" }}>名称</th>
              <th style={{ padding: "10px 8px", width: "100px" }}>价格</th>
              <th style={{ padding: "10px 8px", width: "80px" }}>库存</th>
              <th style={{ padding: "10px 8px", width: "100px" }}>分类</th>
              <th style={{ padding: "10px 8px", width: "140px" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 8px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "4px", overflow: "hidden", background: "#f0ebe0" }}>
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  {p.featured && <span style={{ fontSize: "10px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "3px", marginLeft: "6px" }}>精选</span>}
                  <br /><span style={{ fontSize: "11px", color: "#aaa" }}>{p.slug}</span>
                </td>
                <td style={{ padding: "10px 8px", fontWeight: 600, color: "#1a3a2a" }}>¥{Number(p.price)}</td>
                <td style={{ padding: "10px 8px" }}>{p.stock}</td>
                <td style={{ padding: "10px 8px", color: "#888" }}>{p.category?.name || "—"}</td>
                <td style={{ padding: "10px 8px" }}>
                  <Link href={`/admin/products/${p.id}/edit`} style={{ fontSize: "12px", color: "#1a3a2a", marginRight: "12px", textDecoration: "none" }}>
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    style={{ fontSize: "12px", color: "#dc2626", border: "none", background: "none", cursor: "pointer" }}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/admin/products/
git commit -m "feat: add admin product list page"
```

---

### Task 8: 商品新建/编辑表单 + 页面

**Files:**
- Create: `src/app/admin/products/new/page.tsx`
- Create: `src/app/admin/products/[id]/edit/page.tsx`
- Create: `src/app/admin/products/ProductForm.tsx`

- [ ] **Step 1: 创建 ProductForm 客户端组件**

创建 `src/app/admin/products/ProductForm.tsx`（一个组件同时支持新建和编辑，通过 `product` prop 区分）：

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";

interface Category {
  id: string;
  name: string;
}

interface ProductData {
  name: string;
  subtitle: string;
  englishName: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images: string[];
  featured: boolean;
  specs: string;
  features: string;
  brewing: string;
  storage: string;
}

interface Props {
  product?: {
    id: string;
    name: string;
    subtitle: string;
    englishName: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string | null;
    images: string[];
    featured: boolean;
    specs: string;
    features: unknown;
    brewing: unknown;
    storage: string;
  } | null;
}

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = !!product;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<ProductData>({
    name: product?.name || "",
    subtitle: product?.subtitle || "",
    englishName: product?.englishName || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: Number(product?.price) || 0,
    stock: product?.stock || 0,
    categoryId: product?.categoryId || "",
    images: product?.images || [],
    featured: product?.featured || false,
    specs: product?.specs || "",
    features: JSON.stringify(product?.features, null, 2) || "[]",
    brewing: JSON.stringify(product?.brewing, null, 2) || "{}",
    storage: product?.storage || "",
  });

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          // 从产品列表中提取唯一分类，或者从独立 API 获取
          const cats: Category[] = [];
          const seen = new Set<string>();
          d.data.forEach((p: any) => {
            if (p.category && !seen.has(p.category.id)) {
              seen.add(p.category.id);
              cats.push(p.category);
            }
          });
          setCategories(cats);
        }
      });
  }, []);

  function update<K extends keyof ProductData>(key: K, value: ProductData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // JSON 字段校验
    let features, brewing;
    try {
      features = JSON.parse(form.features);
      brewing = JSON.parse(form.brewing);
    } catch {
      setError("features 或 brewing 不是有效的 JSON 格式");
      setLoading(false);
      return;
    }

    const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        features,
        brewing,
        price: Number(form.price),
        stock: Number(form.stock),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setError(data.message);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2D24", marginBottom: "24px" }}>
        {isEdit ? "编辑商品" : "新建商品"}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
        {/* 图片 */}
        <div>
          <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>商品图片</label>
          <ImageUpload images={form.images} onChange={(urls) => update("images", urls)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>名称 *</label>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Slug *</label>
            <input value={form.slug} onChange={(e) => update("slug", e.target.value)} required
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>副标题</label>
            <input value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)}
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>英文名</label>
            <input value={form.englishName} onChange={(e) => update("englishName", e.target.value)}
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>价格 *</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => update("price", Number(e.target.value))} required
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>库存</label>
            <input type="number" value={form.stock} onChange={(e) => update("stock", Number(e.target.value))}
              style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>描述</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4}
            style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>分类</label>
            <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)}
              style={inputStyle}>
              <option value="">无分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>规格</label>
            <input value={form.specs} onChange={(e) => update("specs", e.target.value)}
              style={inputStyle} placeholder="如：250g / 500g" />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>产品特点 (JSON)</label>
          <textarea value={form.features} onChange={(e) => update("features", e.target.value)} rows={4}
            style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical" }}
            placeholder='["高山茶园", "手工采摘", ...]' />
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>冲泡参数 (JSON)</label>
          <textarea value={form.brewing} onChange={(e) => update("brewing", e.target.value)} rows={4}
            style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical" }}
            placeholder='{"waterTemp": "85°C", "steepTime": "3分钟", ...}' />
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>储存建议</label>
          <input value={form.storage} onChange={(e) => update("storage", e.target.value)}
            style={inputStyle} placeholder="阴凉干燥处密封保存" />
        </div>

        <label style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
          首页精选展示
        </label>

        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" disabled={loading}
            style={{
              padding: "10px 28px", background: "#1a3a2a", color: "#fff", border: "none",
              borderRadius: "6px", fontSize: "14px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}>
            {loading ? "保存中..." : isEdit ? "保存修改" : "创建商品"}
          </button>
          <button type="button" onClick={() => router.back()}
            style={{
              padding: "10px 28px", background: "#fff", color: "#888", border: "1px solid #d1d5db",
              borderRadius: "6px", fontSize: "14px", cursor: "pointer",
            }}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: "13px",
  border: "1px solid #d1d5db", borderRadius: "6px", outline: "none",
  boxSizing: "border-box",
};
```

- [ ] **Step 2: 创建新建商品页面（服务端组件）**

创建 `src/app/admin/products/new/page.tsx`：

```typescript
import ProductForm from "../ProductForm";

export default function NewProductPage() {
  return <ProductForm product={null} />;
}
```

- [ ] **Step 3: 创建编辑商品页面（服务端组件 → 获取产品数据）**

创建 `src/app/admin/products/[id]/edit/page.tsx`：

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProductForm from "../../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return <p style={{ textAlign: "center", color: "#888", padding: "60px 0" }}>商品不存在</p>;
  }

  return <ProductForm product={product} />;
}
```

- [ ] **Step 4: 提交**

```bash
git add src/app/admin/products/
git commit -m "feat: add product create/edit form with ImageUpload"
```

---

### Task 9: 订单管理 API

**Files:**
- Create: `src/app/api/admin/orders/route.ts`
- Create: `src/app/api/admin/orders/[id]/route.ts`
- Create: `src/app/api/admin/orders/[id]/status/route.ts`

- [ ] **Step 1: 创建订单列表 API**

创建 `src/app/api/admin/orders/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const where: any = {};
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: { product: { select: { id: true, name: true, images: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: orders });
}
```

- [ ] **Step 2: 创建订单详情 API**

创建 `src/app/api/admin/orders/[id]/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: { product: { select: { id: true, name: true, slug: true, images: true } } },
      },
      payments: true,
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: order });
}
```

- [ ] **Step 3: 创建订单状态更新 API**

创建 `src/app/api/admin/orders/[id]/status/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TRANSITIONS: Record<string, string[]> = {
  paid: ["shipped", "completed"],
  shipped: ["completed"],
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const { status: newStatus } = await request.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed || !allowed.includes(newStatus)) {
    return NextResponse.json(
      { success: false, error: "INVALID_STATUS", message: `不能从「${order.status}」变为「${newStatus}」` },
      { status: 400 }
    );
  }

  await prisma.order.update({ where: { id }, data: { status: newStatus } });

  return NextResponse.json({ success: true, message: "状态已更新" });
}
```

- [ ] **Step 4: 提交**

```bash
git add src/app/api/admin/orders/
git commit -m "feat: add admin order management API (list, detail, status update)"
```

---

### Task 10: 后台订单列表页面

**Files:**
- Create: `src/app/admin/orders/page.tsx`
- Create: `src/app/admin/orders/AdminOrderList.tsx`

- [ ] **Step 1: 创建后台订单列表容器**

```typescript
import AdminOrderList from "./AdminOrderList";

export default function AdminOrdersPage() {
  return <AdminOrderList />;
}
```

- [ ] **Step 2: 创建 AdminOrderList 客户端组件**

创建 `src/app/admin/orders/AdminOrderList.tsx`（表格形式，支持筛选 + 状态操作）。

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

  useEffect(() => {
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
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
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
      )}
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/admin/orders/page.tsx src/app/admin/orders/AdminOrderList.tsx
git commit -m "feat: add admin order list with status management"
```

---

### Task 11: 后台订单详情页面

**Files:**
- Create: `src/app/admin/orders/[id]/page.tsx`
- Create: `src/app/admin/orders/[id]/AdminOrderDetail.tsx`

- [ ] **Step 1: 创建后台订单详情容器**

```typescript
import AdminOrderDetail from "./AdminOrderDetail";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminOrderDetail orderId={id} />;
}
```

- [ ] **Step 2: 创建 AdminOrderDetail 客户端组件**

类似前台 OrderDetailClient，但增加状态操作按钮（标记发货/标记完成）和收货地址展示。

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "待付款", color: "#d97706", bg: "#fef3c7" },
  paid: { label: "已支付", color: "#059669", bg: "#d1fae5" },
  shipped: { label: "已发货", color: "#2563eb", bg: "#dbeafe" },
  completed: { label: "已完成", color: "#7c3aed", bg: "#ede9fe" },
  cancelled: { label: "已取消", color: "#dc2626", bg: "#fee2e2" },
  expired: { label: "已过期", color: "#9ca3af", bg: "#f3f4f6" },
};

export default function AdminOrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
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
    setOrder((prev: any) => prev ? { ...prev, status } : prev);
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

      {/* 用户信息 */}
      <div style={{ background: "#fff", borderRadius: "8px", padding: "16px", marginBottom: "16px", border: "1px solid #e5e7eb", fontSize: "13px" }}>
        <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{order.user.name}</p>
        <p style={{ margin: 0, color: "#888" }}>{order.user.email}</p>
      </div>

      {/* 商品列表 */}
      {order.items.map((item: any) => (
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

      {/* 订单信息 */}
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
            <span>{order.paymentMethod === "wechat" ? "微信支付" : "支付宝"}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
          <span style={{ fontWeight: 600 }}>总金额</span>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#1a3a2a" }}>¥{Number(order.total)}</span>
        </div>
      </div>

      {/* 状态操作按钮 */}
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
```

- [ ] **Step 3: 提交**

```bash
git add src/app/admin/orders/\[id\]/
git commit -m "feat: add admin order detail page with status actions"
```

---

### Task 12: Seed admin 用户 + 前台订单状态适配

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `src/app/account/OrderList.tsx`
- Modify: `src/app/orders/[id]/OrderDetailClient.tsx`

- [ ] **Step 1: seed 脚本中添加 admin 用户**

在 `prisma/seed.ts` 中添加：

```typescript
// Admin user (for Phase 5 admin dashboard)
const adminEmail = "admin@yueling.com";
const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
if (!existingAdmin) {
  await prisma.user.create({
    data: {
      name: "管理员",
      email: adminEmail,
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "admin",
    },
  });
  console.log("Admin user created: admin@yueling.com / admin123");
}
```

- [ ] **Step 2: 前台订单列表适配新状态**

在 `OrderList.tsx` 中：
1. TABS 扩展：新增 `{ key: "shipped", label: "已发货" }`、`{ key: "completed", label: "已完成" }`
2. STATUS_MAP 新增 shipped（蓝色 #2563eb）和 completed（紫色 #7c3aed）

- [ ] **Step 3: 前台订单详情适配新状态**

在 `OrderDetailClient.tsx` 中：
1. STATUS_MAP 新增 shipped 和 completed
2. 状态标签颜色同步新增

- [ ] **Step 4: 提交**

```bash
git add prisma/seed.ts src/app/account/OrderList.tsx src/app/orders/\[id\]/OrderDetailClient.tsx
git commit -m "feat: add admin seed user and ship/completed status labels"
```

---

### Task 13: 集成验证

- [ ] **Step 1: 确保编译通过**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: 确保构建通过**

```bash
npm run build
```

- [ ] **Step 3: 端到端测试**

1. 运行 `npm run seed` → admin 用户创建成功
2. 用 admin@yueling.com 登录 → 手动访问 `/admin` → 看到 Dashboard 概览
3. 普通用户访问 `/admin` → 403 页面
4. 后台新建商品 → 上传图片到 Supabase Storage → 创建成功
5. 商品列表显示所有商品 → 编辑 → 删除
6. 后台订单列表 → 筛选 → 标记发货 → 标记完成
7. 前台订单列表/详情页正确显示 shipped/completed 状态
8. 状态流转校验：paid → shipped ✅ / paid → completed ✅ / shipped → completed ✅ / 其他转换 ❌

- [ ] **Step 4: 提交（如有修复）**

```bash
git add -A
git commit -m "fix: integration fixes for admin dashboard"
```

---

## 验证清单

完成后逐项确认：

- [ ] admin 用户可访问 `/admin`，普通用户访问返回 403
- [ ] Dashboard 显示 4 个统计卡片（今日订单/待处理/商品总数/近7日销售额）
- [ ] 商品列表显示所有商品（缩略图/名称/价格/库存/分类/操作）
- [ ] 新建商品表单可上传图片（Supabase Storage），保存成功
- [ ] 编辑商品表单预填已有数据，修改保存成功
- [ ] 删除商品二次确认后删除成功
- [ ] 后台订单列表按状态筛选正常
- [ ] paid 订单可标记发货 → shipped，可标记完成 → completed
- [ ] shipped 订单可标记完成 → completed
- [ ] 非法状态转换返回 INVALID_STATUS 错误
- [ ] 前台订单列表/详情页正确显示 shipped 和 completed 状态
- [ ] 图片上传拒绝非图片文件、>5MB 文件
