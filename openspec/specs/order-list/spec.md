## ADDED Requirements

### Requirement: 订单列表真实数据展示

系统 SHALL 在个人中心订单列表中展示用户的历史订单。

#### Scenario: 展示订单列表
- **WHEN** 用户在个人中心点击"我的订单"tab
- **THEN** 系统调用 `GET /api/account/orders` 获取订单列表
- **THEN** 每个订单展示：订单号、下单时间、总金额、订单状态（中文标签）、商品缩略图
- **THEN** 订单按创建时间倒序排列

#### Scenario: 空订单列表
- **WHEN** 用户没有历史订单
- **THEN** 系统展示"暂无订单"空态

### Requirement: 订单操作按钮

系统 SHALL 根据订单状态提供相应的操作入口。

#### Scenario: 待支付订单提供操作
- **WHEN** 订单状态为 `pending_payment`
- **THEN** 系统展示"去支付"按钮（跳转 `/payment/[orderId]`）和"取消"按钮

#### Scenario: 已支付订单提供查看
- **WHEN** 订单状态为 `paid`
- **THEN** 系统展示"查看详情"按钮（跳转 `/orders/[id]`）

#### Scenario: 已取消/已过期订单提供查看
- **WHEN** 订单状态为 `cancelled` 或 `expired`
- **THEN** 系统展示"查看详情"按钮

### Requirement: 订单详情页

系统 SHALL 提供订单详情页展示完整订单信息。

#### Scenario: 订单详情展示
- **WHEN** 用户访问 `/orders/[id]`
- **THEN** 系统展示：订单状态（中文标签）、订单号、创建时间、商品列表（名称/数量/单价/小计）、收货地址、支付方式、总金额
- **THEN** 若订单为 `pending_payment`，展示"去支付"按钮和倒计时

#### Scenario: 访问他人订单
- **WHEN** 用户尝试访问不属于自己的订单详情页
- **THEN** 系统返回 404 或展示"订单不存在"
