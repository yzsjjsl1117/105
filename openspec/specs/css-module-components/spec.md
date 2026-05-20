## ADDED Requirements

### Requirement: Component styles isolated in CSS Modules

每个页面级组件的专属样式 SHALL 位于独立的 `.module.css` 文件中，通过 CSS Module import 引入对应组件。全局样式 SHALL 仅保留跨组件共享的规则。

#### Scenario: Hero component uses CSS Module

- **WHEN** `Hero.tsx` 渲染
- **THEN** Hero 相关样式（`.hero`, `.hero::before`, `.hero-content`, `.hero-subtitle`, `.hero-title`, `.hero-desc`, `.hero-link`, `.btn-primary`）MUST 定义在 `Hero.module.css` 中并通过 `import styles from "./Hero.module.css"` 引用

#### Scenario: BrandStory component uses CSS Module

- **WHEN** `BrandStory.tsx` 渲染
- **THEN** BrandStory 相关样式（`.story-slide`, `.story-nav-btn`, `.story-indicator`）MUST 定义在 `BrandStory.module.css` 中并通过 CSS Module import 引用

#### Scenario: CraftProcess component uses CSS Module

- **WHEN** `CraftProcess.tsx` 渲染
- **THEN** CraftProcess 相关样式（`.craft-step`, `.process-image`, `.craft-step-title`）MUST 定义在 `CraftProcess.module.css` 中并通过 CSS Module import 引用

#### Scenario: Product detail page uses CSS Module

- **WHEN** 产品详情页渲染
- **THEN** 产品详情页专属样式（`.product-area::before`, `.poster-area::before`, `.poster-wrap::before`, `.poster-wrap::after`, `.other-product-card:hover`）MUST 定义在 `ProductDetail.module.css` 中并通过 CSS Module import 引用

### Requirement: Shared utilities remain global

跨组件共享的 CSS 工具类和动画定义 SHALL 保留在 `globals.css` 中。

#### Scenario: Font utilities remain global

- **WHEN** 任何组件使用 `.font-serif-cn` 或 `.font-serif-en`
- **THEN** 该类名 MUST 定义在 `globals.css` 中且可直接通过字符串引用

#### Scenario: Animation keyframes remain global

- **WHEN** 组件引用 `fadeInUp`、`storyTransition`、`storyBgIn`、`storyFadeUp`、`waterShimmer` 等 `@keyframes`
- **THEN** 这些 keyframe 定义 MUST 保留在 `globals.css` 中

### Requirement: Global CSS keeps only shared rules

`globals.css` SHALL 仅包含以下类别：Tailwind import、CSS 变量、全局重置、字体工具类、跨组件共享的动画 keyframes、跨组件共享的工具类（如 `.glass-card`、`.fade-in-up`、`.delay-*`）。

#### Scenario: globals.css after migration

- **WHEN** 所有组件样式完成迁移
- **THEN** `globals.css` MUST NOT 包含任何单一组件专属的选择器规则（Hero/BrandStory/CraftProcess/产品详情页专属样式）
