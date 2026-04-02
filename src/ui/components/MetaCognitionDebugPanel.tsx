/**
 * =============================================================================
 * 元认知调试面板
 * Meta-Cognition Debug Panel
 * 用于调试和分析元认知决策过程
 * =============================================================================
 */

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import MetaCognitionVisualization, {
  MetaCognitionInfluence,
  ValueSystem,
  MetaCognitionState,
  Goal,
} from './MetaCognitionVisualization';
import { logger } from '@/core/utils/Logger';

export interface MetaCognitionDebugPanelProps {
  citizenId?: string;
  citizenName?: string;
  influence: MetaCognitionInfluence | null;
  values: ValueSystem | null;
  metaState: MetaCognitionState | null;
  goals: Goal[];
  onForceGoalAction?: () => void;
  onTriggerReflection?: () => void;
  onResetMetaCognition?: () => void;
  onExportState?: () => void;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

type DebugTab = 'overview' | 'weights' | 'values' | 'goals' | 'history' | 'simulation';

interface DecisionLog {
  timestamp: number;
  action: string;
  confidence: number;
  dominantValue: string;
  activeGoals: number;
  selfAwareness: number;
  outcome?: 'positive' | 'negative' | 'neutral';
}

const MetaCognitionDebugPanel: React.FC<MetaCognitionDebugPanelProps> = memo(({
  citizenId,
  citizenName,
  influence,
  values,
  metaState,
  goals,
  onForceGoalAction,
  onTriggerReflection,
  onResetMetaCognition,
  onExportState,
  className = '',
  isOpen = true,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<DebugTab>('overview');
  const [decisionHistory, setDecisionHistory] = useState<DecisionLog[]>([]);
  const [simulationParams, setSimulationParams] = useState({
    selfAwareness: 0.5,
    valueAlignment: 0.5,
    cognitiveLoad: 0.3,
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (autoRefresh && influence && metaState) {
      const log: DecisionLog = {
        timestamp: Date.now(),
        action: Object.entries(influence.finalWeights)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown',
        confidence: influence.selfAwarenessModifier,
        dominantValue: influence.dominantValue,
        activeGoals: influence.activeGoalInfluence.length,
        selfAwareness: metaState.selfAwareness,
      };
      setDecisionHistory(prev => [...prev.slice(-49), log]);
    }
  }, [influence, metaState, autoRefresh]);

  const weightAnalysis = useMemo(() => {
    if (!influence) return null;
    
    const actions = Object.keys(influence.finalWeights);
    const analysis = actions.map(action => {
      const base = influence.baseWeights[action] || 0;
      const valueAdj = influence.valueAdjustedWeights[action] || 0;
      const goalAdj = influence.goalAdjustedWeights[action] || 0;
      const final = influence.finalWeights[action] || 0;
      
      const valueDelta = valueAdj - base;
      const goalDelta = goalAdj - valueAdj;
      const reflectionDelta = final - goalAdj;
      
      return {
        action,
        base,
        valueAdj,
        goalAdj,
        final,
        valueDelta,
        goalDelta,
        reflectionDelta,
        totalDelta: final - base,
      };
    });
    
    return analysis.sort((a, b) => b.final - a.final);
  }, [influence]);

  const valueConflicts = useMemo(() => {
    if (!values) return [];
    
    const conflicts: Array<{ v1: string; v2: string; conflict: number }> = [];
    const conflictPairs: Array<[keyof ValueSystem, keyof ValueSystem]> = [
      ['exploration', 'security'],
      ['autonomy', 'social'],
      ['power', 'harmony'],
      ['achievement', 'security'],
    ];
    
    for (const [v1, v2] of conflictPairs) {
      if (values[v1] > 0.5 && values[v2] > 0.5) {
        conflicts.push({
          v1,
          v2,
          conflict: Math.abs(values[v1] - values[v2]),
        });
      }
    }
    
    return conflicts;
  }, [values]);

  const goalAnalysis = useMemo(() => {
    const active = goals.filter(g => g.status === 'in_progress' || g.status === 'pending');
    const completed = goals.filter(g => g.status === 'completed');
    const failed = goals.filter(g => g.status === 'failed');
    
    const avgProgress = active.length > 0
      ? active.reduce((sum, g) => sum + g.progress, 0) / active.length
      : 0;
    
    const categoryDistribution: Record<string, number> = {};
    for (const goal of active) {
      categoryDistribution[goal.category] = (categoryDistribution[goal.category] || 0) + 1;
    }
    
    return {
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      avgProgress,
      categoryDistribution,
    };
  }, [goals]);

  const handleSimulate = useCallback(() => {
    logger.debug('MetaCognitionDebugPanel', `Simulating with params: ${JSON.stringify(simulationParams)}`);
  }, [simulationParams]);

  const handleClearHistory = useCallback(() => {
    setDecisionHistory([]);
  }, []);

  const tabs: Array<{ id: DebugTab; label: string }> = [
    { id: 'overview', label: '概览' },
    { id: 'weights', label: '权重' },
    { id: 'values', label: '价值观' },
    { id: 'goals', label: '目标' },
    { id: 'history', label: '历史' },
    { id: 'simulation', label: '模拟' },
  ];

  if (!isOpen) return null;

  return (
    <div className={`meta-cognition-debug-panel ${className}`}>
      <style>{`
        .meta-cognition-debug-panel {
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          width: 400px;
          max-height: 80vh;
          background: rgba(10, 10, 20, 0.95);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          font-size: 12px;
          color: #e0e0e0;
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(0, 255, 255, 0.1);
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }
        .panel-title {
          font-size: 14px;
          font-weight: bold;
          color: #00ffff;
        }
        .panel-subtitle {
          font-size: 10px;
          color: #888;
          margin-top: 2px;
        }
        .close-btn {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 18px;
          padding: 4px 8px;
        }
        .close-btn:hover {
          color: #ff4444;
        }
        .tabs-container {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          overflow-x: auto;
        }
        .tab-btn {
          flex: 1;
          padding: 8px 12px;
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 11px;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ccc;
        }
        .tab-btn.active {
          background: rgba(0, 255, 255, 0.1);
          color: #00ffff;
          border-bottom: 2px solid #00ffff;
        }
        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        .panel-actions {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .action-btn {
          flex: 1;
          padding: 8px 12px;
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 4px;
          color: #00ffff;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: rgba(0, 255, 255, 0.2);
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .action-btn.danger {
          background: rgba(255, 68, 68, 0.1);
          border-color: rgba(255, 68, 68, 0.3);
          color: #ff4444;
        }
        .action-btn.danger:hover {
          background: rgba(255, 68, 68, 0.2);
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .stat-item {
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .stat-label {
          font-size: 10px;
          color: #888;
          margin-bottom: 2px;
        }
        .stat-value {
          font-size: 16px;
          font-weight: bold;
          color: #00ffff;
        }
        .weight-table {
          width: 100%;
          border-collapse: collapse;
        }
        .weight-table th,
        .weight-table td {
          padding: 6px 8px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .weight-table th {
          font-size: 10px;
          color: #888;
          font-weight: normal;
        }
        .weight-table td {
          font-size: 11px;
        }
        .delta-positive {
          color: #44ff44;
        }
        .delta-negative {
          color: #ff4444;
        }
        .conflict-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: rgba(255, 170, 0, 0.1);
          border-radius: 4px;
          margin-bottom: 6px;
        }
        .conflict-values {
          font-size: 11px;
        }
        .conflict-severity {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(255, 170, 0, 0.2);
          border-radius: 3px;
          color: #ffaa00;
        }
        .history-item {
          display: grid;
          grid-template-columns: 80px 60px 1fr 40px;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 10px;
        }
        .history-time {
          color: #888;
        }
        .history-action {
          color: #00ffff;
        }
        .history-value {
          color: #44ff44;
        }
        .history-awareness {
          text-align: right;
          color: #ffaa00;
        }
        .sim-control {
          margin-bottom: 12px;
        }
        .sim-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 11px;
        }
        .sim-slider {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          appearance: none;
          cursor: pointer;
        }
        .sim-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #00ffff;
          border-radius: 50%;
          cursor: pointer;
        }
        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }
        .toggle-switch {
          width: 36px;
          height: 18px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9px;
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
        }
        .toggle-switch.active {
          background: rgba(0, 255, 255, 0.3);
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 14px;
          height: 14px;
          background: #888;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: all 0.2s;
        }
        .toggle-switch.active::after {
          left: 20px;
          background: #00ffff;
        }
      `}</style>

      <div className="panel-header">
        <div>
          <div className="panel-title">元认知调试面板</div>
          {citizenName && (
            <div className="panel-subtitle">{citizenName} ({citizenId?.slice(0, 8)})</div>
          )}
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="panel-content">
        {activeTab === 'overview' && (
          <div>
            <MetaCognitionVisualization
              influence={influence}
              values={values}
              metaState={metaState}
              goals={goals}
            />
            
            <div className="stat-grid" style={{ marginTop: '12px' }}>
              <div className="stat-item">
                <div className="stat-label">决策置信度</div>
                <div className="stat-value">
                  {influence ? (influence.selfAwarenessModifier * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">主导价值观</div>
                <div className="stat-value" style={{ fontSize: '12px' }}>
                  {influence?.dominantValue || '未知'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">活跃目标</div>
                <div className="stat-value">{goalAnalysis.active}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">平均进度</div>
                <div className="stat-value">{(goalAnalysis.avgProgress * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weights' && weightAnalysis && (
          <div>
            <table className="weight-table">
              <thead>
                <tr>
                  <th>行动</th>
                  <th>基础</th>
                  <th>价值观Δ</th>
                  <th>目标Δ</th>
                  <th>最终</th>
                </tr>
              </thead>
              <tbody>
                {weightAnalysis.map(w => (
                  <tr key={w.action}>
                    <td>{w.action}</td>
                    <td>{(w.base * 100).toFixed(1)}%</td>
                    <td className={w.valueDelta >= 0 ? 'delta-positive' : 'delta-negative'}>
                      {w.valueDelta >= 0 ? '+' : ''}{(w.valueDelta * 100).toFixed(1)}%
                    </td>
                    <td className={w.goalDelta >= 0 ? 'delta-positive' : 'delta-negative'}>
                      {w.goalDelta >= 0 ? '+' : ''}{(w.goalDelta * 100).toFixed(1)}%
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#00ffff' }}>
                      {(w.final * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'values' && values && (
          <div>
            <div className="section-title">价值观冲突分析</div>
            {valueConflicts.length > 0 ? (
              valueConflicts.map((conflict, index) => (
                <div key={index} className="conflict-item">
                  <span className="conflict-values">
                    {conflict.v1} ↔ {conflict.v2}
                  </span>
                  <span className="conflict-severity">
                    冲突: {(conflict.conflict * 100).toFixed(0)}%
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: '#44ff44', padding: '8px 0' }}>
                ✓ 无明显价值观冲突
              </div>
            )}
            
            <div className="section-title" style={{ marginTop: '16px' }}>价值观详情</div>
            {Object.entries(values).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ width: '80px', fontSize: '11px' }}>{key}</span>
                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                  <div style={{
                    width: `${value * 100}%`,
                    height: '100%',
                    background: `hsl(${value * 120}, 70%, 50%)`,
                    borderRadius: '4px',
                  }} />
                </div>
                <span style={{ width: '40px', textAlign: 'right', fontSize: '11px' }}>
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'goals' && (
          <div>
            <div className="stat-grid">
              <div className="stat-item">
                <div className="stat-label">活跃</div>
                <div className="stat-value">{goalAnalysis.active}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">已完成</div>
                <div className="stat-value" style={{ color: '#44ff44' }}>{goalAnalysis.completed}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">失败</div>
                <div className="stat-value" style={{ color: '#ff4444' }}>{goalAnalysis.failed}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">平均进度</div>
                <div className="stat-value">{(goalAnalysis.avgProgress * 100).toFixed(0)}%</div>
              </div>
            </div>
            
            <div className="section-title">目标类别分布</div>
            {Object.entries(goalAnalysis.categoryDistribution).map(([category, count]) => (
              <div key={category} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>{category}</span>
                <span style={{ color: '#00ffff' }}>{count}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className="toggle-row">
              <span>自动记录</span>
              <div
                className={`toggle-switch ${autoRefresh ? 'active' : ''}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
              />
            </div>
            
            <button
              className="action-btn"
              onClick={handleClearHistory}
              style={{ marginBottom: '12px', width: '100%' }}
            >
              清除历史
            </button>
            
            {decisionHistory.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                暂无决策历史
              </div>
            ) : (
              decisionHistory.slice().reverse().map((log, index) => (
                <div key={index} className="history-item">
                  <span className="history-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="history-action">{log.action}</span>
                  <span className="history-value">{log.dominantValue}</span>
                  <span className="history-awareness">
                    {(log.selfAwareness * 100).toFixed(0)}%
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'simulation' && (
          <div>
            <div className="section-title">参数模拟</div>
            
            <div className="sim-control">
              <div className="sim-label">
                <span>自我意识</span>
                <span>{(simulationParams.selfAwareness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                className="sim-slider"
                min="0"
                max="100"
                value={simulationParams.selfAwareness * 100}
                onChange={e => setSimulationParams({
                  ...simulationParams,
                  selfAwareness: parseInt(e.target.value) / 100,
                })}
              />
            </div>
            
            <div className="sim-control">
              <div className="sim-label">
                <span>价值观一致性</span>
                <span>{(simulationParams.valueAlignment * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                className="sim-slider"
                min="0"
                max="100"
                value={simulationParams.valueAlignment * 100}
                onChange={e => setSimulationParams({
                  ...simulationParams,
                  valueAlignment: parseInt(e.target.value) / 100,
                })}
              />
            </div>
            
            <div className="sim-control">
              <div className="sim-label">
                <span>认知负荷</span>
                <span>{(simulationParams.cognitiveLoad * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                className="sim-slider"
                min="0"
                max="100"
                value={simulationParams.cognitiveLoad * 100}
                onChange={e => setSimulationParams({
                  ...simulationParams,
                  cognitiveLoad: parseInt(e.target.value) / 100,
                })}
              />
            </div>
            
            <button className="action-btn" onClick={handleSimulate} style={{ width: '100%' }}>
              运行模拟
            </button>
          </div>
        )}
      </div>

      <div className="panel-actions">
        {onForceGoalAction && (
          <button className="action-btn" onClick={onForceGoalAction}>
            强制目标决策
          </button>
        )}
        {onTriggerReflection && (
          <button className="action-btn" onClick={onTriggerReflection}>
            触发反思
          </button>
        )}
        {onExportState && (
          <button className="action-btn" onClick={onExportState}>
            导出状态
          </button>
        )}
        {onResetMetaCognition && (
          <button className="action-btn danger" onClick={onResetMetaCognition}>
            重置
          </button>
        )}
      </div>
    </div>
  );
});

MetaCognitionDebugPanel.displayName = 'MetaCognitionDebugPanel';

export default MetaCognitionDebugPanel;
