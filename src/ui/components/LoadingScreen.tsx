import React, { useMemo } from 'react';
import type { CapabilityProfile } from '@/runtime/capabilities';
import type { RuntimeTraceEvent } from '@/runtime/runtimeStore';
import { FeatureUniversePreview } from '@/ui/components/FeatureUniversePreview';

export type LoadingStepStatus = 'pending' | 'loading' | 'success' | 'error';

export interface LoadingStep {
  id: string;
  name: string;
  description: string;
  status: LoadingStepStatus;
  progress: number;
  error?: string;
}

export interface BackgroundLoadingState {
  isActive: boolean;
  progress: number;
  currentModule: string;
  loadedModules: string[];
  totalModules: number;
}

export interface LoadingScreenProps {
  progress: number;
  status: string;
  steps?: LoadingStep[];
  error?: string | null | { message: string; friendlyMessage?: string } | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  backgroundLoading?: BackgroundLoadingState;
  isComplete?: boolean;
  allowEmergencyStart?: boolean;
  onEmergencyStart?: () => void;
  capabilityProfile?: CapabilityProfile | null;
  runtimeEvents?: RuntimeTraceEvent[];
  onOpenFeatureUniverse?: () => void;
}

const STEP_ICON: Record<string, string> = {
  profile: 'Graph',
  audio: 'Audio',
  wasm: 'WASM',
  citizen: 'Citizen',
  economy: 'Economy',
  divine: 'Divine',
  kernel: 'Kernel',
  integrations: 'Bridge',
  sync: 'Sync',
  experience: 'UI',
};

function getErrorMessage(error: LoadingScreenProps['error']): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return error.friendlyMessage || error.message;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  status,
  steps = [],
  error,
  onRetry,
  isRetrying = false,
  isComplete = false,
  allowEmergencyStart = false,
  onEmergencyStart,
  capabilityProfile,
  runtimeEvents = [],
  onOpenFeatureUniverse,
}) => {
  const coreSteps = useMemo(
    () => steps.filter((step) => ['profile', 'wasm', 'citizen', 'kernel'].includes(step.id)),
    [steps],
  );

  const enhancementSteps = useMemo(
    () => steps.filter((step) => !['profile', 'wasm', 'citizen', 'kernel'].includes(step.id)),
    [steps],
  );

  const supportedCapabilities = useMemo(
    () =>
      capabilityProfile
        ? Object.values(capabilityProfile.capabilities).filter((capability) => capability.supported)
        : [],
    [capabilityProfile],
  );

  const fallbackCapabilities = useMemo(
    () =>
      capabilityProfile
        ? Object.values(capabilityProfile.capabilities).filter((capability) => !capability.supported)
        : [],
    [capabilityProfile],
  );

  const latestEvents = useMemo(
    () => runtimeEvents.slice().reverse().slice(0, 6),
    [runtimeEvents],
  );
  const errorMessage = getErrorMessage(error);

  return (
    <div className="boot-shell">
      <div className="boot-shell__content">
        <section className="boot-shell__hero">
          <div className="boot-shell__badge">Boot Shell</div>
          <div className="boot-shell__title">OMNIS APIEN</div>
          <p className="boot-shell__subtitle">
            The browser civilization kernel is locking native paths, fallback posture, and startup
            stability before the world opens. Once this phase is complete, the feature universe and
            the main world loop join as a single surface.
          </p>

          <div className="boot-shell__meter">
            <div className="boot-shell__meter-ring">
              <div className="boot-shell__meter-core">{Math.round(progress)}%</div>
            </div>
            <div className="boot-shell__meter-copy">
              <strong>{status}</strong>
              <span>
                {capabilityProfile
                  ? `${capabilityProfile.device.type} / ${capabilityProfile.device.level} / recommended ${capabilityProfile.device.recommendedMode}`
                  : 'Probing browser capabilities...'}
              </span>
            </div>
          </div>

          <div className="boot-shell__capability-strip">
            <div>
              <small>Native paths</small>
              <strong>{supportedCapabilities.length}</strong>
            </div>
            <div>
              <small>Fallback paths</small>
              <strong>{fallbackCapabilities.length}</strong>
            </div>
            <div>
              <small>CPU cores</small>
              <strong>{capabilityProfile?.device.cpuCores ?? '--'}</strong>
            </div>
            <div>
              <small>Memory</small>
              <strong>{capabilityProfile?.device.memoryGB ?? '--'} GB</strong>
            </div>
          </div>

          {(allowEmergencyStart || errorMessage) && (
            <div className="boot-shell__actions">
              {errorMessage && onRetry && (
                <button
                  type="button"
                  className="boot-shell__button"
                  onClick={onRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Retrying...' : 'Retry Boot'}
                </button>
              )}
              {allowEmergencyStart && onEmergencyStart && !errorMessage && (
                <button
                  type="button"
                  className="boot-shell__button boot-shell__button--ghost"
                  onClick={onEmergencyStart}
                >
                  Safe Start
                </button>
              )}
            </div>
          )}

          {onOpenFeatureUniverse && (
            <div className="boot-shell__actions">
              <button
                type="button"
                className="boot-shell__button boot-shell__button--ghost"
                onClick={onOpenFeatureUniverse}
              >
                Open Feature Atlas
              </button>
            </div>
          )}

          {errorMessage && <div className="boot-shell__error">{errorMessage}</div>}
        </section>

        <section className="boot-shell__panel">
          <header>
            <div className="boot-shell__panel-kicker">Core Kernel</div>
            <h2>Boot matrix</h2>
          </header>
          <div className="boot-shell__step-list">
            {coreSteps.map((step) => (
              <article
                key={step.id}
                className={`boot-shell__step boot-shell__step--${step.status}`}
              >
                <div className="boot-shell__step-icon">{STEP_ICON[step.id] || 'Node'}</div>
                <div className="boot-shell__step-body">
                  <strong>{step.name}</strong>
                  <p>{step.description}</p>
                  {step.status === 'loading' && <span>{step.progress}%</span>}
                  {step.status === 'error' && step.error && <span>{step.error}</span>}
                </div>
              </article>
            ))}
          </div>

          <div className="boot-shell__divider" />

          <div className="boot-shell__panel-kicker">Enhancements</div>
          <div className="boot-shell__step-list">
            {enhancementSteps.map((step) => (
              <article
                key={step.id}
                className={`boot-shell__step boot-shell__step--${step.status}`}
              >
                <div className="boot-shell__step-icon">{STEP_ICON[step.id] || 'Edge'}</div>
                <div className="boot-shell__step-body">
                  <strong>{step.name}</strong>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="boot-shell__panel">
          <header>
            <div className="boot-shell__panel-kicker">Capability Graph</div>
            <h2>Native paths and fallback posture</h2>
          </header>

          <div className="boot-shell__chip-grid">
            {supportedCapabilities.slice(0, 8).map((capability) => (
              <article
                key={capability.id}
                className="boot-shell__chip boot-shell__chip--native"
              >
                <strong>{capability.label}</strong>
                <span>{capability.impact}</span>
              </article>
            ))}
            {fallbackCapabilities.slice(0, 4).map((capability) => (
              <article
                key={capability.id}
                className="boot-shell__chip boot-shell__chip--fallback"
              >
                <strong>{capability.label}</strong>
                <span>{capability.note}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="boot-shell__panel boot-shell__panel--wide">
          <header>
            <div className="boot-shell__panel-kicker">Boot Trace</div>
            <h2>Runtime load sequence</h2>
          </header>
          <div className="boot-shell__trace-list">
            {latestEvents.map((event) => (
              <article
                key={event.id}
                className={`boot-shell__trace boot-shell__trace--${event.severity}`}
              >
                <div className="boot-shell__trace-head">
                  <strong>{event.title}</strong>
                  <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                {event.detail && <p>{event.detail}</p>}
              </article>
            ))}
          </div>
          {isComplete && (
            <div className="boot-shell__ready-flag">
              World kernel is standing by.
            </div>
          )}
        </section>

        <section className="boot-shell__panel boot-shell__panel--wide">
          <FeatureUniversePreview
            onOpen={onOpenFeatureUniverse}
            ctaLabel="Review the feature atlas"
          />
        </section>
      </div>

      <style>{`
        .boot-shell {
          position: fixed;
          inset: 0;
          overflow: auto;
          background:
            radial-gradient(circle at top, rgba(var(--accent-rgb), 0.18), transparent 36%),
            radial-gradient(circle at bottom right, rgba(255, 56, 103, 0.18), transparent 28%),
            linear-gradient(180deg, #040913 0%, #050b14 100%);
          padding: 1.5rem;
        }

        .boot-shell__content {
          width: min(1320px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 1rem;
        }

        .boot-shell__hero,
        .boot-shell__panel {
          border-radius: 28px;
          border: 1px solid rgba(var(--accent-rgb), 0.16);
          background: rgba(6, 14, 26, 0.84);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.32);
          backdrop-filter: blur(18px);
        }

        .boot-shell__hero {
          grid-column: span 5;
          padding: 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .boot-shell__panel {
          grid-column: span 7;
          padding: 1.2rem;
        }

        .boot-shell__panel--wide {
          grid-column: span 12;
        }

        .boot-shell__badge,
        .boot-shell__panel-kicker {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .boot-shell__title {
          font-family: var(--font-display);
          font-size: clamp(2.2rem, 6vw, 4.8rem);
          letter-spacing: 0.16em;
          color: var(--text-primary);
          text-shadow: 0 0 48px rgba(var(--accent-rgb), 0.26);
        }

        .boot-shell__subtitle {
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 42ch;
        }

        .boot-shell__meter {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1rem;
          align-items: center;
        }

        .boot-shell__meter-ring {
          width: 124px;
          aspect-ratio: 1;
          border-radius: 50%;
          border: 1px solid rgba(var(--accent-rgb), 0.24);
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle, rgba(var(--accent-rgb), 0.14), transparent 58%),
            rgba(4, 12, 24, 0.72);
          box-shadow: inset 0 0 24px rgba(var(--accent-rgb), 0.12);
        }

        .boot-shell__meter-core {
          font-family: var(--font-display);
          font-size: 1.8rem;
          letter-spacing: 0.08em;
        }

        .boot-shell__meter-copy strong {
          display: block;
          font-size: 1.05rem;
        }

        .boot-shell__meter-copy span {
          display: block;
          margin-top: 0.35rem;
          color: var(--text-secondary);
        }

        .boot-shell__capability-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .boot-shell__capability-strip div {
          border-radius: 18px;
          padding: 0.85rem;
          background: rgba(9, 22, 40, 0.76);
        }

        .boot-shell__capability-strip small {
          display: block;
          color: var(--text-muted);
          margin-bottom: 0.3rem;
        }

        .boot-shell__capability-strip strong {
          font-family: var(--font-mono);
        }

        .boot-shell__actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .boot-shell__button {
          border: 1px solid rgba(var(--accent-rgb), 0.28);
          border-radius: 999px;
          background: rgba(var(--accent-rgb), 0.12);
          color: var(--text-primary);
          padding: 0.6rem 0.95rem;
          cursor: pointer;
        }

        .boot-shell__button--ghost {
          background: transparent;
        }

        .boot-shell__error {
          border-radius: 18px;
          padding: 0.85rem 0.95rem;
          border: 1px solid rgba(255, 56, 103, 0.22);
          background: rgba(255, 56, 103, 0.08);
          color: #ffd7de;
        }

        .boot-shell__step-list,
        .boot-shell__chip-grid,
        .boot-shell__trace-list {
          display: grid;
          gap: 0.75rem;
        }

        .boot-shell__step,
        .boot-shell__chip,
        .boot-shell__trace {
          display: grid;
          gap: 0.45rem;
          padding: 0.85rem;
          border-radius: 20px;
          background: rgba(10, 22, 42, 0.7);
        }

        .boot-shell__step {
          grid-template-columns: auto 1fr;
          align-items: start;
        }

        .boot-shell__step-icon {
          min-width: 4rem;
          border-radius: 999px;
          padding: 0.3rem 0.65rem;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
        }

        .boot-shell__step-body strong,
        .boot-shell__chip strong,
        .boot-shell__trace strong {
          display: block;
        }

        .boot-shell__step-body p,
        .boot-shell__chip span,
        .boot-shell__trace p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .boot-shell__divider {
          height: 1px;
          margin: 0.9rem 0;
          background: rgba(var(--accent-rgb), 0.12);
        }

        .boot-shell__chip-grid {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .boot-shell__chip--native {
          border: 1px solid rgba(48, 210, 159, 0.18);
        }

        .boot-shell__chip--fallback {
          border: 1px solid rgba(255, 214, 0, 0.18);
        }

        .boot-shell__trace-head {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: center;
        }

        .boot-shell__trace-head span {
          color: var(--text-muted);
          font-size: 0.76rem;
        }

        .boot-shell__trace--warning {
          border: 1px solid rgba(255, 214, 0, 0.18);
        }

        .boot-shell__trace--error {
          border: 1px solid rgba(255, 56, 103, 0.18);
        }

        .boot-shell__trace--success {
          border: 1px solid rgba(48, 210, 159, 0.18);
        }

        .boot-shell__ready-flag {
          margin-top: 0.9rem;
          border-radius: 18px;
          padding: 0.85rem 0.95rem;
          background: rgba(48, 210, 159, 0.08);
          border: 1px solid rgba(48, 210, 159, 0.18);
          color: #b8fbe1;
        }

        @media (max-width: 1100px) {
          .boot-shell__hero,
          .boot-shell__panel {
            grid-column: span 12;
          }
        }

        @media (max-width: 640px) {
          .boot-shell__capability-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .boot-shell__meter {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
