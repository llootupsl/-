import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPublicRequirementView } from '../src/runtime/requirements/publicRegistry.mjs';

const ROOT = process.cwd();
const README_PATH = path.join(ROOT, 'README.md');

function featureTitleCN(feature) {
  return feature.title;
}

function featureSummaryCN(feature) {
  return feature.readmeSummary;
}

function statusLabelCN(status) {
  return status === 'mainline-native' ? '主线原生' : '主线降级';
}

function statusLabelEN(status) {
  return status === 'mainline-native' ? 'Mainline native' : 'Mainline fallback';
}

function cleanCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function table(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function formatClauseRef(clauseRef) {
  return `${clauseRef.docId}:${clauseRef.clause}`;
}

function clauseDigest(clauseRefs) {
  const preview = clauseRefs.slice(0, 3).map(formatClauseRef).join(', ');
  const extra = clauseRefs.length - Math.min(clauseRefs.length, 3);
  return extra > 0 ? `${preview} (+${extra})` : preview;
}

function renderSection(title, chineseBlock, englishBlock) {
  return [
    `## ${title}`,
    '',
    '### 中文',
    '',
    ...chineseBlock,
    '',
    '### English',
    '',
    ...englishBlock,
    '',
  ].join('\n');
}

function renderParagraphs(paragraphs) {
  return paragraphs.flatMap((paragraph) => [paragraph, '']);
}

function writeTextFileSafely(targetPath, content) {
  const tempPath = `${targetPath}.tmp`;
  fs.writeFileSync(tempPath, content, 'utf8');
  fs.copyFileSync(tempPath, targetPath);
  fs.rmSync(tempPath, { force: true });
}

export function buildReadmeMarkdown(root = ROOT) {
  const {
    groupRows,
    publicFeatures,
    coverage,
    summary,
    capabilityRows,
    sourceInventory,
  } = buildPublicRequirementView(root);

  const docBreakdown = Object.entries(
    sourceInventory.reduce((accumulator, entry) => {
      accumulator[entry.docId] = (accumulator[entry.docId] ?? 0) + 1;
      return accumulator;
    }, {}),
  );

  const docLabels = {
    v12: ['主需求文档', 'Core Requirement Document'],
    supplement: ['性能补充文档', 'Performance Supplement'],
    v13: ['V13 高级补充协议', 'V13 Advanced Supplement'],
  };

  const layerTableCN = table(
    ['能力层', '功能簇', '主线原生', '主线降级', '主焦点'],
    groupRows.map(({ group, groupFeatures, counts }) => [
      cleanCell(group.title),
      String(groupFeatures.length),
      String(counts['mainline-native']),
      String(counts['mainline-fallback']),
      cleanCell(group.summary),
    ]),
  );

  const layerTableEN = table(
    ['Layer', 'Clusters', 'Native', 'Fallback', 'Primary Focus'],
    groupRows.map(({ group, groupFeatures, counts }) => [
      cleanCell(group.titleEN),
      String(groupFeatures.length),
      String(counts['mainline-native']),
      String(counts['mainline-fallback']),
      cleanCell(group.summaryEN),
    ]),
  );

  const clusterTableCN = table(
    ['功能簇', '主入口', '入口动作', '状态', '条款映射'],
    publicFeatures.map((feature) => [
      cleanCell(featureTitleCN(feature)),
      cleanCell(feature.entrySurfaceCN),
      cleanCell(feature.entryActionCN),
      statusLabelCN(feature.status),
      cleanCell(clauseDigest(feature.coveredClauseRefs)),
    ]),
  );

  const clusterTableEN = table(
    ['Cluster', 'Primary Entry', 'Entry Action', 'Status', 'Clause Coverage'],
    publicFeatures.map((feature) => [
      cleanCell(feature.titleEN),
      cleanCell(feature.entrySurfaceEN),
      cleanCell(feature.entryActionEN),
      statusLabelEN(feature.status),
      cleanCell(clauseDigest(feature.coveredClauseRefs)),
    ]),
  );

  const requirementDocTableCN = table(
    ['来源文档', '条款数'],
    docBreakdown.map(([docId, count]) => [
      cleanCell(docLabels[docId]?.[0] ?? docId),
      String(count),
    ]),
  );

  const requirementDocTableEN = table(
    ['Source Document', 'Clause Count'],
    docBreakdown.map(([docId, count]) => [
      cleanCell(docLabels[docId]?.[1] ?? docId),
      String(count),
    ]),
  );

  const capabilityTableCN = table(
    ['浏览器能力', '关联功能簇'],
    capabilityRows.map(({ capability, capabilityFeatures }) => [
      cleanCell(capability),
      cleanCell(capabilityFeatures.map((feature) => featureTitleCN(feature)).join('、')),
    ]),
  );

  const capabilityTableEN = table(
    ['Capability', 'Owning Clusters'],
    capabilityRows.map(({ capability, capabilityFeatures }) => [
      cleanCell(capability),
      cleanCell(capabilityFeatures.map((feature) => feature.titleEN).join(', ')),
    ]),
  );

  return [
    '# 世界文明模拟器 / OMNIS APIEN',
    '',
    '一个坚持无后端原则的浏览器文明模拟器：从市民认知、社会文化、现实锚点到 P2P 联邦、WebGPU 渲染和后台结算，所有主线能力都必须有真实入口、可见状态与可解释的降级路径。',
    '',
    'A browser-native civilization simulator that stays serverless by design: cognition, society, reality sync, P2P federation, WebGPU rendering, and background settlement all ship with real entry surfaces, visible status, and explicit fallback routes.',
    '',
    renderSection(
      '项目简介 / Project Overview',
      [
        ...renderParagraphs([
          '这个项目不是把一堆前沿名词贴在首页上，而是试图把三份私有需求文档中真正有工程含义的能力，压进一个可部署、可验证、可在浏览器里独立运行的文明系统里。',
          '当前公开版本把市民智能、社会文化、经济治理、现实孪生、身份确权、P2P 联邦、性能压测和 WebGPU 渲染统一到同一套运行时契约里。用户看到的是一个文明世界；前端工程师看到的则是一套能力探测、动态装载、主线入口和降级协议共同驱动的浏览器内核。',
        ]),
      ],
      [
        ...renderParagraphs([
          'This project is not a landing page that name-drops advanced web APIs. It is an attempt to compress the actual engineering intent of three private requirement documents into a deployable, verifiable, browser-only civilization system.',
          'The current public release aligns citizen intelligence, social culture, economy, governance, reality sync, identity proofs, P2P federation, performance benchmarking, and WebGPU rendering behind one runtime contract. Players see a world; frontend engineers see capability probing, dynamic loading, explicit entry surfaces, and honest fallback orchestration.',
        ]),
      ],
    ),
    renderSection(
      '功能宇宙 / Feature Universe',
      [
        ...renderParagraphs([
          `公开主线一共保留 ${publicFeatures.length} 个功能簇，分布在 ${groupRows.length} 个能力层中，其中 ${summary['mainline-native']} 个功能簇走原生主线路径，${summary['mainline-fallback']} 个功能簇以一等降级方式保持可用。首页先讲这些能力能做什么，再讲它们为什么值得看。`,
          '下面这张宇宙图不是概念陈列柜，而是应用真正的入口地图。每个功能簇都对应主界面、模式页、HUD、观测台或专题面板中的实际入口。',
        ]),
        layerTableCN,
        '',
        clusterTableCN,
      ],
      [
        ...renderParagraphs([
          `The public mainline keeps ${publicFeatures.length} feature clusters across ${groupRows.length} runtime layers. ${summary['mainline-native']} clusters currently run through a native path, while ${summary['mainline-fallback']} remain available through first-class fallbacks. The homepage starts with what the system can do before it explains why the implementation matters.`,
          'This atlas is not concept art. It is the actual entry map of the app, and every cluster points to a real surface in the boot flow, mode selector, HUD, observatory, or a dedicated feature panel.',
        ]),
        layerTableEN,
        '',
        clusterTableEN,
      ],
    ),
    renderSection(
      '核心体验主线 / Experience Flow',
      [
        ...renderParagraphs([
          '启动链路从浏览器能力探测开始，随后进入模式选择、主 HUD、文明能力宇宙图和专题面板。用户既可以顺着主循环游玩，也可以像检阅一套复杂前端系统那样逐层进入社会、风险、现实锚点、空间连接、生态锻炉和性能观测面。',
          '重要的是，这些入口背后不再依赖“看起来像成功”的占位逻辑。每个功能簇都必须告诉你当前走的是原生路径还是降级路径，依赖了哪些浏览器能力，失败时为什么失败，以及替代路线是什么。',
        ]),
      ],
      [
        ...renderParagraphs([
          'The experience starts with browser capability probing, then moves through mode selection, the main HUD, the capability atlas, and the dedicated feature panels. You can play it as a world simulation or inspect it like a layered frontend system that exposes society, risk, reality sync, space connection, ecosystem, and performance surfaces.',
          'The key change is that these surfaces no longer depend on placeholder success states. Each cluster has to tell you whether the current route is native or fallback, which browser capabilities it depends on, why a failure happened, and what the alternative path is.',
        ]),
      ],
    ),
    renderSection(
      '需求闭环地图 / Requirement Closure Map',
      [
        ...renderParagraphs([
          `公开注册表当前以 \`docId + clause\` 为审计单位覆盖 ${coverage.covered}/${sourceInventory.length} 条需求条款，覆盖率维持在 100%。这些条款来自主需求文档、性能补充文档和 V13 高级补充协议三份私有原文，但公开仓库本身不携带私有原文目录。`,
          '如果你只是克隆公开仓库，首页和运行时注册表已经足够复原功能边界；如果你同时持有作者本地的私有材料，可以运行私有对拍命令，直接校验公开注册表与私有原文的逐文档、逐条款覆盖关系。',
        ]),
        requirementDocTableCN,
        '',
        '```bash',
        'npm run audit:requirements:private',
        '```',
      ],
      [
        ...renderParagraphs([
          `The public registry currently tracks coverage by \`docId + clause\` and covers ${coverage.covered}/${sourceInventory.length} requirement rows, which keeps coverage at 100 percent. Those rows originate from the core requirement document, the performance supplement, and the V13 advanced supplement, while the public repository intentionally excludes the private source folder.`,
          'If you only clone the public repository, the homepage and runtime registry still reconstruct the product boundary. If you also have the private author materials locally, you can run the private audit command and verify per-document, per-clause coverage against the originals.',
        ]),
        requirementDocTableEN,
        '',
        '```bash',
        'npm run audit:requirements:private',
        '```',
      ],
    ),
    renderSection(
      '浏览器能力编排 / Browser Capability Orchestration',
      [
        ...renderParagraphs([
          '这个项目的工程炫技不在于把 API 名字堆满页面，而在于把这些浏览器能力真正编排进主线：WebGPU 决定渲染上限，WebAuthn 负责身份确权，Periodic Background Sync 驱动幽灵时间，WebRTC 与 WebTorrent 负责空间连接和联邦分发，多模态链路则接管语音、触觉和近场体验。',
          '当某项能力在当前浏览器上不可用时，应用不会假装成功，而是明确切到降级路径，并把原因展示在能力宇宙图和专题面板里。',
        ]),
        capabilityTableCN,
      ],
      [
        ...renderParagraphs([
          'The engineering punchline is not that the project mentions advanced web APIs. It is that those browser capabilities are actually orchestrated into the mainline: WebGPU defines the rendering ceiling, WebAuthn anchors trust, periodic background sync powers ghost time, WebRTC and WebTorrent drive federation, and the multimodal stack handles speech, haptics, and proximity play.',
          'When a capability is unavailable in the current browser, the app does not fake success. It moves into a visible fallback path and explains the reason directly in the atlas and the dedicated panels.',
        ]),
        capabilityTableEN,
      ],
    ),
    renderSection(
      '为什么值得看 / Why This Implementation Is Worth Reading',
      [
        ...renderParagraphs([
          '如果你是普通访客，这个项目值得看是因为它把“浏览器里能不能做出一个文明世界”这件事推到了非常具体、非常可玩的层面。',
          '如果你是前端工程师，它值得看是因为这里的重点不是单个 API 的 Demo，而是如何把需求注册表、能力探测、动态装载、主线入口、显式降级和发布门禁串成一套自洽的系统。',
        ]),
      ],
      [
        ...renderParagraphs([
          'If you are a general visitor, this project is worth reading because it pushes the question of whether a browser can host a living civilization into something concrete and playable.',
          'If you are a frontend engineer, it is worth reading because the core idea is not a single API demo. The interesting part is how the requirement registry, capability probing, dynamic loading, mainline entry surfaces, explicit fallbacks, and release gates are tied into one coherent system.',
        ]),
      ],
    ),
    renderSection(
      '快速开始 / Quick Start',
      [
        ...renderParagraphs([
          '公开仓库可以直接在干净环境中安装和验证。下面这组命令会依次完成依赖安装、发布门禁检查、浏览器冒烟测试和本地开发启动。',
        ]),
        '```bash',
        'npm install',
        'npm run verify:release',
        'npm run test:e2e',
        'npm run dev',
        '```',
        '',
        '如果你在作者机器或带有私有需求原文的环境中工作，还可以额外运行 `npm run audit:requirements:private` 来做私有条款对拍。',
      ],
      [
        ...renderParagraphs([
          'The public repository is meant to install and verify cleanly from scratch. The following commands install dependencies, run the release gate, execute the browser smoke path, and then start local development.',
        ]),
        '```bash',
        'npm install',
        'npm run verify:release',
        'npm run test:e2e',
        'npm run dev',
        '```',
        '',
        'If you are working on the author machine or another environment that also contains the private requirement originals, you can additionally run `npm run audit:requirements:private` for private clause auditing.',
      ],
    ),
    renderSection(
      '部署与发布 / Deployment and Release',
      [
        ...renderParagraphs([
          '生产构建输出到 `release-dist/`，适合直接接入 Vercel、Netlify 或任意静态托管平台。部署说明被放在靠后位置，不再压过功能介绍本身。',
        ]),
      ],
      [
        ...renderParagraphs([
          'Production builds are emitted to `release-dist/`, which is ready for Vercel, Netlify, or any other static hosting platform. Deployment details stay later in the document so they do not overshadow the product itself.',
        ]),
      ],
    ),
    renderSection(
      '仓库边界 / Repository Boundary',
      [
        ...renderParagraphs([
          '公开仓库只保留运行时代码、验证脚本、部署配置与许可证，不包含私有需求原文，也不再上传内部文档目录或私有需求目录。需求闭环通过公开注册表和可选的本地私有对拍命令来证明。',
        ]),
      ],
      [
        ...renderParagraphs([
          'The public repository keeps runtime code, verification scripts, deployment config, and license material only. It intentionally excludes the private requirement originals as well as internal documentation folders and private requirement folders. Requirement closure is demonstrated through the public registry and the optional local private-audit command.',
        ]),
      ],
    ),
    renderSection(
      '许可 / License',
      [
        ...renderParagraphs([
          '代码主体使用 MIT 许可证，同时保留中文补充说明文件来解释仓库边界和公开发布语境。',
        ]),
        '- [LICENSE](./LICENSE): MIT',
        '- [LICENSE-ENHANCED-CN.md](./LICENSE-ENHANCED-CN.md): 中文补充说明',
      ],
      [
        ...renderParagraphs([
          'The codebase is primarily released under MIT, with a Chinese supplemental notice that explains the repository boundary and the public release context.',
        ]),
        '- [LICENSE](./LICENSE): MIT',
        '- [LICENSE-ENHANCED-CN.md](./LICENSE-ENHANCED-CN.md): Chinese supplemental notice',
      ],
    ),
  ].join('\n').trim() + '\n';
}

export function renderReadme(root = ROOT) {
  const markdown = buildReadmeMarkdown(root);
  writeTextFileSafely(path.join(root, 'README.md'), markdown);
  return markdown;
}

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(CURRENT_FILE_PATH)) {
  renderReadme(ROOT);
  console.log(`Rendered ${path.relative(ROOT, README_PATH)}`);
}
