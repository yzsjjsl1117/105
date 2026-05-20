## Context

当前所有自定义 CSS（479 行）集中在 `globals.css` 单文件中，由 `layout.tsx` 一次性导入。Turbopack 编译时通过 PostCSS（`@tailwindcss/postcss`）处理整个文件，生成大量并发 chunk 写入 `.next/dev/build/chunks/`。

在 Windows 环境下，此过程的并发文件 I/O 触发了 **error 1450**（ERROR_NO_SYSTEM_RESOURCES），导致非分页池耗尽，DWM 无法分配 GPU 表面缓冲 → GUI 完全消失，需硬件重启恢复，**已复现 2 次**。

线上生产构建（`next build`）不受影响，因为生产打包不使用 Turbopack 的 dev 模式增量编译。

## Goals / Non-Goals

**Goals:**
- 将 `globals.css` 从 479 行缩减至约 50 行（仅保留全局重置、CSS 变量、字体、共享工具类）
- 每个组件 CSS Module 控制在 100 行以内，确保 Turbopack 单文件编译峰值远低于非分页池上限
- className 引用正确迁移，无视觉回归
- 崩溃不再可复现

**Non-Goals:**
- 不重写任何 CSS 规则或动画逻辑（纯搬运）
- 不合并、简化或优化渐变层（留给后续专项处理）
- 不配置 Turbopack 选项（不在本 change 范围内）
- 不移除 `preview-product.html`（独立讨论）

## Decisions

### 1. CSS Module 而非普通 .css 文件

| 方案 | 类名引用 | 隔离性 | 打包 |
|------|---------|--------|------|
| **CSS Module (`*.module.css`)** | `import styles from "./X.module.css"` → `styles.hero` | 自动 hash 作用域 | 与组件 code-split 绑定 |
| 普通 .css | 保持 `"hero"` 字符串 | 全局，需命名约定 | 打包进全局 chunk |

**选择 CSS Module**。理由：
- 类名自动 hash，拆分后不会冲突
- 与组件 code-split 绑定——Turbopack 只在组件被请求时才编译对应 CSS，从根源上避免了全量并发编译
- Next.js 原生支持，零额外依赖

代价：组件需要 `import styles` 并通过 `styles.xxx` 引用类名。

### 2. 拆分边界按组件划分

```
globals.css (保留 ~50 行)
├── @import "tailwindcss"
├── :root 变量 + @theme inline
├── * 重置 + html + body + body::before + body > *
├── .font-serif-cn / .font-serif-en
├── .glass-card / .fade-in-up / .delay-*           ← 跨组件共享
├── .water-shimmer / @keyframes waterShimmer       ← 被 Hero 和 BrandStory 共用
├── @keyframes fadeInUp
└── @keyframes storyTransition / storyBgIn / storyFadeUp  ← BrandStory 专用，但保留全局可避免复杂化

Hero.module.css (~48 行)
├── .hero + .hero::before
├── .hero-content
├── .hero-subtitle + ::before
├── .hero-title
├── .hero-desc
├── .hero-link + ::after + :hover
└── .btn-primary + :hover

BrandStory.module.css (~25 行)
├── .story-slide + .active + .inactive
├── .story-nav-btn + svg + :hover
└── .story-indicator + .active

CraftProcess.module.css (~72 行)
├── .craft-step + :hover + .active
├── .craft-step-number
├── .craft-step-title
├── .step-separator
├── .step-name
├── .process-image + ::before + ::after + img
└── .craft-step-desc

ProductDetail.module.css (~22 行)
├── .product-area::before
├── .poster-area::before
├── .poster-wrap::before + ::after
└── .other-product-card:hover
```

总计拆分出 **4 个 CSS Module**，`globals.css` 从 479 行降至约 250 行（仍保留共享动画和工具类）。

### 3. 共享动画保留在 globals.css

`@keyframes storyTransition`、`storyBgIn`、`storyFadeUp` 被 BrandStory 组件引用，`waterShimmer` 被 BrandStory 跨 slide 引用。这些 keyframe 定义通过 CSS Module 的 `composes` 或直接留在全局更简单——**保留在 globals.css**。

组件只通过 `className` 引用动画名，动画定义本身在任何 CSS 文件中都不影响引用。但迁移到 CSS Module 后需要用 `animationName` 内联 style 或保留 keyframes 全局。考虑到复杂度，**keyframes 保留全局，只拆分选择器规则**。

### 4. 导航栏样式保留全局

`.navbar-fixed`、`.nav-scrolled`、`.nav-link` 及其伪元素跨 Navbar 和 ShopNavbar 两个组件使用。拆到单个 CSS Module 会导致另一个组件无法访问。保留全局，将来可考虑合并两个 Navbar 或创建共享 module。

## Risks / Trade-offs

- **视觉回归** → 每个 CSS Module 迁移后逐组件检查，参照 `preview-product.html` 作为基准
- **类名遗漏** → Grep 每个已删除的全局类名确保无残留引用
- **CSS 加载顺序** → CSS Module 的注入顺序由组件 import 顺序决定，Next.js 在客户端保证正确级联
- **Turbopack 仍在 dev 模式处理 PostCSS** → 单个 CSS Module 文件最大 72 行，远低于 479 行的触发阈值；生产构建不受影响

## Open Questions

_（无）_
