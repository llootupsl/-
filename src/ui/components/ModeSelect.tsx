import React, { useCallback, useMemo, useRef } from 'react';
import type { CapabilityProfile } from '@/runtime/capabilities';
import CivilizationCapabilityUniverse from '@/ui/components/CivilizationCapabilityUniverse';

export type AppPerformanceMode = 'apex' | 'extreme' | 'balanced' | 'eco';

export interface ModeConfig {
  id: AppPerformanceMode;
  nameCN: string;
  nameEN: string;
  desc: string;
  color: string;
  focus: string;
  payoff: string;
}

export const MODES: ModeConfig[] = [
  {
    id: 'apex',
    nameCN: 'Apex Flagship',
    nameEN: 'APEX',
    desc: 'Maximum WebGPU, telemetry, and cinematic shell orchestration for high-end desktops.',
    color: 'var(--color-mode-apex)',
    focus: 'Flagship rendering + full capability staging',
    payoff: 'Best for demos, recordings, and hardware showcase sessions.',
  },
  {
    id: 'extreme',
    nameCN: 'Extreme Mesh',
    nameEN: 'EXTREME',
    desc: 'Keeps the dramatic runtime surface while leaning harder on dynamic loading and frame stability.',
    color: 'var(--color-mode-extreme)',
    focus: 'Dynamic loading + stress-ready runtime',
    payoff: 'Great for modern laptops and dense browser sessions.',
  },
  {
    id: 'balanced',
    nameCN: 'Balanced Mainline',
    nameEN: 'BALANCED',
    desc: 'Real capabilities stay first-class, fallbacks stay visible, and the experience remains shippable.',
    color: 'var(--color-mode-balanced)',
    focus: 'Clarity, stability, and explainable fallbacks',
    payoff: 'The default release path for most devices.',
  },
  {
    id: 'eco',
    nameCN: 'Eco Continuity',
    nameEN: 'ECO',
    desc: 'Prioritizes continuity, battery, and low-friction delivery on constrained devices.',
    color: 'var(--color-mode-eco)',
    focus: 'Compatibility + long-session continuity',
    payoff: 'Best for mobile, low-power, or restricted browser environments.',
  },
];

export interface ModeSelectProps {
  selectedMode: AppPerformanceMode;
  onSelect: (mode: AppPerformanceMode) => void;
  onStart: () => void;
  currentMode: ModeConfig;
  capabilityProfile?: CapabilityProfile | null;
  onOpenFeatureUniverse?: () => void;
}

function getRecommendedMode(profile?: CapabilityProfile | null): AppPerformanceMode {
  return profile?.device.recommendedMode ?? 'balanced';
}

export const ModeSelect: React.FC<ModeSelectProps> = ({
  selectedMode,
  onSelect,
  onStart,
  currentMode,
  capabilityProfile,
  onOpenFeatureUniverse,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const recommendedMode = getRecommendedMode(capabilityProfile);

  const capabilityHighlights = useMemo(() => {
    if (!capabilityProfile) {
      return [];
    }

    return Object.values(capabilityProfile.capabilities)
      .filter((capability) => capability.supported)
      .slice(0, 6);
  }, [capabilityProfile]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, mode: AppPerformanceMode, index: number) => {
      let nextIndex = index;

      switch (event.key) {
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
          event.preventDefault();
          onSelect(mode);
          return;
        default:
          return;
      }

      event.preventDefault();
      const cards = gridRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
      cards?.[nextIndex]?.focus();
    },
    [onSelect],
  );

  return (
    <div className="mode-stage">
      <section className="mode-stage__hero">
        <div className="mode-stage__intro">
          <div className="mode-stage__badge">Universe Entry</div>
          <h1>See the capability universe before you choose the runtime stance.</h1>
          <p>
            This screen no longer treats performance mode as a simple graphics toggle. It decides
            warmup intensity, capability orchestration, fallback posture, and how boldly the world
            shell should expose the browser as a civilization engine.
          </p>

          <div className="mode-stage__metrics">
            <div>
              <span>Device tier</span>
              <strong>{capabilityProfile?.device.level ?? '--'}</strong>
            </div>
            <div>
              <span>Recommended</span>
              <strong>{recommendedMode.toUpperCase()}</strong>
            </div>
            <div>
              <span>GPU</span>
              <strong>{capabilityProfile?.device.gpuVendor ?? 'Unknown'}</strong>
            </div>
            <div>
              <span>Native paths</span>
              <strong>{capabilityHighlights.length}</strong>
            </div>
          </div>

          <div className="mode-stage__chips">
            {capabilityHighlights.map((capability) => (
              <span key={capability.id} className="mode-stage__chip">
                {capability.label}
              </span>
            ))}
          </div>

          {onOpenFeatureUniverse && (
            <div className="mode-stage__hero-actions">
              <button type="button" className="mode-stage__secondary" onClick={onOpenFeatureUniverse}>
                Open Full Atlas
              </button>
            </div>
          )}
        </div>

        <CivilizationCapabilityUniverse capabilityProfile={capabilityProfile} variant="stage" />
      </section>

      <div ref={gridRef} className="mode-stage__grid" role="listbox" aria-label="Performance modes">
        {MODES.map((mode, index) => {
          const isSelected = selectedMode === mode.id;
          const isRecommended = recommendedMode === mode.id;

          return (
            <button
              key={mode.id}
              id={`mode-${mode.id}`}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={`mode-card ${isSelected ? 'mode-card--selected' : ''} ${isRecommended ? 'mode-card--recommended' : ''}`}
              onClick={() => onSelect(mode.id)}
              onKeyDown={(event) => handleKeyDown(event, mode.id, index)}
              style={{ '--mode-accent': mode.color } as React.CSSProperties}
            >
              <div className="mode-card__topline">
                <span>{mode.nameEN}</span>
                {isRecommended && <strong>Recommended</strong>}
              </div>
              <div className="mode-card__title">{mode.nameCN}</div>
              <p className="mode-card__desc">{mode.desc}</p>
              <div className="mode-card__meta">
                <div>
                  <span>Focus</span>
                  <strong>{mode.focus}</strong>
                </div>
                <div>
                  <span>Payoff</span>
                  <strong>{mode.payoff}</strong>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mode-stage__footer">
        <div className="mode-stage__current">
          <span>Current strategy</span>
          <strong style={{ color: currentMode.color }}>{currentMode.nameCN}</strong>
        </div>
        <button type="button" className="mode-stage__start" onClick={onStart}>
          Enter Civilization
        </button>
      </div>

      <style>{`
        .mode-stage {
          min-height: 100%;
          padding: 1.5rem;
          display: grid;
          gap: 1rem;
          background:
            radial-gradient(circle at top left, rgba(var(--accent-rgb), 0.18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(255, 56, 103, 0.16), transparent 28%),
            linear-gradient(180deg, #040913 0%, #050b14 100%);
        }

        .mode-stage__hero,
        .mode-card,
        .mode-stage__footer {
          border-radius: 28px;
          border: 1px solid rgba(var(--accent-rgb), 0.16);
          background: rgba(6, 14, 26, 0.84);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(16px);
        }

        .mode-stage__hero {
          padding: 1.3rem;
          display: grid;
          gap: 1rem;
        }

        .mode-stage__intro {
          display: grid;
          gap: 1rem;
        }

        .mode-stage__badge {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--text-muted);
        }

        .mode-stage__hero h1 {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(2rem, 6vw, 4rem);
          letter-spacing: 0.08em;
        }

        .mode-stage__hero p {
          max-width: 72ch;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .mode-stage__metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.8rem;
        }

        .mode-stage__metrics div,
        .mode-card__meta div {
          border-radius: 18px;
          padding: 0.9rem;
          background: rgba(10, 22, 42, 0.72);
        }

        .mode-stage__metrics span,
        .mode-card__meta span {
          display: block;
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-bottom: 0.35rem;
        }

        .mode-stage__metrics strong,
        .mode-card__meta strong {
          font-size: 1.05rem;
          color: var(--text-primary);
        }

        .mode-stage__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
        }

        .mode-stage__hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .mode-stage__chip {
          padding: 0.4rem 0.7rem;
          border-radius: 999px;
          background: rgba(var(--accent-rgb), 0.09);
          border: 1px solid rgba(var(--accent-rgb), 0.16);
          color: var(--text-primary);
          font-size: 0.78rem;
        }

        .mode-stage__secondary {
          border-radius: 999px;
          border: 1px solid rgba(var(--accent-rgb), 0.18);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          padding: 0.7rem 1rem;
          cursor: pointer;
        }

        .mode-stage__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 0.95rem;
        }

        .mode-card {
          padding: 1.1rem;
          text-align: left;
          cursor: pointer;
          color: var(--text-primary);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .mode-card:hover,
        .mode-card--selected {
          transform: translateY(-2px);
          border-color: rgba(var(--accent-rgb), 0.36);
          box-shadow: 0 28px 56px rgba(0, 0, 0, 0.3);
        }

        .mode-card--recommended {
          border-color: rgba(255, 214, 0, 0.38);
        }

        .mode-card__topline {
          display: flex;
          justify-content: space-between;
          gap: 0.8rem;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-muted);
        }

        .mode-card__topline strong {
          color: #ffd600;
        }

        .mode-card__title {
          margin-top: 0.8rem;
          font-family: var(--font-display);
          font-size: 1.3rem;
          letter-spacing: 0.08em;
          color: var(--mode-accent);
        }

        .mode-card__desc {
          margin: 0.8rem 0 1rem;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .mode-card__meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .mode-stage__footer {
          padding: 1rem 1.2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .mode-stage__current span {
          display: block;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-muted);
          margin-bottom: 0.3rem;
        }

        .mode-stage__current strong {
          font-family: var(--font-display);
          font-size: 1.2rem;
        }

        .mode-stage__start {
          border: 1px solid rgba(var(--accent-rgb), 0.22);
          background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), rgba(255, 214, 0, 0.18));
          color: var(--text-primary);
          border-radius: 999px;
          padding: 0.85rem 1.3rem;
          cursor: pointer;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
        }

        @media (max-width: 780px) {
          .mode-stage {
            padding: 1rem;
          }

          .mode-card__meta {
            grid-template-columns: 1fr;
          }

          .mode-stage__footer {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default ModeSelect;
