import { EventEmitter } from 'eventemitter3';
import { logger } from '@/core/utils/Logger';
import { buildCapabilityProfile, type CapabilityId, type CapabilityProfile } from '@/runtime/capabilities';
import { patchSubsystem, pushRuntimeTrace, upsertSubsystem } from '@/runtime/runtimeStore';
import type { GazePoint } from '@/input/EyeTracker';

export type VoteOption = 'yes' | 'no' | 'abstain';

export interface IntegratorEvents {
  ready: () => void;
  error: (system: string, error: Error) => void;
  dataFlow: (from: string, to: string, data: unknown) => void;
  userInteraction: (type: string, data: unknown) => void;
}

export interface IntegratorConfig {
  enableEyeTracking: boolean;
  enableGI: boolean;
  enableGaussianSplatting: boolean;
  enableP2P: boolean;
  enableVoiceControl: boolean;
  enableGamepad: boolean;
  enableBiometric: boolean;
}

interface SystemState {
  eyeTracker: {
    active: boolean;
    calibrated: boolean;
    supported: boolean;
    gazePoint: GazePoint | null;
    detail: string;
  };
  gi: { active: boolean; supported: boolean; nodeCount: number; probeCount: number; detail: string };
  gaussian: { active: boolean; supported: boolean; pointCount: number; detail: string };
  p2p: { active: boolean; supported: boolean; peerCount: number; detail: string };
  dao: { active: boolean; activeProposals: number; totalVotes: number; detail: string };
  techTree: { ready: boolean; currentResearch: string | null; progress: number; completedCount: number; detail: string };
  voice: { listening: boolean; supported: boolean; lastCommand: string | null; detail: string };
  gamepad: { connected: number; activeButtons: number[]; supported: boolean; detail: string };
  biometric: { available: boolean; detail: string };
}

type SubsystemId = 'gi' | 'gaussian' | 'eyeTracker' | 'p2p' | 'governance' | 'voice' | 'gamepad' | 'biometric';

interface SubsystemDescriptor {
  id: SubsystemId;
  label: string;
  capabilityId?: CapabilityId;
  enabled: (config: IntegratorConfig) => boolean;
  load: (device?: GPUDevice) => Promise<void>;
}

type GiHandle = {
  init: (device: GPUDevice) => Promise<boolean>;
  getStats: () => { nodeCount: number; voxelCount: number };
  computeGI?: (
    encoder: GPUCommandEncoder,
    cameraPosition: [number, number, number],
    lightDirection: [number, number, number],
    outputTexture: GPUTexture,
  ) => void;
  destroy?: () => void;
};

type GaussianHandle = {
  init: (device: GPUDevice) => Promise<boolean>;
  getStats: () => { pointCount: number };
  render?: (
    encoder: GPUCommandEncoder,
    viewProjection: Float32Array,
    cameraPosition: [number, number, number],
    outputTexture: GPUTexture,
  ) => void;
  loadPoints?: (points: Array<{
    position: [number, number, number];
    scale: [number, number, number];
    rotation: [number, number, number, number];
    color: [number, number, number];
    opacity: number;
  }>) => void;
  destroy?: () => void;
};

type EyeTrackerHandle = {
  init: () => Promise<boolean>;
  start: () => Promise<void>;
  startCalibration: () => Promise<boolean>;
  on: (event: 'gaze' | 'calibration', callback: (...args: unknown[]) => void) => void;
  dispose: () => void;
};

type P2PHandle = {
  webrtcManager: {
    getPeers: () => Array<{ id: string }>;
    on: (event: 'message' | 'peerConnected', callback: (...args: unknown[]) => void) => void;
    destroy?: () => void;
  };
  syncProtocol: { reset?: () => void; destroy?: () => void };
  torrentClient: {
    init: () => Promise<boolean>;
    on: (event: 'progress' | 'done' | 'peer', callback: (...args: unknown[]) => void) => void;
    getTorrents: () => Array<{ infoHash: string; name: string; length: number }>;
    getTorrentState: (infoHash: string) => {
      progress: number;
      downloadSpeed: number;
      uploadSpeed: number;
      peers: number;
      timeRemaining: number;
    } | null;
    download: (magnetUri: string) => Promise<void>;
    seed: (name: string, data: ArrayBuffer) => Promise<{ infoHash: string } | null>;
    destroy?: () => void;
  };
};

type GovernanceHandle = {
  daoSystem: {
    proposeBill: (...args: unknown[]) => unknown;
    vote: (...args: unknown[]) => Promise<boolean>;
    getStats: () => {
      active?: number;
      activeBills?: number;
      totalVotes?: number;
      totalProposals?: number;
    };
    setDivineVerificationCallback?: (callback: (voterId: string) => Promise<boolean>) => void;
  };
  techTree: {
    getCurrentResearch: () => { id?: string; progress?: number } | null;
    getStats: () => { completed?: number; completedNodes?: number };
    startResearch: (techId: string) => boolean;
  };
};

type VoiceHandle = {
  speechRecognition: {
    isSupportedBrowser: () => boolean;
    registerCommands?: (commands: unknown[]) => void;
    start: () => void;
    stop: () => void;
    on: (event: 'start' | 'command' | 'end', callback: (...args: unknown[]) => void) => void;
    destroy?: () => void;
  };
  speechSynthesis: {
    speak: (text: string) => Promise<void>;
    destroy?: () => void;
  };
};

type GamepadHandle = {
  gamepadManager: {
    getGamepads: () => unknown[];
    startPolling?: () => void;
    on: (event: 'connected' | 'buttonDown' | 'buttonUp', callback: (...args: unknown[]) => void) => void;
    destroy?: () => void;
  };
  hapticsManager: {
    pattern: (name: string) => Promise<boolean> | boolean;
    destroy?: () => void;
  };
};

type BiometricHandle = {
  isAvailable: () => Promise<boolean>;
  authenticate: () => Promise<{ verified: boolean }>;
};

const DEFAULT_CONFIG: IntegratorConfig = {
  enableEyeTracking: true,
  enableGI: true,
  enableGaussianSplatting: true,
  enableP2P: true,
  enableVoiceControl: true,
  enableGamepad: true,
  enableBiometric: true,
};

export class SystemIntegrator extends EventEmitter<IntegratorEvents> {
  private config: IntegratorConfig;
  private profile: CapabilityProfile | null = null;
  private device: GPUDevice | null = null;
  public initialized = false;

  private giManager: GiHandle | null = null;
  private gaussianSplatting: GaussianHandle | null = null;
  private eyeTracker: EyeTrackerHandle | null = null;
  private p2p: P2PHandle | null = null;
  private governance: GovernanceHandle | null = null;
  private voice: VoiceHandle | null = null;
  private gamepad: GamepadHandle | null = null;
  private biometric: BiometricHandle | null = null;

  private state: SystemState = {
    eyeTracker: { active: false, calibrated: false, supported: false, gazePoint: null, detail: 'Idle.' },
    gi: { active: false, supported: false, nodeCount: 0, probeCount: 0, detail: 'Idle.' },
    gaussian: { active: false, supported: false, pointCount: 0, detail: 'Idle.' },
    p2p: { active: false, supported: false, peerCount: 0, detail: 'Idle.' },
    dao: { active: false, activeProposals: 0, totalVotes: 0, detail: 'Idle.' },
    techTree: { ready: false, currentResearch: null, progress: 0, completedCount: 0, detail: 'Idle.' },
    voice: { listening: false, supported: false, lastCommand: null, detail: 'Idle.' },
    gamepad: { connected: 0, activeButtons: [], supported: false, detail: 'Idle.' },
    biometric: { available: false, detail: 'Idle.' },
  };

  private readonly descriptors: SubsystemDescriptor[] = [
    { id: 'gi', label: 'Global Illumination', capabilityId: 'webgpu', enabled: (config) => config.enableGI, load: (device) => this.loadGlobalIllumination(device) },
    { id: 'gaussian', label: 'Gaussian Memory Field', capabilityId: 'webgpu', enabled: (config) => config.enableGaussianSplatting, load: (device) => this.loadGaussianSplatting(device) },
    { id: 'eyeTracker', label: 'Eye Tracking', enabled: (config) => config.enableEyeTracking, load: () => this.loadEyeTracking() },
    { id: 'p2p', label: 'P2P Federation', capabilityId: 'webrtc', enabled: (config) => config.enableP2P, load: () => this.loadP2P() },
    { id: 'governance', label: 'Governance Core', enabled: () => true, load: () => this.loadGovernance() },
    { id: 'voice', label: 'Voice Layer', capabilityId: 'speechRecognition', enabled: (config) => config.enableVoiceControl, load: () => this.loadVoice() },
    { id: 'gamepad', label: 'Gamepad Layer', capabilityId: 'gamepad', enabled: (config) => config.enableGamepad, load: () => this.loadGamepad() },
    { id: 'biometric', label: 'Biometric Identity', capabilityId: 'webAuthn', enabled: (config) => config.enableBiometric, load: () => this.loadBiometric() },
  ];

  constructor(config: Partial<IntegratorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public async init(device?: GPUDevice): Promise<boolean> {
    this.profile = buildCapabilityProfile();
    this.device = device ?? null;

    try {
      for (const descriptor of this.descriptors) {
        if (!descriptor.enabled(this.config)) {
          this.markUnavailable(descriptor, 'Disabled by runtime configuration.');
          continue;
        }

        this.markLoading(descriptor);

        try {
          await descriptor.load(device);
        } catch (error) {
          const runtimeError = error instanceof Error ? error : new Error(String(error));
          this.markDegraded(descriptor, runtimeError.message);
          this.emit('error', descriptor.id, runtimeError);
        }
      }

      this.initialized = true;
      this.emit('ready');
      pushRuntimeTrace({
        stage: 'integration',
        severity: 'success',
        title: 'Immersive integrations orchestrated',
        detail: `${this.getStats().activeSystems.length} subsystem(s) are active.`,
      });
      return true;
    } catch (error) {
      const runtimeError = error instanceof Error ? error : new Error(String(error));
      logger.error('SystemIntegrator', 'Failed to initialize', runtimeError);
      this.emit('error', 'init', runtimeError);
      return false;
    }
  }

  private capabilitySupported(capabilityId?: CapabilityId): boolean {
    return capabilityId ? Boolean(this.profile?.capabilities[capabilityId]?.supported) : true;
  }

  private markLoading(descriptor: SubsystemDescriptor): void {
    upsertSubsystem({
      id: descriptor.id,
      label: descriptor.label,
      group: descriptor.id === 'governance' ? 'simulation' : 'integration',
      state: 'loading',
      source: 'native',
      capabilityId: descriptor.capabilityId,
      detail: `Booting ${descriptor.label}...`,
      updatedAt: Date.now(),
    });
  }

  private markReady(descriptor: SubsystemDescriptor, detail: string): void {
    patchSubsystem(descriptor.id, { state: 'ready', source: 'native', detail });
  }

  private markDegraded(descriptor: SubsystemDescriptor, detail: string): void {
    patchSubsystem(descriptor.id, { state: 'degraded', source: 'fallback', detail });
  }

  private markUnavailable(descriptor: SubsystemDescriptor, detail: string): void {
    upsertSubsystem({
      id: descriptor.id,
      label: descriptor.label,
      group: descriptor.id === 'governance' ? 'simulation' : 'integration',
      state: 'degraded',
      source: 'unavailable-with-reason',
      capabilityId: descriptor.capabilityId,
      detail,
      updatedAt: Date.now(),
    });
  }

  private async loadGlobalIllumination(device?: GPUDevice): Promise<void> {
    const descriptor = this.descriptors[0];
    if (!this.capabilitySupported('webgpu') || !device) {
      this.state.gi.supported = false;
      this.state.gi.detail = 'WebGPU unavailable; GI stays on graceful fallback.';
      this.markDegraded(descriptor, this.state.gi.detail);
      return;
    }

    const module = await import('@/rendering/raytracing/GlobalIlluminationManager');
    this.giManager = new module.GlobalIlluminationManager({
      enabled: true,
      maxBounces: 3,
      probeGridResolution: [16, 16, 16],
      svoMaxDepth: 8,
    });
    const success = await this.giManager.init(device);
    this.state.gi.supported = success;
    this.state.gi.active = success;
    this.state.gi.detail = success ? 'Real-time GI is running.' : 'GI initialization returned false.';
    success ? this.markReady(descriptor, this.state.gi.detail) : this.markDegraded(descriptor, this.state.gi.detail);
  }

  private async loadGaussianSplatting(device?: GPUDevice): Promise<void> {
    const descriptor = this.descriptors[1];
    if (!this.capabilitySupported('webgpu') || !device) {
      this.state.gaussian.supported = false;
      this.state.gaussian.detail = 'WebGPU unavailable; memory field falls back to 2D surfaces.';
      this.markDegraded(descriptor, this.state.gaussian.detail);
      return;
    }

    const module = await import('@/rendering/gaussian/GaussianSplatting');
    this.gaussianSplatting = new module.GaussianSplatting({ maxPoints: 50_000, enableSorting: true });
    const success = await this.gaussianSplatting.init(device);
    this.state.gaussian.supported = success;
    this.state.gaussian.active = success;
    this.state.gaussian.detail = success ? 'Gaussian memory field is active.' : 'Gaussian initialization failed.';
    success ? this.markReady(descriptor, this.state.gaussian.detail) : this.markDegraded(descriptor, this.state.gaussian.detail);
  }

  private async loadEyeTracking(): Promise<void> {
    const descriptor = this.descriptors[2];
    const module = await import('@/input/EyeTracker');
    this.eyeTracker = new module.EyeTracker({ confidenceThreshold: 0.5, calibrationPoints: 9, smoothingFactor: 0.3 });
    const success = await this.eyeTracker.init();
    this.state.eyeTracker.supported = success;
    this.state.eyeTracker.detail = success ? 'Eye tracking is calibrated on demand.' : 'Eye tracking pipeline unavailable.';

    if (!success) {
      this.markDegraded(descriptor, this.state.eyeTracker.detail);
      return;
    }

    this.eyeTracker.on('gaze', (point) => {
      const gazePoint = point as GazePoint;
      this.state.eyeTracker.gazePoint = gazePoint;
      this.emit('dataFlow', 'eyeTracker', 'renderer', gazePoint);
    });

    this.eyeTracker.on('calibration', (status) => {
      const calibration = status as { calibrated?: boolean };
      this.state.eyeTracker.calibrated = Boolean(calibration.calibrated);
    });

    this.markReady(descriptor, this.state.eyeTracker.detail);
  }

  private async loadP2P(): Promise<void> {
    const descriptor = this.descriptors[3];
    if (!this.capabilitySupported('webrtc')) {
      this.state.p2p.supported = false;
      this.state.p2p.detail = 'WebRTC unsupported; manual payload handoff remains available.';
      this.markDegraded(descriptor, this.state.p2p.detail);
      return;
    }

    const [{ WebRTCManager }, { SyncProtocol }, { TorrentClient }] = await Promise.all([
      import('@/network/WebRTCManager'),
      import('@/network/SyncProtocol'),
      import('@/network/TorrentClient'),
    ]);

    this.p2p = {
      webrtcManager: new WebRTCManager(),
      syncProtocol: new SyncProtocol(),
      torrentClient: new TorrentClient(),
    };
    await this.p2p.torrentClient.init();

    this.p2p.webrtcManager.on('peerConnected', () => {
      this.state.p2p.peerCount = this.p2p?.webrtcManager.getPeers().length ?? 0;
    });
    this.p2p.webrtcManager.on('message', (payload) => {
      this.emit('dataFlow', 'p2p', 'world', payload);
    });
    this.p2p.torrentClient.on('progress', (payload) => {
      this.emit('dataFlow', 'torrent', 'runtime', payload);
    });

    this.state.p2p.supported = true;
    this.state.p2p.active = true;
    this.state.p2p.detail = 'P2P federation managers are online.';
    this.markReady(descriptor, this.state.p2p.detail);
  }

  private async loadGovernance(): Promise<void> {
    const descriptor = this.descriptors[4];
    const [{ DAOSystem }, { TechTree }] = await Promise.all([
      import('@/governance/DAOSystem'),
      import('@/economy/TechTree'),
    ]);

    this.governance = {
      daoSystem: new DAOSystem(),
      techTree: new TechTree(),
    };

    this.governance.daoSystem.setDivineVerificationCallback?.((voterId) => {
      return this.performDivineVerification(voterId);
    });

    this.state.dao.active = true;
    this.state.dao.detail = 'DAO proposals and civic voting are available.';
    this.state.techTree.ready = true;
    this.state.techTree.detail = 'Technology graph is attached to the runtime kernel.';
    this.markReady(descriptor, 'Governance core and technology graph are attached.');
  }

  private async loadVoice(): Promise<void> {
    const descriptor = this.descriptors[5];
    const [{ SpeechRecognitionManager }, { SpeechSynthesisManager }] = await Promise.all([
      import('@/input/SpeechRecognition'),
      import('@/output/SpeechSynthesis'),
    ]);

    this.voice = {
      speechRecognition: new SpeechRecognitionManager({ language: 'zh-CN', continuous: true }),
      speechSynthesis: new SpeechSynthesisManager(),
    };

    const supported = this.voice.speechRecognition.isSupportedBrowser();
    this.state.voice.supported = supported;
    this.state.voice.detail = supported
      ? 'Voice command parsing is armed and starts on demand.'
      : 'Voice APIs unavailable; keyboard-first fallback stays active.';

    if (!supported) {
      this.markDegraded(descriptor, this.state.voice.detail);
      return;
    }

    this.voice.speechRecognition.registerCommands?.([
      {
        id: 'pause',
        patterns: ['暂停', '停止', '停'],
        action: () => this.emit('userInteraction', 'voiceCommand', { command: 'pause' }),
      },
      {
        id: 'resume',
        patterns: ['继续', '开始', '恢复'],
        action: () => this.emit('userInteraction', 'voiceCommand', { command: 'resume' }),
      },
    ]);

    this.voice.speechRecognition.on('start', () => {
      this.state.voice.listening = true;
    });
    this.voice.speechRecognition.on('end', () => {
      this.state.voice.listening = false;
    });
    this.voice.speechRecognition.on('command', (command) => {
      const payload = command as { id?: string };
      this.state.voice.lastCommand = payload.id ?? null;
      void this.gamepad?.hapticsManager.pattern('tick');
    });

    this.markReady(descriptor, this.state.voice.detail);
  }

  private async loadGamepad(): Promise<void> {
    const descriptor = this.descriptors[6];
    const [{ GamepadManager }, { HapticsManager }] = await Promise.all([
      import('@/input/GamepadManager'),
      import('@/output/HapticsManager'),
    ]);

    this.gamepad = {
      gamepadManager: new GamepadManager(),
      hapticsManager: new HapticsManager(),
    };
    this.gamepad.gamepadManager.startPolling?.();
    this.gamepad.gamepadManager.on('connected', () => {
      this.state.gamepad.connected = this.gamepad?.gamepadManager.getGamepads().length ?? 0;
    });
    this.gamepad.gamepadManager.on('buttonDown', (_index, button) => {
      const activeButton = Number(button);
      if (!this.state.gamepad.activeButtons.includes(activeButton)) {
        this.state.gamepad.activeButtons.push(activeButton);
      }
      void this.gamepad?.hapticsManager.pattern('click');
    });
    this.gamepad.gamepadManager.on('buttonUp', (_index, button) => {
      this.state.gamepad.activeButtons = this.state.gamepad.activeButtons.filter(
        (activeButton) => activeButton !== Number(button),
      );
    });

    this.state.gamepad.supported = true;
    this.state.gamepad.detail = 'Controller input is being polled.';
    this.markReady(descriptor, this.state.gamepad.detail);
  }

  private async loadBiometric(): Promise<void> {
    const descriptor = this.descriptors[7];
    if (!this.capabilitySupported('webAuthn')) {
      this.state.biometric.available = false;
      this.state.biometric.detail = 'Passkeys unsupported; governance falls back to local trust mode.';
      this.markDegraded(descriptor, this.state.biometric.detail);
      return;
    }

    const { WebAuthnManager } = await import('@/auth/WebAuthnManager');
    this.biometric = new WebAuthnManager({
      rpId: typeof window === 'undefined' ? 'localhost' : window.location.hostname,
      rpName: 'OMNIS APIEN',
    });

    this.state.biometric.available = await this.biometric.isAvailable();
    this.state.biometric.detail = this.state.biometric.available
      ? 'Biometric identity is available.'
      : 'WebAuthn is exposed but no authenticator is ready.';
    this.state.biometric.available
      ? this.markReady(descriptor, this.state.biometric.detail)
      : this.markDegraded(descriptor, this.state.biometric.detail);
  }

  private async performDivineVerification(voterId: string): Promise<boolean> {
    if (!this.biometric) {
      return true;
    }

    const result = await this.biometric.authenticate();
    this.emit('dataFlow', 'biometric', 'dao', { voterId, verified: result.verified });
    return result.verified;
  }

  public update(_deltaTime: number): void {
    if (!this.initialized) {
      return;
    }

    if (this.giManager && this.state.gi.active) {
      const stats = this.giManager.getStats();
      this.state.gi.nodeCount = stats.nodeCount;
      this.state.gi.probeCount = stats.voxelCount;
    }

    if (this.gaussianSplatting && this.state.gaussian.active) {
      const stats = this.gaussianSplatting.getStats();
      this.state.gaussian.pointCount = stats.pointCount;
    }

    if (this.governance) {
      const governanceStats = this.governance.daoSystem.getStats();
      this.state.dao.activeProposals = governanceStats.active ?? governanceStats.activeBills ?? 0;
      this.state.dao.totalVotes = governanceStats.totalVotes ?? governanceStats.totalProposals ?? 0;
      const currentResearch = this.governance.techTree.getCurrentResearch();
      this.state.techTree.currentResearch = currentResearch?.id ?? null;
      this.state.techTree.progress = currentResearch?.progress ?? 0;
      const techTreeStats = this.governance.techTree.getStats();
      this.state.techTree.completedCount = techTreeStats.completedNodes ?? techTreeStats.completed ?? 0;
    }

    if (this.p2p) {
      this.state.p2p.peerCount = this.p2p.webrtcManager.getPeers().length;
    }
  }

  public render(
    commandEncoder: GPUCommandEncoder,
    cameraPosition: [number, number, number],
    lightDirection: [number, number, number],
    outputTexture: GPUTexture,
  ): void {
    if (!this.initialized) {
      return;
    }

    this.giManager?.computeGI?.(commandEncoder, cameraPosition, lightDirection, outputTexture);
    this.gaussianSplatting?.render?.(
      commandEncoder,
      new Float32Array(16),
      cameraPosition,
      outputTexture,
    );
  }

  public async startEyeTracking(): Promise<void> {
    if (!this.eyeTracker) {
      await this.loadEyeTracking();
    }
    await this.eyeTracker?.start();
    this.state.eyeTracker.active = true;
    this.state.eyeTracker.detail = 'Eye tracking is actively sampling gaze.';
  }

  public async calibrateEyeTracking(): Promise<void> {
    const calibrated = await this.eyeTracker?.startCalibration();
    this.state.eyeTracker.calibrated = Boolean(calibrated);
    this.state.eyeTracker.detail = calibrated ? 'Eye tracking calibrated.' : 'Eye tracking calibration incomplete.';
  }

  public async startP2P(): Promise<void> {
    if (!this.p2p) {
      await this.loadP2P();
    }
    this.state.p2p.active = true;
    this.state.p2p.detail = 'P2P federation is active and awaiting peers.';
  }

  public async startVoiceControl(): Promise<void> {
    if (!this.voice) {
      await this.loadVoice();
    }
    this.voice?.speechRecognition.start();
    this.state.voice.listening = true;
  }

  public stopVoiceControl(): void {
    this.voice?.speechRecognition.stop();
    this.state.voice.listening = false;
  }

  public async npcSpeak(text: string, npcId: string): Promise<void> {
    if (!this.voice) {
      await this.loadVoice();
    }
    await this.voice?.speechSynthesis.speak(text);
    this.emit('dataFlow', 'speech', 'user', { npcId, text });
  }

  public async biometricAuth(_username: string): Promise<boolean> {
    if (!this.biometric) {
      await this.loadBiometric();
    }
    const result = await this.biometric?.authenticate();
    return Boolean(result?.verified);
  }

  public createDAOProposal(type: string, title: string, description: string, proposer: string): unknown {
    if (!this.governance) {
      return null;
    }
    const bill = this.governance.daoSystem.proposeBill(proposer, title, description, type as never, []);
    this.emit('dataFlow', 'dao', 'proposal', bill);
    return bill;
  }

  public async daoVote(proposalId: string, voterId: string, option: VoteOption): Promise<boolean> {
    if (!this.governance) {
      return false;
    }
    const result = await this.governance.daoSystem.vote(proposalId, voterId, option);
    if (result) {
      this.state.dao.totalVotes += 1;
      this.emit('dataFlow', 'dao', 'proposal', { proposalId, voterId, option });
    }
    return result;
  }

  public startTechResearch(techId: string): boolean {
    if (!this.governance) {
      return false;
    }
    const started = this.governance.techTree.startResearch(techId);
    if (started) {
      this.emit('dataFlow', 'techTree', 'world', { techId, action: 'start' });
    }
    return started;
  }

  public async downloadModel(magnetUri: string, onProgress?: (progress: number) => void): Promise<boolean> {
    if (!this.p2p) {
      await this.loadP2P();
    }
    if (!this.p2p) {
      return false;
    }
    if (onProgress) {
      this.p2p.torrentClient.on('progress', (state) => {
        const payload = state as { progress?: number };
        onProgress(payload.progress ?? 0);
      });
    }
    await this.p2p.torrentClient.download(magnetUri);
    return true;
  }

  public async seedModel(name: string, data: ArrayBuffer): Promise<string | null> {
    if (!this.p2p) {
      await this.loadP2P();
    }
    const info = await this.p2p?.torrentClient.seed(name, data);
    return info?.infoHash ?? null;
  }

  public getP2PContribution(): { downloadedBytes: number; uploadedBytes: number; seedCount: number; contributionScore: number } {
    const torrents = this.p2p?.torrentClient.getTorrents() ?? [];
    let downloadedBytes = 0;
    let uploadedBytes = 0;

    for (const torrent of torrents) {
      const state = this.p2p?.torrentClient.getTorrentState(torrent.infoHash);
      if (!state) {
        continue;
      }
      downloadedBytes += state.downloadSpeed;
      uploadedBytes += state.uploadSpeed;
    }

    return {
      downloadedBytes,
      uploadedBytes,
      seedCount: torrents.length,
      contributionScore: Math.floor(uploadedBytes / 1024 / 1024) + torrents.length * 10,
    };
  }

  public hapticFeedback(pattern: string): void {
    void this.gamepad?.hapticsManager.pattern(pattern);
  }

  public loadMemoriesToGaussian(memories: Array<{ position: [number, number, number]; color: [number, number, number]; opacity: number }>): void {
    this.gaussianSplatting?.loadPoints?.(
      memories.map((memory) => ({
        position: memory.position,
        scale: [0.3, 0.3, 0.3] as [number, number, number],
        rotation: [0, 0, 0, 1] as [number, number, number, number],
        color: memory.color,
        opacity: memory.opacity,
      })),
    );
  }

  public getState(): SystemState {
    return JSON.parse(JSON.stringify(this.state)) as SystemState;
  }

  public getStats(): { initialized: boolean; activeSystems: string[]; dataFlowRate: number } {
    const activeSystems: string[] = [];
    if (this.state.gi.active) activeSystems.push('GI');
    if (this.state.gaussian.active) activeSystems.push('Gaussian');
    if (this.state.p2p.active) activeSystems.push('P2P');
    if (this.state.eyeTracker.active) activeSystems.push('EyeTracking');
    if (this.state.voice.listening || this.state.voice.supported) activeSystems.push('Voice');
    if (this.state.gamepad.supported) activeSystems.push('Gamepad');
    if (this.state.biometric.available) activeSystems.push('WebAuthn');

    return { initialized: this.initialized, activeSystems, dataFlowRate: activeSystems.length };
  }

  public destroy(): void {
    this.eyeTracker?.dispose();
    this.giManager?.destroy?.();
    this.gaussianSplatting?.destroy?.();
    this.p2p?.webrtcManager.destroy?.();
    this.p2p?.torrentClient.destroy?.();
    this.p2p?.syncProtocol.destroy?.();
    this.voice?.speechRecognition.destroy?.();
    this.voice?.speechSynthesis.destroy?.();
    this.gamepad?.gamepadManager.destroy?.();
    this.gamepad?.hapticsManager.destroy?.();

    this.giManager = null;
    this.gaussianSplatting = null;
    this.eyeTracker = null;
    this.p2p = null;
    this.governance = null;
    this.voice = null;
    this.gamepad = null;
    this.biometric = null;
    this.initialized = false;
    this.removeAllListeners();
  }
}

export const systemIntegrator = new SystemIntegrator();

export default SystemIntegrator;
