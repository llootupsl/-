export type RuntimePathSource =
  | 'native'
  | 'fallback'
  | 'simulated'
  | 'unavailable-with-reason';
export type CapabilityPathSource = Extract<RuntimePathSource, 'native' | 'fallback'>;

export function formatRuntimeSourceLabel(source: RuntimePathSource): string {
  switch (source) {
    case 'native':
      return '原生路径';
    case 'fallback':
      return '降级路径';
    case 'simulated':
      return '显式模拟';
    case 'unavailable-with-reason':
      return '不可用（有原因）';
    default:
      return source;
  }
}
