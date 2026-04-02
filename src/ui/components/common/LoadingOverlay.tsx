/**
 * =============================================================================
 * LoadingOverlay 加载遮罩组件
 * 全屏或局部加载状态显示
 * =============================================================================
 */

import React, { memo, type CSSProperties } from 'react';

export interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  progress?: number;
  blur?: boolean;
  fullScreen?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const LoadingOverlay = memo<LoadingOverlayProps>(
  ({
    visible,
    text = '加载中...',
    progress,
    blur = true,
    fullScreen = false,
    className = '',
    style,
  }) => {
    if (!visible) return null;

    const overlayStyle: CSSProperties = {
      position: fullScreen ? 'fixed' : 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      background: blur ? 'rgba(4, 12, 20, 0.85)' : 'rgba(4, 12, 20, 0.95)',
      backdropFilter: blur ? 'blur(8px)' : 'none',
      zIndex: fullScreen ? 9999 : 100,
      animation: 'loadingOverlayFadeIn 0.2s ease-out',
      ...style,
    };

    return (
      <div className={`loading-overlay ${className}`} style={overlayStyle}>
        <div className="loading-spinner-enhanced">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-core"></div>
        </div>
        {text && <span className="loading-text">{text}</span>}
        {progress !== undefined && (
          <div className="loading-progress-container">
            <div className="loading-progress-bar">
              <div
                className="loading-progress-fill"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="loading-progress-text">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

export default LoadingOverlay;
