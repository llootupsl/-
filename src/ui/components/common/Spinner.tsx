/**
 * =============================================================================
 * Spinner 加载指示器组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { memo, type CSSProperties } from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  style?: CSSProperties;
}

const SIZE_MAP = {
  sm: 16,
  md: 24,
  lg: 32,
};

export const Spinner = memo<SpinnerProps>(
  ({ size = 'md', color, className = '', style }) => {
    const dimension = SIZE_MAP[size];
    const spinnerColor = color || 'var(--accent)';

    return (
      <svg
        className={`spinner spinner-${size} ${className}`}
        style={style}
        viewBox="0 0 24 24"
        width={dimension}
        height={dimension}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={spinnerColor}
          strokeWidth="2"
          strokeDasharray="31.4 31.4"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    );
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;
