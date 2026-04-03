export type RuntimePathSource =
  | 'native'
  | 'fallback'
  | 'simulated'
  | 'unavailable-with-reason';
export type CapabilityPathSource = Extract<RuntimePathSource, 'native' | 'fallback'>;

export function formatRuntimeSourceLabel(source: RuntimePathSource): string {
  switch (source) {
    case 'native':
      return 'Native path';
    case 'fallback':
      return 'Fallback path';
    case 'simulated':
      return 'Simulated path';
    case 'unavailable-with-reason':
      return 'Unavailable with reason';
    default:
      return source;
  }
}
