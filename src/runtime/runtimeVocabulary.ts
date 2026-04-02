export type RuntimePathSource = 'native' | 'fallback' | 'simulated' | 'deferred';
export type CapabilityPathSource = Extract<RuntimePathSource, 'native' | 'fallback'>;

export function formatRuntimeSourceLabel(source: RuntimePathSource): string {
  switch (source) {
    case 'native':
      return 'Native path';
    case 'fallback':
      return 'Fallback path';
    case 'simulated':
      return 'Simulated path';
    case 'deferred':
      return 'Deferred path';
    default:
      return source;
  }
}
