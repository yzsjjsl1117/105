# 第二阶段：用户系统 — 设计文档

**日期：** 2026-05-18
**范围：** 注册、登录、忘记密码、个人中心

---

## 1. 认证架构

- **框架：** NextAuth.js v5 (beta) Credentials Provider + JWT session
- **密码哈希：** bcryptjs
- **注册：** 邮箱 + 密码 + 用户名，手机号可选绑定，无需邮箱验证，注册即登录
- **登录：** Credentials Provider 验证邮箱+密码，jwt strategy，无状态
- **忘记密码：** 输入邮箱 → 生成 token 存 DB → 发送重置链接 → 设新密码

## 2. 新增数据库表

### PasswordResetToken

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| userId | UUID → User | 关联用户 |
| token | String (unique) | 随机 sha256 token |
| expiresAt | DateTime | 过期时间（1小时） |

### ShippingAddress

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| userId | UUID → User | 关联用户 |
| name | String | 收件人姓名 |
| phone | String | 收件人电话 |
| province | String | 省 |
| city | String | 市 |
| district | String | 区 |
| detail | String | 详细地址 |
| isDefault | Boolean | 是否默认地址 |

## 3. API 路由

```
POST   /api/auth/register          # 注册
POST   /api/auth/forgot-password    # 发送重置邮件
POST   /api/auth/reset-password     # 执行密码重置
GET    /api/account                 # 获取个人信息
PUT    /api/account                 # 更新个人信息
PUT    /api/account/password        # 修改密码
GET    /api/account/addresses       # 地址列表
POST   /api/account/addresses       # 新增地址
PUT    /api/account/addresses/:id   # 编辑地址
DELETE /api/account/addresses/:id   # 删除地址
GET    /api/account/orders          # 订单列表（返回空数组）
```

## 4. 页面路由

```
/auth/login           → 登录页
/auth/register        → 注册页
/auth/forgot-password → 找回密码
/auth/reset-password  → 重置密码（?token=）
/account              → 个人中心（受保护，左侧导航 + 右侧内容）
```

## 5. 中间件

- `/account/*` 未登录 → 重定向 `/auth/login?callbackUrl=...`
- `/auth/*` 已登录 → 重定向 `/account`
- 其他路由无需登录

## 6. 导航栏

- 未登录：显示「登录」「注册」
- 已登录：显示用户名 + 退出按钮

## 7. 表单校验

| 字段 | 规则 |
|------|------|
| 用户名 | 必填，2-20 字符 |
| 邮箱 | 必填，合法格式 |
| 密码 | 必填，≥6 字符 |
| 确认密码 | 必填，与密码一致 |
| 手机号 | 选填，1xx-xxxx-xxxx 格式 |

## 8. 错误码

统一返回 `{ success: false, error: "CODE", message: "人类可读描述" }`

| 错误码 | 场景 |
|------|------|
| `EMAIL_TAKEN` | 注册邮箱已存在 |
| `INVALID_CREDENTIALS` | 登录邮箱或密码错误 |
| `INVALID_TOKEN` | 重置令牌无效/过期 |
| `UNAUTHORIZED` | 未登录 |
| `VALIDATION_ERROR` | 表单校验失败 |
| `WRONG_PASSWORD` | 修改密码时当前密码不对 |

## 9. UI 布局规格

- 认证页面：表单 320px 宽，按钮 170px 宽，垂直居中
- 个人中心：左侧导航 180px + 右侧内容，标签居中，按钮与输入框居中对齐
- 错误提示：输入框下方红色小字
- 成功提示：操作后跳转 + 绿色提示条
