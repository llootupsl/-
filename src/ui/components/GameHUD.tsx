/**
 * =============================================================================
 * GameHUD 游戏 HUD - 统一控制面板
 * =============================================================================
 */

import React, { useState, useCallback, memo } from 'react';
import { ResourcePanel, useResources } from './ResourcePanel';
import { NarrativePanel, useNarrative } from './NarrativePanel';
import { MiniMap } from './MiniMap';

/* ==========================================================================
   类型定义
   ========================================================================== */

export interface GameHUDProps {
  className?: string;
  onResourceClick?: (resource: any) => void;
  onNarrativeClick?: (entry: any) => void;
}

export type HUDTab = 'resources' | 'narrative' | 'citizens' | 'divine' | 'settings';

/* ==========================================================================
   组件实现
   ========================================================================== */

export const GameHUD: React.FC<GameHUDProps> = memo(
  ({ className = '', onResourceClick, onNarrativeClick }) => {
    const [activeTab, setActiveTab] = useState<HUDTab>('resources');
    const [expanded, setExpanded] = useState(true);
    const { resources } = useResources();
    const { entries } = useNarrative();

    const tabs: { key: HUDTab; icon: string; label: string }[] = [
      { key: 'resources', icon: '📦', label: '资源' },
      { key: 'narrative', icon: '📜', label: '日志' },
      { key: 'citizens', icon: '👥', label: '市民' },
      { key: 'divine', icon: '✨', label: '神力' },
      { key: 'settings', icon: '⚙️', label: '设置' },
    ];

    const handleToggle = useCallback(() => {
      setExpanded((prev) => !prev);
    }, []);

    return (
      <div className={`game-hud ${expanded ? 'expanded' : 'collapsed'} ${className}`}>
        {/* 侧边栏 */}
        <div className="hud-sidebar">
          <div className="hud-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`hud-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                title={tab.label}
              >
                <span className="hud-tab-icon">{tab.icon}</span>
              </button>
            ))}
          </div>
          <button className="hud-collapse-btn" onClick={handleToggle} aria-expanded={expanded}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d={expanded
                  ? "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                  : "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
                }
              />
            </svg>
          </button>
        </div>

        {/* 主面板 */}
        {expanded && (
          <div className="hud-main">
            {activeTab === 'resources' && (
              <ResourcePanel
                resources={resources}
                onResourceClick={onResourceClick}
              />
            )}
            {activeTab === 'narrative' && (
              <NarrativePanel
                entries={entries}
                onEntryClick={onNarrativeClick}
              />
            )}
            {activeTab === 'citizens' && (
              <div className="hud-placeholder">
                <div className="placeholder-icon">👥</div>
                <div className="placeholder-text">市民管理面板</div>
              </div>
            )}
            {activeTab === 'divine' && (
              <div className="hud-placeholder">
                <div className="placeholder-icon">✨</div>
                <div className="placeholder-text">神力干预系统</div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="hud-placeholder">
                <div className="placeholder-icon">⚙️</div>
                <div className="placeholder-text">游戏设置</div>
              </div>
            )}
          </div>
        )}

        {/* 小地图 */}
        <div className="hud-minimap">
          <MiniMap />
        </div>
      </div>
    );
  }
);

GameHUD.displayName = 'GameHUD';
