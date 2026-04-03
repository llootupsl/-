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
    nameCN: '顶峰旗舰（Apex Flagship）',
    nameEN: 'APEX',
    desc: '面向高端桌面，拉满 WebGPU、遥测与电影级外壳编排能力。',
    color: 'var(--color-mode-apex)',
    focus: '旗舰渲染 + 全能力预热（flagship rendering + full capability staging）',
    payoff: '适合演示、录制和硬件展示。',
  },
  {
    id: 'extreme',
    nameCN: '极限织网（Extreme Mesh）',
    nameEN: 'EXTREME',
    desc: '保留强烈的运行时张力，同时更依赖动态加载与帧稳定性。',
    color: 'var(--color-mode-extreme)',
    focus: '动态加载 + 抗压运行（dynamic loading + stress-ready runtime）',
    payoff: '适合现代笔记本和高密度浏览器会话。',
  },
  {
    id: 'balanced',
    nameCN: '均衡主线（Balanced Mainline）',
    nameEN: 'BALANCED',
    desc: '真实能力保持一等，降级路径保持可见，整体体验依然可交付。',
    color: 'var(--color-mode-balanced)',
    focus: '清晰、稳定、可解释的降级（clarity, stability, and explainable fallbacks）',
    payoff: '大多数设备的默认发布路径。',
  },
  {
    id: 'eco',
    nameCN: '节能续航（Eco Continuity）',
    nameEN: 'ECO',
    desc: '优先保证连续性、电量与低摩擦交付，适合受限设备。',
    color: 'var(--color-mode-eco)',
    focus: '兼容性 + 长会话续航（compatibility + long-session continuity）',
    payoff: '适合移动端、低功耗或受限浏览器环境。',
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
          <div className="mode-stage__badge">宇宙入口（Universe Entry）</div>
          <h1>先看能力宇宙，再选择你的运行姿态。</h1>
          <p>
            这里不把性能模式当成单纯的画质开关，而是决定预热强度、能力编排、降级姿态，
            以及世界外壳应该多大胆地把浏览器暴露成一台文明引擎。
          </p>

          <div className="mode-stage__metrics">
            <div>
              <span>设备等级</span>
              <strong>{capabilityProfile?.device.level ?? '--'}</strong>
            </div>
            <div>
              <span>推荐模式（Recommended）</span>
              <strong>{recommendedMode.toUpperCase()}</strong>
            </div>
            <div>
              <span>GPU</span>
              <strong>{capabilityProfile?.device.gpuVendor ?? '未知'}</strong>
            </div>
            <div>
              <span>原生路径数（Native paths）</span>
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
                打开完整图谱
              </button>
            </div>
          )}
        </div>

        <CivilizationCapabilityUniverse capabilityProfile={capabilityProfile} variant="stage" />
      </section>

      <div ref={gridRef} className="mode-stage__grid" role="listbox" aria-label="性能模式 / Performance modes">
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
                <span>{mode.nameCN}</span>
                {isRecommended && <strong>推荐</strong>}
              </div>
              <div className="mode-card__title">{mode.nameCN}</div>
              <p className="mode-card__desc">{mode.desc}</p>
              <div className="mode-card__meta">
                <div>
                  <span>聚焦 / Focus</span>
                  <strong>{mode.focus}</strong>
                </div>
                <div>
                  <span>收益 / Payoff</span>
                  <strong>{mode.payoff}</strong>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mode-stage__footer">
        <div className="mode-stage__current">
          <span>当前策略</span>
          <strong style={{ color: currentMode.color }}>{currentMode.nameCN}</strong>
        </div>
        <button type="button" className="mode-stage__start" onClick={onStart}>
          进入文明
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
