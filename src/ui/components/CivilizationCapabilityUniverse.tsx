import React, { useEffect, useMemo, useState } from 'react';
import type { CapabilityProfile } from '@/runtime/capabilities';
import type { RequirementPanelAction } from '@/runtime/requirements';
import type { SubsystemSnapshot } from '@/runtime/runtimeStore';
import {
  REQUIREMENT_UNIVERSE_SECTIONS,
  getRequirementFeaturesBySection,
  getRequirementStatusDescription,
  getRequirementStatusLabel,
  getRequirementStatusTone,
  getRequirementUniverseSummary,
  requirementFeatureRegistry,
  type RequirementFeatureDescriptor,
  type RequirementUniverseSection,
} from '@/runtime/requirements/featureRegistry';

interface CivilizationCapabilityUniverseProps {
  capabilityProfile?: CapabilityProfile | null;
  subsystems?: Record<string, SubsystemSnapshot>;
  variant?: 'stage' | 'world';
  onInspectObservatory?: () => void;
  onAction?: (action: RequirementPanelAction) => void;
}

function getCapabilityLabel(profile: CapabilityProfile | null | undefined, capabilityId: string): string {
  const capability = profile?.capabilities[capabilityId as keyof typeof profile.capabilities];
  return capability?.label ?? capabilityId;
}

function getCapabilityTone(profile: CapabilityProfile | null | undefined, capabilityId: string): string {
  const capability = profile?.capabilities[capabilityId as keyof typeof profile.capabilities];
  if (!capability) {
    return 'unknown';
  }

  return capability.supported ? 'supported' : 'fallback';
}

function getSectionFeatures(sectionId: RequirementUniverseSection): RequirementFeatureDescriptor[] {
  return getRequirementFeaturesBySection(sectionId);
}

function getActionLabel(action: RequirementPanelAction): string {
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
      return 'Explore Details';
  }
}

function normalizeAtlasText(value: string): string {
  return value.replace(/鈫\?/g, '->').replace(/\s+/g, ' ').trim();
}

export const CivilizationCapabilityUniverse: React.FC<CivilizationCapabilityUniverseProps> = ({
  capabilityProfile,
  subsystems,
  variant = 'stage',
  onInspectObservatory,
  onAction,
}) => {
  const [activeSection, setActiveSection] = useState<RequirementUniverseSection>('civilization');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(requirementFeatureRegistry[0]?.id ?? '');

  const activeFeatures = useMemo(
    () => getSectionFeatures(activeSection),
    [activeSection],
  );

  useEffect(() => {
    if (!activeFeatures.some((feature) => feature.id === selectedFeatureId)) {
      setSelectedFeatureId(activeFeatures[0]?.id ?? '');
    }
  }, [activeFeatures, selectedFeatureId]);

  const selectedFeature = useMemo(
    () => activeFeatures.find((feature) => feature.id === selectedFeatureId) ?? activeFeatures[0],
    [activeFeatures, selectedFeatureId],
  );

  const summary = useMemo(() => getRequirementUniverseSummary(), []);
  const degradedSubsystems = useMemo(
    () =>
      Object.values(subsystems ?? {}).filter(
        (subsystem) => subsystem.state === 'degraded' || subsystem.state === 'error',
      ).length,
    [subsystems],
  );

  return (
    <section className={`capability-universe capability-universe--${variant}`}>
      <div className="capability-universe__hero">
        <div>
          <div className="capability-universe__eyebrow">Feature Universe</div>
          <h2>Civilization Capability Atlas</h2>
          <p>
            The requirement atlas turns the product surface into something both playable and auditable:
            every cluster points to a real entry path, a runtime contract, and an explicit fallback story.
          </p>
        </div>

        <div className="capability-universe__metrics">
          <div>
            <span>Native</span>
            <strong>{summary.native}</strong>
          </div>
          <div>
            <span>Fallback</span>
            <strong>{summary.fallback}</strong>
          </div>
          <div>
            <span>Simulated</span>
            <strong>{summary.simulated}</strong>
          </div>
          <div>
            <span>Subsystem alerts</span>
            <strong>{degradedSubsystems}</strong>
          </div>
        </div>
      </div>

      <div className="capability-universe__section-tabs" role="tablist" aria-label="Capability sections">
        {REQUIREMENT_UNIVERSE_SECTIONS.map((section) => {
          const count = getSectionFeatures(section.id).length;
          const isActive = section.id === activeSection;

          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`capability-universe__section-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span>{section.labelEN}</span>
              <small>{count} clusters</small>
              <strong>{count}</strong>
            </button>
          );
        })}
      </div>

      <div className="capability-universe__body">
        <div className="capability-universe__feature-grid">
          {activeFeatures.map((feature) => {
            const isActive = feature.id === selectedFeature?.id;
            const tone = getRequirementStatusTone(feature.status);

            return (
              <button
                key={feature.id}
                type="button"
                className={`capability-feature-card capability-feature-card--${tone} ${isActive ? 'is-active' : ''}`}
                onClick={() => setSelectedFeatureId(feature.id)}
              >
                <div className="capability-feature-card__topline">
                  <span>{feature.sectionLabelEN}</span>
                  <strong>{getRequirementStatusLabel(feature.status)}</strong>
                </div>
                <div className="capability-feature-card__title">{feature.titleEN}</div>
                <p>{feature.readmeSummaryEN}</p>
                <div className="capability-feature-card__clauses">
                  {feature.sourceClauses.slice(0, 4).map((clause) => (
                    <span key={clause}>{clause}</span>
                  ))}
                  {feature.sourceClauses.length > 4 && (
                    <span>+{feature.sourceClauses.length - 4}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedFeature && (
          <article className="capability-universe__detail">
            <div className="capability-universe__detail-topline">
              <span>{selectedFeature.sectionLabelEN}</span>
              <strong>{getRequirementStatusLabel(selectedFeature.status)}</strong>
            </div>
            <h3>{selectedFeature.titleEN}</h3>
            <p className="capability-universe__detail-summary">{selectedFeature.readmeSummaryEN}</p>

            <div className="capability-universe__detail-grid">
              <div>
                <span>Primary entry</span>
                <strong>{normalizeAtlasText(selectedFeature.experienceEntryEN)}</strong>
              </div>
              <div>
                <span>Runtime subsystem</span>
                <strong>{selectedFeature.runtimeSubsystem}</strong>
              </div>
              <div>
                <span>Covered clauses</span>
                <strong>{selectedFeature.sourceClauses.length}</strong>
              </div>
              <div>
                <span>Public status</span>
                <strong>{getRequirementStatusDescription(selectedFeature.status)}</strong>
              </div>
            </div>

            <div className="capability-universe__detail-block">
              <div className="capability-universe__detail-label">Capability dependencies</div>
              <div className="capability-universe__caps">
                {selectedFeature.capabilityDependencies.length === 0 && (
                  <span className="capability-pill capability-pill--supported">Local runtime only</span>
                )}
                {selectedFeature.capabilityDependencies.map((capabilityId) => (
                  <span
                    key={capabilityId}
                    className={`capability-pill capability-pill--${getCapabilityTone(capabilityProfile, capabilityId)}`}
                  >
                    {getCapabilityLabel(capabilityProfile, capabilityId)}
                  </span>
                ))}
              </div>
            </div>

            <div className="capability-universe__detail-block">
              <div className="capability-universe__detail-label">Clause coverage</div>
              <div className="capability-universe__clauses">
                {selectedFeature.sourceClauses.map((clause) => (
                  <span key={clause}>{clause}</span>
                ))}
              </div>
            </div>

            <div className="capability-universe__detail-actions">
              {selectedFeature.panelAction !== 'none' && onAction && (
                <button
                  type="button"
                  className="capability-universe__inspect"
                  onClick={() => onAction(selectedFeature.panelAction)}
                >
                  {getActionLabel(selectedFeature.panelAction)}
                </button>
              )}
              {onInspectObservatory && (
                <button
                  type="button"
                  className="capability-universe__inspect capability-universe__inspect--ghost"
                  onClick={onInspectObservatory}
                >
                  Open Observatory
                </button>
              )}
            </div>
          </article>
        )}
      </div>
    </section>
  );
};

export default CivilizationCapabilityUniverse;
