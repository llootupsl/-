# Final Release Audit

审计日期：2026-04-03

## 结论

本仓库当前的发布状态是：

- `npm install` 在 fresh clone 中可通过
- `npm run lint` 可通过
- `npm run typecheck -- --pretty false` 可通过
- `npm run test -- --run` 可通过
- `npm run test:e2e` 可通过
- `npm run build` 可通过，canonical output 为 `release-dist/`
- `npm run verify:release` 可通过
- README、需求矩阵、审查报告和发布收尾报告已统一到同一套公开词汇与交付口径

## 已收口项

- husky 初始化链路已从安装流程中移除，不再作为 fresh-clone 阻断点
- `eventemitter3` 已恢复为显式直接依赖，事件驱动子系统的类型链路可正常解析
- `release-dist/` 已成为 canonical production output
- Service Worker 现由 `workbox-build` 在最终产物落盘后生成，预缓存清单为完整产物集
- 生产运行时已改为显式注册 `/sw.js`，不再依赖构建期自动注入
- `BackgroundSync` 的动态导入与静态导入重叠构建警告已消除
- `README.md` 已改写为完整双语 GitHub 首页，不再使用夸张口号
- 公开状态词汇已统一为 `native`、`fallback`、`deferred`、`simulated`

## 非阻断残留

以下项仍然存在，但不阻断当前发布：

- `npm audit` 仍报告 `9` 个高危告警，均来自第三方依赖链而非当前项目业务代码
- 当前可见链路为：
  - `webtorrent` -> `torrent-discovery` -> `bittorrent-tracker` / `ip`
  - `webtorrent` -> `load-ip-set` -> `ip-set` -> `ip`
  - `workbox-build` -> `@rollup/plugin-terser` -> `serialize-javascript`
- 这些告警没有可接受的非破坏性自动修复路径，继续处理将涉及替换、降级或重新设计相关能力依赖
- 部署平台若要启用更高权限的浏览器能力，仍应确认平台最终保留了仓库提供的 `COOP/COEP` 等生产头部配置

## 本轮验证记录

- `npm run lint`
- `npm run typecheck -- --pretty false`
- `npm run test -- --run`
- `npm run test:e2e`
- `npm run build`
- `npm run verify:release`

本轮构建后的 `sw.js` 预缓存条目为 `49` 项，说明 PWA 预缓存已覆盖最终生产产物，而不是只覆盖局部静态资源。

## 交付说明

这个版本的目标不是“零风险幻觉”，而是“主链路真实、降级真实、发布真实”。因此文档会明确区分：

- `native`：真实浏览器能力主路径
- `fallback`：可见、不中断、可解释的回退路径
- `deferred`：延迟初始化或按需装载
- `simulated`：明确标注的本地模拟，不伪装成外部真实能力
