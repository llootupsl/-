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
  switch (action as string) {
    case 'citizens':
      return '打开市民内核';
    case 'society':
      return '打开社会织网';
    case 'economy':
      return '打开经济层';
    case 'dao':
    case 'governance':
      return '打开 DAO 中心';
    case 'divine':
    case 'entropy':
      return '打开神谕层';
    case 'chat':
    case 'multimodal':
      return '打开运行时对话';
    case 'environment':
      return '打开风险控制台';
    case 'genesis':
      return '打开创世纪双生';
    case 'identity':
      return '打开身份层';
    case 'persistence':
      return '打开幽灵时间';
    case 'network':
      return '打开桥接控制台';
    case 'ecosystem':
      return '打开生态锻炉';
    case 'benchmark':
      return '打开基准测试';
    case 'rendering':
      return '打开渲染观测台';
    case 'observatory':
      return '打开观测台';
    default:
      return '查看详情';
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
  const fallbackVisibleCount = summary['降级'];
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
          <div className="capability-universe__eyebrow">功能宇宙</div>
          <h2>文明能力图谱</h2>
          <p>
            需求图谱把产品表面变成既可玩又可审计的对象：每个能力簇都指向真实入口、运行时契约和明确的降级故事。
          </p>
        </div>

        <div className="capability-universe__metrics">
          <div>
            <span>主线原生</span>
            <strong>{summary['原生']}</strong>
          </div>
          <div>
            <span>主线降级</span>
            <strong>{fallbackVisibleCount}</strong>
          </div>
          <div>
            <span>宇宙分区</span>
            <strong>{REQUIREMENT_UNIVERSE_SECTIONS.length}</strong>
          </div>
          <div>
            <span>子系统告警</span>
            <strong>{degradedSubsystems}</strong>
          </div>
        </div>
      </div>

      <div className="capability-universe__section-tabs" role="tablist" aria-label="能力分区">
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
              <span>{section.labelCN}</span>
              <small>{count} 个簇</small>
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
                  <span>{feature.sectionLabelCN}</span>
                  <strong>{getRequirementStatusLabel(feature.status)}</strong>
                </div>
                <div className="capability-feature-card__title">{feature.titleCN}</div>
                <p>{feature.readmeSummary}</p>
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
              <span>{selectedFeature.sectionLabelCN}</span>
              <strong>{getRequirementStatusLabel(selectedFeature.status)}</strong>
            </div>
            <h3>{selectedFeature.titleCN}</h3>
            <p className="capability-universe__detail-summary">{selectedFeature.readmeSummary}</p>

            <div className="capability-universe__detail-grid">
              <div>
                <span>主入口</span>
                <strong>{normalizeAtlasText(selectedFeature.experienceEntry)}</strong>
              </div>
              <div>
                <span>运行时子系统</span>
                <strong>{selectedFeature.runtimeSubsystem}</strong>
              </div>
              <div>
                <span>覆盖条款</span>
                <strong>{selectedFeature.sourceClauses.length}</strong>
              </div>
              <div>
                <span>公开状态</span>
                <strong>{getRequirementStatusDescription(selectedFeature.status)}</strong>
              </div>
            </div>

            <div className="capability-universe__detail-block">
              <div className="capability-universe__detail-label">能力依赖</div>
              <div className="capability-universe__caps">
                {selectedFeature.capabilityDependencies.length === 0 && (
                  <span className="capability-pill capability-pill--supported">仅本地运行时</span>
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
              <div className="capability-universe__detail-label">条款覆盖</div>
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
                  打开观测台
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
