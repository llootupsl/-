# 世界文明模拟器 | OMNIS APIEN

世界文明模拟器是一个以浏览器原生能力为主舞台的文明模拟器。它把能力探测、真实链路、降级策略、显式模拟边界和可验证门禁一起做成产品表面，而不是把这些复杂度藏在代码背后。

OMNIS APIEN is a browser-first civilization simulator that treats capability probing, real integration paths, fallback policy, explicit simulation boundaries, and release gates as part of the product surface rather than private implementation detail.

## 项目简介 / Project Overview

- Public requirement coverage is derived into **172** mapped clauses.
- Those clauses are composed into **17** mainline feature clusters.
- The clusters are grouped into **5** runtime-facing universe layers.
- The public repository keeps its truth source in `src/runtime/requirements/`, not in private planning folders.

## 功能宇宙图 / Feature Universe

This repository is organized around a playable feature universe. The README starts from what the product can actually do, then shows how the browser runtime, fallback logic, and release verification support that experience.

### Civilization Systems

Citizens, society, economy, governance, conflict, and entropy loops form the main civilization cycle.

| Cluster | Public status | Runtime path | Product entry | Clauses |
| --- | --- | --- | --- | --- |
| Citizen Intelligence Kernel | Mainline fallback | Fallback path | Main HUD → Citizen Layer / Fate System / Runtime Chat | 3.1, 3.1.1, 3.1.2, 3.1.3, 3.1.4, 3.1.5, 3.1.6, 3.1.7, 3.1.8, 3.25, 3.25.1, 3.25.2, 3.25.3, 3.25.4, 3.25.5, 3.25.6, 3.25.7, 3.25.8, 3.26, 3.26.1, 3.26.2, 3.26.3, 3.26.4, 3.26.5, 3.26.6, 3.26.7, 3.26.8 |
| Society, Culture, and Narrative Mesh | Mainline simulated | Explicit simulation | Feature Universe → Society Cluster / Runtime Chat | 3.2, 3.2.1, 3.2.2, 3.2.3, 3.8, 3.8.1, 3.8.2, 3.16 |
| Economy, Industry, and Infrastructure | Mainline native | Native path | Main HUD → Civilization Metrics / Supply Chain and Infrastructure Views | 3.3, 3.3.1, 3.3.2, 3.3.3, 3.3.4, 3.6.5 |
| Governance and Democratic Machinery | Mainline fallback | Fallback path | DAO Governance Center / Oracle Layer | 3.4, 3.4.1, 3.4.2, 3.4.3, 3.4.4, 3.4.5 |
| Conflict, Epidemics, and Climate | Mainline simulated | Explicit simulation | Feature Universe → Environment and Conflict Cluster / Observatory | 3.5, 3.5.1, 3.5.2, 3.6, 3.6.1, 3.6.2, 3.6.3, 3.6.4 |
| Entropy Era and Survival Loop | Mainline fallback | Fallback path | Main HUD → Epoch Signals / Oracle Layer | 3.23, 3.23.1, 3.23.2, 3.23.3, 3.23.4, 3.24, 3.24.1, 3.24.2, 3.24.3, 3.24.4, 3.24.5, 3.24.6, 3.24.7 |

### Perception and Input

Visuals, language, multimodal input, tutorials, and observer effects bind the experience to live runtime state.

| Cluster | Public status | Runtime path | Product entry | Clauses |
| --- | --- | --- | --- | --- |
| Chinese Cyberpunk Visual Interface | Mainline fallback | Fallback path | Boot Shell / Mode Select / Main HUD / Observatory | 3.14, 3.14.1, 3.14.2, 3.14.3, 3.14.5, 3.14.6, 4.5 |
| Multimodal Command and Blind-Oracle Play | Mainline fallback | Fallback path | Runtime Chat / Help System / Observatory | 3.14.4, 3.14.7, 3.14.8, 3.19, 3.29, 3.29.1, 3.29.2, 3.29.3 |

### Reality Sync

Real-world data, identity proofs, chain evidence, persistence, and ghost-time settlement anchor the simulation to reality.

| Cluster | Public status | Runtime path | Product entry | Clauses |
| --- | --- | --- | --- | --- |
| Reality Twin and Counterfactual Branches | Mainline fallback | Fallback path | Boot Shell → Genesis / Reality Anchor State | 3.9, 3.9.1, 3.9.2, 3.22, 3.22.1, 3.22.2, 3.22.3, 3.22.5 |
| Identity, Chain Evidence, and Compliance | Mainline fallback | Fallback path | DAO Center / Observatory → Identity and Evidence | 3.1.6, 3.10, 3.10.1, 3.10.2, 3.18, 3.22.4, 3.28, 3.28.1, 5.4 |
| Persistence, Time Travel, and Ghost Time | Mainline fallback | Fallback path | Boot Shell / PWA / Observatory → Persistence and Background Settlement | 3.15, 3.15.1, 3.15.2, 3.15.3, 3.21, 4.1, 4.2, 4.12, 4.12.1 |

### Space and Network

Cross-civilization networking, device handoff, P2P federation, and the open ecosystem expand the world beyond one browser tab.

| Cluster | Public status | Runtime path | Product entry | Clauses |
| --- | --- | --- | --- | --- |
| Cross-Civilization and Interplanetary Expansion | Mainline simulated | Explicit simulation | Feature Universe → Space Layer / Observatory | 3.7, 3.7.1, 3.7.2, 3.7.3, 3.20, 4.3 |
| Space Warp and Federation Distribution | Mainline fallback | Fallback path | Observatory → P2P Federation / Device Relay | 3.12, 3.12.1, 3.12.2, 3.12.3, 4.10, 4.10.1, 4.11, 4.11.1 |
| Plugin Marketplace and Open Civilization Ecosystem | Mainline simulated | Explicit simulation | Feature Universe → Open Ecosystem Cluster | 3.13, 3.13.1, 3.13.2 |

### Rendering and Performance

WebGPU, warmup, benchmarking, recording, and runtime telemetry define the system's performance ceiling.

| Cluster | Public status | Runtime path | Product entry | Clauses |
| --- | --- | --- | --- | --- |
| Warmup, Performance Orchestration, and UX Envelope | Mainline native | Native path | Boot Shell / Mode Select / Observatory | 3.17, 4.6, 4.6.1, 4.6.2, 4.6.3, 4.6.4, 4.6.5, 4.6.6, 4.6.7, 4.7, 4.7.1, 4.7.2, 4.7.3, 4.7.4, 4.7.5, 4.7.6, 4.7.7, 4.7.8, 4.9, 4.9.1, 4.9.2, 4.9.3, 5.1, 5.2, 5.3, 5.5, 5.6 |
| Benchmarking and Stress Harness | Mainline fallback | Fallback path | Performance Modes / Observatory → Benchmark and Stress | 3.27, 3.27.1, 3.27.2, 3.27.3, 3.27.4, 3.27.5, 3.27.6, 3.27.7, 4.8, 4.8.1, 4.8.2, 4.8.3, 4.8.4, 4.8.5 |
| Hardware Acceleration and Global Illumination | Mainline fallback | Fallback path | WebGPU Canvas / Observatory → Render Kernel | 3.11, 3.11.1, 3.11.2, 4.4, 3.30, 3.30.1 |

## 核心体验主线 / Experience Flow

1. **Boot Shell**: probe capabilities, warm subsystems, and explain the startup path before the world opens.
2. **Mode Select**: choose a runtime stance that controls warmup intensity, visual ambition, and fallback posture.
3. **World HUD**: keep capability clusters, strategic signals, and civilization metrics on the same stage.
4. **Observatory**: expose subsystem health, runtime traces, and fallback evidence when the user wants proof.
5. **Specialist Panels**: open citizen, divine, governance, genesis, benchmark, and space-warp flows from real entry points.

## 需求闭环地图 / Requirement Closure Ledger

- **Citizen Intelligence Kernel**: Three-state citizens, quantum/SNN logic, gene plugins, BaZi fate mapping, and custom AI routing are unified as one cognition stack.
- **Society, Culture, and Narrative Mesh**: Media, education, religion, social graphs, and dynamic narrative are presented as one social-cultural network.
- **Economy, Industry, and Infrastructure**: Technology, supply chains, labor specialization, infrastructure, and anchored virtual economy form one production stack.
- **Governance and Democratic Machinery**: DAO constitutional logic, economic governance, judiciary, ethics constraints, and liquid democracy form one governance surface.
- **Conflict, Epidemics, and Climate**: Crime, war, diplomacy, epidemics, climate, and chaos warnings are exposed as one crisis-and-ecology cluster.
- **Entropy Era and Survival Loop**: Observation value, divine interventions, entropy era, apocalypse laws, and roguelike reincarnation form one survival loop.
- **Chinese Cyberpunk Visual Interface**: Code rain, visual LOD, observer effects, and memory splats are unified into one flagship interface system.
- **Multimodal Command and Blind-Oracle Play**: Speech commands, spatial audio, blind mode, haptics, and proximity rifts define the perception-and-input layer.
- **Reality Twin and Counterfactual Branches**: Genesis weather, real-economy hooks, and counterfactual branches are treated as mainline features rather than hidden experiments.
- **Identity, Chain Evidence, and Compliance**: WebAuthn, snapshot anchoring, zero-knowledge identity, and data sovereignty are treated as one trust-and-evidence path.
- **Persistence, Time Travel, and Ghost Time**: OPFS, SQLite, time travel, multiverse branches, and ghost-time settlement are unified as one archival layer.
- **Cross-Civilization and Interplanetary Expansion**: Multi-civilization instances, world governance, space colonization, and metaverse sync are framed as the expansion universe.
- **Space Warp and Federation Distribution**: Volunteer compute, QR handoff, and WebTorrent federation are presented as one explainable P2P path.
- **Plugin Marketplace and Open Civilization Ecosystem**: Plugin markets, decentralized versioning, and world forking live as an explicit open-ecosystem cluster.
- **Warmup, Performance Orchestration, and UX Envelope**: Warmup, mode orchestration, render scheduling, telemetry, and mobile performance strategy form one performance backbone.
- **Benchmarking and Stress Harness**: Professional benchmarks, long-session telemetry, and stress harnesses form the heavyweight tool belt of the performance layer.
- **Hardware Acceleration and Global Illumination**: WebGPU global illumination, hardware recording, and mixed scheduling define the flagship rendering ceiling.

## 浏览器能力编排 / Browser Capability Orchestration

| Browser capability | Major owners |
| --- | --- |
| `barcodeDetector` | Space Warp and Federation Distribution |
| `gamepad` | Multimodal Command and Blind-Oracle Play |
| `haptics` | Multimodal Command and Blind-Oracle Play |
| `opfs` | Citizen Intelligence Kernel, Society, Culture, and Narrative Mesh, Governance and Democratic Machinery, Conflict, Epidemics, and Climate, Identity, Chain Evidence, and Compliance, Persistence, Time Travel, and Ghost Time, Plugin Marketplace and Open Civilization Ecosystem, Warmup, Performance Orchestration, and UX Envelope, Benchmarking and Stress Harness |
| `periodicSync` | Entropy Era and Survival Loop, Persistence, Time Travel, and Ghost Time |
| `serviceWorker` | Entropy Era and Survival Loop, Reality Twin and Counterfactual Branches, Persistence, Time Travel, and Ghost Time |
| `sharedWorker` | Persistence, Time Travel, and Ghost Time, Warmup, Performance Orchestration, and UX Envelope, Benchmarking and Stress Harness |
| `speechRecognition` | Multimodal Command and Blind-Oracle Play |
| `speechSynthesis` | Multimodal Command and Blind-Oracle Play |
| `wasm` | Citizen Intelligence Kernel, Economy, Industry, and Infrastructure, Warmup, Performance Orchestration, and UX Envelope, Benchmarking and Stress Harness, Hardware Acceleration and Global Illumination |
| `webAuthn` | Governance and Democratic Machinery, Identity, Chain Evidence, and Compliance |
| `webBluetooth` | Multimodal Command and Blind-Oracle Play |
| `webgl` | Chinese Cyberpunk Visual Interface, Warmup, Performance Orchestration, and UX Envelope |
| `webgpu` | Citizen Intelligence Kernel, Society, Culture, and Narrative Mesh, Economy, Industry, and Infrastructure, Conflict, Epidemics, and Climate, Entropy Era and Survival Loop, Chinese Cyberpunk Visual Interface, Warmup, Performance Orchestration, and UX Envelope, Benchmarking and Stress Harness, Hardware Acceleration and Global Illumination |
| `webrtc` | Cross-Civilization and Interplanetary Expansion, Space Warp and Federation Distribution |
| `webTorrent` | Space Warp and Federation Distribution |

Public runtime language is intentionally small and consistent:

- `native`: the real browser path is active.
- `fallback`: the mainline experience remains available through a lower-cost route.
- `simulated`: the experience is intentionally marked as local or synthetic, never disguised as a real external path.
- `unavailable-with-reason`: the current environment cannot run the path and the reason is surfaced.

## 为什么这个实现值得看 / Why This Implementation Is Worth Reading

- It keeps requirement coverage, product entry, and runtime evidence on the same axis.
- It does not hide fallback logic behind silent failures or fake-success mock paths.
- It is designed for static deployment, yet still stages WebGPU, WebRTC, WebAuthn, OPFS, and background sync where available.
- It treats README, UI, runtime state, and tests as one contract instead of four disconnected stories.

## 快速开始 / Quick Start

```bash
npm install
npm run verify:release
npm run test:e2e
npm run dev
```

- `npm run verify:release` runs `typecheck`, `vitest`, and the production build.
- `npm run test:e2e` exercises the browser smoke path.
- `release-dist/` is the production artifact for static hosting.

## 部署与发布 / Shipping

```bash
npm run deploy:vercel
npm run deploy:netlify
```

The repository already ships static-hosting defaults through `public/_headers`, `vercel.json`, and `netlify.toml`.

## 仓库边界 / Repository Boundary

- Private source requirement files are intentionally excluded from the public repository.
- Internal review and release notes are also excluded from the public repository snapshot.
- The public truth source for requirement coverage lives in `src/runtime/requirements/`.
- The README and runtime atlas are expected to stay in sync with the requirement registry and tests.

## 许可 / License

- [LICENSE](./LICENSE): MIT
- [LICENSE-ENHANCED-CN.md](./LICENSE-ENHANCED-CN.md): Chinese supplement and repository-specific notice
