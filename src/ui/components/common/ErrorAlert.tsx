/**
 * =============================================================================
 * ErrorAlert 错误提示组件
 * 友好的错误提示，包含可操作的建议
 * =============================================================================
 */

import React, { memo, type CSSProperties } from 'react';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorSuggestion {
  action: string;
  label: string;
  onClick: () => void;
}

export interface ErrorAlertProps {
  visible: boolean;
  title?: string;
  message: string;
  severity?: ErrorSeverity;
  suggestions?: ErrorSuggestion[];
  dismissible?: boolean;
  onDismiss?: () => void;
  retryAction?: () => void;
  className?: string;
  style?: CSSProperties;
}

const SEVERITY_CONFIG: Record<ErrorSeverity, { icon: string; color: string }> = {
  error: { icon: '✕', color: 'var(--color-unrest)' },
  warning: { icon: '⚠', color: 'var(--color-energy)' },
  info: { icon: 'ℹ', color: 'var(--accent)' },
};

export const ErrorAlert = memo<ErrorAlertProps>(
  ({
    visible,
    title,
    message,
    severity = 'error',
    suggestions = [],
    dismissible = true,
    onDismiss,
    retryAction,
    className = '',
    style,
  }) => {
    if (!visible) return null;

    const config = SEVERITY_CONFIG[severity];

    const alertStyle: CSSProperties = {
      borderLeft: `3px solid ${config.color}`,
      ...style,
    };

    return (
      <div
        className={`error-alert error-alert-${severity} ${className}`}
        style={alertStyle}
        role="alert"
      >
        <div className="error-alert-header">
          <span className="error-alert-icon" style={{ color: config.color }}>
            {config.icon}
          </span>
          {title && <h4 className="error-alert-title">{title}</h4>}
          {dismissible && onDismiss && (
            <button
              className="error-alert-dismiss"
              onClick={onDismiss}
              aria-label="关闭"
            >
              ✕
            </button>
          )}
        </div>
        <p className="error-alert-message">{message}</p>
        {retryAction && (
          <div className="error-alert-actions">
            <button className="error-alert-retry" onClick={retryAction}>
              <span>↻</span> 重试
            </button>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="error-alert-suggestions">
            <span className="error-suggestions-label">建议操作：</span>
            <div className="error-suggestions-list">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="error-suggestion-btn"
                  onClick={suggestion.onClick}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ErrorAlert.displayName = 'ErrorAlert';

export default ErrorAlert;
