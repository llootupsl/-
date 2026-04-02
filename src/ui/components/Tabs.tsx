/**
 * =============================================================================
 * Tabs 标签页 - 信息组织层
 * =============================================================================
 */

import React, { useState, useRef, useCallback, memo } from 'react';

/* ==========================================================================
   类型定义
   ========================================================================== */

export interface Tab {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  content: React.ReactNode;
  badge?: number | string;
}

export interface TabsProps {
  tabs: Tab[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  type?: 'line' | 'card' | 'pills' | 'enclosed';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tabBarStyle?: React.CSSProperties;
  tabPosition?: 'top' | 'bottom' | 'left' | 'right';
}

/* ==========================================================================
   组件实现
   ========================================================================== */

export const Tabs: React.FC<TabsProps> = memo(
  ({
    tabs,
    defaultActiveKey,
    activeKey: controlledActiveKey,
    onChange,
    type = 'line',
    size = 'md',
    className = '',
    tabBarStyle,
    tabPosition = 'top',
  }) => {
    const [internalActiveKey, setInternalActiveKey] = useState(
      defaultActiveKey ?? tabs[0]?.key
    );

    const activeKey = controlledActiveKey ?? internalActiveKey;
    const activeTabRef = useRef<HTMLButtonElement>(null);
    const tabListRef = useRef<HTMLDivElement>(null);

    const handleTabClick = useCallback(
      (key: string, disabled?: boolean) => {
        if (disabled) return;

        if (controlledActiveKey === undefined) {
          setInternalActiveKey(key);
        }
        onChange?.(key);
      },
      [controlledActiveKey, onChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, index: number) => {
        let newIndex = index;
        const enabledTabs = tabs.filter((t) => !t.disabled);

        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            newIndex = index > 0 ? index - 1 : tabs.length - 1;
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            newIndex = index < tabs.length - 1 ? index + 1 : 0;
            break;
          case 'Home':
            e.preventDefault();
            newIndex = 0;
            break;
          case 'End':
            e.preventDefault();
            newIndex = tabs.length - 1;
            break;
          default:
            return;
        }

        const newTab = tabs[newIndex];
        if (newTab?.disabled) {
          // 找到下一个非禁用的标签
          for (let i = 0; i < tabs.length; i++) {
            const candidate = tabs[(newIndex + i) % tabs.length];
            if (!candidate.disabled) {
              handleTabClick(candidate.key, candidate.disabled);
              break;
            }
          }
        } else {
          handleTabClick(newTab.key, newTab.disabled);
        }
      },
      [tabs, handleTabClick]
    );

    const activeTab = tabs.find((t) => t.key === activeKey);

    const renderTab = (tab: Tab, index: number) => {
      const isActive = tab.key === activeKey;

      return (
        <button
          key={tab.key}
          ref={isActive ? activeTabRef : null}
          role="tab"
          id={`tab-${tab.key}`}
          aria-selected={isActive}
          aria-controls={`tabpanel-${tab.key}`}
          tabIndex={isActive ? 0 : -1}
          disabled={tab.disabled}
          className={`tab-btn tab-btn-${type} ${isActive ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
          onClick={() => handleTabClick(tab.key, tab.disabled)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span className="tab-label">{tab.label}</span>
          {tab.badge !== undefined && (
            <span className="tab-badge">
              {typeof tab.badge === 'number' && tab.badge > 99
                ? '99+'
                : tab.badge}
            </span>
          )}
        </button>
      );
    };

    return (
      <div
        className={`tabs tabs-${type} tabs-${size} tabs-${tabPosition} ${className}`}
      >
        <div
          ref={tabListRef}
          role="tablist"
          className="tab-list"
          style={tabBarStyle}
        >
          {tabs.map((tab, index) => renderTab(tab, index))}
        </div>
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab?.key}`}
          aria-labelledby={`tab-${activeTab?.key}`}
          className="tab-content"
        >
          {activeTab?.content}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

/* ==========================================================================
   Tab 内容包装器
   ========================================================================== */

interface TabPaneProps {
  children: React.ReactNode;
  className?: string;
}

export const TabPane: React.FC<TabPaneProps> = memo(({ children, className = '' }) => {
  return <div className={`tab-pane ${className}`}>{children}</div>;
});

TabPane.displayName = 'TabPane';
