# OMNIS APIEN - 永夜熵纪

## 史上最强纯前端数字文明模拟器

> Decentralized Neural Morphological Civilization Simulator

### 核心特性

- **WebGPU 渲染引擎** - 光线追踪、路径追踪、粒子系统
- **量子-SNN 混合神经网络** - 脉冲神经网络 + 量子决策核心
- **Rust/WASM 核心计算** - 极致性能优化
- **极速预热系统** - 零感知硬件资源预热
- **性能基准测试** - 专业级硬件评测工具
- **赛博朋克中文 UI** - 极致视觉体验

### 技术栈

- TypeScript + React 18
- Vite 6 + WebGPU
- Rust + WebAssembly (SIMD)
- WebLLM (本地 LLM 推理)
- OPFS + SQLite Wasm
- WebTransport

### 快速开始

```bash
# 安装依赖
npm install

# 清理构建产物（推荐）
npm run clean

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 清理后构建
npm run build:clean

# 构建 WASM 模块
npm run wasm:build
```

### 立即部署
```bash
# 发布前完整验收（typecheck + test + build）
npm run verify:release

# 方案 0：立刻可用（匿名 Netlify Drop，返回 URL+密码）
npm run deploy:now

# 方案 A：Vercel（需先配置 VERCEL_TOKEN）
npm run deploy:vercel

# 方案 B：Netlify（需先配置 NETLIFY_AUTH_TOKEN）
npm run deploy:netlify
```

部署说明：
- 本项目依赖 `SharedArrayBuffer`，生产环境必须带 `COOP/COEP` 响应头。
- 已内置部署配置：`vercel.json`、`netlify.toml`、`public/_headers`、`public/_redirects`。
- 本地预览可用：`npm run build && npm run serve:dist`。

### 性能模式

- **极致性能** - 最大硬件占用，追求极限性能
- **均衡模式** - 平衡性能与功耗（默认）
- **节能模式** - 降低资源占用

### 实验特性（Lab）

以下高风险模块默认关闭，以保证主线稳定性：

- `4.8` 极限性能压榨措施
- `4.10` WebTorrent 联邦模型分发
- `3.30` WebGPU 实时全局光照计算

实验开关由 `src/core/config/FeatureFlags.ts` 统一管理。

### 目录结构

```
src/
├── warmup/        # 极速预热引擎
├── bench/         # 性能基准测试
├── monitor/        # 实时性能监控
├── citizen/        # 市民系统
├── neural/         # 神经网络
├── rendering/      # 渲染引擎
├── ai/             # AI 层
├── economy/        # 经济系统
├── governance/     # 治理系统
├── world/          # 世界模拟
├── bazi/           # 八字命理
├── network/        # 网络层
├── ui/             # 用户界面
└── wasm/           # Rust/WASM
```

### License

[MIT](./LICENSE) + [增强声明](./LICENSE-ENHANCED-CN.md)
