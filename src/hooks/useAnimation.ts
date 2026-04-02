/**
 * =============================================================================
 * useAnimation Hook - 动画控制
 * 提供动画状态管理和性能优化
 * =============================================================================
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export type AnimationState = 'idle' | 'running' | 'paused' | 'finished';

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  iterations?: number;
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

export interface UseAnimationReturn {
  isAnimating: boolean;
  animationState: AnimationState;
  progress: number;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  onAnimationEnd: (callback: () => void) => void;
}

export function useAnimation(config: AnimationConfig = {}): UseAnimationReturn {
  const {
    duration = 300,
    delay = 0,
    easing = 'ease-out',
    iterations = 1,
    fillMode = 'forwards',
  } = config;

  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const endCallbackRef = useRef<(() => void) | null>(null);

  const updateProgress = useCallback(() => {
    if (animationState !== 'running') return;

    const elapsed = Date.now() - startTimeRef.current;
    const totalDuration = duration * iterations;
    const currentProgress = Math.min(elapsed / totalDuration, 1);

    setProgress(currentProgress);

    if (currentProgress < 1) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      setAnimationState('finished');
      endCallbackRef.current?.();
    }
  }, [animationState, duration, iterations]);

  useEffect(() => {
    if (animationState === 'running') {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationState, updateProgress]);

  const start = useCallback(() => {
    setTimeout(() => {
      startTimeRef.current = Date.now();
      setAnimationState('running');
      setProgress(0);
    }, delay);
  }, [delay]);

  const stop = useCallback(() => {
    setAnimationState('idle');
    setProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const pause = useCallback(() => {
    setAnimationState('paused');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const resume = useCallback(() => {
    if (animationState === 'paused') {
      setAnimationState('running');
    }
  }, [animationState]);

  const reset = useCallback(() => {
    setAnimationState('idle');
    setProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const onAnimationEnd = useCallback((callback: () => void) => {
    endCallbackRef.current = callback;
  }, []);

  return {
    isAnimating: animationState === 'running',
    animationState,
    progress,
    start,
    stop,
    pause,
    resume,
    reset,
    onAnimationEnd,
  };
}

export default useAnimation;
