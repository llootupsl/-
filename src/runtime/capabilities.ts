import type { CapabilityPathSource } from './runtimeVocabulary';

export type CapabilityId =
  | 'wasm'
  | 'webgl'
  | 'webgpu'
  | 'webrtc'
  | 'barcodeDetector'
  | 'serviceWorker'
  | 'periodicSync'
  | 'webAuthn'
  | 'speechRecognition'
  | 'speechSynthesis'
  | 'gamepad'
  | 'haptics'
  | 'webBluetooth'
  | 'opfs'
  | 'sharedWorker'
  | 'webTorrent';

export type CapabilityGrade = 'native' | 'fallback' | 'unsupported';

export type RuntimeModeTier = 'apex' | 'extreme' | 'balanced' | 'eco';

export interface CapabilityStatus {
  id: CapabilityId;
  label: string;
  supported: boolean;
  grade: CapabilityGrade;
  source: CapabilityPathSource;
  note: string;
  impact: string;
}

export interface DeviceProfile {
  type: 'desktop' | 'mobile' | 'tablet';
  cpuCores: number;
  memoryGB: number;
  gpuVendor: string;
  hasWebGPU: boolean;
  hasWebGL: boolean;
  score: number;
  level: 'high' | 'medium' | 'low';
  online: boolean;
  prefersReducedMotion: boolean;
  recommendedMode: RuntimeModeTier;
}

export interface CapabilityProfile {
  generatedAt: number;
  device: DeviceProfile;
  capabilities: Record<CapabilityId, CapabilityStatus>;
}

function getNavigator(): Navigator | null {
  return typeof navigator === 'undefined' ? null : navigator;
}

function getWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

function hasGlobalConstructor(name: string): boolean {
  return typeof globalThis !== 'undefined' && name in globalThis;
}

function detectDeviceType(userAgent: string): DeviceProfile['type'] {
  if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  }

  if (/mobile|android|iphone/i.test(userAgent)) {
    return 'mobile';
  }

  return 'desktop';
}

function getGpuVendor(): string {
  if (typeof document === 'undefined') {
    return 'Unknown GPU';
  }

  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
    return 'Generic Test GPU';
  }

  const canvas = document.createElement('canvas');
  let gl: WebGLRenderingContext | null = null;

  try {
    gl =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
  } catch {
    return 'Unknown GPU';
  }

  if (!gl) {
    return 'Unknown GPU';
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) {
    return 'Generic WebGL';
  }

  return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Generic WebGL';
}

export function detectDeviceProfile(): DeviceProfile {
  const nav = getNavigator();
  const win = getWindow();

  const cpuCores = nav?.hardwareConcurrency ?? 4;
  const memoryGB =
    (nav as Navigator & { deviceMemory?: number } | null)?.deviceMemory ??
    Math.max(
      4,
      Math.round(
        (((performance as Performance & { memory?: { jsHeapSizeLimit: number } }).memory
          ?.jsHeapSizeLimit ?? 8_000_000_000) /
          1_000_000_000),
      ),
    );
  const userAgent = nav?.userAgent ?? '';
  const gpuVendor = getGpuVendor();
  const hasWebGPU = Boolean((nav as Navigator & { gpu?: unknown } | null)?.gpu);
  const hasWebGL = gpuVendor !== 'Unknown GPU';
  const deviceType = detectDeviceType(userAgent);

  let score = 0;
  score += Math.min(cpuCores * 8, 40);
  score += Math.min(memoryGB * 4, 24);
  score += hasWebGPU ? 22 : hasWebGL ? 10 : 0;
  score += deviceType === 'desktop' ? 10 : deviceType === 'tablet' ? 6 : 2;
  if (/nvidia|amd|radeon|apple/i.test(gpuVendor.toLowerCase())) {
    score += 12;
  }

  const level: DeviceProfile['level'] =
    score >= 78 ? 'high' : score >= 52 ? 'medium' : 'low';

  const recommendedMode: RuntimeModeTier =
    level === 'high'
      ? hasWebGPU
        ? 'apex'
        : 'extreme'
      : level === 'medium'
        ? 'balanced'
        : 'eco';

  return {
    type: deviceType,
    cpuCores,
    memoryGB,
    gpuVendor,
    hasWebGPU,
    hasWebGL,
    score,
    level,
    online: nav?.onLine ?? true,
    prefersReducedMotion: Boolean(
      win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    ),
    recommendedMode,
  };
}

function capability(
  id: CapabilityId,
  label: string,
  supported: boolean,
  nativeNote: string,
  fallbackNote: string,
  impact: string,
): CapabilityStatus {
  return {
    id,
    label,
    supported,
    grade: supported ? 'native' : 'fallback',
    source: supported ? 'native' : 'fallback',
    note: supported ? nativeNote : fallbackNote,
    impact,
  };
}

export function buildCapabilityProfile(): CapabilityProfile {
  const nav = getNavigator();
  const win = getWindow();
  const device = detectDeviceProfile();

  const speechRecognitionSupported = Boolean(
    (win as Window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    } | null)?.SpeechRecognition ||
      (win as Window & {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      } | null)?.webkitSpeechRecognition,
  );

  const serviceWorkerSupported = Boolean(nav && 'serviceWorker' in nav);
  const periodicSyncSupported = Boolean(
    serviceWorkerSupported &&
      (win as Window & { PeriodicSyncManager?: unknown } | null)?.PeriodicSyncManager,
  );

  const profile: CapabilityProfile = {
    generatedAt: Date.now(),
    device,
    capabilities: {
      wasm: capability(
        'wasm',
        'WASM Compute',
        typeof WebAssembly !== 'undefined',
        'High-intensity compute modules can run in-browser.',
        'Simulation falls back to JavaScript execution.',
        'Quantum, pathfinding and SNN acceleration.',
      ),
      webgl: capability(
        'webgl',
        'WebGL Renderer',
        device.hasWebGL,
        'Legacy 3D rendering path is available.',
        'Canvas and CSS layers will carry the visual shell.',
        'Graphics fallback floor for older browsers.',
      ),
      webgpu: capability(
        'webgpu',
        'WebGPU Renderer',
        device.hasWebGPU,
        'Full renderer, GI and compute shaders can be scheduled.',
        'Renderer degrades to lighter visual layers and CPU simulation.',
        'Flagship graphics, compute and GI showcase.',
      ),
      webrtc: capability(
        'webrtc',
        'WebRTC Mesh',
        hasGlobalConstructor('RTCPeerConnection'),
        'Peer transport can run with real device handoff.',
        'Connection panels remain available with guided fallback copy.',
        'Space-warp syncing and local multiplayer handoff.',
      ),
      barcodeDetector: capability(
        'barcodeDetector',
        'Barcode Detector',
        Boolean((win as Window & { BarcodeDetector?: unknown } | null)?.BarcodeDetector),
        'Camera QR scanning can be fully native.',
        'Manual payload handoff remains available.',
        'Zero-friction QR pairing for space-warp.',
      ),
      serviceWorker: capability(
        'serviceWorker',
        'Service Worker',
        serviceWorkerSupported,
        'Offline shell and cache orchestration are available.',
        'Runtime stays online-only with direct fetches.',
        'Offline resilience and background infrastructure.',
      ),
      periodicSync: capability(
        'periodicSync',
        'Periodic Background Sync',
        periodicSyncSupported,
        'Ghost-time settlement can register periodic sync.',
        'Background settlement falls back to manual wake-up runs.',
        'Background civilization settlement continuity.',
      ),
      webAuthn: capability(
        'webAuthn',
        'Passkeys / WebAuthn',
        hasGlobalConstructor('PublicKeyCredential'),
        'Hardware-backed identity and DAO verification are available.',
        'Identity proof falls back to local trust mode.',
        'Biometric identity and governance verification.',
      ),
      speechRecognition: capability(
        'speechRecognition',
        'Speech Recognition',
        speechRecognitionSupported,
        'Voice command parsing can run directly in-browser.',
        'Voice UI degrades to keyboard-first interactions.',
        'Multimodal command surface.',
      ),
      speechSynthesis: capability(
        'speechSynthesis',
        'Speech Synthesis',
        Boolean(win?.speechSynthesis),
        'Narration and vocal feedback can be synthesized.',
        'Voice output degrades to text-only guidance.',
        'Immersive voice feedback.',
      ),
      gamepad: capability(
        'gamepad',
        'Gamepad Input',
        Boolean(nav && 'getGamepads' in nav),
        'Controllers can drive the world shell directly.',
        'Input degrades to keyboard and touch controls.',
        'Controller-grade input choreography.',
      ),
      haptics: capability(
        'haptics',
        'Haptics',
        Boolean(nav && 'vibrate' in nav),
        'Tactile feedback can accompany key interactions.',
        'No vibration; visuals and audio carry the signal.',
        'Physical feedback during critical actions.',
      ),
      webBluetooth: capability(
        'webBluetooth',
        'Web Bluetooth',
        Boolean((nav as Navigator & { bluetooth?: unknown } | null)?.bluetooth),
        'Nearby-device experiments can use the real Bluetooth stack.',
        'Nearby interactions remain UI-visible with clear fallback messaging.',
        'Proximity and device adjacency showcase.',
      ),
      opfs: capability(
        'opfs',
        'OPFS / Local Persistence',
        Boolean(nav?.storage?.getDirectory),
        'Local-first persistence can use origin-private file storage.',
        'Persistence degrades to lighter storage adapters.',
        'High-integrity local-first save architecture.',
      ),
      sharedWorker: capability(
        'sharedWorker',
        'Shared Worker',
        typeof SharedWorker !== 'undefined',
        'Cross-tab orchestration can use shared workers.',
        'Workers stay isolated per-tab.',
        'Multi-surface coordination.',
      ),
      webTorrent: capability(
        'webTorrent',
        'WebTorrent Federation',
        hasGlobalConstructor('WebSocket') && hasGlobalConstructor('RTCPeerConnection'),
        'Browser can participate in federated model distribution.',
        'Distribution falls back to guided fetch mode.',
        'P2P artifact and model dissemination.',
      ),
    },
  };

  return profile;
}

export function getSupportedCapabilities(profile: CapabilityProfile): CapabilityStatus[] {
  return Object.values(profile.capabilities).filter((item) => item.supported);
}

export function getFallbackCapabilities(profile: CapabilityProfile): CapabilityStatus[] {
  return Object.values(profile.capabilities).filter((item) => !item.supported);
}
