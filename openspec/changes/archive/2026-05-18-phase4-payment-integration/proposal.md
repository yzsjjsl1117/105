## Why

当前下单成功后仅显示"支付功能即将上线"，用户无法完成支付。Phase 4 构建完整的支付基础设施（模拟支付 + 订单生命周期），使下单→支付→结果的全链路可运行，后续取得企业资质后只需替换支付网关层即可接入真实微信/支付宝。

## What Changes

- **订单状态机扩展**：Order.status 从单一 `pending` 扩展为 `pending_payment` → `paid` / `expired` / `cancelled`，订单与支付状态关联
- **结算页改版**：CheckoutContent 移除"提交订单"后直接显示成功的逻辑，改为创建订单后跳转支付页
- **支付页面** `/payment/[orderId]`：展示订单摘要、支付方式选择（微信/支付宝）、模拟支付按钮、30 分钟倒计时、取消订单入口
- **支付成功页** `/payment/success`：展示订单号和金额，提供"查看订单"和"返回首页"
- **PaymentRecord 写入**：下单事务中同步创建 PaymentRecord（method + amount + status=pending）
- **订单超时取消**：支付页 30 分钟倒计时超时自动取消；用户可手动取消；取消时回滚库存
- **订单列表升级**：OrderList 从空壳改为展示真实订单，支持"去支付""取消""查看详情"操作
- **订单详情页** `/orders/[id]`：展示订单完整信息（状态、商品、金额、支付方式、地址）

## Capabilities

### New Capabilities

- `payment-flow`: 支付流程 — 下单后跳转支付页、选择支付方式、模拟支付、支付结果展示
- `order-lifecycle`: 订单生命周期 — 状态机管理（pending_payment/paid/expired/cancelled）、超时自动取消、手动取消、库存回滚
- `order-list`: 订单列表 — 真实数据展示、订单操作（去支付/取消/查看详情）

### Modified Capabilities

- `checkout`: 结算页增加支付方式选择，订单创建后跳转支付页而非直接显示成功

## Impact

- **API**：新增 `POST /api/payment/pay`、`POST /api/orders/[id]/cancel`；修改 `POST /api/orders`（写入 PaymentRecord、status 变更）
- **页面**：新增 `/payment/[orderId]`、`/payment/success`、`/orders/[id]`；修改 `/checkout`、`/account`（订单列表）
- **组件**：新增 PaymentContent.tsx；修改 CheckoutContent.tsx、OrderList.tsx
- **数据库**：无 schema 变更（PaymentRecord 表已存在）；Order.status 使用新枚举值
