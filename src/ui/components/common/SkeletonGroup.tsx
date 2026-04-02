/**
 * =============================================================================
 * SkeletonGroup 骨架屏组合组件
 * 预设的骨架屏模板，用于快速构建加载状态
 * =============================================================================
 */

import React, { memo, type CSSProperties } from 'react';

export interface SkeletonGroupProps {
  variant?: 'list' | 'card' | 'table' | 'profile' | 'custom';
  rows?: number;
  animate?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export const SkeletonGroup = memo<SkeletonGroupProps>(
  ({ variant = 'list', rows = 3, animate = true, className = '', style, children }) => {
    if (children) {
      return (
        <div className={`skeleton-group-wrapper ${className}`} style={style}>
          {children}
        </div>
      );
    }

    const renderListSkeleton = () => (
      <div className="skeleton-list">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-list-item">
            <div className="skeleton-avatar" />
            <div className="skeleton-content">
              <div className="skeleton-title" style={{ width: `${60 + Math.random() * 30}%` }} />
              <div className="skeleton-text" style={{ width: `${40 + Math.random() * 40}%` }} />
            </div>
          </div>
        ))}
      </div>
    );

    const renderCardSkeleton = () => (
      <div className="skeleton-cards">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-card-image" />
            <div className="skeleton-card-content">
              <div className="skeleton-title" style={{ width: '80%' }} />
              <div className="skeleton-text" style={{ width: '100%' }} />
              <div className="skeleton-text" style={{ width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    );

    const renderTableSkeleton = () => (
      <div className="skeleton-table">
        <div className="skeleton-table-header">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-cell" style={{ width: `${20 + Math.random() * 10}%` }} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-table-row">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="skeleton-cell" style={{ width: `${15 + Math.random() * 20}%` }} />
            ))}
          </div>
        ))}
      </div>
    );

    const renderProfileSkeleton = () => (
      <div className="skeleton-profile">
        <div className="skeleton-avatar-large" />
        <div className="skeleton-profile-info">
          <div className="skeleton-title-large" style={{ width: '60%' }} />
          <div className="skeleton-text" style={{ width: '80%' }} />
          <div className="skeleton-text" style={{ width: '50%' }} />
        </div>
        <div className="skeleton-stats">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-stat">
              <div className="skeleton-stat-value" />
              <div className="skeleton-stat-label" />
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div
        className={`skeleton-group-wrapper ${animate ? 'skeleton-animated' : ''} ${className}`}
        style={style}
      >
        {variant === 'list' && renderListSkeleton()}
        {variant === 'card' && renderCardSkeleton()}
        {variant === 'table' && renderTableSkeleton()}
        {variant === 'profile' && renderProfileSkeleton()}
      </div>
    );
  }
);

SkeletonGroup.displayName = 'SkeletonGroup';

export default SkeletonGroup;
