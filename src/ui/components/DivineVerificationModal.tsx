/**
 * =============================================================================
 * DivineVerificationModal 神启验证模态框 - 神圣意志的验证
 * =============================================================================
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { logger } from '@/core/utils/Logger';

/* ==========================================================================
   类型定义
   ========================================================================== */

export type VerificationStatus = 'verifying' | 'success' | 'failed';

export interface DivineVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => Promise<boolean>;
  onRetry?: () => void;
  voterId?: string;
  billName?: string;
}

/* ==========================================================================
   神圣光芒动画组件
   ========================================================================== */

interface DivineLightProps {
  status: VerificationStatus;
}

const DivineLight: React.FC<DivineLightProps> = memo(({ status }) => {
  return (
    <div className={`divine-light-container ${status}`}>
      <div className="divine-light-core">
        <div className="light-ring ring-1" />
        <div className="light-ring ring-2" />
        <div className="light-ring ring-3" />
        <div className="light-center">
          {status === 'verifying' && (
            <div className="verification-symbol">
              <svg viewBox="0 0 100 100" className="divine-icon">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="70 200" strokeLinecap="round" />
              </svg>
            </div>
          )}
          {status === 'success' && (
            <div className="success-symbol">
              <svg viewBox="0 0 24 24" className="check-icon">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
          )}
          {status === 'failed' && (
            <div className="failed-symbol">
              <svg viewBox="0 0 24 24" className="cross-icon">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="divine-rays">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="ray" style={{ transform: `rotate(${i * 30}deg)` }} />
        ))}
      </div>
    </div>
  );
});

DivineLight.displayName = 'DivineLight';

/* ==========================================================================
   主组件
   ========================================================================== */

export const DivineVerificationModal: React.FC<DivineVerificationModalProps> = memo(
  ({ isOpen, onClose, onVerify, onRetry, voterId, billName }) => {
    const [status, setStatus] = useState<VerificationStatus>('verifying');
    const [canClose, setCanClose] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const verifyAttemptRef = useRef<boolean>(false);

    const startVerification = useCallback(async () => {
      setStatus('verifying');
      setCanClose(false);
      verifyAttemptRef.current = true;

      try {
        const result = await onVerify();
        if (verifyAttemptRef.current) {
          setStatus(result ? 'success' : 'failed');
          if (result) {
            setTimeout(() => {
              if (verifyAttemptRef.current) {
                setCanClose(true);
                onClose();
              }
            }, 1500);
          } else {
            setCanClose(true);
          }
        }
      } catch (error) {
        logger.warn('DivineVerificationModal', 'Verification failed', error as Error);
        if (verifyAttemptRef.current) {
          setStatus('failed');
          setCanClose(true);
        }
      }
    }, [onVerify, onClose]);

    useEffect(() => {
      if (isOpen) {
        verifyAttemptRef.current = false;
        startVerification();
      }
      return () => {
        verifyAttemptRef.current = false;
      };
    }, [isOpen, startVerification]);

    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    const handleCancel = useCallback(() => {
      if (canClose || status === 'failed') {
        verifyAttemptRef.current = false;
        onClose();
      }
    }, [canClose, status, onClose]);

    const handleRetry = useCallback(() => {
      onRetry?.();
      startVerification();
    }, [onRetry, startVerification]);

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && (canClose || status === 'failed')) {
        handleCancel();
      }
    };

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape' && (canClose || status === 'failed')) {
          handleCancel();
        }
      },
      [canClose, status, handleCancel]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const content = (
      <div className="divine-verification-backdrop" onClick={handleBackdropClick}>
        <div
          ref={modalRef}
          className={`divine-verification-modal ${status}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="divine-verification-title"
        >
          <div className="divine-verification-content">
            <DivineLight status={status} />

            <h2 id="divine-verification-title" className="divine-verification-title">
              {status === 'verifying' && '正在进行神启验证...'}
              {status === 'success' && '神启验证通过'}
              {status === 'failed' && '神启验证失败'}
            </h2>

            {(voterId || billName) && (
              <div className="divine-verification-info">
                {billName && (
                  <div className="info-row">
                    <span className="info-label">法案</span>
                    <span className="info-value">{billName}</span>
                  </div>
                )}
                {voterId && (
                  <div className="info-row">
                    <span className="info-label">投票者</span>
                    <span className="info-value">{voterId}</span>
                  </div>
                )}
              </div>
            )}

            <div className="divine-verification-actions">
              {status === 'verifying' && (
                <button className="divine-btn divine-btn-ghost" onClick={handleCancel}>
                  取消验证
                </button>
              )}

              {status === 'failed' && (
                <>
                  <button className="divine-btn divine-btn-primary" onClick={handleRetry}>
                    重新验证
                  </button>
                  <button className="divine-btn divine-btn-ghost" onClick={handleCancel}>
                    取消
                  </button>
                </>
              )}
            </div>

            {status === 'verifying' && (
              <p className="divine-verification-hint">
                神启正在验证您的意志...
              </p>
            )}
          </div>

          <div className="divine-border-glow" />
        </div>

        <style>{`
          .divine-verification-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(4, 12, 20, 0.92);
            backdrop-filter: blur(8px);
            z-index: var(--z-modal, 30);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: divineFadeIn 0.3s ease;
          }

          .divine-verification-modal {
            position: relative;
            background: var(--bg-overlay, #0C2035);
            border: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
            border-radius: var(--radius-xl, 16px);
            padding: 2.5rem 2rem;
            width: 90%;
            max-width: 420px;
            box-shadow: 0 0 60px rgba(26, 239, 251, 0.15);
            animation: divineScaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .divine-verification-modal.failed {
            animation: divineShake 0.5s ease;
          }

          .divine-verification-modal.success {
            animation: divineSuccessPulse 0.6s ease;
          }

          .divine-border-glow {
            position: absolute;
            inset: -1px;
            border-radius: var(--radius-xl, 16px);
            pointer-events: none;
            background: linear-gradient(135deg, 
              rgba(26, 239, 251, 0.3) 0%, 
              transparent 30%, 
              transparent 70%, 
              rgba(139, 92, 246, 0.3) 100%
            );
            z-index: -1;
          }

          .divine-verification-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .divine-verification-title {
            font-family: var(--font-display, 'ZCOOL QingKe HuangYou', sans-serif);
            font-size: 1.4rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            color: var(--accent, #1AEFFB);
            margin-top: 1.5rem;
            text-shadow: 0 0 20px var(--accent, #1AEFFB);
          }

          .divine-verification-modal.failed .divine-verification-title {
            color: var(--color-unrest, #FF3867);
            text-shadow: 0 0 20px var(--color-unrest, #FF3867);
          }

          .divine-verification-modal.success .divine-verification-title {
            color: var(--color-hope, #1BF5A0);
            text-shadow: 0 0 20px var(--color-hope, #1BF5A0);
          }

          .divine-verification-info {
            margin-top: 1rem;
            padding: 0.75rem 1rem;
            background: rgba(26, 239, 251, 0.05);
            border-radius: var(--radius-md, 8px);
            width: 100%;
          }

          .divine-verification-info .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.25rem 0;
          }

          .divine-verification-info .info-label {
            font-size: 0.75rem;
            color: var(--text-muted, #3A6B80);
          }

          .divine-verification-info .info-value {
            font-family: var(--font-mono, monospace);
            font-size: 0.85rem;
            color: var(--text-primary, #D6F8FF);
          }

          .divine-verification-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1.5rem;
          }

          .divine-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.6rem 1.5rem;
            font-family: var(--font-ui, sans-serif);
            font-size: 0.9rem;
            font-weight: 500;
            border: 1px solid;
            border-radius: var(--radius-md, 8px);
            cursor: pointer;
            transition: all 0.2s ease;
            outline: none;
          }

          .divine-btn:focus-visible {
            box-shadow: 0 0 0 2px var(--accent, #1AEFFB);
          }

          .divine-btn-primary {
            background: rgba(26, 239, 251, 0.12);
            border-color: rgba(26, 239, 251, 0.25);
            color: var(--accent, #1AEFFB);
          }

          .divine-btn-primary:hover {
            background: rgba(26, 239, 251, 0.18);
            box-shadow: 0 0 12px rgba(26, 239, 251, 0.35);
          }

          .divine-btn-ghost {
            background: transparent;
            border-color: var(--border-default, rgba(26, 239, 251, 0.12));
            color: var(--text-secondary, rgba(214, 248, 255, 0.65));
          }

          .divine-btn-ghost:hover {
            background: var(--bg-elevated, #112840);
            color: var(--text-primary, #D6F8FF);
          }

          .divine-verification-hint {
            margin-top: 1rem;
            font-size: 0.8rem;
            color: var(--text-muted, #3A6B80);
            animation: divinePulse 2s ease-in-out infinite;
          }

          /* 神圣光芒容器 */
          .divine-light-container {
            position: relative;
            width: 120px;
            height: 120px;
          }

          .divine-light-core {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .light-ring {
            position: absolute;
            border-radius: 50%;
            border: 1px solid rgba(26, 239, 251, 0.3);
            animation: divineRingPulse 2s ease-in-out infinite;
          }

          .ring-1 {
            inset: 10px;
            animation-delay: 0s;
          }

          .ring-2 {
            inset: 25px;
            animation-delay: 0.3s;
          }

          .ring-3 {
            inset: 40px;
            animation-delay: 0.6s;
          }

          .light-center {
            position: relative;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle, rgba(26, 239, 251, 0.2) 0%, transparent 70%);
            border-radius: 50%;
          }

          .verification-symbol {
            color: var(--accent, #1AEFFB);
            animation: divineSpin 2s linear infinite;
          }

          .divine-icon {
            width: 40px;
            height: 40px;
          }

          .success-symbol {
            color: var(--color-hope, #1BF5A0);
            animation: divineSuccessPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .check-icon {
            width: 32px;
            height: 32px;
          }

          .failed-symbol {
            color: var(--color-unrest, #FF3867);
            animation: divineShakeSymbol 0.5s ease;
          }

          .cross-icon {
            width: 32px;
    height: 32px;
          }

          /* 神圣光芒射线 */
          .divine-rays {
            position: absolute;
            inset: 0;
            animation: divineRaysRotate 10s linear infinite;
          }

          .ray {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 1px;
            height: 60px;
            background: linear-gradient(to top, transparent, rgba(26, 239, 251, 0.4), transparent);
            transform-origin: bottom center;
            margin-left: -0.5px;
            margin-top: -60px;
          }

          /* 成功状态样式 */
          .divine-light-container.success .light-ring {
            border-color: rgba(27, 245, 160, 0.5);
            animation: divineSuccessRings 0.6s ease forwards;
          }

          .divine-light-container.success .ray {
            background: linear-gradient(to top, transparent, rgba(27, 245, 160, 0.6), transparent);
          }

          .divine-light-container.success .light-center {
            background: radial-gradient(circle, rgba(27, 245, 160, 0.3) 0%, transparent 70%);
          }

          /* 失败状态样式 */
          .divine-light-container.failed .light-ring {
            border-color: rgba(255, 56, 103, 0.5);
            animation: none;
          }

          .divine-light-container.failed .ray {
            background: linear-gradient(to top, transparent, rgba(255, 56, 103, 0.4), transparent);
            animation: none;
          }

          .divine-light-container.failed .light-center {
            background: radial-gradient(circle, rgba(255, 56, 103, 0.3) 0%, transparent 70%);
          }

          .divine-light-container.failed .divine-rays {
            animation: none;
          }

          /* 动画关键帧 */
          @keyframes divineFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes divineScaleIn {
            from { 
              opacity: 0; 
              transform: scale(0.9) translateY(20px); 
            }
            to { 
              opacity: 1; 
              transform: scale(1) translateY(0); 
            }
          }

          @keyframes divineShake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }

          @keyframes divineSuccessPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); box-shadow: 0 0 80px rgba(27, 245, 160, 0.3); }
            100% { transform: scale(1); }
          }

          @keyframes divineRingPulse {
            0%, 100% { 
              opacity: 0.3; 
              transform: scale(1); 
            }
            50% { 
              opacity: 0.6; 
              transform: scale(1.05); 
            }
          }

          @keyframes divineSpin {
            to { transform: rotate(360deg); }
          }

          @keyframes divineRaysRotate {
            to { transform: rotate(360deg); }
          }

          @keyframes divineSuccessPop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes divineSuccessRings {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 0; }
          }

          @keyframes divineShakeSymbol {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-3px); }
            75% { transform: translateX(3px); }
          }

          @keyframes divinePulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
            .divine-verification-backdrop,
            .divine-verification-modal,
            .divine-light-container,
            .light-ring,
            .verification-symbol,
            .divine-rays,
            .divine-verification-hint {
              animation: none !important;
            }
          }
        `}</style>
      </div>
    );

    if (typeof document !== 'undefined') {
      return createPortal(content, document.body);
    }

    return null;
  }
);

DivineVerificationModal.displayName = 'DivineVerificationModal';

/* ==========================================================================
   便捷 Hook
   ========================================================================== */

export interface UseDivineVerificationOptions {
  onVerify: () => Promise<boolean>;
  onRetry?: () => void;
  onSuccess?: () => void;
  onFailed?: () => void;
  autoCloseDelay?: number;
}

export function useDivineVerification(options: UseDivineVerificationOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [voterId, setVoterId] = useState<string | undefined>();
  const [billName, setBillName] = useState<string | undefined>();

  const openVerification = useCallback((params?: { voterId?: string; billName?: string }) => {
    setVoterId(params?.voterId);
    setBillName(params?.billName);
    setIsOpen(true);
  }, []);

  const closeVerification = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleVerify = useCallback(async () => {
    const result = await options.onVerify();
    if (result) {
      options.onSuccess?.();
    } else {
      options.onFailed?.();
    }
    return result;
  }, [options]);

  const handleRetry = useCallback(() => {
    options.onRetry?.();
  }, [options]);

  return {
    isOpen,
    voterId,
    billName,
    openVerification,
    closeVerification,
    handleVerify,
    handleRetry,
    ModalComponent: () => (
      <DivineVerificationModal
        isOpen={isOpen}
        onClose={closeVerification}
        onVerify={handleVerify}
        onRetry={handleRetry}
        voterId={voterId}
        billName={billName}
      />
    ),
  };
}
