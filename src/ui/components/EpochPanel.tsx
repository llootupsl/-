/**
 * =============================================================================
 * EpochPanel 纪元面板 - 熵增时代的时代演进
 * =============================================================================
 */

import React, { useState, useEffect, useCallback, memo } from 'react';

/* ==========================================================================
   类型定义
   ========================================================================== */

export type EpochType = 'golden' | 'stable' | 'stress' | 'crisis' | 'collapse' | 'entropy';

export interface EpochInfo {
  type: EpochType;
  name: string;
  entropy: number;
  year: number;
  day: number;
  description: string;
  features: string[];
}

export interface EpochPanelProps {
  epoch: EpochInfo;
  entropyHistory?: number[];
  className?: string;
}

/* ==========================================================================
   常量
   ========================================================================== */

const EPOCH_CONFIG: Record<EpochType, {
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}> = {
  golden: {
    name: '黄金时代',
    color: 'var(--color-epoch-golden)',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    icon: '🌟',
    description: '宇宙处于最低熵状态，市民安居乐业，科技飞速发展。',
  },
  stable: {
    name: '稳定时代',
    color: 'var(--color-epoch-stable)',
    bgColor: 'rgba(0, 240, 255, 0.1)',
    icon: '⚖️',
    description: '熵值较低，系统稳定运行，偶有小规模事件。',
  },
  stress: {
    name: '压力时代',
    color: 'var(--color-epoch-pressure)',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: '⚡',
    description: '熵值上升，系统开始感受到压力。',
  },
  crisis: {
    name: '危机时代',
    color: 'var(--color-epoch-crisis)',
    bgColor: 'rgba(255, 0, 128, 0.1)',
    icon: '🚨',
    description: '熵值逼近临界点，危机四伏。',
  },
  collapse: {
    name: '崩溃边缘',
    color: 'var(--color-epoch-collapse)',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: '💀',
    description: '系统濒临崩溃，随时可能发生灾难性事件。',
  },
  entropy: {
    name: '熵增纪元',
    color: 'var(--color-entropy)',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    icon: '🌀',
    description: '宇宙进入熵增纪元，一切都在混沌中重塑。',
  },
};

const EPOCH_FEATURES: Record<EpochType, string[]> = {
  golden: ['低熵增率', '人口增长', '科技进步', '和平稳定', '资源丰富'],
  stable: ['适度熵增', '均衡发展', '事件偶发', '系统稳定', '资源充足'],
  stress: ['熵增加速', '资源紧张', '事件频发', '矛盾积累', '系统承压'],
  crisis: ['高熵增率', '资源匮乏', '冲突升级', '社会动荡', '系统预警'],
  collapse: ['临界熵值', '灾难频发', '系统崩溃', '人口锐减', '文明危机'],
  entropy: ['不可逆熵增', '秩序重构', '文明重塑', '宇宙重启', '混沌纪元'],
};

/* ==========================================================================
   熵值历史图表
   ========================================================================== */

interface EntropyChartProps {
  history: number[];
}

const EntropyChart: React.FC<EntropyChartProps> = memo(({ history }) => {
  const maxEntropy = 100;
  const height = 60;

  const points = history.map((entropy, index) => {
    const x = (index / Math.max(history.length - 1, 1)) * 100;
    const y = height - (entropy / maxEntropy) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="entropy-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-svg">
        {/* 背景网格 */}
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

        {/* 熵值线 */}
        <polyline
          points={points}
          fill="none"
          stroke="url(#entropyGradient)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {/* 渐变定义 */}
        <defs>
          <linearGradient id="entropyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-indicator-safe)" />
            <stop offset="50%" stopColor="var(--color-indicator-warning)" />
            <stop offset="100%" stopColor="var(--color-indicator-danger)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="chart-labels">
        <span>0</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
});

EntropyChart.displayName = 'EntropyChart';

/* ==========================================================================
   纪元进度条
   ========================================================================== */

interface EpochProgressProps {
  entropy: number;
  epoch: EpochType;
}

const EpochProgress: React.FC<EpochProgressProps> = memo(({ entropy, epoch }) => {
  const epochs: EpochType[] = ['golden', 'stable', 'stress', 'crisis', 'collapse', 'entropy'];
  const currentIndex = epochs.indexOf(epoch);

  return (
    <div className="epoch-progress">
      <div className="progress-track">
        {epochs.map((e, index) => {
          const config = EPOCH_CONFIG[e];
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div
              key={e}
              className={`progress-segment ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}`}
              style={{
                '--segment-color': config.color,
              } as React.CSSProperties}
            >
              <div className="segment-fill" />
              <span className="segment-label">{config.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

EpochProgress.displayName = 'EpochProgress';

/* ==========================================================================
   纪元面板组件
   ========================================================================== */

export const EpochPanel: React.FC<EpochPanelProps> = memo(
  ({ epoch, entropyHistory = [], className = '' }) => {
    const config = EPOCH_CONFIG[epoch.type];
    const features = EPOCH_FEATURES[epoch.type];

    // 默认熵历史
    const history = entropyHistory.length > 0
      ? entropyHistory
      : Array.from({ length: 20 }, (_, i) => 30 + Math.sin(i * 0.5) * 20 + Math.random() * 10);

    return (
      <div
        className={`epoch-panel ${className}`}
        style={{ backgroundColor: config.bgColor }}
      >
        {/* 时代标题 */}
        <div className="epoch-header">
          <span className="epoch-icon">{config.icon}</span>
          <div className="epoch-title-group">
            <h2 className="epoch-title" style={{ color: config.color }}>
              {epoch.name}
            </h2>
            <span className="epoch-time">
              第 {epoch.year} 年 第 {epoch.day} 天
            </span>
          </div>
        </div>

        {/* 熵值显示 */}
        <div className="epoch-entropy">
          <div className="entropy-label">宇宙熵值</div>
          <div className="entropy-value-group">
            <span className="entropy-value" style={{ color: config.color }}>
              {epoch.entropy.toFixed(1)}%
            </span>
            <div className="entropy-indicator">
              {epoch.entropy < 33 && <span className="indicator safe">稳定</span>}
              {epoch.entropy >= 33 && epoch.entropy < 66 && <span className="indicator warning">警告</span>}
              {epoch.entropy >= 66 && epoch.entropy < 90 && <span className="indicator danger">危险</span>}
              {epoch.entropy >= 90 && <span className="indicator critical">临界</span>}
            </div>
          </div>
        </div>

        {/* 时代进度 */}
        <EpochProgress entropy={epoch.entropy} epoch={epoch.type} />

        {/* 熵值历史图表 */}
        {history.length > 0 && (
          <div className="epoch-chart">
            <div className="chart-title">熵值历史</div>
            <EntropyChart history={history} />
          </div>
        )}

        {/* 时代描述 */}
        <div className="epoch-description">
          <p>{config.description}</p>
        </div>

        {/* 时代特征 */}
        <div className="epoch-features">
          <div className="features-title">时代特征</div>
          <div className="features-list">
            {features.map((feature, index) => (
              <span key={index} className="feature-tag" style={{ borderColor: config.color }}>
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

EpochPanel.displayName = 'EpochPanel';

/* ==========================================================================
   纪元状态管理 Hook
   ========================================================================== */

function getEpochFromEntropy(entropy: number): EpochType {
  if (entropy < 15) return 'golden';
  if (entropy < 35) return 'stable';
  if (entropy < 55) return 'stress';
  if (entropy < 75) return 'crisis';
  if (entropy < 90) return 'collapse';
  return 'entropy';
}

export function useEpochStore() {
  const [entropy, setEntropy] = useState(30);
  const [year, setYear] = useState(1);
  const [day, setDay] = useState(1);
  const [entropyHistory, setEntropyHistory] = useState<number[]>([]);

  const epochType = getEpochFromEntropy(entropy);

  const epoch: EpochInfo = {
    type: epochType,
    name: EPOCH_CONFIG[epochType].name,
    entropy,
    year,
    day,
    description: getEpochDescription(epochType),
    features: getEpochFeatures(epochType),
  };

  const updateEntropy = useCallback((delta: number) => {
    setEntropy((prev) => {
      const next = Math.max(0, Math.min(100, prev + delta));
      if (next !== prev) {
        setEntropyHistory((history) => [...history.slice(-99), next]);
      }
      return next;
    });
  }, []);

  const setEpochType = useCallback((type: EpochType) => {
    const targetEntropy = {
      golden: 10,
      stable: 30,
      stress: 50,
      crisis: 70,
      collapse: 85,
      entropy: 95,
    }[type];
    setEntropy(targetEntropy);
  }, []);

  const advanceTime = useCallback(() => {
    setDay((prev) => {
      if (prev >= 365) {
        setYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }, []);

  return {
    entropy,
    epoch,
    entropyHistory,
    year,
    day,
    updateEntropy,
    setEntropy,
    setEpochType,
    advanceTime,
  };
}

function getEpochDescription(type: EpochType): string {
  const descriptions: Record<EpochType, string> = {
    golden: '宇宙处于最低熵状态，市民安居乐业，科技飞速发展。',
    stable: '熵值较低，系统稳定运行，偶有小规模事件。',
    stress: '熵值上升，系统开始感受到压力。',
    crisis: '熵值逼近临界点，危机四伏。',
    collapse: '系统濒临崩溃，随时可能发生灾难性事件。',
    entropy: '宇宙进入熵增纪元，一切都在混沌中重塑。',
  };
  return descriptions[type];
}

function getEpochFeatures(type: EpochType): string[] {
  const features: Record<EpochType, string[]> = {
    golden: ['低熵增率', '人口增长', '科技进步', '和平稳定', '资源丰富'],
    stable: ['适度熵增', '均衡发展', '事件偶发', '系统稳定', '资源充足'],
    stress: ['熵增加速', '资源紧张', '事件频发', '矛盾积累', '系统承压'],
    crisis: ['高熵增率', '资源匮乏', '冲突升级', '社会动荡', '系统预警'],
    collapse: ['临界熵值', '灾难频发', '系统崩溃', '人口锐减', '文明危机'],
    entropy: ['不可逆熵增', '秩序重构', '文明重塑', '宇宙重启', '混沌纪元'],
  };
  return features[type];
}
