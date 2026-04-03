import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const groups = JSON.parse(
  fs.readFileSync(path.join(root, 'src/runtime/requirements/universeGroups.json'), 'utf8'),
);
const features = JSON.parse(
  fs.readFileSync(path.join(root, 'src/runtime/requirements/featureCatalog.json'), 'utf8'),
);
const clauses = JSON.parse(
  fs.readFileSync(path.join(root, 'src/runtime/requirements/sourceInventory.json'), 'utf8'),
);

const pathLabel = {
  native: 'Native path',
  fallback: 'Fallback path',
  simulated: 'Explicit simulation',
};

function cleanEntry(value) {
  return String(value).replace(/鈫\?/g, '->').replace(/\s+/g, ' ').trim();
}

const statusLabel = {
  'mainline-native': 'Mainline native',
  'mainline-fallback': 'Mainline fallback',
  'mainline-simulated-with-explicit-label': 'Mainline simulated',
};

const groupedFeatures = groups.map((group) => ({
  ...group,
  features: features.filter((feature) => feature.universeGroup === group.id),
}));

const capabilityMap = new Map();
for (const feature of features) {
  for (const capability of feature.capabilityDependencies) {
    const current = capabilityMap.get(capability) ?? [];
    current.push(feature.titleEN);
    capabilityMap.set(capability, current);
  }
}

const capabilityRows = [...capabilityMap.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([capability, owners]) => `| \`${capability}\` | ${owners.join(', ')} |`)
  .join('\n');

const featureUniverseSections = groupedFeatures
  .map((group) => {
    const rows = group.features
      .map(
        (feature) =>
          `| ${feature.titleEN} | ${statusLabel[feature.status]} | ${pathLabel[feature.runtimePath]} | ${cleanEntry(feature.experienceEntryEN)} | ${feature.coveredClauses.join(', ')} |`,
      )
      .join('\n');

    return `### ${group.titleEN}

${group.summaryEN}

| Cluster | Public status | Runtime path | Product entry | Clauses |
| --- | --- | --- | --- | --- |
${rows}`;
  })
  .join('\n\n');

const featureHighlights = features
  .map((feature) => `- **${feature.titleEN}**: ${feature.readmeSummaryEN}`)
  .join('\n');

const readme = `# 世界文明模拟器 | OMNIS APIEN

世界文明模拟器是一个以浏览器原生能力为主舞台的文明模拟器。它把能力探测、真实链路、降级策略、显式模拟边界和可验证门禁一起做成产品表面，而不是把这些复杂度藏在代码背后。

OMNIS APIEN is a browser-first civilization simulator that treats capability probing, real integration paths, fallback policy, explicit simulation boundaries, and release gates as part of the product surface rather than private implementation detail.

## 项目简介 / Project Overview

- Public requirement coverage is derived into **${clauses.length}** mapped clauses.
- Those clauses are composed into **${features.length}** mainline feature clusters.
- The clusters are grouped into **${groups.length}** runtime-facing universe layers.
- The public repository keeps its truth source in \`src/runtime/requirements/\`, not in private planning folders.

## 功能宇宙图 / Feature Universe

This repository is organized around a playable feature universe. The README starts from what the product can actually do, then shows how the browser runtime, fallback logic, and release verification support that experience.

${featureUniverseSections}

## 核心体验主线 / Experience Flow

1. **Boot Shell**: probe capabilities, warm subsystems, and explain the startup path before the world opens.
2. **Mode Select**: choose a runtime stance that controls warmup intensity, visual ambition, and fallback posture.
3. **World HUD**: keep capability clusters, strategic signals, and civilization metrics on the same stage.
4. **Observatory**: expose subsystem health, runtime traces, and fallback evidence when the user wants proof.
5. **Specialist Panels**: open citizen, divine, governance, genesis, benchmark, and space-warp flows from real entry points.

## 需求闭环地图 / Requirement Closure Ledger

${featureHighlights}

## 浏览器能力编排 / Browser Capability Orchestration

| Browser capability | Major owners |
| --- | --- |
${capabilityRows}

Public runtime language is intentionally small and consistent:

- \`native\`: the real browser path is active.
- \`fallback\`: the mainline experience remains available through a lower-cost route.
- \`simulated\`: the experience is intentionally marked as local or synthetic, never disguised as a real external path.
- \`unavailable-with-reason\`: the current environment cannot run the path and the reason is surfaced.

## 为什么这个实现值得看 / Why This Implementation Is Worth Reading

- It keeps requirement coverage, product entry, and runtime evidence on the same axis.
- It does not hide fallback logic behind silent failures or fake-success mock paths.
- It is designed for static deployment, yet still stages WebGPU, WebRTC, WebAuthn, OPFS, and background sync where available.
- It treats README, UI, runtime state, and tests as one contract instead of four disconnected stories.

## 快速开始 / Quick Start

\`\`\`bash
npm install
npm run verify:release
npm run test:e2e
npm run dev
\`\`\`

- \`npm run verify:release\` runs \`typecheck\`, \`vitest\`, and the production build.
- \`npm run test:e2e\` exercises the browser smoke path.
- \`release-dist/\` is the production artifact for static hosting.

## 部署与发布 / Shipping

\`\`\`bash
npm run deploy:vercel
npm run deploy:netlify
\`\`\`

The repository already ships static-hosting defaults through \`public/_headers\`, \`vercel.json\`, and \`netlify.toml\`.

## 仓库边界 / Repository Boundary

- Private source requirement files are intentionally excluded from the public repository.
- Internal review and release notes are also excluded from the public repository snapshot.
- The public truth source for requirement coverage lives in \`src/runtime/requirements/\`.
- The README and runtime atlas are expected to stay in sync with the requirement registry and tests.

## 许可 / License

- [LICENSE](./LICENSE): MIT
- [LICENSE-ENHANCED-CN.md](./LICENSE-ENHANCED-CN.md): Chinese supplement and repository-specific notice
`;

fs.writeFileSync(path.join(root, 'README.md'), readme);
console.log('README.md regenerated from runtime requirement catalog.');
