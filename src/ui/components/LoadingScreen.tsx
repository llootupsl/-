import React, { useMemo } from 'react';
import type { CapabilityProfile } from '@/runtime/capabilities';
import type { RuntimeTraceEvent } from '@/runtime/runtimeStore';

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
}

const STEP_ICON: Record<string, string> = {
  profile: 'graph',
  audio: 'audio',
  wasm: 'wasm',
  citizen: 'citizen',
  economy: 'economy',
  divine: 'divine',
  kernel: 'kernel',
  integrations: 'bridge',
  sync: 'sync',
  experience: 'ui',
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

  const latestEvents = useMemo(() => runtimeEvents.slice().reverse().slice(0, 6), [runtimeEvents]);
  const errorMessage = getErrorMessage(error);

  return (
    <div className="boot-shell">
      <div className="boot-shell__content">
        <section className="boot-shell__hero">
          <div className="boot-shell__badge">Boot Shell</div>
          <div className="boot-shell__title">OMNIS APIEN</div>
          <p className="boot-shell__subtitle">
            浏览器原生文明运行时。真实能力优先，优雅降级紧随其后。
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
                <button type="button" className="boot-shell__button" onClick={onRetry} disabled={isRetrying}>
                  {isRetrying ? 'Retrying...' : 'Retry Boot'}
                </button>
              )}
              {allowEmergencyStart && onEmergencyStart && !errorMessage && (
                <button type="button" className="boot-shell__button boot-shell__button--ghost" onClick={onEmergencyStart}>
                  Safe Start
                </button>
              )}
            </div>
          )}

          {errorMessage && <div className="boot-shell__error">{errorMessage}</div>}
        </section>

        <section className="boot-shell__panel">
          <header>
            <div className="boot-shell__panel-kicker">Core kernel</div>
            <h2>启动矩阵</h2>
          </header>
          <div className="boot-shell__step-list">
            {coreSteps.map((step) => (
              <article key={step.id} className={`boot-shell__step boot-shell__step--${step.status}`}>
                <div className="boot-shell__step-icon">{STEP_ICON[step.id] || 'node'}</div>
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
              <article key={step.id} className={`boot-shell__step boot-shell__step--${step.status}`}>
                <div className="boot-shell__step-icon">{STEP_ICON[step.id] || 'edge'}</div>
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
            <div className="boot-shell__panel-kicker">Capability graph</div>
            <h2>真实能力与降级路径</h2>
          </header>

          <div className="boot-shell__chip-grid">
            {supportedCapabilities.slice(0, 8).map((capability) => (
              <article key={capability.id} className="boot-shell__chip boot-shell__chip--native">
                <strong>{capability.label}</strong>
                <span>{capability.impact}</span>
              </article>
            ))}
            {fallbackCapabilities.slice(0, 4).map((capability) => (
              <article key={capability.id} className="boot-shell__chip boot-shell__chip--fallback">
                <strong>{capability.label}</strong>
                <span>{capability.note}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="boot-shell__panel boot-shell__panel--wide">
          <header>
            <div className="boot-shell__panel-kicker">Boot trace</div>
            <h2>运行时装载轨迹</h2>
          </header>
          <div className="boot-shell__trace-list">
            {latestEvents.map((event) => (
              <article key={event.id} className={`boot-shell__trace boot-shell__trace--${event.severity}`}>
                <div className="boot-shell__trace-head">
                  <strong>{event.title}</strong>
                  <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                {event.detail && <p>{event.detail}</p>}
              </article>
            ))}
          </div>
          {isComplete && <div className="boot-shell__ready-flag">World kernel is standing by.</div>}
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
          line-height: 1.6;
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
            radial-gradient(circle, rgba(var(--accent-rgb), 0.18), transparent 60%),
            linear-gradient(180deg, rgba(var(--accent-rgb), 0.12), rgba(255, 56, 103, 0.12));
        }

        .boot-shell__meter-core {
          width: 78px;
          aspect-ratio: 1;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(4, 10, 18, 0.92);
          border: 1px solid rgba(var(--accent-rgb), 0.18);
          font-family: var(--font-mono);
          font-size: 1.2rem;
        }

        .boot-shell__meter-copy strong {
          display: block;
          font-size: 1rem;
          margin-bottom: 0.35rem;
        }

        .boot-shell__meter-copy span {
          color: var(--text-secondary);
          line-height: 1.55;
        }

        .boot-shell__capability-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .boot-shell__capability-strip div,
        .boot-shell__chip,
        .boot-shell__trace,
        .boot-shell__step {
          border-radius: 20px;
          background: rgba(11, 22, 40, 0.74);
          border: 1px solid rgba(var(--accent-rgb), 0.08);
        }

        .boot-shell__capability-strip div {
          padding: 0.85rem;
        }

        .boot-shell__capability-strip small {
          display: block;
          color: var(--text-muted);
          margin-bottom: 0.3rem;
        }

        .boot-shell__capability-strip strong {
          font-family: var(--font-mono);
          font-size: 1.05rem;
        }

        .boot-shell__actions {
          display: flex;
          gap: 0.75rem;
        }

        .boot-shell__button {
          border: 1px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 999px;
          padding: 0.75rem 1rem;
          cursor: pointer;
          background: rgba(var(--accent-rgb), 0.1);
          color: var(--text-primary);
        }

        .boot-shell__button--ghost {
          background: transparent;
        }

        .boot-shell__error {
          padding: 0.85rem 1rem;
          border-radius: 18px;
          border: 1px solid rgba(255, 56, 103, 0.3);
          background: rgba(255, 56, 103, 0.08);
          color: #ffd4dd;
        }

        .boot-shell__panel header h2 {
          margin: 0.3rem 0 0;
          font-size: 1.15rem;
        }

        .boot-shell__step-list,
        .boot-shell__chip-grid,
        .boot-shell__trace-list {
          display: grid;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .boot-shell__step {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 0.9rem;
          padding: 0.85rem;
        }

        .boot-shell__step-icon {
          border-radius: 16px;
          background: rgba(var(--accent-rgb), 0.08);
          display: grid;
          place-items: center;
          font-family: var(--font-mono);
          font-size: 0.74rem;
          text-transform: uppercase;
        }

        .boot-shell__step-body strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .boot-shell__step-body p,
        .boot-shell__chip span,
        .boot-shell__trace p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .boot-shell__step-body span {
          display: inline-block;
          margin-top: 0.45rem;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }

        .boot-shell__step--success {
          border-color: rgba(24, 230, 170, 0.25);
        }

        .boot-shell__step--error,
        .boot-shell__chip--fallback,
        .boot-shell__trace--error {
          border-color: rgba(255, 56, 103, 0.26);
        }

        .boot-shell__step--loading,
        .boot-shell__trace--warning {
          border-color: rgba(255, 214, 0, 0.26);
        }

        .boot-shell__chip-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .boot-shell__chip {
          padding: 0.85rem;
        }

        .boot-shell__chip strong {
          display: block;
          margin-bottom: 0.3rem;
        }

        .boot-shell__trace {
          padding: 0.85rem 0.95rem;
        }

        .boot-shell__trace-head {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.3rem;
        }

        .boot-shell__trace-head span {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .boot-shell__ready-flag {
          margin-top: 1rem;
          padding: 0.8rem 1rem;
          border-radius: 18px;
          background: rgba(24, 230, 170, 0.08);
          border: 1px solid rgba(24, 230, 170, 0.22);
          color: #b7ffe0;
        }

        .boot-shell__divider {
          height: 1px;
          background: rgba(var(--accent-rgb), 0.12);
          margin: 1rem 0;
        }

        @media (max-width: 1100px) {
          .boot-shell__hero,
          .boot-shell__panel {
            grid-column: span 12;
          }
        }

        @media (max-width: 760px) {
          .boot-shell__capability-strip,
          .boot-shell__chip-grid {
            grid-template-columns: 1fr;
          }

          .boot-shell__meter {
            grid-template-columns: 1fr;
          }

          .boot-shell__step {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
