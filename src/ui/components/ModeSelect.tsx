import React, { useCallback, useMemo, useRef } from 'react';
import type { CapabilityProfile } from '@/runtime/capabilities';

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
    nameCN: '神谕映射',
    nameEN: 'APEX',
    desc: '最大化 WebGPU、沉浸式整合与运行时观测层，让浏览器应用看起来像一台正在演化的文明引擎。',
    color: 'var(--color-mode-apex)',
    focus: '旗舰视觉 + 全能力编排',
    payoff: '适合高性能桌面设备与演示场景',
  },
  {
    id: 'extreme',
    nameCN: '极限编排',
    nameEN: 'EXTREME',
    desc: '保留高强度沉浸路径，同时更强调动态装载、热路径控制与稳定帧率之间的平衡。',
    color: 'var(--color-mode-extreme)',
    focus: '动态装载 + 性能压榨',
    payoff: '适合现代桌面与中高配笔记本',
  },
  {
    id: 'balanced',
    nameCN: '均衡主线',
    nameEN: 'BALANCED',
    desc: '真实能力优先，自动降级完整且可解释，是大多数设备上的旗舰默认方案。',
    color: 'var(--color-mode-balanced)',
    focus: '体验与稳定并重',
    payoff: '适合绝大多数设备',
  },
  {
    id: 'eco',
    nameCN: '低耗生存',
    nameEN: 'ECO',
    desc: '优先保证连续性、兼容性和能耗占用，让文明内核在轻设备上也能优雅运转。',
    color: 'var(--color-mode-eco)',
    focus: '兼容性 + 连续运行',
    payoff: '适合移动端和低配设备',
  },
];

export interface ModeSelectProps {
  selectedMode: AppPerformanceMode;
  onSelect: (mode: AppPerformanceMode) => void;
  onStart: () => void;
  currentMode: ModeConfig;
  capabilityProfile?: CapabilityProfile | null;
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
        <div className="mode-stage__badge">Flagship Runtime Select</div>
        <h1>选择文明主线策略</h1>
        <p>
          这不是单纯的画质开关，而是一套浏览器能力编排策略。每种模式共享同一个文明内核，
          只是对沉浸演出、子系统装载强度和自动降级阈值有不同取舍。
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
          padding: 1.4rem;
        }

        .mode-stage__badge {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--text-muted);
          margin-bottom: 0.55rem;
        }

        .mode-stage__hero h1 {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(2rem, 6vw, 4rem);
          letter-spacing: 0.08em;
        }

        .mode-stage__hero p {
          max-width: 68ch;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-top: 0.85rem;
        }

        .mode-stage__metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.8rem;
          margin-top: 1rem;
        }

        .mode-stage__metrics div,
        .mode-card__meta div {
          border-radius: 18px;
          background: rgba(11, 22, 40, 0.74);
          padding: 0.85rem;
        }

        .mode-stage__metrics span,
        .mode-card__meta span,
        .mode-stage__current span {
          display: block;
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-bottom: 0.3rem;
        }

        .mode-stage__metrics strong,
        .mode-card__meta strong,
        .mode-stage__current strong {
          font-family: var(--font-mono);
          font-size: 1rem;
        }

        .mode-stage__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          margin-top: 1rem;
        }

        .mode-stage__chip {
          padding: 0.45rem 0.7rem;
          border-radius: 999px;
          background: rgba(var(--accent-rgb), 0.08);
          border: 1px solid rgba(var(--accent-rgb), 0.14);
          color: var(--text-secondary);
          font-size: 0.78rem;
        }

        .mode-stage__grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }

        .mode-card {
          padding: 1rem;
          text-align: left;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .mode-card:hover,
        .mode-card:focus-visible,
        .mode-card--selected {
          transform: translateY(-2px);
          border-color: rgba(var(--accent-rgb), 0.3);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
        }

        .mode-card__topline {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 1rem;
          font-family: var(--font-mono);
          font-size: 0.74rem;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .mode-card__topline strong {
          color: var(--mode-accent);
        }

        .mode-card__title {
          font-family: var(--font-display);
          font-size: 1.35rem;
          letter-spacing: 0.06em;
          color: var(--mode-accent);
          margin-bottom: 0.6rem;
        }

        .mode-card__desc {
          min-height: 108px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .mode-card__meta {
          display: grid;
          gap: 0.7rem;
          margin-top: 1rem;
        }

        .mode-stage__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.2rem;
        }

        .mode-stage__start {
          border: 1px solid rgba(var(--accent-rgb), 0.24);
          border-radius: 999px;
          padding: 0.85rem 1.25rem;
          background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.18), rgba(255, 56, 103, 0.18));
          color: var(--text-primary);
          cursor: pointer;
        }

        @media (max-width: 1100px) {
          .mode-stage__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .mode-stage__grid {
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
