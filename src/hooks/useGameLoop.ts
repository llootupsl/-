/**
 * 游戏循环 Hook - 性能优化版
 */
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { citizenManager } from '@/citizen';
import { webGPURenderer, type RenderableCitizen } from '@/rendering/WebGPURenderer';
import { syncEmotionToUI } from '@/ui/EmotionSync';
import { throttle, debounce, rafThrottle, BatchProcessor } from '@/core/utils/ThrottleDebounce';
import { RenderOptimizer, LazyRenderer } from '@/core/utils/RenderOptimizer';
import { PerformanceMode } from '@/core/constants/PerformanceMode';
import { LODLevel } from '@/core/constants';
import type { EntityId, Vec3 } from '@/core/types';

export interface UseGameLoopOptions {
  enabled: boolean;
  onUpdate?: (deltaMs: number) => void;
  performanceMode?: PerformanceMode;
}

type CitizenRenderData = RenderableCitizen;

const PERFORMANCE_CONFIGS = {
  [PerformanceMode.APEX]: {
    emotionSyncInterval: 200,
    citizenSyncInterval: 50,
    maxCitizensPerFrame: 2000,
    batchProcessSize: 500,
    targetFPS: 120,
  },
  [PerformanceMode.EXTREME]: {
    emotionSyncInterval: 300,
    citizenSyncInterval: 80,
    maxCitizensPerFrame: 1000,
    batchProcessSize: 300,
    targetFPS: 60,
  },
  [PerformanceMode.BALANCED]: {
    emotionSyncInterval: 500,
    citizenSyncInterval: 100,
    maxCitizensPerFrame: 500,
    batchProcessSize: 200,
    targetFPS: 60,
  },
  [PerformanceMode.ECO]: {
    emotionSyncInterval: 1000,
    citizenSyncInterval: 200,
    maxCitizensPerFrame: 100,
    batchProcessSize: 50,
    targetFPS: 30,
  },
};

export function useGameLoop(options: UseGameLoopOptions) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const emotionSyncRef = useRef<number>(0);
  const citizenSyncRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(0);
  const renderOptimizerRef = useRef<RenderOptimizer | null>(null);
  const citizenBatchProcessorRef = useRef<BatchProcessor<CitizenRenderData> | null>(null);
  const lazyRendererRef = useRef<LazyRenderer<CitizenRenderData> | null>(null);
  const pendingCitizensRef = useRef<CitizenRenderData[]>([]);
  const configRef = useRef(
    PERFORMANCE_CONFIGS[options.performanceMode || PerformanceMode.BALANCED]
  );

  useEffect(() => {
    configRef.current = PERFORMANCE_CONFIGS[options.performanceMode || PerformanceMode.BALANCED];
    
    if (renderOptimizerRef.current) {
      renderOptimizerRef.current.setTargetFPS(configRef.current.targetFPS);
    }
  }, [options.performanceMode]);

  const syncEmotion = useCallback(
    throttle(() => {
      const state = useGameStore.getState();
      syncEmotionToUI(
        state.emotion.hope / 100,
        state.emotion.discontent / 100,
        state.entropy / 100
      );
    }, configRef.current.emotionSyncInterval),
    []
  );

  const processCitizenBatch = useCallback((citizens: CitizenRenderData[]) => {
    if (citizens.length === 0) return;
    webGPURenderer.setCitizens(citizens);
  }, []);

  const syncCitizens = useCallback(
    throttle(() => {
      const allCitizens = citizenManager.getAll();
      const maxCount = Math.min(
        allCitizens.length,
        configRef.current.maxCitizensPerFrame
      );

      const citizens: CitizenRenderData[] = [];
      for (let i = 0; i < maxCount; i++) {
        const c = allCitizens[i];
        if (!c) continue;
        
        citizens.push({
          id: c.id as EntityId,
          position: c.position.world as Vec3,
          lodLevel: c.getLODLevel() as LODLevel,
          visible: c.visible,
          energy: c.state.energy,
          health: c.state.health,
          mood: c.state.mood,
        });
      }

      if (citizens.length > 0) {
        if (citizenBatchProcessorRef.current) {
          citizenBatchProcessorRef.current.addMany(citizens);
        } else {
          pendingCitizensRef.current.push(...citizens);
        }
      }
    }, configRef.current.citizenSyncInterval),
    []
  );

  const updateFPS = useCallback(
    debounce((fps: number, frameTime: number) => {
      useGameStore.getState().updateFPS(fps, frameTime);
    }, 500),
    []
  );

  const renderFrame = useCallback(
    rafThrottle((deltaMs: number) => {
      options.onUpdate?.(deltaMs);
    }),
    [options.onUpdate]
  );

  useEffect(() => {
    if (!citizenBatchProcessorRef.current) {
      citizenBatchProcessorRef.current = new BatchProcessor(
        processCitizenBatch,
        configRef.current.batchProcessSize
      );
    }

    if (!lazyRendererRef.current) {
      lazyRendererRef.current = new LazyRenderer<CitizenRenderData>(
        async (id: string) => {
          const citizen = citizenManager.get(id as EntityId);
          if (!citizen) return null;
          return {
            id: citizen.id as EntityId,
            position: citizen.position.world as Vec3,
            lodLevel: citizen.getLODLevel() as LODLevel,
            visible: citizen.visible,
            energy: citizen.state.energy,
            health: citizen.state.health,
            mood: citizen.state.mood,
          };
        },
        configRef.current.maxCitizensPerFrame * 2
      );
    }

    if (!renderOptimizerRef.current) {
      renderOptimizerRef.current = new RenderOptimizer({
        targetFPS: configRef.current.targetFPS,
        adaptiveQuality: true,
        dirtyRectTracking: true,
        batchRendering: true,
      });
    }

    return () => {
      citizenBatchProcessorRef.current?.clear();
      renderOptimizerRef.current?.destroy();
    };
  }, [processCitizenBatch]);

  useEffect(() => {
    if (!options.enabled) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      citizenBatchProcessorRef.current?.flush();
      return;
    }

    const loop = (currentTime: number) => {
      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      frameCountRef.current++;
      const fpsDelta = currentTime - lastFpsUpdateRef.current;
      if (fpsDelta >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / fpsDelta);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = currentTime;
        updateFPS(fpsRef.current, 1000 / fpsRef.current);
      }

      renderFrame(deltaMs);

      emotionSyncRef.current += deltaMs;
      if (emotionSyncRef.current >= configRef.current.emotionSyncInterval) {
        emotionSyncRef.current = 0;
        syncEmotion();
      }

      citizenSyncRef.current += deltaMs;
      if (citizenSyncRef.current >= configRef.current.citizenSyncInterval) {
        citizenSyncRef.current = 0;
        syncCitizens();
      }

      if (pendingCitizensRef.current.length > 0 && citizenBatchProcessorRef.current) {
        citizenBatchProcessorRef.current.addMany(pendingCitizensRef.current);
        pendingCitizensRef.current = [];
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    lastFpsUpdateRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      syncEmotion.cancel();
      syncCitizens.cancel();
      updateFPS.cancel();
      renderFrame.cancel();
      citizenBatchProcessorRef.current?.flush();
    };
  }, [options.enabled, renderFrame, syncEmotion, syncCitizens, updateFPS]);

  const getStats = useMemo(() => {
    return () => ({
      fps: fpsRef.current,
      frameCount: frameCountRef.current,
      pendingCitizens: pendingCitizensRef.current.length,
      batchQueueLength: citizenBatchProcessorRef.current?.getQueueLength() || 0,
      renderStats: renderOptimizerRef.current?.getStats() || null,
    });
  }, []);

  return {
    getStats,
    flushBatch: () => citizenBatchProcessorRef.current?.flush(),
    markDirty: (x: number, y: number, w: number, h: number) => 
      renderOptimizerRef.current?.markDirty(x, y, w, h),
    setQuality: (q: number) => renderOptimizerRef.current?.setQuality(q),
  };
}

export default useGameLoop;
