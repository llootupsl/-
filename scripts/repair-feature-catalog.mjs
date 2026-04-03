import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE_PATH = path.join(ROOT, 'src/runtime/requirements/featureCatalog.json');

const COPY = {
  'citizen-runtime': {
    title: '市民智能内核',
    experienceEntry: '主 HUD -> 市民内核 / 命理层 / 运行时对话',
    dataSource: '本地市民状态、八字数据、向量记忆与用户配置的 AI 路由',
    fallbackMode:
      'WASM、WebGPU 或外部 AI 不可用时回退到本地 JavaScript 与端侧路径，但入口、状态和说明保持可见。',
    validationScenario:
      '从主 HUD 进入市民主线，验证认知、命理、对话和 AI 路由在原生与降级场景下都能工作。',
    readmeSummary:
      '三态市民、量子/SNN 认知、基因插件、八字命理和自定义 AI 路由被收束成一个可操作的数字生命内核。',
  },
  'society-culture': {
    title: '社会文化与叙事网络',
    experienceEntry: '功能宇宙图 -> 社会文化簇 / 运行时对话',
    dataSource: '新闻生成、教育传播、宗教意识形态与社会图谱的本地演化数据',
    fallbackMode:
      '高阶图计算或扩展能力不可用时，社会文化面板仍会保留真实状态、指标和叙事输出，只降低复杂度。',
    validationScenario:
      '从功能宇宙图进入社会文化面板，检查媒体、教育、宗教、社交图与动态叙事的主线入口。',
    readmeSummary:
      '媒体、教育、宗教、社交图谱与动态叙事不再散落在说明里，而是作为同一张社会文化网络进入主线体验。',
  },
  'economy-industry': {
    title: '经济产业与基础设施',
    experienceEntry: '主 HUD -> 经济指标 / 经济与基建控制台',
    dataSource: '本地经济系统、供应链、科技树、职业分工与基础设施模拟数据',
    fallbackMode:
      '即使高性能渲染不可用，经济层仍保持原生数据路径，只在可视化复杂度上做降级。',
    validationScenario:
      '从主 HUD 打开经济与基建面板，验证科技树、供应链、基础设施和现实锚定经济的连续操作路径。',
    readmeSummary:
      '科技树、供应链、职业分工、基础设施和现实锚定经济被组织成一个连续可读的生产栈。',
  },
  'governance-law': {
    title: '治理机制与民主机器',
    experienceEntry: 'DAO 治理中心 / 法律层 / 神谕层',
    dataSource: '本地 DAO 提案、法案执行、司法流程、投票委托和伦理约束数据',
    fallbackMode:
      'WebAuthn 或高阶信任能力不可用时，治理面仍保留 DAO、投票和法案路径，并显式标注信任层降级。',
    validationScenario:
      '进入 DAO 治理中心，验证提案、投票、法典和伦理约束都能从同一条治理主线访问。',
    readmeSummary:
      'DAO 宪法、经济治理、司法流程、伦理约束与流动民主共用同一条治理主线，而不是分裂成若干孤立按钮。',
  },
  'conflict-environment': {
    title: '冲突、流行病与气候生态',
    experienceEntry: '功能宇宙图 -> 风险与生态簇 / 观测台',
    dataSource: '本地犯罪、战争、外交、疫情、气候、生态和混沌预警系统数据',
    fallbackMode:
      '当高阶并行能力受限时，风险面板仍通过本地模型维持冲突、流行病和生态的可操作视图。',
    validationScenario:
      '从功能宇宙图进入风险面板，检查冲突、疫情、气候和生态控制台能否持续输出真实状态。',
    readmeSummary:
      '犯罪、战争、外交、疫情、气候、生态与混沌预警被放进一套风险控制台，保持实时可视、可解释、可回退。',
  },
  'entropy-survival': {
    title: '熵增纪元与生存循环',
    experienceEntry: '主 HUD -> 纪元信号 / 神谕层',
    dataSource: '观测值、神力干预、熵增纪元、末世法典和 Roguelike 轮回的本地循环状态',
    fallbackMode:
      '后台能力不可用时，熵增纪元仍保留前台可玩的生存循环，只把部分后台结算切换到显式降级模式。',
    validationScenario:
      '从主 HUD 打开纪元与神谕面板，验证观测值、神力、法典和轮回路径保持连通。',
    readmeSummary:
      '观测值、神力干预、熵增纪元、末世法典和 Roguelike 轮回共用一条生存循环，而不是停留在世界观文案里。',
  },
  'visual-interface': {
    title: '中文赛博可视界面',
    experienceEntry: '启动壳 / 模式选择 / 主 HUD / 观测台',
    dataSource: '运行时能力探测、渲染层状态、界面动效与视觉主题配置',
    fallbackMode:
      'WebGPU 不可用时会回退到 WebGL 或 Canvas 路径，但视觉层级、主题与状态文案保持一致。',
    validationScenario:
      '验证启动壳、模式选择和主 HUD 在桌面与移动端都能稳定加载，并清晰显示当前能力路径。',
    readmeSummary:
      '启动仪式、模式选择、主 HUD、观察者效应、记忆可视化与渲染降级被整合为同一套浏览器前台表演层。',
  },
  'multimodal-command': {
    title: '多模态指令与盲眼先知玩法',
    experienceEntry: '运行时对话 / 帮助系统 / 观测台',
    dataSource: '语音识别、语音合成、空间音频、触觉反馈、盲视模式和帮助系统状态',
    fallbackMode:
      '语音、触觉或蓝牙能力缺失时，会切换到键鼠与文字提示路径，同时保留能力状态说明。',
    validationScenario:
      '打开多模态指令层，验证语音、盲视模式、音频和触觉反馈的可用与降级路径。',
    readmeSummary:
      '语音、空间音频、盲视模式、触觉反馈和帮助系统共用同一条多模态输入链，失败时也会显式解释降级原因。',
  },
  'reality-twin': {
    title: '现实孪生与反事实分支',
    experienceEntry: '启动壳 -> 创世纪 / 现实锚点状态',
    dataSource: '地理、天气、宏观经济和本地反事实分支的现实锚点数据',
    fallbackMode:
      '外部 API 不可用时使用本地种子与缓存回放，仍明确标出当前现实锚点来源与回退原因。',
    validationScenario:
      '验证创世纪天气、现实种子和反事实分支在在线与离线场景下都能形成稳定入口。',
    readmeSummary:
      '创世纪天气、现实种子、宏观经济锚点与反事实分支被作为真正的初始化和现实联动路径，而不是隐藏实验项。',
  },
  'chain-evidence': {
    title: '身份、链上证据与合规护栏',
    experienceEntry: 'DAO 中心 / 身份与证据层 / 观测台',
    dataSource: 'WebAuthn、快照上链、身份凭证、链同步与隐私合规模块的本地状态',
    fallbackMode:
      '硬件认证或链节点不可用时，会切换到本地信任锚和模拟链路，同时明确展示降级来源。',
    validationScenario:
      '进入身份与证据层，检查认证、链快照、隐私护栏和同步状态在主线里是否连贯可见。',
    readmeSummary:
      'WebAuthn、链上快照、零知识身份和数据主权共同构成信任与证据路径，既服务玩法也服务工程边界。',
  },
  'storage-ghost-time': {
    title: '持久化、时间旅行与幽灵时间',
    experienceEntry: '启动壳 / PWA / 持久化层 -> 幽灵时间控制台',
    dataSource: 'OPFS、SQLite、时间快照、后台结算与多宇宙分支的本地存储状态',
    fallbackMode:
      'OPFS、Periodic Sync 或 SharedWorker 受限时，仍提供本地存储与前台结算路径，并展示不可用原因。',
    validationScenario:
      '验证持久化层、时间快照和幽灵时间结算在 PWA 与普通页面模式下都可访问。',
    readmeSummary:
      'OPFS、SQLite、时间快照、多宇宙分支和后台结算被统一成一层可验证的文明档案系统。',
  },
  'inter-civilization': {
    title: '跨文明交互与星际扩张',
    experienceEntry: '功能宇宙图 -> 空间连接层 / 观测台',
    dataSource: '跨文明实例、元宇宙互操作、世界级协作与星际扩张的网络状态',
    fallbackMode:
      '跨设备或跨实例网络受限时，仍提供本地世界扩张与联邦说明视图，并保留连接状态提示。',
    validationScenario:
      '从功能宇宙图进入空间连接层，验证跨文明、元宇宙互操作和扩张路径的真实入口。',
    readmeSummary:
      '多文明实例、世界级协作、跨世界同步、元宇宙互操作与星际扩张被组织成浏览器内可达的连接层。',
  },
  'p2p-federation': {
    title: '空间折跃与 P2P 联邦分发',
    experienceEntry: '观测台 -> P2P 联邦 / 设备接力',
    dataSource: '二维码握手、WebRTC 联机、WebTorrent 分发、自愿算力节点与设备接力状态',
    fallbackMode:
      'WebTorrent 或扫码能力不可用时，系统会保留设备接力与联邦说明路径，并显式提示回退方案。',
    validationScenario:
      '验证二维码接力、P2P 联邦、设备同步和联邦分发在支持与不支持场景下都可重复进入。',
    readmeSummary:
      '二维码接力、WebRTC 联机、WebTorrent 分发和自愿算力节点不再只做演示，而是形成一条可解释的联邦网络路径。',
  },
  'open-ecosystem': {
    title: '开放生态与插件锻炉',
    experienceEntry: '功能宇宙图 -> 开放生态锻炉',
    dataSource: '基因插件注册表、世界 fork、合并请求和开放生态市场状态',
    fallbackMode:
      '当真实分发能力受限时，生态锻炉仍保留插件注册、fork 负载和合并演练的本地路径。',
    validationScenario:
      '打开开放生态锻炉，验证插件注册、fork、merge 和分发路径在前端内保持可操作。',
    readmeSummary:
      '基因插件、世界 fork、去中心化版本流和开放生态市场被收束成一块可操作的生态锻炉。',
  },
  'performance-orchestration': {
    title: '预热、性能编排与体验包络',
    experienceEntry: '启动壳 / 模式选择 / 观测台',
    dataSource: '预热管理器、性能模式、运行时遥测、渲染调度和移动端策略数据',
    fallbackMode:
      '部分硬件能力不可用时，仍会执行等价的回退预热路径，并在观测面中说明当前模式与代价。',
    validationScenario:
      '验证预热、性能模式、遥测和运行时包络在三种模式下都能稳定切换与展示。',
    readmeSummary:
      '启动预热、模式编排、运行时遥测、渲染调度与移动端策略被当作主线能力，而不是一堆分散的优化技巧。',
  },
  'benchmark-and-stress': {
    title: '基准测试与压力演练',
    experienceEntry: '性能模式 / 观测台 -> 基准与压测台',
    dataSource: 'CPU、GPU、内存、网络、存储与长期遥测的基准测试结果',
    fallbackMode:
      '高压测试能力受限时，仍保留基准报告、告警提示和导出路径，只降低测试强度而不隐藏入口。',
    validationScenario:
      '进入基准与压测台，验证快速、标准和高压路径都能运行并给出可理解报告。',
    readmeSummary:
      '内置基准测试、长期遥测、导出报告和极限压测形成同一条性能评估路径，让项目既能玩也能测。',
  },
  'hardware-acceleration': {
    title: '硬件加速与全局光照内核',
    experienceEntry: 'WebGPU 画布 / 观测台 -> 渲染内核',
    dataSource: 'WebGPU、全局光照、硬件录制和混合调度的渲染内核状态',
    fallbackMode:
      'WebGPU 或硬件录制不可用时，会切换到可用渲染内核并明确展示不可用原因与替代路径。',
    validationScenario:
      '从渲染内核进入 WebGPU 与全局光照控制台，验证原生和降级渲染路径都能稳定工作。',
    readmeSummary:
      'WebGPU、计算着色器、全局光照、硬件录制与混合硬件调度一起构成渲染上限，并保留清晰可见的降级路线。',
  },
};

const catalog = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const repaired = catalog.map((feature) => ({
  ...feature,
  ...COPY[feature.id],
}));

fs.writeFileSync(FILE_PATH, `${JSON.stringify(repaired, null, 2)}\n`, 'utf8');
console.log(`Repaired ${path.relative(ROOT, FILE_PATH)}`);
