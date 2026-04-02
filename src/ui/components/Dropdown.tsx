/**
 * =============================================================================
 * Dropdown 下拉菜单 - 熵增时代的操作层
 * =============================================================================
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from 'react';

/* ==========================================================================
   类型定义
   ========================================================================== */

export interface DropdownOption {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactElement;
  options: DropdownOption[];
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  subMenuTrigger?: 'hover' | 'click';
}

/* ==========================================================================
   组件实现
   ========================================================================== */

export const Dropdown: React.FC<DropdownProps> = memo(
  ({
    trigger,
    options,
    placement = 'bottom-start',
    className = '',
    menuClassName = '',
    disabled = false,
    open: controlledOpen,
    onOpenChange,
    subMenuTrigger = 'hover',
  }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const [subMenuKey, setSubMenuKey] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const open = controlledOpen ?? internalOpen;

    const isOpen = open && !disabled;

    // 切换下拉菜单
    const toggleOpen = useCallback(() => {
      if (disabled) return;
      const newOpen = !open;
      setInternalOpen(newOpen);
      onOpenChange?.(newOpen);
    }, [disabled, open, onOpenChange]);

    // 关闭下拉菜单
    const close = useCallback(() => {
      setInternalOpen(false);
      setSubMenuKey(null);
      onOpenChange?.(false);
    }, [onOpenChange]);

    // 点击外部关闭
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          close();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, close]);

    // ESC 关闭
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          close();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, close]);

    // 点击选项
    const handleOptionClick = useCallback(
      (option: DropdownOption) => {
        if (option.disabled || option.divider) return;

        option.onClick?.();
        close();
      },
      [close]
    );

    // 子菜单
    const handleSubMenuEnter = useCallback((key: string) => {
      if (subMenuTrigger === 'hover') {
        setSubMenuKey(key);
      }
    }, [subMenuTrigger]);

    const handleSubMenuLeave = useCallback(() => {
      if (subMenuTrigger === 'hover') {
        setSubMenuKey(null);
      }
    }, [subMenuTrigger]);

    // 计算菜单位置
    const menuStyle = useMemo(() => {
      if (!containerRef.current || !isOpen) return {};

      const rect = containerRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let top = 0;
      let left = 0;

      if (placement.includes('bottom')) {
        top = rect.bottom;
      } else if (placement.includes('top')) {
        top = rect.top;
      }

      if (placement.includes('end') || placement === 'right') {
        left = rect.right;
      } else if (placement.includes('start') || placement === 'left') {
        left = rect.left;
      } else {
        left = rect.left;
      }

      return { top, left };
    }, [placement, isOpen]);

    // 克隆触发器
    const clonedTrigger = React.cloneElement(trigger, {
      onClick: toggleOpen,
      'aria-haspopup': 'true',
      'aria-expanded': isOpen,
    });

    return (
      <div ref={containerRef} className={`dropdown ${className}`}>
        {clonedTrigger}
        {isOpen && (
          <div
            ref={menuRef}
            className={`dropdown-menu dropdown-menu-${placement.split('-')[0]} ${menuClassName}`}
            role="menu"
            style={menuStyle}
            onMouseLeave={subMenuTrigger === 'hover' ? handleSubMenuLeave : undefined}
          >
            {options.map((option) =>
              option.divider ? (
                <div key={`divider-${option.key}`} className="dropdown-divider" />
              ) : (
                <div
                  key={option.key}
                  role="menuitem"
                  className={`dropdown-item ${option.disabled ? 'disabled' : ''} ${option.danger ? 'danger' : ''}`}
                  onClick={() => handleOptionClick(option)}
                  onMouseEnter={() => option.disabled ? undefined : handleSubMenuEnter(option.key)}
                >
                  {option.icon && (
                    <span className="dropdown-item-icon">{option.icon}</span>
                  )}
                  <span className="dropdown-item-label">{option.label}</span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

/* ==========================================================================
   下拉菜单项
   ========================================================================== */

interface DropdownItemProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
  onClick?: () => void;
}

export const DropdownItem: React.FC<DropdownItemProps> = memo(
  ({ label, icon, disabled, danger, shortcut, onClick }) => {
    return (
      <div
        role="menuitem"
        className={`dropdown-item ${disabled ? 'disabled' : ''} ${danger ? 'danger' : ''}`}
        onClick={disabled ? undefined : onClick}
      >
        {icon && <span className="dropdown-item-icon">{icon}</span>}
        <span className="dropdown-item-label">{label}</span>
        {shortcut && (
          <span className="dropdown-item-shortcut">{shortcut}</span>
        )}
      </div>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';
