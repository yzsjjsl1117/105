# 第四阶段：支付基础设施 — 设计文档

**日期：** 2026-05-18
**范围：** 模拟支付、订单生命周期、支付页面、订单详情、订单列表

---

## 1. 支付架构

**路径 C — 模拟支付 + 完整基础设施。** 项目暂未取得企业支付资质（需营业执照、对公账户），先用模拟支付跑通全链路。将来取得资质后，只替换 `POST /api/payment/pay` 内部实现（模拟 → 微信/支付宝 SDK），上层流程不变。

```
用户视角:
  /checkout 提交订单 → /payment/[orderId] 选择支付 → /payment/success 完成
  
系统内部:
  POST /api/orders (创建订单, status=pending_payment)
       │
       ▼
  /payment/[orderId] (支付页, 30分钟倒计时)
       │
       ├── POST /api/payment/pay → status=paid → /payment/success
       │
       └── 超时 → POST /api/orders/[id]/cancel → status=expired
```

## 2. 订单状态机

```
                  POST /api/orders
                       │
                       ▼
               pending_payment
               ╱       │        ╲
              ╱        │         ╲
    POST pay/      30min超时    POST cancel/
         │           │              │
         ▼           ▼              ▼
       paid      expired       cancelled
                   (库存回滚)     (库存回滚)
```

| 状态 | 触发条件 | 含义 |
|------|---------|------|
| `pending_payment` | 下单时设置 | 待付款 |
| `paid` | 模拟支付成功 | 已支付 |
| `expired` | 30 分钟超时自动取消 | 支付超时 |
| `cancelled` | 用户手动取消 | 已取消 |

**关键决策：下单即扣库存。** 茶叶小众精品，库存量小，超卖风险 > 锁库存风险。取消/过期时在事务中 `stock += quantity` 回滚。

## 3. 新增 API 路由

```
POST /api/payment/pay             # 模拟支付 { orderId, method }
POST /api/orders/[id]/cancel      # 取消订单（库存回滚 + PaymentRecord 标记）
```

## 4. 修改的 API 路由

```
POST /api/orders                  # status → pending_payment，事务中创建 PaymentRecord
GET  /api/orders                  # 查询时自动调用 cancelExpiredOrders 兜底
GET  /api/orders/[id]             # 查询时自动调用 cancelExpiredOrders 兜底
```

## 5. 超时处理 — 双保险

```
路径 A (主动):  前端倒计时归零 → 调用 POST /api/orders/[id]/cancel
路径 B (兜底):  服务端查询订单时 → cancelExpiredOrders() 扫描过期订单
```

用户不打开页面也会被 B 路径兜底取消。倒计时 30 分钟。

## 6. PaymentRecord 表

复用已有表，字段完备：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| orderId | UUID → Order | 关联订单 |
| method | String | 支付方式 (wechat/alipay) |
| amount | Decimal | 支付金额 |
| status | String | pending/completed/failed |
| thirdPartyId | String | 第三方支付 ID（模拟时为空） |
| createdAt | DateTime | 创建时间 |

下单时创建一条 `status="pending"` 的记录，支付成功/取消时更新状态。

## 7. 新增页面路由

```
/payment/[orderId]     → 支付页
/payment/success       → 支付成功页
/orders/[id]           → 订单详情页
```

### 支付页 (/payment/[orderId])

- 支付方式选择：微信支付 / 支付宝（按钮选择）
- 30 分钟倒计时，归零自动取消并提示
- 确认支付 → 调用模拟支付 API → 跳转成功页
- 取消订单 → 跳转订单详情页

### 支付成功页 (/payment/success)

- 订单号 + 金额 + 支付方式
- "查看订单" 链接 → /orders/[id]
- "返回首页" 链接 → /

### 订单详情页 (/orders/[id])

- 订单状态标签（颜色区分）
- 商品列表（名称/数量/单价/小计）
- 收货地址（只读）
- 实付金额 + 支付方式
- 订单编号 + 下单时间
- 操作按钮：待付款时显示"去支付"和"取消订单"

## 8. 新增组件

| 组件 | 用途 |
|------|------|
| PaymentContent.tsx | 支付页客户端组件（支付方式选择、倒计时、支付/取消操作） |
| PaymentSuccessContent.tsx | 支付成功内容组件 |
| OrderDetailClient.tsx | 订单详情客户端组件（状态标签、商品列表、操作按钮） |

## 9. 修改组件

| 组件 | 改动 |
|------|------|
| OrderList.tsx | 从空壳改为真实订单列表（筛选 tab：全部/待付款/已支付/已取消，操作按钮：去支付/取消订单/查看详情） |

## 10. 新增工具函数

`src/lib/orders.ts` — `cancelExpiredOrders(userId)`：
- 查询 userId 下 `status="pending_payment"` 且 `createdAt < now() - 30min` 的订单
- 逐个事务执行：库存回滚 → status 改为 expired → PaymentRecord 改为 failed

## 11. 错误码扩展

| 错误码 | HTTP | 场景 |
|------|------|------|
| `ORDER_NOT_PAYABLE` | 400 | 订单状态不是 pending_payment |
| `ORDER_NOT_CANCELLABLE` | 400 | 订单状态不允许取消 |

## 12. 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 支付方式位置 | 支付页 (/payment/[orderId])，非结算页 | 贴近真实电商流程 |
| 支付后跳转 | 支付成功立即标记 paid | 模拟支付无异步回调 |
| 库存策略 | 下单扣，取消退 | 小库存商品防超卖 |
| 超时兜底 | 服务端查询时扫描 | 防前端定时器不可靠 |
| 支付资质 | 模拟 → 将来替换 | 先跑通流程，资质后补 |
