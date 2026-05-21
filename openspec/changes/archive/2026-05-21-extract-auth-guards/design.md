## Context

当前项目中所有 API 路由的 auth 检查均为手写内联。管理后台路由（10 个 handler）各自重复相同的 "auth → session check → role check → 401/403" 模式；用户路由（约 20 个 handler）各自重复 "auth → session check → 401" 模式。总计约 120 行完全相同的样板代码。

## Goals / Non-Goals

**Goals:**
- 抽取 `requireAdmin()` 和 `requireUser()` 两个辅助函数，消除重复
- 使用 TypeScript 判别联合返回类型，编译时强制调用方处理 auth 失败
- 替换后路由的 401/403 响应 body 和状态码与替换前完全一致

**Non-Goals:**
- 不改变认证机制本身（仍用 NextAuth.js v5）
- 不在 JWT token 中缓存 role（避免 role 变更后 token 不刷新的问题）
- 不修改 proxy.ts 的路由守卫逻辑
- 不引入 middleware 级别的 auth 校验

## Decisions

### 决策 1: 返回判别联合而非抛异常

选择 `{ userId } | { error: NextResponse }` 联合类型，而非抛出 `AuthError`。

**备选方案：抛异常 + 全局 error boundary。** 拒绝理由：Next.js route handler 无统一 error boundary，需在每个路由 try/catch 中区分 `AuthError` 和其他错误，反而增加代码。

**选择理由：** 调用方使用 `if ("error" in result) return result.error` 模式，TypeScript 自动收窄类型。如果调用方忘记检查就直接使用 `result.userId`，IDE 会标记为类型错误。

### 决策 2: requireAdmin() 每次都查 DB 获取 role

不在 JWT callback 中写入 role 到 token，而是每次在 `requireAdmin()` 中查询。

**备选方案：JWT token 中缓存 role。** 拒绝理由：admin role 变更后，已签发的 JWT 不会自动刷新，存在安全窗口。

**选择理由：** 一次 `findUnique` + `select: { role: true }` 查询开销极小（主键索引命中），换取 role 的实时性。

### 决策 3: 保持现有响应格式不变

401/403 响应的 JSON body 保持与现有代码完全一致：
- 401: `{ success: false, error: "UNAUTHORIZED" }`
- 403: `{ success: false, error: "FORBIDDEN" }`

不添加新的错误码或消息字段。

### 决策 4: 仅覆盖 API 路由，不触及 Server Component 的 auth() 调用

Server Component 中的 `auth()` 调用不通过此 helper——它们通常需要更细粒度的 session 信息（如 `session.user.name`），不只是 `userId`。

## Risks / Trade-offs

- **新路由仍可能忘记调用 helper** → Mitigation: 代码审查时比对其他路由的模式，遗漏会很明显
- **辅助函数隐藏了 DB 查询** → 可接受，一次主键查询在已知开销内
- **server component 和 API route 的 auth 调用不再统一** → 两者本来就有不同需求，强行统一反而增加复杂度
