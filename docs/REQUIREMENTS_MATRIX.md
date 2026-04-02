# 需求追踪矩阵（Wave C）

> 更新时间：2026-04-02  
> 策略：先稳后扩展；实验特性归 `lab` 且默认关闭

| 编号 | 需求主题 | 状态 | 说明 |
|---|---|---|---|
| 4.6 / 4.7 / 3.27 / 4.9 | 预热、性能模式、基准、监控 | ✅ done | 预热管理、基准面板、监控链路已可运行并通过构建与测试 |
| 3.22.2 | 创世纪数据孪生（天气/时间） | ✅ done | 接入 Open-Meteo；失败自动回退 mock；UI 增加来源与状态展示 |
| 3.22.4 | 区块链快照同步 | ✅ done | 支持 `websocket/http/auto` 同步策略；节点异常自动回退 simulation |
| 4.11 | WebRTC 局域网空间折跃 | ✅ done | QR 握手主流程真实化；支持 BarcodeDetector 扫描与手动 payload 连接 |
| 3.28 / 3.29 / 4.12 | WebAuthn、多模态、后台结算 | 🟡 partial | 核心实现在位；本轮重点完成稳定性修复与门禁拉通 |
| 4.8 | 极限性能压榨措施 | 🧪 deferred-lab | 归类实验特性，默认关闭 |
| 4.10 | WebTorrent 联邦模型分发 | 🧪 deferred-lab | 归类实验特性，默认关闭 |
| 3.30 | WebGPU 实时全局光照计算 | 🧪 deferred-lab | 归类实验特性，默认关闭 |
| 5.x | 非功能（性能/兼容/安全/体验） | ✅ done | 当前门禁：`typecheck + test + build` 全绿 |
| 6.x | 交付物 | 🟡 partial | 核心代码与文档持续完善，本轮新增需求矩阵与增强许可证声明 |

## 当前门禁结果

- `npm run typecheck -- --pretty false` ✅
- `npm run test -- --run` ✅（`152 passed`）
- `npm run build` ✅（仅保留 chunk size 警告）

## 说明

- 为保证主线稳定，`4.8 / 4.10 / 3.30` 默认关闭，可通过 `localStorage` 的实验开关后续按需启用。
