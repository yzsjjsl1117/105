## 1. 创建 CSS Module 文件

- [x] 1.1 创建 `Hero.module.css` — 从 `globals.css` 提取 `.hero`、`.hero::before`、`.hero-content`、`.hero-subtitle`、`.hero-title`、`.hero-desc`、`.hero-link`、`.btn-primary` 等规则
- [x] 1.2 创建 `BrandStory.module.css` — 提取 `.story-slide`、`.story-nav-btn`、`.story-indicator` 相关规则
- [x] 1.3 创建 `CraftProcess.module.css` — 提取 `.craft-step`、`.process-image`、`.craft-step-title` 等规则
- [x] 1.4 创建 `ProductDetail.module.css` — 提取 `.product-area::before`、`.poster-area::before`、`.poster-wrap::before`、`.poster-wrap::after`、`.other-product-card:hover` 规则

## 2. 组件引用迁移

- [x] 2.1 更新 `Hero.tsx` — 导入 `Hero.module.css`，修改对应的 `className` 引用
- [x] 2.2 更新 `BrandStory.tsx` — 导入 `BrandStory.module.css`，修改对应的 `className` 引用
- [x] 2.3 更新 `CraftProcess.tsx` — 导入 `CraftProcess.module.css`，修改对应的 `className` 引用
- [x] 2.4 更新 `src/app/products/[slug]/page.tsx` — 导入 `ProductDetail.module.css`，修改对应的 `className` 引用

## 3. 清理 globals.css

- [x] 3.1 从 `globals.css` 中移除已迁移的规则
- [x] 3.2 确认 `globals.css` 仅保留：Tailwind import、CSS 变量、全局重置、字体工具类、共享动画 keyframes、共享工具类

## 4. 验证

- [x] 4.1 运行 `npm run dev`（端口 3105），访问 `/products/huangshan-maofeng`，确认页面正常渲染且无 `os error 1450`
- [x] 4.2 访问首页，确认 Hero/BrandStory/CraftProcess 组件视觉无回归
- [x] 4.3 Grep 确认无残留的全局类名引用（`.hero`、`.hero-title`、`.hero-subtitle` 等不再在 `globals.css` 中的类名）
