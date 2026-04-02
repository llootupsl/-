/**
 * =============================================================================
 * 实验特性开关（默认关闭）
 * =============================================================================
 */

export type LabFeatureFlag =
  | 'extremeStress_4_8'
  | 'p2pModelFederation_4_10'
  | 'webgpuRealtimeGI_3_30';

export type LabFeatureFlags = Record<LabFeatureFlag, boolean>;

const LAB_FLAGS_STORAGE_KEY = 'omnis_lab_feature_flags';

export const DEFAULT_LAB_FEATURE_FLAGS: LabFeatureFlags = {
  extremeStress_4_8: false,
  p2pModelFederation_4_10: false,
  webgpuRealtimeGI_3_30: false,
};

function readLabFlagsFromStorage(): Partial<LabFeatureFlags> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(LAB_FLAGS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Partial<LabFeatureFlags>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function getLabFeatureFlags(): LabFeatureFlags {
  return {
    ...DEFAULT_LAB_FEATURE_FLAGS,
    ...readLabFlagsFromStorage(),
  };
}

export function isLabFeatureEnabled(flag: LabFeatureFlag): boolean {
  return getLabFeatureFlags()[flag];
}

export function saveLabFeatureFlags(flags: Partial<LabFeatureFlags>): void {
  if (typeof window === 'undefined') {
    return;
  }

  const next = {
    ...getLabFeatureFlags(),
    ...flags,
  };

  try {
    window.localStorage.setItem(LAB_FLAGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}
