import React, { useEffect, useMemo, useState } from 'react';
import {
  useCitizenStats,
  useEmotion,
  useEntropy,
  useGamePhase,
  useGameStore,
  useNarrative,
  useResources,
  useTime,
  useWarnings,
} from '@/store/gameStore';
import { useRuntimeStore } from '@/runtime/runtimeStore';
import CivilizationCapabilityUniverse from '@/ui/components/CivilizationCapabilityUniverse';
import type { RequirementPanelAction } from '@/runtime/requirements';
import type { ModeConfig } from './ModeSelect';

const EPOCH_LABELS = {
  golden: '黄金纪元',
  stable: '稳定纪元',
  pressure: '压力纪元',
  crisis: '危机纪元',
  collapse: '崩塌边缘',
  entropy: '熵增纪元',
} as const;

const EPOCH_COLORS: Record<(typeof EPOCH_LABELS)[keyof typeof EPOCH_LABELS], string> = {
  黄金纪元: 'var(--color-epoch-golden)',
  稳定纪元: 'var(--color-epoch-stable)',
  压力纪元: 'var(--color-epoch-pressure)',
  危机纪元: 'var(--color-epoch-crisis)',
  崩塌边缘: 'var(--color-epoch-collapse)',
  熵增纪元: 'var(--color-entropy)',
};

export interface GameViewProps {
  currentMode: ModeConfig;
  onBack: () => void;
  onOpenChat: () => void;
  onOpenEightChars: () => void;
  onOpenDivine: () => void;
  onOpenCitizen: () => void;
  onOpenSocietyFeature?: () => void;
  onOpenEconomyFeature?: () => void;
  onOpenIdentityFeature?: () => void;
  onOpenPersistenceFeature?: () => void;
  onOpenRenderingFeature?: () => void;
  onOpenConflictClimateFeature?: () => void;
  onOpenSpaceConnectionFeature?: () => void;
  onOpenPluginEcosystemFeature?: () => void;
  onOpenGenesisTwin: () => void;
  onOpenBenchmark: () => void;
  onOpenDao: () => void;
  onOpenSpaceWarp: () => void;
  onOpenSystemStatus: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  currentMode,
  onBack,
  onOpenChat,
  onOpenEightChars,
  onOpenDivine,
  onOpenCitizen,
  onOpenSocietyFeature,
  onOpenEconomyFeature,
  onOpenIdentityFeature,
  onOpenPersistenceFeature,
  onOpenRenderingFeature,
  onOpenConflictClimateFeature,
  onOpenSpaceConnectionFeature,
  onOpenPluginEcosystemFeature,
  onOpenGenesisTwin,
  onOpenBenchmark,
  onOpenDao,
  onOpenSpaceWarp,
  onOpenSystemStatus,
}) => {
  const phase = useGamePhase();
  const resources = useResources();
  const entropy = useEntropy();
  const emotion = useEmotion();
  const citizenStats = useCitizenStats();
  const time = useTime();
  const narrative = useNarrative();
  const warnings = useWarnings();
  const clearWarning = useGameStore((state) => state.clearWarning);
  const bootPhase = useRuntimeStore((state) => state.bootPhase);
  const capabilityProfile = useRuntimeStore((state) => state.capabilityProfile);
  const runtimeTraces = useRuntimeStore((state) => state.traces);
  const runtimeSubsystems = useRuntimeStore((state) => state.subsystems);

  const epoch = useMemo(() => {
    if (entropy < 15) return EPOCH_LABELS.golden;
    if (entropy < 35) return EPOCH_LABELS.stable;
    if (entropy < 55) return EPOCH_LABELS.pressure;
    if (entropy < 75) return EPOCH_LABELS.crisis;
    if (entropy < 90) return EPOCH_LABELS.collapse;
    return EPOCH_LABELS.entropy;
  }, [entropy]);

  const [fps, setFps] = useState(0);

  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let rafId = 0;

    const loop = () => {
      frameCount += 1;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const readySubsystems = Object.values(runtimeSubsystems).filter((subsystem) => subsystem.state === 'ready');
  const degradedSubsystems = Object.values(runtimeSubsystems).filter(
    (subsystem) => subsystem.state === 'degraded' || subsystem.state === 'error',
  );
  const criticalSignals = runtimeTraces.slice(-4).reverse();

  const handleUniverseAction = (action: RequirementPanelAction) => {
    switch (action as string) {
      case 'citizens':
        onOpenCitizen();
        break;
      case 'society':
        onOpenSocietyFeature?.();
        break;
      case 'economy':
        onOpenEconomyFeature?.();
        break;
      case 'dao':
      case 'governance':
        onOpenDao();
        break;
      case 'divine':
      case 'entropy':
        onOpenDivine();
        break;
      case 'chat':
      case 'multimodal':
        onOpenChat();
        break;
      case 'environment':
        onOpenConflictClimateFeature?.();
        break;
      case 'genesis':
        onOpenGenesisTwin();
        break;
      case 'identity':
        onOpenIdentityFeature?.();
        break;
      case 'persistence':
        onOpenPersistenceFeature?.();
        break;
      case 'ecosystem':
        onOpenPluginEcosystemFeature?.();
        break;
      case 'network':
        onOpenSpaceConnectionFeature?.();
        break;
      case 'benchmark':
        onOpenBenchmark();
        break;
      case 'rendering':
        onOpenRenderingFeature?.();
        break;
      case 'observatory':
        onOpenSystemStatus();
        break;
      default:
        break;
    }
  };

  const alertMessage = warnings.criticalEntropy
    ? '熵值正在逼近危险阈值。'
    : warnings.populationZero
      ? '人口已经归零，文明主循环中断。'
      : warnings.resourceDepleted.length > 0
        ? `资源耗尽：${warnings.resourceDepleted.join('、')}`
        : '';

  return (
    <div className="world-shell">
      <header className="world-shell__topbar">
        <div className="world-shell__brand">
          <button type="button" className="world-shell__back" onClick={onBack} aria-label="返回模式选择">
            返回
          </button>
          <div>
            <div className="world-shell__mode" style={{ color: currentMode.color }}>
              {currentMode.nameCN}
            </div>
            <div className="world-shell__title">文明控制台</div>
          </div>
        </div>

        <div className="world-shell__time">
          <strong>Y{time.year} / D{time.day}</strong>
          <span>
            {String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}
          </span>
        </div>

        <div className="world-shell__runtime">
          <span>启动阶段</span>
          <strong>{bootPhase}</strong>
          <span>帧率</span>
          <strong>{fps}</strong>
        </div>
      </header>

      {alertMessage && (
        <div className="world-shell__alert">
          <span>系统警告</span>
          <strong>{alertMessage}</strong>
          <button type="button" onClick={() => clearWarning('resourceDepleted')}>
            关闭
          </button>
        </div>
      )}

      <main className="world-shell__content">
        <section className="world-shell__hero">
          <div className="world-shell__epoch">
            <span>纪元</span>
            <strong style={{ color: EPOCH_COLORS[epoch] }}>{epoch}</strong>
          </div>
          <div className="world-shell__hero-copy">
            <h1>需求宇宙已经变成可操作的运行时界面。</h1>
            <p>
              能力簇、战略信号、情绪压力和子系统真相现在同时出现在主舞台上。你能直接看见哪些路径正在原生运行，哪些能力正在一等降级，以及浏览器还能把这个文明推到什么上限。
            </p>
          </div>
          <div className="world-shell__hero-actions">
            <button type="button" onClick={onOpenCitizen}>市民内核</button>
            <button type="button" onClick={() => onOpenSocietyFeature?.()}>社会织网</button>
            <button type="button" onClick={() => onOpenConflictClimateFeature?.()}>风险控制台</button>
            <button type="button" onClick={() => onOpenEconomyFeature?.()}>经济账本</button>
            <button type="button" onClick={() => onOpenIdentityFeature?.()}>身份保险库</button>
            <button type="button" onClick={() => onOpenPersistenceFeature?.()}>持久化档案</button>
            <button type="button" onClick={() => onOpenRenderingFeature?.()}>渲染工坊</button>
            <button type="button" onClick={onOpenDivine}>神谕层</button>
            <button type="button" onClick={onOpenChat}>运行时对话</button>
            <button type="button" onClick={onOpenEightChars}>命理档案</button>
            <button type="button" onClick={onOpenGenesisTwin}>创世纪</button>
            <button type="button" onClick={onOpenBenchmark}>基准测试</button>
            <button type="button" onClick={onOpenDao}>DAO 中心</button>
            <button type="button" onClick={() => onOpenSpaceConnectionFeature?.()}>桥接控制台</button>
            <button type="button" onClick={() => onOpenPluginEcosystemFeature?.()}>生态锻炉</button>
            <button type="button" onClick={onOpenSpaceWarp}>空间折跃</button>
            <button type="button" onClick={onOpenSystemStatus}>观测台</button>
          </div>
        </section>

        <section className="world-shell__universe-card">
          <CivilizationCapabilityUniverse
            capabilityProfile={capabilityProfile}
            subsystems={runtimeSubsystems}
            variant="world"
            onInspectObservatory={onOpenSystemStatus}
            onAction={handleUniverseAction}
          />
        </section>

        <section className="world-shell__grid">
          <article className="world-shell__card">
            <div className="world-shell__card-kicker">文明指标</div>
            <div className="world-shell__stats">
              <div>
                <span>市民数量</span>
                <strong>{citizenStats.total.toLocaleString()}</strong>
              </div>
              <div>
                <span>核心能源</span>
                <strong>{resources.coreEnergy.toFixed(0)}</strong>
              </div>
              <div>
                <span>算力配额</span>
                <strong>{resources.computeQuota.toFixed(0)}</strong>
              </div>
              <div>
                <span>熵值</span>
                <strong>{entropy.toFixed(1)}%</strong>
              </div>
            </div>
          </article>

          <article className="world-shell__card">
            <div className="world-shell__card-kicker">情绪网络</div>
            <div className="world-shell__bars">
              <div>
                <label>希望值</label>
                <progress value={emotion.hope} max={100} />
                <span>{emotion.hope.toFixed(0)}%</span>
              </div>
              <div>
                <label>不满值</label>
                <progress value={emotion.discontent} max={100} />
                <span>{emotion.discontent.toFixed(0)}%</span>
              </div>
              <div>
                <label>暴乱风险</label>
                <progress value={emotion.rebellionRisk} max={100} />
                <span>{emotion.rebellionRisk.toFixed(0)}%</span>
              </div>
            </div>
          </article>

          <article className="world-shell__card">
            <div className="world-shell__card-kicker">运行时健康</div>
            <div className="world-shell__stats">
              <div>
                <span>就绪子系统</span>
                <strong>{readySubsystems.length}</strong>
              </div>
              <div>
                <span>降级路径</span>
                <strong>{degradedSubsystems.length}</strong>
              </div>
              <div>
                <span>世界阶段</span>
                <strong>{phase}</strong>
              </div>
              <div>
                <span>模式焦点</span>
                <strong>{currentMode.focus}</strong>
              </div>
            </div>
            <p className="world-shell__summary">
              主舞台现在把高价值入口直接摆到前面。更深的遥测与运行时证据仍留在观测台里，但核心功能已经可以从这里直接打开，不必再绕路找旧入口。
            </p>
          </article>

          <article className="world-shell__card">
            <div className="world-shell__card-kicker">战略信号</div>
            <div className="world-shell__console">
              {criticalSignals.map((trace) => (
                <div key={trace.id} className={`world-shell__console-item world-shell__console-item--${trace.severity}`}>
                  <span>{trace.stage}</span>
                  <strong>{trace.title}</strong>
                  {trace.detail && <p>{trace.detail}</p>}
                </div>
              ))}
            </div>
          </article>

          <article className="world-shell__card world-shell__card--wide">
            <div className="world-shell__card-kicker">叙事流</div>
            <div className="world-shell__timeline">
              {narrative.slice(-6).reverse().map((item) => (
                <div key={item.id} className={`world-shell__console-item world-shell__console-item--${item.type}`}>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  <strong>{item.text}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>

      <style>{`
        .world-shell {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          color: var(--text-primary);
          z-index: 8;
          background: linear-gradient(180deg, rgba(3, 9, 19, 0.56), rgba(3, 9, 19, 0.18));
          backdrop-filter: blur(4px);
        }

        .world-shell__topbar,
        .world-shell__hero,
        .world-shell__card,
        .world-shell__alert,
        .world-shell__universe-card {
          border: 1px solid rgba(var(--accent-rgb), 0.14);
          background: rgba(6, 14, 26, 0.78);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(16px);
        }

        .world-shell__topbar {
          margin: 1rem;
          padding: 0.95rem 1.1rem;
          border-radius: 24px;
          display: grid;
          grid-template-columns: 1.5fr auto auto;
          gap: 1rem;
          align-items: center;
        }

        .world-shell__brand {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .world-shell__back {
          border: 1px solid rgba(var(--accent-rgb), 0.18);
          border-radius: 999px;
          background: transparent;
          color: var(--text-primary);
          padding: 0.55rem 0.8rem;
          cursor: pointer;
        }

        .world-shell__mode {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 0.3rem;
        }

        .world-shell__title {
          font-family: var(--font-display);
          font-size: 1.15rem;
          letter-spacing: 0.08em;
        }

        .world-shell__time,
        .world-shell__runtime {
          display: grid;
          gap: 0.15rem;
          justify-items: end;
          font-family: var(--font-mono);
        }

        .world-shell__time span,
        .world-shell__runtime span {
          color: var(--text-muted);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .world-shell__alert {
          margin: 0 1rem 1rem;
          padding: 0.8rem 1rem;
          border-radius: 22px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .world-shell__alert span {
          font-family: var(--font-mono);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.72rem;
        }

        .world-shell__alert strong {
          flex: 1;
        }

        .world-shell__alert button,
        .world-shell__hero-actions button {
          border: 1px solid rgba(var(--accent-rgb), 0.18);
          background: rgba(var(--accent-rgb), 0.08);
          color: var(--text-primary);
          border-radius: 999px;
          padding: 0.6rem 0.95rem;
          cursor: pointer;
        }

        .world-shell__content {
          flex: 1;
          overflow: auto;
          padding: 0 1rem 1rem;
          display: grid;
          gap: 1rem;
        }

        .world-shell__hero,
        .world-shell__universe-card {
          border-radius: 28px;
          padding: 1.2rem;
        }

        .world-shell__hero {
          display: grid;
          gap: 1rem;
        }

        .world-shell__epoch span,
        .world-shell__card-kicker {
          font-family: var(--font-mono);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.72rem;
        }

        .world-shell__epoch strong {
          display: block;
          margin-top: 0.25rem;
          font-family: var(--font-display);
          font-size: 1.7rem;
          letter-spacing: 0.06em;
        }

        .world-shell__hero-copy h1 {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 4vw, 3rem);
          letter-spacing: 0.06em;
        }

        .world-shell__hero-copy p,
        .world-shell__summary {
          margin-top: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 72ch;
        }

        .world-shell__hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .world-shell__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .world-shell__card {
          border-radius: 24px;
          padding: 1rem;
        }

        .world-shell__card--wide {
          grid-column: 1 / -1;
        }

        .world-shell__stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 0.9rem;
        }

        .world-shell__stats div,
        .world-shell__console-item,
        .world-shell__bars div {
          border-radius: 18px;
          padding: 0.85rem;
          background: rgba(10, 22, 42, 0.72);
        }

        .world-shell__stats span,
        .world-shell__console-item span,
        .world-shell__bars label {
          display: block;
          color: var(--text-muted);
          font-size: 0.75rem;
          margin-bottom: 0.35rem;
        }

        .world-shell__stats strong,
        .world-shell__console-item strong {
          color: var(--text-primary);
        }

        .world-shell__bars {
          display: grid;
          gap: 0.75rem;
          margin-top: 0.9rem;
        }

        .world-shell__bars progress {
          width: 100%;
          height: 0.55rem;
          margin-bottom: 0.35rem;
        }

        .world-shell__console,
        .world-shell__timeline {
          display: grid;
          gap: 0.75rem;
          margin-top: 0.9rem;
        }

        .world-shell__console-item p {
          margin: 0.45rem 0 0;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        @media (max-width: 980px) {
          .world-shell__topbar {
            grid-template-columns: 1fr;
            justify-items: start;
          }

          .world-shell__time,
          .world-shell__runtime {
            justify-items: start;
          }

          .world-shell__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default GameView;

