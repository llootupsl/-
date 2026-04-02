/**
 * =============================================================================
 * ErrorModal - 严重错误显示模态框
 * 提供友好的错误消息、恢复建议和错误上报功能
 * =============================================================================
 */

import React, { memo, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { logger } from '@/core/utils/Logger';

export type ErrorSeverity = 'warning' | 'error' | 'critical';

export interface ErrorRecovery {
  label: string;
  action: 'retry' | 'reload' | 'goBack' | 'dismiss' | 'custom';
  onCustomAction?: () => void;
}

export interface ErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  severity?: ErrorSeverity;
  details?: string;
  recoveries?: ErrorRecovery[];
  onRetry?: () => void;
  onReload?: () => void;
  onGoBack?: () => void;
  onDismiss?: () => void;
  showReportButton?: boolean;
  onReport?: (errorInfo: { title: string; message: string; details?: string }) => void;
}

const SEVERITY_CONFIG: Record<ErrorSeverity, { icon: string; color: string; bgColor: string }> = {
  warning: {
    icon: '⚠️',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  error: {
    icon: '🚫',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  critical: {
    icon: '💀',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.15)',
  },
};

const DEFAULT_RECOVERIES: Record<string, ErrorRecovery[]> = {
  network: [
    { label: '重试', action: 'retry' },
    { label: '刷新页面', action: 'reload' },
  ],
  storage: [
    { label: '清理缓存后重试', action: 'reload' },
    { label: '忽略并继续', action: 'dismiss' },
  ],
  webgpu: [
    { label: '切换到Canvas渲染', action: 'custom' },
    { label: '刷新页面', action: 'reload' },
  ],
  wasm: [
    { label: '重试加载', action: 'retry' },
    { label: '刷新页面', action: 'reload' },
  ],
  default: [
    { label: '重试', action: 'retry' },
    { label: '刷新页面', action: 'reload' },
    { label: '忽略', action: 'dismiss' },
  ],
};

export const ErrorModal: React.FC<ErrorModalProps> = memo(({
  isOpen,
  title,
  message,
  severity = 'error',
  details,
  recoveries,
  onRetry,
  onReload,
  onGoBack,
  onDismiss,
  showReportButton = true,
  onReport,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const config = SEVERITY_CONFIG[severity];
  const recoveryOptions = recoveries || DEFAULT_RECOVERIES.default;

  const handleRecovery = useCallback((recovery: ErrorRecovery) => {
    switch (recovery.action) {
      case 'retry':
        onRetry?.();
        break;
      case 'reload':
        if (onReload) {
          onReload();
        } else {
          window.location.reload();
        }
        break;
      case 'goBack':
        if (onGoBack) {
          onGoBack();
        } else {
          window.history.back();
        }
        break;
      case 'dismiss':
        onDismiss?.();
        break;
      case 'custom':
        recovery.onCustomAction?.();
        break;
    }
  }, [onRetry, onReload, onGoBack, onDismiss]);

  const handleReport = useCallback(async () => {
    if (isReporting || reportSent) return;
    
    setIsReporting(true);
    try {
      await onReport?.({ title, message, details });
      setReportSent(true);
    } catch (err) {
      logger.error('ErrorModal', 'Report failed', err as Error);
    } finally {
      setIsReporting(false);
    }
  }, [isReporting, reportSent, onReport, title, message, details]);

  if (!isOpen) return null;

  return createPortal(
    <div className="error-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="error-modal-title">
      <div className="error-modal">
        <div className="error-modal-header" style={{ backgroundColor: config.bgColor }}>
          <span className="error-modal-icon" aria-hidden="true">{config.icon}</span>
          <h2 id="error-modal-title" className="error-modal-title" style={{ color: config.color }}>
            {title}
          </h2>
        </div>

        <div className="error-modal-body">
          <p className="error-modal-message">{message}</p>

          {details && (
            <div className="error-modal-details-section">
              <button
                className="error-modal-details-toggle"
                onClick={() => setShowDetails(!showDetails)}
                aria-expanded={showDetails}
              >
                {showDetails ? '▼ 隐藏详细信息' : '▶ 显示详细信息'}
              </button>
              {showDetails && (
                <pre className="error-modal-details">{details}</pre>
              )}
            </div>
          )}

          <div className="error-modal-recovery">
            <h3 className="error-modal-recovery-title">建议操作：</h3>
            <div className="error-modal-recovery-actions">
              {recoveryOptions.map((recovery, index) => (
                <button
                  key={index}
                  className={`error-modal-btn ${index === 0 ? 'primary' : ''}`}
                  onClick={() => handleRecovery(recovery)}
                >
                  {recovery.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showReportButton && (
          <div className="error-modal-footer">
            <button
              className="error-modal-report-btn"
              onClick={handleReport}
              disabled={isReporting || reportSent}
            >
              {reportSent ? '✓ 已上报' : isReporting ? '上报中...' : '上报问题'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .error-modal-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .error-modal {
          max-width: 480px;
          width: 90%;
          background: linear-gradient(135deg, rgba(10, 10, 18, 0.98), rgba(20, 20, 40, 0.98));
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.1);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .error-modal-header {
          padding: 1.5rem;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .error-modal-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .error-modal-title {
          font-family: var(--font-display, 'ZCOOL QingKe HuangYou', 'Noto Sans SC', sans-serif);
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
          letter-spacing: 0.05em;
        }

        .error-modal-body {
          padding: 1.5rem;
        }

        .error-modal-message {
          color: var(--color-text-secondary, #a0a0b0);
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0 0 1rem 0;
          text-align: center;
        }

        .error-modal-details-section {
          margin-bottom: 1rem;
        }

        .error-modal-details-toggle {
          background: transparent;
          border: none;
          color: var(--color-text-muted, #6b7280);
          font-size: 0.8rem;
          cursor: pointer;
          padding: 0.5rem 0;
          width: 100%;
          text-align: left;
          transition: color 0.2s;
        }

        .error-modal-details-toggle:hover {
          color: var(--color-primary, #00f0ff);
        }

        .error-modal-details {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #ef4444;
          overflow-x: auto;
          max-height: 150px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .error-modal-recovery {
          background: rgba(0, 240, 255, 0.03);
          border: 1px solid rgba(0, 240, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
        }

        .error-modal-recovery-title {
          font-size: 0.85rem;
          color: var(--color-text-muted, #6b7280);
          margin: 0 0 0.75rem 0;
          font-weight: 500;
        }

        .error-modal-recovery-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .error-modal-btn {
          flex: 1;
          min-width: 100px;
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 8px;
          color: var(--color-text-secondary, #a0a0b0);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .error-modal-btn:hover {
          background: rgba(0, 240, 255, 0.1);
          border-color: var(--color-primary, #00f0ff);
          color: var(--color-primary, #00f0ff);
        }

        .error-modal-btn.primary {
          background: rgba(0, 240, 255, 0.15);
          border-color: var(--color-primary, #00f0ff);
          color: var(--color-primary, #00f0ff);
        }

        .error-modal-btn.primary:hover {
          background: rgba(0, 240, 255, 0.25);
        }

        .error-modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
        }

        .error-modal-report-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 0.5rem 1rem;
          color: var(--color-text-muted, #6b7280);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .error-modal-report-btn:hover:not(:disabled) {
          border-color: rgba(255, 255, 255, 0.3);
          color: var(--color-text-secondary, #a0a0b0);
        }

        .error-modal-report-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>,
    document.body
  );
});

ErrorModal.displayName = 'ErrorModal';

export default ErrorModal;
