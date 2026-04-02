/**
 * 量子门渲染器 - 电路可视化 UI
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { QuantumGate, GateType } from './QuantumCircuit';
import type { StateVector } from './QuantumSimulator';

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * 门渲染配置
 */
export interface GateRenderConfig {
  /** 量子比特高度 */
  qubitHeight?: number;
  /** 列宽 */
  columnWidth?: number;
  /** 门的大小 */
  gateSize?: number;
  /** 线宽 */
  lineWidth?: number;
  /** 颜色配置 */
  colors?: GateColors;
  /** 是否显示测量指示 */
  showMeasureIndicator?: boolean;
  /** 是否显示概率分布 */
  showProbabilities?: boolean;
}

/**
 * 门颜色配置
 */
export interface GateColors {
  /** 单比特门背景 */
  singleQubitBg: string;
  /** 双比特门背景 */
  doubleQubitBg: string;
  /** 控制点颜色 */
  controlPoint: string;
  /** 连线颜色 */
  wire: string;
  /** 文字颜色 */
  text: string;
  /** 测量颜色 */
  measure: string;
  /** X门 */
  X: string;
  /** Y门 */
  Y: string;
  /** Z门 */
  Z: string;
  /** H门 */
  H: string;
  /** 其他门 */
  other: string;
}

/**
 * 电路可视化数据
 */
export interface CircuitVisualization {
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 门位置 */
  gatePositions: GatePosition[];
  /** 量子比特行 */
  qubitRows: QubitRow[];
  /** 总列数 */
  totalColumns: number;
}

/**
 * 门位置
 */
export interface GatePosition {
  /** 门 */
  gate: QuantumGate;
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 列索引 */
  column: number;
  /** 跨距 (用于双比特门) */
  span?: number;
}

/**
 * 量子比特行
 */
export interface QubitRow {
  /** 量子比特索引 */
  index: number;
  /** Y 坐标 */
  y: number;
  /** 标签 */
  label: string;
}

/**
 * 默认颜色配置
 */
const DEFAULT_COLORS: GateColors = {
  singleQubitBg: '#2d2d44',
  doubleQubitBg: '#1a3a4a',
  controlPoint: '#00ff88',
  wire: '#4a9eff',
  text: '#ffffff',
  measure: '#ff6b6b',
  X: '#ff6b6b',
  Y: '#ffd93d',
  Z: '#6bcb77',
  H: '#4d96ff',
  other: '#9b59b6',
};

/**
 * 门符号映射
 */
const GATE_SYMBOLS: Record<GateType, string> = {
  I: 'I',
  X: 'X',
  Y: 'Y',
  Z: 'Z',
  H: 'H',
  S: 'S',
  T: 'T',
  CNOT: '⊕',
  CZ: '•',
  SWAP: '×',
  TOFFOLI: '⊕⊕',
  RX: 'Rx',
  RY: 'Ry',
  RZ: 'Rz',
  MEASURE: 'M',
  CPHASE: 'CP',
  MCZ: 'M•Z',
};

/**
 * 获取门颜色
 */
function getGateColor(type: GateType, colors: GateColors): string {
  switch (type) {
    case 'X': return colors.X;
    case 'Y': return colors.Y;
    case 'Z': return colors.Z;
    case 'H': return colors.H;
    case 'MEASURE': return colors.measure;
    default: return colors.other;
  }
}

/**
 * 默认渲染配置
 */
const DEFAULT_CONFIG: Required<GateRenderConfig> = {
  qubitHeight: 50,
  columnWidth: 60,
  gateSize: 40,
  lineWidth: 2,
  colors: DEFAULT_COLORS,
  showMeasureIndicator: true,
  showProbabilities: false,
};

/**
 * QuantumGateRenderer 组件属性
 */
export interface QuantumGateRendererProps {
  /** 量子比特数量 */
  numQubits: number;
  /** 门列表 */
  gates: QuantumGate[];
  /** 状态向量 (可选) */
  stateVector?: StateVector;
  /** 渲染配置 */
  config?: GateRenderConfig;
  /** 选中门的回调 */
  onGateSelect?: (gate: QuantumGate, index: number) => void;
  /** 选中的门索引 */
  selectedGateIndex?: number;
  /** 电路名称 */
  name?: string;
  /** 类名 */
  className?: string;
}

/**
 * 量子门渲染器组件
 */
export const QuantumGateRenderer: React.FC<QuantumGateRendererProps> = ({
  numQubits,
  gates,
  stateVector,
  config,
  onGateSelect,
  selectedGateIndex,
  name,
  className,
}) => {
  const cfg = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // 计算电路可视化数据
  const visualization = useMemo(() => {
    return calculateCircuitLayout(numQubits, gates, cfg);
  }, [numQubits, gates, cfg]);

  // 获取概率分布
  const probabilities = useMemo(() => {
    if (!stateVector || !cfg.showProbabilities) return null;
    return stateVector.amplitudes.map(a => Math.sqrt(a.re ** 2 + a.im ** 2));
  }, [stateVector, cfg.showProbabilities]);

  const handleClick = useCallback((gate: QuantumGate, index: number) => {
    if (onGateSelect) {
      onGateSelect(gate, index);
    }
  }, [onGateSelect]);

  return (
    <div className={`quantum-circuit-renderer ${className || ''}`} style={styles.container}>
      {name && <div style={styles.title}>{name}</div>}
      <svg
        width={visualization.width}
        height={visualization.height}
        style={styles.svg}
      >
        {/* 量子比特线 */}
        {visualization.qubitRows.map(row => (
          <line
            key={`wire-${row.index}`}
            x1={20}
            y1={row.y}
            x2={visualization.width - 20}
            y2={row.y}
            stroke={cfg.colors.wire}
            strokeWidth={cfg.lineWidth}
          />
        ))}

        {/* 量子比特标签 */}
        {visualization.qubitRows.map(row => (
          <g key={`label-${row.index}`}>
            <rect
              x={5}
              y={row.y - 12}
              width={25}
              height={24}
              fill={cfg.colors.singleQubitBg}
              rx={4}
            />
            <text
              x={17.5}
              y={row.y + 5}
              fill={cfg.colors.text}
              fontSize={12}
              fontWeight="bold"
              textAnchor="middle"
            >
              q{row.index}
            </text>
          </g>
        ))}

        {/* 门 */}
        {visualization.gatePositions.map((pos, index) => (
          <GateSymbol
            key={`gate-${index}`}
            gate={pos.gate}
            x={pos.x}
            y={pos.y}
            cfg={cfg}
            isSelected={selectedGateIndex === index}
            onClick={() => handleClick(pos.gate, index)}
            qubitRows={visualization.qubitRows}
          />
        ))}

        {/* 测量指示器 */}
        {cfg.showMeasureIndicator && (
          <MeasureIndicator
            gates={gates}
            visualization={visualization}
            cfg={cfg}
          />
        )}
      </svg>

      {/* 概率分布条 */}
      {probabilities && probabilities.length > 0 && (
        <ProbabilityBar
          probabilities={probabilities}
          numQubits={numQubits}
        />
      )}

      {/* 电路信息 */}
      <div style={styles.info}>
        <span>量子比特: {numQubits}</span>
        <span>门数: {gates.length}</span>
        <span>深度: {visualization.totalColumns}</span>
      </div>
    </div>
  );
};

/**
 * 门符号组件
 */
interface GateSymbolProps {
  gate: QuantumGate;
  x: number;
  y: number;
  cfg: Required<GateRenderConfig>;
  isSelected: boolean;
  onClick: () => void;
  qubitRows: QubitRow[];
}

const GateSymbol: React.FC<GateSymbolProps> = ({ gate, x, y, cfg, isSelected, onClick, qubitRows }) => {
  const isDoubleQubit = gate.control !== undefined;
  const gateColor = getGateColor(gate.type, cfg.colors);
  const symbol = GATE_SYMBOLS[gate.type];

  if (isDoubleQubit && gate.control !== undefined) {
    // 双比特门
    const targetRow = qubitRows.find(r => r.index === gate.target);
    const controlRow = qubitRows.find(r => r.index === gate.control);

    if (!targetRow || !controlRow) return null;

    const y1 = controlRow.y;
    const y2 = targetRow.y;
    const midY = (y1 + y2) / 2;

    return (
      <g onClick={onClick} style={{ cursor: 'pointer' }}>
        {/* 控制点 */}
        <circle
          cx={x}
          cy={y1}
          r={8}
          fill={cfg.colors.controlPoint}
          stroke={isSelected ? '#fff' : 'transparent'}
          strokeWidth={2}
        />

        {/* 连接线 */}
        <line
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          stroke={cfg.colors.controlPoint}
          strokeWidth={cfg.lineWidth}
        />

        {/* 目标门 */}
        {gate.type === 'CNOT' && (
          <circle
            cx={x}
            cy={y2}
            r={10}
            fill="none"
            stroke={gateColor}
            strokeWidth={cfg.lineWidth}
          />
        )}
        {(gate.type === 'CZ' || gate.type === 'MCZ') && (
          <circle
            cx={x}
            cy={y2}
            r={8}
            fill={gateColor}
          />
        )}
        {gate.type === 'SWAP' && (
          <>
            <line
              x1={x - 8}
              y1={y2 - 8}
              x2={x + 8}
              y2={y2 + 8}
              stroke={gateColor}
              strokeWidth={cfg.lineWidth}
            />
            <line
              x1={x + 8}
              y1={y2 - 8}
              x2={x - 8}
              y2={y2 + 8}
              stroke={gateColor}
              strokeWidth={cfg.lineWidth}
            />
          </>
        )}

        {/* 标签 */}
        <text
          x={x}
          y={midY}
          fill={cfg.colors.text}
          fontSize={10}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {symbol}
        </text>
      </g>
    );
  }

  // 单比特门
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect
        x={x - cfg.gateSize / 2}
        y={y - cfg.gateSize / 2}
        width={cfg.gateSize}
        height={cfg.gateSize}
        fill={gateColor}
        rx={6}
        stroke={isSelected ? '#fff' : 'transparent'}
        strokeWidth={2}
      />
      <text
        x={x}
        y={y}
        fill="#fff"
        fontSize={14}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {symbol}
      </text>
      {gate.angle !== undefined && (
        <text
          x={x}
          y={y + cfg.gateSize / 2 + 12}
          fill={cfg.colors.text}
          fontSize={9}
          textAnchor="middle"
        >
          {((gate.angle * 180) / Math.PI).toFixed(0)}°
        </text>
      )}
    </g>
  );
};

/**
 * 测量指示器组件
 */
interface MeasureIndicatorProps {
  gates: QuantumGate[];
  visualization: CircuitVisualization;
  cfg: Required<GateRenderConfig>;
}

const MeasureIndicator: React.FC<MeasureIndicatorProps> = ({ gates, visualization, cfg }) => {
  const measureGates = gates.filter(g => g.type === 'MEASURE');

  return (
    <>
      {visualization.gatePositions
        .filter(pos => pos.gate.type === 'MEASURE')
        .map((pos, idx) => (
          <g key={`measure-${idx}`}>
            {/* 测量仪表符号 */}
            <path
              d={`M ${pos.x} ${pos.y - 5}
                  A 10 10 0 0 1 ${pos.x + 10} ${pos.y + 5}
                  L ${pos.x + 5} ${pos.y + 5}
                  L ${pos.x} ${pos.y}`}
              fill="none"
              stroke={cfg.colors.measure}
              strokeWidth={2}
            />
            <line
              x1={pos.x + 5}
              y1={pos.y + 5}
              x2={pos.x + 10}
              y2={pos.y + 12}
              stroke={cfg.colors.measure}
              strokeWidth={2}
            />
          </g>
        ))}
    </>
  );
};

/**
 * 概率条组件
 */
interface ProbabilityBarProps {
  probabilities: number[];
  numQubits: number;
}

const ProbabilityBar: React.FC<ProbabilityBarProps> = ({ probabilities, numQubits }) => {
  const displayCount = Math.min(probabilities.length, 16);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div style={styles.probabilityContainer}>
      <div style={styles.probabilityTitle}>状态概率分布</div>
      <div style={styles.probabilityBar}>
        {probabilities.slice(0, displayCount).map((prob, idx) => (
          <div
            key={idx}
            style={{
              ...styles.probabilitySegment,
              width: `${(prob * 100).toFixed(1)}%`,
              backgroundColor: `hsl(${(idx / probabilities.length) * 360}, 70%, 50%)`,
              transition: prefersReducedMotion ? 'none' : styles.probabilitySegment.transition,
            }}
            title={`|${idx.toString(2).padStart(numQubits, '0')}>: ${(prob * 100).toFixed(2)}%`}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 计算电路布局
 */
function calculateCircuitLayout(
  numQubits: number,
  gates: QuantumGate[],
  cfg: Required<GateRenderConfig>
): CircuitVisualization {
  const gatePositions: GatePosition[] = [];
  const qubitRows: QubitRow[] = [];

  // 创建量子比特行
  for (let i = 0; i < numQubits; i++) {
    qubitRows.push({
      index: i,
      y: 40 + i * cfg.qubitHeight,
      label: `q${i}`,
    });
  }

  // 追踪每列的门数 (用于布局)
  const columnGates: Map<number, number> = new Map();
  let currentColumn = 1;

  // 布局门
  for (const gate of gates) {
    let column = currentColumn;

    // 检查冲突 (同一量子比特在同一列不能有多个门)
    const conflict = gatePositions.some(pos => {
      if (pos.gate.target === gate.target) return pos.column === column;
      if (gate.control !== undefined) {
        if (pos.gate.target === gate.target && pos.column === column) return true;
        if (pos.gate.control === gate.target && pos.column === column) return true;
      }
      return false;
    });

    if (conflict) {
      column++;
    }

    const row = qubitRows.find(r => r.index === gate.target);
    if (!row) continue;

    const isDoubleQubit = gate.control !== undefined;

    gatePositions.push({
      gate,
      x: 40 + column * cfg.columnWidth,
      y: row.y,
      column,
      span: isDoubleQubit ? Math.abs(gate.control! - gate.target) : undefined,
    });

    columnGates.set(column, (columnGates.get(column) || 0) + 1);
    currentColumn = column + 1;
  }

  const totalColumns = Math.max(...Array.from(columnGates.keys()), 1) + 2;
  const width = 50 + totalColumns * cfg.columnWidth;
  const height = 60 + numQubits * cfg.qubitHeight;

  return {
    width,
    height,
    gatePositions,
    qubitRows,
    totalColumns,
  };
}

/**
 * 样式
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 16,
    overflowX: 'auto',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  svg: {
    display: 'block',
    backgroundColor: '#16162a',
    borderRadius: 4,
  },
  info: {
    display: 'flex',
    gap: 16,
    marginTop: 12,
    color: '#888',
    fontSize: 12,
  },
  probabilityContainer: {
    marginTop: 16,
  },
  probabilityTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  probabilityBar: {
    display: 'flex',
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#2d2d44',
  },
  probabilitySegment: {
    height: '100%',
    minWidth: 2,
    transition: 'width 0.3s ease',
  },
};

export default QuantumGateRenderer;
