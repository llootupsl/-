import fs from 'node:fs';
import path from 'node:path';
import { buildPublicRequirementView } from '../src/runtime/requirements/publicRegistry.mjs';

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, 'docs', 'REQUIREMENTS_MATRIX.md');

function cleanText(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function table(headers, rows) {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
  return [headerRow, separator, body].join('\n');
}

function renderClauseRows(view, locale) {
  return view.coverage.rows.map(({ clause, feature }) => {
    if (locale === 'cn') {
      return [
        `${clause.docTitle} ${clause.clause}`,
        cleanText(clause.title),
        cleanText(feature.title),
        cleanText(feature.entrySurfaceCN),
        cleanText(feature.entryActionCN),
        feature.status === 'mainline-native' ? '主线原生' : '主线降级',
        feature.implementationTier === 'native' ? '原生' : '降级',
        feature.verificationId,
      ];
    }

    return [
      `${clause.docTitle} ${clause.clause}`,
      cleanText(clause.title),
      cleanText(feature.titleEN),
      cleanText(feature.entrySurfaceEN),
      cleanText(feature.entryActionEN),
      feature.status === 'mainline-native' ? 'Mainline native' : 'Mainline fallback',
      feature.implementationTier === 'native' ? 'Native' : 'Fallback',
      feature.verificationId,
    ];
  });
}

function renderMatrix(view, locale) {
  const summaryRows = [
    locale === 'cn'
      ? ['主线原生 / Mainline native', String(view.summary['mainline-native'])]
      : ['Mainline native', String(view.summary['mainline-native'])],
    locale === 'cn'
      ? ['主线降级 / Mainline fallback', String(view.summary['mainline-fallback'])]
      : ['Mainline fallback', String(view.summary['mainline-fallback'])],
  ];

  const layerRows = view.groupRows.map(({ group, groupFeatures, counts }) => {
    if (locale === 'cn') {
      return [
        `${cleanText(group.title)} / ${cleanText(group.titleEN)}`,
        String(groupFeatures.length),
        String(counts['mainline-native']),
        String(counts['mainline-fallback']),
      ];
    }

    return [
      `${cleanText(group.titleEN)} / ${cleanText(group.title)}`,
      String(groupFeatures.length),
      String(counts['mainline-native']),
      String(counts['mainline-fallback']),
    ];
  });

  const clauseHeaders = locale === 'cn'
    ? ['来源', '条款', '功能簇', '入口界面', '入口动作', '状态', '实现层级', '验证 ID']
    : ['Source', 'Clause', 'Cluster', 'Entry Surface', 'Entry Action', 'Status', 'Implementation Tier', 'Verification ID'];

  const clauseTable = table(clauseHeaders, renderClauseRows(view, locale));

  if (locale === 'cn') {
    return [
      '公开矩阵直接从 `src/runtime/requirements/` 生成，覆盖全部来源条款，并只保留主线原生与主线降级两态。',
      '',
      table(['状态', '数量'], summaryRows),
      '',
      table(['层级', '功能簇', '原生', '降级'], layerRows),
      '',
      clauseTable,
    ].join('\n');
  }

  return [
    'This public matrix is generated from `src/runtime/requirements/`, covers every source clause, and keeps only the mainline native and mainline fallback states.',
    '',
    table(['Status', 'Count'], summaryRows),
    '',
    table(['Layer', 'Clusters', 'Native', 'Fallback'], layerRows),
    '',
    clauseTable,
  ].join('\n');
}

const view = buildPublicRequirementView(ROOT);
const markdown = [
  '# 需求闭环矩阵 / Requirements Closure Matrix',
  '',
  '## 中文',
  '',
  renderMatrix(view, 'cn'),
  '',
  '## English',
  '',
  renderMatrix(view, 'en'),
  '',
].join('\n');

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, markdown, 'utf8');
console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
