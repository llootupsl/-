# 需求对照矩阵

更新日期：2026-04-03

基线文档：

- `需求/顶级无后端网站需求.txt`
- `需求/无后端网站的补充.txt`
- `需求/顶级无后端网站需求_v13_高级补充协议.md`

## 公共词汇

为了让代码、UI、README 和交付文档说同一种语言，仓库只保留以下四个公开状态词：

- `native`：浏览器原生主路径，真实能力可用。
- `fallback`：显式回退路径，仍可运行，且原因可解释。
- `deferred`：延迟初始化或按需装载，不在首屏热路径内。
- `simulated`：本地模拟路径，明确标注，不伪装成真实外部能力。

## 总体结论

- 当前版本已经从“功能集合”收敛为“浏览器优先的运行时系统”。
- 高阶能力进入统一能力图谱、运行时状态和系统观测面板，不再以隐藏实验项为主。
- 首屏、模式选择、主 HUD、系统状态、同步来源和降级说明已经形成可交付闭环。
- canonical production output 为 `release-dist/`，并且发布前必须做 fresh-clone 复验。

## 对照矩阵

| 来源章节 | 能力主题 | 当前状态 | 主要实现入口 | 运行策略 | 验收方式 |
| --- | --- | --- | --- | --- | --- |
| 4.6 | 极速启动与硬件预热 | `native` / `fallback` | `src/hooks/useAppInitialization.ts` `src/ui/components/LoadingScreen.tsx` | 首屏先做能力探测、预热、初始化门禁，再进入主界面 | 首次加载不黑屏，加载态可解释，主界面可稳定进入 |
| 4.7 | 构建与运行性能收敛 | `deferred` | `vite.config.js` `src/runtime/UniverseScene.tsx` `src/ui/components/WebGPUCanvas.tsx` | 热路径轻量化、重模块按需装载、构建输出清理 | `npm run build` 通过，主入口可正常拆分 |
| 3.27 | 性能基准与监控 | `native` / `deferred` | `src/bench/BenchmarkPanel.tsx` `src/bench/BenchmarkSuite.ts` `src/benchmark/PerformanceBenchmark.ts` | 支持基准面板、预热与性能模式联动 | 面板可启动，构建与测试链路不回归 |
| 3.28 | WebAuthn / Passkeys | `native` / `fallback` | `src/auth/WebAuthnManager.ts` `src/auth/BiometricWallet.ts` `src/auth/SoulAnchor.tsx` | 支持设备走硬件认证，不支持时回退到本地信任路径 | 支持设备可触发认证，不支持设备不阻断进入 |
| 3.29.1 | 语音输入与语音反馈 | `native` / `fallback` | `src/input/SpeechRecognition.ts` `src/output/SpeechSynthesis.ts` `src/multimodal/VoiceController.ts` | 支持环境启用语音链路，不支持环境保留键鼠主路径 | 权限允许与拒绝两条路径都可运行 |
| 3.29.2 | 盲视 / 无障碍模式 | `native` / `fallback` | `src/multimodal/BlindMode.tsx` `src/multimodal/AccessibilityManager.ts` | 语音与无障碍链路保留，视觉层不阻断操作 | 盲视模式可进入，普通模式不受影响 |
| 3.29.3 | 手柄与触觉反馈 | `native` / `fallback` | `src/input/GamepadManager.ts` `src/output/HapticsManager.ts` | 支持设备提供手柄与震动反馈，不支持时安静降级 | 插入与未插入设备两条路径都可运行 |
| 3.30 | WebGPU 全局光照与高阶渲染 | `native` / `fallback` | `src/rendering/WebGPURenderer.ts` `src/rendering/raytracing/*` `src/rendering/gaussian/*` | WebGPU 可用时走原生路径，不可用时回退轻量渲染 | 支持与不支持 WebGPU 的环境都能稳定显示 |
| 4.10 | WebTorrent 联邦分发 | `native` / `fallback` | `src/network/TorrentClient.ts` `src/core/SystemIntegrator.ts` | 支持环境走 P2P 分发，不支持环境显示受控回退状态 | `TorrentClient` 可初始化，失败时不拖垮主界面 |
| 4.11 | WebRTC 二维码空间折跃 | `native` / `fallback` | `src/network/p2p/QRHandshake.ts` `src/network/p2p/SpaceWarpPanel.tsx` `src/network/WebRTCManager.ts` | 真实二维码握手与连接态流转，不支持时展示手动回退 | 连接、断开、失败提示链路可重复 |
| 4.12 | Service Worker 后台结算 | `native` / `fallback` / `deferred` | `src/sw/BackgroundSync.ts` `src/hooks/useAppInitialization.ts` | 支持环境注册后台同步，不支持环境转前台或手动同步 | 注册失败不崩溃，状态面板能解释当前来源 |
| 3.22.2 | 创世纪天气与现实锚点 | `native` / `fallback` / `simulated` | `src/api/GenesisTwin.ts` `src/api/GenesisTwinPanel.tsx` | 在线走公开天气数据，离线走本地回退并标注来源 | 在线与离线都能给出明确状态 |
| 3.22.4 | 区块链同步 | `native` / `fallback` / `simulated` | `src/api/BlockchainSync.ts` | 真实节点可配置接入，失败时进入本地或模拟回退 | 节点失败不阻断主链路，状态一致 |
| 未单列编号 | 能力图谱与运行时观测 | `native` / `fallback` / `deferred` / `simulated` | `src/runtime/capabilities.ts` `src/runtime/runtimeStore.ts` `src/ui/components/SystemStatusPanel.tsx` | 用统一状态模型展示能力支持度、回退原因与健康度 | 系统状态面板可直接读取和显示运行时状态 |
| 未单列编号 | 模式编排与推荐策略 | `native` / `fallback` / `deferred` | `src/ui/components/ModeSelect.tsx` `src/App.tsx` | 根据能力图谱推荐模式，并允许用户手动切换 | 模式切换可重复，推荐模式与设备能力一致 |
| 工程门禁 | 类型、测试、构建、发布校验 | `native` | `package.json` `tests/*` | 统一以 `verify:release` 作为交付门禁 | `typecheck / test / build` 全部通过，fresh-clone 复验通过 |

## 验收要求

- 工程门禁：`npm run typecheck -- --pretty false`、`npm run test -- --run`、`npm run build`
- 启动验收：首屏不黑屏，加载态有解释，模式切换可重复
- 能力验收：支持与不支持、在线与离线、成功与失败、权限允许与拒绝都存在清晰 UI
- 发布验收：fresh clone 后 `npm install` 与 `npm run verify:release` 可通过
- 交付口径：README、UI、运行时状态与文档必须统一使用 `native / fallback / deferred / simulated`
