import fs from 'node:fs';
import path from 'node:path';
import registry from '../src/runtime/requirements/featureRegistry.data.json' with { type: 'json' };

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, 'docs', 'REQUIREMENTS_MATRIX.md');

const DOCS = [
  {
    label: 'v12.2 主需求',
    file: path.join(ROOT, '需求', '顶级无后端网站需求.txt'),
  },
  {
    label: '性能补充',
    file: path.join(ROOT, '需求', '无后端网站的补充.txt'),
  },
  {
    label: 'V13 高级补充',
    file: path.join(ROOT, '需求', '顶级无后端网站需求_v13_高级补充协议.md'),
  },
];

const headingPattern = /^#{2,4}\s+((?:\d+\.)+\d+)\s+(.+)$/;

function publicStatus(status) {
  if (status === 'mainline-native') {
    return 'native';
  }

  if (status === 'mainline-fallback') {
    return 'fallback';
  }

  return 'simulated';
}

function sanitizeInline(text) {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function extractClauses(doc) {
  const content = fs.readFileSync(doc.file, 'utf8').split(/\r?\n/);

  return content
    .map((line) => {
      const match = line.match(headingPattern);
      if (!match) {
        return null;
      }

      return {
        id: match[1],
        title: sanitizeInline(match[2]),
        source: doc.label,
      };
    })
    .filter(Boolean);
}

const extractedClauses = DOCS.flatMap(extractClauses);
const rows = extractedClauses.map((clause) => {
  const feature = registry.find((entry) => entry.sourceClauses.includes(clause.id));

  if (!feature) {
    return {
      clause,
      feature: {
        titleCN: '未映射',
        status: 'unavailable-with-reason',
        experienceEntry: '待补齐',
        runtimeSubsystem: '待补齐',
        fallbackMode: '该条款尚未完成需求注册表映射。',
        validationScenario: '需求注册表测试应阻止发布。',
      },
    };
  }

  return { clause, feature };
});

const summary = registry.reduce(
  (accumulator, feature) => {
    const key = publicStatus(feature.status);
    accumulator[key] += 1;
    return accumulator;
  },
  { native: 0, fallback: 0, simulated: 0 },
);

const markdown = `# 需求对照矩阵
更新时间：${new Date().toISOString().slice(0, 10)}

此文档由 \`src/runtime/requirements/featureRegistry.data.json\` 生成，是 README、UI 宇宙图、测试与交付说明的统一需求真相源。

## 主线状态词汇

- \`native\`：真实主线路径，浏览器或本地运行时可以直接驱动。
- \`fallback\`：主线保留，但设备或权限不足时进入一等降级路径。
- \`simulated\`：主线存在，但当前路径必须显式标注为本地模拟、受限模式或受控替代。

## 宇宙图摘要

| 状态 | 数量 |
| --- | ---: |
| native | ${summary.native} |
| fallback | ${summary.fallback} |
| simulated | ${summary.simulated} |

## 逐条映射

| 来源 | 条款 | 原始标题 | 功能簇 | 主线状态 | 产品入口 | 运行时子系统 | 回退/说明 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows
  .map(({ clause, feature }) => `| ${clause.source} | \`${clause.id}\` | ${clause.title} | ${sanitizeInline(feature.titleCN)} | \`${publicStatus(feature.status)}\` | ${sanitizeInline(feature.experienceEntry)} | ${sanitizeInline(feature.runtimeSubsystem)} | ${sanitizeInline(feature.fallbackMode)} | ${sanitizeInline(feature.validationScenario)} |`)
  .join('\n')}
`;

fs.writeFileSync(OUTPUT_PATH, markdown, 'utf8');
console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
