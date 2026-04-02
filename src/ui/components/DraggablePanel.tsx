/**
 * =============================================================================
 * DraggablePanel - 可拖拽面板容器
 * 支持层级管理、动画、最小化、拖拽功能
 * =============================================================================
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  memo,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { usePanelStore, type PanelId } from '../../stores/panelStore';

export interface DraggablePanelProps {
  id: PanelId;
  title: string;
  icon?: string;
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  showMinimize?: boolean;
  showMaximize?: boolean;
  resizable?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  headerRight?: ReactNode;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = memo(({
  id,
  title,
  icon,
  children,
  defaultPosition,
  defaultSize,
  minWidth = 300,
  minHeight = 200,
  maxWidth = 800,
  maxHeight = 900,
  className = '',
  showMinimize = true,
  showMaximize = false,
  resizable = true,
  onClose,
  onMinimize,
  headerRight,
}) => {
  const panelState = usePanelStore((state) => state.panels.get(id));
  const openPanel = usePanelStore((state) => state.openPanel);
  const closePanel = usePanelStore((state) => state.closePanel);
  const minimizePanel = usePanelStore((state) => state.minimizePanel);
  const bringToFront = usePanelStore((state) => state.bringToFront);
  const setPanelPosition = usePanelStore((state) => state.setPanelPosition);
  const setPanelSize = usePanelStore((state) => state.setPanelSize);
  const activePanelId = usePanelStore((state) => state.activePanelId);

  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });

  const isOpen = panelState?.isOpen ?? false;
  const isMinimized = panelState?.isMinimized ?? false;
  const zIndex = panelState?.zIndex ?? 100;
  const animationState = panelState?.animationState ?? 'closed';
  const position = panelState?.position ?? defaultPosition ?? { x: 100, y: 80 };
  const size = panelState?.size ?? defaultSize ?? { width: 400, height: 500 };
  const isActive = activePanelId === id;

  useEffect(() => {
    if (isOpen && !panelState) {
      openPanel(id, {
        position: defaultPosition,
        size: defaultSize,
      });
    }
  }, [id, isOpen, panelState, openPanel, defaultPosition, defaultSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.panel-header')) {
      bringToFront(id);
    }
  }, [bringToFront, id]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.panel-controls')) return;
    
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    bringToFront(id);
  }, [position, bringToFront, id]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));
    
    setPanelPosition(id, { x: newX, y: newY });
  }, [isDragging, size.width, setPanelPosition, id]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      left: position.x,
      top: position.y,
    };
    bringToFront(id);
  }, [size, position, bringToFront, id]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStart.current.x;
    const deltaY = e.clientY - resizeStart.current.y;
    
    let newWidth = resizeStart.current.width;
    let newHeight = resizeStart.current.height;
    let newX = resizeStart.current.left;
    let newY = resizeStart.current.top;
    
    if (resizeDirection.includes('e')) {
      newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.current.width + deltaX));
    }
    if (resizeDirection.includes('w')) {
      const possibleWidth = resizeStart.current.width - deltaX;
      if (possibleWidth >= minWidth && possibleWidth <= maxWidth) {
        newWidth = possibleWidth;
        newX = resizeStart.current.left + deltaX;
      }
    }
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.current.height + deltaY));
    }
    if (resizeDirection.includes('n')) {
      const possibleHeight = resizeStart.current.height - deltaY;
      if (possibleHeight >= minHeight && possibleHeight <= maxHeight) {
        newHeight = possibleHeight;
        newY = resizeStart.current.top + deltaY;
      }
    }
    
    setPanelSize(id, { width: newWidth, height: newHeight });
    setPanelPosition(id, { x: newX, y: newY });
  }, [isResizing, resizeDirection, minWidth, minHeight, maxWidth, maxHeight, setPanelSize, setPanelPosition, id]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection('');
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const handleClose = useCallback(() => {
    closePanel(id);
    onClose?.();
  }, [closePanel, id, onClose]);

  const handleMinimize = useCallback(() => {
    minimizePanel(id);
    onMinimize?.();
  }, [minimizePanel, id, onMinimize]);

  const animationClass = `panel-animation-${animationState}`;
  const activeClass = isActive ? 'panel-active' : '';
  const draggingClass = isDragging ? 'panel-dragging' : '';
  const resizingClass = isResizing ? 'panel-resizing' : '';

  const panelStyle: CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: size.width,
    height: isMinimized ? 'auto' : size.height,
    zIndex,
  };

  if (!isOpen || isMinimized) return null;

  const content = (
    <div
      ref={panelRef}
      className={`draggable-panel ${animationClass} ${activeClass} ${draggingClass} ${resizingClass} ${className}`}
      style={panelStyle}
      onMouseDown={handleMouseDown}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`panel-title-${id}`}
    >
      <div className="panel-header" onMouseDown={handleDragStart}>
        <div className="panel-title-area">
          {icon && <span className="panel-icon">{icon}</span>}
          <h3 id={`panel-title-${id}`} className="panel-title">{title}</h3>
        </div>
        <div className="panel-controls">
          {headerRight}
          {showMinimize && (
            <button
              className="panel-control-btn minimize-btn"
              onClick={handleMinimize}
              aria-label="最小化"
              title="最小化"
            >
              <svg viewBox="0 0 12 12" width="12" height="12">
                <rect x="2" y="5" width="8" height="2" fill="currentColor" />
              </svg>
            </button>
          )}
          {showMaximize && (
            <button
              className="panel-control-btn maximize-btn"
              aria-label="最大化"
              title="最大化"
            >
              <svg viewBox="0 0 12 12" width="12" height="12">
                <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          )}
          <button
            className="panel-control-btn close-btn"
            onClick={handleClose}
            aria-label="关闭"
            title="关闭"
          >
            <svg viewBox="0 0 12 12" width="12" height="12">
              <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="panel-body">
        {children}
      </div>

      {resizable && (
        <>
          <div className="resize-handle resize-n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="resize-handle resize-w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="resize-handle resize-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="resize-handle resize-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="resize-handle resize-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
        </>
      )}
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return null;
});

DraggablePanel.displayName = 'DraggablePanel';
