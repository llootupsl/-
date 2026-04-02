/**
 * =============================================================================
 * Skeleton 骨架屏组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { memo, type CSSProperties } from 'react';

export interface SkeletonProps {
  loading?: boolean;
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  rows?: number;
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const Skeleton = memo<SkeletonProps>(
  ({
    loading = true,
    children,
    width,
    height,
    rows = 1,
    circle = false,
    className = '',
    style,
  }) => {
    if (!loading && children) {
      return <>{children}</>;
    }

    if (loading) {
      const skeletonStyle: CSSProperties = {
        width: width,
        height: height || (rows > 1 ? undefined : '1em'),
        ...style,
      };

      if (rows > 1) {
        return (
          <div className={`skeleton-group ${className}`}>
            {Array.from({ length: rows }).map((_, index) => (
              <div
                key={index}
                className={`skeleton ${circle ? 'skeleton-circle' : 'skeleton-text'}`}
                style={{
                  ...skeletonStyle,
                  width: index === rows - 1 ? '60%' : skeletonStyle.width,
                }}
              />
            ))}
          </div>
        );
      }

      return (
        <div
          className={`skeleton ${circle ? 'skeleton-circle' : ''} ${className}`}
          style={skeletonStyle}
        />
      );
    }

    return <>{children}</>;
  }
);

Skeleton.displayName = 'Skeleton';

export default Skeleton;
