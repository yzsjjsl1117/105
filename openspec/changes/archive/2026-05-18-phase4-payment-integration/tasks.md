## 1. 订单 API 改造

- [x] 1.1 修改 `POST /api/orders`：Order.status 改为 `pending_payment`，事务中同步创建 PaymentRecord（method + amount + status=pending）
- [x] 1.2 创建 `POST /api/orders/[id]/cancel/route.ts`：取消订单 API（校验状态为 pending_payment → status 改 cancelled → 库存回滚）

## 2. 支付 API

- [x] 2.1 创建 `POST /api/payment/pay/route.ts`：模拟支付 API（校验用户 + 状态为 pending_payment → Order.status 改 paid → PaymentRecord 更新 status 为 completed 和 method）

## 3. 过期订单自动取消

- [x] 3.1 修改 `GET /api/orders` 和 `GET /api/orders/[id]`：查询时检测 pending_payment 超过 30 分钟的订单，自动触发取消 + 库存回滚

## 4. 支付页面

- [x] 4.1 创建 `src/app/payment/[orderId]/page.tsx`：支付页容器
- [x] 4.2 创建 `src/app/payment/PaymentContent.tsx`：支付页客户端组件（订单摘要/支付方式选择/30 分钟倒计时/确认支付按钮/取消订单按钮/倒计时归零自动取消/过期显示提示）

## 5. 支付成功页

- [x] 5.1 创建 `src/app/payment/success/page.tsx`：支付成功页（成功图标 + 订单号 + 金额 + 查看订单 + 返回首页）

## 6. 结算页改造

- [x] 6.1 修改 `src/app/checkout/CheckoutContent.tsx`：提交订单成功后跳转 `/payment/[orderId]` 而非当前成功页

## 7. 订单详情页

- [x] 7.1 创建 `src/app/orders/[id]/page.tsx`：订单详情页（状态/商品列表/金额/地址/支付方式，pending_payment 时显示去支付按钮和倒计时）

## 8. 订单列表升级

- [x] 8.1 改造 `src/app/account/OrderList.tsx`：从空壳改为调用真实 API 展示订单列表（订单号/时间/金额/状态标签/操作按钮），按状态显示不同操作（去支付/取消/查看详情）

## 9. 集成验证

- [x] 9.1 确保 `npx tsc --noEmit` 通过
- [x] 9.2 确保 `npm run build` 通过
- [x] 9.3 端到端验证：下单 → 支付页选择方式 → 模拟支付 → 支付成功 → 查看订单列表 → 订单详情
- [x] 9.4 端到端验证：下单 → 支付页取消 → 库存回滚确认
- [x] 9.5 端到端验证：下单 → 等待 30 分钟（或手动触发）→ 过期自动取消
