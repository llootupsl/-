/**
 * =============================================================================
 * Divider 分割线组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { memo, type CSSProperties } from 'react';

export interface DividerProps {
  vertical?: boolean;
  text?: React.ReactNode;
  dashed?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const Divider = memo<DividerProps>(
  ({ vertical = false, text, dashed = false, className = '', style }) => {
    if (text) {
      return (
        <div className={`divider divider-text ${className}`} style={style}>
          {text}
        </div>
      );
    }

    return (
      <div
        className={`divider ${vertical ? 'divider-vertical' : ''} ${dashed ? 'divider-dashed' : ''} ${className}`}
        style={style}
      />
    );
  }
);

Divider.displayName = 'Divider';

export default Divider;
