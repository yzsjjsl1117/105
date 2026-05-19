# 第三阶段：购物车 + 下单 — 设计文档

**日期：** 2026-05-18
**范围：** 购物车 CRUD、游客/登录双模式、下单流程、订单管理

---

## 1. 购物车架构

**Hybrid 模式：React Context（即时 UI）+ API（持久化）**

| 层面 | 游客 | 登录用户 |
|------|------|---------|
| 即时 UI | Context 更新 | Context 更新 |
| 持久化 | localStorage | DB（CartItem 表） |
| 初始化 | 读 localStorage | `GET /api/cart` |
| 登录过渡 | — | `POST /api/cart/merge`（同产品取 max quantity） |

## 2. API 路由

### 购物车 API

```
GET    /api/cart              # 获取购物车（登录查 DB，游客从 body 接收 items）
POST   /api/cart              # 加购 { productId, quantity }
PUT    /api/cart/:id          # 修改数量 { quantity }
DELETE /api/cart/:id          # 删除单条
DELETE /api/cart              # 清空购物车
POST   /api/cart/merge        # 登录后合并 { items: [{productId, quantity}] }
```

### 订单 API

```
POST   /api/orders            # 创建订单 { addressId, items: [{productId, quantity}] }
GET    /api/orders             # 我的订单列表（替代当前 stub）
GET    /api/orders/:id         # 订单详情
```

## 3. 页面路由

```
/cart              → 购物车页面（列表 + 数量修改 + 去结算）
/checkout          → 下单确认页（选地址 → 商品清单 → 提交订单）
```

### 产品详情页改动
- 添加 ShopNavbar（含购物车图标 + 登录/注册）
- 添加数量选择器（+/- 按钮）
- 「加入购物车」按钮接入功能
- 「立即购买」按钮跳转 /cart
- UI 布局重构留到第六阶段

## 4. 前端数据流

```
CartContext (React Context)
  ├── 初始化：游客读 localStorage，登录读 GET /api/cart
  ├── 加购：Context 立即更新 → API 持久化（游客额外写 localStorage）
  ├── 数量/删除：Context 立即更新 → API 同步
  ├── Mini-cart：读 Context（挂载初始化一次）
  ├── /cart 页面：读 Context + 挂载时 fetch 刷新
  ├── 登录合并：signIn 成功后调用 merge API → Context 重新加载
  └── 退出登录：清空 Context → 从 localStorage 恢复游客数据
```

## 5. 组件拆解

| 组件 | 来源 | 用途 |
|------|------|------|
| ShopNavbar | 新建 | 电商页导航栏（返回首页 + 购物车图标 + 认证） |
| CartProvider | 新建 | CartContext Provider，包装 shop 页面 |
| MiniCart | 新建 | 导航栏下拉面板（300px，最多 3 项，总计 + 查看全部） |
| CartPage | 新建 | /cart 完整列表（产品图/名称/数量+/-/行小计/删除/结算） |
| CheckoutPage | 新建 | /checkout 确认页（地址选择 + 清单 + 提交） |
| AddToCart | 新建 | 数量选择 + 加购按钮（产品详情页使用） |

## 6. 导航栏

| 页面范围 | 导航栏 | 内容 |
|---------|--------|------|
| 首页 | Navbar | Logo + 锚点导航（首页/品牌故事/制茶工艺/茶叶系列） |
| 产品详情/购物车/下单/个人中心 | ShopNavbar | Logo（点击回首页）+ 购物车图标 + 登录/注册 |

Logo 位置在两个导航栏中保持一致（`padding: 8px 64px 8px 44px`）。

## 7. 库存 & 错误处理

### 库存规则
- 加购物车：不校验库存
- 下单时：逐项检查 `stock >= quantity`，不足拒绝整单
- 下单成功：`stock -= quantity`（Prisma 事务内原子执行）

### 下单事务
```ts
prisma.$transaction([
  // 1. 逐项校验库存
  // 2. 逐项扣减 stock
  // 3. 创建 Order + OrderItem
  // 4. 删除购物车对应项
]);
```

### 错误码

| 错误码 | HTTP | 场景 |
|------|------|------|
| `VALIDATION_ERROR` | 400 | 数量 ≤0、必填字段缺失 |
| `UNAUTHORIZED` | 401 | 未登录操作购物车 |
| `NOT_FOUND` | 404 | 产品/购物车项不存在 |
| `OUT_OF_STOCK` | 400 | 下单时库存不足 |
| `ADDRESS_REQUIRED` | 400 | 下单时未选地址 |
| `RATE_LIMITED` | 429 | 接口调用超频 |

## 8. UI 布局规格

- 产品详情加购区：数量选择器 + 「加入购物车」按钮，品牌色 #1a3a2a
- Mini-cart：300px 宽，最多 3 项，底部总计 + "查看购物车"链接
- /cart：全宽列表，表头（商品/单价/数量/小计），底部结算栏（总数/合计/去结算）
- /checkout：地址选择（复用已有地址列表）+ 商品清单只读 + 合计 + 提交按钮
- 下单成功：订单号 + 提示 + 查看订单/返回首页
