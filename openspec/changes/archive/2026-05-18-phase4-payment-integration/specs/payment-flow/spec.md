## ADDED Requirements

### Requirement: 支付方式选择

系统 SHALL 在支付页面提供微信支付和支付宝两种支付方式供用户选择。

#### Scenario: 用户进入支付页看到支付方式选项
- **WHEN** 用户从结算页创建订单后进入支付页 `/payment/[orderId]`
- **THEN** 系统展示订单摘要（订单号、金额）和两个支付方式选项（微信支付、支付宝），默认未选中

#### Scenario: 用户选择支付方式
- **WHEN** 用户点击某个支付方式（微信支付或支付宝）
- **THEN** 该选项高亮选中，另一选项取消选中，"确认支付"按钮变为可用

### Requirement: 模拟支付

系统 SHALL 通过模拟支付 API 完成支付操作，立即标记订单为已支付。

#### Scenario: 模拟支付成功
- **WHEN** 用户在支付页选择了支付方式并点击"确认支付"
- **THEN** 系统调用 `POST /api/payment/pay`，传入 `orderId` 和 `method`
- **THEN** API 验证订单属于当前用户且状态为 `pending_payment`
- **THEN** API 更新 Order.status 为 `paid`，PaymentRecord.status 为 `completed`
- **THEN** 前端跳转到支付成功页 `/payment/success?orderId=xxx`

#### Scenario: 订单已支付时重复支付
- **WHEN** 用户尝试支付一个状态非 `pending_payment` 的订单
- **THEN** API 返回 400 错误，错误码 `ORDER_NOT_PAYABLE`

#### Scenario: 支付他人订单
- **WHEN** 用户尝试支付不属于自己的订单
- **THEN** API 返回 404 错误

### Requirement: 支付成功页

系统 SHALL 在支付成功后展示确认信息。

#### Scenario: 支付成功后展示结果
- **WHEN** 用户完成支付并跳转到 `/payment/success?orderId=xxx`
- **THEN** 系统展示成功图标、订单号、支付金额
- **THEN** 系统提供"查看订单"链接（跳转 `/orders/[id]`）和"返回首页"链接

### Requirement: 支付页倒计时

系统 SHALL 在支付页展示 30 分钟支付倒计时，超时自动取消订单。

#### Scenario: 倒计时展示
- **WHEN** 用户进入支付页
- **THEN** 系统展示剩余支付时间的倒计时（格式：MM:SS），从 30 分钟开始倒数

#### Scenario: 倒计时归零自动取消
- **WHEN** 支付页倒计时归零
- **THEN** 系统自动调用取消订单 API
- **THEN** 页面显示"订单已超时取消"提示
- **THEN** 提供"查看订单"和"返回首页"入口
