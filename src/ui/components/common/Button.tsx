/**
 * =============================================================================
 * Button 统一按钮组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { forwardRef, memo, type ButtonHTMLAttributes, type CSSProperties } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShape = 'default' | 'circle' | 'round';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  href?: string;
  target?: string;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

const SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '0.25rem 0.75rem', fontSize: '0.75rem' },
  md: { padding: '0.5rem 1rem', fontSize: '0.85rem' },
  lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
};

const CIRCLE_SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { width: '28px', height: '28px', padding: 0 },
  md: { width: '36px', height: '36px', padding: 0 },
  lg: { width: '44px', height: '44px', padding: 0 },
};

export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        variant = 'primary',
        size = 'md',
        shape = 'default',
        loading = false,
        disabled = false,
        block = false,
        icon,
        iconPosition = 'left',
        href,
        target,
        className = '',
        style,
        children,
        onClick,
        ...rest
      },
      ref
    ) => {
      const isDisabled = disabled || loading;

      const buttonStyle: CSSProperties = {
        ...SIZE_STYLES[size],
        ...(shape === 'circle' ? CIRCLE_SIZES[size] : {}),
        ...(shape === 'round' ? { borderRadius: '999px' } : {}),
        ...(block ? { width: '100%' } : {}),
        ...style,
      };

      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled) return;
        onClick?.(e);
      };

      const content = (
        <>
          {loading && (
            <span className="btn-loading-icon">
              <svg viewBox="0 0 24 24" width="1em" height="1em">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                </circle>
              </svg>
            </span>
          )}
          {icon && iconPosition === 'left' && !loading && (
            <span className="btn-icon btn-icon-left">{icon}</span>
          )}
          {children && <span className="btn-text">{children}</span>}
          {icon && iconPosition === 'right' && !loading && (
            <span className="btn-icon btn-icon-right">{icon}</span>
          )}
        </>
      );

      if (href && !isDisabled) {
        return (
          <a
            href={href}
            target={target}
            className={`btn btn-${variant} btn-${size} ${shape === 'circle' ? 'btn-circle' : ''} ${shape === 'round' ? 'btn-round' : ''} ${block ? 'btn-block' : ''} ${className}`}
            style={buttonStyle}
          >
            {content}
          </a>
        );
      }

      return (
        <button
          ref={ref}
          disabled={isDisabled}
          className={`btn btn-${variant} btn-${size} ${shape === 'circle' ? 'btn-circle' : ''} ${shape === 'round' ? 'btn-round' : ''} ${block ? 'btn-block' : ''} ${loading ? 'btn-loading' : ''} ${className}`}
          style={buttonStyle}
          onClick={handleClick}
          {...rest}
        >
          {content}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';

export const IconButton = memo(
  forwardRef<HTMLButtonElement, Omit<ButtonProps, 'children' | 'icon'>>(
    ({ size = 'md', className = '', ...rest }, ref) => {
      return (
        <Button
          ref={ref}
          shape="circle"
          size={size}
          className={className}
          {...rest}
        />
      );
    }
  )
);

IconButton.displayName = 'IconButton';

export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}> = memo(({ children, className = '', style }) => (
  <div className={`btn-group ${className}`} style={style}>
    {children}
  </div>
));

ButtonGroup.displayName = 'ButtonGroup';

export default Button;
