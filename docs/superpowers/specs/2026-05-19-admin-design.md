# 第五阶段：后台管理 — 设计文档

**日期：** 2026-05-19
**范围：** 管理员入口、商品 CRUD、订单管理（含状态扩展）、概览 Dashboard、图片上传

---

## 1. 管理员入口与权限

### 方案：同 User 表，role 字段

User 模型已有 `role String @default("customer")`，无需 schema 变更。

| 层面 | 机制 |
|------|------|
| 管理员创建 | seed 脚本创建 admin 用户（email: admin@yueling.com） |
| 路由保护 | 中间件检查登录（/admin/* → 未登录重定向）；页面和 API 层检查 `role === "admin"` |
| 403 处理 | 非 admin 访问 /admin 返回 403 页面 |

设计约束：中间件保持轻量（只检查 cookie 存在性，不查 Prisma）。role 校验在 Server Component / API Route 层通过 `auth()` + Prisma 完成。

### 入口

- 前台不显示后台入口（管理员手动输入 `/admin`）
- 登录后访问 `/admin`，非 admin 用户看到 403

---

## 2. 后台布局

```
┌─────────────────────────────────────────────┐
│  AdminNavbar (顶部栏)                         │
│  瀹岭后台  |  商品管理 / 订单管理 / 概览       │
│                                      [退出]  │
├──────────┬──────────────────────────────────┤
│          │                                   │
│  Sidebar │       Content Area                │
│          │                                   │
│  ● 概览  │   当前模块对应的内容                 │
│    商品   │                                   │
│    订单   │                                   │
│          │                                   │
│          │                                   │
└──────────┴──────────────────────────────────┘
```

- 横向顶部栏：Logo + 模块切换 + 退出
- 内容区：单栏，最大宽度 1100px 居中
- 风格：和前台保持一致的品牌色 #1a3a2a，简洁实用

---

## 3. 概览 Dashboard（方案 A — 轻量卡片）

4 个统计卡片 + 快捷入口，预留图表扩展空间。

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 今日订单  │ │ 待处理   │ │ 商品总数  │ │ 近7日销售 │
│   3 笔   │ │  2 笔    │ │  8 件    │ │ ¥1,280  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

  [新建商品]  [查看所有订单]

  <!-- 图表扩展预留区 -->
```

| 卡片 | 数据来源 | 口径 |
|------|---------|------|
| 今日订单 | Order count | `createdAt >= today` |
| 待处理 | Order count | `status = "pending_payment"` OR `status = "paid"` |
| 商品总数 | Product count | 全部（含下架？暂不做上下架） |
| 近7日销售额 | Order sum(total) | `createdAt >= 7 days ago AND status IN ("paid", "shipped", "completed")` |

---

## 4. 订单状态扩展

### 当前状态机

```
pending_payment → paid / expired / cancelled
```

### 扩展后状态机

```
              ┌───→ expired (超时自动取消, 库存回滚)
              │
pending_payment ──→ paid ──→ shipped ──→ completed
              │                  │
              └───→ cancelled    │ (由管理员手动标记)
               (用户取消, 库存回滚)
```

### 新增状态

| 状态 | 含义 | 触发者 | 触发条件 |
|------|------|--------|---------|
| `shipped` | 已发货 | 管理员 | 后台标记发货 |
| `completed` | 已完成 | 管理员 | 后台手动标记完成 |

### 影响范围

| 位置 | 改动 |
|------|------|
| Order.status 字段 | 无 schema 变更（字符串，不枚举） |
| `POST /api/admin/orders/[id]/status` | 新增 API，接收 `{ status: "shipped" \| "completed" }` |
| 前台订单详情 | 状态标签扩展两种颜色 |
| 后台订单列表 | 筛选 tab 新增"已发货""已完成" |

### 状态流转规则

```
paid       → shipped    ✅
shipped    → completed  ✅
paid       → completed  ✅ (跳过发货直接完成，适应极端情况)

pending_payment → shipped    ❌ (必须先支付)
cancelled / expired → 任何    ❌ (终态不可变)
```

---

## 5. 商品管理

### 功能

| 操作 | 说明 |
|------|------|
| 列表 | 表格展示：缩略图、名称、价格、库存、分类、操作 |
| 新建 | 表单：全部 Product 字段可填 |
| 编辑 | 表单：复用新建表单，预填已有数据 |
| 删除 | 软删除还是不删？—— **直接硬删除**（SKU 少，且关联订单的 OrderItem 保留历史数据） |

### 表单字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | text | 是 | 产品名称 |
| subtitle | text | 否 | 副标题 |
| englishName | text | 否 | 英文名 |
| slug | text | 是 | URL 路径（自动从 name 生成） |
| description | textarea | 是 | 产品描述 |
| price | number | 是 | 单价（元） |
| stock | number | 是 | 库存数量 |
| categoryId | select | 否 | 分类（从 Category 表读取） |
| images | 图片上传 | 否 | 产品图片（多张） |
| featured | checkbox | 否 | 是否精选/首页展示 |
| specs | text | 否 | 规格信息 |
| features | JSON 编辑 | 否 | 产品特点列表 |
| brewing | JSON 编辑 | 否 | 冲泡参数 |
| storage | text | 否 | 储存建议 |

### API 路由

```
GET    /api/admin/products        # 商品列表（分页？初期 SKU < 20，不分页）
POST   /api/admin/products        # 新建商品
GET    /api/admin/products/[id]   # 商品详情
PUT    /api/admin/products/[id]   # 编辑商品
DELETE /api/admin/products/[id]   # 删除商品
```

---

## 6. 图片上传（方案 B — Supabase Storage）

### 架构

```
前端                          服务端                        Supabase
─────                         ─────                        ────
<input type="file">
      │
      ▼
FormData ────→ POST /api/admin/upload ────→ storage.from("products")
      │                                            .upload(...)
      ▼                                            │
  拿到 URL ◀─────────────────────────────────────────
      │
      ▼
存入 Product.images[]
```

### 依赖

新增 `@supabase/supabase-js` 或使用现有 Supabase 客户端（检查项目中是否已安装）。

### 配置

- Supabase Dashboard → Storage → 创建 `products` bucket
- Bucket 权限：公开可读（`SELECT` 开放），上传需认证（service key）

### API

```
POST /api/admin/upload
  Content-Type: multipart/form-data
  Body: file (File)
  Response: { success: true, data: { url: "https://xxx.supabase.co/..." } }
```

### 前端组件

- 图片网格展示已有图片（带删除按钮）
- "添加图片"按钮 → 触发 file input
- 选择后本地预览 + 自动上传
- 上传中显示 loading 状态
- 上传完成自动加入 images 数组
- 最多 6 张图片

---

## 7. 订单管理

### 功能

| 操作 | 说明 |
|------|------|
| 列表 | 表格：订单号、用户、金额、状态、时间 |
| 筛选 | 按状态筛选：全部 / 待付款 / 已支付 / 已发货 / 已完成 / 已取消 / 已过期 |
| 详情 | 查看订单完整信息（商品、地址、支付方式） |
| 标记发货 | paid 订单 → shipped |
| 标记完成 | paid 或 shipped 订单 → completed |

### API 路由

```
GET  /api/admin/orders               # 订单列表（支持 ?status= 筛选）
GET  /api/admin/orders/[id]          # 订单详情（含关联 user/items）
PUT  /api/admin/orders/[id]/status   # 更新状态 { status: "shipped" | "completed" }
```

---

## 8. 页面路由

```
/admin                    → Dashboard 概览
/admin/products           → 商品列表
/admin/products/new       → 新建商品
/admin/products/[id]/edit → 编辑商品
/admin/orders             → 订单列表
/admin/orders/[id]        → 订单详情（管理端）
```

---

## 9. 组件拆解

| 组件 | 类型 | 用途 |
|------|------|------|
| AdminLayout | Server | 后台统一布局（顶部栏 + 内容区） |
| AdminNavbar | Server | 顶部导航（模块切换 + 退出） |
| Dashboard | Server | 概览页（4 统计卡片 + 快捷入口） |
| ProductList | Client | 商品表格（含删除确认） |
| ProductForm | Client | 商品新建/编辑表单（含图片上传） |
| ImageUpload | Client | 图片上传组件（预览 + 上传进度） |
| AdminOrderList | Client | 订单表格（筛选 + 状态操作） |
| AdminOrderDetail | Client | 订单详情（商品/地址/状态操作按钮） |

---

## 10. API 路由汇总

```
# 商品管理
GET    /api/admin/products
POST   /api/admin/products
GET    /api/admin/products/[id]
PUT    /api/admin/products/[id]
DELETE /api/admin/products/[id]

# 图片上传
POST   /api/admin/upload

# 订单管理
GET    /api/admin/orders
GET    /api/admin/orders/[id]
PUT    /api/admin/orders/[id]/status

# 概览
GET    /api/admin/stats
```

共 9 个 API 路由。

---

## 11. 错误码扩展

| 错误码 | HTTP | 场景 |
|------|------|------|
| `FORBIDDEN` | 403 | 非 admin 用户访问后台 |
| `INVALID_STATUS` | 400 | 订单状态不允许该操作（如 paid → paid） |

---

## 12. mixin 给前台的影响

| 改动 | 位置 |
|------|------|
| 订单列表状态筛选 | `OrderList.tsx` 新增"已发货""已完成" tab |
| 订单详情状态标签 | `OrderDetailClient.tsx` 新增 shipped/completed 颜色映射 |
| 订单状态机扩展 | `src/lib/orders.ts` 的 `cancelExpiredOrders` 不受影响（只改 pending_payment） |
