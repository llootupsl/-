import type { CapabilityId, CapabilityProfile } from '@/runtime/capabilities';
import featureCatalogData from './featureCatalog.json';
import featureEntryMetadataData from './featureEntryMetadata.json';
import sourceInventoryData from './sourceInventory.json';
import universeGroupsData from './universeGroups.json';

export type RequirementUniverseGroupId =
  | 'civilization-systems'
  | 'perception-and-input'
  | 'reality-sync'
  | 'space-and-network'
  | 'rendering-and-performance';

export type RequirementExperienceStatus =
  | 'mainline-native'
  | 'mainline-fallback';

export type RequirementRuntimePath = 'native' | 'fallback' | 'unavailable-with-reason';

export type RequirementPanelAction =
  | 'citizens'
  | 'society'
  | 'economy'
  | 'dao'
  | 'governance'
  | 'divine'
  | 'entropy'
  | 'chat'
  | 'multimodal'
  | 'environment'
  | 'genesis'
  | 'identity'
  | 'persistence'
  | 'network'
  | 'ecosystem'
  | 'benchmark'
  | 'rendering'
  | 'observatory'
  | 'none';

export interface RequirementSourceClause {
  docId: 'v12' | 'supplement' | 'v13';
  docTitle: string;
  clause: string;
  title: string;
}

export interface RequirementClauseRef {
  docId: RequirementSourceClause['docId'];
  clause: string;
}

export interface RequirementUniverseGroup {
  id: RequirementUniverseGroupId;
  title: string;
  titleEN: string;
  summary: string;
  summaryEN: string;
  accentToken: string;
}

export interface RequirementEntryMetadata {
  entrySurfaceCN: string;
  entrySurfaceEN: string;
  entryActionCN: string;
  entryActionEN: string;
  implementationTier: 'native' | 'fallback';
  verificationId: string;
}

interface RequirementFeatureCatalogRecord {
  id: string;
  title: string;
  titleEN: string;
  universeGroup: RequirementUniverseGroupId;
  status: RequirementExperienceStatus;
  runtimePath: RequirementRuntimePath;
  sourceDoc: RequirementSourceClause['docId'];
  sourceClause: string;
  coveredClauses: string[];
  coveredClauseRefs?: RequirementClauseRef[];
  experienceEntry: string;
  experienceEntryEN: string;
  runtimeSubsystem: string;
  capabilityDependencies: CapabilityId[];
  dataSource: string;
  fallbackMode: string;
  validationScenario: string;
  readmeSummary: string;
  readmeSummaryEN: string;
  modulePaths: string[];
  panelAction: RequirementPanelAction;
}

interface RequirementEntryMetadataRecord extends RequirementEntryMetadata {
  id: string;
}

export interface RequirementFeatureDescriptor
  extends Omit<RequirementFeatureCatalogRecord, 'coveredClauseRefs'>,
    RequirementEntryMetadata {
  status: RequirementExperienceStatus;
  runtimePath: RequirementRuntimePath;
  coveredClauseRefs: RequirementClauseRef[];
}

export interface RequirementUniverseGroupWithFeatures extends RequirementUniverseGroup {
  features: RequirementFeatureDescriptor[];
}

export interface RequirementCoverageSnapshot {
  totalClauses: number;
  coveredClauses: number;
  uncoveredClauses: RequirementSourceClause[];
}

export const requirementUniverseGroups =
  universeGroupsData as RequirementUniverseGroup[];

export const requirementSourceInventory =
  sourceInventoryData as RequirementSourceClause[];

const requirementFeatureCatalogSource =
  featureCatalogData as RequirementFeatureCatalogRecord[];

const requirementEntryMetadata =
  featureEntryMetadataData as RequirementEntryMetadataRecord[];

const requirementSourceInventoryByDocClause = new Map(
  requirementSourceInventory.map((item) => [getRequirementClauseRefKey(item), item]),
);

const requirementEntryMetadataById = new Map(
  requirementEntryMetadata.map((item) => [item.id, item]),
);

function normalizeRequirementStatus(
  status: RequirementFeatureCatalogRecord['status'],
): RequirementExperienceStatus {
  return status === 'mainline-native' ? 'mainline-native' : 'mainline-fallback';
}

function normalizeRequirementRuntimePath(
  runtimePath: RequirementFeatureCatalogRecord['runtimePath'],
): RequirementRuntimePath {
  return runtimePath === 'native' ? 'native' : 'fallback';
}

function createFallbackEntryMetadata(
  feature: RequirementFeatureCatalogRecord,
): RequirementEntryMetadata {
  return {
    entrySurfaceCN: feature.experienceEntry,
    entrySurfaceEN: feature.experienceEntryEN,
    entryActionCN: `进入 ${feature.title}`,
    entryActionEN: `Enter ${feature.titleEN}`,
    implementationTier: normalizeRequirementStatus(feature.status) === 'mainline-native'
      ? 'native'
      : 'fallback',
    verificationId: `verify-${feature.id}`,
  };
}

function resolveEntryMetadata(
  feature: RequirementFeatureCatalogRecord,
): RequirementEntryMetadata {
  return requirementEntryMetadataById.get(feature.id) ?? createFallbackEntryMetadata(feature);
}

export function getRequirementClauseRefKey(
  clauseRef: RequirementClauseRef | RequirementSourceClause,
): string {
  return `${clauseRef.docId}:${clauseRef.clause}`;
}

function resolveFeatureClauseRefs(
  feature: RequirementFeatureCatalogRecord,
): RequirementClauseRef[] {
  if (Array.isArray(feature.coveredClauseRefs) && feature.coveredClauseRefs.length > 0) {
    return feature.coveredClauseRefs;
  }

  return feature.coveredClauses.map((clause) => ({
    docId: feature.sourceDoc,
    clause,
  }));
}

export function getRequirementUniverseGroup(
  groupId: RequirementUniverseGroupId,
): RequirementUniverseGroup {
  return (
    requirementUniverseGroups.find((group) => group.id === groupId)
    ?? requirementUniverseGroups[0]
  );
}

export const requirementFeatureCatalog: RequirementFeatureDescriptor[] =
  requirementFeatureCatalogSource.map((feature) => {
    const metadata = resolveEntryMetadata(feature);
    const normalizedStatus = normalizeRequirementStatus(feature.status);

    return {
      ...feature,
      ...metadata,
      status: normalizedStatus,
      runtimePath: normalizeRequirementRuntimePath(feature.runtimePath),
      coveredClauseRefs: resolveFeatureClauseRefs(feature),
      implementationTier: metadata.implementationTier,
    };
  });

export function getRequirementFeaturesByGroup(
  groupId: RequirementUniverseGroupId,
): RequirementFeatureDescriptor[] {
  return requirementFeatureCatalog.filter((feature) => feature.universeGroup === groupId);
}

export function getRequirementUniverseGroupsWithFeatures(): RequirementUniverseGroupWithFeatures[] {
  return requirementUniverseGroups.map((group) => ({
    ...group,
    features: getRequirementFeaturesByGroup(group.id),
  }));
}

export function getFeatureUnsupportedDependencies(
  feature: RequirementFeatureDescriptor,
  capabilityProfile: CapabilityProfile | null | undefined,
): CapabilityId[] {
  if (!capabilityProfile) {
    return [];
  }

  return feature.capabilityDependencies.filter(
    (capabilityId) => !capabilityProfile.capabilities[capabilityId]?.supported,
  );
}

export function resolveFeatureRuntimePath(
  feature: RequirementFeatureDescriptor,
  capabilityProfile: CapabilityProfile | null | undefined,
): RequirementRuntimePath | 'unavailable-with-reason' {
  if (!capabilityProfile) {
    return feature.runtimePath;
  }

  const unsupportedDependencies = getFeatureUnsupportedDependencies(feature, capabilityProfile);

  if (unsupportedDependencies.length === 0) {
    return feature.runtimePath;
  }

  return feature.runtimePath === 'native' ? 'fallback' : 'unavailable-with-reason';
}

export function getFeatureSourceClauses(
  feature: RequirementFeatureDescriptor,
): RequirementSourceClause[] {
  return feature.coveredClauseRefs
    .map((clauseRef) => requirementSourceInventoryByDocClause.get(getRequirementClauseRefKey(clauseRef)))
    .filter((item): item is RequirementSourceClause => Boolean(item));
}

export function getRequirementCoverageSnapshot(): RequirementCoverageSnapshot {
  const coveredClauseSet = new Set<string>();

  for (const feature of requirementFeatureCatalog) {
    feature.coveredClauseRefs.forEach((clauseRef) => {
      coveredClauseSet.add(getRequirementClauseRefKey(clauseRef));
    });
  }

  const uncoveredClauses = requirementSourceInventory.filter(
    (item) => !coveredClauseSet.has(getRequirementClauseRefKey(item)),
  );

  return {
    totalClauses: requirementSourceInventory.length,
    coveredClauses: requirementSourceInventory.length - uncoveredClauses.length,
    uncoveredClauses,
  };
}

export function formatRequirementStatus(status: RequirementExperienceStatus): string {
  switch (status) {
    case 'mainline-native':
      return '主线原生';
    case 'mainline-fallback':
      return '主线降级';
    default:
      return status;
  }
}

export function formatRequirementRuntimePath(
  path: RequirementRuntimePath | 'unavailable-with-reason',
): string {
  switch (path) {
    case 'native':
      return '原生路径';
    case 'fallback':
      return '降级路径';
    case 'unavailable-with-reason':
      return '不可用（有原因）';
    default:
      return path;
  }
}
