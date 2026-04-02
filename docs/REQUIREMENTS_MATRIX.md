# 世界文明模拟器需求矩阵
> 更新时间：2026-04-02  
> 基线：对照 `需求/顶级无后端网站需求.txt`、`需求/无后端网站的补充.txt`、`需求/顶级无后端网站需求_v13_高级补充协议.md`  
> 状态定义：`主线已实现` = 默认进入主体验；`自动降级实现` = 优先走真实浏览器能力，不支持时切到明确的 fallback

## 核心结论
- 当前交付已经从“稳定优先版”升级到“工程炫技主线”：启动壳、能力图谱、运行时观测、模式编排、主舞台与按需装载都已进入主链路。
- 高风险浏览器能力不再以隐藏实验项处理，而是纳入统一的 `CapabilityProfile` 和运行时观测体系。
- 真实能力优先、自动降级兜底是当前版本的默认策略，不再依赖静默 mock 作为主路径。

## 覆盖矩阵
| 需求编号 | 能力主题 | 当前状态 | 实现入口 | 验收方式 |
|---|---|---|---|---|
| 4.6 | 极速启动与预热 | 主线已实现 | `src/hooks/useAppInitialization.ts` `src/ui/components/LoadingScreen.tsx` | 首屏启动、预热步骤、能力探测与状态显示正常 |
| 4.7 | 极致性能优化 | 主线已实现 | `vite.config.ts` `src/runtime/UniverseScene.tsx` `src/ui/components/WebGPUCanvas.tsx` | 构建分块收敛、热路径按需装载、主包风险下降 |
| 3.22.2 | 创世纪天气/时间锚定 | 自动降级实现 | 创世纪数据流与初始化链 | 在线走真实数据，离线展示回退来源 |
| 3.22.4 | 区块链同步 | 自动降级实现 | 区块链同步与系统观测面板 | 真链路可接入，失败时切本地回退并解释来源 |
| 4.11 | WebRTC 空间折跃 | 自动降级实现 | P2P/二维码连接链路 | 有 WebRTC 时走真实握手，无能力时保留可见回退路径 |
| 4.12 | Service Worker 幽灵时间 | 自动降级实现 | `src/sw/BackgroundSync.ts` `src/hooks/useAppInitialization.ts` | 支持环境注册周期同步，不支持时回到手动唤醒 |
| 3.28 | WebAuthn / Passkeys | 自动降级实现 | `src/core/SystemIntegrator.ts` `src/auth/WebAuthnManager.ts` | 支持设备可调起硬件认证，否则进入本地信任回退 |
| 3.29.1 | 语音命令 / 语音反馈 | 自动降级实现 | `src/core/SystemIntegrator.ts` `src/input/SpeechRecognition.ts` `src/output/SpeechSynthesis.ts` | 支持设备可直接启用，不支持时保持键鼠主路径 |
| 3.29.2 | 盲眼先知模式 | 自动降级实现 | 无障碍与音频界面链路 | 屏幕阅读器/音频路径保留，视觉层不阻断操作 |
| 3.29.3 | 手柄与触觉反馈 | 自动降级实现 | `src/core/SystemIntegrator.ts` `src/input/GamepadManager.ts` `src/output/HapticsManager.ts` | 支持设备有真实反馈，不支持时不阻断游戏 |
| 3.30 | WebGPU 全局光照 / 高斯记忆场 | 自动降级实现 | `src/rendering/WebGPURenderer.ts` `src/rendering/raytracing/*` `src/rendering/gaussian/*` | WebGPU 可用时走旗舰渲染，不可用时转轻量渲染 |
| 4.10 | WebTorrent 联邦分发 | 自动降级实现 | `src/core/SystemIntegrator.ts` `src/network/TorrentClient.ts` | 支持浏览器走 P2P 分发，不支持时显示受控回退 |
| 共享内存 / SharedWorker / OPFS | 底层零后端生存能力 | 自动降级实现 | 运行时能力图谱与初始化链 | 支持环境走高性能通路，不支持时切轻量存储/单页路径 |
| 主 HUD / 系统观测 | 旗舰可解释 UI | 主线已实现 | `src/ui/components/GameView.tsx` `src/ui/components/SystemStatusPanel.tsx` | 可以直接看到能力状态、子系统健康度和运行轨迹 |
| 模式编排 | APEX / EXTREME / BALANCED / ECO | 主线已实现 | `src/ui/components/ModeSelect.tsx` | 设备推荐策略、手动选择和模式切换都可用 |

## 当前门禁
- `npm run typecheck -- --pretty false` 通过
- `npm run test -- --run` 通过
- `npm run build` 通过

## 说明
- 当前版本已经移除“实验功能默认隐藏”的主路线处理方式；高阶能力统一进入能力图谱和自动降级协议。
- 若浏览器不支持某项能力，界面应明确展示当前来源、回退原因与影响，而不是静默失败。
- GitHub 发布前仍需完成一次 fresh clone 验证，确保新环境可直接 `npm install` 与 `npm run verify:release`。
