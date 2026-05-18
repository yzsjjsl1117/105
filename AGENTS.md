# AGENTS.md

## 项目概述

**瀹岭** — 单品牌茶叶自营电商平台。从静态展示站重构为全栈电商，目标打造切实可用的产品级在线茶店。

- **品牌名称：** 瀹岭
- **产品定位：** 高山绿茶、红茶，源自安徽黄山
- **目标用户：** 国内消费者
- **初期 SKU：** 3-10 款茶叶
- **支付方式：** 微信支付 + 支付宝

---

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | PostgreSQL (Supabase 免费层) |
| ORM | Prisma 7 |
| 认证 | NextAuth.js v5 (beta) |
| 密码 | bcryptjs |
| 部署 | Vercel |
| 字体 | Noto Serif SC + Playfair Display (Google Fonts) |

---

## 项目结构

```
e:\Workspace\105\
├── prisma/
│   ├── schema.prisma           # 数据库 schema (10 张表)
│   ├── seed.ts                 # 种子数据脚本
│   ├── config.ts               # Prisma 配置
│   └── migrations/             # 迁移文件
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根布局（含 SessionProvider）
│   │   ├── globals.css         # 全局样式（含复杂动画/蒙版）
│   │   ├── page.tsx            # 首页（组合各组件）
│   │   ├── account/
│   │   │   ├── page.tsx            # 个人中心页面容器
│   │   │   ├── AccountContent.tsx  # 内容切换（tab 管理）
│   │   │   ├── ProfileForm.tsx     # 个人信息编辑
│   │   │   ├── PasswordForm.tsx    # 修改密码
│   │   │   ├── AddressList.tsx     # 地址管理 CRUD
│   │   │   └── OrderList.tsx       # 订单列表（stub）
│   │   ├── auth/
│   │   │   ├── layout.tsx                # 认证页布局（卡片居中）
│   │   │   ├── login/page.tsx            # 登录页
│   │   │   ├── register/page.tsx         # 注册页
│   │   │   ├── forgot-password/page.tsx  # 忘记密码页
│   │   │   └── reset-password/page.tsx   # 重置密码页
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts  # NextAuth 路由
│   │   │   │   ├── register/route.ts       # 注册 API
│   │   │   │   ├── forgot-password/route.ts  # 忘记密码 API
│   │   │   │   └── reset-password/route.ts   # 重置密码 API
│   │   │   └── account/
│   │   │       ├── route.ts                    # 个人信息 GET/PUT
│   │   │       ├── password/route.ts           # 修改密码 PUT
│   │   │       ├── orders/route.ts             # 订单列表 GET (stub)
│   │   │       └── addresses/
│   │   │           ├── route.ts                # 地址列表 GET/POST
│   │   │           └── [id]/route.ts           # 单个地址 PUT/DELETE
│   │   └── products/
│   │       └── [slug]/
│   │           └── page.tsx    # 产品详情页（数据库读取）
│   ├── components/
│   │   ├── Navbar.tsx          # 导航栏（桌面/移动端 + 滚动检测 + 认证状态）
│   │   ├── Hero.tsx            # 首屏（视差 + 电影质感蒙版）
│   │   ├── BrandStory.tsx      # 品牌故事（6 图轮播 + 滚轮劫持）
│   │   ├── CraftProcess.tsx    # 制茶工艺（5 步时间线 + 图片切换）
│   │   ├── ProductShowcase.tsx # 产品卡片陈列
│   │   ├── Footer.tsx          # 页脚
│   │   ├── SessionProvider.tsx # NextAuth 客户端 Provider
│   │   └── AccountSidebar.tsx  # 个人中心左侧导航
│   ├── lib/
│   │   ├── prisma.ts           # Prisma Client 单例
│   │   ├── products.ts         # 产品数据查询函数
│   │   ├── auth.ts             # NextAuth 配置（Credentials + JWT）
│   │   ├── validations.ts      # 表单校验函数（8 个 validator）
│   │   ├── email.ts            # 邮件发送封装（nodemailer）
│   │   ├── email-templates.ts  # HTML 邮件模板
│   │   └── rate-limit.ts       # 速率限制（Prisma 滑动窗口）
│   ├── types/
│   │   └── next-auth.d.ts      # Session.user.id 类型扩展
│   └── middleware.ts           # 路由守卫（cookie 检查）
├── public/
│   └── images/                 # 产品图、工艺图、封面等 (18 张)
├── .env                        # 数据库连接串 + AUTH_SECRET
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

---

## 数据库表

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| User | 用户 | id, name, email, passwordHash, phone, role |
| Category | 产品分类 | id, name, slug |
| Product | 产品 | id, name, slug, price, images, features(JSON), brewing(JSON), stock |
| CartItem | 购物车 | id, userId, productId, quantity |
| Order | 订单 | id, userId, status, total, paymentMethod |
| OrderItem | 订单明细 | id, orderId, productId, quantity, price |
| PaymentRecord | 支付记录 | id, orderId, method, amount, status, thirdPartyId |
| PasswordResetToken | 密码重置 | id, userId, token, expiresAt |
| ShippingAddress | 收货地址 | id, userId, name, phone, province, city, district, detail, isDefault |
| RateLimitRecord | 限流记录 | id, ip, action, createdAt |

---

## 当前进度

### ✅ 已完成

| 阶段 | 内容 | 状态 |
|------|------|------|
| 第〇阶段 | 项目初始化、Prisma、数据库、目录结构 | ✅ |
| 第一阶段 | 页面迁移、品牌改名、组件拆分、种子数据、UI 修复 | ✅ |

### ✅ 已完成

| 阶段 | 内容 | 状态 |
|------|------|------|
| 第二阶段 | 用户系统（注册/登录/个人中心） | ✅ |

### 🔜 待实施

| 阶段 | 内容 | 状态 |
|------|------|------|
| 第三阶段 | 购物车 + 下单 | ⏳ |
| 第四阶段 | 支付集成（微信/支付宝） | ⏳ |
| 第五阶段 | 后台管理（商品/订单 CRUD） | ⏳ |
| 第六阶段 | 打磨上线（响应式/SEO/部署） | ⏳ |

---

## 当前 Change

**Change 名称：** 瀹岭全栈电商平台  
**Change 范围：** 从零搭建完整电商系统  
**Change 状态：** 进行中（第二阶段用户系统完成）  

### 本次 Change 包含

- ✅ 项目脚手架搭建（Next.js + TypeScript + Tailwind + Prisma）
- ✅ 静态 HTML → React 组件迁移
- ✅ 品牌改名（云松茶语 → 瀹岭）
- ✅ 数据库设计与种子数据
- ✅ 产品详情页动态路由
- ✅ 用户认证系统（注册/登录/忘记密码/个人中心/地址管理）
- ⏳ 购物车与下单
- ⏳ 微信支付 + 支付宝集成
- ⏳ 管理后台
- ⏳ 响应式适配与上线

---

## 2026-05-18 UI 修复记录

### Tailwind CSS 4 兼容性
- 全局替换 `space-x-*` / `space-y-*` → `gap-*`（Tailwind 4 不再生成 space 工具类）
- 多处关键布局改用内联 style 规避 CSS 级联不确定性（`mx-auto`、`w-full`、`h-full`、`absolute` 等）
- `.process-image` 移除 `position: relative` 解决与 `.absolute` 的级联冲突

### 导航栏 (Navbar)
- 定位/背景改用内联 style 确保 `position: fixed` 不被覆盖
- 上下高度从 16px 调整至 8px，水平内边距 64px/44px
- Logo 改用原生 `<img>` 替代 Next.js `Image`，添加 `shrink-0`
- 首次渲染增加滚动位置检测

### 品牌故事 (BrandStory)
- 幻灯片 2-6 重构为 section 直接子元素（修复原版中绝对定位父容器高度塌陷）
- 幻灯片切换动画：背景 `storyBgIn`（opacity 0→1, 1.5s），文字 `storyFadeUp`（opacity 0→1 + translateY 20→0, 0.9s，延迟 0.3s/0.5s/0.8s）
- 深墨绿过渡遮罩 `#0B120D`，0.4s，仅图片区域，6→1 和 2→1 跳过
- Section 高度 `calc(100vh - 56px)`，`scrollMarginTop: 56px` 对齐导航栏
- 幻灯片 paddingTop 24px，图片静态 `scale(1.03)` 微缩放
- 底部渐变阴影大幅减弱

### 制茶工艺 (CraftProcess)
- 补充背景时间线竖条 + 指示器高度修正（80→60）
- 补充 `.craft-step.active .craft-step-title` CSS
- 移除 `min-height: 90px` 解决步骤间距不均
- 移除 `.craft-step` 的 `border-radius` 和 box-shadow
- 步骤间距 gap 24px，数字宽度 28px 左对齐，点分隔符 margin 0 6px

### 茶叶系列 (ProductShowcase)
- 添加 `"use client"` 指令
- 容器内联居中，移除产品卡片负边距（-80→0）
- 网格 `display: grid; gridTemplateColumns: repeat(3, 1fr)`

### 底部栏 (Footer)
- 容器内联居中 `margin: "0 auto"`
- 社交图标圆形 48→32px，SVG 24→16px
- 上下半部分左右间距 400px 居中聚拢
- 电话颜色 `#F59E0B` → `#B8863B`
- 整体 padding 24px/16px/12px

### 其他
- Hero 移除跳动向下箭头及 `@keyframes bounce`
- 字体确认为 Noto Serif SC + Playfair Display（SIL OFL 免费商用）

---

## 2026-05-18 用户系统实现记录

### 认证架构
- **NextAuth.js v5** (beta) + Credentials Provider + JWT session（无状态）
- 密码哈希使用 **bcryptjs**（salt rounds = 10）
- 注册即登录（无需邮箱验证，后续可按需开启）
- 忘记密码：生成 token → 存 DB → 发送邮件 → 重置密码（token 1 小时有效，一次性使用）

### 新增数据库表

| 表名 | 用途 |
|------|------|
| PasswordResetToken | 密码重置令牌（token, userId, expiresAt） |
| ShippingAddress | 收货地址（name/phone/province/city/district/detail/isDefault） |
| RateLimitRecord | 速率限制记录（ip, action, createdAt） |

### 新增 API 路由（10 个）

```
POST /api/auth/register               # 注册（含速率限制 5次/60s）
POST /api/auth/forgot-password        # 忘记密码（含速率限制 3次/60s）
POST /api/auth/reset-password         # 重置密码
GET  /api/account                     # 获取个人信息
PUT  /api/account                     # 更新个人信息
PUT  /api/account/password            # 修改密码（含速率限制 5次/60s）
GET  /api/account/addresses           # 地址列表
POST /api/account/addresses           # 新增地址
PUT  /api/account/addresses/[id]      # 编辑地址
DELETE /api/account/addresses/[id]    # 删除地址
GET  /api/account/orders              # 订单列表（stub，返回空数组）
```

### 新增页面路由

```
/auth/login           → 登录页（Suspense 包裹，支持 callbackUrl）
/auth/register        → 注册页（注册成功自动登录跳转）
/auth/forgot-password → 忘记密码页
/auth/reset-password  → 重置密码页（?token=）
/account              → 个人中心（左侧导航 + 右侧内容，受保护路由）
```

### 新增组件

| 组件 | 用途 |
|------|------|
| SessionProvider.tsx | 包装根布局，提供客户端 session 上下文 |
| AccountSidebar.tsx | 个人中心左侧导航（个人信息/订单/地址/修改密码） |
| AccountContent.tsx | 个人中心内容区容器，管理 tab 切换 |
| ProfileForm.tsx | 个人信息编辑表单 |
| PasswordForm.tsx | 修改密码表单 |
| AddressList.tsx | 地址 CRUD 全功能组件 |
| OrderList.tsx | 订单列表（stub，显示空态） |

### 中间件
- `src/middleware.ts` — 基于 cookie 的路由守卫（不依赖 Prisma，Edge Runtime 兼容）
- `/account/*` 未登录 → 重定向到 `/auth/login?callbackUrl=...`
- `/auth/*` 已登录 → 重定向到 `/account`
- 开发阶段使用 cookie 存在性检测，生产环境 JWT 验证由 API Route 层保证

### 邮件服务
- `src/lib/email.ts` — nodemailer 封装，支持 SMTP 环境变量配置（未配置时降级为 console 输出）
- `src/lib/email-templates.ts` — HTML 密码重置邮件模板（品牌色 #1a3a2a，响应式布局）
- 配置方式：设置 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`SMTP_FROM` 环境变量

### 速率限制
- `src/lib/rate-limit.ts` — Prisma 滑动窗口限流（按 IP + action 维度），自动清理过期记录
- 默认限制：注册 5次/60s，忘记密码 3次/60s，修改密码 5次/60s
- 超限返回 429 `{ error: "RATE_LIMITED" }`

### 校验函数
- `src/lib/validations.ts` — 8 个纯校验函数，统一返回 `{ success, error, message }`
- 覆盖：邮箱、密码（≥6字符）、用户名（2-20字符）、手机号（选填 1[3-9]XXXXXXXXX）、密码一致性

### NextAuth v5 注意事项
- 中间件不能直接使用 `auth()`（会通过 Prisma 引入 Node.js 原生模块，Edge Runtime 不兼容）
- 解决方案：中间件仅检查 cookie 存在性做路由分流，实际权限校验由 API Route 和 Server Component 层的 `auth()` 完成
- Next.js 16 提示 `middleware` 约定已弃用，建议迁移到 `proxy.ts`（当前仍可用）
- `SessionProvider` 需在根 layout 中包裹 children，供客户端组件使用 `useSession()`
- Type augmentation: `src/types/next-auth.d.ts` 扩展 Session.user 添加 id 字段

### Tailwind CSS 4 兼容性
- Auth 页面和 Account 页面使用内联 style 实现精确布局（输入框 320px，按钮 170px/140px）
- 导航栏使用现有 className 模式保持一致性

## 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器 (localhost:105)

# 数据库
npx prisma generate  # 生成 Prisma Client
npx prisma migrate dev --name <name>  # 创建并应用迁移
npx prisma studio    # 打开数据库管理界面
npm run seed         # 运行种子数据脚本

# 构建
npm run build        # 生产构建
npm start            # 启动生产服务器
```

---

## 注意事项

1. **数据库密码** 在 `.env` 文件中，切勿提交到 Git
2. **Supabase 免费层** 有 500MB 存储限制和暂停策略（7天无活动可能暂停）
3. **支付集成** 需要企业营业执照、对公账户等资质，第四阶段之前无需准备
4. **所有 Prisma 操作** 通过 `src/lib/prisma.ts` 的单例客户端，不要直接 new PrismaClient()
5. **种子脚本** 会清空所有数据后重新插入，仅用于开发环境
