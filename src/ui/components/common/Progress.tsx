/**
 * =============================================================================
 * Progress 进度条组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { memo, type CSSProperties } from 'react';

export type ProgressStatus = 'default' | 'success' | 'warning' | 'danger';

export interface ProgressProps {
  percent: number;
  status?: ProgressStatus;
  showInfo?: boolean;
  strokeHeight?: number;
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const Progress = memo<ProgressProps>(
  ({
    percent,
    status = 'default',
    showInfo = true,
    strokeHeight = 4,
    glow = false,
    className = '',
    style,
  }) => {
    const clampedPercent = Math.min(100, Math.max(0, percent));

    return (
      <div className={`progress-wrapper ${className}`} style={style}>
        <div className="progress" style={{ height: strokeHeight }}>
          <div
            className={`progress-bar progress-bar-${status} ${glow ? 'progress-bar-glow' : ''}`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
        {showInfo && (
          <span className={`progress-text progress-text-${status}`}>
            {clampedPercent}%
          </span>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export default Progress;
