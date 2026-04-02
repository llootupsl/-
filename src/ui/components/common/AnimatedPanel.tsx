/**
 * =============================================================================
 * AnimatedPanel 动画面板组件
 * 带有平滑打开/关闭动画的面板
 * =============================================================================
 */

import React, { memo, useEffect, useState, type CSSProperties, type ReactNode } from 'react';

export type PanelAnimationState = 'closed' | 'opening' | 'open' | 'closing';

export interface AnimatedPanelProps {
  isOpen: boolean;
  animationType?: 'slide' | 'scale' | 'fade' | 'drawer-left' | 'drawer-right' | 'modal';
  duration?: number;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showBackdrop?: boolean;
  backdropBlur?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  header?: ReactNode;
  footer?: ReactNode;
}

export const AnimatedPanel = memo<AnimatedPanelProps>(
  ({
    isOpen,
    animationType = 'scale',
    duration = 300,
    onClose,
    closeOnBackdrop = true,
    closeOnEscape = true,
    showBackdrop = true,
    backdropBlur = true,
    children,
    className = '',
    style,
    header,
    footer,
  }) => {
    const [animationState, setAnimationState] = useState<PanelAnimationState>('closed');
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
      if (isOpen) {
        setShouldRender(true);
        requestAnimationFrame(() => {
          setAnimationState('opening');
          setTimeout(() => setAnimationState('open'), duration);
        });
      } else if (shouldRender) {
        setAnimationState('closing');
        setTimeout(() => {
          setAnimationState('closed');
          setShouldRender(false);
        }, duration);
      }
    }, [isOpen, duration, shouldRender]);

    useEffect(() => {
      if (!closeOnEscape) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose?.();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, onClose]);

    const handleBackdropClick = () => {
      if (closeOnBackdrop) {
        onClose?.();
      }
    };

    if (!shouldRender) return null;

    const getAnimationStyles = (): CSSProperties => {
      const baseStyle: CSSProperties = {
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      };

      switch (animationType) {
        case 'slide':
          return {
            ...baseStyle,
            transform: animationState === 'open' ? 'translateY(0)' : 'translateY(100%)',
            opacity: animationState === 'open' ? 1 : 0,
          };
        case 'scale':
          return {
            ...baseStyle,
            transform: animationState === 'open' ? 'scale(1)' : 'scale(0.95)',
            opacity: animationState === 'open' ? 1 : 0,
          };
        case 'fade':
          return {
            ...baseStyle,
            opacity: animationState === 'open' ? 1 : 0,
          };
        case 'drawer-left':
          return {
            ...baseStyle,
            transform: animationState === 'open' ? 'translateX(0)' : 'translateX(-100%)',
          };
        case 'drawer-right':
          return {
            ...baseStyle,
            transform: animationState === 'open' ? 'translateX(0)' : 'translateX(100%)',
          };
        case 'modal':
          return {
            ...baseStyle,
            transform: animationState === 'open' ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
            opacity: animationState === 'open' ? 1 : 0,
          };
        default:
          return baseStyle;
      }
    };

    const backdropStyle: CSSProperties = {
      position: 'fixed',
      inset: 0,
      background: backdropBlur ? 'rgba(4, 12, 20, 0.85)' : 'rgba(4, 12, 20, 0.95)',
      backdropFilter: backdropBlur ? 'blur(8px)' : 'none',
      zIndex: 9998,
      opacity: animationState === 'open' ? 1 : 0,
      transition: `opacity ${duration}ms ease-out`,
    };

    const panelStyle: CSSProperties = {
      position: 'relative',
      zIndex: 9999,
      ...getAnimationStyles(),
      ...style,
    };

    return (
      <>
        {showBackdrop && (
          <div
            className="animated-panel-backdrop"
            style={backdropStyle}
            onClick={handleBackdropClick}
          />
        )}
        <div
          className={`animated-panel animated-panel-${animationType} animated-panel-${animationState} ${className}`}
          style={panelStyle}
        >
          {header && <div className="animated-panel-header">{header}</div>}
          <div className="animated-panel-content">{children}</div>
          {footer && <div className="animated-panel-footer">{footer}</div>}
        </div>
      </>
    );
  }
);

AnimatedPanel.displayName = 'AnimatedPanel';

export default AnimatedPanel;
