# 构建风险收敛记录

更新日期：2026-04-02

## 目标

本轮收敛的目标不是“只要能打包就算完成”，而是降低生产包在真实部署环境中的不确定性，重点处理：

- 动态导入与同步引用重叠导致的分块风险
- 主入口热路径过重带来的首屏和缓存压力
- PWA 元数据漂移、缺失资源与乱码带来的发布面风险
- 默认 `dist/` 目录在当前工作区的句柄污染问题

## 已完成调整

### 1. 热路径按需装载

- `src/runtime/UniverseScene.tsx` 改为缓存式动态加载重型渲染模块。
- `src/ui/components/SystemStatusPanel.tsx` 通过 `lazy()` 按需加载，避免主路径同步拖入。
- `src/ui/components/WebGPUCanvas.tsx` 与 `src/rendering/WebGPURenderer.ts` 的依赖边界收紧，避免动态导入与静态导入重叠。
- `src/core/SystemIntegrator.ts` 将高阶浏览器能力接入拆成描述符驱动的异步初始化路径。

### 2. 构建输出清理

- `package.json` 的 `build` 先执行 `clean:dist`，统一清理旧的 `dist/`、`dev-dist/` 和 `release-dist/`。
- 正式产物目录切换为 `release-dist/`，绕开当前工作区对默认 `dist/` 目录的句柄污染问题。
- 生产验证统一走 `npm run verify:release`，避免遗漏单独门禁。

### 3. PWA 面统一

- 以 `public/manifest.json` 作为唯一运行时清单来源，移除 `vite-plugin-pwa` 内重复的 manifest 配置。
- 补齐真实存在的图标资源：`public/favicon.svg`、`public/app-icon.svg`、`public/app-icon-maskable.svg`。
- 删除原先不存在的图标、截图和 `favicon.ico` 虚假引用，避免线上 404 与安装元数据异常。

### 4. 根文件元数据修正

- `index.html`、`package.json`、`README.md`、关键文档均已清理乱码并统一产品说明。
- `prepare` 脚本改为显式 Node 脚本，避免 `husky install` 弃用提示和无 `.git` 环境报错。

## 当前效果

- 生产构建链路更稳定，主入口只承载启动壳和必要路径。
- 发布资源不再引用缺失文件，PWA 安装面与仓库首页保持一致。
- `release-dist/` 可稳定生成干净产物，适合静态托管与 fresh clone 验证。

## 后续观察项

- `npm audit` 仍会报告来自 `webtorrent` 和 `vite-plugin-pwa/workbox-build` 依赖链的上游漏洞告警。
- 这两项不阻断当前版本的静态部署，但属于后续依赖治理议题，应在不破坏功能闭环的前提下单独处理。
