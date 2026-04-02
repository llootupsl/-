/**
 * =============================================================================
 * GameOverScreen 游戏结束界面
 * =============================================================================
 */

import React, { useMemo } from 'react';
import { useGameStore, useTime, useCitizenStats, useEntropy, useGameOverReason } from '@/store/gameStore';
import { roguelikeReincarnationSystem } from '@/game/RoguelikeReincarnationSystem';

interface GameOverScreenProps {
  onRestart: () => void;
  onMainMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ onRestart, onMainMenu }) => {
  const time = useTime();
  const citizenStats = useCitizenStats();
  const entropy = useEntropy();
  const gameOverReason = useGameOverReason();
  const gameStore = useGameStore();

  const stats = useMemo(() => ({
    years: time.year,
    population: citizenStats.total,
    entropy: entropy.toFixed(1),
    achievements: gameStore.achievements.length,
    observationPoints: gameStore.observationPoints,
  }), [time.year, citizenStats.total, entropy, gameStore.achievements.length, gameStore.observationPoints]);

  const reincarnationBonus = useMemo(() => {
    const meta = roguelikeReincarnationSystem.getMetaProgression();
    return meta.currentPoints;
  }, []);

  return (
    <div className="gameover-screen" role="dialog" aria-labelledby="gameover-title">
      <div className="gameover-content">
        <div className="gameover-icon">🌌</div>
        <h1 id="gameover-title" className="gameover-title">文明终结</h1>
        <p className="gameover-reason">{gameOverReason || '熵增纪元终结'}</p>

        <div className="gameover-stats">
          <div className="stat-item">
            <span className="stat-icon">📅</span>
            <span className="stat-value">{stats.years}</span>
            <span className="stat-label">存续年数</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <span className="stat-value">{stats.population.toLocaleString()}</span>
            <span className="stat-label">最终人口</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🌡️</span>
            <span className="stat-value">{stats.entropy}%</span>
            <span className="stat-label">最终熵值</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🏆</span>
            <span className="stat-value">{stats.achievements}</span>
            <span className="stat-label">成就数量</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-icon">✨</span>
            <span className="stat-value">{reincarnationBonus}</span>
            <span className="stat-label">阿卡夏碎片</span>
          </div>
        </div>

        <div className="gameover-message">
          <p>「每一次终结，都是新轮回的起点。」</p>
          <p className="sub">阿卡夏碎片将在下一次创世纪中发挥作用...</p>
        </div>

        <div className="gameover-actions">
          <button className="action-btn primary" onClick={onRestart}>
            🔄 轮回重生
          </button>
          <button className="action-btn secondary" onClick={onMainMenu}>
            🏠 返回主菜单
          </button>
        </div>
      </div>

      <style>{`
        .gameover-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at center, rgba(20,10,30,0.95), rgba(5,5,15,0.98));
          z-index: 1000;
          animation: fadeIn 1s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .gameover-content {
          max-width: 500px;
          padding: 2.5rem;
          background: rgba(10,10,18,0.9);
          border: 1px solid rgba(139,92,246,0.3);
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 0 60px rgba(139,92,246,0.2);
        }
        .gameover-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .gameover-title {
          font-family: var(--font-display);
          font-size: 2rem;
          color: #8b5cf6;
          letter-spacing: 0.2em;
          margin: 0 0 0.5rem;
          text-shadow: 0 0 30px rgba(139,92,246,0.5);
        }
        .gameover-reason {
          font-size: 0.9rem;
          color: #ef4444;
          margin: 0 0 1.5rem;
          padding: 0.5rem 1rem;
          background: rgba(239,68,68,0.1);
          border-radius: 8px;
        }
        .gameover-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem;
          background: rgba(0,240,255,0.05);
          border: 1px solid rgba(0,240,255,0.1);
          border-radius: 8px;
        }
        .stat-item.highlight {
          grid-column: span 3;
          background: rgba(139,92,246,0.1);
          border-color: rgba(139,92,246,0.3);
        }
        .stat-icon { font-size: 1.25rem; margin-bottom: 0.25rem; }
        .stat-value { font-family: var(--font-mono); font-size: 1.25rem; font-weight: 600; color: var(--color-primary); }
        .stat-item.highlight .stat-value { color: #8b5cf6; }
        .stat-label { font-size: 0.7rem; color: var(--color-text-muted); }
        .gameover-message {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(139,92,246,0.05);
          border-radius: 8px;
        }
        .gameover-message p {
          margin: 0.25rem 0;
          font-size: 0.85rem;
          color: var(--color-text-secondary);
        }
        .gameover-message .sub {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        .gameover-actions {
          display: flex;
          gap: 1rem;
        }
        .action-btn {
          flex: 1;
          padding: 0.875rem 1.5rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn.primary {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border: none;
          color: white;
        }
        .action-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(139,92,246,0.4);
        }
        .action-btn.secondary {
          background: transparent;
          border: 1px solid rgba(0,240,255,0.3);
          color: var(--color-text-secondary);
        }
        .action-btn.secondary:hover {
          background: rgba(0,240,255,0.1);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        @media (max-width: 480px) {
          .gameover-content { padding: 1.5rem; }
          .gameover-stats { grid-template-columns: repeat(2, 1fr); }
          .stat-item.highlight { grid-column: span 2; }
          .gameover-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default GameOverScreen;
