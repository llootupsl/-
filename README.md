# 世界文明模拟器 / OMNIS APIEN

一个坚持无后端原则的浏览器文明模拟器：从市民认知、社会文化、现实锚点到 P2P 联邦、WebGPU 渲染和后台结算，所有主线能力都必须有真实入口、可见状态与可解释的降级路径。

A browser-native civilization simulator that stays serverless by design: cognition, society, reality sync, P2P federation, WebGPU rendering, and background settlement all ship with real entry surfaces, visible status, and explicit fallback routes.

## 项目简介 / Project Overview

### 中文

这个项目不是把一堆前沿名词贴在首页上，而是试图把三份私有需求文档中真正有工程含义的能力，压进一个可部署、可验证、可在浏览器里独立运行的文明系统里。

当前公开版本把市民智能、社会文化、经济治理、现实孪生、身份确权、P2P 联邦、性能压测和 WebGPU 渲染统一到同一套运行时契约里。用户看到的是一个文明世界；前端工程师看到的则是一套能力探测、动态装载、主线入口和降级协议共同驱动的浏览器内核。


### English

This project is not a landing page that name-drops advanced web APIs. It is an attempt to compress the actual engineering intent of three private requirement documents into a deployable, verifiable, browser-only civilization system.

The current public release aligns citizen intelligence, social culture, economy, governance, reality sync, identity proofs, P2P federation, performance benchmarking, and WebGPU rendering behind one runtime contract. Players see a world; frontend engineers see capability probing, dynamic loading, explicit entry surfaces, and honest fallback orchestration.


## 功能宇宙 / Feature Universe

### 中文

公开主线一共保留 17 个功能簇，分布在 5 个能力层中，其中 2 个功能簇走原生主线路径，15 个功能簇以一等降级方式保持可用。首页先讲这些能力能做什么，再讲它们为什么值得看。

下面这张宇宙图不是概念陈列柜，而是应用真正的入口地图。每个功能簇都对应主界面、模式页、HUD、观测台或专题面板中的实际入口。

| 能力层 | 功能簇 | 主线原生 | 主线降级 | 主焦点 |
| --- | --- | --- | --- | --- |
| 文明系统层 | 6 | 1 | 5 | 市民、社会、经济、治理、冲突与熵增纪元共同构成文明主循环。 |
| 感知与输入层 | 2 | 0 | 2 | 视觉、语言、多模态、教程与观察者效应让体验和系统状态实时耦合。 |
| 现实同步层 | 3 | 0 | 3 | 现实数据、身份确权、链上证据、存储回溯与幽灵时间让文明与现实发生锚定。 |
| 空间连接层 | 3 | 0 | 3 | 跨文明网络、设备接力、P2P 联邦与开放生态负责文明之间的扩展与流动。 |
| 渲染与性能层 | 3 | 1 | 2 | WebGPU、预热、基准、录制和性能监控决定这套系统能跑到什么上限。 |

| 功能簇 | 主入口 | 入口动作 | 状态 | 条款映射 |
| --- | --- | --- | --- | --- |
| 市民智能内核 | 主 HUD / 市民内核 | 打开市民内核 | 主线降级 | v12:3.1, v12:3.1.1, v12:3.1.2 (+24) |
| 社会文化与叙事网络 | 功能宇宙图 / 社会文化簇 | 打开社会文化簇 | 主线降级 | v12:3.2, v12:3.2.1, v12:3.2.2 (+5) |
| 经济产业与基础设施 | 主 HUD / 经济与基建 | 打开经济与基建 | 主线原生 | v12:3.3, v12:3.3.1, v12:3.3.2 (+3) |
| 治理机制与民主机器 | DAO 治理中心 / 法律层 | 打开治理中心 | 主线降级 | v12:3.4, v12:3.4.1, v12:3.4.2 (+3) |
| 冲突、流行病与气候生态 | 功能宇宙图 / 风险与生态簇 | 打开风险与生态簇 | 主线降级 | v12:3.5, v12:3.5.1, v12:3.5.2 (+5) |
| 熵增纪元与生存循环 | 主 HUD / 纪元与神谕层 | 打开纪元与神谕层 | 主线降级 | v12:3.23, v12:3.23.1, v12:3.23.2 (+10) |
| 中文赛博可视界面 | 启动壳 / 模式选择 / 主 HUD | 查看界面与观测台 | 主线降级 | v12:3.14, v12:3.14.1, v12:3.14.2 (+4) |
| 多模态指令与盲眼先知玩法 | 运行时对话 / 帮助系统 | 打开多模态指令层 | 主线降级 | v12:3.14.4, v12:3.14.7, v12:3.14.8 (+5) |
| 现实孪生与反事实分支 | 启动壳 / 创世纪现实锚点 | 打开创世纪现实锚点 | 主线降级 | v12:3.9, v12:3.9.1, v12:3.9.2 (+5) |
| 身份、链上证据与合规护栏 | DAO 治理中心 / 身份与证据层 | 打开身份与证据层 | 主线降级 | v12:3.1.6, v12:3.10, v12:3.10.1 (+6) |
| 持久化、时间旅行与幽灵时间 | 持久化层 / 幽灵时间控制台 | 打开持久化与幽灵时间 | 主线降级 | v12:3.15, v12:3.15.1, v12:3.15.2 (+6) |
| 跨文明交互与星际扩张 | 功能宇宙图 / 空间连接层 | 打开跨文明连接层 | 主线降级 | v12:3.7, v12:3.7.1, v12:3.7.2 (+3) |
| 空间折跃与 P2P 联邦分发 | 空间连接层 / P2P 联邦控制台 | 打开 P2P 联邦控制台 | 主线降级 | v12:3.12, v12:3.12.1, v12:3.12.2 (+5) |
| 开放生态与插件锻炉 | 功能宇宙图 / 开放生态锻炉 | 打开开放生态锻炉 | 主线降级 | v12:3.13, v12:3.13.1, v12:3.13.2 |
| 预热、性能编排与体验包络 | 启动壳 / 性能观测台 | 打开性能观测台 | 主线原生 | v12:3.17, supplement:4.6, supplement:4.6.1 (+24) |
| 基准测试与压力演练 | 性能模式 / 基准与压测台 | 打开基准与压测台 | 主线降级 | supplement:3.27, supplement:3.27.1, supplement:3.27.2 (+11) |
| 硬件加速与全局光照内核 | 渲染内核 / WebGPU 观测面 | 打开渲染内核观测面 | 主线降级 | v12:3.11, v12:3.11.1, v12:3.11.2 (+3) |

### English

The public mainline keeps 17 feature clusters across 5 runtime layers. 2 clusters currently run through a native path, while 15 remain available through first-class fallbacks. The homepage starts with what the system can do before it explains why the implementation matters.

This atlas is not concept art. It is the actual entry map of the app, and every cluster points to a real surface in the boot flow, mode selector, HUD, observatory, or a dedicated feature panel.

| Layer | Clusters | Native | Fallback | Primary Focus |
| --- | --- | --- | --- | --- |
| Civilization Systems | 6 | 1 | 5 | Citizens, society, economy, governance, conflict, and entropy loops form the main civilization cycle. |
| Perception and Input | 2 | 0 | 2 | Visuals, language, multimodal input, tutorials, and observer effects bind the experience to live runtime state. |
| Reality Sync | 3 | 0 | 3 | Real-world data, identity proofs, chain evidence, persistence, and ghost-time settlement anchor the simulation to reality. |
| Space and Network | 3 | 0 | 3 | Cross-civilization networking, device handoff, P2P federation, and the open ecosystem expand the world beyond one browser tab. |
| Rendering and Performance | 3 | 1 | 2 | WebGPU, warmup, benchmarking, recording, and runtime telemetry define the system's performance ceiling. |

| Cluster | Primary Entry | Entry Action | Status | Clause Coverage |
| --- | --- | --- | --- | --- |
| Citizen Intelligence Kernel | Main HUD / Citizen Kernel | Open Citizen Kernel | Mainline fallback | v12:3.1, v12:3.1.1, v12:3.1.2 (+24) |
| Society, Culture, and Narrative Mesh | Feature Universe / Society Cluster | Open the Society Cluster | Mainline fallback | v12:3.2, v12:3.2.1, v12:3.2.2 (+5) |
| Economy, Industry, and Infrastructure | Main HUD / Economy and Infrastructure | Open Economy and Infrastructure | Mainline native | v12:3.3, v12:3.3.1, v12:3.3.2 (+3) |
| Governance and Democratic Machinery | DAO Center / Governance Layer | Open Governance Center | Mainline fallback | v12:3.4, v12:3.4.1, v12:3.4.2 (+3) |
| Conflict, Epidemics, and Climate | Feature Universe / Risk and Ecology Cluster | Open the Risk and Ecology Cluster | Mainline fallback | v12:3.5, v12:3.5.1, v12:3.5.2 (+5) |
| Entropy Era and Survival Loop | Main HUD / Epoch and Oracle Layer | Open the Epoch and Oracle Layer | Mainline fallback | v12:3.23, v12:3.23.1, v12:3.23.2 (+10) |
| Chinese Cyberpunk Visual Interface | Boot Shell / Mode Select / Main HUD | Inspect the Interface and Observatory | Mainline fallback | v12:3.14, v12:3.14.1, v12:3.14.2 (+4) |
| Multimodal Command and Blind-Oracle Play | Runtime Chat / Help System | Open the Multimodal Command Layer | Mainline fallback | v12:3.14.4, v12:3.14.7, v12:3.14.8 (+5) |
| Reality Twin and Counterfactual Branches | Boot Shell / Genesis Reality Anchor | Open the Genesis Reality Anchor | Mainline fallback | v12:3.9, v12:3.9.1, v12:3.9.2 (+5) |
| Identity, Chain Evidence, and Compliance | DAO Center / Identity and Evidence Layer | Open the Identity and Evidence Layer | Mainline fallback | v12:3.1.6, v12:3.10, v12:3.10.1 (+6) |
| Persistence, Time Travel, and Ghost Time | Persistence Layer / Ghost Time Console | Open Persistence and Ghost Time | Mainline fallback | v12:3.15, v12:3.15.1, v12:3.15.2 (+6) |
| Cross-Civilization and Interplanetary Expansion | Feature Universe / Space Connection Layer | Open the Cross-Civilization Connection Layer | Mainline fallback | v12:3.7, v12:3.7.1, v12:3.7.2 (+3) |
| Space Warp and Federation Distribution | Space Connection Layer / P2P Federation Console | Open the P2P Federation Console | Mainline fallback | v12:3.12, v12:3.12.1, v12:3.12.2 (+5) |
| Plugin Marketplace and Open Civilization Ecosystem | Feature Universe / Open Ecosystem Forge | Open the Open Ecosystem Forge | Mainline fallback | v12:3.13, v12:3.13.1, v12:3.13.2 |
| Warmup, Performance Orchestration, and UX Envelope | Boot Shell / Performance Observatory | Open the Performance Observatory | Mainline native | v12:3.17, supplement:4.6, supplement:4.6.1 (+24) |
| Benchmarking and Stress Harness | Performance Modes / Benchmark and Stress Console | Open the Benchmark and Stress Console | Mainline fallback | supplement:3.27, supplement:3.27.1, supplement:3.27.2 (+11) |
| Hardware Acceleration and Global Illumination | Render Kernel / WebGPU Observatory | Open the Render Kernel Observatory | Mainline fallback | v12:3.11, v12:3.11.1, v12:3.11.2 (+3) |

## 核心体验主线 / Experience Flow

### 中文

启动链路从浏览器能力探测开始，随后进入模式选择、主 HUD、文明能力宇宙图和专题面板。用户既可以顺着主循环游玩，也可以像检阅一套复杂前端系统那样逐层进入社会、风险、现实锚点、空间连接、生态锻炉和性能观测面。

重要的是，这些入口背后不再依赖“看起来像成功”的占位逻辑。每个功能簇都必须告诉你当前走的是原生路径还是降级路径，依赖了哪些浏览器能力，失败时为什么失败，以及替代路线是什么。


### English

The experience starts with browser capability probing, then moves through mode selection, the main HUD, the capability atlas, and the dedicated feature panels. You can play it as a world simulation or inspect it like a layered frontend system that exposes society, risk, reality sync, space connection, ecosystem, and performance surfaces.

The key change is that these surfaces no longer depend on placeholder success states. Each cluster has to tell you whether the current route is native or fallback, which browser capabilities it depends on, why a failure happened, and what the alternative path is.


## 需求闭环地图 / Requirement Closure Map

### 中文

公开注册表当前以 `docId + clause` 为审计单位覆盖 172/172 条需求条款，覆盖率维持在 100%。这些条款来自主需求文档、性能补充文档和 V13 高级补充协议三份私有原文，但公开仓库本身不携带私有原文目录。

如果你只是克隆公开仓库，首页和运行时注册表已经足够复原功能边界；如果你同时持有作者本地的私有材料，可以运行私有对拍命令，直接校验公开注册表与私有原文的逐文档、逐条款覆盖关系。

| 来源文档 | 条款数 |
| --- | --- |
| 主需求文档 | 123 |
| 性能补充文档 | 35 |
| V13 高级补充协议 | 14 |

```bash
npm run audit:requirements:private
```

### English

The public registry currently tracks coverage by `docId + clause` and covers 172/172 requirement rows, which keeps coverage at 100 percent. Those rows originate from the core requirement document, the performance supplement, and the V13 advanced supplement, while the public repository intentionally excludes the private source folder.

If you only clone the public repository, the homepage and runtime registry still reconstruct the product boundary. If you also have the private author materials locally, you can run the private audit command and verify per-document, per-clause coverage against the originals.

| Source Document | Clause Count |
| --- | --- |
| Core Requirement Document | 123 |
| Performance Supplement | 35 |
| V13 Advanced Supplement | 14 |

```bash
npm run audit:requirements:private
```

## 浏览器能力编排 / Browser Capability Orchestration

### 中文

这个项目的工程炫技不在于把 API 名字堆满页面，而在于把这些浏览器能力真正编排进主线：WebGPU 决定渲染上限，WebAuthn 负责身份确权，Periodic Background Sync 驱动幽灵时间，WebRTC 与 WebTorrent 负责空间连接和联邦分发，多模态链路则接管语音、触觉和近场体验。

当某项能力在当前浏览器上不可用时，应用不会假装成功，而是明确切到降级路径，并把原因展示在能力宇宙图和专题面板里。

| 浏览器能力 | 关联功能簇 |
| --- | --- |
| barcodeDetector | 空间折跃与 P2P 联邦分发 |
| gamepad | 多模态指令与盲眼先知玩法 |
| haptics | 多模态指令与盲眼先知玩法 |
| opfs | 基准测试与压力演练、市民智能内核、冲突、流行病与气候生态、治理机制与民主机器、身份、链上证据与合规护栏、持久化、时间旅行与幽灵时间、开放生态与插件锻炉、社会文化与叙事网络、预热、性能编排与体验包络 |
| periodicSync | 熵增纪元与生存循环、持久化、时间旅行与幽灵时间 |
| serviceWorker | 熵增纪元与生存循环、持久化、时间旅行与幽灵时间、现实孪生与反事实分支 |
| sharedWorker | 基准测试与压力演练、持久化、时间旅行与幽灵时间、预热、性能编排与体验包络 |
| speechRecognition | 多模态指令与盲眼先知玩法 |
| speechSynthesis | 多模态指令与盲眼先知玩法 |
| wasm | 基准测试与压力演练、市民智能内核、经济产业与基础设施、硬件加速与全局光照内核、预热、性能编排与体验包络 |
| webAuthn | 治理机制与民主机器、身份、链上证据与合规护栏 |
| webBluetooth | 多模态指令与盲眼先知玩法 |
| webgl | 中文赛博可视界面、预热、性能编排与体验包络 |
| webgpu | 基准测试与压力演练、中文赛博可视界面、市民智能内核、冲突、流行病与气候生态、经济产业与基础设施、熵增纪元与生存循环、硬件加速与全局光照内核、社会文化与叙事网络、预热、性能编排与体验包络 |
| webrtc | 跨文明交互与星际扩张、空间折跃与 P2P 联邦分发 |
| webTorrent | 空间折跃与 P2P 联邦分发 |

### English

The engineering punchline is not that the project mentions advanced web APIs. It is that those browser capabilities are actually orchestrated into the mainline: WebGPU defines the rendering ceiling, WebAuthn anchors trust, periodic background sync powers ghost time, WebRTC and WebTorrent drive federation, and the multimodal stack handles speech, haptics, and proximity play.

When a capability is unavailable in the current browser, the app does not fake success. It moves into a visible fallback path and explains the reason directly in the atlas and the dedicated panels.

| Capability | Owning Clusters |
| --- | --- |
| barcodeDetector | Space Warp and Federation Distribution |
| gamepad | Multimodal Command and Blind-Oracle Play |
| haptics | Multimodal Command and Blind-Oracle Play |
| opfs | Benchmarking and Stress Harness, Citizen Intelligence Kernel, Conflict, Epidemics, and Climate, Governance and Democratic Machinery, Identity, Chain Evidence, and Compliance, Persistence, Time Travel, and Ghost Time, Plugin Marketplace and Open Civilization Ecosystem, Society, Culture, and Narrative Mesh, Warmup, Performance Orchestration, and UX Envelope |
| periodicSync | Entropy Era and Survival Loop, Persistence, Time Travel, and Ghost Time |
| serviceWorker | Entropy Era and Survival Loop, Persistence, Time Travel, and Ghost Time, Reality Twin and Counterfactual Branches |
| sharedWorker | Benchmarking and Stress Harness, Persistence, Time Travel, and Ghost Time, Warmup, Performance Orchestration, and UX Envelope |
| speechRecognition | Multimodal Command and Blind-Oracle Play |
| speechSynthesis | Multimodal Command and Blind-Oracle Play |
| wasm | Benchmarking and Stress Harness, Citizen Intelligence Kernel, Economy, Industry, and Infrastructure, Hardware Acceleration and Global Illumination, Warmup, Performance Orchestration, and UX Envelope |
| webAuthn | Governance and Democratic Machinery, Identity, Chain Evidence, and Compliance |
| webBluetooth | Multimodal Command and Blind-Oracle Play |
| webgl | Chinese Cyberpunk Visual Interface, Warmup, Performance Orchestration, and UX Envelope |
| webgpu | Benchmarking and Stress Harness, Chinese Cyberpunk Visual Interface, Citizen Intelligence Kernel, Conflict, Epidemics, and Climate, Economy, Industry, and Infrastructure, Entropy Era and Survival Loop, Hardware Acceleration and Global Illumination, Society, Culture, and Narrative Mesh, Warmup, Performance Orchestration, and UX Envelope |
| webrtc | Cross-Civilization and Interplanetary Expansion, Space Warp and Federation Distribution |
| webTorrent | Space Warp and Federation Distribution |

## 为什么值得看 / Why This Implementation Is Worth Reading

### 中文

如果你是普通访客，这个项目值得看是因为它把“浏览器里能不能做出一个文明世界”这件事推到了非常具体、非常可玩的层面。

如果你是前端工程师，它值得看是因为这里的重点不是单个 API 的 Demo，而是如何把需求注册表、能力探测、动态装载、主线入口、显式降级和发布门禁串成一套自洽的系统。


### English

If you are a general visitor, this project is worth reading because it pushes the question of whether a browser can host a living civilization into something concrete and playable.

If you are a frontend engineer, it is worth reading because the core idea is not a single API demo. The interesting part is how the requirement registry, capability probing, dynamic loading, mainline entry surfaces, explicit fallbacks, and release gates are tied into one coherent system.


## 快速开始 / Quick Start

### 中文

公开仓库可以直接在干净环境中安装和验证。下面这组命令会依次完成依赖安装、发布门禁检查、浏览器冒烟测试和本地开发启动。

```bash
npm install
npm run verify:release
npm run test:e2e
npm run dev
```

如果你在作者机器或带有私有需求原文的环境中工作，还可以额外运行 `npm run audit:requirements:private` 来做私有条款对拍。

### English

The public repository is meant to install and verify cleanly from scratch. The following commands install dependencies, run the release gate, execute the browser smoke path, and then start local development.

```bash
npm install
npm run verify:release
npm run test:e2e
npm run dev
```

If you are working on the author machine or another environment that also contains the private requirement originals, you can additionally run `npm run audit:requirements:private` for private clause auditing.

## 部署与发布 / Deployment and Release

### 中文

生产构建输出到 `release-dist/`，适合直接接入 Vercel、Netlify 或任意静态托管平台。部署说明被放在靠后位置，不再压过功能介绍本身。


### English

Production builds are emitted to `release-dist/`, which is ready for Vercel, Netlify, or any other static hosting platform. Deployment details stay later in the document so they do not overshadow the product itself.


## 仓库边界 / Repository Boundary

### 中文

公开仓库只保留运行时代码、验证脚本、部署配置与许可证，不包含私有需求原文，也不再上传内部文档目录或私有需求目录。需求闭环通过公开注册表和可选的本地私有对拍命令来证明。


### English

The public repository keeps runtime code, verification scripts, deployment config, and license material only. It intentionally excludes the private requirement originals as well as internal documentation folders and private requirement folders. Requirement closure is demonstrated through the public registry and the optional local private-audit command.


## 许可 / License

### 中文

代码主体使用 MIT 许可证，同时保留中文补充说明文件来解释仓库边界和公开发布语境。

- [LICENSE](./LICENSE): MIT
- [LICENSE-ENHANCED-CN.md](./LICENSE-ENHANCED-CN.md): 中文补充说明

### English

The codebase is primarily released under MIT, with a Chinese supplemental notice that explains the repository boundary and the public release context.

- [LICENSE](./LICENSE): MIT
- [LICENSE-ENHANCED-CN.md](./LICENSE-ENHANCED-CN.md): Chinese supplemental notice
