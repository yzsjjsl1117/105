## Why

10 个管理后台 API handler 各自重复相同的 auth + role 检查（8 行 × 10 = 80 行），约 20 个用户 API handler 各自重复相同的 session 检查（4 行 × 20 = 80 行）。抽取为 `requireAdmin()` / `requireUser()` 两个辅助函数，消除约 120 行重复代码，并降低新增路由时遗漏权限检查的安全风险。

## What Changes

- 新增 `src/lib/auth-guards.ts`，导出 `requireAdmin()` 和 `requireUser()` 两个函数
- 所有 admin API 路由（10 个 handler）替换手写 auth 检查为 `requireAdmin()`
- 所有用户 API 路由（~20 个 handler）替换手写 session 检查为 `requireUser()`
- `requireAdmin()` 返回 `{ userId }` 或 `{ error: NextResponse }`（判别联合，TypeScript 强制调用方处理 auth 失败情况）
- `requireUser()` 返回 `{ userId }` 或 `{ error: NextResponse }`

## Capabilities

### New Capabilities

- `auth-guards`: 抽取 API 路由中重复的身份验证和权限检查逻辑为统一辅助函数，确保所有路由使用相同的 auth 模式并降低遗漏风险

### Modified Capabilities

<!-- 无现有 spec 的 requirements 发生变化 -->

## Impact

- 新建 `src/lib/auth-guards.ts`（约 40 行）
- 修改所有 admin API 路由（10 个 handler，每个 -6 行）、所有用户 API 路由（~20 个 handler，每个 -2 行）
- 路由 handler 的行为不变——auth 失败返回相同的 401/403 响应、相同的 JSON body
