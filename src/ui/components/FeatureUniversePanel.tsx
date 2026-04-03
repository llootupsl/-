import React, { useEffect, useMemo, useState } from 'react';
import { useRuntimeStore } from '@/runtime/runtimeStore';
import { Badge, Button, Card } from './common';
import { ConflictClimateFeaturePanel } from './ConflictClimateFeaturePanel';
import { PluginEcosystemFeaturePanel } from './PluginEcosystemFeaturePanel';
import { SocietyFeaturePanel } from './SocietyFeaturePanel';
import { SpaceConnectionFeaturePanel } from './SpaceConnectionFeaturePanel';
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

type MainlineSurfaceId = 'atlas' | 'society' | 'conflict' | 'space' | 'plugins';

interface MainlineSurfaceDescriptor {
  id: MainlineSurfaceId;
  title: string;
  eyebrow: string;
  summary: string;
  tone: 'native' | 'fallback' | 'unavailable';
}

const MAINLINE_SURFACES: MainlineSurfaceDescriptor[] = [
  {
    id: 'atlas',
    title: '总图谱',
    eyebrow: '需求地图',
    summary: '打开完整能力图谱，查看实时需求细节。',
    tone: 'native',
  },
  {
    id: 'society',
    title: '社会',
    eyebrow: '文化与叙事',
    summary: '新闻、学校与信念网络共享同一张市民图谱。',
    tone: 'native',
  },
  {
    id: 'conflict',
    title: '冲突',
    eyebrow: '治安与气候',
    summary: '治安秩序、疫情控制与气候漂移一起保持可见。',
    tone: 'fallback',
  },
  {
    id: 'space',
    title: '空间',
    eyebrow: '桥接与 Fork',
    summary: '二维码接力、点对点传输与 Torrent 快照构成同一路径。',
    tone: 'native',
  },
  {
    id: 'plugins',
    title: '插件',
    eyebrow: '世界 Fork',
    summary: '插件、注册表开关与分支快照都保持可编辑。',
    tone: 'native',
  },
];

function actionLabel(action: RequirementPanelAction): string {
  switch (action as string) {
    case 'citizens':
      return '打开市民内核';
    case 'society':
      return '打开社会织网';
    case 'economy':
      return '打开经济与基础设施';
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
      return '打开身份与证据';
    case 'persistence':
      return '打开持久化与幽灵时间';
    case 'network':
      return '打开空间连接';
    case 'ecosystem':
      return '打开生态锻炉';
    case 'benchmark':
      return '打开基准控制台';
    case 'rendering':
      return '打开渲染内核';
    case 'observatory':
      return '打开观测台';
    default:
      return '查看详情';
  }
}

function toneClass(path: ReturnType<typeof resolveFeatureRuntimePath>): string {
  switch (path) {
    case 'native':
      return 'native';
    case 'fallback':
      return 'fallback';
    case 'unavailable-with-reason':
      return 'unavailable';
    default:
      return 'fallback';
  }
}

function toneBadgeVariant(tone: MainlineSurfaceDescriptor['tone']): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (tone) {
    case 'native':
      return 'success';
    case 'fallback':
      return 'warning';
    case 'unavailable':
      return 'danger';
    default:
      return 'default';
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

      .feature-universe-panel__surface-rail {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
      }

      .feature-universe-panel__surface-card {
        text-align: left;
        display: grid;
        gap: 0.45rem;
        border-radius: 20px;
        padding: 0.95rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-primary);
        cursor: pointer;
        transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
      }

      .feature-universe-panel__surface-card:hover,
      .feature-universe-panel__surface-card--active {
        transform: translateY(-1px);
        border-color: rgba(var(--accent-rgb), 0.28);
        background: rgba(14, 30, 56, 0.82);
      }

      .feature-universe-panel__surface-eyebrow {
        color: var(--text-muted);
        font-family: var(--font-mono);
        font-size: 0.7rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .feature-universe-panel__surface-title {
        margin: 0;
        font-size: 1rem;
      }

      .feature-universe-panel__surface-summary {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.5;
        font-size: 0.84rem;
      }

      .feature-universe-panel__surface-panel {
        min-height: 0;
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
  return feature.title;
}

export function FeatureUniversePreview({
  className,
  onOpen,
  ctaLabel = '打开功能图谱',
}: FeatureUniversePreviewProps) {
  const capabilityProfile = useRuntimeStore((state) => state.capabilityProfile);
  const groups = useMemo(() => getRequirementUniverseGroupsWithFeatures(), []);
  const coverage = useMemo(() => getRequirementCoverageSnapshot(), []);
  const statusSummary = useMemo(() => {
    const counts = { native: 0, fallback: 0, unavailable: 0 };
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
          <div className="feature-universe-preview__eyebrow">功能宇宙</div>
          <h2>文明能力图谱</h2>
          <p>
            公开图谱把私有需求源压缩成五个面向运行时的层级和十七个能力簇。你在这里看到的
            是真实发布面，而不是脱离代码的承诺。
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
          <span>派生条款</span>
          <strong>{coverage.coveredClauses}/{coverage.totalClauses}</strong>
        </div>
        <div className="feature-universe-preview__metric">
          <span>主线原生簇</span>
          <strong>{statusSummary.native}</strong>
        </div>
        <div className="feature-universe-preview__metric">
          <span>可见降级簇</span>
          <strong>{statusSummary.fallback + statusSummary.unavailable}</strong>
        </div>
        <div className="feature-universe-preview__metric">
          <span>不可用簇</span>
          <strong>{statusSummary.unavailable}</strong>
        </div>
      </div>

      <div className="feature-universe-preview__grid">
        {groups.map((group) => (
          <article key={group.id} className="feature-universe-preview__group">
            <div className="feature-universe-preview__group-head">
              <div>
                <h3>{group.title}</h3>
                <small>{group.features.length} 个簇</small>
              </div>
              <strong>{group.features.length}</strong>
            </div>
            <p>{group.summary}</p>
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
  const [activeSurface, setActiveSurface] = useState<MainlineSurfaceId>('atlas');

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

  const activeSurfacePanel = (() => {
    switch (activeSurface) {
      case 'society':
        return <SocietyFeaturePanel className="feature-universe-panel__surface-panel" />;
      case 'conflict':
        return <ConflictClimateFeaturePanel className="feature-universe-panel__surface-panel" />;
      case 'space':
        return <SpaceConnectionFeaturePanel className="feature-universe-panel__surface-panel" />;
      case 'plugins':
        return <PluginEcosystemFeaturePanel className="feature-universe-panel__surface-panel" />;
      case 'atlas':
      default:
        return null;
    }
  })();

  return (
    <div className="feature-universe-panel__backdrop" onClick={onClose}>
      <UniverseStyles />
      <section
        className="feature-universe-panel"
        onClick={(event) => event.stopPropagation()}
        aria-label="需求功能宇宙"
      >
        <div className="feature-universe-panel__header">
          <div>
            <div className="feature-universe-panel__eyebrow">需求主线</div>
            <h2>文明能力图谱</h2>
            <p>
              这个覆盖层把需求覆盖、运行路径、降级诚实度和代码入口证据统一收纳在一处。
              它就是本次发布中浏览器世界真正能做什么的公开证据面。
            </p>
          </div>
          <div className="feature-universe-panel__actions">
            <Button variant="ghost" className="feature-universe-panel__button feature-universe-panel__button--ghost" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>

        <div className="feature-universe-panel__metrics">
          <div className="feature-universe-panel__metric">
            <span>需求覆盖</span>
            <strong>{coverage.coveredClauses}/{coverage.totalClauses}</strong>
          </div>
          <div className="feature-universe-panel__metric">
            <span>宇宙层级</span>
            <strong>{groups.length}</strong>
          </div>
          <div className="feature-universe-panel__metric">
            <span>功能簇</span>
            <strong>{allFeatures.length}</strong>
          </div>
          <div className="feature-universe-panel__metric">
            <span>设备档位</span>
            <strong>{capabilityProfile?.device.level ?? '--'}</strong>
          </div>
        </div>

        <div className="feature-universe-panel__surface-rail">
          {MAINLINE_SURFACES.map((surface) => (
            <Card
              key={surface.id}
              variant="interactive"
              selected={activeSurface === surface.id}
              onClick={() => setActiveSurface(surface.id)}
                title={surface.title}
                subtitle={surface.summary}
                badge={<Badge variant={toneBadgeVariant(surface.tone)}>{surface.eyebrow}</Badge>}
              className={`feature-universe-panel__surface-card ${activeSurface === surface.id ? 'feature-universe-panel__surface-card--active' : ''}`}
            />
          ))}
        </div>

        <div className="feature-universe-panel__body">
          <div className="feature-universe-panel__groups">
            {groups.map((group) => (
              <section key={group.id} className="feature-universe-panel__group">
                <div className="feature-universe-panel__group-head">
                  <div>
                    <div className="feature-universe-panel__eyebrow">宇宙层级</div>
                    <h3>{group.title}</h3>
                  </div>
                  <strong>{group.features.length}</strong>
                </div>
                <p>{group.summary}</p>
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
                            <h4>{feature.title}</h4>
                            <div className="feature-universe-panel__status">
                              {formatRequirementStatus(feature.status)}
                            </div>
                          </div>
                          <span className={`feature-universe-panel__path feature-universe-panel__path--${toneClass(currentPath)}`}>
                            {formatRequirementRuntimePath(currentPath)}
                          </span>
                        </div>
                        <p>{feature.readmeSummary}</p>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <aside className="feature-universe-panel__detail">
            {activeSurface === 'atlas' ? (
              <>
                <div>
                  <div className="feature-universe-panel__eyebrow">当前选中簇</div>
                  <h3 className="feature-universe-panel__detail-title">{selectedFeature.title}</h3>
                  <p className="feature-universe-panel__detail-copy">{selectedFeature.readmeSummary}</p>
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
                    入口：{normalizeAtlasText(selectedFeature.experienceEntry)}
                  </span>
                </div>

                <div className="feature-universe-panel__detail-grid">
                  <section className="feature-universe-panel__detail-block">
                    <strong>运行时子系统</strong>
                    <p>{selectedFeature.runtimeSubsystem}</p>
                  </section>
                  <section className="feature-universe-panel__detail-block">
                    <strong>能力数量</strong>
                    <p>{selectedFeature.capabilityDependencies.length || 1} 个依赖已追踪。</p>
                  </section>
                  <section className="feature-universe-panel__detail-block">
                    <strong>条款数量</strong>
                    <p>{selectedFeature.coveredClauses.length} 条已映射条款。</p>
                  </section>
                  <section className="feature-universe-panel__detail-block">
                    <strong>公开状态</strong>
                    <p>{formatRequirementStatus(selectedFeature.status)}</p>
                  </section>
                </div>

                <section className="feature-universe-panel__detail-block">
                  <div className="feature-universe-panel__detail-label">能力依赖</div>
                  <div className="feature-universe-panel__chip-list">
                    {selectedFeature.capabilityDependencies.map((capabilityId) => (
                      <span key={capabilityId} className="feature-universe-panel__chip">
                        {capabilityId}
                      </span>
                    ))}
                    {selectedFeature.capabilityDependencies.length === 0 && (
                      <span className="feature-universe-panel__chip">仅本地</span>
                    )}
                  </div>
                  {missingDependencies.length > 0 && (
                    <p>
                      当前设备缺少：{missingDependencies.join('、')}。这个簇会保持在降级或不可用模式，不会假装原生路径已成功。
                    </p>
                  )}
                </section>

                <section className="feature-universe-panel__detail-block">
                  <div className="feature-universe-panel__detail-label">代码入口点</div>
                  <div className="feature-universe-panel__module-list">
                    {selectedFeature.modulePaths.map((modulePath) => (
                      <span key={modulePath} className="feature-universe-panel__module">
                        {modulePath}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="feature-universe-panel__detail-block">
                  <div className="feature-universe-panel__detail-label">条款覆盖</div>
                  <div className="feature-universe-panel__clause-list">
                    {selectedClauses.map((clause) => (
                      <span key={`${clause.docId}-${clause.clause}`} className="feature-universe-panel__clause">
                        {clause.clause}
                      </span>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <>
                <div className="feature-universe-panel__eyebrow">主线表面</div>
                <div style={{ minHeight: 0, overflow: 'auto' }}>
                  {activeSurfacePanel}
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

export default FeatureUniversePanel;
