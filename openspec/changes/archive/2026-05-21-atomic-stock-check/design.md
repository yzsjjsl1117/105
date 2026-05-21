## Context

`POST /api/orders` 事务内部分两步处理库存：
1. SELECT 产品 → 应用层检查 `stock >= quantity`
2. `prisma.product.update({ data: { stock: { decrement } } })`

在 READ COMMITTED 隔离级别下，步骤 1 和 2 之间存在 TOCTOU 窗口。`$transaction` 保证原子性但不阻止并发读。

## Goals / Non-Goals

**Goals:**
- 用 `updateMany({ where: { stock: { gte } } })` 合并库存检查和扣减为单条原子 SQL
- 合并原有的两个 for-of 循环为一个
- 错误响应格式保持不变

**Non-Goals:**
- 不改变事务隔离级别
- 不修改其他路由的库存操作（如取消订单的库存回滚）
- 不引入悲观锁（`SELECT ... FOR UPDATE`）

## Decisions

### 决策 1: 使用 `updateMany` 条件更新，而非 `SELECT ... FOR UPDATE`

```typescript
const result = await tx.product.updateMany({
  where: { id: item.productId, stock: { gte: item.quantity } },
  data: { stock: { decrement: item.quantity } },
});
// result.count === 0 → 库存不足或产品不存在
// result.count === 1 → 成功扣减
```

`updateMany` 生成的 SQL：
```sql
UPDATE "Product" SET "stock" = "stock" - $qty
WHERE "id" = $id AND "stock" >= $qty
```

PostgreSQL 在 UPDATE 的 WHERE 子句中读取的是行的当前版本，因此检查和更新是原子的。

**备选方案：`SELECT ... FOR UPDATE`（悲观锁）。** 拒绝理由：需要 raw query，且锁持有时间等于事务时长，不必要的并发限制。

**选择理由：** `updateMany` 是纯 Prisma API，无 raw SQL；原子性由 PostgreSQL 的 MVCC + UPDATE 语义保证；不需要持锁。

### 决策 2: 价格查询放在条件更新之后

顺序为：`updateMany（原子扣减）→ findUnique（查价格）`。如果 `updateMany.count === 0`，抛异常触发事务回滚。

价格在产品表中极少变更，放在事务内查询即可，不需要提前取出。

### 决策 3: 错误信息保持兼容

当 `result.count === 0` 时，补查一次 `findUnique` 区分"产品不存在"和"库存不足"，错误信息格式与现有完全一致。

## Risks / Trade-offs

- **性能：查询次数不变（2N）** → 可接受，N 通常 ≤ 5
- **事务失败时需要查产品名来报错** → 只在失败分支执行，正常路径无额外开销
