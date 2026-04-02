/**
 * =============================================================================
 * Tag 标签组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { memo, type CSSProperties } from 'react';

export interface TagProps {
  children: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  icon?: React.ReactNode;
  color?: string;
  bordered?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const Tag = memo<TagProps>(
  ({ children, closable = false, onClose, icon, color, bordered = true, className = '', style }) => {
    const tagStyle: CSSProperties = color
      ? {
          backgroundColor: `${color}20`,
          color: color,
          borderColor: `${color}50`,
          ...style,
        }
      : style;

    return (
      <span className={`tag ${closable ? 'tag-closable' : ''} ${bordered ? '' : 'tag-no-border'} ${className}`} style={tagStyle}>
        {icon && <span className="tag-icon">{icon}</span>}
        <span className="tag-text">{children}</span>
        {closable && (
          <button type="button" className="tag-close" onClick={onClose} aria-label="关闭">
            <svg viewBox="0 0 24 24" width="10" height="10">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = 'Tag';

export default Tag;
