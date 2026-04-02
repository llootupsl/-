/**
 * =============================================================================
 * NarrativePanel 叙事面板 - 熵增时代的故事
 * =============================================================================
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';

/* ==========================================================================
   类型定义
   ========================================================================== */

export type NarrativeType = 'system' | 'event' | 'achievement' | 'divine' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'cosmic' | 'transcendent';

export interface NarrativeEntry {
  id: string;
  type: NarrativeType;
  title: string;
  content: string;
  timestamp: number;
  icon?: string;
  tags?: string[];
}

interface NarrativePanelProps {
  entries: NarrativeEntry[];
  maxVisible?: number;
  onEntryClick?: (entry: NarrativeEntry) => void;
  onClear?: () => void;
  className?: string;
}

/* ==========================================================================
   常量
   ========================================================================== */

const TYPE_CONFIG: Record<NarrativeType, {
  color: string;
  label: string;
  icon: string;
}> = {
  system: { color: 'var(--color-info)', label: '系统', icon: '⚙️' },
  event: { color: 'var(--color-accent)', label: '事件', icon: '📢' },
  achievement: { color: 'var(--color-energy)', label: '成就', icon: '🏆' },
  divine: { color: 'var(--color-quantum)', label: '神谕', icon: '✨' },
  common: { color: '#888888', label: '普通', icon: '•' },
  uncommon: { color: '#00ff88', label: '优秀', icon: '◆' },
  rare: { color: '#00aaff', label: '稀有', icon: '◇' },
  epic: { color: '#aa00ff', label: '史诗', icon: '◈' },
  legendary: { color: '#ff8800', label: '传说', icon: '★' },
  mythic: { color: '#ff0088', label: '神话', icon: '✦' },
  cosmic: { color: '#ffd700', label: '宇宙', icon: '✧' },
  transcendent: { color: '#ffffff', label: '超越', icon: '⚡' },
};

/* ==========================================================================
   叙事条目组件
   ========================================================================== */

interface NarrativeItemProps {
  entry: NarrativeEntry;
  onClick?: () => void;
}

const NarrativeItem: React.FC<NarrativeItemProps> = memo(({ entry, onClick }) => {
  const config = TYPE_CONFIG[entry.type];
  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div
      className={`narrative-entry narrative-${entry.type}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="narrative-header">
        <span className="narrative-icon">{entry.icon ?? config.icon}</span>
        <span className="narrative-title">{entry.title}</span>
        <span className="narrative-badge">{config.label}</span>
      </div>
      <div className="narrative-body">{entry.content}</div>
      <div className="narrative-footer">
        <span className="narrative-time">{timeStr}</span>
        {entry.tags && entry.tags.length > 0 && (
          <div className="narrative-tags">
            {entry.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="narrative-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

NarrativeItem.displayName = 'NarrativeItem';

/* ==========================================================================
   叙事面板组件
   ========================================================================== */

export const NarrativePanel: React.FC<NarrativePanelProps> = memo(
  ({ entries, maxVisible = 50, onEntryClick, onClear, className = '' }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [filter, setFilter] = useState<NarrativeType | 'all'>('all');
    const listRef = useRef<HTMLDivElement>(null);
    const prevEntriesLengthRef = useRef(entries.length);

    const filteredEntries = filter === 'all'
      ? entries.slice(-maxVisible).reverse()
      : entries
          .filter((e) => e.type === filter)
          .slice(-maxVisible)
          .reverse();

    // 新条目自动滚动
    useEffect(() => {
      if (entries.length > prevEntriesLengthRef.current && listRef.current) {
        listRef.current.scrollTop = 0;
      }
      prevEntriesLengthRef.current = entries.length;
    }, [entries.length]);

    const handleToggle = useCallback(() => {
      setCollapsed((prev) => !prev);
    }, []);

    const handleFilterChange = useCallback((newFilter: NarrativeType | 'all') => {
      setFilter(newFilter);
    }, []);

    const typeCounts = entries.reduce(
      (acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return (
      <div className={`narrative-panel ${className}`}>
        {/* 面板头部 */}
        <div className="hud-panel-header" onClick={handleToggle}>
          <div className="hud-panel-title">
            <span>叙事日志</span>
            <span className="narrative-count">{entries.length}</span>
          </div>
          <button
            className="collapse-btn"
            aria-expanded={!collapsed}
            aria-label={collapsed ? '展开' : '收起'}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <path
                fill="currentColor"
                d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
              />
            </svg>
          </button>
        </div>

        {!collapsed && (
          <>
            {/* 过滤器 */}
            <div className="narrative-filter-bar">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                全部
              </button>
              {(['system', 'event', 'achievement', 'divine'] as NarrativeType[]).map(
                (type) => {
                  const config = TYPE_CONFIG[type];
                  return (
                    <button
                      key={type}
                      className={`filter-btn ${filter === type ? 'active' : ''}`}
                      onClick={() => handleFilterChange(type)}
                      style={{ '--filter-color': config.color } as React.CSSProperties}
                    >
                      {config.icon}
                    </button>
                  );
                }
              )}
            </div>

            {/* 叙事列表 */}
            <div className="hud-panel-content narrative-list-container" ref={listRef}>
              {filteredEntries.length === 0 ? (
                <div className="narrative-empty">暂无日志</div>
              ) : (
                <div className="narrative-list">
                  {filteredEntries.map((entry) => (
                    <NarrativeItem
                      key={entry.id}
                      entry={entry}
                      onClick={onEntryClick ? () => onEntryClick(entry) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            <div className="narrative-actions">
              <span className="narrative-summary">
                {filteredEntries.length} 条记录
              </span>
              {onClear && entries.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={onClear}>
                  清空
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
);

NarrativePanel.displayName = 'NarrativePanel';

/* ==========================================================================
   useNarrative Hook
   ========================================================================== */

export function useNarrative() {
  const [entries, setEntries] = useState<NarrativeEntry[]>([]);

  const addNarrative = useCallback((entry: Omit<NarrativeEntry, 'id' | 'timestamp'>) => {
    const newEntry: NarrativeEntry = {
      ...entry,
      id: `narrative-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    setEntries((prev) => [...prev, newEntry]);
    return newEntry.id;
  }, []);

  const removeNarrative = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearNarratives = useCallback(() => {
    setEntries([]);
  }, []);

  const addSystemNarrative = useCallback(
    (title: string, content: string) => addNarrative({ type: 'system', title, content }),
    [addNarrative]
  );

  const addEventNarrative = useCallback(
    (title: string, content: string) => addNarrative({ type: 'event', title, content }),
    [addNarrative]
  );

  const addAchievementNarrative = useCallback(
    (title: string, content: string, icon?: string) =>
      addNarrative({ type: 'achievement', title, content, icon }),
    [addNarrative]
  );

  const addDivineNarrative = useCallback(
    (title: string, content: string) => addNarrative({ type: 'divine', title, content }),
    [addNarrative]
  );

  return {
    entries,
    addNarrative,
    removeNarrative,
    clearNarratives,
    addSystemNarrative,
    addEventNarrative,
    addAchievementNarrative,
    addDivineNarrative,
  };
}
