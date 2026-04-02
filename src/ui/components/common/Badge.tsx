/**
 * =============================================================================
 * Badge 徽标组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { memo, type CSSProperties } from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  offset?: [number, number];
  className?: string;
  style?: CSSProperties;
}

export const Badge = memo<BadgeProps>(
  ({
    children,
    variant = 'default',
    dot = false,
    count,
    maxCount = 99,
    showZero = false,
    offset,
    className = '',
    style,
  }) => {
    const showBadge = count !== undefined && (count > 0 || showZero);
    const displayCount = count !== undefined && count > maxCount ? `${maxCount}+` : count;

    const badgeStyle: CSSProperties = offset
      ? {
          position: 'absolute',
          top: offset[1],
          right: offset[0],
          transform: 'translate(50%, -50%)',
        }
      : {};

    if (!children) {
      return (
        <span
          className={`badge badge-${variant} ${dot ? 'badge-dot' : ''} ${className}`}
          style={{ ...badgeStyle, ...style }}
        >
          {!dot && showBadge && displayCount}
        </span>
      );
    }

    return (
      <span className={`badge-container ${className}`} style={style}>
        {children}
        {showBadge && (
          <span className={`badge badge-${variant}`} style={badgeStyle}>
            {displayCount}
          </span>
        )}
        {dot && <span className="badge badge-dot badge-primary" style={badgeStyle} />}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
