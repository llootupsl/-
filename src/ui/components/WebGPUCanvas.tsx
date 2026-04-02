import React, { useEffect, useRef } from 'react';
import { PerformanceMode } from '@/core/constants/PerformanceMode';
import type { AppPerformanceMode, ModeConfig } from './ModeSelect';
import { logger } from '@/core/utils/Logger';
import { pushRuntimeTrace } from '@/runtime/runtimeStore';

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

type RendererModule = typeof import('@/rendering/WebGPURenderer');
type CitizenModule = typeof import('@/citizen/CitizenManager');
type IntegratorModule = typeof import('@/core/SystemIntegrator');

export const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({ mode, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const rendererModuleRef = useRef<RendererModule | null>(null);
  const integratorModuleRef = useRef<IntegratorModule | null>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) {
      return;
    }

    let disposed = false;

    const renderFrame = () => {
      if (disposed || !rendererModuleRef.current) {
        return;
      }

      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;

      rendererModuleRef.current.webGPURenderer.render(deltaTime);
      rafRef.current = requestAnimationFrame(renderFrame);
    };

    const bootRenderer = async () => {
      const [rendererModule, citizenModule, integratorModule] = await Promise.all([
        import('@/rendering/WebGPURenderer'),
        import('@/citizen/CitizenManager'),
        import('@/core/SystemIntegrator'),
      ]);

      if (disposed || !canvasRef.current) {
        return;
      }

      rendererModuleRef.current = rendererModule;
      integratorModuleRef.current = integratorModule;

      const renderer = rendererModule.webGPURenderer;
      const initialized = renderer.isInitialized() || (await renderer.init(canvasRef.current));

      if (!initialized) {
        logger.warn('WebGPUCanvas', 'Renderer initialization failed.');
        pushRuntimeTrace({
          stage: 'world',
          severity: 'warning',
          title: 'Renderer degraded',
          detail: 'WebGPU renderer could not initialize and fell back to the shell.',
          subsystemId: 'gi',
        });
        return;
      }

      renderer.setPerformanceMode(toSystemMode(mode.id));
      renderer.setCitizens(
        citizenModule.citizenManager.getAll().slice(0, 1000).map((citizen) => ({
          id: citizen.id,
          position: citizen.position.world,
          lodLevel: citizen.getLODLevel(),
          visible: citizen.visible,
          energy: citizen.state.energy,
          health: citizen.state.health,
          mood: citizen.state.mood,
          neuralActivity: citizen.getAverageFiringRate(),
        })),
      );

      const device = renderer.getDevice();
      if (device && !integratorModule.systemIntegrator.getStats().initialized) {
        await integratorModule.systemIntegrator.init(device);
      }

      lastTimeRef.current = performance.now();
      pushRuntimeTrace({
        stage: 'world',
        severity: 'success',
        title: 'World renderer online',
        detail: `Mode ${mode.nameEN} is driving the live canvas.`,
        subsystemId: 'gi',
      });
      rafRef.current = requestAnimationFrame(renderFrame);
    };

    void bootRenderer();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      rendererModuleRef.current?.webGPURenderer.dispose();
    };
  }, [isActive, mode.id, mode.nameEN]);

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
