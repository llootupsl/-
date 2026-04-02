import React, { useEffect, useMemo, useState } from 'react';
import {
  useGamePhase,
  useResources,
  useEntropy,
  useEmotion,
  useCitizenStats,
  useTime,
  useNarrative,
  useWarnings,
  useGameStore,
} from '@/store/gameStore';
import { useRuntimeStore } from '@/runtime/runtimeStore';
import type { ModeConfig } from './ModeSelect';

const EPOCH_LABELS = {
  golden: '黄金时代',
  stable: '稳定时代',
  pressure: '压力时代',
  crisis: '危机时代',
  collapse: '崩坏边缘',
  entropy: '熵增纪元',
} as const;

const EPOCH_COLORS: Record<(typeof EPOCH_LABELS)[keyof typeof EPOCH_LABELS], string> = {
  黄金时代: 'var(--color-epoch-golden)',
  稳定时代: 'var(--color-epoch-stable)',
  压力时代: 'var(--color-epoch-pressure)',
  危机时代: 'var(--color-epoch-crisis)',
  崩坏边缘: 'var(--color-epoch-collapse)',
  熵增纪元: 'var(--color-entropy)',
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
  const bootPhase = useRuntimeStore((state) => state.bootPhase);
  const runtimeTraces = useRuntimeStore((state) => state.traces);
  const runtimeSubsystems = useRuntimeStore((state) => state.subsystems);

  const epoch = useMemo(() => {
    if (entropy < 15) return EPOCH_LABELS.golden;
    if (entropy < 35) return EPOCH_LABELS.stable;
    if (entropy < 55) return EPOCH_LABELS.pressure;
    if (entropy < 75) return EPOCH_LABELS.crisis;
    if (entropy < 90) return EPOCH_LABELS.collapse;
    return EPOCH_LABELS.entropy;
  }, [entropy]);

  const [fps, setFps] = useState(0);

  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let rafId = 0;

    const loop = () => {
      frameCount += 1;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const readySubsystems = Object.values(runtimeSubsystems).filter((subsystem) => subsystem.state === 'ready');
  const degradedSubsystems = Object.values(runtimeSubsystems).filter((subsystem) => subsystem.state === 'degraded');
  const criticalSignals = runtimeTraces.slice(-3).reverse();

  return (
    <div className="world-shell">
      <header className="world-shell__topbar">
        <div className="world-shell__brand">
          <button type="button" className="world-shell__back" onClick={onBack} aria-label="Back to menu">
            返回
          </button>
          <div>
            <div className="world-shell__mode" style={{ color: currentMode.color }}>
              {currentMode.nameEN}
            </div>
            <div className="world-shell__title">文明指挥台</div>
          </div>
        </div>

        <div className="world-shell__time">
          <strong>Y{time.year} / D{time.day}</strong>
          <span>
            {String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}
          </span>
        </div>

        <div className="world-shell__runtime">
          <span>Boot</span>
          <strong>{bootPhase}</strong>
          <span>FPS</span>
          <strong>{fps}</strong>
        </div>
      </header>

      {(warnings.resourceDepleted.length > 0 || warnings.criticalEntropy || warnings.populationZero) && (
        <div className="world-shell__alert">
          <span>System Alert</span>
          <strong>
            {warnings.criticalEntropy
              ? 'Entropy is reaching a critical threshold.'
              : warnings.populationZero
                ? 'Population has collapsed.'
                : `Resources depleted: ${warnings.resourceDepleted.join(', ')}`}
          </strong>
          <button type="button" onClick={() => gameStore.clearWarning('resourceDepleted')}>
            Dismiss
          </button>
        </div>
      )}

      <main className="world-shell__content">
        <section className="world-shell__hero">
          <div className="world-shell__epoch">
            <span>Epoch</span>
            <strong style={{ color: EPOCH_COLORS[epoch] }}>{epoch}</strong>
          </div>
          <div className="world-shell__hero-copy">
            <h1>文明正在被浏览器原生能力实时编排</h1>
            <p>
              这不是静态大屏，而是一套会根据设备能力、系统装载状态和世界演化结果持续重构自己的文明控制界面。
            </p>
          </div>
          <div className="world-shell__hero-actions">
            <button type="button" onClick={onOpenCitizen}>市民层</button>
            <button type="button" onClick={onOpenDivine}>神谕层</button>
            <button type="button" onClick={onOpenChat}>运行时对话</button>
            <button type="button" onClick={onOpenEightChars}>命理系统</button>
          </div>
        </section>

        <section className="world-shell__grid">
          <article className="world-shell__card">
            <div className="world-shell__card-kicker">Civilization KPIs</div>
            <div className="world-shell__stats">
              <div>
                <span>Citizens</span>
                <strong>{citizenStats.total.toLocaleString()}</strong>
              </div>
              <div>
                <span>Core energy</span>
                <strong>{resources.coreEnergy.toFixed(0)}</strong>
              </div>
              <div>
                <span>Compute</span>
                <strong>{resources.computeQuota.toFixed(0)}</strong>
              </div>
              <div>
                <span>Entropy</span>
                <strong>{entropy.toFixed(1)}%</strong>
              </div>
            </div>
          </article>

          <article className="world-shell__card">
            <div className="world-shell__card-kicker">Emotion Mesh</div>
            <div className="world-shell__bars">
              <div>
                <label>Hope</label>
                <progress value={emotion.hope} max={100} />
                <span>{emotion.hope.toFixed(0)}%</span>
              </div>
              <div>
                <label>Discontent</label>
                <progress value={emotion.discontent} max={100} />
                <span>{emotion.discontent.toFixed(0)}%</span>
              </div>
              <div>
                <label>Rebellion risk</label>
                <progress value={emotion.rebellionRisk} max={100} />
                <span>{emotion.rebellionRisk.toFixed(0)}%</span>
              </div>
            </div>
          </article>

          <article className="world-shell__card">
            <div className="world-shell__card-kicker">Runtime Health</div>
            <div className="world-shell__stats">
              <div>
                <span>Ready systems</span>
                <strong>{readySubsystems.length}</strong>
              </div>
              <div>
                <span>Fallback paths</span>
                <strong>{degradedSubsystems.length}</strong>
              </div>
              <div>
                <span>World phase</span>
                <strong>{phase}</strong>
              </div>
              <div>
                <span>Mode focus</span>
                <strong>{currentMode.focus}</strong>
              </div>
            </div>
            <p className="world-shell__summary">
              主舞台只展示战略级信号，完整能力图谱、子系统健康度和调试控制已收纳到系统观测台。
            </p>
          </article>

          <article className="world-shell__card">
            <div className="world-shell__card-kicker">Strategic Signals</div>
            <div className="world-shell__console">
              {criticalSignals.map((trace) => (
                <div key={trace.id} className={`world-shell__console-item world-shell__console-item--${trace.severity}`}>
                  <span>{trace.stage}</span>
                  <strong>{trace.title}</strong>
                  {trace.detail && <p>{trace.detail}</p>}
                </div>
              ))}
            </div>
          </article>

          <article className="world-shell__card world-shell__card--wide">
            <div className="world-shell__card-kicker">Narrative Stream</div>
            <div className="world-shell__timeline">
              {narrative.slice(-6).reverse().map((item) => (
                <div key={item.id} className={`world-shell__console-item world-shell__console-item--${item.type}`}>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  <strong>{item.text}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>

      <style>{`
        .world-shell {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          color: var(--text-primary);
          z-index: 8;
          background: linear-gradient(180deg, rgba(3, 9, 19, 0.56), rgba(3, 9, 19, 0.18));
          backdrop-filter: blur(4px);
        }

        .world-shell__topbar,
        .world-shell__hero,
        .world-shell__card,
        .world-shell__alert {
          border: 1px solid rgba(var(--accent-rgb), 0.14);
          background: rgba(6, 14, 26, 0.78);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(16px);
        }

        .world-shell__topbar {
          margin: 1rem;
          padding: 0.95rem 1.1rem;
          border-radius: 24px;
          display: grid;
          grid-template-columns: 1.5fr auto auto;
          gap: 1rem;
          align-items: center;
        }

        .world-shell__brand {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .world-shell__back {
          border: 1px solid rgba(var(--accent-rgb), 0.18);
          border-radius: 999px;
          background: transparent;
          color: var(--text-primary);
          padding: 0.55rem 0.8rem;
          cursor: pointer;
        }

        .world-shell__mode {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 0.3rem;
        }

        .world-shell__title {
          font-family: var(--font-display);
          font-size: 1.15rem;
          letter-spacing: 0.08em;
        }

        .world-shell__time,
        .world-shell__runtime {
          display: grid;
          grid-template-columns: repeat(2, auto);
          gap: 0.35rem 0.8rem;
          align-items: center;
          font-family: var(--font-mono);
        }

        .world-shell__time span,
        .world-shell__runtime span {
          color: var(--text-muted);
          font-size: 0.74rem;
        }

        .world-shell__alert {
          margin: 0 1rem;
          border-radius: 18px;
          padding: 0.75rem 1rem;
          display: flex;
          gap: 0.9rem;
          align-items: center;
        }

        .world-shell__alert button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
        }

        .world-shell__content {
          flex: 1;
          overflow: auto;
          padding: 0 1rem 1rem;
        }

        .world-shell__hero {
          border-radius: 28px;
          padding: 1.2rem;
          margin-bottom: 1rem;
        }

        .world-shell__epoch span,
        .world-shell__card-kicker {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.35rem;
          display: block;
        }

        .world-shell__epoch strong {
          font-family: var(--font-display);
          font-size: 1.5rem;
          letter-spacing: 0.08em;
        }

        .world-shell__hero-copy h1 {
          margin: 0.7rem 0 0.5rem;
          font-size: clamp(1.6rem, 4.2vw, 3rem);
          max-width: 15ch;
        }

        .world-shell__hero-copy p,
        .world-shell__summary {
          margin: 0;
          max-width: 58ch;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .world-shell__hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
          margin-top: 1rem;
        }

        .world-shell__hero-actions button {
          border: 1px solid rgba(var(--accent-rgb), 0.18);
          border-radius: 999px;
          padding: 0.7rem 0.95rem;
          background: rgba(var(--accent-rgb), 0.08);
          color: var(--text-primary);
          cursor: pointer;
        }

        .world-shell__grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 1rem;
        }

        .world-shell__card {
          grid-column: span 6;
          border-radius: 24px;
          padding: 1rem;
        }

        .world-shell__card--wide {
          grid-column: span 12;
        }

        .world-shell__stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 0.75rem;
          margin-top: 0.8rem;
        }

        .world-shell__stats div,
        .world-shell__console-item {
          border-radius: 18px;
          background: rgba(11, 22, 40, 0.74);
          border: 1px solid rgba(var(--accent-rgb), 0.08);
          padding: 0.85rem;
        }

        .world-shell__stats span,
        .world-shell__console-item span {
          display: block;
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-bottom: 0.3rem;
        }

        .world-shell__stats strong,
        .world-shell__console-item strong {
          font-family: var(--font-mono);
        }

        .world-shell__bars {
          display: grid;
          gap: 0.7rem;
          margin-top: 0.8rem;
        }

        .world-shell__bars div {
          display: grid;
          grid-template-columns: 110px 1fr auto;
          gap: 0.7rem;
          align-items: center;
        }

        .world-shell__bars label,
        .world-shell__bars span {
          color: var(--text-secondary);
        }

        .world-shell__bars progress {
          width: 100%;
          height: 7px;
        }

        .world-shell__console,
        .world-shell__timeline {
          display: grid;
          gap: 0.75rem;
          margin-top: 0.85rem;
        }

        .world-shell__console-item p {
          margin: 0.35rem 0 0;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .world-shell__console-item--warning {
          border-color: rgba(255, 214, 0, 0.24);
        }

        .world-shell__console-item--error {
          border-color: rgba(255, 56, 103, 0.28);
        }

        @media (max-width: 1024px) {
          .world-shell__card {
            grid-column: span 12;
          }

          .world-shell__topbar {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .world-shell__bars div {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default GameView;
