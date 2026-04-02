# 构建风险收敛记录

更新日期：2026-04-03

## 目标

本轮收敛的目标不是“只要能打包就算完成”，而是降低生产包在真实部署环境中的不确定性，重点处理：

- 动态导入与同步引用重叠导致的分块风险
- 主入口热路径过重带来的首屏和缓存压力
- PWA 元数据漂移、缺失资源与缓存清单失真带来的发布面风险
- `release-dist/` 作为 canonical production output 的一致性
- fresh-clone 安装链路与发布门禁的一致性

## 已完成调整

### 1. 热路径和分块边界

- `src/runtime/UniverseScene.tsx` 改为缓存式动态加载重型渲染模块。
- `src/ui/components/SystemStatusPanel.tsx` 通过 `lazy()` 按需加载，避免主路径同步拖入。
- `src/main.tsx` 直接引用 `src/sw/ServiceWorkerManager.ts`，不再经由 `src/sw/index.ts` 静态拖入 `BackgroundSync`，构建警告已清除。
- `src/core/SystemIntegrator.ts` 将高阶浏览器能力接入拆成描述符驱动的异步初始化路径。

### 2. 构建输出清理

- `scripts/run-release-build.mjs` 会先统一清理旧的 `dist/`、`dev-dist/` 和 `release-dist/`。
- 正式产物目录切换为 `release-dist/`，并把它收口为当前仓库的 canonical production output。
- 生产验证统一走 `npm run verify:release`，避免遗漏单独门禁。

### 3. 安装链路收口

- `prepare` 的 husky 初始化路径已从 fresh-clone 安装链路移除。
- fresh clone 下 `npm install` 不会再因为 husky 初始化噪音中断，也不会要求仓库必须预先存在 `.husky` 目录。
- 事件总线依赖 `eventemitter3` 已恢复为显式直接依赖，相关类型链路在 fresh clone 中可正常解析。

### 4. PWA 面统一

- 以 `public/manifest.json` 作为唯一运行时清单来源，避免多处 manifest 漂移。
- 补齐真实存在的图标资源：`public/favicon.svg`、`public/app-icon.svg`、`public/app-icon-maskable.svg`、`public/app-icon-192.png`、`public/app-icon-512.png`、`public/apple-touch-icon.png`。
- 删除原先不存在的图标、截图和 `favicon.ico` 虚假引用，避免线上 404 与安装元数据异常。
- Service Worker 改为在最终产物全部就位后由 `scripts/build-release.mjs` 使用 `workbox-build` 生成，避免 precache 只扫到局部文件的顺序问题。
- 生产环境中的 Service Worker 注册由运行时代码显式完成，不再依赖构建时自动注入。

### 5. 静态部署头部统一

- `public/_headers`、`vercel.json` 和 `netlify.toml` 现已同步提供 `COOP/COEP` 与缓存策略基线。
- 仓库文档不再只“提醒需要这些头”，而是让默认部署配置和说明保持一致。

### 6. 根文件元数据修正

- `index.html`、README、关键文档均已清理乱码并统一产品说明。
- 文档叙事现在明确区分 `native`、`fallback`、`deferred` 与 `simulated`，避免把模拟路径写成真实能力。

## 当前效果

- 生产构建链路稳定，主入口只承载启动壳和必要路径。
- PWA 预缓存清单已恢复为完整产物扫描，本轮构建的 `sw.js` 预缓存条目为 `49` 项。
- 发布资源不再引用缺失文件，PWA 安装面与仓库首页保持一致。
- `release-dist/` 可稳定生成干净产物，适合静态托管与 fresh-clone 验证。

## 后续观察项

- `npm audit` 仍会报告来自 `webtorrent` 和 `workbox-build` 依赖链的上游漏洞告警。
- 这些问题不阻断当前版本的静态部署，但属于后续依赖治理议题，应在不破坏功能闭环的前提下单独处理。
- README 与最终审计文档已经把这些项明确写为非阻断债务，避免和主链路缺陷混淆。
