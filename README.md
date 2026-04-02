# 世界文明模拟器 | OMNIS APIEN

世界文明模拟器（OMNIS APIEN）是一个无后端优先的浏览器文明模拟项目。它把 WebGPU、WebRTC、WebAuthn、Service Worker、WASM 和本地存储组织成一条可运行、可验证、可部署的主链路：支持的环境走真实浏览器能力，不支持的环境自动降级，并明确展示当前来源、限制和恢复路径。

## 项目定位

- 无后端优先：主链路尽量只依赖浏览器能力、本地存储与公开 API，不依赖自建后端。
- 真实能力优先：WebGPU、WebRTC、WebAuthn、Background Sync、WASM 等能力优先走真实浏览器路径。
- 自动降级：浏览器或设备不支持时，系统会进入可解释、不中断的 fallback，而不是静默失败。
- 工程可验证：类型检查、测试、构建与发布校验形成统一门禁，保证项目不是“只能在作者机器上运行”的演示。
- 可直接部署：仓库已包含 Vercel、Netlify 与静态托管所需配置。

## 核心能力

- 启动壳与能力图谱：在首屏阶段完成能力探测、预热、初始化门禁和推荐模式判断。
- 世界内核与运行时观测：用统一状态模型描述能力支持度、降级原因、同步来源和子系统健康度。
- 浏览器原生集成：覆盖 WebGPU、WebRTC、WebAuthn、Web Speech、Gamepad、Service Worker、WebTorrent 等浏览器能力。
- 本地计算与存储：结合 TypeScript、React、WASM、OPFS/IndexedDB、SQLite Wasm 构成本地运行闭环。
- 离线与发布：支持 PWA 形态、静态托管、离线资源缓存和生产构建校验。

## 架构概览

- Boot Shell：负责首屏、字体与主题资源、能力探测、加载反馈和启动门禁。
- Runtime Kernel：负责仿真 tick、初始化顺序、事件流、性能模式和统一运行时状态。
- Browser Integrations：负责 WebGPU、WebRTC、WebAuthn、Background Sync、语音、多模态等高级能力接入。
- UI Telemetry：负责 HUD、系统状态面板、运行时追踪、降级说明和帮助信息。

## 浏览器优先策略

| 能力                | 主路径                   | 回退路径                     |
| ------------------- | ------------------------ | ---------------------------- |
| WebGPU              | 原生 GPU 渲染与计算      | Canvas/WebGL 兼容渲染        |
| WebRTC / 二维码连接 | 真实点对点连接与状态流转 | 可见的手动回退与本地演示路径 |
| WebAuthn            | 设备级身份认证与信任锚点 | 本地信任策略与非阻断入口     |
| Background Sync     | Service Worker 周期同步  | 前台同步或手动触发           |
| 在线数据            | 真实公开 API 数据源      | 本地缓存或模拟来源并标注来源 |

## 快速开始

```bash
npm install
npm run dev
```

## 工程门禁

```bash
npm run verify:release
```

`verify:release` 会依次执行：

- `npm run typecheck -- --pretty false`
- `npm run test -- --run`
- `npm run build`

## 部署

项目已准备好直接部署到静态托管平台。

```bash
# Vercel
npm run deploy:vercel

# Netlify
npm run deploy:netlify
```

补充说明：

- 生产环境需要正确下发 `COOP/COEP` 相关响应头，以支持 `SharedArrayBuffer` 等能力。
- 仓库已包含 [`vercel.json`](./vercel.json)、[`netlify.toml`](./netlify.toml)、[`public/_headers`](./public/_headers) 和 [`public/_redirects`](./public/_redirects)。

## 目录结构

```text
src/
  core/         核心系统编排与初始化
  runtime/      运行时状态、能力图谱、主场景
  ui/           交互界面、HUD、系统面板、样式
  network/      WebRTC、P2P、WebTorrent、Nearby
  rendering/    WebGPU、Canvas 回退、光照与可视化
  sw/           后台同步与 Service Worker 相关逻辑
  auth/         WebAuthn、生物认证、信任锚点
  api/          外部公开数据接入与同步
public/         PWA 清单、图标、静态资源、部署头
tests/          单元测试、集成测试、验收链路
docs/           需求矩阵、构建风险、审查与修复记录
需求/            原始需求文档
wasm/           Rust/WASM 源码与构建入口
```

## 文档

- [`docs/REQUIREMENTS_MATRIX.md`](./docs/REQUIREMENTS_MATRIX.md)：需求文档与当前实现对照矩阵
- [`docs/BUILD_RISK_REDUCTION.md`](./docs/BUILD_RISK_REDUCTION.md)：构建风险收敛记录
- [`docs/REVIEW_REPORT.md`](./docs/REVIEW_REPORT.md)：当前版本审查结论
- [`docs/V14_FIX_REPORT.md`](./docs/V14_FIX_REPORT.md)：本轮收尾与发布报告

## 许可证

- [`LICENSE`](./LICENSE)：MIT License
- [`LICENSE-ENHANCED-CN.md`](./LICENSE-ENHANCED-CN.md)：中文补充说明
