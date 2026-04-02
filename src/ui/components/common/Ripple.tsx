/**
 * =============================================================================
 * Ripple 涟漪效果组件
 * 配合useRipple hook使用
 * =============================================================================
 */

import React, { memo } from 'react';
import type { RippleItem } from '../../../hooks/useRipple';

export interface RippleProps {
  ripples: RippleItem[];
  color?: string;
  className?: string;
}

export const Ripple = memo<RippleProps>(
  ({ ripples, color = 'rgba(255, 255, 255, 0.35)', className = '' }) => {
    if (ripples.length === 0) return null;

    return (
      <span className={`ripple-container ${className}`}>
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="ripple-effect"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
            }}
          />
        ))}
      </span>
    );
  }
);

Ripple.displayName = 'Ripple';

export default Ripple;
