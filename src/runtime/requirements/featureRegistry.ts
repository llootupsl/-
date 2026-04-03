import {
  requirementFeatureCatalog,
  requirementUniverseGroups,
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
  experienceEntry: string;
  experienceEntryEN: string;
  runtimeSubsystem: string;
  capabilityDependencies: string[];
  readmeSummary: string;
  readmeSummaryEN: string;
  panelAction: RequirementPanelAction;
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

    return {
      id: feature.id,
      titleCN: feature.title,
      titleEN: feature.titleEN,
      sectionId: SECTION_ID_MAP[feature.universeGroup],
      sectionLabelCN: group.title,
      sectionLabelEN: group.titleEN,
      status: feature.status,
      sourceDoc: [feature.sourceDoc],
      sourceClauses: feature.coveredClauses,
      experienceEntry: feature.experienceEntry,
      experienceEntryEN: feature.experienceEntryEN,
      runtimeSubsystem: feature.runtimeSubsystem,
      capabilityDependencies: feature.capabilityDependencies,
      readmeSummary: feature.readmeSummary,
      readmeSummaryEN: feature.readmeSummaryEN,
      panelAction: feature.panelAction,
    };
  });

export function getRequirementStatusLabel(status: RequirementFeatureStatus): string {
  switch (status) {
    case 'mainline-native':
      return 'native';
    case 'mainline-fallback':
      return 'fallback';
    case 'mainline-simulated-with-explicit-label':
      return 'simulated';
    default:
      return status;
  }
}

export function getRequirementStatusDescription(status: RequirementFeatureStatus): string {
  switch (status) {
    case 'mainline-native':
      return 'The real browser or local runtime path is active.';
    case 'mainline-fallback':
      return 'The mainline experience stays available through a first-class fallback route.';
    case 'mainline-simulated-with-explicit-label':
      return 'This release exposes the cluster honestly as a clearly labeled simulation.';
    default:
      return status;
  }
}

export function getRequirementStatusTone(
  status: RequirementFeatureStatus,
): 'native' | 'fallback' | 'simulated' {
  if (status === 'mainline-native') {
    return 'native';
  }

  if (status === 'mainline-fallback') {
    return 'fallback';
  }

  return 'simulated';
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
    { native: 0, fallback: 0, simulated: 0 },
  );
}
