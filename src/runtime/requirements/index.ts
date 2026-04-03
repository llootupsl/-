import type { CapabilityId, CapabilityProfile } from '@/runtime/capabilities';
import featureCatalogData from './featureCatalog.json';
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
  | 'mainline-fallback'
  | 'mainline-simulated-with-explicit-label';

export type RequirementRuntimePath = 'native' | 'fallback' | 'simulated';

export type RequirementPanelAction =
  | 'citizens'
  | 'dao'
  | 'divine'
  | 'chat'
  | 'observatory'
  | 'none';

export interface RequirementSourceClause {
  docId: 'v12' | 'supplement' | 'v13';
  docTitle: string;
  clause: string;
  title: string;
}

export interface RequirementUniverseGroup {
  id: RequirementUniverseGroupId;
  title: string;
  titleEN: string;
  summary: string;
  summaryEN: string;
  accentToken: string;
}

export interface RequirementFeatureDescriptor {
  id: string;
  title: string;
  titleEN: string;
  universeGroup: RequirementUniverseGroupId;
  status: RequirementExperienceStatus;
  runtimePath: RequirementRuntimePath;
  sourceDoc: RequirementSourceClause['docId'];
  sourceClause: string;
  coveredClauses: string[];
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

export const requirementFeatureCatalog =
  featureCatalogData as RequirementFeatureDescriptor[];

const sourceInventoryByClause = new Map(
  requirementSourceInventory.map((item) => [item.clause, item]),
);

export function getRequirementUniverseGroup(
  groupId: RequirementUniverseGroupId,
): RequirementUniverseGroup {
  return (
    requirementUniverseGroups.find((group) => group.id === groupId)
    ?? requirementUniverseGroups[0]
  );
}

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
  if (feature.runtimePath === 'simulated') {
    return 'simulated';
  }

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
  return feature.coveredClauses
    .map((clause) => sourceInventoryByClause.get(clause))
    .filter((item): item is RequirementSourceClause => Boolean(item));
}

export function getRequirementCoverageSnapshot(): RequirementCoverageSnapshot {
  const coveredClauseSet = new Set<string>();
  for (const feature of requirementFeatureCatalog) {
    feature.coveredClauses.forEach((clause) => coveredClauseSet.add(clause));
  }

  const uncoveredClauses = requirementSourceInventory.filter(
    (item) => !coveredClauseSet.has(item.clause),
  );

  return {
    totalClauses: requirementSourceInventory.length,
    coveredClauses: coveredClauseSet.size,
    uncoveredClauses,
  };
}

export function formatRequirementStatus(status: RequirementExperienceStatus): string {
  switch (status) {
    case 'mainline-native':
      return 'Mainline native';
    case 'mainline-fallback':
      return 'Mainline fallback';
    case 'mainline-simulated-with-explicit-label':
      return 'Mainline simulated';
    default:
      return status;
  }
}

export function formatRequirementRuntimePath(
  path: RequirementRuntimePath | 'unavailable-with-reason',
): string {
  switch (path) {
    case 'native':
      return 'Native';
    case 'fallback':
      return 'Fallback';
    case 'simulated':
      return 'Simulated';
    case 'unavailable-with-reason':
      return 'Unavailable';
    default:
      return path;
  }
}
