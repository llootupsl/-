/**
 * =============================================================================
 * Avatar 头像组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { memo, useState, type CSSProperties } from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  icon?: React.ReactNode;
  size?: AvatarSize;
  name?: string;
  className?: string;
  style?: CSSProperties;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const Avatar = memo<AvatarProps>(
  ({ src, alt, icon, size = 'md', name, className = '', style }) => {
    const [imgError, setImgError] = useState(false);

    const handleError = () => {
      setImgError(true);
    };

    const renderContent = () => {
      if (src && !imgError) {
        return <img src={src} alt={alt || name} onError={handleError} />;
      }
      if (icon) {
        return icon;
      }
      if (name) {
        return getInitials(name);
      }
      return (
        <svg viewBox="0 0 24 24" width="60%" height="60%">
          <path
            fill="currentColor"
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        </svg>
      );
    };

    return (
      <span className={`avatar avatar-${size} ${className}`} style={style}>
        {renderContent()}
      </span>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
