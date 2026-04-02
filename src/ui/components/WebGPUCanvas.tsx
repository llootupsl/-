/**
 * WebGPU 渲染画布组件
 */
import React, { useRef, useEffect } from 'react';
import { webGPURenderer } from '@/rendering/WebGPURenderer';
import { citizenManager } from '@/citizen';
import { PerformanceMode } from '@/core/constants/PerformanceMode';
import { ModeConfig, AppPerformanceMode } from './ModeSelect';
import { logger } from '@/core/utils/Logger';

function toSystemMode(appMode: AppPerformanceMode): PerformanceMode {
  const map: Record<AppPerformanceMode, PerformanceMode> = {
    apex: PerformanceMode.APEX,
    extreme: PerformanceMode.EXTREME,
    balanced: PerformanceMode.BALANCED,
    eco: PerformanceMode.ECO,
  };
  return map[appMode];
}

export interface WebGPUCanvasProps {
  mode: ModeConfig;
  isActive: boolean;
}

export const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({ mode, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isActive || !canvasRef.current || initializedRef.current) return;

    let initialized = false;

    const initAndRender = async () => {
      if (initialized) return;
      
      const success = await webGPURenderer.init(canvasRef.current!);
      if (success) {
        initialized = true;
        initializedRef.current = true;
        webGPURenderer.setPerformanceMode(toSystemMode(mode.id));
        
        const citizens = citizenManager.getAll().slice(0, 1000).map(c => ({
          id: c.id,
          position: c.position.world,
          lodLevel: c.getLODLevel(),
          visible: true,
          energy: c.state.energy,
          health: c.state.health,
          mood: c.state.mood,
          neuralActivity: c.getAverageFiringRate(),
        }));
        webGPURenderer.setCitizens(citizens);
        
        lastTimeRef.current = performance.now();
        render();
      } else {
        logger.warn('WebGPUCanvas', 'WebGPU 初始化失败');
      }
    };

    const render = () => {
      if (!initialized) {
        initAndRender();
        return;
      }

      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;

      webGPURenderer.render(deltaTime);

      rafRef.current = requestAnimationFrame(render);
    };

    initAndRender();

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (initialized) {
        webGPURenderer.dispose();
        initializedRef.current = false;
      }
    };
  }, [isActive, mode.id]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
};

export default WebGPUCanvas;
