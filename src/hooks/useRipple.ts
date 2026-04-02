/**
 * =============================================================================
 * useRipple Hook - 涟漪效果反馈
 * 为按钮和可点击元素添加Material Design风格的涟漪效果
 * =============================================================================
 */

import { useCallback, useRef, useState, type MouseEvent, type TouchEvent } from 'react';

export interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
}

export interface UseRippleOptions {
  disabled?: boolean;
  color?: string;
  duration?: number;
}

export interface UseRippleReturn {
  ripples: RippleItem[];
  addRipple: (event: MouseEvent<HTMLElement> | TouchEvent<HTMLElement>) => void;
  removeRipple: (id: number) => void;
  rippleProps: {
    onMouseDown: (event: MouseEvent<HTMLElement>) => void;
    onTouchStart: (event: TouchEvent<HTMLElement>) => void;
  };
}

let rippleIdCounter = 0;

export function useRipple(options: UseRippleOptions = {}): UseRippleReturn {
  const { disabled = false, duration = 600 } = options;
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const timeoutRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const addRipple = useCallback(
    (event: MouseEvent<HTMLElement> | TouchEvent<HTMLElement>) => {
      if (disabled) return;

      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();

      let x: number, y: number;

      if ('touches' in event) {
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
      } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      }

      const size = Math.max(rect.width, rect.height) * 2;
      const id = ++rippleIdCounter;

      setRipples((prev) => [...prev, { id, x, y, size }]);

      const timeout = setTimeout(() => {
        removeRipple(id);
      }, duration);

      timeoutRefs.current.set(id, timeout);
    },
    [disabled, duration]
  );

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const rippleProps = {
    onMouseDown: addRipple as (event: MouseEvent<HTMLElement>) => void,
    onTouchStart: addRipple as (event: TouchEvent<HTMLElement>) => void,
  };

  return { ripples, addRipple, removeRipple, rippleProps };
}

export default useRipple;
