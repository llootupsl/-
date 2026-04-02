import React, { useMemo, useCallback, useState } from 'react';
import {
  SupplyChainNodeType,
  SupplyChainEdgeType,
  GraphNeuralNetwork,
  SupplyChainNodeFeatures,
  SupplyChainEdgeFeatures,
} from '@/ai/SocialGNN';
import { ResourceType, AlertLevel, AlertType, SupplyChainAlert, NetworkHealthReport } from '@/economy/SupplyChain';
import './SupplyChainVisualization.css';

interface SupplyChainNode {
  id: string;
  type: SupplyChainNodeType;
  position: { x: number; y: number; z: number };
  inventory: Record<string, number>;
  status: string;
  riskLevel: string;
  centrality: number;
  capacity?: number;
  currentLoad?: number;
  bottleneckScore?: number;
  resilienceScore?: number;
}

interface SupplyChainConnection {
  id: string;
  source: string;
  target: string;
  resource: string;
  currentFlow: number;
  maxFlow: number;
  utilization: number;
  reliability?: number;
}

interface BottleneckInfo {
  nodeId: string;
  bottleneckType: 'capacity' | 'flow' | 'reliability' | 'lead_time';
  severity: number;
  impact: number;
  recommendations: string[];
}

interface AlertInfo {
  id: string;
  type: AlertType;
  level: AlertLevel;
  nodeIds: string[];
  message: string;
  timestamp: number;
  estimatedImpact: number;
  recommendedActions: string[];
  acknowledged: boolean;
  autoFixAvailable: boolean;
}

interface HealthReportInfo {
  overallScore: number;
  resilienceScore: number;
  efficiencyScore: number;
  riskScore: number;
  connectivityScore: number;
  criticalIssues: string[];
  improvementSuggestions: string[];
  trendPrediction: 'improving' | 'stable' | 'declining';
}

interface SupplyChainVisualizationProps {
  nodes: SupplyChainNode[];
  connections: SupplyChainConnection[];
  bottlenecks?: BottleneckInfo[];
  alerts?: AlertInfo[];
  healthReport?: HealthReportInfo;
  onNodeClick?: (nodeId: string) => void;
  onConnectionClick?: (connectionId: string) => void;
  onAlertAcknowledge?: (alertId: string) => void;
  className?: string;
}

const NODE_COLORS: Record<SupplyChainNodeType, string> = {
  [SupplyChainNodeType.SUPPLIER]: '#4ade80',
  [SupplyChainNodeType.PRODUCER]: '#60a5fa',
  [SupplyChainNodeType.DISTRIBUTOR]: '#f59e0b',
  [SupplyChainNodeType.RETAILER]: '#ec4899',
  [SupplyChainNodeType.CONSUMER]: '#a78bfa',
  [SupplyChainNodeType.WAREHOUSE]: '#14b8a6',
  [SupplyChainNodeType.LOGISTICS]: '#f97316',
};

const NODE_LABELS: Record<SupplyChainNodeType, string> = {
  [SupplyChainNodeType.SUPPLIER]: '供应商',
  [SupplyChainNodeType.PRODUCER]: '生产商',
  [SupplyChainNodeType.DISTRIBUTOR]: '分销商',
  [SupplyChainNodeType.RETAILER]: '零售商',
  [SupplyChainNodeType.CONSUMER]: '消费者',
  [SupplyChainNodeType.WAREHOUSE]: '仓库',
  [SupplyChainNodeType.LOGISTICS]: '物流',
};

const RISK_COLORS: Record<string, string> = {
  low: '#4ade80',
  medium: '#fbbf24',
  high: '#f97316',
  critical: '#ef4444',
};

const ALERT_LEVEL_COLORS: Record<AlertLevel, string> = {
  [AlertLevel.INFO]: '#60a5fa',
  [AlertLevel.WARNING]: '#fbbf24',
  [AlertLevel.CRITICAL]: '#f97316',
  [AlertLevel.EMERGENCY]: '#ef4444',
};

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  [AlertType.BOTTLENECK_DETECTED]: '瓶颈检测',
  [AlertType.HIGH_RISK_NODE]: '高风险节点',
  [AlertType.FLOW_IMBALANCE]: '流量失衡',
  [AlertType.INVENTORY_SHORTAGE]: '库存短缺',
  [AlertType.DISRUPTION_PROPAGATION]: '中断传播',
  [AlertType.CAPACITY_OVERLOAD]: '容量过载',
  [AlertType.CONNECTIVITY_LOSS]: '连接丢失',
  [AlertType.RESILIENCE_DROP]: '韧性下降',
};

const TREND_ICONS: Record<string, string> = {
  improving: '↑',
  stable: '→',
  declining: '↓',
};

const TREND_COLORS: Record<string, string> = {
  improving: '#4ade80',
  stable: '#fbbf24',
  declining: '#ef4444',
};

export const SupplyChainVisualization: React.FC<SupplyChainVisualizationProps> = ({
  nodes,
  connections,
  bottlenecks = [],
  alerts = [],
  healthReport,
  onNodeClick,
  onConnectionClick,
  onAlertAcknowledge,
  className = '',
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'network' | 'flow' | 'risk' | 'alerts'>('network');
  const [showHealthPanel, setShowHealthPanel] = useState(false);

  const graphStats = useMemo(() => {
    const totalCapacity = nodes.reduce((sum, n) => sum + (n.capacity || 0), 0);
    const totalLoad = nodes.reduce((sum, n) => sum + (n.currentLoad || 0), 0);
    const avgCentrality = nodes.length > 0
      ? nodes.reduce((sum, n) => sum + n.centrality, 0) / nodes.length
      : 0;
    const riskNodes = nodes.filter(n => n.riskLevel === 'high' || n.riskLevel === 'critical');
    const avgUtilization = connections.length > 0
      ? connections.reduce((sum, c) => sum + c.utilization, 0) / connections.length
      : 0;
    const avgResilience = nodes.length > 0
      ? nodes.reduce((sum, n) => sum + (n.resilienceScore || 0), 0) / nodes.length
      : 0;
    const avgBottleneckScore = nodes.length > 0
      ? nodes.reduce((sum, n) => sum + (n.bottleneckScore || 0), 0) / nodes.length
      : 0;
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

    return {
      totalNodes: nodes.length,
      totalConnections: connections.length,
      totalCapacity,
      totalLoad,
      avgCentrality,
      riskNodeCount: riskNodes.length,
      avgUtilization,
      bottleneckCount: bottlenecks.length,
      avgResilience,
      avgBottleneckScore,
      alertCount: unacknowledgedAlerts.length,
      healthScore: healthReport?.overallScore || 0,
    };
  }, [nodes, connections, bottlenecks, alerts, healthReport]);

  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const width = 800;
    const height = 500;
    const padding = 60;
    
    const typeGroups: Record<string, SupplyChainNode[]> = {};
    nodes.forEach(node => {
      if (!typeGroups[node.type]) {
        typeGroups[node.type] = [];
      }
      typeGroups[node.type].push(node);
    });

    const typeOrder = [
      SupplyChainNodeType.SUPPLIER,
      SupplyChainNodeType.PRODUCER,
      SupplyChainNodeType.WAREHOUSE,
      SupplyChainNodeType.DISTRIBUTOR,
      SupplyChainNodeType.LOGISTICS,
      SupplyChainNodeType.RETAILER,
      SupplyChainNodeType.CONSUMER,
    ];

    typeOrder.forEach((type, typeIndex) => {
      const group = typeGroups[type] || [];
      const x = padding + (typeIndex / (typeOrder.length - 1)) * (width - 2 * padding);
      
      group.forEach((node, nodeIndex) => {
        const y = padding + ((nodeIndex + 0.5) / group.length) * (height - 2 * padding);
        positions[node.id] = { x, y };
      });
    });

    return positions;
  }, [nodes]);

  const getNodeColor = useCallback((node: SupplyChainNode) => {
    if (viewMode === 'risk') {
      return RISK_COLORS[node.riskLevel] || RISK_COLORS.low;
    }
    return NODE_COLORS[node.type] || '#888';
  }, [viewMode]);

  const getConnectionColor = useCallback((connection: SupplyChainConnection) => {
    if (viewMode === 'flow') {
      if (connection.utilization > 0.85) return '#ef4444';
      if (connection.utilization > 0.6) return '#f59e0b';
      return '#4ade80';
    }
    return 'rgba(0, 240, 255, 0.4)';
  }, [viewMode]);

  const getConnectionWidth = useCallback((connection: SupplyChainConnection) => {
    return Math.max(1, Math.min(8, connection.utilization * 8));
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
    onNodeClick?.(nodeId);
  }, [selectedNode, onNodeClick]);

  const selectedNodeData = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.find(n => n.id === selectedNode);
  }, [selectedNode, nodes]);

  const selectedNodeBottlenecks = useMemo(() => {
    if (!selectedNode) return [];
    return bottlenecks.filter(b => b.nodeId === selectedNode);
  }, [selectedNode, bottlenecks]);

  return (
    <div className={`supply-chain-viz ${className}`}>
      <div className="sc-viz-header">
        <h3>供应链网络分析</h3>
        <div className="header-controls">
          {healthReport && (
            <button
              className={`health-toggle-btn ${showHealthPanel ? 'active' : ''}`}
              onClick={() => setShowHealthPanel(!showHealthPanel)}
            >
              <span className="health-score">{healthReport.overallScore.toFixed(0)}</span>
              <span className={`trend-indicator ${healthReport.trendPrediction}`}>
                {TREND_ICONS[healthReport.trendPrediction]}
              </span>
            </button>
          )}
          <div className="view-mode-toggle">
            <button
              className={`mode-btn ${viewMode === 'network' ? 'active' : ''}`}
              onClick={() => setViewMode('network')}
            >
              网络
            </button>
            <button
              className={`mode-btn ${viewMode === 'flow' ? 'active' : ''}`}
              onClick={() => setViewMode('flow')}
            >
              流量
            </button>
            <button
              className={`mode-btn ${viewMode === 'risk' ? 'active' : ''}`}
              onClick={() => setViewMode('risk')}
            >
              风险
            </button>
            <button
              className={`mode-btn ${viewMode === 'alerts' ? 'active' : ''}`}
              onClick={() => setViewMode('alerts')}
            >
              预警
              {graphStats.alertCount > 0 && (
                <span className="alert-badge">{graphStats.alertCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="sc-viz-stats">
        <div className="stat-item">
          <span className="stat-label">节点</span>
          <span className="stat-value">{graphStats.totalNodes}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">连接</span>
          <span className="stat-value">{graphStats.totalConnections}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">平均利用率</span>
          <span className="stat-value">{(graphStats.avgUtilization * 100).toFixed(1)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">瓶颈</span>
          <span className="stat-value warning">{graphStats.bottleneckCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">风险节点</span>
          <span className="stat-value danger">{graphStats.riskNodeCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">韧性</span>
          <span className="stat-value">{(graphStats.avgResilience * 100).toFixed(0)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">健康度</span>
          <span className={`stat-value ${graphStats.healthScore < 50 ? 'danger' : graphStats.healthScore < 70 ? 'warning' : ''}`}>
            {graphStats.healthScore.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="sc-viz-graph">
        <svg viewBox="0 0 800 500" className="sc-graph-svg">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(0, 240, 255, 0.6)" />
            </marker>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <radialGradient key={type} id={`gradient-${type}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0.3" />
              </radialGradient>
            ))}
          </defs>

          <g className="connections-layer">
            {connections.map(conn => {
              const sourcePos = nodePositions[conn.source];
              const targetPos = nodePositions[conn.target];
              if (!sourcePos || !targetPos) return null;

              return (
                <g key={conn.id} className="connection-group">
                  <line
                    className="connection-bg"
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={getConnectionColor(conn)}
                    strokeWidth={getConnectionWidth(conn) + 4}
                    opacity={0.2}
                  />
                  <line
                    className="connection-line"
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={getConnectionColor(conn)}
                    strokeWidth={getConnectionWidth(conn)}
                    markerEnd="url(#arrowhead)"
                    onClick={() => onConnectionClick?.(conn.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <text
                    className="flow-label"
                    x={(sourcePos.x + targetPos.x) / 2}
                    y={(sourcePos.y + targetPos.y) / 2 - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="rgba(255, 255, 255, 0.7)"
                  >
                    {conn.currentFlow.toFixed(0)}/{conn.maxFlow.toFixed(0)}
                  </text>
                </g>
              );
            })}
          </g>

          <g className="nodes-layer">
            {nodes.map(node => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const isSelected = selectedNode === node.id;
              const isHovered = hoveredNode === node.id;
              const radius = 20 + node.centrality * 15;
              const color = getNodeColor(node);

              return (
                <g
                  key={node.id}
                  className={`node-group ${isSelected ? 'selected' : ''}`}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => handleNodeClick(node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {isSelected && (
                    <circle
                      className="node-selection-ring"
                      r={radius + 8}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                  )}
                  <circle
                    className="node-bg"
                    r={radius + 4}
                    fill={color}
                    opacity={0.2}
                  />
                  <circle
                    className="node-main"
                    r={radius}
                    fill={`url(#gradient-${node.type})`}
                    stroke={color}
                    strokeWidth="2"
                  />
                  <text
                    className="node-icon"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="14"
                    fill="white"
                  >
                    {node.type.charAt(0).toUpperCase()}
                  </text>
                  <text
                    className="node-label"
                    y={radius + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="rgba(255, 255, 255, 0.8)"
                  >
                    {NODE_LABELS[node.type]}
                  </text>
                  {node.riskLevel !== 'low' && (
                    <circle
                      className="risk-indicator"
                      cx={radius - 5}
                      cy={-radius + 5}
                      r="6"
                      fill={RISK_COLORS[node.riskLevel]}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <div className="sc-legend">
          <div className="legend-title">图例</div>
          {Object.entries(NODE_LABELS).map(([type, label]) => (
            <div key={type} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: NODE_COLORS[type as SupplyChainNodeType] }}
              />
              <span className="legend-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedNodeData && (
        <div className="sc-node-details">
          <div className="details-header">
            <h4>{NODE_LABELS[selectedNodeData.type]}</h4>
            <span className={`risk-badge ${selectedNodeData.riskLevel}`}>
              {selectedNodeData.riskLevel === 'low' && '低风险'}
              {selectedNodeData.riskLevel === 'medium' && '中风险'}
              {selectedNodeData.riskLevel === 'high' && '高风险'}
              {selectedNodeData.riskLevel === 'critical' && '严重风险'}
            </span>
          </div>
          
          <div className="details-stats">
            <div className="detail-row">
              <span>中心性</span>
              <span>{(selectedNodeData.centrality * 100).toFixed(1)}%</span>
            </div>
            <div className="detail-row">
              <span>状态</span>
              <span>{selectedNodeData.status}</span>
            </div>
            {selectedNodeData.capacity && (
              <div className="detail-row">
                <span>容量</span>
                <span>{selectedNodeData.currentLoad?.toFixed(0) || 0} / {selectedNodeData.capacity}</span>
              </div>
            )}
          </div>

          <div className="details-inventory">
            <h5>库存</h5>
            {Object.entries(selectedNodeData.inventory).map(([resource, amount]) => (
              <div key={resource} className="inventory-item">
                <span className="resource-name">{resource}</span>
                <span className="resource-amount">{amount.toFixed(1)}</span>
              </div>
            ))}
          </div>

          {selectedNodeBottlenecks.length > 0 && (
            <div className="details-bottlenecks">
              <h5>瓶颈分析</h5>
              {selectedNodeBottlenecks.map((bottleneck, idx) => (
                <div key={idx} className="bottleneck-item">
                  <div className="bottleneck-header">
                    <span className="bottleneck-type">{bottleneck.bottleneckType}</span>
                    <span className="bottleneck-severity">
                      严重度: {(bottleneck.severity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <ul className="recommendations">
                    {bottleneck.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {bottlenecks.length > 0 && !selectedNode && (
        <div className="sc-bottlenecks-summary">
          <h4>瓶颈概览</h4>
          <div className="bottlenecks-list">
            {bottlenecks.slice(0, 5).map((bottleneck, idx) => {
              const node = nodes.find(n => n.id === bottleneck.nodeId);
              return (
                <div
                  key={idx}
                  className="bottleneck-summary-item"
                  onClick={() => handleNodeClick(bottleneck.nodeId)}
                >
                  <span className="bottleneck-node">
                    {node ? NODE_LABELS[node.type] : bottleneck.nodeId.slice(0, 8)}
                  </span>
                  <span className={`severity-indicator ${bottleneck.bottleneckType}`}>
                    {bottleneck.bottleneckType}
                  </span>
                  <span className="severity-bar">
                    <span
                      className="severity-fill"
                      style={{ width: `${bottleneck.severity * 100}%` }}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'alerts' && (
        <div className="sc-alerts-panel">
          <div className="alerts-header">
            <h4>活跃预警 ({alerts.filter(a => !a.acknowledged).length})</h4>
          </div>
          <div className="alerts-list">
            {alerts.filter(a => !a.acknowledged).length === 0 ? (
              <div className="no-alerts">
                <span className="no-alerts-icon">✓</span>
                <span>暂无活跃预警</span>
              </div>
            ) : (
              alerts.filter(a => !a.acknowledged).map(alert => (
                <div
                  key={alert.id}
                  className={`alert-item level-${alert.level}`}
                >
                  <div className="alert-header">
                    <span
                      className="alert-type-badge"
                      style={{ backgroundColor: ALERT_LEVEL_COLORS[alert.level] }}
                    >
                      {ALERT_TYPE_LABELS[alert.type]}
                    </span>
                    <span className="alert-impact">
                      影响: {(alert.estimatedImpact * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-actions">
                    <div className="recommended-actions">
                      {alert.recommendedActions.slice(0, 3).map((action, i) => (
                        <span key={i} className="action-item">{action}</span>
                      ))}
                    </div>
                    <div className="alert-buttons">
                      {alert.autoFixAvailable && (
                        <button className="auto-fix-btn">自动修复</button>
                      )}
                      <button
                        className="acknowledge-btn"
                        onClick={() => onAlertAcknowledge?.(alert.id)}
                      >
                        确认
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showHealthPanel && healthReport && (
        <div className="sc-health-panel">
          <div className="health-header">
            <h4>网络健康报告</h4>
            <span className={`trend-badge ${healthReport.trendPrediction}`}>
              {TREND_ICONS[healthReport.trendPrediction]} 
              {healthReport.trendPrediction === 'improving' ? '改善中' : 
               healthReport.trendPrediction === 'declining' ? '下降中' : '稳定'}
            </span>
          </div>
          
          <div className="health-scores">
            <div className="health-score-item">
              <div className="score-label">整体健康</div>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{
                    width: `${healthReport.overallScore}%`,
                    backgroundColor: healthReport.overallScore < 50 ? '#ef4444' : 
                                    healthReport.overallScore < 70 ? '#fbbf24' : '#4ade80'
                  }}
                />
              </div>
              <div className="score-value">{healthReport.overallScore.toFixed(0)}</div>
            </div>
            <div className="health-score-item">
              <div className="score-label">韧性</div>
              <div className="score-bar">
                <div
                  className="score-fill resilience"
                  style={{ width: `${healthReport.resilienceScore}%` }}
                />
              </div>
              <div className="score-value">{healthReport.resilienceScore.toFixed(0)}</div>
            </div>
            <div className="health-score-item">
              <div className="score-label">效率</div>
              <div className="score-bar">
                <div
                  className="score-fill efficiency"
                  style={{ width: `${healthReport.efficiencyScore}%` }}
                />
              </div>
              <div className="score-value">{healthReport.efficiencyScore.toFixed(0)}</div>
            </div>
            <div className="health-score-item">
              <div className="score-label">风险</div>
              <div className="score-bar">
                <div
                  className="score-fill risk"
                  style={{ width: `${healthReport.riskScore}%` }}
                />
              </div>
              <div className="score-value">{healthReport.riskScore.toFixed(0)}</div>
            </div>
            <div className="health-score-item">
              <div className="score-label">连通性</div>
              <div className="score-bar">
                <div
                  className="score-fill connectivity"
                  style={{ width: `${healthReport.connectivityScore}%` }}
                />
              </div>
              <div className="score-value">{healthReport.connectivityScore.toFixed(0)}</div>
            </div>
          </div>

          {healthReport.criticalIssues.length > 0 && (
            <div className="critical-issues">
              <h5>关键问题</h5>
              <ul>
                {healthReport.criticalIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {healthReport.improvementSuggestions.length > 0 && (
            <div className="improvement-suggestions">
              <h5>改进建议</h5>
              <ul>
                {healthReport.improvementSuggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplyChainVisualization;
