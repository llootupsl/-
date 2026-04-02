/**
 * =============================================================================
 * Transition 过渡动画组件
 * 提供平滑的进入/退出动画效果
 * =============================================================================
 */

import React, { memo, useEffect, useState, type CSSProperties, type ReactNode } from 'react';

export type TransitionType =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale'
  | 'scale-fade'
  | 'expand';

export interface TransitionProps {
  in: boolean;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  unmountOnExit?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onEnter?: () => void;
  onEntered?: () => void;
  onExit?: () => void;
  onExited?: () => void;
}

const TRANSITION_STYLES: Record<TransitionType, { enter: CSSProperties; exit: CSSProperties }> = {
  fade: {
    enter: { opacity: 0 },
    exit: { opacity: 0 },
  },
  'slide-up': {
    enter: { opacity: 0, transform: 'translateY(20px)' },
    exit: { opacity: 0, transform: 'translateY(-20px)' },
  },
  'slide-down': {
    enter: { opacity: 0, transform: 'translateY(-20px)' },
    exit: { opacity: 0, transform: 'translateY(20px)' },
  },
  'slide-left': {
    enter: { opacity: 0, transform: 'translateX(20px)' },
    exit: { opacity: 0, transform: 'translateX(-20px)' },
  },
  'slide-right': {
    enter: { opacity: 0, transform: 'translateX(-20px)' },
    exit: { opacity: 0, transform: 'translateX(20px)' },
  },
  scale: {
    enter: { opacity: 0, transform: 'scale(0.9)' },
    exit: { opacity: 0, transform: 'scale(0.9)' },
  },
  'scale-fade': {
    enter: { opacity: 0, transform: 'scale(0.95) translateY(10px)' },
    exit: { opacity: 0, transform: 'scale(0.95) translateY(10px)' },
  },
  expand: {
    enter: { opacity: 0, maxHeight: 0, overflow: 'hidden' as const },
    exit: { opacity: 0, maxHeight: 0, overflow: 'hidden' as const },
  },
};

export const Transition = memo<TransitionProps>(
  ({
    in: show,
    type = 'fade',
    duration = 200,
    delay = 0,
    unmountOnExit = true,
    children,
    className = '',
    style,
    onEnter,
    onEntered,
    onExit,
    onExited,
  }) => {
    const [status, setStatus] = useState<'enter' | 'entered' | 'exit' | 'exited'>(
      show ? 'entered' : 'exited'
    );
    const [shouldRender, setShouldRender] = useState(show);

    useEffect(() => {
      if (show) {
        setShouldRender(true);
        setStatus('enter');
        onEnter?.();

        const enterTimer = setTimeout(() => {
          setStatus('entered');
          onEntered?.();
        }, 10 + delay);

        return () => clearTimeout(enterTimer);
      } else {
        if (shouldRender) {
          setStatus('exit');
          onExit?.();

          const exitTimer = setTimeout(() => {
            setStatus('exited');
            onExited?.();
            if (unmountOnExit) {
              setShouldRender(false);
            }
          }, duration);

          return () => clearTimeout(exitTimer);
        }
      }
    }, [show, duration, delay, unmountOnExit, shouldRender, onEnter, onEntered, onExit, onExited]);

    if (!shouldRender) return null;

    const transitionStyle: CSSProperties = {
      transition: `all ${duration}ms ease-out`,
      transitionDelay: `${delay}ms`,
      ...(status === 'enter' ? TRANSITION_STYLES[type].enter : {}),
      ...(status === 'exit' ? TRANSITION_STYLES[type].exit : {}),
      ...(status === 'entered' ? { opacity: 1, transform: 'none' } : {}),
      ...style,
    };

    return (
      <div className={`transition-wrapper transition-${type} ${className}`} style={transitionStyle}>
        {children}
      </div>
    );
  }
);

Transition.displayName = 'Transition';

export interface TransitionGroupProps {
  children: ReactNode;
  className?: string;
}

export const TransitionGroup: React.FC<TransitionGroupProps> = memo(({ children, className = '' }) => (
  <div className={`transition-group ${className}`}>{children}</div>
));

TransitionGroup.displayName = 'TransitionGroup';

export default Transition;
