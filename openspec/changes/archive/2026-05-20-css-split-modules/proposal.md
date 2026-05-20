## Why

`globals.css` 的 479 行 CSS 在 Turbopack 编译时一次性处理，PostCSS 插件生成大量并发 chunk 写入，耗尽 Windows 非分页池（error 1450），导致 DWM 崩溃、GUI 消失。将组件专属样式拆分为 CSS Module，每个文件独立编译，峰值资源消耗降至安全范围。

## What Changes

- `globals.css` 仅保留全局重置、CSS 变量、字体定义（约 50 行）
- 组件专属样式迁移到对应的 `.module.css` 文件：
  - `Hero.module.css` — hero 区域样式（约 48 行）
  - `BrandStory.module.css` — 品牌故事轮播样式（约 67 行）
  - `CraftProcess.module.css` — 制茶工艺样式（约 18 行）
  - `ProductShowcase.module.css` — 产品陈列样式（约 20 行）
  - `Navbar.module.css` — 导航栏样式（约 25 行）
  - `Footer.module.css` — 页脚样式（约 15 行）
- 产品详情页专属样式（海报金线、纹理背景等约 52 行）拆为 CSS Module 并在 layout 层引入，或保留全局但在文件名上拆分
- 对应组件引用方式改为 CSS Module import
- `preview-product.html` 同步更新或删除

## Capabilities

### New Capabilities

- `css-module-components`: 组件级样式隔离，每个组件对应独立 `.module.css` 文件
- `compilation-safety`: Turbopack 编译峰值控制，单文件 CSS 不超过 100 行，避免 Windows 非分页池耗尽

### Modified Capabilities

_（无现有 capability 受影响，此为纯架构改进）_

## Impact

- 6-7 个 CSS Module 文件新增
- `globals.css` 大幅缩减
- `Hero.tsx`, `BrandStory.tsx`, `CraftProcess.tsx`, `ProductShowcase.tsx`, `Navbar.tsx`, `Footer.tsx` — className 引用方式更改
- `preview-product.html` — 同步更新
