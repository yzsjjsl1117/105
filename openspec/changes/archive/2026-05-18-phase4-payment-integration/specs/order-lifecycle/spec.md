## ADDED Requirements

### Requirement: 订单状态机

系统 SHALL 管理订单的完整生命周期状态。

#### Scenario: 下单时设置状态
- **WHEN** 用户提交订单
- **THEN** Order.status 设置为 `pending_payment`

#### Scenario: 支付成功状态转换
- **WHEN** 模拟支付 API 成功处理支付
- **THEN** Order.status 从 `pending_payment` 转换为 `paid`

#### Scenario: 用户手动取消
- **WHEN** 用户调用取消订单 API
- **THEN** Order.status 从 `pending_payment` 转换为 `cancelled`
- **THEN** 订单商品的库存数量恢复（stock += quantity）

#### Scenario: 超时自动取消
- **WHEN** 订单处于 `pending_payment` 状态超过 30 分钟且被取消操作触发（倒计时归零或查询时检测）
- **THEN** Order.status 转换为 `expired`
- **THEN** 订单商品的库存数量恢复

#### Scenario: 非可取消状态的订单取消失败
- **WHEN** 用户尝试取消一个状态为 `paid`、`expired` 或 `cancelled` 的订单
- **THEN** API 返回 400 错误，错误码 `ORDER_NOT_CANCELLABLE`

### Requirement: 取消订单库存回滚

系统 SHALL 在订单取消或过期时恢复已扣减的库存。

#### Scenario: 取消时库存回滚
- **WHEN** 订单从 `pending_payment` 变为 `cancelled` 或 `expired`
- **THEN** 系统对该订单中每个 OrderItem 对应的 Product.stock 增加相应 quantity
- **THEN** 库存回滚在取消操作的同一事务中原子执行

### Requirement: PaymentRecord 创建

系统 SHALL 在下单时同步创建支付记录。

#### Scenario: 下单时创建 PaymentRecord
- **WHEN** 用户提交订单
- **THEN** 系统在订单创建事务中创建 PaymentRecord，字段为：orderId、method（用户选择的支付方式）、amount（订单总金额）、status（`pending`）
- **THEN** 若用户下单时未选择支付方式（通过支付页支付），method 设为空字符串，后续支付时更新

#### Scenario: 支付完成时更新 PaymentRecord
- **WHEN** 模拟支付 API 成功处理支付
- **THEN** PaymentRecord.status 更新为 `completed`
- **THEN** 若 PaymentRecord.method 此前为空，更新为用户选择的支付方式

### Requirement: 过期订单扫描

系统 SHALL 在查询订单时自动检测并取消超时未支付订单。

#### Scenario: 查询时触发过期检测
- **WHEN** 系统查询订单列表或订单详情
- **THEN** 对于状态为 `pending_payment` 且创建时间超过 30 分钟的订单，自动执行取消操作（状态 → `expired`，库存回滚）
