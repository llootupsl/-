import {
  getFeatureSourceClauses,
  requirementFeatureCatalog,
  requirementUniverseGroups,
  type RequirementEntryMetadata,
  type RequirementExperienceStatus,
  type RequirementPanelAction,
} from './index';

export type RequirementFeatureStatus = RequirementExperienceStatus;

export type RequirementUniverseSection =
  | 'civilization'
  | 'senses'
  | 'reality'
  | 'connection'
  | 'rendering';

export interface RequirementFeatureDescriptor {
  id: string;
  titleCN: string;
  titleEN: string;
  sectionId: RequirementUniverseSection;
  sectionLabelCN: string;
  sectionLabelEN: string;
  status: RequirementFeatureStatus;
  sourceDoc: string[];
  sourceClauses: string[];
  sourceClauseRefs: string[];
  experienceEntry: string;
  experienceEntryEN: string;
  runtimeSubsystem: string;
  capabilityDependencies: string[];
  readmeSummary: string;
  readmeSummaryEN: string;
  panelAction: RequirementPanelAction;
  entrySurfaceCN: string;
  entrySurfaceEN: string;
  entryActionCN: string;
  entryActionEN: string;
  implementationTier: RequirementEntryMetadata['implementationTier'];
  verificationId: string;
}

export interface RequirementUniverseSectionDescriptor {
  id: RequirementUniverseSection;
  labelCN: string;
  labelEN: string;
  blurb: string;
}

const SECTION_ID_MAP = {
  'civilization-systems': 'civilization',
  'perception-and-input': 'senses',
  'reality-sync': 'reality',
  'space-and-network': 'connection',
  'rendering-and-performance': 'rendering',
} as const satisfies Record<string, RequirementUniverseSection>;

export const REQUIREMENT_UNIVERSE_SECTIONS: RequirementUniverseSectionDescriptor[] =
  requirementUniverseGroups.map((group) => ({
    id: SECTION_ID_MAP[group.id],
    labelCN: group.title,
    labelEN: group.titleEN,
    blurb: group.summaryEN,
  }));

export const requirementFeatureRegistry: RequirementFeatureDescriptor[] =
  requirementFeatureCatalog.map((feature) => {
    const group = requirementUniverseGroups.find(
      (candidate) => candidate.id === feature.universeGroup,
    ) ?? requirementUniverseGroups[0];
    const sourceClauses = getFeatureSourceClauses(feature);

    return {
      id: feature.id,
      titleCN: feature.title,
      titleEN: feature.titleEN,
      sectionId: SECTION_ID_MAP[feature.universeGroup],
      sectionLabelCN: group.title,
      sectionLabelEN: group.titleEN,
      status: feature.status,
      sourceDoc: [...new Set(sourceClauses.map((clause) => clause.docId))],
      sourceClauses: sourceClauses.map((clause) => clause.clause),
      sourceClauseRefs: sourceClauses.map((clause) => `${clause.docId}:${clause.clause}`),
      experienceEntry: feature.experienceEntry,
      experienceEntryEN: feature.experienceEntryEN,
      runtimeSubsystem: feature.runtimeSubsystem,
      capabilityDependencies: feature.capabilityDependencies,
      readmeSummary: feature.readmeSummary,
      readmeSummaryEN: feature.readmeSummaryEN,
      panelAction: feature.panelAction,
      entrySurfaceCN: feature.entrySurfaceCN,
      entrySurfaceEN: feature.entrySurfaceEN,
      entryActionCN: feature.entryActionCN,
      entryActionEN: feature.entryActionEN,
      implementationTier: feature.implementationTier,
      verificationId: feature.verificationId,
    };
  });

export function getRequirementStatusLabel(status: RequirementFeatureStatus): string {
  switch (status) {
    case 'mainline-native':
      return '原生';
    case 'mainline-fallback':
      return '降级';
    default:
      return status;
  }
}

export function getRequirementStatusDescription(status: RequirementFeatureStatus): string {
  switch (status) {
    case 'mainline-native':
      return '当前正在使用真实浏览器能力或本地运行路径。';
    case 'mainline-fallback':
      return '主线体验正通过一等降级路径持续可用。';
    default:
      return status;
  }
}

export function getRequirementStatusTone(
  status: RequirementFeatureStatus,
): 'native' | 'fallback' {
  if (status === 'mainline-native') {
    return 'native';
  }

  return 'fallback';
}

export function getRequirementFeaturesBySection(
  sectionId: RequirementUniverseSection,
): RequirementFeatureDescriptor[] {
  return requirementFeatureRegistry.filter((feature) => feature.sectionId === sectionId);
}

export function findRequirementFeatureByClause(
  clause: string,
): RequirementFeatureDescriptor | undefined {
  return requirementFeatureRegistry.find((feature) => feature.sourceClauses.includes(clause));
}

export function getRequirementUniverseSummary(): Record<string, number> {
  return requirementFeatureRegistry.reduce<Record<string, number>>(
    (summary, feature) => {
      const key = getRequirementStatusLabel(feature.status);
      summary[key] = (summary[key] ?? 0) + 1;
      return summary;
    },
    { 原生: 0, 降级: 0 },
  );
}
