import React, { useEffect, useMemo, useState } from 'react';
import {
  useCitizenStats,
  useEmotion,
  useEntropy,
  useGamePhase,
  useGameStore,
  useNarrative,
  useResources,
  useTime,
  useWarnings,
} from '@/store/gameStore';
import { useRuntimeStore } from '@/runtime/runtimeStore';
import CivilizationCapabilityUniverse from '@/ui/components/CivilizationCapabilityUniverse';
import type { RequirementPanelAction } from '@/runtime/requirements';
import type { ModeConfig } from './ModeSelect';

const EPOCH_LABELS = {
  golden: 'Golden Era',
  stable: 'Stable Era',
  pressure: 'Pressure Era',
  crisis: 'Crisis Era',
  collapse: 'Collapse Edge',
  entropy: 'Entropy Era',
} as const;

const EPOCH_COLORS: Record<(typeof EPOCH_LABELS)[keyof typeof EPOCH_LABELS], string> = {
  'Golden Era': 'var(--color-epoch-golden)',
  'Stable Era': 'var(--color-epoch-stable)',
  'Pressure Era': 'var(--color-epoch-pressure)',
  'Crisis Era': 'var(--color-epoch-crisis)',
  'Collapse Edge': 'var(--color-epoch-collapse)',
  'Entropy Era': 'var(--color-entropy)',
};

export interface GameViewProps {
  currentMode: ModeConfig;
  onBack: () => void;
  onOpenChat: () => void;
  onOpenEightChars: () => void;
  onOpenDivine: () => void;
  onOpenCitizen: () => void;
  onOpenGenesisTwin: () => void;
  onOpenBenchmark: () => void;
  onOpenDao: () => void;
  onOpenSpaceWarp: () => void;
  onOpenSystemStatus: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  currentMode,
  onBack,
  onOpenChat,
  onOpenEightChars,
  onOpenDivine,
  onOpenCitizen,
  onOpenGenesisTwin,
  onOpenBenchmark,
  onOpenDao,
  onOpenSpaceWarp,
  onOpenSystemStatus,
}) => {
  const phase = useGamePhase();
  const resources = useResources();
  const entropy = useEntropy();
  const emotion = useEmotion();
  const citizenStats = useCitizenStats();
  const time = useTime();
  const narrative = useNarrative();
  const warnings = useWarnings();
  const clearWarning = useGameStore((state) => state.clearWarning);
  const bootPhase = useRuntimeStore((state) => state.bootPhase);
  const capabilityProfile = useRuntimeStore((state) => state.capabilityProfile);
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
  const degradedSubsystems = Object.values(runtimeSubsystems).filter(
    (subsystem) => subsystem.state === 'degraded' || subsystem.state === 'error',
  );
  const criticalSignals = runtimeTraces.slice(-4).reverse();

  const handleUniverseAction = (action: RequirementPanelAction) => {
    switch (action) {
      case 'citizens':
        onOpenCitizen();
        break;
      case 'dao':
        onOpenDao();
        break;
      case 'divine':
        onOpenDivine();
        break;
      case 'chat':
        onOpenChat();
        break;
      case 'observatory':
        onOpenSystemStatus();
        break;
      default:
        break;
    }
  };

  const alertMessage = warnings.criticalEntropy
    ? 'Entropy is approaching the critical threshold.'
    : warnings.populationZero
      ? 'Population has collapsed to zero.'
      : warnings.resourceDepleted.length > 0
        ? `Depleted resources: ${warnings.resourceDepleted.join(', ')}`
        : '';

  return (
    <div className="world-shell">
      <header className="world-shell__topbar">
        <div className="world-shell__brand">
          <button type="button" className="world-shell__back" onClick={onBack} aria-label="Back to mode select">
            Back
          </button>
          <div>
            <div className="world-shell__mode" style={{ color: currentMode.color }}>
              {currentMode.nameEN}
            </div>
            <div className="world-shell__title">Civilization Command</div>
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

      {alertMessage && (
        <div className="world-shell__alert">
          <span>System Alert</span>
          <strong>{alertMessage}</strong>
          <button type="button" onClick={() => clearWarning('resourceDepleted')}>
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
            <h1>The requirement universe is now a live runtime surface.</h1>
            <p>
              Capability clusters, strategic signals, emotional pressure, and subsystem truth live
              together on the main stage so both players and reviewers can see what is native,
              what is gracefully falling back, and what remains explicitly simulated.
            </p>
          </div>
          <div className="world-shell__hero-actions">
            <button type="button" onClick={onOpenCitizen}>Citizen Kernel</button>
            <button type="button" onClick={onOpenDivine}>Divine Layer</button>
            <button type="button" onClick={onOpenChat}>Runtime Chat</button>
            <button type="button" onClick={onOpenEightChars}>Identity and Fate</button>
            <button type="button" onClick={onOpenGenesisTwin}>Genesis Twin</button>
            <button type="button" onClick={onOpenBenchmark}>Benchmark</button>
            <button type="button" onClick={onOpenDao}>DAO Center</button>
            <button type="button" onClick={onOpenSpaceWarp}>Space Warp</button>
            <button type="button" onClick={onOpenSystemStatus}>Observatory</button>
          </div>
        </section>

        <section className="world-shell__universe-card">
          <CivilizationCapabilityUniverse
            capabilityProfile={capabilityProfile}
            subsystems={runtimeSubsystems}
            variant="world"
            onInspectObservatory={onOpenSystemStatus}
            onAction={handleUniverseAction}
          />
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
              The main stage keeps only strategic signals. Deep telemetry and runtime proof stay in
              the observatory instead of crowding the front page.
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
        .world-shell__alert,
        .world-shell__universe-card {
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
          gap: 0.15rem;
          justify-items: end;
          font-family: var(--font-mono);
        }

        .world-shell__time span,
        .world-shell__runtime span {
          color: var(--text-muted);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .world-shell__alert {
          margin: 0 1rem 1rem;
          padding: 0.8rem 1rem;
          border-radius: 22px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .world-shell__alert span {
          font-family: var(--font-mono);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.72rem;
        }

        .world-shell__alert strong {
          flex: 1;
        }

        .world-shell__alert button,
        .world-shell__hero-actions button {
          border: 1px solid rgba(var(--accent-rgb), 0.18);
          background: rgba(var(--accent-rgb), 0.08);
          color: var(--text-primary);
          border-radius: 999px;
          padding: 0.6rem 0.95rem;
          cursor: pointer;
        }

        .world-shell__content {
          flex: 1;
          overflow: auto;
          padding: 0 1rem 1rem;
          display: grid;
          gap: 1rem;
        }

        .world-shell__hero,
        .world-shell__universe-card {
          border-radius: 28px;
          padding: 1.2rem;
        }

        .world-shell__hero {
          display: grid;
          gap: 1rem;
        }

        .world-shell__epoch span,
        .world-shell__card-kicker {
          font-family: var(--font-mono);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.72rem;
        }

        .world-shell__epoch strong {
          display: block;
          margin-top: 0.25rem;
          font-family: var(--font-display);
          font-size: 1.7rem;
          letter-spacing: 0.06em;
        }

        .world-shell__hero-copy h1 {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 4vw, 3rem);
          letter-spacing: 0.06em;
        }

        .world-shell__hero-copy p,
        .world-shell__summary {
          margin-top: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 72ch;
        }

        .world-shell__hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .world-shell__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .world-shell__card {
          border-radius: 24px;
          padding: 1rem;
        }

        .world-shell__card--wide {
          grid-column: 1 / -1;
        }

        .world-shell__stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 0.9rem;
        }

        .world-shell__stats div,
        .world-shell__console-item,
        .world-shell__bars div {
          border-radius: 18px;
          padding: 0.85rem;
          background: rgba(10, 22, 42, 0.72);
        }

        .world-shell__stats span,
        .world-shell__console-item span,
        .world-shell__bars label {
          display: block;
          color: var(--text-muted);
          font-size: 0.75rem;
          margin-bottom: 0.35rem;
        }

        .world-shell__stats strong,
        .world-shell__console-item strong {
          color: var(--text-primary);
        }

        .world-shell__bars {
          display: grid;
          gap: 0.75rem;
          margin-top: 0.9rem;
        }

        .world-shell__bars progress {
          width: 100%;
          height: 0.55rem;
          margin-bottom: 0.35rem;
        }

        .world-shell__console,
        .world-shell__timeline {
          display: grid;
          gap: 0.75rem;
          margin-top: 0.9rem;
        }

        .world-shell__console-item p {
          margin: 0.45rem 0 0;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        @media (max-width: 980px) {
          .world-shell__topbar {
            grid-template-columns: 1fr;
            justify-items: start;
          }

          .world-shell__time,
          .world-shell__runtime {
            justify-items: start;
          }

          .world-shell__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default GameView;
