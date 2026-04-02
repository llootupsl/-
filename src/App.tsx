/**
 * =============================================================================
 * OMNIS APIEN - 永夜熵纪
 * 史上最强纯前端数字文明模拟器 - 核心集成版
 * =============================================================================
 * 
 * 本版本完全集成了核心系统：
 * - gameStore: 游戏状态管理 + 游戏循环
 * - WebGPURenderer: WebGPU渲染引擎 + 实时市民位置同步
 * - AudioEngine: 音频引擎
 * - LLMManager: AI对话
 * - CitizenManager: 市民管理系统 + WASM量子/SNN决策
 * - EmotionSync: 情绪联动配色系统
 * 
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import './ui/styles/globals.css';
import { ToastContainer } from './components/ui/Toast';
import { toast } from './stores/toastStore';
import { TutorialManager, TutorialRestartButton } from './components/tutorial';
import { useTutorialStore, useShouldShowTutorial } from './stores/tutorialStore';
import { HelpPanel, HelpButton, FeatureDiscoveryManager } from './components/help';
import { useHelpStore } from './stores/helpStore';
import { errorReporter } from './utils/ErrorReporter';
import { eventCleanupManager } from '@/core/EventCleanupManager';
import { logger } from '@/core/utils/Logger';

/* ==========================================================================
   减少动画偏好检测 Hook
   ========================================================================== */

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    const cleanup = eventCleanupManager.register(mediaQuery, 'change', handleChange);
    return cleanup;
  }, []);

  return prefersReducedMotion;
}

// 核心系统导入
import { useGameStore, useGamePhase, useResources, useEntropy, useEmotion, useCitizenStats, useTime, useNarrative, usePerformanceMode } from '@/store/gameStore';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { webGPURenderer } from '@/rendering/WebGPURenderer';
import { audioEngine, SoundType } from '@/audio/AudioEngine';
import { LLMManager } from '@/ai/LLMBridge';
import { citizenManager } from '@/citizen/CitizenManager';
import { PerformanceMode } from '@/core/constants/PerformanceMode';
import { syncEmotionToUI } from '@/ui/EmotionSync';
import { GNN_CONFIG } from '@/core/constants';

// 集成子系统
import { economicSystem } from '@/economy/EconomicSystem';
import { daoSystem } from '@/governance/DAOSystem';
import { techTree } from '@/economy/TechTree';
import { socialGNN, deriveEmbeddingFromCitizen } from '@/ai/SocialGNN';
import type { EntityId } from '@/core/types';
import { RelationType } from '@/core/types/citizen';

// 稡块级变量 - GNN更新追踪
let lastGnnUpdateTime = 0;

// 导入系统状态面板组件
import SystemStatusPanel from '@/ui/components/SystemStatusPanel';

// 导入增强版加载屏幕组件
import LoadingScreen from '@/ui/components/LoadingScreen';

// 真正的系统集成 - 解决"代码尸体"问题
import { systemIntegrator } from '@/core/SystemIntegrator';
import { gnnResultApplicator, CitizenState as GNNCitizenState } from '@/core/gnn/GNNResultApplicator';
import { economicSystemBinder } from '@/core/economy/EconomicSystemBinder';

// 预加载关键组件
const HUDLayout = lazy(() => import('./ui/components/HUDLayout').then(m => ({ default: m.HUDLayout })));
const EightCharsPanel = lazy(() => import('./fortune/EightCharsPanel').then(m => ({ default: m.EightCharsPanel })));
const ChatPanel = lazy(() => import('./chat/ChatPanel').then(m => ({ default: m.ChatPanel })));
const DivinePanel = lazy(() => import('./ui/components/DivinePanel').then(m => ({ default: m.DivinePanel })));
const CitizenPanel = lazy(() => import('./ui/components/CitizenPanel').then(m => ({ default: m.CitizenPanel })));
const GameOverScreen = lazy(() => import('./ui/components/GameOverScreen').then(m => ({ default: m.GameOverScreen })));

/* ==========================================================================
   性能模式映射
   ========================================================================== */

type AppPerformanceMode = 'apex' | 'extreme' | 'balanced' | 'eco';

function toSystemMode(appMode: AppPerformanceMode): PerformanceMode {
  const map: Record<AppPerformanceMode, PerformanceMode> = {
    apex: PerformanceMode.APEX,
    extreme: PerformanceMode.EXTREME,
    balanced: PerformanceMode.BALANCED,
    eco: PerformanceMode.ECO,
  };
  return map[appMode];
}

function fromSystemMode(sysMode: PerformanceMode): AppPerformanceMode {
  const map: Record<PerformanceMode, AppPerformanceMode> = {
    [PerformanceMode.APEX]: 'apex',
    [PerformanceMode.EXTREME]: 'extreme',
    [PerformanceMode.BALANCED]: 'balanced',
    [PerformanceMode.ECO]: 'eco',
  };
  return map[sysMode];
}

/* ==========================================================================
   模式配置常量
   ========================================================================== */

interface ModeConfig {
  id: AppPerformanceMode;
  nameCN: string;
  nameEN: string;
  desc: string;
  color: string;
  particles: number;
  fps: string;
}

const MODES: ModeConfig[] = [
  { id: 'apex', nameCN: '神之领域', nameEN: 'APEX', desc: '超越物理极限，解锁宇宙法则', color: 'var(--color-mode-apex)', particles: 1000000, fps: '1000+' },
  { id: 'extreme', nameCN: '极致性能', nameEN: 'EXTREME', desc: '压榨硬件潜能，追求极致体验', color: 'var(--color-mode-extreme)', particles: 500000, fps: '240' },
  { id: 'balanced', nameCN: '均衡模式', nameEN: 'BALANCED', desc: '性能与体验的完美平衡', color: 'var(--color-mode-balanced)', particles: 100000, fps: '120' },
  { id: 'eco', nameCN: '节能模式', nameEN: 'ECO', desc: '降低资源占用，延长设备寿命', color: 'var(--color-mode-eco)', particles: 10000, fps: '30' },
];

/* ==========================================================================
   时代颜色映射
   ========================================================================== */

const EPOCH_COLORS: Record<string, string> = {
  '黄金时代': 'var(--color-epoch-golden)',
  '稳定时代': 'var(--color-epoch-stable)',
  '压力时代': 'var(--color-epoch-pressure)',
  '危机时代': 'var(--color-epoch-crisis)',
  '崩溃边缘': 'var(--color-epoch-collapse)',
  '熵增纪元': 'var(--color-entropy)',
};

/* ==========================================================================
   游戏循环 Hook
   ========================================================================== */

interface UseGameLoopOptions {
  enabled: boolean;
  onUpdate?: (deltaMs: number) => void;
}

function useGameLoop(options: UseGameLoopOptions) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const emotionSyncRef = useRef<number>(0);
  const citizenSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!options.enabled) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    const loop = (currentTime: number) => {
      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // 调用更新回调
      options.onUpdate?.(deltaMs);

      // 情绪同步（每500ms一次）
      emotionSyncRef.current += deltaMs;
      if (emotionSyncRef.current >= 500) {
        emotionSyncRef.current = 0;
        // 获取当前情绪状态并同步到UI
        const state = useGameStore.getState();
        syncEmotionToUI(
          state.emotion.hope / 100,
          state.emotion.discontent / 100,
          state.entropy / 100
        );
      }

      // 市民位置同步（每100ms一次）
      citizenSyncRef.current += deltaMs;
      if (citizenSyncRef.current >= 100) {
        citizenSyncRef.current = 0;
        // 同步市民数据到WebGPU渲染器
        const citizens = citizenManager.getAll().slice(0, 1000).map(c => ({
          id: c.id,
          position: c.position.world,
          lodLevel: c.getLODLevel(),
          visible: c.visible,
          energy: c.state.energy,
          health: c.state.health,
          mood: c.state.mood,
          neuralActivity: c.getAverageFiringRate(),
        }));
        webGPURenderer.setCitizens(citizens);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [options.enabled, options.onUpdate]);
}

/* ==========================================================================
   WebGPU 渲染画布
   ========================================================================== */

interface WebGPUCanvasProps {
  mode: ModeConfig;
  isActive: boolean;
}

const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({ mode, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isActive || !canvasRef.current || initializedRef.current) return;

    let initialized = false;

    const initAndRender = async () => {
      if (initialized) return;
      
      // 初始化 WebGPU 渲染器
      const success = await webGPURenderer.init(canvasRef.current!);
      if (success) {
        initialized = true;
        initializedRef.current = true;
        webGPURenderer.setPerformanceMode(toSystemMode(mode.id));
        
        // 获取初始市民数据
        const citizens = citizenManager.getAll().slice(0, 1000).map(c => ({
          id: c.id,
          position: c.position.world,
          lodLevel: c.getLODLevel(),
          visible: true,
          energy: c.state.energy,
          health: c.state.health,
          mood: c.state.mood,
          neuralActivity: c.getAverageFiringRate(),
        }));
        webGPURenderer.setCitizens(citizens);
        
        lastTimeRef.current = performance.now();
        render();
      } else {
        logger.warn('App', 'WebGPU 初始化失败');
      }
    };

    const render = () => {
      if (!initialized) {
        initAndRender();
        return;
      }

      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // 渲染一帧
      webGPURenderer.render(deltaTime);

      rafRef.current = requestAnimationFrame(render);
    };

    // 开始渲染循环
    initAndRender();

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (initialized) {
        webGPURenderer.dispose();
        initializedRef.current = false;
      }
    };
  }, [isActive, mode.id]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
};



/* ==========================================================================
   模式选择组件
   ========================================================================== */

interface ModeSelectProps {
  selectedMode: AppPerformanceMode;
  onSelect: (mode: AppPerformanceMode) => void;
  onStart: () => void;
  currentMode: ModeConfig;
}

const ModeSelect: React.FC<ModeSelectProps> = ({ selectedMode, onSelect, onStart, currentMode }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, mode: AppPerformanceMode, index: number) => {
    let nextIndex = index;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % MODES.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index - 1 + MODES.length) % MODES.length;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(mode);
        return;
      default:
        return;
    }
    e.preventDefault();
    const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
    buttons?.[nextIndex]?.focus();
  }, [onSelect, MODES.length]);

  return (
    <div className="mode-select-screen">
      <header className="mode-select-header">
        <div>
          <div className="header-title">OMNIS APIEN</div>
          <p className="header-subtitle">选择你的性能模式</p>
        </div>
      </header>

      <div ref={gridRef} className="mode-grid" role="listbox" aria-label="性能模式选择" aria-activedescendant={`mode-${selectedMode}`}>
        {MODES.map((mode, index) => (
          <button
            key={mode.id}
            id={`mode-${mode.id}`}
            className={`mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
            onClick={() => onSelect(mode.id)}
            onKeyDown={(e) => handleKeyDown(e, mode.id, index)}
            role="option"
            aria-selected={selectedMode === mode.id}
            tabIndex={selectedMode === mode.id ? 0 : -1}
            style={{ '--mode-color': mode.color } as React.CSSProperties}
          >
            <div className="mode-card-inner">
              <div className="mode-name">{mode.nameCN}</div>
              <div className="mode-name-en">{mode.nameEN}</div>
              <div className="mode-desc">{mode.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <button
        className="start-button"
        onClick={onStart}
        style={{ '--btn-color': currentMode.color } as React.CSSProperties}
        aria-label={`进入永夜熵纪，当前选择${currentMode.nameCN}模式`}
      >
        <span>进入永夜熵纪</span>
        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" /></svg>
      </button>
    </div>
  );
};

/* ==========================================================================
   主游戏视图组件
   ========================================================================== */

interface GameViewProps {
  currentMode: ModeConfig;
  onBack: () => void;
  onOpenChat: () => void;
  onOpenEightChars: () => void;
  onOpenDivine: () => void;
  onOpenCitizen: () => void;
  onOpenSystemStatus: () => void;
  onOpenHelp: () => void;
}

const GameView: React.FC<GameViewProps> = ({
  currentMode,
  onBack,
  onOpenChat,
  onOpenEightChars,
  onOpenDivine,
  onOpenCitizen,
  onOpenSystemStatus,
  onOpenHelp,
}) => {
  // 从 gameStore 获取真实数据
  const phase = useGamePhase();
  const resources = useResources();
  const entropy = useEntropy();
  const emotion = useEmotion();
  const citizenStats = useCitizenStats();
  const time = useTime();
  const narrative = useNarrative();
  const performanceMode = usePerformanceMode();
  const gameStore = useGameStore();

  // 计算时代
  const epoch = useMemo(() => {
    if (entropy < 15) return '黄金时代';
    if (entropy < 35) return '稳定时代';
    if (entropy < 55) return '压力时代';
    if (entropy < 75) return '危机时代';
    if (entropy < 90) return '崩溃边缘';
    return '熵增纪元';
  }, [entropy]);

  const epochColor = EPOCH_COLORS[epoch] || 'var(--color-epoch-stable)';

  // FPS计算
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(loop);
    };
    const raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="game-view">
      {/* 顶部状态栏 */}
      <header className="game-header">
        <div className="header-left">
          <button className="icon-btn" onClick={onBack} aria-label="返回主菜单">
            <span>⟵</span>
          </button>
          <span className="mode-badge" style={{ color: currentMode.color }}>{currentMode.nameCN}</span>
        </div>
        <div className="header-center">
          <div className="header-title">永夜熵纪</div>
          <div className="header-sub">
            第 {time.year} 年 第 {time.day} 天 {time.hour.toString().padStart(2, '0')}:{time.minute.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="header-right">
          <button className="icon-btn help-trigger-btn" onClick={onOpenHelp} aria-label="帮助">❓</button>
          <button className="icon-btn" onClick={onOpenEightChars} aria-label="八字命理">🎯</button>
          <button className="icon-btn" onClick={onOpenChat} aria-label="聊天">💬</button>
          <span className="fps-badge">{fps} FPS</span>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="game-main">
        {/* 时代显示 */}
        <div className="epoch-display">
          <span className="epoch-icon">⏳</span>
          <span className="epoch-name" style={{ color: epochColor }}>{epoch}</span>
        </div>

        {/* 资源概览 */}
        <div className="resource-overview">
          <div className="resource-item">
            <span className="resource-icon">👥</span>
            <span className="resource-value">{citizenStats.total.toLocaleString()}</span>
            <span className="resource-label">市民总数</span>
          </div>
          <div className="resource-item">
            <span className="resource-icon">⚡</span>
            <span className="resource-value">{resources.coreEnergy.toFixed(1)}</span>
            <span className="resource-label">核心能源</span>
          </div>
          <div className="resource-item">
            <span className="resource-icon">🌡️</span>
            <span className="resource-value" style={{ color: epochColor }}>{entropy.toFixed(1)}%</span>
            <span className="resource-label">熵值</span>
          </div>
          <div className="resource-item">
            <span className="resource-icon">💻</span>
            <span className="resource-value">{resources.computeQuota.toFixed(0)}</span>
            <span className="resource-label">算力</span>
          </div>
        </div>

        {/* 熵值进度条 */}
        <div className="entropy-bar-container">
          <div className="entropy-bar-label">宇宙熵值</div>
          <div className="entropy-bar" role="progressbar" aria-valuenow={Math.round(entropy)} aria-valuemin={0} aria-valuemax={100}>
            <div className="entropy-fill" style={{ width: `${entropy}%`, backgroundColor: epochColor }} />
          </div>
        </div>

        {/* 情感网络 */}
        <div className="emotion-overview">
          <div className="emotion-item">
            <span className="emotion-label">希望</span>
            <div className="emotion-bar">
              <div className="emotion-fill hope" style={{ width: `${emotion.hope}%` }} />
            </div>
            <span className="emotion-value">{emotion.hope.toFixed(0)}%</span>
          </div>
          <div className="emotion-item">
            <span className="emotion-label">不满</span>
            <div className="emotion-bar">
              <div className="emotion-fill discontent" style={{ width: `${emotion.discontent}%` }} />
            </div>
            <span className="emotion-value">{emotion.discontent.toFixed(0)}%</span>
          </div>
          <div className="emotion-item">
            <span className="emotion-label">暴乱风险</span>
            <div className="emotion-bar">
              <div className="emotion-fill rebellion" style={{ width: `${emotion.rebellionRisk}%` }} />
            </div>
            <span className="emotion-value">{emotion.rebellionRisk.toFixed(0)}%</span>
          </div>
        </div>

        {/* 叙事日志 */}
        <div className="narrative-panel">
          <div className="narrative-header">叙事日志</div>
          <div className="narrative-list">
            {narrative.slice(-5).reverse().map((item) => (
              <div key={item.id} className={`narrative-item ${item.type}`}>
                <span className="narrative-time">[{new Date(item.timestamp).toLocaleTimeString()}]</span>
                <span className="narrative-text">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 底部快捷面板 */}
        <nav className="quick-panel">
          <button className="quick-btn" onClick={onOpenCitizen}>👥 市民</button>
          <button className="quick-btn" onClick={onOpenDivine}>✨ 神力</button>
          <button className="quick-btn" onClick={() => gameStore.togglePanel('dao')}>📜 治理</button>
          <button className="quick-btn" onClick={() => gameStore.togglePanel('resource')}>📊 资源</button>
          <button className="quick-btn" onClick={onOpenSystemStatus}>⚙️ 系统</button>
        </nav>
      </main>

      {/* 样式 */}
      <style>{`
        .game-view {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, rgba(10,10,18,0.85), rgba(20,20,40,0.85));
        }
        .game-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(10,10,18,0.95);
          border-bottom: 1px solid rgba(0,240,255,0.2);
          z-index: 100;
        }
        .header-left, .header-right { display: flex; align-items: center; gap: 0.75rem; }
        .header-center { text-align: center; }
        .header-title { font-family: var(--font-display); font-size: 1.25rem; color: var(--color-primary); letter-spacing: 0.1em; }
        .header-sub { font-size: 0.7rem; color: var(--color-text-muted); }
        .mode-badge { font-weight: 600; font-size: 0.85rem; }
        .icon-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: 1px solid rgba(0,240,255,0.2);
          border-radius: 8px; color: var(--color-text-primary); cursor: pointer;
          transition: all 0.2s;
        }
        .icon-btn:hover { background: rgba(0,240,255,0.1); border-color: var(--color-primary); }
        .fps-badge {
          font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-success);
          background: rgba(16,185,129,0.1); padding: 0.25rem 0.5rem; border-radius: 4px;
        }
        .game-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          overflow-y: auto;
          z-index: 10;
        }
        .epoch-display {
          display: flex; align-items: center; justify-content: center;
          gap: 0.75rem; margin-bottom: 1.5rem;
        }
        .epoch-icon { font-size: 2rem; }
        .epoch-name {
          font-family: var(--font-display); font-size: 1.75rem;
          letter-spacing: 0.15em; text-shadow: 0 0 20px currentColor;
        }
        .resource-overview {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .resource-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.25rem; padding: 1rem;
          background: rgba(10,10,18,0.8);
          border: 1px solid rgba(0,240,255,0.15); border-radius: 12px;
        }
        .resource-icon { font-size: 1.5rem; }
        .resource-value { font-family: var(--font-mono); font-size: 1.25rem; font-weight: 600; }
        .resource-label { font-size: 0.7rem; color: var(--color-text-muted); }
        .entropy-bar-container { margin-bottom: 1rem; }
        .entropy-bar-label { font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.5rem; }
        .entropy-bar {
          height: 8px; background: rgba(255,255,255,0.1);
          border-radius: 4px; overflow: hidden;
        }
        .entropy-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
        .emotion-overview {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem; margin-bottom: 1rem;
        }
        .emotion-item {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem;
        }
        .emotion-label { width: 50px; color: var(--color-text-muted); }
        .emotion-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
        .emotion-fill { height: 100%; transition: width 0.3s ease; }
        .emotion-fill.hope { background: var(--color-emotion-hope); }
        .emotion-fill.discontent { background: var(--color-emotion-discontent); }
        .emotion-fill.rebellion { background: var(--color-emotion-rebellion); }
        .emotion-value { width: 35px; text-align: right; font-family: var(--font-mono); }
        .narrative-panel {
          flex: 1; min-height: 150px; margin-bottom: 1rem;
          background: rgba(10,10,18,0.6); border: 1px solid rgba(0,240,255,0.1);
          border-radius: 8px; overflow: hidden;
        }
        .narrative-header {
          padding: 0.5rem 1rem; background: rgba(0,240,255,0.05);
          border-bottom: 1px solid rgba(0,240,255,0.1);
          font-size: 0.75rem; color: var(--color-text-muted);
        }
        .narrative-list { padding: 0.5rem; max-height: 120px; overflow-y: auto; }
        .narrative-item { display: flex; gap: 0.5rem; padding: 0.25rem 0; font-size: 0.75rem; }
        .narrative-time { color: var(--color-text-muted); font-family: var(--font-mono); }
        .narrative-text { color: var(--color-text-secondary); }
        .narrative-item.event .narrative-text { color: var(--color-primary); }
        .narrative-item.achievement .narrative-text { color: var(--color-rarity-cosmic); }
        .narrative-item.divine .narrative-text { color: var(--color-rarity-mythic); }
        .quick-panel {
          display: flex; gap: 0.5rem; padding-top: 1rem;
          border-top: 1px solid rgba(0,240,255,0.1);
        }
        .quick-btn {
          flex: 1; padding: 0.75rem; background: transparent;
          border: 1px solid rgba(0,240,255,0.2); border-radius: 8px;
          color: var(--color-text-secondary); font-size: 0.85rem; cursor: pointer;
          transition: all 0.2s;
        }
        .quick-btn:hover, .quick-btn.active {
          background: rgba(0,240,255,0.1); border-color: var(--color-primary);
          color: var(--color-primary);
        }
        @media (max-width: 768px) {
          .resource-overview { grid-template-columns: repeat(2, 1fr); }
          .emotion-overview { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

/* ==========================================================================
   主应用组件
   ========================================================================== */

type AppPhase = 'loading' | 'select' | 'universe';

function App() {
  const [phase, setPhase] = useState<AppPhase>('loading');
  const [selectedMode, setSelectedMode] = useState<AppPerformanceMode>('balanced');
  const [isStarting, setIsStarting] = useState(false);
  const [showEmergencyStart, setShowEmergencyStart] = useState(false);
  
  const { 
    progress: loadProgress, 
    status: loadStatus, 
    isComplete: loadComplete,
    error: loadError,
    steps: loadSteps,
    isRetrying,
    retry: retryInitialization,
  } = useAppInitialization();

  const prefersReducedMotion = usePrefersReducedMotion();

  // UI状态
  const [showEightChars, setShowEightChars] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDivine, setShowDivine] = useState(false);
  const [showCitizen, setShowCitizen] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);  // V5修复：添加系统状态面板

  // 引导系统
  const shouldShowTutorial = useShouldShowTutorial();
  const startTutorial = useTutorialStore((s) => s.startTutorial);

  // 帮助系统
  const { isOpen: isHelpOpen, toggleHelp, closeHelp, contextualPanel } = useHelpStore();

  // gameStore
  const gameStore = useGameStore();

  const currentMode = useMemo((): ModeConfig => MODES.find((m) => m.id === selectedMode) ?? MODES[2], [selectedMode]);

  // LLM 管理器
  const [llmManager, setLlmManager] = useState<LLMManager | null>(null);

  // 设置游戏状态变化事件绑定（P0修复：双向绑定）
  const setupEventBindings = useCallback(() => {
    const handleCitizenBorn = (citizen: { id: string; name: string; needs: Record<string, unknown>; state: unknown }) => {
      economicSystemBinder.handleGameStateChange({
        source: 'population',
        type: 'citizenBorn',
        data: {
          id: citizen.id,
          needs: citizen.needs,
        },
        economicImpact: 0.1,
      });
      logger.debug('EventBinding', `Citizen born: ${citizen.id}`);
    };

    const handleCitizenDied = (citizenId: string) => {
      economicSystemBinder.handleGameStateChange({
        source: 'population',
        type: 'citizenDied',
        data: { id: citizenId },
        economicImpact: -0.1,
      });
      logger.debug('EventBinding', `Citizen died: ${citizenId}`);
    };

    const handleTechCompleted = (nodeId: string, effects: unknown[]) => {
      economicSystemBinder.handleGameStateChange({
        source: 'technology',
        type: 'techResearched',
        data: {
          id: nodeId,
          effects: effects,
        },
        economicImpact: 0.5,
      });
      logger.debug('EventBinding', `Tech completed: ${nodeId}`);
    };

    citizenManager.on('citizenBorn', handleCitizenBorn);
    citizenManager.on('citizenDied', handleCitizenDied);
    techTree.on('researchCompleted', handleTechCompleted);

    logger.debug('App', 'Event bindings established for economic system');

    return () => {
      citizenManager.off('citizenBorn', handleCitizenBorn);
      citizenManager.off('citizenDied', handleCitizenDied);
      techTree.off('researchCompleted', handleTechCompleted);
      logger.debug('App', 'Event bindings cleaned up');
    };
  }, []);

  // 游戏循环处理函数
  const handleGameUpdate = useCallback((deltaMs: number) => {
    const state = useGameStore.getState();
    if (state.phase !== 'running') return;

    // 1. 更新游戏时间
    gameStore.tick(deltaMs);

    // 2. 更新经济系统并建立双向绑定
    economicSystem.update(deltaMs);
    
    // ★★★ 关键修复：经济系统双向绑定 ★★★
    economicSystemBinder.update(deltaMs);
    
    // ★★★ 关键修复：系统集成器更新 ★★★
    systemIntegrator.update(deltaMs);
    
    // 双向同步经济资源到 gameStore
    const econResources = economicSystem.getAllResources();
    
    // 同步经济系统资源到 gameStore（真正集成）
    for (const r of econResources) {
      const resourceTypeMap: Record<string, keyof typeof state.resources> = {
        'core_energy': 'coreEnergy',
        'compute_quota': 'computeQuota',
        'biomass': 'biomass',
        'information': 'information',
        'trust': 'trust',
      };
      const mappedKey = resourceTypeMap[r.type];
      if (mappedKey) {
        const currentAmount = state.resources[mappedKey];
        const delta = r.amount - currentAmount;
        if (Math.abs(delta) > 0.01) {
          gameStore.addResource(mappedKey, delta);
        }
      }
    }
    
    // 3. 更新DAO治理系统（带错误处理）
    if (typeof daoSystem.update === 'function') {
      try {
        daoSystem.update(deltaMs);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('DAO', 'Update failed', error);
        errorReporter.report(error, 'governance', { type: 'warning', title: 'DAO系统更新失败' });
      }
    } else {
      logger.warn('DAO', 'update method not available');
    }
    
    // 4. 更新科技树系统（带错误处理）
    if (typeof techTree.update === 'function') {
      try {
        techTree.update(deltaMs);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('TechTree', 'Update failed', error);
        errorReporter.report(error, 'unknown', { type: 'warning', title: '科技树系统更新失败' });
      }
    } else {
      logger.warn('TechTree', 'update method not available');
    }
    
    // 5. 更新科技研究进度
    if (state.resources.computeQuota > 0) {
      const researchPoints = state.resources.computeQuota * 0.001 * (deltaMs / 1000);
      const completedTech = techTree.updateResearch ? techTree.updateResearch(deltaMs / 1000, researchPoints) : null;
      if (completedTech) {
        gameStore.addNarrative(`科技突破：${completedTech.name}`, 'achievement');
      }
    }

    // 6. 应用科技效果影响资源
    const techEffects = techTree.applyEffects ? techTree.applyEffects() : {};
    
    // 7. 应用DAO法律效果
    const daoModifiers = daoSystem.applyLawsToGameState ? daoSystem.applyLawsToGameState() : {};
    
    // 8. 更新GNN社会网络（周期性）并应用结果
    const GNN_UPDATE_INTERVAL = GNN_CONFIG.UPDATE_INTERVAL; // 使用配置常量
    const currentTime = Date.now();
    if (!lastGnnUpdateTime || currentTime - lastGnnUpdateTime > GNN_UPDATE_INTERVAL) {
      // 同步市民关系到GNN，同时构建市民状态映射
      const citizens = citizenManager.getAll();
      const citizenStates = new Map<string, GNNCitizenState>();
      
      for (const citizen of citizens) {
        // 从市民特征派生有意义的embedding
        const embedding = deriveEmbeddingFromCitizen({
          energy: citizen.state.energy,
          mood: citizen.state.mood,
          health: citizen.state.health,
          age: citizen.age,
          intelligence: citizen.attributes?.intelligence,
          socialStatus: citizen.attributes?.socialStatus,
          genome: Array.isArray(citizen.genome?.genes) ? citizen.genome.genes as number[] : undefined,
        });
        
        // 添加或更新节点
        socialGNN.addNode({
          id: citizen.id,
          type: 'citizen',
          features: [
            citizen.state.energy / 100,
            citizen.state.mood / 100,
            citizen.state.health / 100,
          ],
          embedding, // 使用有意义的embedding而非随机值
        });
        
        // 构建市民状态用于 GNN 结果应用
        citizenStates.set(citizen.id, {
          id: citizen.id,
          politicalAlignment: citizen.attributes?.politicalAlignment || 0.5,
          economicPreference: citizen.attributes?.economicPreference || 0.5,
          socialActivity: citizen.state.energy / 100,
          relations: new Map(
            citizen.relations.map(r => [
              r.targetId, 
              { type: r.type, strength: r.intimacy }
            ])
          ),
        });
        
        // 添加关系边（带类型安全检查）
        for (const relation of citizen.relations) {
          const validTypes = ['friend', 'family', 'work', 'trade', 'follow', 'conflict'] as const;
          const relationType = validTypes.includes(relation.type as typeof validTypes[number]) 
            ? relation.type as typeof validTypes[number]
            : 'friend';
          
          socialGNN.addEdge({
            source: citizen.id,
            target: relation.targetId,
            weight: relation.intimacy,
            type: relationType,
          });
        }
      }
      
      // 执行消息传递
      socialGNN.messagePassing(2);
      
      // ★★★ 关键修复：获取 GNN 输出并应用 ★★★
      const gnnOutput = {
        embeddings: socialGNN.getAllEmbeddings(),
        influenceScores: socialGNN.getInfluenceScores(),
        communityAssignments: socialGNN.getCommunityAssignments(),
        relationPredictions: socialGNN.getRelationPredictions(),
      };
      
      // 应用 GNN 结果到市民行为
      const behaviorMods = gnnResultApplicator.applyResults(gnnOutput, citizenStates, deltaMs);
      
      // 将行为修改应用到真实市民
      for (const mod of behaviorMods) {
        const citizen = citizenManager.getById(mod.citizenId as EntityId);
        if (!citizen) continue;
        
        for (const change of mod.changes) {
          // 应用到市民属性
          if (change.attribute === 'politicalAlignment') {
            if (!citizen.attributes) citizen.attributes = { intelligence: 0, socialStatus: 0, strength: 0, agility: 0, charisma: 0, politicalAlignment: 0.5, economicPreference: 0.5 };
            citizen.attributes.politicalAlignment = change.newValue as number;
          } else if (change.attribute === 'economicPreference') {
            if (!citizen.attributes) citizen.attributes = { intelligence: 0, socialStatus: 0, strength: 0, agility: 0, charisma: 0, politicalAlignment: 0.5, economicPreference: 0.5 };
            citizen.attributes.economicPreference = change.newValue as number;
          } else if (change.attribute === 'socialActivity') {
            citizen.state.energy = (change.newValue as number) * 100;
          } else if (change.attribute.startsWith('relations.')) {
            const targetId = change.attribute.split('.')[1];
            if (!citizen.relations) citizen.relations = [];
            const existingIndex = citizen.relations.findIndex(r => r.targetId === targetId);
            if (change.newValue === 'none' && existingIndex >= 0) {
              citizen.relations.splice(existingIndex, 1);
            } else if (existingIndex < 0 && change.newValue !== 'none') {
              // V5修复：将字符串映射到 RelationType 枚举
              const relationTypeMap: Record<string, RelationType> = {
                'friend': RelationType.FRIEND,
                'family': RelationType.FAMILY,
                'work': RelationType.WORK,
                'trade': RelationType.WORK,
                'follow': RelationType.FRIEND,
                'conflict': RelationType.ENEMY,
              };
              citizen.relations.push({
                targetId: targetId as EntityId,
                type: relationTypeMap[change.newValue as string] || RelationType.NEUTRAL,
                intimacy: 0.5,
                establishedAt: Date.now(),
              });
            }
          }
          
          // 添加叙事事件（显著变化）
          if (typeof change.newValue === 'number' && Math.abs(change.newValue - (change.oldValue as number)) > 0.1) {
            gameStore.addNarrative(
              `市民 ${citizen.id.slice(0, 8)} ${change.reason}`,
              'event'
            );
          }
        }
      }
      
      lastGnnUpdateTime = currentTime;
    }

    // 9. 更新资源（基于经济、科技、DAO效果）
    gameStore.updateResources(deltaMs);

    // 10. 更新情绪
    gameStore.updateEmotion(deltaMs);

    // 11. 同步市民统计
    gameStore.syncCitizenStats();

    // 12. 更新所有市民（包含基因系统）
    citizenManager.updateAll(deltaMs);

    // 13. 熵值更新
    const entropyDelta = deltaMs * 0.001 * (1 + state.entropy / 100);
    // 应用熵减科技效果
    const entropyReduction = (techEffects.entropyReduction || 0) + (daoModifiers.entropyRate || 0);
    gameStore.updateEntropy(entropyDelta - entropyReduction * deltaMs / 1000);

    // 14. 检查警告状态
    gameStore.checkWarnings();

    // 15. 检查游戏结束条件
    const currentState = useGameStore.getState();
    if (currentState.entropy >= 100) {
      gameStore.endGame();
    } else if (currentState.citizenStats.total === 0 && currentState.time.year > 1) {
      gameStore.endGame();
    } else if (currentState.resources.coreEnergy <= 0 && currentState.citizenStats.total > 0) {
      gameStore.endGame();
    }
  }, [gameStore]);

  // 游戏循环
  useGameLoop({
    enabled: phase === 'universe',
    onUpdate: handleGameUpdate,
  });

  // 设置事件绑定
  useEffect(() => {
    const cleanup = setupEventBindings();
    return cleanup;
  }, [setupEventBindings]);

  // 初始化完成后自动进入选择界面
  useEffect(() => {
    if (loadComplete && phase === 'loading') {
      const timer = setTimeout(() => setPhase('select'), 500);
      return () => clearTimeout(timer);
    }
  }, [loadComplete, phase]);

  // 启动兜底：如果初始化长时间卡住，允许用户进入安全启动流程
  useEffect(() => {
    if (phase !== 'loading' || loadComplete) {
      setShowEmergencyStart(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowEmergencyStart(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [phase, loadComplete]);

  const handleEmergencyStart = useCallback(() => {
    setPhase('select');
    toast.warning('已切换到安全启动模式', '你可以先进入主界面，后台模块将延迟初始化。');
  }, []);

  // 开始游戏
  const handleStart = useCallback(async () => {
    if (isStarting) return;
    if (!loadComplete) {
      toast.warning('初始化尚未完成', '请等待核心模块完成后再进入世界。');
      return;
    }
    setIsStarting(true);

    try {
      // 播放开始音效
      audioEngine.play(SoundType.BIRTH);

      // 设置性能模式
      gameStore.setPerformanceMode(selectedMode);

      // 启动创世纪
      await gameStore.startGenesis();

      // 开始播放BGM
      await audioEngine.playBGM();

      // 切换到游戏界面
      setPhase('universe');

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('App', '启动失败', err);
      
      errorReporter.report(err, 'initialization', { 
        type: 'error', 
        title: '游戏启动失败',
        additionalData: { selectedMode }
      });
      
      toast.error('启动失败', '游戏启动时发生错误，请刷新页面重试');
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, loadComplete, selectedMode, gameStore]);

  // 返回主菜单
  const handleBack = useCallback(() => {
    audioEngine.stopBGM();
    audioEngine.play(SoundType.UI_CLICK);
    setPhase('select');
  }, []);

  // 面板切换音效
  const handlePanelToggle = useCallback(() => {
    audioEngine.play(SoundType.UI_CLICK);
  }, []);

  // 引导动作处理
  const handleTutorialAction = useCallback((action: string) => {
    switch (action) {
      case 'openCitizen':
        setShowCitizen(true);
        break;
      case 'openDivine':
        setShowDivine(true);
        break;
      case 'openDAO':
        gameStore.togglePanel('dao');
        break;
    }
  }, [gameStore]);

  // 首次进入游戏时启动引导
  useEffect(() => {
    if (phase === 'universe' && shouldShowTutorial) {
      const timer = setTimeout(() => {
        startTutorial();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, shouldShowTutorial, startTutorial]);

  // 全局键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'h':
          e.preventDefault();
          toggleHelp();
          break;
        case 'c':
          if (phase === 'universe' && !showCitizen && !isHelpOpen) {
            e.preventDefault();
            setShowCitizen(true);
          }
          break;
        case 'd':
          if (phase === 'universe' && !showDivine && !isHelpOpen) {
            e.preventDefault();
            setShowDivine(true);
          }
          break;
      }
    };

    const cleanup = eventCleanupManager.register(window, 'keydown', handleKeyDown);
    return cleanup;
  }, [phase, toggleHelp, showCitizen, showDivine, isHelpOpen]);

  return (
    <div className="app">
      {/* 加载屏幕 */}
      {phase === 'loading' && (
        <LoadingScreen 
          progress={loadProgress} 
          status={loadStatus}
          steps={loadSteps}
          error={loadError}
          onRetry={retryInitialization}
          isRetrying={isRetrying}
          isComplete={loadComplete}
          allowEmergencyStart={showEmergencyStart}
          onEmergencyStart={handleEmergencyStart}
        />
      )}

      {/* 模式选择 */}
      {phase === 'select' && (
        <>
          <WebGPUCanvas mode={currentMode} isActive={false} />
          <ModeSelect
            selectedMode={selectedMode}
            onSelect={setSelectedMode}
            onStart={handleStart}
            currentMode={currentMode}
          />
        </>
      )}

      {/* 游戏视图 */}
      {phase === 'universe' && (
        <>
          {/* WebGPU 渲染层 */}
          <WebGPUCanvas mode={currentMode} isActive={true} />

          {/* 游戏UI层 */}
          <GameView
            currentMode={currentMode}
            onBack={handleBack}
            onOpenChat={() => { setShowChat(true); handlePanelToggle(); }}
            onOpenEightChars={() => { setShowEightChars(true); handlePanelToggle(); }}
            onOpenDivine={() => { setShowDivine(true); handlePanelToggle(); }}
            onOpenCitizen={() => { setShowCitizen(true); handlePanelToggle(); }}
            onOpenSystemStatus={() => { setShowSystemStatus(true); handlePanelToggle(); }}
            onOpenHelp={toggleHelp}
          />

          {/* 八字命理面板 */}
          <Suspense fallback={<div className="panel-loading">加载中...</div>}>
            {showEightChars && (
              <EightCharsPanel isOpen={showEightChars} onClose={() => setShowEightChars(false)} />
            )}
          </Suspense>

          {/* 聊天面板 */}
          {showChat && (
            <Suspense fallback={<div className="panel-loading">加载中...</div>}>
              <div className="chat-overlay">
                <ChatPanel 
                  userName="观察者" 
                  llmManager={llmManager}
                  onMessage={(msg) => logger.debug('Chat', msg.content)} 
                />
                <button className="chat-close" onClick={() => setShowChat(false)}>关闭</button>
              </div>
            </Suspense>
          )}

          {/* 神力面板 */}
          <Suspense fallback={<div className="panel-loading">加载中...</div>}>
            {showDivine && (
              <DivinePanel isOpen={showDivine} onClose={() => setShowDivine(false)} />
            )}
          </Suspense>

          {/* 市民面板 */}
          <Suspense fallback={<div className="panel-loading">加载中...</div>}>
            {showCitizen && (
              <CitizenPanel isOpen={showCitizen} onClose={() => setShowCitizen(false)} />
            )}
          </Suspense>

          {/* V5修复：系统状态面板 */}
          <SystemStatusPanel 
            isOpen={showSystemStatus}
            onClose={() => setShowSystemStatus(false)}
          />

          {/* 游戏结束界面 */}
          <Suspense fallback={null}>
            {gameStore.phase === 'gameover' && (
              <GameOverScreen
                onRestart={() => {
                  gameStore.resetGame();
                  handleStart();
                }}
                onMainMenu={() => {
                  gameStore.resetGame();
                  setPhase('select');
                }}
              />
            )}
          </Suspense>
        </>
      )}

      {/* 扫描线效果 - 尊重用户动画偏好 */}
      {!prefersReducedMotion && <div className="scanlines" aria-hidden="true" />}

      {/* Toast 通知容器 */}
      <ToastContainer />

      {/* 引导系统 */}
      <TutorialManager onAction={handleTutorialAction} />
      
      {/* 引导重新开始按钮（游戏界面右下角） */}
      {phase === 'universe' && <TutorialRestartButton />}

      {/* 帮助系统 */}
      <HelpPanel
        isOpen={isHelpOpen}
        onClose={closeHelp}
        contextPanel={contextualPanel}
      />

      {/* 功能发现气泡 */}
      {phase === 'universe' && !shouldShowTutorial && (
        <FeatureDiscoveryManager autoShow={true} />
      )}
    </div>
  );
}

export default App;
