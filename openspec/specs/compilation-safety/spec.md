## ADDED Requirements

### Requirement: Single CSS file under 100 lines

每个独立的 CSS 文件（`globals.css` 及所有 CSS Module）在拆分后 SHALL 不超过 100 行。

#### Scenario: All CSS files are under threshold

- **WHEN** CSS 拆分完成
- **THEN** 每个 `.module.css` 文件及其余下的 `globals.css` MUST 不超过 100 行

### Requirement: No DWM crash on dev compilation

在 Windows 11 环境下启动 `next dev` 并访问产品详情页时，Turbopack 编译 SHALL NOT 触发 Windows error 1450 或导致 DWM 崩溃。

#### Scenario: Dev server starts and serves product page successfully

- **WHEN** 运行 `npm run dev` 并访问 `/products/huangshan-maofeng`
- **THEN** 页面 MUST 正常渲染，dev server 日志 MUST NOT 包含 `os error 1450` 或 `TurbopackInternalError: Failed to write`

#### Scenario: No system resource exhaustion

- **WHEN** CSS 拆分完成后的项目在 Turbopack dev 模式下编译
- **THEN** Windows 非分页池使用量 MUST 保持在安全范围内，GUI MUST 保持正常
