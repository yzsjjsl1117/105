## MODIFIED Requirements

### Requirement: 结算页提交订单

系统 SHALL 在用户提交订单后创建订单并跳转支付页，而非直接显示成功。

#### Scenario: 提交订单成功跳转支付页
- **WHEN** 用户在结算页选中地址并点击"提交订单"
- **THEN** 系统调用 `POST /api/orders` 创建订单（status=`pending_payment`，同步创建 PaymentRecord）
- **THEN** 系统清空购物车
- **THEN** 系统跳转到 `/payment/[orderId]`

#### Scenario: 未登录用户提交订单
- **WHEN** 未登录用户在结算页提交订单
- **THEN** API 返回 401，提示"请先登录"

#### Scenario: 库存不足时提交订单
- **WHEN** 用户提交订单但某商品库存不足
- **THEN** API 返回 400，错误码 `OUT_OF_STOCK`
- **THEN** 页面显示具体缺货商品信息
