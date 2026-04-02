/**
 * =============================================================================
 * Tooltip 工具提示 - 悬停信息层
 * =============================================================================
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  memo,
  type CSSProperties,
} from 'react';

/* ==========================================================================
   类型定义
   ========================================================================== */

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipTrigger = 'hover' | 'click' | 'focus';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: TooltipPosition;
  trigger?: TooltipTrigger | TooltipTrigger[];
  delay?: number;
  maxWidth?: number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/* ==========================================================================
   组件实现
   ========================================================================== */

export const Tooltip: React.FC<TooltipProps> = memo(
  ({
    content,
    children,
    position = 'top',
    trigger = 'hover',
    delay = 300,
    maxWidth = 250,
    disabled = false,
    className = '',
    style,
  }) => {
    const [visible, setVisible] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const showTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    const triggers = Array.isArray(trigger) ? trigger : [trigger];

    const calculatePosition = useCallback(() => {
      if (!triggerRef.current || !tooltipRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let top = 0;
      let left = 0;
      const gap = 8;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - gap;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + gap;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - gap;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + gap;
          break;
      }

      // 边界检测和自动翻转
      if (left < 0) left = 0;
      if (left + tooltipRect.width > viewport.width)
        left = viewport.width - tooltipRect.width;
      if (top < 0) top = triggerRect.bottom + gap;
      if (top + tooltipRect.height > viewport.height)
        top = triggerRect.top - tooltipRect.height - gap;

      setTooltipStyle({ top, left });
    }, [position]);

    const showTooltip = useCallback(() => {
      if (disabled) return;

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      showTimerRef.current = setTimeout(() => {
        setVisible(true);
        // 延迟计算位置以获取正确的尺寸
        requestAnimationFrame(() => {
          calculatePosition();
        });
      }, delay);
    }, [disabled, delay, calculatePosition]);

    const hideTooltip = useCallback(() => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }

      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, 100);
    }, []);

    const toggleTooltip = useCallback(() => {
      if (visible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }, [visible, showTooltip, hideTooltip]);

    // 清理定时器
    useEffect(() => {
      return () => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      };
    }, []);

    // 窗口大小变化时重新计算位置
    useEffect(() => {
      if (!visible) return;

      const handleResize = () => calculatePosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [visible, calculatePosition]);

    const handleMouseEnter = () => {
      if (triggers.includes('hover')) {
        showTooltip();
      }
    };

    const handleMouseLeave = () => {
      if (triggers.includes('hover')) {
        hideTooltip();
      }
    };

    const handleFocus = () => {
      if (triggers.includes('focus')) {
        showTooltip();
      }
    };

    const handleBlur = () => {
      if (triggers.includes('focus')) {
        hideTooltip();
      }
    };

    const handleClick = () => {
      if (triggers.includes('click')) {
        toggleTooltip();
      }
    };

    return (
      <div
        ref={triggerRef}
        className={`tooltip-wrapper ${className}`}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
      >
        {children}
        {visible && (
          <div
            ref={tooltipRef}
            className={`tooltip tooltip-${position}`}
            role="tooltip"
            style={{ maxWidth }}
          >
            <div className="tooltip-arrow" />
            <div className="tooltip-content">{content}</div>
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

/* ==========================================================================
   信息提示图标
   ========================================================================== */

interface InfoTooltipProps {
  content: React.ReactNode;
  maxWidth?: number;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = memo(
  ({ content, maxWidth = 300 }) => {
    return (
      <Tooltip
        content={content}
        position="right"
        trigger={['hover', 'focus']}
        maxWidth={maxWidth}
      >
        <span className="info-tooltip-trigger" aria-label="更多信息">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
            />
          </svg>
        </span>
      </Tooltip>
    );
  }
);

InfoTooltip.displayName = 'InfoTooltip';
