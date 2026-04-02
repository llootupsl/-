/**
 * =============================================================================
 * Modal 模态框 - 熵增时代的交互层
 * =============================================================================
 */

import React, {
  useEffect,
  useRef,
  useCallback,
  memo,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';

/* ==========================================================================
   类型定义
   ========================================================================== */

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalAnimation = 'fade' | 'scale' | 'slide' | 'flip' | 'none';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  animation?: ModalAnimation;
  closable?: boolean;
  maskClosable?: boolean;
  centered?: boolean;
  destroyOnClose?: boolean;
  className?: string;
  style?: CSSProperties;
  headerStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
  footerStyle?: CSSProperties;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/* ==========================================================================
   样式映射
   ========================================================================== */

const SIZE_STYLES: Record<ModalSize, CSSProperties> = {
  sm: { maxWidth: 400 },
  md: { maxWidth: 560 },
  lg: { maxWidth: 720 },
  xl: { maxWidth: 960 },
  full: { maxWidth: '95vw', maxHeight: '95vh' },
};

/* ==========================================================================
   组件实现
   ========================================================================== */

export const Modal: React.FC<ModalProps> = memo(
  ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    animation = 'scale',
    closable = true,
    maskClosable = true,
    centered = true,
    destroyOnClose = false,
    className = '',
    style,
    headerStyle,
    bodyStyle,
    footerStyle,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
  }) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<Element | null>(null);

    // 焦点管理
    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement;
        // 聚焦到模态框
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        } else {
          dialogRef.current?.focus();
        }

        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
      } else {
        // 恢复背景滚动
        document.body.style.overflow = '';

        // 恢复焦点
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    // ESC 键关闭
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closable) {
          onClose();
        }

        // Tab 键焦点循环
        if (e.key === 'Tab' && dialogRef.current) {
          const focusableElements = dialogRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      },
      [closable, onClose]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [isOpen, handleKeyDown]);

    // 渲染内容
    if (!isOpen && destroyOnClose) return null;

    const handleMaskClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && maskClosable && closable) {
        onClose();
      }
    };

    const content = (
      <div
        className={`modal-backdrop ${animation !== 'none' ? `modal-backdrop-${animation}` : ''}`}
        onClick={handleMaskClick}
        role="presentation"
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel || (typeof title === 'string' ? title : undefined)}
          aria-describedby={ariaDescribedby}
          tabIndex={-1}
          className={`modal modal-${size} modal-animation-${animation} ${centered ? 'modal-centered' : ''} ${className}`}
          style={{ ...SIZE_STYLES[size], ...style }}
        >
          {/* 装饰边框 */}
          <div className="modal-border-glow" />

          {/* 头部 */}
          {title !== undefined && (
            <div className="modal-header" style={headerStyle}>
              <h2 className="modal-title">{title}</h2>
              {closable && (
                <button
                  className="modal-close"
                  onClick={onClose}
                  aria-label="关闭"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="currentColor"
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* 内容 */}
          <div className="modal-body" style={bodyStyle}>
            {children}
          </div>

          {/* 底部 */}
          {footer !== undefined && (
            <div className="modal-footer" style={footerStyle}>
              {footer}
            </div>
          )}
        </div>
      </div>
    );

    // 使用 Portal 渲染到 body
    if (typeof document !== 'undefined') {
      return createPortal(content, document.body);
    }

    return null;
  }
);

Modal.displayName = 'Modal';

/* ==========================================================================
   确认对话框
   ========================================================================== */

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = memo(
  ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = '确认',
    cancelText = '取消',
    danger = false,
    icon,
  }) => {
    const handleConfirm = () => {
      onConfirm();
      onClose();
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="sm"
        animation="scale"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </>
        }
      >
        <div className="confirm-dialog-content">
          {icon && <div className="confirm-dialog-icon">{icon}</div>}
          <div className="confirm-dialog-message">{message}</div>
        </div>
      </Modal>
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';

/* ==========================================================================
   警告对话框
   ========================================================================== */

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  buttonText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

export const AlertDialog: React.FC<AlertDialogProps> = memo(
  ({
    isOpen,
    onClose,
    title,
    message,
    buttonText = '我知道了',
    type = 'info',
  }) => {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      danger: '🚫',
      success: '✅',
    };

    return (
      <ConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onClose}
        title={title}
        message={message}
        confirmText={buttonText}
        icon={<span style={{ fontSize: '2rem' }}>{icons[type]}</span>}
      />
    );
  }
);

AlertDialog.displayName = 'AlertDialog';
