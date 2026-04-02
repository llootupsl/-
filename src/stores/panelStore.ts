/**
 * =============================================================================
 * PanelStore - 面板状态管理
 * 统一管理所有面板的层级、动画、最小化状态
 * =============================================================================
 */

import { create } from 'zustand';

export type PanelId = 
  | 'citizen' 
  | 'divine' 
  | 'dao' 
  | 'resource' 
  | 'narrative' 
  | 'epoch' 
  | 'settings' 
  | 'ai' 
  | 'chat' 
  | 'eightChars' 
  | 'systemStatus'
  | 'help';

export interface PanelState {
  id: PanelId;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  animationState: 'closed' | 'opening' | 'open' | 'closing' | 'minimizing' | 'minimized' | 'restoring';
}

interface PanelManagerState {
  panels: Map<PanelId, PanelState>;
  baseZIndex: number;
  maxZIndex: number;
  minimizedPanels: PanelId[];
  activePanelId: PanelId | null;
  
  openPanel: (id: PanelId, options?: Partial<PanelState>) => void;
  closePanel: (id: PanelId) => void;
  minimizePanel: (id: PanelId) => void;
  restorePanel: (id: PanelId) => void;
  bringToFront: (id: PanelId) => void;
  togglePanel: (id: PanelId) => void;
  closeAllPanels: () => void;
  minimizeAllPanels: () => void;
  restoreAllMinimized: () => void;
  setPanelPosition: (id: PanelId, position: { x: number; y: number }) => void;
  setPanelSize: (id: PanelId, size: { width: number; height: number }) => void;
  getPanelState: (id: PanelId) => PanelState | undefined;
  isPanelOpen: (id: PanelId) => boolean;
  isPanelMinimized: (id: PanelId) => boolean;
}

const DEFAULT_PANEL_POSITIONS: Record<PanelId, { x: number; y: number }> = {
  citizen: { x: 100, y: 80 },
  divine: { x: 150, y: 120 },
  dao: { x: 200, y: 100 },
  resource: { x: 80, y: 60 },
  narrative: { x: 120, y: 140 },
  epoch: { x: 180, y: 90 },
  settings: { x: 250, y: 150 },
  ai: { x: 220, y: 130 },
  chat: { x: 300, y: 100 },
  eightChars: { x: 280, y: 120 },
  systemStatus: { x: 160, y: 80 },
  help: { x: 200, y: 60 },
};

const DEFAULT_PANEL_SIZES: Record<PanelId, { width: number; height: number }> = {
  citizen: { width: 420, height: 600 },
  divine: { width: 400, height: 550 },
  dao: { width: 450, height: 650 },
  resource: { width: 350, height: 400 },
  narrative: { width: 380, height: 450 },
  epoch: { width: 400, height: 500 },
  settings: { width: 500, height: 600 },
  ai: { width: 480, height: 550 },
  chat: { width: 400, height: 500 },
  eightChars: { width: 420, height: 580 },
  systemStatus: { width: 380, height: 480 },
  help: { width: 450, height: 550 },
};

const createDefaultPanelState = (id: PanelId): PanelState => ({
  id,
  isOpen: false,
  isMinimized: false,
  zIndex: 100,
  position: DEFAULT_PANEL_POSITIONS[id] || { x: 100, y: 100 },
  size: DEFAULT_PANEL_SIZES[id] || { width: 400, height: 500 },
  animationState: 'closed',
});

export const usePanelStore = create<PanelManagerState>((set, get) => ({
  panels: new Map(),
  baseZIndex: 100,
  maxZIndex: 100,
  minimizedPanels: [],
  activePanelId: null,

  openPanel: (id, options) => {
    set((state) => {
      const newPanels = new Map(state.panels);
      const existingPanel = newPanels.get(id);
      const newZIndex = state.maxZIndex + 1;
      
      const panelState: PanelState = existingPanel
        ? {
            ...existingPanel,
            isOpen: true,
            isMinimized: false,
            zIndex: newZIndex,
            animationState: 'opening',
            ...options,
          }
        : {
            ...createDefaultPanelState(id),
            isOpen: true,
            zIndex: newZIndex,
            animationState: 'opening',
            ...options,
          };
      
      newPanels.set(id, panelState);
      
      setTimeout(() => {
        set((s) => {
          const updatedPanels = new Map(s.panels);
          const panel = updatedPanels.get(id);
          if (panel && panel.animationState === 'opening') {
            updatedPanels.set(id, { ...panel, animationState: 'open' });
          }
          return { panels: updatedPanels };
        });
      }, 300);
      
      return {
        panels: newPanels,
        maxZIndex: newZIndex,
        activePanelId: id,
        minimizedPanels: state.minimizedPanels.filter((pId) => pId !== id),
      };
    });
  },

  closePanel: (id) => {
    set((state) => {
      const newPanels = new Map(state.panels);
      const panel = newPanels.get(id);
      
      if (!panel) return state;
      
      newPanels.set(id, { ...panel, animationState: 'closing' });
      
      setTimeout(() => {
        set((s) => {
          const updatedPanels = new Map(s.panels);
          const p = updatedPanels.get(id);
          if (p) {
            updatedPanels.set(id, {
              ...p,
              isOpen: false,
              isMinimized: false,
              animationState: 'closed',
            });
          }
          return { panels: updatedPanels };
        });
      }, 300);
      
      return {
        panels: newPanels,
        activePanelId: state.activePanelId === id ? null : state.activePanelId,
        minimizedPanels: state.minimizedPanels.filter((pId) => pId !== id),
      };
    });
  },

  minimizePanel: (id) => {
    set((state) => {
      const newPanels = new Map(state.panels);
      const panel = newPanels.get(id);
      
      if (!panel || !panel.isOpen) return state;
      
      newPanels.set(id, { ...panel, animationState: 'minimizing' });
      
      setTimeout(() => {
        set((s) => {
          const updatedPanels = new Map(s.panels);
          const p = updatedPanels.get(id);
          if (p) {
            updatedPanels.set(id, {
              ...p,
              isMinimized: true,
              animationState: 'minimized',
            });
          }
          return { panels: updatedPanels };
        });
      }, 250);
      
      const minimizedPanels = state.minimizedPanels.includes(id)
        ? state.minimizedPanels
        : [...state.minimizedPanels, id];
      
      return {
        panels: newPanels,
        minimizedPanels,
        activePanelId: state.activePanelId === id ? null : state.activePanelId,
      };
    });
  },

  restorePanel: (id) => {
    set((state) => {
      const newPanels = new Map(state.panels);
      const panel = newPanels.get(id);
      
      if (!panel || !panel.isMinimized) return state;
      
      const newZIndex = state.maxZIndex + 1;
      newPanels.set(id, {
        ...panel,
        isMinimized: false,
        zIndex: newZIndex,
        animationState: 'restoring',
      });
      
      setTimeout(() => {
        set((s) => {
          const updatedPanels = new Map(s.panels);
          const p = updatedPanels.get(id);
          if (p && p.animationState === 'restoring') {
            updatedPanels.set(id, { ...p, animationState: 'open' });
          }
          return { panels: updatedPanels };
        });
      }, 250);
      
      return {
        panels: newPanels,
        maxZIndex: newZIndex,
        activePanelId: id,
        minimizedPanels: state.minimizedPanels.filter((pId) => pId !== id),
      };
    });
  },

  bringToFront: (id) => {
    set((state) => {
      const newPanels = new Map(state.panels);
      const panel = newPanels.get(id);
      
      if (!panel || !panel.isOpen || panel.isMinimized) return state;
      
      const newZIndex = state.maxZIndex + 1;
      newPanels.set(id, { ...panel, zIndex: newZIndex });
      
      return {
        panels: newPanels,
        maxZIndex: newZIndex,
        activePanelId: id,
      };
    });
  },

  togglePanel: (id) => {
    const state = get();
    const panel = state.panels.get(id);
    
    if (!panel || !panel.isOpen) {
      state.openPanel(id);
    } else if (panel.isMinimized) {
      state.restorePanel(id);
    } else {
      state.closePanel(id);
    }
  },

  closeAllPanels: () => {
    set((state) => {
      const newPanels = new Map(state.panels);
      
      newPanels.forEach((panel, id) => {
        if (panel.isOpen) {
          newPanels.set(id, { ...panel, animationState: 'closing' });
          setTimeout(() => {
            set((s) => {
              const updatedPanels = new Map(s.panels);
              const p = updatedPanels.get(id);
              if (p) {
                updatedPanels.set(id, {
                  ...p,
                  isOpen: false,
                  isMinimized: false,
                  animationState: 'closed',
                });
              }
              return { panels: updatedPanels };
            });
          }, 300);
        }
      });
      
      return {
        panels: newPanels,
        activePanelId: null,
        minimizedPanels: [],
      };
    });
  },

  minimizeAllPanels: () => {
    const state = get();
    state.panels.forEach((panel, id) => {
      if (panel.isOpen && !panel.isMinimized) {
        state.minimizePanel(id);
      }
    });
  },

  restoreAllMinimized: () => {
    const state = get();
    state.minimizedPanels.forEach((id) => {
      state.restorePanel(id);
    });
  },

  setPanelPosition: (id, position) => {
    set((state) => {
      const newPanels = new Map(state.panels);
      const panel = newPanels.get(id);
      
      if (!panel) return state;
      
      newPanels.set(id, { ...panel, position });
      return { panels: newPanels };
    });
  },

  setPanelSize: (id, size) => {
    set((state) => {
      const newPanels = new Map(state.panels);
      const panel = newPanels.get(id);
      
      if (!panel) return state;
      
      newPanels.set(id, { ...panel, size });
      return { panels: newPanels };
    });
  },

  getPanelState: (id) => {
    return get().panels.get(id);
  },

  isPanelOpen: (id) => {
    const panel = get().panels.get(id);
    return panel?.isOpen ?? false;
  },

  isPanelMinimized: (id) => {
    const panel = get().panels.get(id);
    return panel?.isMinimized ?? false;
  },
}));

export const usePanel = (id: PanelId) => {
  const {
    openPanel,
    closePanel,
    minimizePanel,
    restorePanel,
    bringToFront,
    togglePanel,
    setPanelPosition,
    setPanelSize,
    getPanelState,
    isPanelOpen,
    isPanelMinimized,
  } = usePanelStore();
  
  const panelState = getPanelState(id);
  
  return {
    panelState,
    isOpen: isPanelOpen(id),
    isMinimized: isPanelMinimized(id),
    open: (options?: Partial<PanelState>) => openPanel(id, options),
    close: () => closePanel(id),
    minimize: () => minimizePanel(id),
    restore: () => restorePanel(id),
    bringToFront: () => bringToFront(id),
    toggle: () => togglePanel(id),
    setPosition: (position: { x: number; y: number }) => setPanelPosition(id, position),
    setSize: (size: { width: number; height: number }) => setPanelSize(id, size),
  };
};
