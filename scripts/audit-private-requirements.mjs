import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DEFAULT_PRIVATE_REQUIREMENTS_DIR =
  'C:/Users/机械革命/Desktop/世界文明模拟器-private-materials/20260403-091846/需求';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function safeReadFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function clauseKey(entry) {
  return `${entry.docId}:${entry.clause}`;
}

function extractClauses(content) {
  const clauses = new Set();
  const headingRegex = /^\s{0,3}#{2,6}\s+(\d+(?:\.\d+)+)\b/gm;

  for (const match of content.matchAll(headingRegex)) {
    clauses.add(match[1]);
  }

  const inlineRegex = /(?<![\d.])(\d+(?:\.\d+)+)(?![\d.])/g;
  for (const match of content.matchAll(inlineRegex)) {
    clauses.add(match[1]);
  }

  return [...clauses]
    .filter((clause) => /^(3|4|5)\.\d+(?:\.\d+)*$/.test(clause))
    .sort((left, right) =>
    left.localeCompare(right, 'zh-Hans-CN', { numeric: true }),
    );
}

function resolvePrivateDirectory() {
  const candidate = process.env.PRIVATE_REQUIREMENTS_DIR ?? DEFAULT_PRIVATE_REQUIREMENTS_DIR;
  return path.normalize(candidate);
}

function collectPrivateSources(privateDir) {
  const fileNames = [
    '顶级无后端网站需求.txt',
    '无后端网站的补充.txt',
    '顶级无后端网站需求_v13_高级补充协议.md',
  ];

  return fileNames.map((fileName) => {
    const filePath = path.join(privateDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing private requirement file: ${filePath}`);
    }

    return {
      fileName,
      filePath,
      content: safeReadFile(filePath),
    };
  });
}

function formatList(items) {
  return items.length === 0 ? 'none' : items.join(', ');
}

function main() {
  const privateDir = resolvePrivateDirectory();

  if (!fs.existsSync(privateDir)) {
    console.error(`Private requirement directory not found: ${privateDir}`);
    process.exit(1);
  }

  const sourceInventory = readJson('src/runtime/requirements/sourceInventory.json');
  const featureCatalog = readJson('src/runtime/requirements/featureCatalog.json');
  const featureEntryMetadata = readJson('src/runtime/requirements/featureEntryMetadata.json');

  const sources = collectPrivateSources(privateDir);
  const privateClauseRows = [];
  const privateClauseKeys = new Set();
  const docIdByFileName = {
    '顶级无后端网站需求.txt': 'v12',
    '无后端网站的补充.txt': 'supplement',
    '顶级无后端网站需求_v13_高级补充协议.md': 'v13',
  };

  for (const source of sources) {
    const docId = docIdByFileName[source.fileName];
    for (const clause of extractClauses(source.content)) {
      const row = { docId, clause };
      privateClauseRows.push(row);
      privateClauseKeys.add(clauseKey(row));
    }
  }

  const sourceInventoryClauseKeys = new Set(sourceInventory.map((entry) => clauseKey(entry)));
  const sourceInventoryByClause = new Map(
    sourceInventory.map((entry) => [entry.clause, entry]),
  );
  const featureCoveredClauseKeys = new Set(
    featureCatalog.flatMap((feature) => {
      if (Array.isArray(feature.coveredClauseRefs) && feature.coveredClauseRefs.length > 0) {
        return feature.coveredClauseRefs.map((entry) => clauseKey(entry));
      }

      return (feature.coveredClauses ?? []).map((clause) => {
        const sourceEntry = sourceInventoryByClause.get(clause);
        return clauseKey(sourceEntry ?? { docId: feature.sourceDoc, clause });
      });
    }),
  );
  const metadataIds = new Set(featureEntryMetadata.map((entry) => entry.id));

  const missingFromSourceInventory = privateClauseRows
    .filter((entry) => !sourceInventoryClauseKeys.has(clauseKey(entry)))
    .map(clauseKey)
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN', { numeric: true }));

  const missingFromFeatureCoverage = [...sourceInventoryClauseKeys]
    .filter((entryKey) => !featureCoveredClauseKeys.has(entryKey))
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN', { numeric: true }));

  const featuresMissingMetadata = featureCatalog
    .filter((feature) => !metadataIds.has(feature.id))
    .map((feature) => feature.id);

  const invalidStatuses = featureCatalog
    .filter(
      (feature) =>
        !['mainline-native', 'mainline-fallback'].includes(feature.status)
        || !['native', 'fallback'].includes(feature.runtimePath),
    )
    .map((feature) => `${feature.id}:${feature.status}/${feature.runtimePath}`);

  const summary = featureCatalog.reduce(
    (accumulator, feature) => {
      accumulator[feature.status] = (accumulator[feature.status] ?? 0) + 1;
      return accumulator;
    },
    { 'mainline-native': 0, 'mainline-fallback': 0 },
  );

  console.log(`Private requirement directory: ${privateDir}`);
  console.log(`Private clauses discovered: ${privateClauseKeys.size}`);
  console.log(`Public source inventory clauses: ${sourceInventory.length}`);
  console.log(`Public feature clusters: ${featureCatalog.length}`);
  console.log(
    `Public status mix: native=${summary['mainline-native']}, fallback=${summary['mainline-fallback']}`,
  );
  console.log(`Missing from source inventory: ${formatList(missingFromSourceInventory)}`);
  console.log(`Missing from feature coverage: ${formatList(missingFromFeatureCoverage)}`);
  console.log(`Features missing entry metadata: ${formatList(featuresMissingMetadata)}`);
  console.log(`Invalid public statuses: ${formatList(invalidStatuses)}`);

  if (
    missingFromSourceInventory.length > 0
    || missingFromFeatureCoverage.length > 0
    || featuresMissingMetadata.length > 0
    || invalidStatuses.length > 0
  ) {
    process.exit(1);
  }
}

main();
