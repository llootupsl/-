import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { systemIntegrator } from '@/core/SystemIntegrator';
import { useRuntimeStore } from '@/runtime/runtimeStore';
import type { CapabilityStatus } from '@/runtime/capabilities';
import { formatRuntimeSourceLabel } from '@/runtime/runtimeVocabulary';

interface SystemStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ObservatorySnapshot {
  activeSystems: string[];
  integratorState: ReturnType<typeof systemIntegrator.getState>;
  contribution: ReturnType<typeof systemIntegrator.getP2PContribution>;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unitIndex).toFixed(1)} ${units[unitIndex]}`;
}

function capabilityTone(capability: CapabilityStatus): string {
  return capability.supported ? 'supported' : 'fallback';
}

function capabilityLabel(capability: CapabilityStatus): string {
  return formatRuntimeSourceLabel(capability.source);
}

export const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({ isOpen, onClose }) => {
  const capabilityProfile = useRuntimeStore((state) => state.capabilityProfile);
  const traces = useRuntimeStore((state) => state.traces);
  const subsystems = useRuntimeStore((state) => state.subsystems);
  const [snapshot, setSnapshot] = useState<ObservatorySnapshot>(() => ({
    activeSystems: systemIntegrator.getStats().activeSystems,
    integratorState: systemIntegrator.getState(),
    contribution: systemIntegrator.getP2PContribution(),
  }));

  const refresh = useCallback(() => {
    setSnapshot({
      activeSystems: systemIntegrator.getStats().activeSystems,
      integratorState: systemIntegrator.getState(),
      contribution: systemIntegrator.getP2PContribution(),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    refresh();
    const timer = window.setInterval(refresh, 1500);
    return () => window.clearInterval(timer);
  }, [isOpen, refresh]);

  const capabilityList = useMemo(
    () => (capabilityProfile ? Object.values(capabilityProfile.capabilities) : []),
    [capabilityProfile],
  );

  const subsystemList = useMemo(
    () => Object.values(subsystems).sort((left, right) => left.label.localeCompare(right.label)),
    [subsystems],
  );

  const runtimeHealth = useMemo(() => {
    const readyCount = subsystemList.filter((item) => item.state === 'ready').length;
    const degradedCount = subsystemList.filter((item) => item.state === 'degraded').length;
    return { readyCount, degradedCount, total: subsystemList.length };
  }, [subsystemList]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="observatory-backdrop" onClick={onClose}>
      <section
        className="observatory-panel"
        onClick={(event) => event.stopPropagation()}
        aria-label="Runtime observatory"
      >
        <header className="observatory-header">
          <div>
            <div className="observatory-kicker">Runtime Observatory</div>
            <h2>浏览器文明内核观测台</h2>
          </div>
          <div className="observatory-actions">
            <button type="button" className="observatory-btn" onClick={refresh}>
              Refresh
            </button>
            <button type="button" className="observatory-btn observatory-btn--ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        <div className="observatory-grid">
          <section className="observatory-card observatory-card--hero">
            <div className="hero-chip">Engineering-first telemetry</div>
            <div className="hero-metrics">
              <div>
                <span className="metric-label">Device score</span>
                <strong>{capabilityProfile?.device.score ?? '--'}</strong>
              </div>
              <div>
                <span className="metric-label">Recommended mode</span>
                <strong>{capabilityProfile?.device.recommendedMode ?? '--'}</strong>
              </div>
              <div>
                <span className="metric-label">Active systems</span>
                <strong>{snapshot.activeSystems.length}</strong>
              </div>
              <div>
                <span className="metric-label">Fallback paths</span>
                <strong>{runtimeHealth.degradedCount}</strong>
              </div>
            </div>
            <div className="hero-copy">
              当前设备被归类为 <strong>{capabilityProfile?.device.level ?? '--'}</strong> 档，
              GPU 厂商为 <strong>{capabilityProfile?.device.gpuVendor ?? 'Unknown'}</strong>。
              系统默认优先走真实浏览器能力，不支持时自动切到一等降级路径，并在这里给出原因解释。
            </div>
          </section>

          <section className="observatory-card">
            <div className="card-title">Capability Graph</div>
            <div className="capability-list">
              {capabilityList.map((capability) => (
                <article key={capability.id} className={`capability-pill capability-pill--${capabilityTone(capability)}`}>
                  <div>
                    <strong>{capability.label}</strong>
                    <p>{capability.note}</p>
                  </div>
                  <span>{capabilityLabel(capability)}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="observatory-card">
            <div className="card-title">Subsystem Registry</div>
            <div className="subsystem-list">
              {subsystemList.map((subsystem) => (
                <article key={subsystem.id} className={`subsystem-card subsystem-card--${subsystem.state}`}>
                  <div className="subsystem-head">
                    <strong>{subsystem.label}</strong>
                    <span>{subsystem.state}</span>
                  </div>
                  <p>{subsystem.detail}</p>
                  <small>{formatRuntimeSourceLabel(subsystem.source)}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="observatory-card">
            <div className="card-title">Live Runtime</div>
            <div className="observatory-stats">
              <div>
                <span>Peer count</span>
                <strong>{snapshot.integratorState.p2p.peerCount}</strong>
              </div>
              <div>
                <span>GI probes</span>
                <strong>{snapshot.integratorState.gi.probeCount}</strong>
              </div>
              <div>
                <span>Gaussian points</span>
                <strong>{snapshot.integratorState.gaussian.pointCount}</strong>
              </div>
              <div>
                <span>DAO votes</span>
                <strong>{snapshot.integratorState.dao.totalVotes}</strong>
              </div>
              <div>
                <span>Uploaded</span>
                <strong>{formatBytes(snapshot.contribution.uploadedBytes)}</strong>
              </div>
              <div>
                <span>Seed count</span>
                <strong>{snapshot.contribution.seedCount}</strong>
              </div>
            </div>

            <div className="observatory-note">
              高级控制只在这里暴露，用于主动重试真实设备能力或验证降级路径是否可恢复。
            </div>

            <div className="observatory-controls">
              <button type="button" className="observatory-btn" onClick={() => void systemIntegrator.startP2P()}>
                Retry P2P
              </button>
              <button type="button" className="observatory-btn" onClick={() => void systemIntegrator.startEyeTracking()}>
                Start eye tracking
              </button>
              <button type="button" className="observatory-btn" onClick={() => void systemIntegrator.calibrateEyeTracking()}>
                Calibrate
              </button>
              <button type="button" className="observatory-btn" onClick={() => void systemIntegrator.startVoiceControl()}>
                Voice on
              </button>
              <button type="button" className="observatory-btn observatory-btn--ghost" onClick={() => systemIntegrator.stopVoiceControl()}>
                Voice off
              </button>
            </div>
          </section>

          <section className="observatory-card observatory-card--timeline">
            <div className="card-title">Boot Trace</div>
            <div className="trace-list">
              {traces.slice().reverse().map((trace) => (
                <article key={trace.id} className={`trace-item trace-item--${trace.severity}`}>
                  <div className="trace-head">
                    <strong>{trace.title}</strong>
                    <span>{new Date(trace.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {trace.detail && <p>{trace.detail}</p>}
                </article>
              ))}
            </div>
          </section>
        </div>

        <style>{`
          .observatory-backdrop {
            position: fixed;
            inset: 0;
            z-index: 340;
            background: rgba(3, 8, 18, 0.78);
            backdrop-filter: blur(18px);
            display: grid;
            place-items: center;
            padding: 1.25rem;
          }

          .observatory-panel {
            width: min(1180px, 100%);
            max-height: min(88vh, 960px);
            overflow: auto;
            border-radius: 28px;
            border: 1px solid rgba(var(--accent-rgb), 0.18);
            background:
              radial-gradient(circle at top left, rgba(var(--accent-rgb), 0.18), transparent 40%),
              linear-gradient(180deg, rgba(5, 12, 24, 0.96), rgba(4, 10, 18, 0.98));
            box-shadow: 0 40px 80px rgba(0, 0, 0, 0.45);
            padding: 1.5rem;
          }

          .observatory-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1.25rem;
          }

          .observatory-kicker {
            font-family: var(--font-mono);
            font-size: 0.72rem;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: var(--text-muted);
            margin-bottom: 0.4rem;
          }

          .observatory-header h2 {
            margin: 0;
            font-family: var(--font-display);
            font-size: clamp(1.6rem, 4vw, 2.8rem);
            letter-spacing: 0.06em;
          }

          .observatory-actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          .observatory-grid {
            display: grid;
            grid-template-columns: repeat(12, minmax(0, 1fr));
            gap: 1rem;
          }

          .observatory-card {
            grid-column: span 6;
            border-radius: 22px;
            border: 1px solid rgba(var(--accent-rgb), 0.12);
            background: rgba(7, 18, 34, 0.82);
            padding: 1rem;
          }

          .observatory-card--hero {
            grid-column: span 12;
          }

          .observatory-card--timeline {
            grid-column: span 12;
          }

          .card-title {
            font-family: var(--font-mono);
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: var(--text-muted);
            margin-bottom: 0.9rem;
          }

          .hero-chip {
            display: inline-flex;
            padding: 0.35rem 0.7rem;
            border-radius: 999px;
            background: rgba(var(--accent-rgb), 0.08);
            color: var(--accent);
            font-size: 0.75rem;
            margin-bottom: 0.9rem;
          }

          .hero-metrics,
          .observatory-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.8rem;
            margin-bottom: 0.9rem;
          }

          .hero-metrics div,
          .observatory-stats div {
            border-radius: 18px;
            padding: 0.85rem;
            background: rgba(10, 22, 42, 0.72);
          }

          .metric-label,
          .observatory-stats span {
            display: block;
            font-size: 0.72rem;
            color: var(--text-muted);
            margin-bottom: 0.35rem;
          }

          .hero-metrics strong,
          .observatory-stats strong {
            font-family: var(--font-mono);
            font-size: 1.2rem;
            color: var(--text-primary);
          }

          .hero-copy,
          .observatory-note {
            color: var(--text-secondary);
            line-height: 1.6;
          }

          .observatory-note {
            margin-bottom: 0.9rem;
          }

          .capability-list,
          .subsystem-list,
          .trace-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .capability-pill,
          .subsystem-card,
          .trace-item {
            border-radius: 18px;
            padding: 0.85rem 0.95rem;
            background: rgba(10, 22, 42, 0.72);
            border: 1px solid rgba(var(--accent-rgb), 0.08);
          }

          .capability-pill {
            display: flex;
            justify-content: space-between;
            gap: 0.8rem;
          }

          .capability-pill strong,
          .subsystem-head strong,
          .trace-head strong {
            display: block;
            margin-bottom: 0.25rem;
          }

          .capability-pill p,
          .subsystem-card p,
          .trace-item p {
            margin: 0;
            color: var(--text-secondary);
            line-height: 1.5;
          }

          .capability-pill span,
          .subsystem-head span,
          .trace-head span,
          .subsystem-card small {
            font-family: var(--font-mono);
            font-size: 0.72rem;
            color: var(--text-muted);
          }

          .capability-pill--supported {
            border-color: rgba(30, 235, 170, 0.25);
          }

          .capability-pill--fallback,
          .subsystem-card--degraded,
          .trace-item--warning {
            border-color: rgba(255, 214, 0, 0.28);
          }

          .subsystem-card--error,
          .trace-item--error {
            border-color: rgba(255, 56, 103, 0.28);
          }

          .subsystem-head,
          .trace-head {
            display: flex;
            justify-content: space-between;
            gap: 0.75rem;
            margin-bottom: 0.4rem;
          }

          .observatory-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
          }

          .observatory-btn {
            border: 1px solid rgba(var(--accent-rgb), 0.2);
            background: rgba(var(--accent-rgb), 0.1);
            color: var(--text-primary);
            border-radius: 999px;
            padding: 0.65rem 1rem;
            cursor: pointer;
            transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
          }

          .observatory-btn:hover {
            transform: translateY(-1px);
            border-color: rgba(var(--accent-rgb), 0.35);
          }

          .observatory-btn--ghost {
            background: transparent;
          }

          @media (max-width: 900px) {
            .observatory-card {
              grid-column: span 12;
            }
          }
        `}</style>
      </section>
    </div>
  );
};

export default SystemStatusPanel;
