/**
 * =============================================================================
 * MinimizedPanelBar - 最小化面板栏
 * 显示所有最小化面板的图标，支持点击恢复
 * =============================================================================
 */

import React, { memo, useCallback } from 'react';
import { usePanelStore, type PanelId } from '../../stores/panelStore';

const PANEL_INFO: Record<PanelId, { icon: string; label: string }> = {
  citizen: { icon: '👥', label: '市民' },
  divine: { icon: '✨', label: '神力' },
  dao: { icon: '📜', label: '治理' },
  resource: { icon: '📦', label: '资源' },
  narrative: { icon: '📋', label: '日志' },
  epoch: { icon: '🌀', label: '纪元' },
  settings: { icon: '⚙️', label: '设置' },
  ai: { icon: '🤖', label: 'AI配置' },
  chat: { icon: '💬', label: '聊天' },
  eightChars: { icon: '🎯', label: '八字' },
  systemStatus: { icon: '📊', label: '系统' },
  help: { icon: '❓', label: '帮助' },
};

export const MinimizedPanelBar: React.FC = memo(() => {
  const minimizedPanels = usePanelStore((state) => state.minimizedPanels);
  const restorePanel = usePanelStore((state) => state.restorePanel);
  const closePanel = usePanelStore((state) => state.closePanel);

  const handleRestore = useCallback((id: PanelId) => {
    restorePanel(id);
  }, [restorePanel]);

  const handleClose = useCallback((id: PanelId, e: React.MouseEvent) => {
    e.stopPropagation();
    closePanel(id);
  }, [closePanel]);

  if (minimizedPanels.length === 0) return null;

  return (
    <div className="minimized-panel-bar" role="toolbar" aria-label="最小化面板">
      {minimizedPanels.map((id) => {
        const info = PANEL_INFO[id] || { icon: '📄', label: id };
        return (
          <div
            key={id}
            className="minimized-panel-item"
            onClick={() => handleRestore(id)}
            role="button"
            tabIndex={0}
            aria-label={`恢复${info.label}面板`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRestore(id);
              }
            }}
          >
            <span className="minimized-panel-icon">{info.icon}</span>
            <span className="minimized-panel-label">{info.label}</span>
            <button
              className="minimized-panel-close"
              onClick={(e) => handleClose(id, e)}
              aria-label={`关闭${info.label}面板`}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
});

MinimizedPanelBar.displayName = 'MinimizedPanelBar';
