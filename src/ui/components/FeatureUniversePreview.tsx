import React, { useMemo } from 'react';
import { useRuntimeStore } from '@/runtime/runtimeStore';
import {
  getRequirementCoverageSnapshot,
  getRequirementUniverseGroupsWithFeatures,
  resolveFeatureRuntimePath,
} from '@/runtime/requirements';

interface FeatureUniversePreviewProps {
  className?: string;
  onOpen?: () => void;
  ctaLabel?: string;
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
      <style>{`
        .feature-universe-preview {
          border-radius: 28px;
          border: 1px solid rgba(var(--accent-rgb), 0.16);
          background:
            radial-gradient(circle at top left, rgba(var(--accent-rgb), 0.16), transparent 34%),
            linear-gradient(180deg, rgba(5, 12, 24, 0.94), rgba(4, 10, 18, 0.98));
          box-shadow: 0 24px 56px rgba(0, 0, 0, 0.28);
          padding: 1.15rem;
          display: grid;
          gap: 1rem;
        }

        .feature-universe-preview__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .feature-universe-preview__eyebrow {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .feature-universe-preview h2 {
          margin: 0.35rem 0 0;
          font-family: var(--font-display);
          font-size: clamp(1.4rem, 4vw, 2.6rem);
          letter-spacing: 0.06em;
        }

        .feature-universe-preview p {
          color: var(--text-secondary);
          line-height: 1.65;
          margin: 0;
        }

        .feature-universe-preview__actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .feature-universe-preview__button {
          border-radius: 999px;
          border: 1px solid rgba(var(--accent-rgb), 0.24);
          background: rgba(var(--accent-rgb), 0.08);
          color: var(--text-primary);
          padding: 0.62rem 1rem;
          font-weight: 600;
          cursor: pointer;
        }

        .feature-universe-preview__metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.8rem;
        }

        .feature-universe-preview__metric {
          border-radius: 18px;
          padding: 0.85rem;
          background: rgba(9, 21, 40, 0.76);
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .feature-universe-preview__metric span {
          display: block;
          color: var(--text-muted);
          font-size: 0.76rem;
          margin-bottom: 0.25rem;
        }

        .feature-universe-preview__metric strong {
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
          background: rgba(9, 21, 40, 0.76);
        }

        .feature-universe-preview__group-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .feature-universe-preview__group h3 {
          margin: 0;
          font-size: 1rem;
        }

        .feature-universe-preview__list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        .feature-universe-preview__chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          border-radius: 999px;
          padding: 0.35rem 0.7rem;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          font-size: 0.76rem;
        }

        @media (max-width: 720px) {
          .feature-universe-preview {
            border-radius: 24px;
          }

          .feature-universe-preview__header {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="feature-universe-preview__header">
        <div>
          <div className="feature-universe-preview__eyebrow">Feature Universe</div>
          <h2>Civilization Capability Atlas</h2>
          <p>
            The public atlas condenses the private requirement source into five runtime-facing layers
            and seventeen capability clusters. What you see here is the actual release surface.
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
                  {feature.titleEN}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeatureUniversePreview;
