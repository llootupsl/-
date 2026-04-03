import React, { useEffect, useMemo, useState } from 'react';
import { useRuntimeStore } from '@/runtime/runtimeStore';
import {
  formatRequirementRuntimePath,
  formatRequirementStatus,
  getFeatureSourceClauses,
  getFeatureUnsupportedDependencies,
  getRequirementCoverageSnapshot,
  getRequirementUniverseGroupsWithFeatures,
  resolveFeatureRuntimePath,
  type RequirementFeatureDescriptor,
  type RequirementPanelAction,
} from '@/runtime/requirements';

interface FeatureUniversePreviewProps {
  className?: string;
  onOpen?: () => void;
  ctaLabel?: string;
}

interface FeatureUniversePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: RequirementPanelAction) => void;
}

function actionLabel(action: RequirementPanelAction): string {
  switch (action) {
    case 'citizens':
      return 'Open Citizen Kernel';
    case 'dao':
      return 'Open DAO Center';
    case 'divine':
      return 'Open Divine Layer';
    case 'chat':
      return 'Open Runtime Chat';
    case 'observatory':
      return 'Open Observatory';
    default:
      return 'Review Details';
  }
}

function toneClass(path: ReturnType<typeof resolveFeatureRuntimePath>): string {
  switch (path) {
    case 'native':
      return 'native';
    case 'fallback':
      return 'fallback';
    case 'simulated':
      return 'simulated';
    case 'unavailable-with-reason':
      return 'unavailable';
    default:
      return 'fallback';
  }
}

function normalizeAtlasText(value: string): string {
  return value.replace(/鈫\?/g, '->').replace(/\s+/g, ' ').trim();
}

function UniverseStyles() {
  return (
    <style>{`
      .feature-universe-preview,
      .feature-universe-panel {
        --universe-border: rgba(var(--accent-rgb), 0.16);
        --universe-surface: rgba(7, 17, 32, 0.88);
        --universe-soft: rgba(9, 21, 40, 0.76);
      }

      .feature-universe-preview {
        border-radius: 28px;
        border: 1px solid var(--universe-border);
        background:
          radial-gradient(circle at top left, rgba(var(--accent-rgb), 0.16), transparent 34%),
          linear-gradient(180deg, rgba(5, 12, 24, 0.94), rgba(4, 10, 18, 0.98));
        box-shadow: 0 24px 56px rgba(0, 0, 0, 0.28);
        padding: 1.15rem;
        display: grid;
        gap: 1rem;
      }

      .feature-universe-preview__header,
      .feature-universe-panel__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }

      .feature-universe-preview__eyebrow,
      .feature-universe-panel__eyebrow,
      .feature-universe-panel__detail-label {
        font-family: var(--font-mono);
        font-size: 0.72rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--text-muted);
      }

      .feature-universe-preview h2,
      .feature-universe-panel__header h2 {
        margin: 0.35rem 0 0;
        font-family: var(--font-display);
        font-size: clamp(1.4rem, 4vw, 2.6rem);
        letter-spacing: 0.06em;
      }

      .feature-universe-preview p,
      .feature-universe-panel__header p,
      .feature-universe-panel__detail-copy,
      .feature-universe-panel__detail-block p {
        color: var(--text-secondary);
        line-height: 1.65;
        margin: 0;
      }

      .feature-universe-preview__actions,
      .feature-universe-panel__actions,
      .feature-universe-panel__detail-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .feature-universe-preview__button,
      .feature-universe-panel__button {
        border-radius: 999px;
        border: 1px solid rgba(var(--accent-rgb), 0.24);
        background: rgba(var(--accent-rgb), 0.08);
        color: var(--text-primary);
        padding: 0.62rem 1rem;
        font-weight: 600;
        cursor: pointer;
      }

      .feature-universe-panel__button--ghost {
        background: rgba(255, 255, 255, 0.04);
      }

      .feature-universe-preview__metrics,
      .feature-universe-panel__metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.8rem;
      }

      .feature-universe-preview__metric,
      .feature-universe-panel__metric,
      .feature-universe-panel__detail-block,
      .feature-universe-panel__group,
      .feature-universe-panel__feature-card {
        border-radius: 18px;
        padding: 0.9rem;
        background: var(--universe-soft);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .feature-universe-preview__metric span,
      .feature-universe-panel__metric span {
        display: block;
        color: var(--text-muted);
        font-size: 0.76rem;
        margin-bottom: 0.25rem;
      }

      .feature-universe-preview__metric strong,
      .feature-universe-panel__metric strong {
        font-family: var(--font-mono);
        font-size: 1.14rem;
      }

      .feature-universe-preview__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.9rem;
      }

      .feature-universe-preview__group {
        padding: 1rem;
        display: grid;
        gap: 0.7rem;
        border-radius: 22px;
        border: 1px solid rgba(var(--accent-rgb), 0.1);
        background: var(--universe-soft);
      }

      .feature-universe-preview__group-head,
      .feature-universe-panel__group-head,
      .feature-universe-panel__feature-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .feature-universe-preview__group h3,
      .feature-universe-panel__group h3,
      .feature-universe-panel__detail-title,
      .feature-universe-panel__feature-card h4 {
        margin: 0;
        font-size: 1rem;
      }

      .feature-universe-preview__list,
      .feature-universe-panel__chip-list,
      .feature-universe-panel__module-list,
      .feature-universe-panel__clause-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      .feature-universe-preview__chip,
      .feature-universe-panel__chip,
      .feature-universe-panel__module,
      .feature-universe-panel__clause {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        border-radius: 999px;
        padding: 0.35rem 0.7rem;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-secondary);
        font-size: 0.76rem;
      }

      .feature-universe-panel__backdrop {
        position: fixed;
        inset: 0;
        z-index: 360;
        background: rgba(2, 7, 16, 0.82);
        backdrop-filter: blur(24px);
        padding: 1rem;
      }

      .feature-universe-panel {
        width: min(1420px, 100%);
        height: min(92vh, 100%);
        margin: 0 auto;
        border-radius: 30px;
        border: 1px solid rgba(var(--accent-rgb), 0.16);
        background:
          radial-gradient(circle at top left, rgba(var(--accent-rgb), 0.16), transparent 36%),
          radial-gradient(circle at bottom right, rgba(255, 56, 103, 0.14), transparent 32%),
          linear-gradient(180deg, rgba(4, 10, 18, 0.96), rgba(3, 9, 16, 0.98));
        box-shadow: 0 44px 90px rgba(0, 0, 0, 0.46);
        padding: 1.25rem;
        display: grid;
        grid-template-rows: auto auto 1fr;
        gap: 1rem;
      }

      .feature-universe-panel__body {
        min-height: 0;
        display: grid;
        grid-template-columns: 1.05fr 1.35fr;
        gap: 1rem;
      }

      .feature-universe-panel__groups,
      .feature-universe-panel__detail {
        min-height: 0;
        overflow: auto;
      }

      .feature-universe-panel__groups {
        display: grid;
        gap: 0.85rem;
      }

      .feature-universe-panel__group {
        display: grid;
        gap: 0.8rem;
      }

      .feature-universe-panel__feature-list {
        display: grid;
        gap: 0.7rem;
      }

      .feature-universe-panel__feature-card {
        cursor: pointer;
        transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
      }

      .feature-universe-panel__feature-card:hover,
      .feature-universe-panel__feature-card--active {
        border-color: rgba(var(--accent-rgb), 0.3);
        transform: translateY(-1px);
        background: rgba(14, 30, 56, 0.82);
      }

      .feature-universe-panel__detail {
        padding: 1rem;
        display: grid;
        gap: 1rem;
        border-radius: 22px;
        background: rgba(8, 18, 34, 0.82);
        border: 1px solid rgba(var(--accent-rgb), 0.12);
      }

      .feature-universe-panel__detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.85rem;
      }

      .feature-universe-panel__path {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border-radius: 999px;
        padding: 0.35rem 0.7rem;
        font-size: 0.76rem;
        background: rgba(255, 255, 255, 0.05);
      }

      .feature-universe-panel__path--native {
        color: #87ffd3;
        border: 1px solid rgba(135, 255, 211, 0.18);
      }

      .feature-universe-panel__path--fallback {
        color: #ffe089;
        border: 1px solid rgba(255, 224, 137, 0.18);
      }

      .feature-universe-panel__path--simulated {
        color: #a6b2ff;
        border: 1px solid rgba(166, 178, 255, 0.18);
      }

      .feature-universe-panel__path--unavailable {
        color: #ff9a9a;
        border: 1px solid rgba(255, 154, 154, 0.18);
      }

      .feature-universe-panel__status {
        color: var(--text-muted);
        font-size: 0.8rem;
      }

      @media (max-width: 1100px) {
        .feature-universe-panel__body {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .feature-universe-panel,
        .feature-universe-preview {
          border-radius: 24px;
        }

        .feature-universe-panel__header,
        .feature-universe-preview__header {
          flex-direction: column;
        }
      }
    `}</style>
  );
}

function renderSummaryFeature(feature: RequirementFeatureDescriptor) {
  return feature.titleEN;
}

export function FeatureUniversePreview({
  className,
  onOpen,
  ctaLabel = 'Open the feature atlas',
}: FeatureUniversePreviewProps) {
  const capabilityProfile = useRuntimeStore((state) => state.capabilityProfile);
  const groups = useMemo(() => getRequirementUniverseGroupsWithFeatures(), []);
  const coverage = useMemo(() => getRequirementCoverageSnapshot(), []);
  const statusSummary = useMemo(() => {
    const counts = { native: 0, fallback: 0, simulated: 0, unavailable: 0 };
    for (const group of groups) {
      for (const feature of group.features) {
        const path = resolveFeatureRuntimePath(feature, capabilityProfile);
        counts[toneClass(path)] += 1;
      }
    }
    return counts;
  }, [capabilityProfile, groups]);

  return (
    <section className={`feature-universe-preview ${className ?? ''}`}>
      <UniverseStyles />
      <div className="feature-universe-preview__header">
        <div>
          <div className="feature-universe-preview__eyebrow">Feature Universe</div>
          <h2>Civilization Capability Atlas</h2>
          <p>
            The public atlas condenses the private requirement source into five runtime-facing layers
            and seventeen capability clusters. What you see here is the actual release surface, not
            a promise detached from the code.
          </p>
        </div>
        <div className="feature-universe-preview__actions">
          {onOpen && (
            <button type="button" className="feature-universe-preview__button" onClick={onOpen}>
              {ctaLabel}
            </button>
          )}
        </div>
      </div>

      <div className="feature-universe-preview__metrics">
        <div className="feature-universe-preview__metric">
          <span>Derived clauses</span>
          <strong>{coverage.coveredClauses}/{coverage.totalClauses}</strong>
        </div>
        <div className="feature-universe-preview__metric">
          <span>Native clusters</span>
          <strong>{statusSummary.native}</strong>
        </div>
        <div className="feature-universe-preview__metric">
          <span>Fallback-visible clusters</span>
          <strong>{statusSummary.fallback + statusSummary.unavailable}</strong>
        </div>
        <div className="feature-universe-preview__metric">
          <span>Explicit simulations</span>
          <strong>{statusSummary.simulated}</strong>
        </div>
      </div>

      <div className="feature-universe-preview__grid">
        {groups.map((group) => (
          <article key={group.id} className="feature-universe-preview__group">
            <div className="feature-universe-preview__group-head">
              <div>
                <h3>{group.titleEN}</h3>
                <small>{group.features.length} clusters</small>
              </div>
              <strong>{group.features.length}</strong>
            </div>
            <p>{group.summaryEN}</p>
            <div className="feature-universe-preview__list">
              {group.features.slice(0, 3).map((feature) => (
                <span key={feature.id} className="feature-universe-preview__chip">
                  {renderSummaryFeature(feature)}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function FeatureUniversePanel({
  isOpen,
  onClose,
  onAction,
}: FeatureUniversePanelProps) {
  const capabilityProfile = useRuntimeStore((state) => state.capabilityProfile);
  const groups = useMemo(() => getRequirementUniverseGroupsWithFeatures(), []);
  const coverage = useMemo(() => getRequirementCoverageSnapshot(), []);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('');

  useEffect(() => {
    if (!selectedFeatureId && groups[0]?.features[0]) {
      setSelectedFeatureId(groups[0].features[0].id);
    }
  }, [groups, selectedFeatureId]);

  if (!isOpen) {
    return null;
  }

  const allFeatures = groups.flatMap((group) => group.features);
  const selectedFeature =
    allFeatures.find((feature) => feature.id === selectedFeatureId)
    ?? allFeatures[0];

  const selectedPath = resolveFeatureRuntimePath(selectedFeature, capabilityProfile);
  const selectedClauses = getFeatureSourceClauses(selectedFeature).slice(0, 20);
  const missingDependencies = getFeatureUnsupportedDependencies(selectedFeature, capabilityProfile);

  return (
    <div className="feature-universe-panel__backdrop" onClick={onClose}>
      <UniverseStyles />
      <section
        className="feature-universe-panel"
        onClick={(event) => event.stopPropagation()}
        aria-label="Requirement feature universe"
      >
        <div className="feature-universe-panel__header">
          <div>
            <div className="feature-universe-panel__eyebrow">Requirement Mainline</div>
            <h2>Civilization Capability Atlas</h2>
            <p>
              This overlay keeps requirement coverage, runtime path, fallback honesty, and code-entry
              evidence in one place. It is the public proof surface for what the browser world can
              actually do in this release.
            </p>
          </div>
          <div className="feature-universe-panel__actions">
            <button type="button" className="feature-universe-panel__button feature-universe-panel__button--ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="feature-universe-panel__metrics">
          <div className="feature-universe-panel__metric">
            <span>Requirement coverage</span>
            <strong>{coverage.coveredClauses}/{coverage.totalClauses}</strong>
          </div>
          <div className="feature-universe-panel__metric">
            <span>Universe layers</span>
            <strong>{groups.length}</strong>
          </div>
          <div className="feature-universe-panel__metric">
            <span>Feature clusters</span>
            <strong>{allFeatures.length}</strong>
          </div>
          <div className="feature-universe-panel__metric">
            <span>Device tier</span>
            <strong>{capabilityProfile?.device.level ?? '--'}</strong>
          </div>
        </div>

        <div className="feature-universe-panel__body">
          <div className="feature-universe-panel__groups">
            {groups.map((group) => (
              <section key={group.id} className="feature-universe-panel__group">
                <div className="feature-universe-panel__group-head">
                  <div>
                    <div className="feature-universe-panel__eyebrow">Universe Layer</div>
                    <h3>{group.titleEN}</h3>
                  </div>
                  <strong>{group.features.length}</strong>
                </div>
                <p>{group.summaryEN}</p>
                <div className="feature-universe-panel__feature-list">
                  {group.features.map((feature) => {
                    const currentPath = resolveFeatureRuntimePath(feature, capabilityProfile);
                    return (
                      <article
                        key={feature.id}
                        className={`feature-universe-panel__feature-card ${selectedFeature.id === feature.id ? 'feature-universe-panel__feature-card--active' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedFeatureId(feature.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedFeatureId(feature.id);
                          }
                        }}
                      >
                        <div className="feature-universe-panel__feature-head">
                          <div>
                            <h4>{feature.titleEN}</h4>
                            <div className="feature-universe-panel__status">
                              {formatRequirementStatus(feature.status)}
                            </div>
                          </div>
                          <span className={`feature-universe-panel__path feature-universe-panel__path--${toneClass(currentPath)}`}>
                            {formatRequirementRuntimePath(currentPath)}
                          </span>
                        </div>
                        <p>{feature.readmeSummaryEN}</p>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <aside className="feature-universe-panel__detail">
            <div>
              <div className="feature-universe-panel__eyebrow">Selected cluster</div>
              <h3 className="feature-universe-panel__detail-title">{selectedFeature.titleEN}</h3>
              <p className="feature-universe-panel__detail-copy">{selectedFeature.readmeSummaryEN}</p>
            </div>

            <div className="feature-universe-panel__detail-actions">
              <span className={`feature-universe-panel__path feature-universe-panel__path--${toneClass(selectedPath)}`}>
                {formatRequirementRuntimePath(selectedPath)}
              </span>
              {selectedFeature.panelAction !== 'none' && onAction && (
                <button
                  type="button"
                  className="feature-universe-panel__button"
                  onClick={() => onAction(selectedFeature.panelAction)}
                >
                  {actionLabel(selectedFeature.panelAction)}
                </button>
              )}
              <span className="feature-universe-panel__chip">
                Entry: {normalizeAtlasText(selectedFeature.experienceEntryEN)}
              </span>
            </div>

            <div className="feature-universe-panel__detail-grid">
              <section className="feature-universe-panel__detail-block">
                <strong>Runtime subsystem</strong>
                <p>{selectedFeature.runtimeSubsystem}</p>
              </section>
              <section className="feature-universe-panel__detail-block">
                <strong>Capability count</strong>
                <p>{selectedFeature.capabilityDependencies.length || 1} dependencies tracked.</p>
              </section>
              <section className="feature-universe-panel__detail-block">
                <strong>Clause count</strong>
                <p>{selectedFeature.coveredClauses.length} mapped clauses.</p>
              </section>
              <section className="feature-universe-panel__detail-block">
                <strong>Public status</strong>
                <p>{formatRequirementStatus(selectedFeature.status)}</p>
              </section>
            </div>

            <section className="feature-universe-panel__detail-block">
              <div className="feature-universe-panel__detail-label">Capability dependencies</div>
              <div className="feature-universe-panel__chip-list">
                {selectedFeature.capabilityDependencies.map((capabilityId) => (
                  <span key={capabilityId} className="feature-universe-panel__chip">
                    {capabilityId}
                  </span>
                ))}
                {selectedFeature.capabilityDependencies.length === 0 && (
                  <span className="feature-universe-panel__chip">local-only</span>
                )}
              </div>
              {missingDependencies.length > 0 && (
                <p>
                  Missing on this device: {missingDependencies.join(', ')}. This cluster will stay in
                  fallback or unavailable mode instead of pretending the native path succeeded.
                </p>
              )}
            </section>

            <section className="feature-universe-panel__detail-block">
              <div className="feature-universe-panel__detail-label">Code entry points</div>
              <div className="feature-universe-panel__module-list">
                {selectedFeature.modulePaths.map((modulePath) => (
                  <span key={modulePath} className="feature-universe-panel__module">
                    {modulePath}
                  </span>
                ))}
              </div>
            </section>

            <section className="feature-universe-panel__detail-block">
              <div className="feature-universe-panel__detail-label">Clause coverage</div>
              <div className="feature-universe-panel__clause-list">
                {selectedClauses.map((clause) => (
                  <span key={`${clause.docId}-${clause.clause}`} className="feature-universe-panel__clause">
                    {clause.clause}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default FeatureUniversePanel;
