# 用户系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为瀹岭电商平台添加完整的用户认证系统：注册、登录、忘记密码、个人中心（信息编辑、密码修改、地址管理、订单占位）。

**Architecture:** NextAuth.js v5 Credentials Provider + JWT session。注册为独立 API Route，登录走 NextAuth Credentials 流程。密码重置通过 DB token 实现。个人中心为单页客户端组件，左侧导航切换右侧内容。

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7, PostgreSQL, Tailwind CSS 4, bcryptjs

---

## 文件结构

```
创建:
  src/lib/auth.ts                           # NextAuth 配置
  src/lib/validations.ts                     # 表单校验函数
  src/app/api/auth/[...nextauth]/route.ts    # NextAuth 路由处理
  src/app/api/auth/register/route.ts         # 注册 API
  src/app/api/auth/forgot-password/route.ts  # 忘记密码 API
  src/app/api/auth/reset-password/route.ts   # 重置密码 API
  src/app/api/account/route.ts               # 个人信息 GET/PUT
  src/app/api/account/password/route.ts      # 修改密码 PUT
  src/app/api/account/addresses/route.ts     # 地址列表 GET/POST
  src/app/api/account/addresses/[id]/route.ts  # 单个地址 PUT/DELETE
  src/app/api/account/orders/route.ts        # 订单列表 GET (stub)
  src/app/auth/layout.tsx                    # 认证页布局（卡片居中）
  src/app/auth/login/page.tsx                # 登录页
  src/app/auth/register/page.tsx             # 注册页
  src/app/auth/forgot-password/page.tsx      # 忘记密码页
  src/app/auth/reset-password/page.tsx       # 重置密码页
  src/app/account/page.tsx                   # 个人中心主容器
  src/app/account/AccountContent.tsx         # 内容切换组件
  src/components/AccountSidebar.tsx          # 左侧导航
  src/middleware.ts                          # 路由守卫

修改:
  prisma/schema.prisma                       # 新增 PasswordResetToken, ShippingAddress
  src/components/Navbar.tsx                  # 添加登录/注册/用户名/退出
  src/app/layout.tsx                         # 可能包裹 SessionProvider
```

---

### Task 1: 数据库 Schema 更新

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 新增 PasswordResetToken 和 ShippingAddress 模型**

在 `prisma/schema.prisma` 末尾添加以下两个模型：

```prisma
model PasswordResetToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model ShippingAddress {
  id        String  @id @default(uuid()) @db.Uuid
  userId    String  @db.Uuid
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  phone     String
  province  String
  city      String
  district  String
  detail    String
  isDefault Boolean @default(false)
}
```

- [ ] **Step 2: 运行数据库迁移**

```bash
npx prisma migrate dev --name add_password_reset_and_address
```

- [ ] **Step 3: 重新生成 Prisma Client**

```bash
npx prisma generate
```

- [ ] **Step 4: 提交**

```bash
git add prisma/schema.prisma prisma/migrations/ src/generated/
git commit -m "feat: add PasswordResetToken and ShippingAddress models"
```

---

### Task 2: 校验函数

**Files:**
- Create: `src/lib/validations.ts`

- [ ] **Step 1: 编写校验函数**

```typescript
export type ValidationResult =
  | { success: true }
  | { success: false; error: string; message: string };

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { success: false, error: "VALIDATION_ERROR", message: "请输入邮箱地址" };
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return { success: false, error: "VALIDATION_ERROR", message: "请输入有效的邮箱地址" };
  }
  return { success: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 6) {
    return { success: false, error: "VALIDATION_ERROR", message: "密码至少需要6个字符" };
  }
  return { success: true };
}

export function validateName(name: string): ValidationResult {
  if (!name || name.trim().length < 2) {
    return { success: false, error: "VALIDATION_ERROR", message: "用户名至少需要2个字符" };
  }
  if (name.trim().length > 20) {
    return { success: false, error: "VALIDATION_ERROR", message: "用户名不能超过20个字符" };
  }
  return { success: true };
}

export function validatePhone(phone: string | undefined | null): ValidationResult {
  if (!phone || phone.trim().length === 0) return { success: true }; // 选填
  const re = /^1[3-9]\d{9}$/;
  if (!re.test(phone.trim())) {
    return { success: false, error: "VALIDATION_ERROR", message: "请输入有效的手机号" };
  }
  return { success: true };
}

export function validatePasswordMatch(password: string, confirm: string): ValidationResult {
  if (password !== confirm) {
    return { success: false, error: "VALIDATION_ERROR", message: "两次密码输入不一致" };
  }
  return { success: true };
}

export function validateRegisterInput(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}): ValidationResult {
  const checks = [
    validateName(input.name),
    validateEmail(input.email),
    validatePassword(input.password),
    validatePasswordMatch(input.password, input.confirmPassword),
    validatePhone(input.phone),
  ];
  for (const check of checks) {
    if (!check.success) return check;
  }
  return { success: true };
}

export function validateResetPasswordInput(input: {
  password: string;
  confirmPassword: string;
}): ValidationResult {
  const checks = [
    validatePassword(input.password),
    validatePasswordMatch(input.password, input.confirmPassword),
  ];
  for (const check of checks) {
    if (!check.success) return check;
  }
  return { success: true };
}
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/validations.ts
git commit -m "feat: add form validation helpers"
```

---

### Task 3: NextAuth 配置

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: 生成 AUTH_SECRET**

```bash
npx auth secret
```
（此命令读取 `.env` 并追加 `AUTH_SECRET=<random>`）

如果命令不可用，手动运行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" >> .env
```
然后手动在 `.env` 中添加 `AUTH_SECRET=` 行。

- [ ] **Step 2: 创建 NextAuth 配置**

创建 `src/lib/auth.ts`：

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 3: 创建 NextAuth 路由处理**

创建 `src/app/api/auth/[...nextauth]/route.ts`：

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: 确认 TypeScript 编译通过**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 提交**

```bash
git add src/lib/auth.ts src/app/api/auth/[...nextauth]/route.ts .env
git commit -m "feat: configure NextAuth.js v5 with credentials provider"
```

---

### Task 4: 注册 API

**Files:**
- Create: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: 创建注册路由**

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateRegisterInput } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, phone } = body;

    const validation = validateRegisterInput({ name, email, password, confirmPassword, phone });
    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "EMAIL_TAKEN", message: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        passwordHash,
        phone: phone?.trim() || null,
      },
    });

    return NextResponse.json(
      { success: true, data: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat: add registration API endpoint"
```

---

### Task 5: 忘记密码 & 重置密码 API

**Files:**
- Create: `src/app/api/auth/forgot-password/route.ts`
- Create: `src/app/api/auth/reset-password/route.ts`

- [ ] **Step 1: 创建忘记密码 API**

创建 `src/app/api/auth/forgot-password/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const validation = validateEmail(email);
    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // 无论用户是否存在都返回成功，避免邮箱探测
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "如果该邮箱已注册，重置链接已发送",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1小时

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: 接入邮件服务发送重置链接
    // 当前阶段，token 记录在数据库，可通过 Prisma Studio 查看
    console.log(`Password reset link: http://localhost:105/auth/reset-password?token=${token}`);

    return NextResponse.json({
      success: true,
      message: "如果该邮箱已注册，重置链接已发送",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 创建重置密码 API**

创建 `src/app/api/auth/reset-password/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateResetPasswordInput } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN", message: "重置链接无效" },
        { status: 400 }
      );
    }

    const validation = validateResetPasswordInput({ password, confirmPassword });
    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      if (resetToken) {
        await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      }
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN", message: "重置链接已过期或无效" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    return NextResponse.json({ success: true, message: "密码已重置，请登录" });
  } catch {
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/api/auth/forgot-password/route.ts src/app/api/auth/reset-password/route.ts
git commit -m "feat: add forgot/reset password API endpoints"
```

---

### Task 6: 个人中心 API（个人信息 + 修改密码）

**Files:**
- Create: `src/app/api/account/route.ts`
- Create: `src/app/api/account/password/route.ts`

- [ ] **Step 1: 创建个人信息 GET/PUT**

创建 `src/app/api/account/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateName, validatePhone } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "用户不存在" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: user });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { name, phone } = body;

  const nameCheck = validateName(name);
  if (!nameCheck.success) {
    return NextResponse.json(nameCheck, { status: 400 });
  }

  const phoneCheck = validatePhone(phone);
  if (!phoneCheck.success) {
    return NextResponse.json(phoneCheck, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name.trim(), phone: phone?.trim() || null },
    select: { id: true, name: true, email: true, phone: true },
  });

  return NextResponse.json({ success: true, data: user });
}
```

- [ ] **Step 2: 创建修改密码 API**

创建 `src/app/api/account/password/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePassword, validatePasswordMatch } from "@/lib/validations";

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const { currentPassword, newPassword, confirmPassword } = await request.json();

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.success) {
    return NextResponse.json(pwCheck, { status: 400 });
  }

  const matchCheck = validatePasswordMatch(newPassword, confirmPassword);
  if (!matchCheck.success) {
    return NextResponse.json(matchCheck, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "用户不存在" },
      { status: 404 }
    );
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { success: false, error: "WRONG_PASSWORD", message: "当前密码错误" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ success: true, message: "密码修改成功" });
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/api/account/route.ts src/app/api/account/password/route.ts
git commit -m "feat: add account profile and password API endpoints"
```

---

### Task 7: 收货地址 API

**Files:**
- Create: `src/app/api/account/addresses/route.ts`
- Create: `src/app/api/account/addresses/[id]/route.ts`

- [ ] **Step 1: 创建地址列表 GET/POST**

创建 `src/app/api/account/addresses/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const addresses = await prisma.shippingAddress.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ success: true, data: addresses });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { name, phone, province, city, district, detail, isDefault } = body;

  if (!name || !phone || !province || !city || !district || !detail) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "请填写完整的地址信息" },
      { status: 400 }
    );
  }

  if (isDefault) {
    await prisma.shippingAddress.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.shippingAddress.create({
    data: {
      userId: session.user.id,
      name,
      phone,
      province,
      city,
      district,
      detail,
      isDefault: isDefault || false,
    },
  });

  return NextResponse.json({ success: true, data: address }, { status: 201 });
}
```

- [ ] **Step 2: 创建单个地址 PUT/DELETE**

先创建目录 `src/app/api/account/addresses/[id]/`，然后创建 `route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const { name, phone, province, city, district, detail, isDefault } = body;

  const existing = await prisma.shippingAddress.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND", message: "地址不存在" },
      { status: 404 }
    );
  }

  if (isDefault) {
    await prisma.shippingAddress.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.shippingAddress.update({
    where: { id },
    data: { name, phone, province, city, district, detail, isDefault },
  });

  return NextResponse.json({ success: true, data: address });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const existing = await prisma.shippingAddress.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND", message: "地址不存在" },
      { status: 404 }
    );
  }

  await prisma.shippingAddress.delete({ where: { id } });

  return NextResponse.json({ success: true, message: "地址已删除" });
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/api/account/addresses/
git commit -m "feat: add shipping address API endpoints"
```

---

### Task 8: 订单列表 Stub API

**Files:**
- Create: `src/app/api/account/orders/route.ts`

- [ ] **Step 1: 创建订单列表 GET (stub)**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, data: [] });
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/account/orders/route.ts
git commit -m "feat: add orders API stub"
```

---

### Task 9: 中间件（路由守卫）

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: 创建中间件**

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // 已登录用户访问 auth 页面 → 重定向到 account
  if (isLoggedIn && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  // 未登录用户访问 account → 重定向到 login
  if (!isLoggedIn && pathname.startsWith("/account")) {
    const callbackUrl = encodeURIComponent(req.url);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/auth/:path*"],
};
```

- [ ] **Step 2: 提交**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware for route protection"
```

---

### Task 10: 认证页面 UI

**Files:**
- Create: `src/app/auth/layout.tsx`
- Create: `src/app/auth/login/page.tsx`
- Create: `src/app/auth/register/page.tsx`
- Create: `src/app/auth/forgot-password/page.tsx`
- Create: `src/app/auth/reset-password/page.tsx`

- [ ] **Step 1: 创建认证页布局**

创建 `src/app/auth/layout.tsx`：

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "24px" }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: 创建登录页**

创建 `src/app/auth/login/page.tsx`：

```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("邮箱或密码错误");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "24px", color: "#1a3a2a", margin: "0 0 4px" }}>
          瀹岭
        </h1>
        <p style={{ fontSize: "16px", color: "#333", fontWeight: 600 }}>欢迎回来</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <input
          type="email"
          placeholder="邮箱地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "320px", padding: "10px 12px", fontSize: "14px",
            border: "1px solid #d1d5db", borderRadius: "6px", outline: "none",
          }}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "320px", padding: "10px 12px", fontSize: "14px",
            border: "1px solid #d1d5db", borderRadius: "6px", outline: "none",
          }}
        />
        <div style={{ width: "320px", textAlign: "right" }}>
          <Link href="/auth/forgot-password" style={{ fontSize: "12px", color: "#888" }}>
            忘记密码？
          </Link>
        </div>
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "170px", padding: "10px", fontSize: "14px", fontWeight: 600,
            background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "登录中..." : "登 录"}
        </button>
        <p style={{ fontSize: "13px", color: "#888" }}>
          还没有账号？<Link href="/auth/register" style={{ color: "#1a3a2a" }}>立即注册</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: 创建注册页**

创建 `src/app/auth/register/page.tsx`：

```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword, phone: phone || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    // 注册成功 → 自动登录
    await signIn("credentials", { email, password, redirect: false });
    router.push("/account");
    router.refresh();
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "24px", color: "#1a3a2a", margin: "0 0 4px" }}>
          瀹岭
        </h1>
        <p style={{ fontSize: "16px", color: "#333", fontWeight: 600 }}>创建账号</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <input
          type="text"
          placeholder="用户名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
        />
        <input
          type="email"
          placeholder="邮箱地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
        />
        <input
          type="password"
          placeholder="确认密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
        />
        <input
          type="tel"
          placeholder="手机号（选填）"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
        />
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "170px", padding: "10px", fontSize: "14px", fontWeight: 600,
            background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "注册中..." : "注 册"}
        </button>
        <p style={{ fontSize: "13px", color: "#888" }}>
          已有账号？<Link href="/auth/login" style={{ color: "#1a3a2a" }}>立即登录</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: 创建忘记密码页**

创建 `src/app/auth/forgot-password/page.tsx`：

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess(data.message);
    } else {
      setError(data.message);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "24px", color: "#1a3a2a", margin: "0 0 4px" }}>
          瀹岭
        </h1>
        <p style={{ fontSize: "16px", color: "#333", fontWeight: 600 }}>找回密码</p>
        <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
          输入注册邮箱，我们将发送重置链接
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <input
          type="email"
          placeholder="邮箱地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
        />
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "13px" }}>{success}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "170px", padding: "10px", fontSize: "14px", fontWeight: 600,
            background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "发送中..." : "发送重置链接"}
        </button>
        <p style={{ fontSize: "13px", color: "#888" }}>
          <Link href="/auth/login" style={{ color: "#1a3a2a" }}>← 返回登录</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: 创建重置密码页**

创建 `src/app/auth/reset-password/page.tsx`：

```typescript
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("无效的重置链接");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess("密码已重置，即将跳转...");
      setTimeout(() => router.push("/auth/login"), 2000);
    } else {
      setError(data.message);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-serif-cn)", fontSize: "24px", color: "#1a3a2a", margin: "0 0 4px" }}>
          瀹岭
        </h1>
        <p style={{ fontSize: "16px", color: "#333", fontWeight: 600 }}>设置新密码</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <input
          type="password"
          placeholder="新密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
        />
        <input
          type="password"
          placeholder="确认新密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
        />
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "13px" }}>{success}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "170px", padding: "10px", fontSize: "14px", fontWeight: 600,
            background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "重置中..." : "重置密码"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: "center", color: "#888" }}>加载中...</p>}>
      <ResetForm />
    </Suspense>
  );
}
```

- [ ] **Step 6: 提交**

```bash
git add src/app/auth/
git commit -m "feat: add auth pages (login, register, forgot/reset password)"
```

---

### Task 11: 个人中心页面

**Files:**
- Create: `src/components/AccountSidebar.tsx`
- Create: `src/app/account/AccountContent.tsx`
- Create: `src/app/account/page.tsx`

- [ ] **Step 1: 创建侧边导航组件**

创建 `src/components/AccountSidebar.tsx`：

```typescript
"use client";

type Tab = "profile" | "orders" | "addresses" | "password";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { key: Tab; label: string }[] = [
  { key: "profile", label: "个人信息" },
  { key: "orders", label: "我的订单" },
  { key: "addresses", label: "收货地址" },
  { key: "password", label: "修改密码" },
];

export default function AccountSidebar({ activeTab, onTabChange }: Props) {
  return (
    <nav style={{ width: "180px", borderRight: "1px solid #e0e0e0", paddingRight: "16px", flexShrink: 0 }}>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            padding: "12px 16px",
            fontSize: "14px",
            cursor: "pointer",
            borderRadius: "4px",
            marginBottom: "4px",
            color: activeTab === tab.key ? "#fff" : "#555",
            background: activeTab === tab.key ? "#1a3a2a" : "transparent",
            fontWeight: activeTab === tab.key ? 600 : 400,
          }}
        >
          {tab.label}
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: 创建内容切换组件**

创建 `src/app/account/AccountContent.tsx`：

```typescript
"use client";

import { useState } from "react";
import AccountSidebar from "@/components/AccountSidebar";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";
import AddressList from "./AddressList";
import OrderList from "./OrderList";

type Tab = "profile" | "orders" | "addresses" | "password";

export default function AccountContent() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div style={{ display: "flex", gap: "24px" }}>
      <AccountSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ flex: 1 }}>
        {activeTab === "profile" && <ProfileForm />}
        {activeTab === "orders" && <OrderList />}
        {activeTab === "addresses" && <AddressList />}
        {activeTab === "password" && <PasswordForm />}
      </div>
    </div>
  );
}
```

注意：`ProfileForm`、`PasswordForm`、`AddressList`、`OrderList` 作为同目录下的子组件，在后续步骤中创建。

- [ ] **Step 3: 创建 ProfileForm 组件**

创建 `src/app/account/ProfileForm.tsx`：

```typescript
"use client";

import { useState, useEffect } from "react";

interface Profile {
  name: string;
  email: string;
  phone: string;
}

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile>({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProfile(d.data); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name, phone: profile.phone || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess("保存成功");
    } else {
      setError(data.message);
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>基本信息</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "60px", fontSize: "14px", color: "#666", textAlign: "center" }}>用户名</span>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
            style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "60px", fontSize: "14px", color: "#666", textAlign: "center" }}>邮箱</span>
          <input
            type="email"
            value={profile.email}
            disabled
            style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e7eb", borderRadius: "6px", outline: "none", background: "#f9fafb", color: "#999" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "60px", fontSize: "14px", color: "#666", textAlign: "center" }}>手机号</span>
          <input
            type="tel"
            placeholder="选填"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
          />
        </div>
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "13px" }}>{success}</p>}
        <div style={{ marginTop: "8px", width: "392px", display: "flex", justifyContent: "center" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "140px", padding: "9px", fontSize: "14px", fontWeight: 600,
              background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "保存中..." : "保存修改"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: 创建 PasswordForm 组件**

创建 `src/app/account/PasswordForm.tsx`：

```typescript
"use client";

import { useState } from "react";

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess("密码修改成功");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(data.message);
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>修改密码</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "80px", fontSize: "14px", color: "#666", textAlign: "center" }}>当前密码</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "80px", fontSize: "14px", color: "#666", textAlign: "center" }}>新密码</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "80px", fontSize: "14px", color: "#666", textAlign: "center" }}>确认新密码</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: "320px", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }}
          />
        </div>
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "13px" }}>{success}</p>}
        <div style={{ marginTop: "8px", width: "412px", display: "flex", justifyContent: "center" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "140px", padding: "9px", fontSize: "14px", fontWeight: 600,
              background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "修改中..." : "修改密码"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: 创建 AddressList 组件**

创建 `src/app/account/AddressList.tsx`：

```typescript
"use client";

import { useState, useEffect } from "react";

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

export default function AddressList() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", province: "", city: "", district: "", detail: "", isDefault: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    const res = await fetch("/api/account/addresses");
    const data = await res.json();
    if (data.success) setAddresses(data.data);
  }

  function resetForm() {
    setForm({ name: "", phone: "", province: "", city: "", district: "", detail: "", isDefault: false });
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const url = editingId
      ? `/api/account/addresses/${editingId}`
      : "/api/account/addresses";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.success) {
      setSuccess(editingId ? "地址已更新" : "地址已添加");
      resetForm();
      fetchAddresses();
    } else {
      setError(data.message);
    }
  }

  function editAddress(addr: Address) {
    setEditingId(addr.id);
    setForm({ name: addr.name, phone: addr.phone, province: addr.province, city: addr.city, district: addr.district, detail: addr.detail, isDefault: addr.isDefault });
  }

  async function deleteAddress(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    fetchAddresses();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600 }}>收货地址</h3>
        {!editingId && (
          <button
            onClick={resetForm}
            style={{ padding: "6px 14px", fontSize: "13px", background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            新增地址
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px", padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <input placeholder="收件人" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
            style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
          <input placeholder="电话" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required
            style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <input placeholder="省" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} required
            style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
          <input placeholder="市" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required
            style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
          <input placeholder="区" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required
            style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        </div>
        <input placeholder="详细地址" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} required
          style={{ padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        <label style={{ fontSize: "13px", color: "#666", display: "flex", alignItems: "center", gap: "6px" }}>
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
          设为默认地址
        </label>
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "13px" }}>{success}</p>}
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="submit" style={{ padding: "8px 20px", fontSize: "13px", background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            {editingId ? "更新地址" : "添加地址"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ padding: "8px 20px", fontSize: "13px", background: "#eee", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              取消
            </button>
          )}
        </div>
      </form>

      {addresses.length === 0 && !editingId && (
        <p style={{ textAlign: "center", color: "#aaa", padding: "40px 0" }}>暂无地址</p>
      )}

      {addresses.map((addr) => (
        <div key={addr.id} style={{ padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>
              {addr.name} {addr.phone}
              {addr.isDefault && <span style={{ fontSize: "11px", color: "#1a3a2a", marginLeft: "8px" }}>[默认]</span>}
            </p>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
              {addr.province}{addr.city}{addr.district} {addr.detail}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => editAddress(addr)} style={{ fontSize: "12px", color: "#1a3a2a", border: "none", background: "none", cursor: "pointer" }}>编辑</button>
            <button onClick={() => deleteAddress(addr.id)} style={{ fontSize: "12px", color: "#dc2626", border: "none", background: "none", cursor: "pointer" }}>删除</button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: 创建 OrderList 组件**

创建 `src/app/account/OrderList.tsx`：

```typescript
"use client";

export default function OrderList() {
  return (
    <div>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>我的订单</h3>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        {["全部", "待付款", "已发货", "已完成"].map((label, i) => (
          <span
            key={label}
            style={{
              fontSize: "13px", padding: "4px 12px", borderRadius: "4px",
              color: i === 0 ? "#fff" : "#888", background: i === 0 ? "#1a3a2a" : "transparent",
              cursor: "pointer",
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <p style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>暂无订单</p>
    </div>
  );
}
```

- [ ] **Step 7: 创建个人中心页面容器**

创建 `src/app/account/page.tsx`：

```typescript
import AccountContent from "./AccountContent";

export default function AccountPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "32px" }}>个人中心</h2>
      <AccountContent />
    </div>
  );
}
```

- [ ] **Step 8: 提交**

```bash
git add src/components/AccountSidebar.tsx src/app/account/
git commit -m "feat: add account page with profile, password, addresses, and orders"
```

---

### Task 12: 导航栏集成

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: 读取 Navbar 当前代码**

先阅读 `src/components/Navbar.tsx` 以了解当前结构和样式。

- [ ] **Step 2: 添加认证链接**

在 Navbar 中，找到导航链接区域（通常在右侧），根据 session 状态渲染不同内容。

需要先导入 `auth`：

```typescript
import { auth } from "@/lib/auth";
```

然后将组件改为 async 组件，调用 `const session = await auth()`。

在导航栏右侧区域添加：

```tsx
{/* 右侧：认证入口 */}
<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
  {session ? (
    <>
      <a href="/account" style={{ fontSize: "14px", color: "#1a3a2a" }}>{session.user?.name}</a>
      <a href="/api/auth/signout" style={{ fontSize: "14px", color: "#888" }}>退出</a>
    </>
  ) : (
    <>
      <a href="/auth/login" style={{ fontSize: "14px", color: "#1a3a2a" }}>登录</a>
      <a href="/auth/register" style={{ fontSize: "14px", color: "#1a3a2a" }}>注册</a>
    </>
  )}
</div>
```

注意：需要检查当前 Navbar 是否为 `"use client"` 组件。如果是，需要改为服务端组件或者使用 `useSession` hook。

如果 Navbar 是服务端组件（无 `"use client"`），直接使用 `auth()`。
如果是客户端组件，使用 `import { useSession } from "next-auth/react"` 客户端 hook。

- [ ] **Step 3: 提交**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: add auth links to navbar"
```

---

### Task 13: 集成验证

**Files:**
- 无新建，验证已有功能

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

- [ ] **Step 2: 验证注册流程**

用 curl 或浏览器测试：

```bash
curl -X POST http://localhost:105/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com","password":"123456","confirmPassword":"123456"}'
```

预期返回 `{"success":true, ...}` 状态 201。

再次运行相同请求，预期返回 `{"success":false,"error":"EMAIL_TAKEN", ...}` 状态 409。

- [ ] **Step 3: 验证登录流程**

```bash
curl -X POST http://localhost:105/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'email=test@example.com&password=123456'
```

预期返回 302 重定向，Set-Cookie 含 session token。

- [ ] **Step 4: 验证个人中心 API**

先获取登录后的 cookie，然后：

```bash
curl http://localhost:105/api/account -H "Cookie: <session-cookie>"
```

预期返回用户信息 JSON。

- [ ] **Step 5: 验证忘记密码流程**

创建重置 token：

```bash
curl -X POST http://localhost:105/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

在 Prisma Studio 中查看 token，或用该 token 测试重置密码。

- [ ] **Step 6: 浏览器端到端验证**

打开 http://localhost:105，依次测试：
1. 点击导航栏「注册」→ 注册新账号 → 注册成功后自动跳转到个人中心
2. 退出登录 → 点击「登录」→ 登录成功跳转到个人中心
3. 个人中心中编辑信息、修改密码、添加地址
4. 未登录访问 /account → 重定向到 /auth/login
5. 已登录访问 /auth/login → 重定向到 /account

- [ ] **Step 7: 提交（如有修复）**

如有修改，执行：
```bash
git add -A
git commit -m "fix: integration fixes for user system"
```

---

## 验证清单

完成后逐项确认：

- [ ] `POST /api/auth/register` 校验通过则创建用户，返回 201
- [ ] `POST /api/auth/register` 重复邮箱返回 409 EMAIL_TAKEN
- [ ] `POST /api/auth/register` 无效输入返回 400 VALIDATION_ERROR
- [ ] 登录页表单提交错误邮箱/密码显示错误提示
- [ ] 登录成功跳转到 /account
- [ ] `GET /api/account` 未登录返回 401
- [ ] `GET /api/account` 已登录返回用户信息
- [ ] `PUT /api/account` 更新成功返回新数据
- [ ] `PUT /api/account/password` 当前密码错误返回 WRONG_PASSWORD
- [ ] `PUT /api/account/password` 修改成功
- [ ] 地址 CRUD 全流程正常
- [ ] 忘记密码 → 重置密码全流程正常
- [ ] 导航栏未登录显示登录/注册，已登录显示用户名/退出
- [ ] `/account/*` 未登录重定向到 `/auth/login`
- [ ] `/auth/*` 已登录重定向到 `/account`
