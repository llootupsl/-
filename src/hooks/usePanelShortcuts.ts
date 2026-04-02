/**
 * =============================================================================
 * usePanelShortcuts - 面板快捷键管理
 * 支持全局快捷键打开/关闭面板
 * =============================================================================
 */

import { useEffect, useCallback, useState } from 'react';
import { usePanelStore, type PanelId } from '../stores/panelStore';
import { eventCleanupManager } from '@/core/EventCleanupManager';

export interface PanelShortcut {
  key: string;
  panelId: PanelId | 'escape' | 'minimizeAll' | 'restoreAll';
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}

const DEFAULT_SHORTCUTS: PanelShortcut[] = [
  { key: 'c', panelId: 'citizen', description: '市民面板' },
  { key: 'd', panelId: 'divine', description: '神力面板' },
  { key: 'g', panelId: 'dao', description: '治理面板' },
  { key: 'r', panelId: 'resource', description: '资源面板' },
  { key: 'n', panelId: 'narrative', description: '日志面板' },
  { key: 'e', panelId: 'epoch', description: '纪元面板' },
  { key: 's', panelId: 'settings', description: '设置面板' },
  { key: 'a', panelId: 'ai', description: 'AI配置' },
  { key: 't', panelId: 'chat', description: '聊天面板' },
  { key: 'b', panelId: 'eightChars', description: '八字命理' },
  { key: 'm', panelId: 'systemStatus', description: '系统状态' },
  { key: 'h', panelId: 'help', description: '帮助面板' },
  { key: 'Escape', panelId: 'escape', description: '关闭当前面板' },
  { key: 'm', panelId: 'minimizeAll', ctrl: true, description: '最小化所有面板' },
  { key: 'r', panelId: 'restoreAll', ctrl: true, description: '恢复所有面板' },
];

export function usePanelShortcuts(shortcuts: PanelShortcut[] = DEFAULT_SHORTCUTS) {
  const togglePanel = usePanelStore((state) => state.togglePanel);
  const closePanel = usePanelStore((state) => state.closePanel);
  const minimizeAllPanels = usePanelStore((state) => state.minimizeAllPanels);
  const restoreAllMinimized = usePanelStore((state) => state.restoreAllMinimized);
  const activePanelId = usePanelStore((state) => state.activePanelId);
  const closeAllPanels = usePanelStore((state) => state.closeAllPanels);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement).isContentEditable
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() ||
                       e.key === shortcut.key;
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();

        if (shortcut.panelId === 'escape') {
          if (activePanelId) {
            closePanel(activePanelId);
          }
        } else if (shortcut.panelId === 'minimizeAll') {
          minimizeAllPanels();
        } else if (shortcut.panelId === 'restoreAll') {
          restoreAllMinimized();
        } else {
          togglePanel(shortcut.panelId);
        }
        
        return;
      }
    }
  }, [shortcuts, togglePanel, closePanel, minimizeAllPanels, restoreAllMinimized, activePanelId]);

  useEffect(() => {
    const cleanup = eventCleanupManager.register(window, 'keydown', handleKeyDown);
    return cleanup;
  }, [handleKeyDown]);

  return {
    shortcuts,
    getShortcutHelp: () => shortcuts.map(s => ({
      key: s.key.toUpperCase(),
      modifiers: [
        s.ctrl ? 'Ctrl' : null,
        s.shift ? 'Shift' : null,
        s.alt ? 'Alt' : null,
      ].filter(Boolean).join('+'),
      description: s.description,
    })),
  };
}

export function usePanelKeyboardHelp() {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleHelpKey = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
    };

    const cleanup = eventCleanupManager.register(window, 'keydown', handleHelpKey);
    return cleanup;
  }, []);

  return { showHelp, setShowHelp };
}
