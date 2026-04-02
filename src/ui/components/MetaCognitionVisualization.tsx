/**
 * =============================================================================
 * 元认知可视化组件
 * Meta-Cognition Visualization Component
 * 展示元认知对决策的影响效果
 * =============================================================================
 */

import React, { useMemo, memo } from 'react';

export interface MetaCognitionInfluence {
  baseWeights: Record<string, number>;
  valueAdjustedWeights: Record<string, number>;
  goalAdjustedWeights: Record<string, number>;
  reflectionAdjustedWeights: Record<string, number>;
  finalWeights: Record<string, number>;
  dominantValue: string;
  activeGoalInfluence: string[];
  reflectionInsights: string[];
  selfAwarenessModifier: number;
}

export interface ValueSystem {
  survival: number;
  social: number;
  achievement: number;
  exploration: number;
  security: number;
  autonomy: number;
  power: number;
  harmony: number;
}

export interface MetaCognitionState {
  selfAwareness: number;
  reflectionDepth: number;
  valueAlignment: number;
  cognitiveLoad: number;
  metaActivity: number;
}

export interface Goal {
  id: string;
  category: string;
  description: string;
  priority: number;
  progress: number;
  status: string;
}

export interface MetaCognitionVisualizationProps {
  influence: MetaCognitionInfluence | null;
  values: ValueSystem | null;
  metaState: MetaCognitionState | null;
  goals: Goal[];
  className?: string;
}

const ACTION_LABELS: Record<string, string> = {
  work: '工作',
  rest: '休息',
  socialize: '社交',
  explore: '探索',
  migrate: '迁移',
  learn: '学习',
  create: '创造',
  trade: '交易',
};

const VALUE_LABELS: Record<string, string> = {
  survival: '生存',
  social: '社交',
  achievement: '成就',
  exploration: '探索',
  security: '安全',
  autonomy: '自主',
  power: '权力',
  harmony: '和谐',
};

const VALUE_COLORS: Record<string, string> = {
  survival: '#ff4444',
  social: '#44ff44',
  achievement: '#ffaa00',
  exploration: '#00aaff',
  security: '#aa44ff',
  autonomy: '#ff44aa',
  power: '#ff8800',
  harmony: '#44ffff',
};

const MetaCognitionVisualization: React.FC<MetaCognitionVisualizationProps> = memo(({
  influence,
  values,
  metaState,
  goals,
  className = '',
}) => {
  const sortedValues = useMemo(() => {
    if (!values) return [];
    return Object.entries(values)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({
        key,
        label: VALUE_LABELS[key] || key,
        value,
        color: VALUE_COLORS[key] || '#888888',
      }));
  }, [values]);

  const activeGoals = useMemo(() => {
    return goals
      .filter(g => g.status === 'in_progress' || g.status === 'pending')
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
  }, [goals]);

  const weightComparison = useMemo(() => {
    if (!influence) return [];
    const actions = Object.keys(influence.finalWeights);
    return actions.map(action => ({
      action,
      label: ACTION_LABELS[action] || action,
      base: influence.baseWeights[action] || 0,
      valueAdjusted: influence.valueAdjustedWeights[action] || 0,
      goalAdjusted: influence.goalAdjustedWeights[action] || 0,
      final: influence.finalWeights[action] || 0,
    }));
  }, [influence]);

  const selfAwarenessLevel = useMemo(() => {
    if (!metaState) return '未知';
    if (metaState.selfAwareness > 0.8) return '极高';
    if (metaState.selfAwareness > 0.6) return '高';
    if (metaState.selfAwareness > 0.4) return '中等';
    return '低';
  }, [metaState]);

  if (!influence && !values && !metaState) {
    return (
      <div className={`meta-cognition-viz empty ${className}`}>
        <div className="empty-message">暂无元认知数据</div>
      </div>
    );
  }

  return (
    <div className={`meta-cognition-viz ${className}`}>
      <style>{`
        .meta-cognition-viz {
          background: rgba(0, 0, 0, 0.85);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 8px;
          padding: 12px;
          color: #e0e0e0;
          font-size: 12px;
        }
        .meta-cognition-viz.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100px;
        }
        .empty-message {
          color: #666;
        }
        .section {
          margin-bottom: 16px;
        }
        .section:last-child {
          margin-bottom: 0;
        }
        .section-title {
          font-size: 11px;
          font-weight: bold;
          color: #00ffff;
          text-transform: uppercase;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }
        .values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .value-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .value-label {
          font-size: 10px;
          color: #888;
          margin-bottom: 2px;
        }
        .value-bar-container {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .value-bar {
          height: 100%;
          transition: width 0.3s ease;
        }
        .value-number {
          font-size: 10px;
          font-weight: bold;
          margin-top: 2px;
        }
        .dominant-value {
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid rgba(0, 255, 255, 0.3);
        }
        .goals-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .goal-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .goal-category {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(0, 170, 255, 0.2);
          border-radius: 3px;
          color: #00aaff;
        }
        .goal-description {
          flex: 1;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .goal-progress {
          width: 60px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .goal-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #00ff88, #00ffff);
          transition: width 0.3s ease;
        }
        .goal-priority {
          font-size: 10px;
          color: #ffaa00;
        }
        .weights-comparison {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .weight-row {
          display: grid;
          grid-template-columns: 60px repeat(4, 1fr);
          gap: 4px;
          align-items: center;
        }
        .weight-action {
          font-size: 10px;
          color: #888;
        }
        .weight-bar-group {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .weight-mini-bar {
          height: 3px;
          border-radius: 1px;
          transition: width 0.3s ease;
        }
        .weight-base { background: #666; }
        .weight-value { background: #44ff44; }
        .weight-goal { background: #ffaa00; }
        .weight-final { background: #00ffff; }
        .meta-state-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .meta-state-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .meta-state-label {
          font-size: 9px;
          color: #666;
          margin-bottom: 2px;
        }
        .meta-state-value {
          font-size: 14px;
          font-weight: bold;
        }
        .self-awareness-high { color: #00ff88; }
        .self-awareness-medium { color: #ffaa00; }
        .self-awareness-low { color: #ff4444; }
        .insights-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .insight-item {
          font-size: 10px;
          padding: 4px 8px;
          background: rgba(170, 68, 255, 0.1);
          border-left: 2px solid #aa44ff;
          color: #ccc;
        }
        .legend {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          color: #888;
        }
        .legend-color {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }
      `}</style>

      {metaState && (
        <div className="section">
          <div className="section-title">元认知状态</div>
          <div className="meta-state-grid">
            <div className="meta-state-item">
              <span className="meta-state-label">自我意识</span>
              <span className={`meta-state-value ${
                metaState.selfAwareness > 0.6 ? 'self-awareness-high' :
                metaState.selfAwareness > 0.4 ? 'self-awareness-medium' : 'self-awareness-low'
              }`}>
                {selfAwarenessLevel}
              </span>
            </div>
            <div className="meta-state-item">
              <span className="meta-state-label">反思深度</span>
              <span className="meta-state-value" style={{ color: '#00aaff' }}>
                {(metaState.reflectionDepth * 100).toFixed(0)}%
              </span>
            </div>
            <div className="meta-state-item">
              <span className="meta-state-label">认知负荷</span>
              <span className="meta-state-value" style={{ color: metaState.cognitiveLoad > 0.6 ? '#ff4444' : '#44ff44' }}>
                {(metaState.cognitiveLoad * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {values && (
        <div className="section">
          <div className="section-title">价值观体系</div>
          <div className="values-grid">
            {sortedValues.map((v, index) => (
              <div
                key={v.key}
                className={`value-item ${index === 0 ? 'dominant-value' : ''}`}
              >
                <span className="value-label">{v.label}</span>
                <div className="value-bar-container">
                  <div
                    className="value-bar"
                    style={{
                      width: `${v.value * 100}%`,
                      background: v.color,
                    }}
                  />
                </div>
                <span className="value-number" style={{ color: v.color }}>
                  {(v.value * 100).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeGoals.length > 0 && (
        <div className="section">
          <div className="section-title">活跃目标</div>
          <div className="goals-list">
            {activeGoals.map(goal => (
              <div key={goal.id} className="goal-item">
                <span className="goal-category">{goal.category}</span>
                <span className="goal-description">{goal.description}</span>
                <div className="goal-progress">
                  <div
                    className="goal-progress-bar"
                    style={{ width: `${goal.progress * 100}%` }}
                  />
                </div>
                <span className="goal-priority">P{Math.round(goal.priority * 10)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {influence && weightComparison.length > 0 && (
        <div className="section">
          <div className="section-title">决策权重演变</div>
          <div className="weights-comparison">
            {weightComparison.slice(0, 5).map(w => (
              <div key={w.action} className="weight-row">
                <span className="weight-action">{w.label}</span>
                <div className="weight-bar-group">
                  <div className="weight-mini-bar weight-base" style={{ width: `${w.base * 100}%` }} />
                </div>
                <div className="weight-bar-group">
                  <div className="weight-mini-bar weight-value" style={{ width: `${w.valueAdjusted * 100}%` }} />
                </div>
                <div className="weight-bar-group">
                  <div className="weight-mini-bar weight-goal" style={{ width: `${w.goalAdjusted * 100}%` }} />
                </div>
                <div className="weight-bar-group">
                  <div className="weight-mini-bar weight-final" style={{ width: `${w.final * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#666' }} />
              <span>基础</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#44ff44' }} />
              <span>价值观</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ffaa00' }} />
              <span>目标</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#00ffff' }} />
              <span>最终</span>
            </div>
          </div>
        </div>
      )}

      {influence && influence.reflectionInsights.length > 0 && (
        <div className="section">
          <div className="section-title">反思洞察</div>
          <div className="insights-list">
            {influence.reflectionInsights.slice(0, 4).map((insight, index) => (
              <div key={index} className="insight-item">
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

MetaCognitionVisualization.displayName = 'MetaCognitionVisualization';

export default MetaCognitionVisualization;
