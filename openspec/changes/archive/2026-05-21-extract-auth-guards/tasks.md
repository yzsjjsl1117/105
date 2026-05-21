## 1. 新建 auth-guards 模块

- [x] 1.1 创建 `src/lib/auth-guards.ts`，实现 `requireAdmin()` 和 `requireUser()`，返回判别联合类型 `{ userId: string } | { error: NextResponse }`

## 2. 替换管理后台路由（10 个 handler）

- [x] 2.1 替换 `src/app/api/admin/stats/route.ts` 的 GET handler
- [x] 2.2 替换 `src/app/api/admin/upload/route.ts` 的 POST handler
- [x] 2.3 替换 `src/app/api/admin/products/route.ts` 的 GET 和 POST handler
- [x] 2.4 替换 `src/app/api/admin/products/[id]/route.ts` 的 GET、PUT、DELETE handler
- [x] 2.5 替换 `src/app/api/admin/orders/route.ts` 的 GET handler
- [x] 2.6 替换 `src/app/api/admin/orders/[id]/route.ts` 的 GET handler
- [x] 2.7 替换 `src/app/api/admin/orders/[id]/status/route.ts` 的 PUT handler

## 3. 替换用户路由（~17 个 handler）

- [x] 3.1 替换 `src/app/api/account/route.ts` 的 GET 和 PUT handler
- [x] 3.2 替换 `src/app/api/account/password/route.ts` 的 PUT handler
- [x] 3.3 替换 `src/app/api/account/addresses/route.ts` 的 GET 和 POST handler
- [x] 3.4 替换 `src/app/api/account/addresses/[id]/route.ts` 的 PUT 和 DELETE handler
- [x] 3.5 替换 `src/app/api/account/orders/route.ts` 的 GET handler
- [x] 3.6 替换 `src/app/api/cart/route.ts` 的 DELETE handler（GET 和 POST 有游客分支，保持原样）
- [x] 3.7 替换 `src/app/api/cart/[id]/route.ts` 的 PUT 和 DELETE handler
- [x] 3.8 替换 `src/app/api/cart/merge/route.ts` 的 POST handler
- [x] 3.9 替换 `src/app/api/orders/route.ts` 的 POST 和 GET handler
- [x] 3.10 替换 `src/app/api/orders/[id]/route.ts` 的 GET handler
- [x] 3.11 替换 `src/app/api/orders/[id]/cancel/route.ts` 的 POST handler
- [x] 3.12 替换 `src/app/api/payment/pay/route.ts` 的 POST handler

## 4. 验证

- [x] 4.1 运行 `tsc --noEmit` 确认零类型错误
- [x] 4.2 Grep 确认无残留的 `const session = await auth()` 后紧跟 `if (!session?.user?.id)` 的手写模式
