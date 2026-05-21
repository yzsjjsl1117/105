## Why

`POST /api/orders` 事务中，库存校验分两步执行：先 SELECT 在应用层检查 `stock >= quantity`，再 UPDATE `stock = stock - quantity`。在 READ COMMITTED 隔离级别下，两个并发事务可能同时通过应用层检查，导致超卖。改用 `updateMany` 带 `WHERE stock >= quantity` 条件，将检查与扣减合并为一条原子 SQL 语句。

## What Changes

- `POST /api/orders` 事务内部：用 `prisma.product.updateMany({ where: { id, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })` 替代原有的 "SELECT → 应用层检查 → UPDATE" 两步模式
- 合并 Step 1（校验库存）和 Step 2（扣减库存）为一个循环，减少代码行数
- 错误信息保持现有格式不变（`OUT_OF_STOCK:产品「xxx」库存不足，仅剩 x 件`）

## Capabilities

### New Capabilities

<!-- 无新能力引入，此为实现细节优化 -->

### Modified Capabilities

<!-- 无 spec 级别的 requirements 变化，行为不变 -->

## Impact

- 修改 `src/app/api/orders/route.ts` 的 POST handler（约 30 行变化）
- API 响应格式不变、状态码不变、错误码不变
