import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { logger } from '@/core/utils/Logger';
import { toast } from '@/stores/toastStore';
import { errorReporter, type ErrorCategory } from '@/utils/ErrorReporter';
import { buildCapabilityProfile, type CapabilityProfile } from '@/runtime/capabilities';
import {
  patchSubsystem,
  pushRuntimeTrace,
  resetRuntimeStore,
  setBootPhase,
  setCapabilityProfile,
  upsertSubsystem,
  useRuntimeStore,
  type RuntimeTraceEvent,
  type SubsystemSnapshot,
} from '@/runtime/runtimeStore';
import type { LoadingStep } from '@/ui/components/LoadingScreen';
import type { EntityId } from '@/core/types';

type AudioModule = typeof import('@/audio/AudioEngine');
type WasmModule = typeof import('@/wasm/WasmBridge');
type CitizenModule = typeof import('@/citizen/CitizenManager');
type EconomyModule = typeof import('@/core/economy/EconomicSystemBinder');
type DivineModule = typeof import('@/game/DivineInterventionSystem');
type BackgroundSyncModule = typeof import('@/sw/BackgroundSync');
type EmotionSyncModule = typeof import('@/ui/EmotionSync');
type GameStoreModule = typeof import('@/store/gameStore');
type IntegratorModule = typeof import('@/core/SystemIntegrator');

type StepId =
  | 'profile'
  | 'audio'
  | 'wasm'
  | 'citizen'
  | 'economy'
  | 'divine'
  | 'kernel'
  | 'integrations'
  | 'sync'
  | 'experience';

export interface InitializationError {
  stepId: StepId | 'unknown';
  stepName: string;
  message: string;
  friendlyMessage: string;
  category: ErrorCategory;
  recoverable: boolean;
  suggestion: string;
}

export interface InitializationState {
  progress: number;
  status: string;
  isComplete: boolean;
  error: InitializationError | null;
  steps: LoadingStep[];
  isRetrying: boolean;
  capabilityProfile: CapabilityProfile | null;
  runtimeEvents: RuntimeTraceEvent[];
  runtimeSubsystems: Record<string, SubsystemSnapshot>;
  retry: () => Promise<void>;
}

interface StepDefinition {
  id: StepId;
  name: string;
  description: string;
  weight: number;
  category: ErrorCategory;
  recoverable: boolean;
  source: SubsystemSnapshot['source'];
  group: SubsystemSnapshot['group'];
}

const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: 'profile',
    name: 'Capability Graph',
    description: 'Probe the browser and build the runtime capability map.',
    weight: 8,
    category: 'initialization',
    recoverable: false,
    source: 'native',
    group: 'boot',
  },
  {
    id: 'audio',
    name: 'Audio Engine',
    description: 'Warm up the audio graph and spatial sound layer.',
    weight: 8,
    category: 'audio',
    recoverable: true,
    source: 'native',
    group: 'experience',
  },
  {
    id: 'wasm',
    name: 'WASM Kernel',
    description: 'Load the simulation accelerators for compute-heavy systems.',
    weight: 14,
    category: 'wasm',
    recoverable: false,
    source: 'native',
    group: 'boot',
  },
  {
    id: 'citizen',
    name: 'Citizen Runtime',
    description: 'Prime the citizen manager and world seed state.',
    weight: 12,
    category: 'citizen',
    recoverable: false,
    source: 'native',
    group: 'simulation',
  },
  {
    id: 'economy',
    name: 'Economy Binder',
    description: 'Hydrate resource flows and systemic feedback bindings.',
    weight: 10,
    category: 'economy',
    recoverable: true,
    source: 'native',
    group: 'simulation',
  },
  {
    id: 'divine',
    name: 'Divine Layer',
    description: 'Prepare intervention and observation systems.',
    weight: 8,
    category: 'governance',
    recoverable: true,
    source: 'native',
    group: 'simulation',
  },
  {
    id: 'kernel',
    name: 'World Kernel',
    description: 'Warm the main simulation store without entering the world.',
    weight: 10,
    category: 'initialization',
    recoverable: false,
    source: 'native',
    group: 'simulation',
  },
  {
    id: 'integrations',
    name: 'Immersive Integrations',
    description: 'Preflight native-path subsystems and orchestration.',
    weight: 18,
    category: 'initialization',
    recoverable: true,
    source: 'native',
    group: 'integration',
  },
  {
    id: 'sync',
    name: 'Background Sync',
    description: 'Prepare local-first persistence and background settlement.',
    weight: 5,
    category: 'storage',
    recoverable: true,
    source: 'native',
    group: 'integration',
  },
  {
    id: 'experience',
    name: 'UI Experience',
    description: 'Sync visual telemetry and final boot-shell state.',
    weight: 7,
    category: 'rendering',
    recoverable: true,
    source: 'native',
    group: 'experience',
  },
];

const DEFAULT_STEPS: LoadingStep[] = STEP_DEFINITIONS.map((step) => ({
  id: step.id,
  name: step.name,
  description: step.description,
  status: 'pending',
  progress: 0,
}));

const FRIENDLY_ERRORS: Record<
  StepId | 'unknown',
  Pick<InitializationError, 'friendlyMessage' | 'suggestion' | 'recoverable' | 'category'>
> = {
  profile: {
    friendlyMessage: '能力探测阶段失败，无法可靠决定浏览器的运行路径。',
    suggestion: '请刷新页面或更换兼容性更好的浏览器后重试。',
    recoverable: false,
    category: 'initialization',
  },
  audio: {
    friendlyMessage: '音频引擎启动失败，系统会退回到静音模式。',
    suggestion: '检查浏览器音频权限，或稍后在系统状态面板中再次激活。',
    recoverable: true,
    category: 'audio',
  },
  wasm: {
    friendlyMessage: 'WASM 核心没有就绪，主仿真内核无法安全启动。',
    suggestion: '请使用支持 WebAssembly 的现代浏览器并刷新页面。',
    recoverable: false,
    category: 'wasm',
  },
  citizen: {
    friendlyMessage: '市民运行时未能完成初始化，世界内核无法创建。',
    suggestion: '刷新页面后重试；如果问题持续，请清理缓存后再启动。',
    recoverable: false,
    category: 'citizen',
  },
  economy: {
    friendlyMessage: '经济绑定层没有完全就绪，部分系统反馈将自动降级。',
    suggestion: '你仍可进入世界，稍后可在运行时观测面板检查回退原因。',
    recoverable: true,
    category: 'economy',
  },
  divine: {
    friendlyMessage: '神力层初始化失败，部分干预功能将暂时降级。',
    suggestion: '进入世界后可再次尝试启用，或重新加载页面。',
    recoverable: true,
    category: 'governance',
  },
  kernel: {
    friendlyMessage: '世界内核没有准备完成，无法安全进入主场景。',
    suggestion: '请重试初始化，若仍失败请检查本地存储和浏览器权限。',
    recoverable: false,
    category: 'initialization',
  },
  integrations: {
    friendlyMessage: '部分沉浸式浏览器能力不可用，系统将自动切换到降级路径。',
    suggestion: '这不会阻止启动，但你可以在系统观测面板查看详细原因。',
    recoverable: true,
    category: 'initialization',
  },
  sync: {
    friendlyMessage: '后台同步层初始化失败，系统将回退到手动唤醒同步。',
    suggestion: '进入世界后仍可正常运行，只是后台结算不会自动注册。',
    recoverable: true,
    category: 'storage',
  },
  experience: {
    friendlyMessage: '视觉同步层初始化失败，UI 将回落到基础主题状态。',
    suggestion: '进入世界后可以刷新页面再次尝试同步主题。',
    recoverable: true,
    category: 'rendering',
  },
  unknown: {
    friendlyMessage: '初始化流程遇到了未预期的问题。',
    suggestion: '请刷新页面重试，如果持续发生请检查浏览器兼容性。',
    recoverable: false,
    category: 'unknown',
  },
};

function cloneSteps(): LoadingStep[] {
  return DEFAULT_STEPS.map((step) => ({ ...step }));
}

function getStepById(stepId: StepId): StepDefinition {
  const step = STEP_DEFINITIONS.find((candidate) => candidate.id === stepId);
  if (!step) {
    throw new Error(`Unknown initialization step: ${stepId}`);
  }
  return step;
}

function createSubsystem(step: StepDefinition): SubsystemSnapshot {
  return {
    id: step.id,
    label: step.name,
    group: step.group,
    state: 'idle',
    source: step.source,
    detail: step.description,
    updatedAt: Date.now(),
  };
}

function calculateTotalProgress(steps: LoadingStep[]): number {
  const totalWeight = STEP_DEFINITIONS.reduce((sum, step) => sum + step.weight, 0);
  const progress = steps.reduce((sum, step) => {
    const definition = getStepById(step.id as StepId);
    if (step.status === 'success') {
      return sum + definition.weight;
    }

    if (step.status === 'loading') {
      return sum + definition.weight * (step.progress / 100);
    }

    return sum;
  }, 0);

  return Math.round((progress / totalWeight) * 100);
}

function toInitializationError(stepId: StepId | 'unknown', stepName: string, error: Error): InitializationError {
  const friendly = FRIENDLY_ERRORS[stepId] ?? FRIENDLY_ERRORS.unknown;

  return {
    stepId,
    stepName,
    message: error.message,
    friendlyMessage: friendly.friendlyMessage,
    suggestion: friendly.suggestion,
    recoverable: friendly.recoverable,
    category: friendly.category,
  };
}

function isInitializationError(error: unknown): error is InitializationError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Partial<InitializationError>;
  return typeof candidate.stepId === 'string' && typeof candidate.message === 'string';
}

export function useAppInitialization() {
  const capabilityProfile = useRuntimeStore((state) => state.capabilityProfile);
  const runtimeEvents = useRuntimeStore((state) => state.traces);
  const runtimeSubsystems = useRuntimeStore((state) => state.subsystems);

  const [state, setState] = useState<Omit<InitializationState, 'capabilityProfile' | 'runtimeEvents' | 'runtimeSubsystems' | 'retry'>>({
    progress: 0,
    status: 'Preparing boot shell...',
    isComplete: false,
    error: null,
    steps: cloneSteps(),
    isRetrying: false,
  });

  const initializedRef = useRef(false);
  const modulesRef = useRef<{
    audio: AudioModule | null;
    citizen: CitizenModule | null;
    economy: EconomyModule | null;
    experience: EmotionSyncModule | null;
    sync: BackgroundSyncModule | null;
    integrator: IntegratorModule | null;
  }>({
    audio: null,
    citizen: null,
    economy: null,
    experience: null,
    sync: null,
    integrator: null,
  });

  const updateStep = useCallback((stepId: StepId, patch: Partial<LoadingStep>) => {
    setState((prev) => {
      const steps = prev.steps.map((step) =>
        step.id === stepId ? { ...step, ...patch } : step,
      );

      return {
        ...prev,
        steps,
        progress: calculateTotalProgress(steps),
      };
    });
  }, []);

  const beginStep = useCallback((stepId: StepId) => {
    const step = getStepById(stepId);
    updateStep(stepId, { status: 'loading', progress: 5 });
    upsertSubsystem({
      ...createSubsystem(step),
      state: 'loading',
      source: step.source,
      detail: step.description,
    });
    pushRuntimeTrace({
      stage: 'boot',
      severity: 'info',
      title: `${step.name} started`,
      detail: step.description,
      subsystemId: step.id,
    });
    setState((prev) => ({
      ...prev,
      status: `Booting ${step.name}...`,
    }));
  }, [updateStep]);

  const completeStep = useCallback((
    stepId: StepId,
    detail: string,
    options: { state?: SubsystemSnapshot['state']; source?: SubsystemSnapshot['source'] } = {},
  ) => {
    updateStep(stepId, { status: 'success', progress: 100, error: undefined });
    patchSubsystem(stepId, {
      state: options.state ?? 'ready',
      source: options.source,
      detail,
    });
    pushRuntimeTrace({
      stage: 'boot',
      severity: options.state === 'degraded' ? 'warning' : 'success',
      title: `${getStepById(stepId).name} ready`,
      detail,
      subsystemId: stepId,
    });
  }, [updateStep]);

  const failStep = useCallback((stepId: StepId, error: Error) => {
    const initError = toInitializationError(stepId, getStepById(stepId).name, error);
    updateStep(stepId, { status: 'error', progress: 100, error: error.message });
    patchSubsystem(stepId, {
      state: initError.recoverable ? 'degraded' : 'error',
      source: initError.recoverable ? 'fallback' : 'simulated',
      detail: initError.friendlyMessage,
    });
    pushRuntimeTrace({
      stage: 'boot',
      severity: initError.recoverable ? 'warning' : 'error',
      title: `${getStepById(stepId).name} failed`,
      detail: initError.friendlyMessage,
      subsystemId: stepId,
    });
    return initError;
  }, [updateStep]);

  const loadAudioModule = useCallback(async () => {
    if (!modulesRef.current.audio) {
      modulesRef.current.audio = await import('@/audio/AudioEngine');
    }

    return modulesRef.current.audio;
  }, []);

  const loadCitizenModule = useCallback(async () => {
    if (!modulesRef.current.citizen) {
      modulesRef.current.citizen = await import('@/citizen/CitizenManager');
    }

    return modulesRef.current.citizen;
  }, []);

  const loadEconomyModule = useCallback(async () => {
    if (!modulesRef.current.economy) {
      modulesRef.current.economy = await import('@/core/economy/EconomicSystemBinder');
    }

    return modulesRef.current.economy;
  }, []);

  const loadExperienceModule = useCallback(async () => {
    if (!modulesRef.current.experience) {
      modulesRef.current.experience = await import('@/ui/EmotionSync');
    }

    return modulesRef.current.experience;
  }, []);

  const loadSyncModule = useCallback(async () => {
    if (!modulesRef.current.sync) {
      modulesRef.current.sync = await import('@/sw/BackgroundSync');
    }

    return modulesRef.current.sync;
  }, []);

  const loadIntegratorModule = useCallback(async () => {
    if (!modulesRef.current.integrator) {
      modulesRef.current.integrator = await import('@/core/SystemIntegrator');
    }

    return modulesRef.current.integrator;
  }, []);

  const initialize = useCallback(async () => {
    if (initializedRef.current && !state.isRetrying) {
      return;
    }

    initializedRef.current = true;
    resetRuntimeStore();
    setBootPhase('probing');
    setState({
      progress: 0,
      status: 'Preparing boot shell...',
      isComplete: false,
      error: null,
      steps: cloneSteps(),
      isRetrying: false,
    });

    try {
      beginStep('profile');
      const profile = buildCapabilityProfile();
      setCapabilityProfile(profile);
      completeStep(
        'profile',
        `${Object.values(profile.capabilities).filter((item) => item.supported).length} native paths available.`,
      );
      setBootPhase('hydrating');

      beginStep('audio');
      try {
        const audioModule = await loadAudioModule();
        await audioModule.audioEngine.init();
        updateStep('audio', { progress: 80 });
        completeStep('audio', 'Spatial audio graph is warm and ready.');
      } catch (error) {
        const initError = failStep('audio', error instanceof Error ? error : new Error(String(error)));
        logger.warn('AppInit', initError.message);
      }

      beginStep('wasm');
      {
        const wasmModule: WasmModule = await import('@/wasm/WasmBridge');
        updateStep('wasm', { progress: 35 });
        const ready = await wasmModule.initWasm();
        if (!ready) {
          throw new Error('WASM bridge reported unavailable.');
        }
        wasmModule.wasmQuantum.init(16);
        updateStep('wasm', { progress: 70 });
        wasmModule.wasmSNN.init(256, 64);
        wasmModule.wasmPathFinder.init(100, 100);
        completeStep('wasm', 'Quantum, SNN and pathfinding kernels are active.');
      }

      beginStep('citizen');
      {
        const citizenModule = await loadCitizenModule();
        updateStep('citizen', { progress: 55 });
        await citizenModule.citizenManager.init('world-boot' as EntityId);
        completeStep('citizen', 'Citizen runtime seeded for the world kernel.');
      }

      beginStep('economy');
      try {
        const economyModule = await loadEconomyModule();
        economyModule.economicSystemBinder.initResources([
          { id: 'food', type: 'food', amount: 1000, productionRate: 10, consumptionRate: 5, price: 1 },
          { id: 'materials', type: 'materials', amount: 650, productionRate: 6, consumptionRate: 3, price: 2 },
          { id: 'energy', type: 'energy', amount: 1800, productionRate: 16, consumptionRate: 11, price: 0.8 },
          { id: 'technology', type: 'technology', amount: 120, productionRate: 1.25, consumptionRate: 0.45, price: 5 },
        ]);
        completeStep('economy', 'Economic feedback loops are hydrated with fallback-safe resources.');
      } catch (error) {
        const initError = failStep('economy', error instanceof Error ? error : new Error(String(error)));
        logger.warn('AppInit', initError.message);
      }

      beginStep('divine');
      try {
        const divineModule: DivineModule = await import('@/game/DivineInterventionSystem');
        divineModule.divineInterventionSystem.init();
        completeStep('divine', 'Observation and intervention layer is standing by.');
      } catch (error) {
        const initError = failStep('divine', error instanceof Error ? error : new Error(String(error)));
        logger.warn('AppInit', initError.message);
      }

      beginStep('kernel');
      {
        const kernelModule: GameStoreModule = await import('@/store/gameStore');
        if (!kernelModule.useGameStore?.getState) {
          throw new Error('World kernel store is not available.');
        }
        completeStep('kernel', 'World kernel store is warmed without entering the simulation.');
      }

      beginStep('integrations');
      try {
        const integratorModule = await loadIntegratorModule();
        await integratorModule.systemIntegrator.init(undefined);
        const stats = integratorModule.systemIntegrator.getStats();
        completeStep(
          'integrations',
          `${stats.activeSystems.length} immersive subsystems are already live; the rest will attach on demand.`,
          {
            state: stats.activeSystems.length > 0 ? 'ready' : 'degraded',
            source: stats.activeSystems.length > 0 ? 'native' : 'fallback',
          },
        );
      } catch (error) {
        const initError = failStep(
          'integrations',
          error instanceof Error ? error : new Error(String(error)),
        );
        logger.warn('AppInit', initError.message);
      }

      beginStep('sync');
      try {
        const syncModule = await loadSyncModule();
        await syncModule.backgroundSync.init();
        updateStep('sync', { progress: 70 });
        void syncModule.backgroundSync.registerPeriodicSync();
        completeStep('sync', 'Background settlement is registered with an adaptive fallback strategy.', {
          state: profile.capabilities.periodicSync.supported ? 'ready' : 'degraded',
          source: profile.capabilities.periodicSync.supported ? 'native' : 'fallback',
        });
      } catch (error) {
        const initError = failStep('sync', error instanceof Error ? error : new Error(String(error)));
        logger.warn('AppInit', initError.message);
      }

      beginStep('experience');
      try {
        const [experienceModule, audioModule] = await Promise.all([
          loadExperienceModule(),
          loadAudioModule(),
        ]);
        experienceModule.syncEmotionToUI(0.58, 0.22, 0.18);
        updateStep('experience', { progress: 85 });
        audioModule.audioEngine.play(audioModule.SoundType.NOTIFICATION);
        completeStep('experience', 'Boot shell theme synchronized with runtime telemetry.');
      } catch (error) {
        const initError = failStep(
          'experience',
          error instanceof Error ? error : new Error(String(error)),
        );
        logger.warn('AppInit', initError.message);
      }

      setBootPhase('ready');
      pushRuntimeTrace({
        stage: 'boot',
        severity: 'success',
        title: 'Boot shell complete',
        detail: 'The world kernel is ready to enter the simulation.',
      });
      toast.success('启动完成', '文明内核已经准备就绪。');

      setState((prev) => ({
        ...prev,
        progress: 100,
        status: 'World kernel standing by...',
        isComplete: true,
        error: null,
      }));
    } catch (error) {
      setBootPhase('error');
      const initError = isInitializationError(error)
        ? error
        : toInitializationError(
            'unknown',
            'Unknown step',
            error instanceof Error ? error : new Error(String(error)),
          );

      const reportableError =
        error instanceof Error
          ? error
          : new Error(initError.message);
      errorReporter.report(reportableError, initError.category, {
        type: 'critical',
        title: `${initError.stepName} boot failed`,
        additionalData: { stepId: initError.stepId },
      });

      pushRuntimeTrace({
        stage: 'boot',
        severity: 'error',
        title: 'Boot shell halted',
        detail: initError.friendlyMessage,
        subsystemId: initError.stepId,
      });

      logger.error('AppInit', 'Initialization failed', reportableError);
      toast.error('启动失败', initError.suggestion);

      setState((prev) => ({
        ...prev,
        status: 'Boot shell halted',
        isComplete: false,
        error: initError,
        isRetrying: false,
      }));
    }
  }, [
    beginStep,
    completeStep,
    failStep,
    loadAudioModule,
    loadCitizenModule,
    loadEconomyModule,
    loadExperienceModule,
    loadIntegratorModule,
    loadSyncModule,
    state.isRetrying,
    updateStep,
  ]);

  const retry = useCallback(async () => {
    initializedRef.current = false;
    setState((prev) => ({
      ...prev,
      isRetrying: true,
      error: null,
      status: 'Retrying boot shell...',
    }));
    await initialize();
  }, [initialize]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return useMemo<InitializationState>(() => ({
    ...state,
    capabilityProfile,
    runtimeEvents,
    runtimeSubsystems,
    retry,
  }), [capabilityProfile, retry, runtimeEvents, runtimeSubsystems, state]);
}

export default useAppInitialization;
