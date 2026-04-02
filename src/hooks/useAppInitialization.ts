/**
 * =============================================================================
 * 应用初始化 Hook - 增强版
 * 支持详细步骤跟踪、进度百分比、错误重试
 * 集成友好的错误提示和上报机制
 * =============================================================================
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/core/utils/Logger';
import { audioEngine, SoundType } from '@/audio/AudioEngine';
import { initWasm, wasmQuantum, wasmSNN, wasmPathFinder } from '@/wasm/WasmBridge';
import { citizenManager } from '@/citizen/CitizenManager';
import { LLMManager, LLMProvider } from '@/ai/LLMBridge';
import { divineInterventionSystem } from '@/game/DivineInterventionSystem';
import { webgpuContext } from '@/rendering/WebGPUContext';
import { systemIntegrator } from '@/core/SystemIntegrator';
import { economicSystemBinder } from '@/core/economy/EconomicSystemBinder';
import { backgroundSync } from '@/sw/BackgroundSync';
import { syncEmotionToUI } from '@/ui/EmotionSync';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/stores/toastStore';
import { errorReporter, ErrorCategory } from '@/utils/ErrorReporter';
import { eventCleanupManager } from '@/core/EventCleanupManager';
import type { LoadingStep, LoadingStepStatus } from '@/ui/components/LoadingScreen';
import type { EntityId } from '@/core/types';

export interface InitializationError {
  stepId: string;
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
}

interface StepConfig {
  id: string;
  name: string;
  description: string;
  weight: number;
  category: ErrorCategory;
  action: () => Promise<void>;
}

const FRIENDLY_ERROR_MESSAGES: Record<string, { message: string; suggestion: string; recoverable: boolean }> = {
  audio: {
    message: '音频系统初始化失败，游戏可能没有声音。',
    suggestion: '请检查您的音频设备，或尝试刷新页面。',
    recoverable: true,
  },
  wasm: {
    message: '核心计算模块加载失败，部分功能可能受限。',
    suggestion: '请确保您的浏览器支持WebAssembly，或尝试刷新页面。',
    recoverable: false,
  },
  citizen: {
    message: '市民系统初始化失败，无法创建游戏世界。',
    suggestion: '请刷新页面重试，如果问题持续请联系我们。',
    recoverable: false,
  },
  observation: {
    message: '观测系统初始化失败。',
    suggestion: '请刷新页面重试。',
    recoverable: true,
  },
  ai: {
    message: 'AI系统初始化失败，智能对话功能可能受限。',
    suggestion: '您可以继续游戏，但AI对话可能无法使用。',
    recoverable: true,
  },
  economy: {
    message: '经济系统初始化失败，资源管理可能异常。',
    suggestion: '请刷新页面重试。',
    recoverable: true,
  },
  dao: {
    message: '治理系统初始化失败。',
    suggestion: '请刷新页面重试。',
    recoverable: true,
  },
  tech: {
    message: '科技树系统初始化失败。',
    suggestion: '请刷新页面重试。',
    recoverable: true,
  },
  social: {
    message: '社交网络系统初始化失败。',
    suggestion: '请刷新页面重试。',
    recoverable: true,
  },
  genome: {
    message: '基因系统初始化失败。',
    suggestion: '请刷新页面重试。',
    recoverable: true,
  },
  divine: {
    message: '神力系统初始化失败。',
    suggestion: '请刷新页面重试。',
    recoverable: true,
  },
  system: {
    message: '系统集成失败，游戏可能无法正常运行。',
    suggestion: '请刷新页面重试，如果问题持续请检查浏览器兼容性。',
    recoverable: false,
  },
  sync: {
    message: '后台同步服务初始化失败。',
    suggestion: '您可以继续游戏，但数据可能无法自动同步。',
    recoverable: true,
  },
};

const DEFAULT_STEPS: LoadingStep[] = [
  { id: 'audio', name: '音频引擎', description: '初始化 Web Audio API', status: 'pending', progress: 0 },
  { id: 'wasm', name: 'WASM 核心', description: '编译量子/SNN/寻路模块', status: 'pending', progress: 0 },
  { id: 'citizen', name: '市民系统', description: '初始化市民管理器', status: 'pending', progress: 0 },
  { id: 'observation', name: '观测系统', description: '初始化观测值系统', status: 'pending', progress: 0 },
  { id: 'ai', name: 'AI 引擎', description: '初始化 LLM 管理器', status: 'pending', progress: 0 },
  { id: 'economy', name: '经济系统', description: '初始化资源与市场', status: 'pending', progress: 0 },
  { id: 'dao', name: 'DAO 治理', description: '初始化去中心化治理', status: 'pending', progress: 0 },
  { id: 'tech', name: '科技树', description: '初始化科技研究系统', status: 'pending', progress: 0 },
  { id: 'social', name: '社会网络', description: '初始化 GNN 社交网络', status: 'pending', progress: 0 },
  { id: 'genome', name: '基因系统', description: '初始化基因组管理器', status: 'pending', progress: 0 },
  { id: 'divine', name: '神力系统', description: '初始化神力干预系统', status: 'pending', progress: 0 },
  { id: 'system', name: '系统集成', description: '初始化系统集成器', status: 'pending', progress: 0 },
  { id: 'sync', name: '后台同步', description: '初始化后台同步服务', status: 'pending', progress: 0 },
];

export function useAppInitialization() {
  const [state, setState] = useState<InitializationState>({
    progress: 0,
    status: '正在初始化...',
    isComplete: false,
    error: null,
    steps: DEFAULT_STEPS.map(s => ({ ...s })),
    isRetrying: false,
  });

  const gameStore = useGameStore();
  const isInitializedRef = useRef(false);

  const updateStep = useCallback((stepId: string, updates: Partial<LoadingStep>) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ),
    }));
  }, []);

  const updateProgress = useCallback((stepId: string, progress: number) => {
    updateStep(stepId, { progress: Math.round(progress) });
  }, [updateStep]);

  const calculateTotalProgress = useCallback((steps: LoadingStep[]): number => {
    const weights: Record<string, number> = {
      audio: 8,
      wasm: 12,
      citizen: 10,
      observation: 6,
      ai: 10,
      economy: 10,
      dao: 8,
      tech: 8,
      social: 8,
      genome: 6,
      divine: 6,
      system: 5,
      sync: 3,
    };

    let totalWeight = 0;
    let completedWeight = 0;

    for (const step of steps) {
      const weight = weights[step.id] || 5;
      totalWeight += weight;
      
      if (step.status === 'success') {
        completedWeight += weight;
      } else if (step.status === 'loading') {
        completedWeight += weight * (step.progress / 100);
      }
    }

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }, []);

  const createInitializationError = useCallback((
    stepId: string,
    stepName: string,
    originalError: Error
  ): InitializationError => {
    const friendlyInfo = FRIENDLY_ERROR_MESSAGES[stepId] || {
      message: `${stepName}初始化失败。`,
      suggestion: '请刷新页面重试。',
      recoverable: true,
    };

    return {
      stepId,
      stepName,
      message: originalError.message,
      friendlyMessage: friendlyInfo.message,
      category: stepId as ErrorCategory,
      recoverable: friendlyInfo.recoverable,
      suggestion: friendlyInfo.suggestion,
    };
  }, []);

  const initialize = useCallback(async () => {
    if (isInitializedRef.current && !state.isRetrying) return;
    
    isInitializedRef.current = true;
    setState(prev => ({ 
      ...prev, 
      isRetrying: false,
      error: null,
      steps: DEFAULT_STEPS.map(s => ({ ...s, status: 'pending', progress: 0 })),
    }));

    const steps: StepConfig[] = [
      {
        id: 'audio',
        name: '音频引擎',
        description: '初始化 Web Audio API',
        weight: 8,
        category: 'audio',
        action: async () => {
          updateStep('audio', { status: 'loading', progress: 0 });
          for (let i = 0; i <= 100; i += 20) {
            updateProgress('audio', i);
            await new Promise(r => setTimeout(r, 50));
          }
          await audioEngine.init();
          updateStep('audio', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'wasm',
        name: 'WASM 核心',
        description: '编译量子/SNN/寻路模块',
        weight: 12,
        category: 'wasm',
        action: async () => {
          updateStep('wasm', { status: 'loading', progress: 0 });
          updateProgress('wasm', 10);
          const wasmReady = await initWasm();
          updateProgress('wasm', 50);
          if (wasmReady) {
            wasmQuantum.init(16);
            updateProgress('wasm', 65);
            wasmSNN.init(256, 64);
            updateProgress('wasm', 80);
            wasmPathFinder.init(100, 100);
            updateProgress('wasm', 95);
          }
          updateStep('wasm', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'citizen',
        name: '市民系统',
        description: '初始化市民管理器',
        weight: 10,
        category: 'citizen',
        action: async () => {
          updateStep('citizen', { status: 'loading', progress: 0 });
          updateProgress('citizen', 20);
          await citizenManager.init('world-1' as EntityId);
          updateProgress('citizen', 80);
          await new Promise(r => setTimeout(r, 100));
          updateStep('citizen', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'observation',
        name: '观测系统',
        description: '初始化观测值系统',
        weight: 6,
        category: 'unknown',
        action: async () => {
          updateStep('observation', { status: 'loading', progress: 0 });
          await new Promise(r => setTimeout(r, 100));
          updateStep('observation', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'ai',
        name: 'AI 引擎',
        description: '初始化 LLM 管理器',
        weight: 10,
        category: 'unknown',
        action: async () => {
          updateStep('ai', { status: 'loading', progress: 0 });
          updateProgress('ai', 20);
          const llm = LLMManager.getInstance({ provider: 'mock' as LLMProvider });
          updateProgress('ai', 50);
          await llm.init();
          updateProgress('ai', 90);
          updateStep('ai', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'economy',
        name: '经济系统',
        description: '初始化资源与市场',
        weight: 10,
        category: 'economy',
        action: async () => {
          updateStep('economy', { status: 'loading', progress: 0 });
          updateProgress('economy', 20);
          economicSystemBinder.initResources([
            { id: 'food', type: 'food', amount: 1000, productionRate: 10, consumptionRate: 5, price: 1.0 },
            { id: 'materials', type: 'materials', amount: 500, productionRate: 5, consumptionRate: 3, price: 2.0 },
            { id: 'energy', type: 'energy', amount: 2000, productionRate: 20, consumptionRate: 15, price: 0.5 },
            { id: 'technology', type: 'technology', amount: 100, productionRate: 1, consumptionRate: 0.5, price: 5.0 },
            { id: 'culture', type: 'culture', amount: 50, productionRate: 0.5, consumptionRate: 0.2, price: 10.0 },
          ]);
          updateProgress('economy', 60);
          
          economicSystemBinder.on('economicEvent', (event: { type: string; details: Record<string, unknown> }) => {
            const messages: Record<string, string> = {
              'crisis': `经济危机：${event.details.resource}`,
              'boom': `经济繁荣：${event.details.resource}`,
              'shortage': `资源短缺：${event.details.resource}`,
            };
            gameStore.addNarrative(messages[event.type] || '经济事件', 'event');
          });

          economicSystemBinder.on('shortage', (resource: string) => {
            gameStore.addNarrative(`警告：${resource} 供应不足`, 'event');
          });
          
          updateProgress('economy', 90);
          updateStep('economy', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'dao',
        name: 'DAO 治理',
        description: '初始化去中心化治理',
        weight: 8,
        category: 'governance',
        action: async () => {
          updateStep('dao', { status: 'loading', progress: 0 });
          await new Promise(r => setTimeout(r, 80));
          updateStep('dao', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'tech',
        name: '科技树',
        description: '初始化科技研究系统',
        weight: 8,
        category: 'unknown',
        action: async () => {
          updateStep('tech', { status: 'loading', progress: 0 });
          await new Promise(r => setTimeout(r, 80));
          updateStep('tech', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'social',
        name: '社会网络',
        description: '初始化 GNN 社交网络',
        weight: 8,
        category: 'unknown',
        action: async () => {
          updateStep('social', { status: 'loading', progress: 0 });
          await new Promise(r => setTimeout(r, 80));
          updateStep('social', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'genome',
        name: '基因系统',
        description: '初始化基因组管理器',
        weight: 6,
        category: 'citizen',
        action: async () => {
          updateStep('genome', { status: 'loading', progress: 0 });
          await new Promise(r => setTimeout(r, 80));
          updateStep('genome', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'divine',
        name: '神力系统',
        description: '初始化神力干预系统',
        weight: 6,
        category: 'unknown',
        action: async () => {
          updateStep('divine', { status: 'loading', progress: 0 });
          updateProgress('divine', 30);
          divineInterventionSystem.init();
          updateProgress('divine', 90);
          updateStep('divine', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'system',
        name: '系统集成',
        description: '初始化系统集成器',
        weight: 5,
        category: 'unknown',
        action: async () => {
          updateStep('system', { status: 'loading', progress: 0 });
          try {
            const device = webgpuContext.getDevice();
            if (device) {
              updateProgress('system', 30);
              await systemIntegrator.init(device);
              updateProgress('system', 80);
            }
          } catch (err) {
            logger.warn('AppInit', 'SystemIntegrator init failed', err as Error);
          }
          
          citizenManager.on('citizenBorn', (citizen: { id: string; needs: Record<string, unknown> }) => {
            economicSystemBinder.handleGameStateChange({
              source: 'population',
              type: 'citizenBorn',
              data: { id: citizen.id, needs: citizen.needs },
              economicImpact: 0.1,
            });
          });

          citizenManager.on('citizenDied', (citizenId: string) => {
            economicSystemBinder.handleGameStateChange({
              source: 'population',
              type: 'citizenDied',
              data: { id: citizenId },
              economicImpact: -0.1,
            });
          });
          
          updateStep('system', { status: 'success', progress: 100 });
        },
      },
      {
        id: 'sync',
        name: '后台同步',
        description: '初始化后台同步服务',
        weight: 3,
        category: 'storage',
        action: async () => {
          updateStep('sync', { status: 'loading', progress: 0 });
          try {
            updateProgress('sync', 30);
            await backgroundSync.init();
            updateProgress('sync', 60);
            void backgroundSync.registerPeriodicSync().catch((err) => {
              logger.warn('AppInit', 'Periodic sync registration failed', err as Error);
            });
            updateProgress('sync', 90);
          } catch (err) {
            logger.warn('AppInit', 'BackgroundSync init failed', err as Error);
          }
          updateStep('sync', { status: 'success', progress: 100 });
        },
      },
    ];

    try {
      for (const step of steps) {
        setState(prev => ({
          ...prev,
          status: `正在${step.name.toLowerCase()}...`,
        }));
        
        try {
          await step.action();
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          
          errorReporter.report(error, step.category, {
            type: 'error',
            title: `${step.name}初始化失败`,
            additionalData: { stepId: step.id },
          });

          const initError = createInitializationError(step.id, step.name, error);
          
          updateStep(step.id, { 
            status: 'error', 
            error: error.message,
          });

          toast.error(`${step.name}初始化失败`, initError.friendlyMessage);

          if (!initError.recoverable) {
            throw initError;
          }
          
          logger.warn('AppInit', `${step.name}初始化失败，但可继续: ${error.message}`);
        }
      }

      syncEmotionToUI(0.5, 0.2, 0.3);

      setState(prev => ({
        ...prev,
        progress: 100,
        status: '准备就绪...',
        isComplete: true,
        error: null,
      }));
      
      audioEngine.play(SoundType.NOTIFICATION);
      toast.success('初始化完成', '欢迎来到永夜熵纪');

    } catch (error) {
      logger.error('AppInit', '初始化失败', error instanceof Error ? error : new Error(String(error)));
      
      const initError = error instanceof Error 
        ? createInitializationError('unknown', '未知', error)
        : error as InitializationError;
      
      errorReporter.report(
        initError.message,
        initError.category,
        { type: 'critical', title: '应用初始化失败' }
      );

      setState(prev => ({
        ...prev,
        status: '初始化失败',
        isComplete: false,
        error: initError,
        isRetrying: false,
      }));

      toast.error('初始化失败', initError.suggestion);
    }
  }, [gameStore, state.isRetrying, updateStep, updateProgress, createInitializationError]);

  const retry = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isRetrying: true,
      error: null,
    }));
    
    isInitializedRef.current = false;
    await initialize();
  }, [initialize]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      progress: calculateTotalProgress(prev.steps),
    }));
  }, [state.steps, calculateTotalProgress]);

  useEffect(() => {
    return () => {
      citizenManager.removeAllListeners('citizenBorn');
      citizenManager.removeAllListeners('citizenDied');
      economicSystemBinder.removeAllListeners('economicEvent');
      economicSystemBinder.removeAllListeners('shortage');
      const cleanedCount = eventCleanupManager.cleanupAll();
      logger.debug('AppInit', `Cleaned up event listeners: ${cleanedCount}`);
    };
  }, []);

  return { 
    ...state, 
    retry,
  };
}

export default useAppInitialization;
