import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import './ui/styles/globals.css';
import { ToastContainer } from './components/ui/Toast';
import { toast } from './stores/toastStore';
import { useAppInitialization } from './hooks/useAppInitialization';
import LoadingScreen from './ui/components/LoadingScreen';
import {
  MODES,
  ModeSelect,
  type AppPerformanceMode,
  type ModeConfig,
} from './ui/components/ModeSelect';
import { errorReporter } from './utils/ErrorReporter';
import { logger } from './core/utils/Logger';

const UniverseScene = lazy(() => import('./runtime/UniverseScene'));

type AppPhase = 'loading' | 'select' | 'universe';

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

function App() {
  const [phase, setPhase] = useState<AppPhase>('loading');
  const [selectedMode, setSelectedMode] = useState<AppPerformanceMode>('balanced');
  const [isStarting, setIsStarting] = useState(false);
  const [showEmergencyStart, setShowEmergencyStart] = useState(false);

  const {
    progress: loadProgress,
    status: loadStatus,
    isComplete: loadComplete,
    error: loadError,
    steps: loadSteps,
    isRetrying,
    capabilityProfile,
    runtimeEvents,
    retry: retryInitialization,
  } = useAppInitialization();

  const prefersReducedMotion = usePrefersReducedMotion();

  const currentMode = useMemo<ModeConfig>(() => {
    return MODES.find((mode) => mode.id === selectedMode)
      ?? MODES.find((mode) => mode.id === 'balanced')
      ?? MODES[0];
  }, [selectedMode]);

  useEffect(() => {
    if (loadComplete && phase === 'loading') {
      const timer = window.setTimeout(() => setPhase('select'), 500);
      return () => window.clearTimeout(timer);
    }
  }, [loadComplete, phase]);

  useEffect(() => {
    if (phase !== 'loading' || loadComplete) {
      setShowEmergencyStart(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowEmergencyStart(true);
    }, 15000);

    return () => window.clearTimeout(timer);
  }, [phase, loadComplete]);

  useEffect(() => {
    if (phase === 'select') {
      void import('./runtime/UniverseScene');
    }
  }, [phase]);

  const handleEmergencyStart = useCallback(() => {
    setPhase('select');
    toast.warning('已切换到安全启动模式', '你可以先进入主界面，其余模块会在后台继续补齐。');
  }, []);

  const handleStart = useCallback(async () => {
    if (isStarting) {
      return;
    }

    if (!loadComplete) {
      toast.warning('初始化尚未完成', '请等待核心模块完成后再进入世界。');
      return;
    }

    setIsStarting(true);

    try {
      const [{ audioEngine, SoundType }, { useGameStore }] = await Promise.all([
        import('./audio/AudioEngine'),
        import('./store/gameStore'),
        import('./runtime/UniverseScene'),
      ]);

      const gameStore = useGameStore.getState();

      audioEngine.play(SoundType.BIRTH);
      gameStore.setPerformanceMode(selectedMode);
      await gameStore.startGenesis();
      await audioEngine.playBGM();

      setPhase('universe');
    } catch (error) {
      const appError = error instanceof Error ? error : new Error(String(error));

      logger.error('App', 'Failed to start game', appError);
      errorReporter.report(appError, 'initialization', {
        type: 'error',
        title: '游戏启动失败',
        additionalData: { selectedMode },
      });

      toast.error('启动失败', '进入世界时发生错误，请稍后重试。');
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, loadComplete, selectedMode]);

  const handleExitToMenu = useCallback(() => {
    setPhase('select');
  }, []);

  return (
    <div className="app">
      {phase === 'loading' && (
        <LoadingScreen
          progress={loadProgress}
          status={loadStatus}
          steps={loadSteps}
          error={loadError}
          capabilityProfile={capabilityProfile}
          runtimeEvents={runtimeEvents}
          onRetry={retryInitialization}
          isRetrying={isRetrying}
          isComplete={loadComplete}
          allowEmergencyStart={showEmergencyStart}
          onEmergencyStart={handleEmergencyStart}
        />
      )}

      {phase === 'select' && (
        <ModeSelect
          selectedMode={selectedMode}
          onSelect={setSelectedMode}
          onStart={handleStart}
          currentMode={currentMode}
          capabilityProfile={capabilityProfile}
        />
      )}

      {phase === 'universe' && (
        <Suspense fallback={<div className="panel-loading">Loading...</div>}>
          <UniverseScene currentMode={currentMode} onExitToMenu={handleExitToMenu} />
        </Suspense>
      )}

      {!prefersReducedMotion && <div className="scanlines" aria-hidden="true" />}
      <ToastContainer />
    </div>
  );
}

export default App;
