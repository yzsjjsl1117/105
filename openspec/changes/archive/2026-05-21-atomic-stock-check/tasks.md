## 1. 实现原子库存校验

- [x] 1.1 在 `POST /api/orders` 事务内部，将 "SELECT → 应用层检查 → UPDATE" 两步循环替换为单个 `updateMany({ where: { stock: { gte: quantity } } })` 循环，result.count === 0 时补查产品信息区分"不存在"和"库存不足"
- [x] 1.2 移除原有的 `productUpdates` 中间数组，直接在循环中累计 total 并构造 OrderItem 数据

## 2. 验证

- [x] 2.1 运行 `tsc --noEmit` 确认零类型错误
