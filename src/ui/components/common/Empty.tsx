/**
 * =============================================================================
 * Empty 空状态组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { memo, type CSSProperties } from 'react';

export interface EmptyProps {
  icon?: React.ReactNode;
  text?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const Empty = memo<EmptyProps>(
  ({ icon, text = '暂无数据', description, action, className = '', style }) => {
    return (
      <div className={`empty ${className}`} style={style}>
        <div className="empty-icon">
          {icon || (
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path
                fill="currentColor"
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 17h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10V7H7v2z"
              />
            </svg>
          )}
        </div>
        <div className="empty-text">{text}</div>
        {description && <div className="empty-description">{description}</div>}
        {action && <div className="empty-action">{action}</div>}
      </div>
    );
  }
);

Empty.displayName = 'Empty';

export default Empty;
