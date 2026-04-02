/**
 * =============================================================================
 * Panel 统一面板组件 - 赛博朋克风格
 * =============================================================================
 */

import React, { forwardRef, memo, useState, useCallback, type CSSProperties, type HTMLAttributes } from 'react';

export type PanelVariant = 'default' | 'surface' | 'overlay' | 'elevated' | 'glass';
export type PanelSize = 'sm' | 'md' | 'lg';

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: PanelVariant;
  size?: PanelSize;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  noPadding?: boolean;
  bordered?: boolean;
  glowing?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

const VARIANT_BG: Record<PanelVariant, string> = {
  default: 'var(--bg-surface)',
  surface: 'var(--bg-surface)',
  overlay: 'var(--bg-overlay)',
  elevated: 'var(--bg-elevated)',
  glass: 'rgba(7, 21, 37, 0.85)',
};

const SIZE_PADDING: Record<PanelSize, CSSProperties> = {
  sm: { padding: '0.75rem' },
  md: { padding: '1rem' },
  lg: { padding: '1.5rem' },
};

export const Panel = memo(
  forwardRef<HTMLDivElement, PanelProps>(
    (
      {
        variant = 'default',
        size = 'md',
        title,
        subtitle,
        headerRight,
        collapsible = false,
        defaultCollapsed = false,
        collapsed: controlledCollapsed,
        onCollapseChange,
        noPadding = false,
        bordered = true,
        glowing = false,
        className = '',
        style,
        children,
        ...rest
      },
      ref
    ) => {
      const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
      const isCollapsed = controlledCollapsed ?? internalCollapsed;

      const handleToggle = useCallback(() => {
        if (!collapsible) return;
        const newCollapsed = !isCollapsed;
        setInternalCollapsed(newCollapsed);
        onCollapseChange?.(newCollapsed);
      }, [collapsible, isCollapsed, onCollapseChange]);

      const panelStyle: CSSProperties = {
        background: VARIANT_BG[variant],
        ...(variant === 'glass' ? { backdropFilter: 'blur(12px)' } : {}),
        ...(!noPadding ? SIZE_PADDING[size] : {}),
        ...style,
      };

      const hasHeader = title || subtitle || headerRight || collapsible;

      return (
        <div
          ref={ref}
          className={`panel panel-${variant} ${bordered ? 'panel-bordered' : ''} ${glowing ? 'panel-glowing' : ''} ${isCollapsed ? 'panel-collapsed' : ''} ${className}`}
          style={panelStyle}
          {...rest}
        >
          {hasHeader && (
            <div
              className={`panel-header ${collapsible ? 'panel-header-collapsible' : ''}`}
              onClick={collapsible ? handleToggle : undefined}
              role={collapsible ? 'button' : undefined}
              tabIndex={collapsible ? 0 : undefined}
              onKeyDown={collapsible ? (e) => e.key === 'Enter' && handleToggle() : undefined}
            >
              <div className="panel-header-left">
                {title && <h3 className="panel-title">{title}</h3>}
                {subtitle && <span className="panel-subtitle">{subtitle}</span>}
              </div>
              <div className="panel-header-right">
                {headerRight}
                {collapsible && (
                  <span className={`panel-collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          )}
          {(!collapsible || !isCollapsed) && (
            <div className={`panel-content ${hasHeader ? 'panel-content-with-header' : ''}`}>
              {children}
            </div>
          )}
        </div>
      );
    }
  )
);

Panel.displayName = 'Panel';

export type CardVariant = 'default' | 'interactive' | 'selected' | 'disabled';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: CardVariant;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export const Card = memo(
  forwardRef<HTMLDivElement, CardProps>(
    (
      {
        variant = 'default',
        title,
        subtitle,
        icon,
        badge,
        footer,
        selected = false,
        disabled = false,
        onClick,
        className = '',
        style,
        children,
        ...rest
      },
      ref
    ) => {
      const isInteractive = variant === 'interactive' || !!onClick;
      const actualVariant = selected ? 'selected' : disabled ? 'disabled' : variant;

      const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        onClick?.();
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      };

      return (
        <div
          ref={ref}
          role={isInteractive ? 'button' : undefined}
          tabIndex={isInteractive && !disabled ? 0 : undefined}
          className={`card card-${actualVariant} ${isInteractive ? 'card-interactive' : ''} ${selected ? 'card-selected' : ''} ${disabled ? 'card-disabled' : ''} ${className}`}
          style={style}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...rest}
        >
          {(icon || badge) && (
            <div className="card-header-top">
              {icon && <div className="card-icon">{icon}</div>}
              {badge && <div className="card-badge">{badge}</div>}
            </div>
          )}
          {(title || subtitle) && (
            <div className="card-header">
              {title && <h4 className="card-title">{title}</h4>}
              {subtitle && <span className="card-subtitle">{subtitle}</span>}
            </div>
          )}
          {children && <div className="card-content">{children}</div>}
          {footer && <div className="card-footer">{footer}</div>}
        </div>
      );
    }
  )
);

Card.displayName = 'Card';

export interface PanelSectionProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export const PanelSection: React.FC<PanelSectionProps> = memo(({ title, className = '', children }) => (
  <div className={`panel-section ${className}`}>
    {title && <h4 className="panel-section-title">{title}</h4>}
    <div className="panel-section-content">{children}</div>
  </div>
));

PanelSection.displayName = 'PanelSection';

export default Panel;
