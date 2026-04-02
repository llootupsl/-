/**
 * 游戏主视图组件
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore, useGamePhase, useResources, useEntropy, useEmotion, useCitizenStats, useTime, useNarrative, useWarnings } from '@/store/gameStore';
import { ModeConfig } from './ModeSelect';

const EPOCH_COLORS: Record<string, string> = {
  '黄金时代': 'var(--color-epoch-golden)',
  '稳定时代': 'var(--color-epoch-stable)',
  '压力时代': 'var(--color-epoch-pressure)',
  '危机时代': 'var(--color-epoch-crisis)',
  '崩溃边缘': 'var(--color-epoch-collapse)',
  '熵增纪元': 'var(--color-entropy)',
};

export interface GameViewProps {
  currentMode: ModeConfig;
  onBack: () => void;
  onOpenChat: () => void;
  onOpenEightChars: () => void;
  onOpenDivine: () => void;
  onOpenCitizen: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  currentMode,
  onBack,
  onOpenChat,
  onOpenEightChars,
  onOpenDivine,
  onOpenCitizen,
}) => {
  const phase = useGamePhase();
  const resources = useResources();
  const entropy = useEntropy();
  const emotion = useEmotion();
  const citizenStats = useCitizenStats();
  const time = useTime();
  const narrative = useNarrative();
  const warnings = useWarnings();
  const gameStore = useGameStore();

  const epoch = useMemo(() => {
    if (entropy < 15) return '黄金时代';
    if (entropy < 35) return '稳定时代';
    if (entropy < 55) return '压力时代';
    if (entropy < 75) return '危机时代';
    if (entropy < 90) return '崩溃边缘';
    return '熵增纪元';
  }, [entropy]);

  const epochColor = EPOCH_COLORS[epoch] || 'var(--color-epoch-stable)';

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
          <button className="icon-btn" onClick={onOpenEightChars} aria-label="八字命理">🎯</button>
          <button className="icon-btn" onClick={onOpenChat} aria-label="聊天">💬</button>
          <span className="fps-badge">{fps} FPS</span>
        </div>
      </header>

      {(warnings.resourceDepleted.length > 0 || warnings.criticalEntropy || warnings.populationZero) && (
        <div className="global-warning-banner">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <div className="warning-messages">
              {warnings.resourceDepleted.length > 0 && (
                <span className="warning-text">资源耗尽: {warnings.resourceDepleted.join(', ')}</span>
              )}
              {warnings.criticalEntropy && (
                <span className="warning-text critical">熵值已达临界点!</span>
              )}
              {warnings.populationZero && (
                <span className="warning-text critical">文明灭绝!</span>
              )}
            </div>
            <button className="warning-dismiss" onClick={() => gameStore.clearWarning('resourceDepleted')}>
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="game-main">
        <div className="epoch-display">
          <span className="epoch-icon">⏳</span>
          <span className="epoch-name" style={{ color: epochColor }}>{epoch}</span>
        </div>

        {citizenStats.total === 0 && phase === 'running' ? (
          <div className="empty-citizen-warning">
            <div className="warning-icon">👥</div>
            <div className="warning-title">文明尚未诞生</div>
            <div className="warning-desc">使用神力创造第一批市民，开启你的文明之旅</div>
            <button className="warning-action" onClick={onOpenDivine}>
              ✨ 开启神力
            </button>
          </div>
        ) : (
          <div className="resource-overview">
            <div className="resource-item">
              <span className="resource-icon">👥</span>
              <span className="resource-value">{citizenStats.total.toLocaleString()}</span>
              <span className="resource-label">市民总数</span>
            </div>
            <div className="resource-item">
              <span className="resource-icon">⚡</span>
              <span className="resource-value" style={{ color: resources.coreEnergy < 100 ? '#ef4444' : undefined }}>
                {resources.coreEnergy.toFixed(1)}
              </span>
              <span className="resource-label">核心能源</span>
              {resources.coreEnergy < 100 && <span className="resource-alert">⚠️</span>}
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
        )}

        <div className="entropy-bar-container">
          <div className="entropy-bar-label">宇宙熵值</div>
          <div className="entropy-bar" role="progressbar" aria-valuenow={Math.round(entropy)} aria-valuemin={0} aria-valuemax={100}>
            <div className="entropy-fill" style={{ width: `${entropy}%`, backgroundColor: epochColor }} />
          </div>
        </div>

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

        <nav className="quick-panel">
          <button className="quick-btn" onClick={onOpenCitizen}>👥 市民</button>
          <button className="quick-btn" onClick={onOpenDivine}>✨ 神力</button>
          <button className="quick-btn" onClick={() => gameStore.togglePanel('dao')}>📜 治理</button>
          <button className="quick-btn" onClick={() => gameStore.togglePanel('resource')}>📊 资源</button>
        </nav>
      </main>

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
        .icon-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
        .fps-badge {
          font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-success);
          background: rgba(16,185,129,0.1); padding: 0.25rem 0.5rem; border-radius: 4px;
        }
        .global-warning-banner {
          background: linear-gradient(90deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05));
          border-bottom: 1px solid rgba(239,68,68,0.3);
          padding: 0.5rem 1rem;
        }
        .warning-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .warning-content .warning-icon {
          font-size: 1.25rem;
          margin-bottom: 0;
          opacity: 1;
        }
        .warning-messages {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .warning-text {
          font-size: 0.8rem;
          color: #fbbf24;
          padding: 0.25rem 0.5rem;
          background: rgba(251,191,36,0.1);
          border-radius: 4px;
        }
        .warning-text.critical {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
          font-weight: 600;
        }
        .warning-dismiss {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 4px;
          color: #ef4444;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        .warning-dismiss:hover {
          background: rgba(239,68,68,0.2);
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
          position: relative;
        }
        .resource-icon { font-size: 1.5rem; }
        .resource-value { font-family: var(--font-mono); font-size: 1.25rem; font-weight: 600; }
        .resource-label { font-size: 0.7rem; color: var(--color-text-muted); }
        .resource-alert {
          position: absolute; top: 0.5rem; right: 0.5rem;
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .empty-citizen-warning {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 2rem; margin-bottom: 1.5rem;
          background: rgba(10,10,18,0.8);
          border: 1px dashed rgba(0,240,255,0.3); border-radius: 12px;
          text-align: center;
        }
        .warning-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
        .warning-title { font-family: var(--font-display); font-size: 1.25rem; color: var(--color-primary); margin-bottom: 0.5rem; }
        .warning-desc { font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1rem; }
        .warning-action {
          padding: 0.75rem 1.5rem; background: rgba(0,240,255,0.1);
          border: 1px solid var(--color-primary); border-radius: 8px;
          color: var(--color-primary); font-size: 0.9rem; cursor: pointer;
          transition: all 0.2s;
        }
        .warning-action:hover { background: rgba(0,240,255,0.2); }
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
        .quick-btn:hover, .quick-btn:focus-visible {
          background: rgba(0,240,255,0.1); border-color: var(--color-primary);
          color: var(--color-primary);
        }
        .quick-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
        @media (max-width: 768px) {
          .resource-overview { grid-template-columns: repeat(2, 1fr); }
          .emotion-overview { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .icon-btn, .warning-action, .quick-btn {
            transition: none !important;
          }
          .resource-alert {
            animation: none !important;
          }
          .entropy-fill, .emotion-fill {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GameView;
