import fs from 'node:fs';
import path from 'node:path';

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function getClauseRefKey(clauseRef) {
  return `${clauseRef.docId}:${clauseRef.clause}`;
}

function resolveFeatureClauseRefs(feature, sourceInventoryByClause) {
  if (Array.isArray(feature.coveredClauseRefs) && feature.coveredClauseRefs.length > 0) {
    return feature.coveredClauseRefs;
  }

  return (feature.coveredClauses ?? []).map((clause) => {
    const sourceClause = sourceInventoryByClause.get(clause);
    return {
      docId: sourceClause?.docId ?? feature.sourceDoc,
      clause,
    };
  });
}

export function normalizePublicStatus(status) {
  return status === 'mainline-native' ? 'mainline-native' : 'mainline-fallback';
}

export function normalizeRuntimePath(runtimePath) {
  return runtimePath === 'native' ? 'native' : 'fallback';
}

export function createFallbackEntryMetadata(feature) {
  return {
    entrySurfaceCN: feature.experienceEntry,
    entrySurfaceEN: feature.experienceEntryEN,
    entryActionCN: `进入 ${feature.title}`,
    entryActionEN: `Enter ${feature.titleEN}`,
    implementationTier: normalizePublicStatus(feature.status) === 'mainline-native' ? 'native' : 'fallback',
    verificationId: `verify-${feature.id}`,
  };
}

export function buildPublicRequirementView(root = process.cwd()) {
  const groups = readJson(root, 'src/runtime/requirements/universeGroups.json');
  const features = readJson(root, 'src/runtime/requirements/featureCatalog.json');
  const metadata = readJson(root, 'src/runtime/requirements/featureEntryMetadata.json');
  const sourceInventory = readJson(root, 'src/runtime/requirements/sourceInventory.json');
  const metadataById = new Map(metadata.map((item) => [item.id, item]));
  const sourceInventoryByClause = new Map(sourceInventory.map((item) => [item.clause, item]));

  const publicFeatures = features.map((feature) => {
    const entryMetadata = metadataById.get(feature.id) ?? createFallbackEntryMetadata(feature);

    return {
      ...feature,
      ...entryMetadata,
      status: normalizePublicStatus(feature.status),
      runtimePath: normalizeRuntimePath(feature.runtimePath),
      coveredClauseRefs: resolveFeatureClauseRefs(feature, sourceInventoryByClause),
    };
  });

  const featuresByClauseRef = new Map();
  for (const feature of publicFeatures) {
    for (const clauseRef of feature.coveredClauseRefs) {
      featuresByClauseRef.set(getClauseRefKey(clauseRef), feature);
    }
  }

  const coverage = sourceInventory.reduce(
    (accumulator, clause) => {
      const feature = featuresByClauseRef.get(getClauseRefKey(clause));
      if (feature) {
        accumulator.covered += 1;
        accumulator.rows.push({ clause, feature });
      } else {
        accumulator.uncovered.push(clause);
      }
      return accumulator;
    },
    { covered: 0, uncovered: [], rows: [] },
  );

  const summary = publicFeatures.reduce(
    (accumulator, feature) => {
      accumulator[feature.status] += 1;
      return accumulator;
    },
    { 'mainline-native': 0, 'mainline-fallback': 0 },
  );

  const groupRows = groups.map((group) => {
    const groupFeatures = publicFeatures.filter((feature) => feature.universeGroup === group.id);
    const counts = groupFeatures.reduce(
      (accumulator, feature) => {
        accumulator[feature.status] += 1;
        return accumulator;
      },
      { 'mainline-native': 0, 'mainline-fallback': 0 },
    );

    return {
      group,
      groupFeatures,
      counts,
    };
  });

  const capabilityMap = new Map();
  for (const feature of publicFeatures) {
    for (const capability of feature.capabilityDependencies ?? []) {
      if (!capabilityMap.has(capability)) {
        capabilityMap.set(capability, []);
      }
      capabilityMap.get(capability).push(feature);
    }
  }

  const capabilityRows = [...capabilityMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([capability, capabilityFeatures]) => ({
      capability,
      capabilityFeatures: capabilityFeatures.slice().sort((left, right) => {
        return left.titleEN.localeCompare(right.titleEN);
      }),
    }));

  return {
    groups,
    publicFeatures,
    sourceInventory,
    coverage,
    summary,
    groupRows,
    capabilityRows,
  };
}
