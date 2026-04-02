# 构建风险收敛记录（2026-04-02）

## 目标

- 处理构建告警中的两个高频风险点：
  - 动态导入与静态导入重叠
  - 单个 chunk 过大
- 同步整理项目目录与产物管理策略。

## 本次改动

### 1) 动态导入重叠修复

- `src/audio/AudioEngine.ts`
  - 去除对 `@/wasm/WasmBridge` 的动态导入，改为静态可用性检查（`isWasmReady`）。
  - 目的：消除 `WasmBridge` “动态 + 静态重复导入”告警。

- `src/warmup/StoragePreheater.ts`
  - 去除 `sql.js` 动态导入，改为模块级缓存初始化（`getSqlModule`）。
  - 目的：与 `StorageManager` 的静态导入策略统一，消除 `sql.js` 重叠告警。

### 2) 分块策略优化

- `vite.config.ts`
  - 将 `manualChunks` 从静态对象改为函数分桶策略：
    - `vendor-*`（React/Three/LLM/SQL/Audio/Motion/其他依赖）
    - `chunk-simulation / chunk-rendering / chunk-network / chunk-performance / chunk-intelligence / chunk-wasm`
  - 目的：降低单包风险、提升缓存复用与增量发布稳定性。

### 3) 文件夹整理

- 新增 `.gitignore`：
  - 忽略 `node_modules/`, `dist/`, `dev-dist/`, `wasm/target/` 等构建与本地产物。
- 新增脚本：
  - `npm run clean`
  - `npm run build:clean`

## 验证

- `npm run typecheck -- --pretty false` 通过
- `npm run test -- --run` 通过（152 passed）
- `npm run build` 通过

> 备注：如果后续仍有 `chunk size` 提示，可在下一轮继续做路由级/面板级懒加载拆分，以进一步缩小主入口包。
