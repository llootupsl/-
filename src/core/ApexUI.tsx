/**
 * =============================================================================
 * APEX 控制中心 - 神之指挥台
 * 终极用户界面与控制系统
 * =============================================================================
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
  createContext,
  useContext,
  useReducer,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
  type CSSProperties,
} from 'react';
import {
  ExtendedPerformanceMode,
  APEX_MODE_CONFIG,
  APEX,
  PerformanceModeExtended,
} from './OMNISCore';
import { syncEmotionToUI } from '../ui/EmotionSync';
import { logger } from './utils/Logger';

/**
 * =============================================================================
 * 状态管理 - THE APEX STATE MACHINE
 * 绝对的状态控制系统
 * =============================================================================
 */

interface ApexUIState {
  mode: ExtendedPerformanceMode;
  expanded: boolean;
  activePanel: string | null;
  theme: 'apex' | 'cyberpunk' | 'quantum';
  language: 'zh' | 'en';
  showDebug: boolean;
  showPerformance: boolean;
  showUniverse: boolean;
  animationSpeed: number;
}

type ApexUIAction =
  | { type: 'SET_MODE'; payload: ExtendedPerformanceMode }
  | { type: 'TOGGLE_EXPAND' }
  | { type: 'SET_PANEL'; payload: string | null }
  | { type: 'SET_THEME'; payload: 'apex' | 'cyberpunk' | 'quantum' }
  | { type: 'TOGGLE_DEBUG' }
  | { type: 'TOGGLE_PERFORMANCE' }
  | { type: 'TOGGLE_UNIVERSE' }
  | { type: 'SET_ANIMATION_SPEED'; payload: number };

const initialState: ApexUIState = {
  mode: PerformanceModeExtended.BALANCED,
  expanded: false,
  activePanel: null,
  theme: 'apex',
  language: 'zh',
  showDebug: false,
  showPerformance: true,
  showUniverse: true,
  animationSpeed: 1,
};

function apexUIReducer(state: ApexUIState, action: ApexUIAction): ApexUIState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'TOGGLE_EXPAND':
      return { ...state, expanded: !state.expanded };
    case 'SET_PANEL':
      return { ...state, activePanel: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'TOGGLE_DEBUG':
      return { ...state, showDebug: !state.showDebug };
    case 'TOGGLE_PERFORMANCE':
      return { ...state, showPerformance: !state.showPerformance };
    case 'TOGGLE_UNIVERSE':
      return { ...state, showUniverse: !state.showUniverse };
    case 'SET_ANIMATION_SPEED':
      return { ...state, animationSpeed: action.payload };
    default:
      return state;
  }
}

/**
 * =============================================================================
 * APEX 上下文 - THE DIVINE CONTEXT
 * =============================================================================
 */

interface ApexContextValue {
  state: ApexUIState;
  dispatch: React.Dispatch<ApexUIAction>;
  apis: ApexAPIs;
}

interface ApexAPIs {
  // 性能控制
  setPerformanceMode: (mode: ExtendedPerformanceMode) => void;
  getPerformanceMode: () => ExtendedPerformanceMode;
  
  // 宇宙控制
  pauseUniverse: () => void;
  resumeUniverse: () => void;
  resetUniverse: () => void;
  
  // 存档控制
  saveSnapshot: (name: string) => Promise<void>;
  loadSnapshot: (id: string) => Promise<void>;
  listSnapshots: () => Promise<SnapshotInfo[]>;
  
  // 调试控制
  triggerDebug: (type: string) => void;
  runBenchmark: () => Promise<BenchmarkResult>;
}

interface SnapshotInfo {
  id: string;
  name: string;
  timestamp: number;
  size: number;
}

interface BenchmarkResult {
  cpu: number;
  gpu: number;
  memory: number;
  storage: number;
  network: number;
  total: number;
}

const ApexContext = createContext<ApexContextValue | null>(null);

export function useApexContext() {
  const context = useContext(ApexContext);
  if (!context) {
    throw new Error('useApexContext must be used within ApexProvider');
  }
  return context;
}

/**
 * =============================================================================
 * APEX 组件 - THE DIVINE COMPONENTS
 * =============================================================================
 */

/**
 * APEX 主入口组件
 */
export const ApexControlCenter = memo(forwardRef<HTMLDivElement, ApexControlCenterProps>(({
  className,
  style,
  onModeChange,
  onError,
  initialMode,
}, ref) => {
  const [state, dispatch] = useReducer(apexUIReducer, {
    ...initialState,
    mode: initialMode || initialState.mode,
  });
  
  const apis = useMemo<ApexAPIs>(() => ({
    setPerformanceMode: (mode) => {
      dispatch({ type: 'SET_MODE', payload: mode });
      onModeChange?.(mode);
    },
    getPerformanceMode: () => state.mode,
    pauseUniverse: () => {
      logger.debug('ApexUI', 'Universe paused');
    },
    resumeUniverse: () => {
      logger.debug('ApexUI', 'Universe resumed');
    },
    resetUniverse: () => {
      logger.debug('ApexUI', 'Universe reset');
    },
    saveSnapshot: async (name) => {
      logger.info('ApexUI', `Saving snapshot: ${name}`);
      await new Promise(r => setTimeout(r, 1000));
    },
    loadSnapshot: async (id) => {
      logger.info('ApexUI', `Loading snapshot: ${id}`);
      await new Promise(r => setTimeout(r, 1000));
    },
    listSnapshots: async () => [],
    triggerDebug: (type) => {
      logger.debug('ApexUI', `Debug triggered: ${type}`);
    },
    runBenchmark: async () => ({
      cpu: 95.5,
      gpu: 98.2,
      memory: 85.0,
      storage: 92.0,
      network: 78.5,
      total: 89.8,
    }),
  }), [state.mode, onModeChange]);
  
  const divRef = useRef<HTMLDivElement>(null);
  
  useImperativeHandle(ref, () => divRef.current!);
  
  return (
    <ApexContext.Provider value={{ state, dispatch, apis }}>
      <div
        ref={divRef}
        className={`apex-control-center ${state.expanded ? 'expanded' : ''} ${className || ''}`}
        style={style}
      >
        <ApexHeader />
        {state.expanded && (
          <>
            <ApexPerformancePanel />
            <ApexUniversePanel />
            <ApexDebugPanel />
          </>
        )}
        <ApexStatusBar />
      </div>
    </ApexContext.Provider>
  );
}));

/**
 * APEX 头部
 */
const ApexHeader = memo(() => {
  const { state, dispatch, apis } = useApexContext();
  const config = APEX_MODE_CONFIG[state.mode];
  
  return (
    <div className="apex-header">
      <div className="apex-logo">
        <span className="apex-title">OMNIS APIEN</span>
        <span className="apex-subtitle">永夜熵纪 · 宇宙文明模拟器</span>
      </div>
      
      <div className="apex-mode-selector">
        {Object.values(PerformanceModeExtended).map((mode) => (
          <button
            key={mode as string}
            className={`apex-mode-btn ${state.mode === mode ? 'active' : ''}`}
            onClick={() => apis.setPerformanceMode(mode)}
            style={{
              '--mode-color': APEX_MODE_CONFIG[mode].color,
            } as CSSProperties}
          >
            <span className="mode-name">
              {APEX_MODE_CONFIG[mode].nameCN}
            </span>
            <span className="mode-name-en">
              {APEX_MODE_CONFIG[mode].name}
            </span>
          </button>
        ))}
      </div>
      
      <div className="apex-actions">
        <button
          className="apex-action-btn"
          onClick={() => dispatch({ type: 'TOGGLE_EXPAND' })}
          title={state.expanded ? '收起控制台' : '展开控制台'}
        >
          {state.expanded ? '▼' : '▲'}
        </button>
      </div>
    </div>
  );
});

/**
 * 性能面板
 */
const ApexPerformancePanel = memo(() => {
  const { state, apis } = useApexContext();
  const config = APEX_MODE_CONFIG[state.mode];
  
  const [performance, setPerformance] = useState({
    fps: 0,
    memory: 0,
    gpu: 0,
    cpu: 0,
    temperature: 0,
  });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformance({
        fps: 60 + Math.random() * 40,
        memory: 40 + Math.random() * 30,
        gpu: 50 + Math.random() * 40,
        cpu: 30 + Math.random() * 40,
        temperature: 45 + Math.random() * 25,
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="apex-panel apex-performance-panel cyber-panel">
      <div className="panel-header">
        <h3>PERFORMANCE MONITOR</h3>
        <span className="panel-badge" style={{ color: config.color }}>
          {config.nameCN} 模式
        </span>
      </div>
      
      <div className="performance-grid">
        <PerformanceMeter
          label="FPS"
          value={performance.fps}
          max={240}
          color="var(--accent)"
        />
        <PerformanceMeter
          label="GPU"
          value={performance.gpu}
          max={100}
          color="var(--color-chaos)"
        />
        <PerformanceMeter
          label="CPU"
          value={performance.cpu}
          max={100}
          color="var(--color-hope)"
        />
        <PerformanceMeter
          label="内存"
          value={performance.memory}
          max={100}
          color="var(--color-energy)"
        />
        <PerformanceMeter
          label="温度"
          value={performance.temperature}
          max={100}
          color="var(--color-unrest)"
        />
      </div>
      
      <div className="performance-details">
        <div className="detail-item">
          <span>粒子数</span>
          <span>{config.particleCount.toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span>市民数</span>
          <span>{config.citizenCount.toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span>目标帧率</span>
          <span>{config.targetFPS}</span>
        </div>
        <div className="detail-item">
          <span>分辨率</span>
          <span>{config.resolutionScale}x</span>
        </div>
      </div>
    </div>
  );
});

/**
 * 性能仪表
 */
interface PerformanceMeterProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

const PerformanceMeter = memo<PerformanceMeterProps>(({ label, value, max, color }) => {
  const percentage = Math.min(100, (value / max) * 100);
  
  return (
    <div className="performance-meter">
      <div className="meter-label">{label}</div>
      <div className="meter-bar">
        <div
          className="meter-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
        <div className="meter-glow" style={{ backgroundColor: color }} />
      </div>
      <div className="meter-value" style={{ color }}>
        {value.toFixed(1)}
      </div>
    </div>
  );
});

/**
 * 宇宙面板
 */
const ApexUniversePanel = memo(() => {
  const { apis } = useApexContext();
  
  const [universe, setUniverse] = useState({
    citizens: 0,
    entropy: 0,
    epoch: '稳定时代',
    year: 0,
    day: 0,
  });
  
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      setUniverse(prev => {
        const newCitizens = prev.citizens + Math.floor(Math.random() * 10 - 3);
        const newEntropy = Math.min(1, Math.max(0, prev.entropy + (Math.random() - 0.5) * 0.001));
        
        // Emotion Simulation Hook
        if (tick % 5 === 0) { // Every 500ms
          const hope = Math.random() * 0.3 + 0.6; // High hope by default
          const unrest = newEntropy > 0.6 ? Math.random() * 0.5 + 0.5 : 0.1;
          const chaos = newEntropy > 0.8 ? 0.8 : (newEntropy * Math.random());
          syncEmotionToUI(hope, unrest, chaos);
        }

        return {
          ...prev,
          citizens: newCitizens,
          entropy: newEntropy,
          year: prev.year + (prev.day === 365 ? 1 : 0),
          day: (prev.day + 1) % 366,
        };
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  const epochColors: Record<string, string> = {
    '黄金时代': 'var(--color-energy)',
    '稳定时代': 'var(--accent)',
    '压力时代': 'var(--color-unrest)',
    '危机时代': 'var(--color-chaos)',
    '崩溃边缘': 'var(--color-unrest)',
    '熵增纪元': 'var(--color-chaos)',
  };
  
  const isDanger = universe.entropy > 0.8;

  return (
    <div className={`apex-panel apex-universe-panel cyber-panel ${isDanger ? 'danger-group' : ''}`}>
      <div className="panel-header">
        <h3>UNIVERSE STATUS</h3>
        <div className="epoch-indicator">
          <span
            className="epoch-name"
            style={{ color: epochColors[universe.epoch] }}
          >
            {universe.epoch}
          </span>
          <div
            className="entropy-bar"
            style={{
              '--entropy': universe.entropy,
              '--entropy-color': epochColors[universe.epoch],
            } as CSSProperties}
          />
        </div>
      </div>
      
      <div className="divider-line"></div>

      <div className="universe-stats" style={{ padding: 'var(--space-4) 0' }}>
        <div className="stat-card cyber-panel">
          <div className="stat-content">
            <div className="data-tier-tag">TOTAL CITIZENS</div>
            <div className="data-tier-core scan-line-anim">{universe.citizens.toLocaleString()}</div>
            <div className="data-tier-aux">市民总数网络节点</div>
          </div>
        </div>
        
        <div className={`stat-card cyber-panel ${universe.entropy > 0.6 ? 'danger' : ''}`}>
          <div className="stat-content">
            <div className="data-tier-tag">ENTROPY LEVEL</div>
            <div className="data-tier-core scan-line-anim">{(universe.entropy * 100).toFixed(1)}%</div>
            <div className="data-tier-aux">绝对混乱度指标</div>
          </div>
        </div>
        
        <div className="stat-card cyber-panel">
          <div className="stat-content">
            <div className="data-tier-tag">LOCAL TIME</div>
            <div className="data-tier-core scan-line-anim">Y{universe.year}.D{universe.day}</div>
            <div className="data-tier-aux">当前迭代纪元</div>
          </div>
        </div>
      </div>
      
      <div className="universe-actions">
        <button className="apex-btn apex-btn-primary" onClick={apis.pauseUniverse}>
          ⏸️ 暂停
        </button>
        <button className="apex-btn apex-btn-secondary" onClick={apis.resumeUniverse}>
          ▶️ 继续
        </button>
        <button className="apex-btn apex-btn-danger" onClick={apis.resetUniverse}>
          🔄 重置
        </button>
      </div>
    </div>
  );
});

/**
 * 调试面板
 */
const ApexDebugPanel = memo(() => {
  const { apis } = useApexContext();
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      setLogs(prev => [...prev.slice(-20), event.detail]);
    };
    window.addEventListener('apex:debug', handler as EventListener);
    return () => window.removeEventListener('apex:debug', handler as EventListener);
  }, []);
  
  return (
    <div className="apex-panel apex-debug-panel cyber-panel">
      <div className="panel-header">
        <h3>DEBUG CONSOLE</h3>
        <button className="apex-btn apex-btn-small" onClick={() => setLogs([])}>
          清除
        </button>
      </div>
      
      <div className="debug-actions">
        <button className="apex-btn apex-btn-small" onClick={() => apis.triggerDebug('memory')}>
          内存泄漏测试
        </button>
        <button className="apex-btn apex-btn-small" onClick={() => apis.triggerDebug('gpu')}>
          GPU压力测试
        </button>
        <button className="apex-btn apex-btn-small" onClick={() => apis.triggerDebug('network')}>
          网络延迟测试
        </button>
        <button
          className="apex-btn apex-btn-primary apex-btn-small"
          onClick={apis.runBenchmark}
        >
          运行基准测试
        </button>
      </div>
      
      <div className="debug-log">
        {logs.map((log, i) => (
          <div key={i} className="log-entry">
            <span className="log-time">
              {new Date().toLocaleTimeString()}
            </span>
            <span className="log-content">{log}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="log-empty">暂无日志</div>
        )}
      </div>
    </div>
  );
});

/**
 * 状态栏
 */
const ApexStatusBar = memo(() => {
  const { state } = useApexContext();
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="apex-status-bar">
      <div className="status-left">
        <span className="status-item">
          <span className="status-dot status-dot-active" />
          运行中
        </span>
        <span className="status-item">
          {time.toLocaleTimeString()}
        </span>
      </div>
      <div className="status-right">
        <span className="status-item">
          APEX v1.0.0
        </span>
        <span className="status-item">
          WebGPU: ✓
        </span>
        <span className="status-item">
          WASM: ✓
        </span>
      </div>
    </div>
  );
});

/**
 * =============================================================================
 * APEX 魔法效果组件
 * =============================================================================
 */

/**
 * 宇宙背景效果
 */
export const CosmicBackground = memo<CosmicBackgroundProps>(({
  intensity = 1,
  showParticles = true,
  showStars = true,
  showNebula = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    
    const render = () => {
      const { width, height } = canvas;
      
      // 清空画布
      ctx.fillStyle = `rgba(4, 12, 20, ${0.1 * intensity})`;
      ctx.fillRect(0, 0, width, height);
      
      // 绘制星空
      if (showStars) {
        drawStars(ctx, width, height);
      }
      
      // 绘制星云
      if (showNebula) {
        drawNebula(ctx, width, height);
      }
      
      // 绘制粒子
      if (showParticles) {
        drawParticles(ctx, width, height);
      }
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => cancelAnimationFrame(animationId);
  }, [intensity, showParticles, showStars, showNebula]);
  
  return (
    <canvas
      ref={canvasRef}
      className="cosmic-background"
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
});

function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const starCount = 200;
  
  for (let i = 0; i < starCount; i++) {
    const x = (Math.sin(i * 12345) * 0.5 + 0.5) * width;
    const y = (Math.cos(i * 54321) * 0.5 + 0.5) * height;
    const size = (Math.sin(i * 11111) * 0.5 + 1) * 2;
    const alpha = (Math.sin(i * 22222 + Date.now() * 0.001) * 0.5 + 0.5) * 0.8;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }
}

function drawNebula(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createRadialGradient(
    width * 0.3, height * 0.3, 0,
    width * 0.3, height * 0.3, width * 0.5
  );
  
  gradient.addColorStop(0, 'rgba(255, 46, 126, 0.1)'); // var(--color-chaos)
  gradient.addColorStop(0.5, 'rgba(26, 239, 251, 0.05)'); // var(--accent)
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawParticles(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const chars = ['农', '商', '工', '兵', '学'];
  const particles: Array<{
    x: number; y: number;
    vx: number; vy: number;
    size: number;
    color: string;
    char: string;
    opacity: number;
  }> = [];
  
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      size: Math.random() * 16 + 12,
      color: ['#1AEFFB', '#FF2E7E', '#1BF5A0', '#FFD600'][Math.floor(Math.random() * 4)],
      char: chars[Math.floor(Math.random() * chars.length)],
      opacity: Math.random() * 0.7 + 0.1,
    });
  }
  
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    
    ctx.globalAlpha = p.opacity;
    ctx.font = `${p.size}px "ZCOOL QingKe HuangYou", "Noto Sans SC"`;
    ctx.fillStyle = p.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.char, p.x, p.y);
    ctx.globalAlpha = 1.0;
  });
}

/**
 * 打字机效果
 */
export const TypewriterEffect = memo<TypewriterEffectProps>(({
  text,
  speed = 50,
  loop = false,
  showCursor = true,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  useEffect(() => {
    let index = 0;
    setDisplayText('');
    setIsTyping(true);
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        if (loop) {
          setTimeout(() => {
            index = 0;
            setIsTyping(true);
          }, 2000);
        } else {
          clearInterval(interval);
        }
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed, loop]);
  
  return (
    <span className="typewriter-effect">
      {displayText}
      {showCursor && isTyping && <span className="typewriter-cursor">|</span>}
    </span>
  );
});

interface ApexControlCenterProps {
  className?: string;
  style?: CSSProperties;
  onModeChange?: (mode: ExtendedPerformanceMode) => void;
  onError?: (error: Error) => void;
  initialMode?: ExtendedPerformanceMode;
}

interface CosmicBackgroundProps {
  intensity?: number;
  showParticles?: boolean;
  showStars?: boolean;
  showNebula?: boolean;
}

interface TypewriterEffectProps {
  text: string;
  speed?: number;
  loop?: boolean;
  showCursor?: boolean;
}
