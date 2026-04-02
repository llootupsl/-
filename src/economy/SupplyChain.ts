/**
 * =============================================================================
 * 永夜熵纪 - 供应链与产业系统
 * Supply Chain and Industrial System
 * 实现资源流转、生产链、产业分工
 * =============================================================================
 */

import {
  GraphNeuralNetwork,
  SupplyChainNodeType,
  SupplyChainEdgeType,
  SupplyChainNodeFeatures,
  SupplyChainEdgeFeatures,
} from '@/ai/SocialGNN';

/** 资源类型 */
export enum ResourceType {
  /** 生物质 */
  BIOMASS = 'biomass',
  /** 核心能量 */
  CORE_ENERGY = 'coreEnergy',
  /** 信息 */
  INFORMATION = 'information',
  /** 熵 */
  ENTROPY = 'entropy',
  /** 原材料 */
  RAW_MATERIALS = 'rawMaterials',
  /** 半成品 */
  SEMI_FINISHED = 'semiFinished',
  /** 成品 */
  FINISHED_GOODS = 'finishedGoods',
  /** 知识 */
  KNOWLEDGE = 'knowledge',
  /** 熵晶 */
  ENTROPY_CRYSTAL = 'entropyCrystal',
  /** 量子比特 */
  QUANTUM_BIT = 'quantumBit',
}

/** 产业类型 */
export enum IndustryType {
  /** 采集业 */
  EXTRACTION = 'extraction',
  /** 加工业 */
  PROCESSING = 'processing',
  /** 制造业 */
  MANUFACTURING = 'manufacturing',
  /** 信息业 */
  INFORMATION = 'information',
  /** 能源业 */
  ENERGY = 'energy',
  /** 建筑业 */
  CONSTRUCTION = 'construction',
  /** 服务业 */
  SERVICE = 'service',
  /** 研究业 */
  RESEARCH = 'research',
}

/** 生产设施 */
export interface ProductionFacility {
  /** 设施ID */
  id: string;
  /** 设施名称 */
  name: string;
  /** 产业类型 */
  industry: IndustryType;
  /** 设施等级 */
  level: number;
  /** 最大产能 */
  maxCapacity: number;
  /** 当前产量 */
  currentOutput: number;
  /** 生产效率 (0-1) */
  efficiency: number;
  /** 工人数量 */
  workers: number;
  /** 最大工人数 */
  maxWorkers: number;
  /** 能源消耗 */
  energyConsumption: number;
  /** 原材料需求 */
  inputRequirements: ResourceRequirement[];
  /** 产出 */
  outputs: ResourceOutput[];
  /** 位置 */
  position: { x: number; y: number; z: number };
  /** 运行状态 */
  status: 'idle' | 'running' | 'maintenance' | 'damaged';
  /** 升级成本 */
  upgradeCost: Record<ResourceType, number>;
}

/** 资源需求 */
export interface ResourceRequirement {
  resource: ResourceType;
  amount: number;
  satisfaction: number; // 满足度 0-1
}

/** 资源产出 */
export interface ResourceOutput {
  resource: ResourceType;
  amount: number;
  quality: number; // 质量 0-1
}

/** 供应链节点 */
export interface SupplyChainNode {
  /** 节点ID */
  id: string;
  /** 类型 */
  type: 'extraction' | 'processing' | 'distribution' | 'consumption';
  /** 设施 */
  facility?: ProductionFacility;
  /** 输入连接 */
  inputs: SupplyChainConnection[];
  /** 输出连接 */
  outputs: SupplyChainConnection[];
  /** 库存 */
  inventory: Record<ResourceType, number>;
  /** 位置 - V5修复：使用 Vec3 类型 */
  position: { x: number; y: number; z: number };
  /** 最大容量 - V5修复：添加缺失属性 */
  maxCapacity?: number;
}

/** 供应链连接 */
export interface SupplyChainConnection {
  /** 连接ID */
  id: string;
  /** 源节点 */
  sourceId: string;
  /** 目标节点 */
  targetId: string;
  /** 资源类型 */
  resource: ResourceType;
  /** 最大流量 */
  maxFlow: number;
  /** 当前流量 */
  currentFlow: number;
  /** 运输成本 */
  transportCost: number;
}

/** 产业分工 */
export interface IndustryDivision {
  /** 市民ID */
  citizenId: string;
  /** 产业类型 */
  industry: IndustryType;
  /** 技能等级 */
  skillLevel: number;
  /** 生产力 */
  productivity: number;
  /** 工资要求 */
  wageRequirement: number;
}

/** 供应链中断类型 */
export enum DisruptionType {
  /** 设施故障 */
  FACILITY_FAILURE = 'facility_failure',
  /** 资源短缺 */
  RESOURCE_SHORTAGE = 'resource_shortage',
  /** 运输中断 */
  TRANSPORT_DISRUPTION = 'transport_disruption',
  /** 劳动力短缺 */
  LABOR_SHORTAGE = 'labor_shortage',
  /** 自然灾害 */
  NATURAL_DISASTER = 'natural_disaster',
  /** 外部冲击 */
  EXTERNAL_SHOCK = 'external_shock',
}

/** 供应链中断事件 */
export interface SupplyChainDisruption {
  /** 中断ID */
  id: string;
  /** 中断类型 */
  type: DisruptionType;
  /** 源节点ID */
  sourceNodeId: string;
  /** 严重程度 (0-1) */
  severity: number;
  /** 开始时间 */
  startTime: number;
  /** 持续时间 */
  duration: number;
  /** 影响范围 */
  affectedNodes: string[];
  /** 影响连接 */
  affectedConnections: string[];
  /** 级联深度 */
  cascadeDepth: number;
  /** 恢复进度 */
  recoveryProgress: number;
  /** 预计恢复时间 */
  estimatedRecoveryTime: number;
  /** 经济损失 */
  economicLoss: number;
}

/** GNN节点特征 */
export interface GNNNodeFeatures {
  /** 节点ID */
  nodeId: string;
  /** 产能利用率 */
  capacityUtilization: number;
  /** 库存水平 */
  inventoryLevel: number;
  /** 输入多样性 */
  inputDiversity: number;
  /** 输出多样性 */
  outputDiversity: number;
  /** 连接度 */
  connectivity: number;
  /** 中心性分数 */
  centralityScore: number;
  /** 风险分数 */
  riskScore: number;
  /** 恢复能力 */
  resilience: number;
}

/** GNN边特征 */
export interface GNNEdgeFeatures {
  /** 边ID */
  edgeId: string;
  /** 源节点 */
  sourceId: string;
  /** 目标节点 */
  targetId: string;
  /** 流量利用率 */
  flowUtilization: number;
  /** 运输效率 */
  transportEfficiency: number;
  /** 可靠性 */
  reliability: number;
  /** 替代路径数 */
  alternativePaths: number;
}

/** 瓶颈分析结果 */
export interface BottleneckAnalysis {
  /** 瓶颈节点ID */
  nodeId: string;
  /** 瓶颈类型 */
  type: 'capacity' | 'flow' | 'inventory' | 'connectivity';
  /** 严重程度 */
  severity: number;
  /** 影响范围 */
  impactScope: number;
  /** 建议措施 */
  recommendations: string[];
  /** 预计改善效果 */
  expectedImprovement: number;
}

/** 中断风险预测 */
export interface DisruptionRisk {
  /** 节点ID */
  nodeId: string;
  /** 风险概率 */
  probability: number;
  /** 潜在影响 */
  potentialImpact: number;
  /** 风险因素 */
  riskFactors: string[];
  /** 缓解措施 */
  mitigationStrategies: string[];
  /** 风险等级 */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/** 流量优化结果 */
export interface FlowOptimization {
  /** 连接ID */
  connectionId: string;
  /** 当前流量 */
  currentFlow: number;
  /** 优化流量 */
  optimizedFlow: number;
  /** 效率提升 */
  efficiencyGain: number;
  /** 成本节约 */
  costSaving: number;
}

/** 预警级别 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

/** 预警类型 */
export enum AlertType {
  BOTTLENECK_DETECTED = 'bottleneck_detected',
  HIGH_RISK_NODE = 'high_risk_node',
  FLOW_IMBALANCE = 'flow_imbalance',
  INVENTORY_SHORTAGE = 'inventory_shortage',
  DISRUPTION_PROPAGATION = 'disruption_propagation',
  CAPACITY_OVERLOAD = 'capacity_overload',
  CONNECTIVITY_LOSS = 'connectivity_loss',
  RESILIENCE_DROP = 'resilience_drop',
}

/** 供应链预警 */
export interface SupplyChainAlert {
  /** 预警ID */
  id: string;
  /** 预警类型 */
  type: AlertType;
  /** 预警级别 */
  level: AlertLevel;
  /** 相关节点 */
  nodeIds: string[];
  /** 相关连接 */
  connectionIds: string[];
  /** 预警消息 */
  message: string;
  /** 触发时间 */
  timestamp: number;
  /** 预计影响 */
  estimatedImpact: number;
  /** 建议措施 */
  recommendedActions: string[];
  /** 是否已处理 */
  acknowledged: boolean;
  /** 自动修复建议 */
  autoFixAvailable: boolean;
}

/** 网络健康度报告 */
export interface NetworkHealthReport {
  /** 整体健康分数 (0-100) */
  overallScore: number;
  /** 韧性分数 */
  resilienceScore: number;
  /** 效率分数 */
  efficiencyScore: number;
  /** 风险分数 */
  riskScore: number;
  /** 连通性分数 */
  connectivityScore: number;
  /** 关键问题列表 */
  criticalIssues: string[];
  /** 改进建议 */
  improvementSuggestions: string[];
  /** 趋势预测 */
  trendPrediction: 'improving' | 'stable' | 'declining';
}

/** 级联影响分析 */
export interface CascadeImpactAnalysis {
  /** 源节点ID */
  sourceNodeId: string;
  /** 直接影响节点 */
  directImpact: string[];
  /** 二级影响节点 */
  secondaryImpact: string[];
  /** 总影响范围 */
  totalAffectedNodes: number;
  /** 预计经济损失 */
  estimatedLoss: number;
  /** 恢复时间估计 */
  estimatedRecoveryTime: number;
  /** 关键路径 */
  criticalPaths: string[][];
}

/** 供应链可视化数据 */
export interface SupplyChainVisualizationData {
  /** 节点数据 */
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number; z: number };
    inventory: Record<string, number>;
    status: string;
    riskLevel: string;
    centrality: number;
    bottleneckScore?: number;
    resilienceScore?: number;
  }>;
  /** 连接数据 */
  connections: Array<{
    id: string;
    source: string;
    target: string;
    resource: string;
    currentFlow: number;
    maxFlow: number;
    utilization: number;
    reliability?: number;
  }>;
  /** 流量数据 */
  flowData: Array<{
    connectionId: string;
    flowRate: number;
    efficiency: number;
  }>;
  /** 统计数据 */
  statistics: {
    totalNodes: number;
    totalConnections: number;
    averageUtilization: number;
    bottleneckCount: number;
    riskNodes: number;
    averageResilience: number;
    networkHealthScore: number;
  };
  /** 中断事件 */
  activeDisruptions: SupplyChainDisruption[];
  /** 活跃预警 */
  activeAlerts: SupplyChainAlert[];
  /** 网络健康报告 */
  healthReport: NetworkHealthReport;
}

/** 图神经网络配置 */
interface GNNConfig {
  /** 嵌入维度 */
  embeddingDim: number;
  /** 消息传递层数 */
  numLayers: number;
  /** 学习率 */
  learningRate: number;
  /** 注意力头数 */
  attentionHeads: number;
}

/** 预警配置 */
interface AlertConfig {
  /** 瓶颈阈值 */
  bottleneckThreshold: number;
  /** 风险阈值 */
  riskThreshold: number;
  /** 利用率上限阈值 */
  utilizationHighThreshold: number;
  /** 利用率下限阈值 */
  utilizationLowThreshold: number;
  /** 库存警告阈值 */
  inventoryWarningThreshold: number;
  /** 韧性警告阈值 */
  resilienceWarningThreshold: number;
}

/** 供应链图神经网络分析类 */
export class SupplyChainGNN {
  private nodes: Map<string, SupplyChainNode> = new Map();
  private connections: Map<string, SupplyChainConnection> = new Map();
  private nodeFeatures: Map<string, GNNNodeFeatures> = new Map();
  private edgeFeatures: Map<string, GNNEdgeFeatures> = new Map();
  private adjacencyMatrix: number[][] = [];
  private nodeEmbeddings: Map<string, number[]> = new Map();
  private disruptions: SupplyChainDisruption[] = [];
  private alerts: SupplyChainAlert[] = [];
  private config: GNNConfig;
  private alertConfig: AlertConfig;
  private currentTime: number = 0;
  private healthHistory: number[] = [];

  constructor(config?: Partial<GNNConfig>) {
    this.config = {
      embeddingDim: 64,
      numLayers: 3,
      learningRate: 0.01,
      attentionHeads: 4,
      ...config,
    };
    this.alertConfig = {
      bottleneckThreshold: 0.7,
      riskThreshold: 0.6,
      utilizationHighThreshold: 0.85,
      utilizationLowThreshold: 0.2,
      inventoryWarningThreshold: 50,
      resilienceWarningThreshold: 0.4,
    };
  }

  buildGraph(nodes: SupplyChainNode[], connections: SupplyChainConnection[]): void {
    this.nodes.clear();
    this.connections.clear();
    this.nodeFeatures.clear();
    this.edgeFeatures.clear();

    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }

    for (const conn of connections) {
      this.connections.set(conn.id, conn);
    }

    this.buildAdjacencyMatrix();
    this.computeNodeFeatures();
    this.computeEdgeFeatures();
    this.initializeEmbeddings();
    this.runMessagePassing();
  }

  private buildAdjacencyMatrix(): void {
    const nodeIds = Array.from(this.nodes.keys());
    const n = nodeIds.length;
    this.adjacencyMatrix = Array(n).fill(null).map(() => Array(n).fill(0));

    for (const conn of Array.from(this.connections.values())) {
      const sourceIdx = nodeIds.indexOf(conn.sourceId);
      const targetIdx = nodeIds.indexOf(conn.targetId);
      if (sourceIdx !== -1 && targetIdx !== -1) {
        const weight = conn.maxFlow > 0 ? conn.currentFlow / conn.maxFlow : 0;
        this.adjacencyMatrix[sourceIdx][targetIdx] = weight;
      }
    }
  }

  private computeNodeFeatures(): void {
    for (const node of Array.from(this.nodes.values())) {
      const inventoryValues = Object.values(node.inventory) as number[];
      const totalInventory = inventoryValues.reduce((sum: number, v: number) => sum + v, 0);
      const maxCap = node.maxCapacity || 1000;
      
      const features: GNNNodeFeatures = {
        nodeId: node.id,
        capacityUtilization: totalInventory / maxCap,
        inventoryLevel: totalInventory,
        inputDiversity: node.inputs.length,
        outputDiversity: node.outputs.length,
        connectivity: node.inputs.length + node.outputs.length,
        centralityScore: 0,
        riskScore: 0,
        resilience: this.calculateResilience(node),
      };
      
      this.nodeFeatures.set(node.id, features);
    }

    this.computeCentrality();
    this.computeRiskScores();
  }

  private calculateResilience(node: SupplyChainNode): number {
    const inputCount = node.inputs.length;
    const outputCount = node.outputs.length;
    const inventoryValues = Object.values(node.inventory);
    const avgInventory = inventoryValues.length > 0 
      ? inventoryValues.reduce((sum, v) => sum + v, 0) / inventoryValues.length 
      : 0;
    
    const redundancyScore = Math.min(inputCount, 3) / 3;
    const inventoryScore = Math.min(avgInventory / 100, 1);
    const connectivityScore = Math.min((inputCount + outputCount) / 6, 1);
    
    return (redundancyScore * 0.4 + inventoryScore * 0.3 + connectivityScore * 0.3);
  }

  private computeCentrality(): void {
    const nodeIds = Array.from(this.nodes.keys());
    const n = nodeIds.length;
    
    if (n === 0) return;

    const betweenness: Record<string, number> = {};
    for (const id of nodeIds) {
      betweenness[id] = 0;
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        
        const paths = this.findAllPaths(nodeIds[i], nodeIds[j]);
        for (const path of paths) {
          for (const nodeId of path.slice(1, -1)) {
            betweenness[nodeId] += 1 / paths.length;
          }
        }
      }
    }

    const maxBetweenness = Math.max(...Object.values(betweenness), 1);
    for (const [nodeId, score] of Object.entries(betweenness)) {
      const features = this.nodeFeatures.get(nodeId);
      if (features) {
        features.centralityScore = score / maxBetweenness;
      }
    }
  }

  private findAllPaths(startId: string, endId: string, visited: Set<string> = new Set()): string[][] {
    if (startId === endId) return [[startId]];
    if (visited.has(startId)) return [];

    visited.add(startId);
    const paths: string[][] = [];
    const node = this.nodes.get(startId);
    
    if (node) {
      for (const conn of node.outputs) {
        const subPaths = this.findAllPaths(conn.targetId, endId, new Set(visited));
        for (const subPath of subPaths) {
          paths.push([startId, ...subPath]);
        }
      }
    }

    return paths;
  }

  private computeRiskScores(): void {
    for (const [nodeId, features] of Array.from(this.nodeFeatures.entries())) {
      let riskScore = 0;
      
      if (features.capacityUtilization > 0.9) riskScore += 0.3;
      if (features.capacityUtilization < 0.1) riskScore += 0.2;
      if (features.connectivity <= 1) riskScore += 0.25;
      if (features.resilience < 0.3) riskScore += 0.25;
      
      const activeDisruptions = this.disruptions.filter(d => d.affectedNodes.includes(nodeId));
      riskScore += activeDisruptions.length * 0.1;
      
      features.riskScore = Math.min(riskScore, 1);
    }
  }

  private computeEdgeFeatures(): void {
    for (const conn of Array.from(this.connections.values())) {
      const alternativePaths = this.countAlternativePaths(conn.sourceId, conn.targetId, conn.id);
      
      const features: GNNEdgeFeatures = {
        edgeId: conn.id,
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        flowUtilization: conn.maxFlow > 0 ? conn.currentFlow / conn.maxFlow : 0,
        transportEfficiency: 1 - conn.transportCost,
        reliability: this.calculateEdgeReliability(conn),
        alternativePaths,
      };
      
      this.edgeFeatures.set(conn.id, features);
    }
  }

  private countAlternativePaths(sourceId: string, targetId: string, excludeEdgeId: string): number {
    let count = 0;
    const node = this.nodes.get(sourceId);
    
    if (node) {
      for (const conn of node.outputs) {
        if (conn.id !== excludeEdgeId) {
          const paths = this.findAllPaths(conn.targetId, targetId);
          count += paths.length;
        }
      }
    }
    
    return Math.min(count, 5);
  }

  private calculateEdgeReliability(conn: SupplyChainConnection): number {
    const sourceNode = this.nodes.get(conn.sourceId);
    const targetNode = this.nodes.get(conn.targetId);
    
    if (!sourceNode || !targetNode) return 0;
    
    const sourceFeatures = this.nodeFeatures.get(conn.sourceId);
    const targetFeatures = this.nodeFeatures.get(conn.targetId);
    
    if (!sourceFeatures || !targetFeatures) return 0.5;
    
    const sourceReliability = 1 - sourceFeatures.riskScore;
    const targetReliability = 1 - targetFeatures.riskScore;
    const flowReliability = conn.maxFlow > 0 ? Math.min(conn.currentFlow / conn.maxFlow + 0.2, 1) : 0.5;
    
    return (sourceReliability + targetReliability + flowReliability) / 3;
  }

  private initializeEmbeddings(): void {
    for (const [nodeId, features] of Array.from(this.nodeFeatures.entries())) {
      const embedding: number[] = [];
      embedding.push(features.capacityUtilization);
      embedding.push(features.inventoryLevel / 1000);
      embedding.push(features.inputDiversity / 10);
      embedding.push(features.outputDiversity / 10);
      embedding.push(features.connectivity / 10);
      embedding.push(features.centralityScore);
      embedding.push(features.riskScore);
      embedding.push(features.resilience);
      
      while (embedding.length < this.config.embeddingDim) {
        embedding.push(Math.random() * 0.1 - 0.05);
      }
      
      this.nodeEmbeddings.set(nodeId, embedding);
    }
  }

  private runMessagePassing(): void {
    for (let layer = 0; layer < this.config.numLayers; layer++) {
      this.messagePassingStep();
    }
  }

  private messagePassingStep(): void {
    const newEmbeddings = new Map<string, number[]>();
    
    for (const [nodeId, embedding] of Array.from(this.nodeEmbeddings.entries())) {
      const node = this.nodes.get(nodeId);
      if (!node) continue;
      
      const neighborMessages: number[][] = [];
      
      for (const conn of node.inputs) {
        const neighborEmbedding = this.nodeEmbeddings.get(conn.sourceId);
        if (neighborEmbedding) {
          const edgeFeat = this.edgeFeatures.get(conn.id);
          const weight = edgeFeat ? edgeFeat.reliability : 0.5;
          const message = neighborEmbedding.map(v => v * weight);
          neighborMessages.push(message);
        }
      }
      
      for (const conn of node.outputs) {
        const neighborEmbedding = this.nodeEmbeddings.get(conn.targetId);
        if (neighborEmbedding) {
          const edgeFeat = this.edgeFeatures.get(conn.id);
          const weight = edgeFeat ? edgeFeat.reliability * 0.5 : 0.25;
          const message = neighborEmbedding.map(v => v * weight);
          neighborMessages.push(message);
        }
      }
      
      let aggregated: number[];
      if (neighborMessages.length > 0) {
        aggregated = embedding.map((_, i) => {
          const sum = neighborMessages.reduce((acc, msg) => acc + msg[i], 0);
          return sum / neighborMessages.length;
        });
      } else {
        aggregated = embedding;
      }
      
      const newEmbedding = embedding.map((v, i) => 
        0.5 * v + 0.5 * Math.tanh(aggregated[i])
      );
      
      newEmbeddings.set(nodeId, newEmbedding);
    }
    
    this.nodeEmbeddings = newEmbeddings;
  }

  analyzeBottlenecks(): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];
    
    for (const [nodeId, features] of Array.from(this.nodeFeatures.entries())) {
      const issues: { type: BottleneckAnalysis['type']; severity: number }[] = [];
      
      if (features.capacityUtilization > 0.85) {
        issues.push({ type: 'capacity', severity: (features.capacityUtilization - 0.85) / 0.15 });
      }
      
      if (features.inventoryLevel < 50 && features.inputDiversity > 0) {
        issues.push({ type: 'inventory', severity: 1 - features.inventoryLevel / 50 });
      }
      
      const node = this.nodes.get(nodeId);
      if (node) {
        const maxInputFlow = node.inputs.reduce((sum, c) => sum + c.maxFlow, 0);
        const maxOutputFlow = node.outputs.reduce((sum, c) => sum + c.maxFlow, 0);
        
        if (maxInputFlow > maxOutputFlow * 1.5 && maxOutputFlow > 0) {
          issues.push({ type: 'flow', severity: Math.min((maxInputFlow / maxOutputFlow - 1) / 2, 1) });
        }
      }
      
      if (features.connectivity < 2 && features.centralityScore > 0.5) {
        issues.push({ type: 'connectivity', severity: features.centralityScore });
      }
      
      if (issues.length > 0) {
        const primaryIssue = issues.reduce((max, issue) => 
          issue.severity > max.severity ? issue : max, issues[0]);
        
        bottlenecks.push({
          nodeId,
          type: primaryIssue.type,
          severity: primaryIssue.severity,
          impactScope: features.centralityScore * this.nodes.size,
          recommendations: this.generateBottleneckRecommendations(nodeId, primaryIssue.type),
          expectedImprovement: primaryIssue.severity * 0.3,
        });
      }
    }
    
    return bottlenecks.sort((a, b) => b.severity - a.severity);
  }

  analyzeAdvancedBottlenecks(): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];
    
    for (const [nodeId, features] of Array.from(this.nodeFeatures.entries())) {
      const node = this.nodes.get(nodeId);
      if (!node) continue;

      const bottleneckScore = this.calculateBottleneckScore(nodeId, features);
      
      if (bottleneckScore.total > this.alertConfig.bottleneckThreshold) {
        bottlenecks.push({
          nodeId,
          type: bottleneckScore.primaryType,
          severity: bottleneckScore.total,
          impactScope: this.calculateImpactScope(nodeId),
          recommendations: this.generateAdvancedRecommendations(nodeId, bottleneckScore),
          expectedImprovement: this.calculateExpectedImprovement(nodeId, bottleneckScore),
        });
      }
    }
    
    return bottlenecks.sort((a, b) => b.severity - a.severity);
  }

  private calculateBottleneckScore(nodeId: string, features: GNNNodeFeatures): {
    total: number;
    primaryType: BottleneckAnalysis['type'];
    scores: Record<string, number>;
  } {
    const scores: Record<string, number> = {
      capacity: 0,
      flow: 0,
      inventory: 0,
      connectivity: 0,
    };

    if (features.capacityUtilization > 0.8) {
      scores.capacity = Math.pow((features.capacityUtilization - 0.8) / 0.2, 1.5);
    }

    const node = this.nodes.get(nodeId);
    if (node) {
      const inputFlow = node.inputs.reduce((sum, c) => sum + c.currentFlow, 0);
      const outputFlow = node.outputs.reduce((sum, c) => sum + c.currentFlow, 0);
      const maxInput = node.inputs.reduce((sum, c) => sum + c.maxFlow, 0);
      const maxOutput = node.outputs.reduce((sum, c) => sum + c.maxFlow, 0);
      
      if (maxInput > 0 && maxOutput > 0) {
        const flowRatio = inputFlow / Math.max(outputFlow, 0.01);
        if (flowRatio > 1.3) {
          scores.flow = Math.min((flowRatio - 1) / 1.5, 1);
        }
      }
    }

    if (features.inventoryLevel < 100) {
      scores.inventory = 1 - features.inventoryLevel / 100;
    }

    if (features.connectivity < 3) {
      scores.connectivity = (3 - features.connectivity) / 3 * features.centralityScore;
    }

    const total = Math.sqrt(
      scores.capacity ** 2 + 
      scores.flow ** 2 + 
      scores.inventory ** 2 + 
      scores.connectivity ** 2
    ) / 2;

    let primaryType: BottleneckAnalysis['type'] = 'capacity';
    let maxScore = 0;
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryType = type as BottleneckAnalysis['type'];
      }
    }

    return { total, primaryType, scores };
  }

  private calculateImpactScope(nodeId: string): number {
    const visited = new Set<string>();
    const queue = [nodeId];
    let impact = 0;

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const node = this.nodes.get(currentId);
      if (node) {
        impact += this.nodeFeatures.get(currentId)?.centralityScore || 0;
        
        for (const conn of node.outputs) {
          if (!visited.has(conn.targetId)) {
            queue.push(conn.targetId);
          }
        }
      }
    }

    return impact;
  }

  private generateAdvancedRecommendations(nodeId: string, bottleneckScore: { 
    total: number; 
    primaryType: BottleneckAnalysis['type']; 
    scores: Record<string, number> 
  }): string[] {
    const recommendations: string[] = [];
    const node = this.nodes.get(nodeId);

    if (bottleneckScore.scores.capacity > 0.5) {
      recommendations.push('紧急扩容: 立即增加存储容量或优化库存周转');
      if (node?.facility) {
        recommendations.push(`升级设施 ${node.facility.name} 至等级 ${node.facility.level + 1}`);
      }
      recommendations.push('考虑建立分布式存储节点分担负载');
    }

    if (bottleneckScore.scores.flow > 0.5) {
      recommendations.push('优化流量分配: 建立分流节点或增加输出通道');
      recommendations.push('实施动态流量调度算法');
      recommendations.push('考虑建立并行传输路径');
    }

    if (bottleneckScore.scores.inventory > 0.5) {
      recommendations.push('建立安全库存机制');
      recommendations.push('多元化供应商来源');
      recommendations.push('实施即时补货策略 (JIT)');
    }

    if (bottleneckScore.scores.connectivity > 0.5) {
      recommendations.push('增加网络冗余连接');
      recommendations.push('建立备用传输路径');
      recommendations.push('提高网络拓扑韧性');
    }

    return recommendations;
  }

  private calculateExpectedImprovement(nodeId: string, bottleneckScore: { 
    total: number; 
    primaryType: BottleneckAnalysis['type']; 
    scores: Record<string, number> 
  }): number {
    const features = this.nodeFeatures.get(nodeId);
    if (!features) return 0;

    let improvement = 0;
    
    improvement += (1 - features.riskScore) * 0.2;
    improvement += features.resilience * 0.15;
    improvement += (1 - bottleneckScore.total) * 0.25;
    
    const node = this.nodes.get(nodeId);
    if (node) {
      const alternativePaths = this.countAlternativePaths(nodeId, nodeId, '');
      improvement += Math.min(alternativePaths / 5, 0.2);
    }

    return Math.min(improvement, 1);
  }

  private generateBottleneckRecommendations(nodeId: string, type: BottleneckAnalysis['type']): string[] {
    const recommendations: string[] = [];
    const node = this.nodes.get(nodeId);
    
    switch (type) {
      case 'capacity':
        recommendations.push('增加存储容量');
        recommendations.push('优化库存周转');
        if (node?.facility) {
          recommendations.push('升级设施等级');
        }
        break;
      case 'flow':
        recommendations.push('增加输出连接');
        recommendations.push('优化流量分配');
        recommendations.push('建立分流节点');
        break;
      case 'inventory':
        recommendations.push('增加安全库存');
        recommendations.push('建立备用供应源');
        recommendations.push('优化补货策略');
        break;
      case 'connectivity':
        recommendations.push('建立冗余连接');
        recommendations.push('增加备用路径');
        recommendations.push('提高网络韧性');
        break;
    }
    
    return recommendations;
  }

  predictDisruption(nodeId: string): DisruptionRisk {
    const features = this.nodeFeatures.get(nodeId);
    const node = this.nodes.get(nodeId);
    
    if (!features || !node) {
      return {
        nodeId,
        probability: 0,
        potentialImpact: 0,
        riskFactors: [],
        mitigationStrategies: [],
        riskLevel: 'low',
      };
    }
    
    const riskFactors: string[] = [];
    let probability = features.riskScore;
    
    if (features.capacityUtilization > 0.9) {
      riskFactors.push('产能过度利用');
      probability += 0.1;
    }
    if (features.inventoryLevel < 30) {
      riskFactors.push('库存水平过低');
      probability += 0.15;
    }
    if (features.connectivity <= 1) {
      riskFactors.push('网络连接脆弱');
      probability += 0.2;
    }
    if (features.resilience < 0.3) {
      riskFactors.push('恢复能力不足');
      probability += 0.1;
    }
    
    const activeDisruptions = this.disruptions.filter(d => d.affectedNodes.includes(nodeId));
    if (activeDisruptions.length > 0) {
      riskFactors.push('存在活跃中断事件');
      probability += 0.15;
    }
    
    probability = Math.min(probability, 1);
    
    const potentialImpact = features.centralityScore * 0.5 + features.connectivity / 10 * 0.3 + 0.2;
    
    const mitigationStrategies = this.generateMitigationStrategies(riskFactors);
    
    let riskLevel: DisruptionRisk['riskLevel'];
    if (probability < 0.25) riskLevel = 'low';
    else if (probability < 0.5) riskLevel = 'medium';
    else if (probability < 0.75) riskLevel = 'high';
    else riskLevel = 'critical';
    
    return {
      nodeId,
      probability,
      potentialImpact,
      riskFactors,
      mitigationStrategies,
      riskLevel,
    };
  }

  assessNetworkRisk(): {
    overallRisk: number;
    criticalNodes: string[];
    highRiskConnections: string[];
    riskDistribution: Record<string, number>;
    recommendations: string[];
  } {
    const criticalNodes: string[] = [];
    const highRiskConnections: string[] = [];
    const riskDistribution: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    const recommendations: string[] = [];

    for (const [nodeId, features] of Array.from(this.nodeFeatures.entries())) {
      const risk = this.predictDisruption(nodeId);
      riskDistribution[risk.riskLevel]++;

      if (risk.riskLevel === 'critical' || risk.riskLevel === 'high') {
        criticalNodes.push(nodeId);
        recommendations.push(...risk.mitigationStrategies.slice(0, 2));
      }
    }

    for (const [connId, edgeFeat] of Array.from(this.edgeFeatures.entries())) {
      if (edgeFeat.reliability < 0.5 || edgeFeat.flowUtilization > 0.9) {
        highRiskConnections.push(connId);
      }
    }

    const totalNodes = this.nodes.size;
    const overallRisk = totalNodes > 0
      ? (riskDistribution.critical * 1 + riskDistribution.high * 0.7 + riskDistribution.medium * 0.3) / totalNodes
      : 0;

    return {
      overallRisk,
      criticalNodes,
      highRiskConnections,
      riskDistribution,
      recommendations: [...new Set(recommendations)].slice(0, 10),
    };
  }

  generateAlerts(): SupplyChainAlert[] {
    const newAlerts: SupplyChainAlert[] = [];

    const bottlenecks = this.analyzeAdvancedBottlenecks();
    for (const bottleneck of bottlenecks.slice(0, 5)) {
      const existingAlert = this.alerts.find(a => 
        a.type === AlertType.BOTTLENECK_DETECTED && 
        a.nodeIds.includes(bottleneck.nodeId) &&
        !a.acknowledged
      );

      if (!existingAlert) {
        newAlerts.push({
          id: crypto.randomUUID(),
          type: AlertType.BOTTLENECK_DETECTED,
          level: bottleneck.severity > 0.8 ? AlertLevel.CRITICAL : AlertLevel.WARNING,
          nodeIds: [bottleneck.nodeId],
          connectionIds: [],
          message: `检测到${bottleneck.type}类型瓶颈，严重度: ${(bottleneck.severity * 100).toFixed(0)}%`,
          timestamp: this.currentTime,
          estimatedImpact: bottleneck.impactScope,
          recommendedActions: bottleneck.recommendations,
          acknowledged: false,
          autoFixAvailable: bottleneck.type === 'capacity' || bottleneck.type === 'flow',
        });
      }
    }

    for (const [nodeId, features] of Array.from(this.nodeFeatures.entries())) {
      if (features.riskScore > this.alertConfig.riskThreshold) {
        const existingAlert = this.alerts.find(a =>
          a.type === AlertType.HIGH_RISK_NODE &&
          a.nodeIds.includes(nodeId) &&
          !a.acknowledged
        );

        if (!existingAlert) {
          const risk = this.predictDisruption(nodeId);
          newAlerts.push({
            id: crypto.randomUUID(),
            type: AlertType.HIGH_RISK_NODE,
            level: risk.riskLevel === 'critical' ? AlertLevel.EMERGENCY : AlertLevel.CRITICAL,
            nodeIds: [nodeId],
            connectionIds: [],
            message: `高风险节点: 中断概率 ${(risk.probability * 100).toFixed(0)}%`,
            timestamp: this.currentTime,
            estimatedImpact: risk.potentialImpact,
            recommendedActions: risk.mitigationStrategies,
            acknowledged: false,
            autoFixAvailable: false,
          });
        }
      }

      if (features.inventoryLevel < this.alertConfig.inventoryWarningThreshold) {
        const existingAlert = this.alerts.find(a =>
          a.type === AlertType.INVENTORY_SHORTAGE &&
          a.nodeIds.includes(nodeId) &&
          !a.acknowledged
        );

        if (!existingAlert) {
          newAlerts.push({
            id: crypto.randomUUID(),
            type: AlertType.INVENTORY_SHORTAGE,
            level: AlertLevel.WARNING,
            nodeIds: [nodeId],
            connectionIds: [],
            message: `库存不足: 当前库存 ${features.inventoryLevel.toFixed(0)}`,
            timestamp: this.currentTime,
            estimatedImpact: features.centralityScore,
            recommendedActions: ['立即补货', '启动备用供应商', '调整生产计划'],
            acknowledged: false,
            autoFixAvailable: true,
          });
        }
      }
    }

    for (const [connId, edgeFeat] of Array.from(this.edgeFeatures.entries())) {
      if (edgeFeat.flowUtilization > this.alertConfig.utilizationHighThreshold) {
        const existingAlert = this.alerts.find(a =>
          a.type === AlertType.FLOW_IMBALANCE &&
          a.connectionIds.includes(connId) &&
          !a.acknowledged
        );

        if (!existingAlert) {
          newAlerts.push({
            id: crypto.randomUUID(),
            type: AlertType.FLOW_IMBALANCE,
            level: AlertLevel.WARNING,
            nodeIds: [edgeFeat.sourceId, edgeFeat.targetId],
            connectionIds: [connId],
            message: `流量过载: 利用率 ${(edgeFeat.flowUtilization * 100).toFixed(0)}%`,
            timestamp: this.currentTime,
            estimatedImpact: edgeFeat.flowUtilization,
            recommendedActions: ['增加通道容量', '分流至备用路径', '优化调度策略'],
            acknowledged: false,
            autoFixAvailable: true,
          });
        }
      }
    }

    for (const disruption of this.disruptions.filter(d => d.recoveryProgress < 1)) {
      if (disruption.cascadeDepth > 2) {
        const existingAlert = this.alerts.find(a =>
          a.type === AlertType.DISRUPTION_PROPAGATION &&
          a.nodeIds.includes(disruption.sourceNodeId) &&
          !a.acknowledged
        );

        if (!existingAlert) {
          newAlerts.push({
            id: crypto.randomUUID(),
            type: AlertType.DISRUPTION_PROPAGATION,
            level: AlertLevel.EMERGENCY,
            nodeIds: disruption.affectedNodes,
            connectionIds: disruption.affectedConnections,
            message: `中断传播: 影响 ${disruption.affectedNodes.length} 个节点`,
            timestamp: this.currentTime,
            estimatedImpact: disruption.economicLoss,
            recommendedActions: ['隔离受影响区域', '启动应急预案', '优先恢复关键节点'],
            acknowledged: false,
            autoFixAvailable: false,
          });
        }
      }
    }

    this.alerts = [...this.alerts.filter(a => !a.acknowledged), ...newAlerts];
    return this.alerts;
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  getActiveAlerts(): SupplyChainAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  generateNetworkHealthReport(): NetworkHealthReport {
    const resilienceScores = Array.from(this.nodeFeatures.values()).map(f => f.resilience);
    const avgResilience = resilienceScores.length > 0
      ? resilienceScores.reduce((sum, r) => sum + r, 0) / resilienceScores.length
      : 0;

    const efficiencyScores = Array.from(this.edgeFeatures.values()).map(f => f.transportEfficiency);
    const avgEfficiency = efficiencyScores.length > 0
      ? efficiencyScores.reduce((sum, e) => sum + e, 0) / efficiencyScores.length
      : 0;

    const riskAssessment = this.assessNetworkRisk();
    const avgConnectivity = this.nodes.size > 0
      ? Array.from(this.nodeFeatures.values()).reduce((sum, f) => sum + f.connectivity, 0) / this.nodes.size
      : 0;

    const overallScore = (
      avgResilience * 30 +
      avgEfficiency * 25 +
      (1 - riskAssessment.overallRisk) * 25 +
      Math.min(avgConnectivity / 5, 1) * 20
    );

    this.healthHistory.push(overallScore);
    if (this.healthHistory.length > 10) {
      this.healthHistory.shift();
    }

    let trendPrediction: 'improving' | 'stable' | 'declining' = 'stable';
    if (this.healthHistory.length >= 3) {
      const recent = this.healthHistory.slice(-3);
      const trend = recent[2] - recent[0];
      if (trend > 5) trendPrediction = 'improving';
      else if (trend < -5) trendPrediction = 'declining';
    }

    const criticalIssues: string[] = [];
    const improvementSuggestions: string[] = [];

    if (avgResilience < 0.5) {
      criticalIssues.push('网络韧性不足');
      improvementSuggestions.push('增加冗余节点和备用路径');
    }
    if (riskAssessment.overallRisk > 0.5) {
      criticalIssues.push('整体风险水平偏高');
      improvementSuggestions.push('优先处理高风险节点');
    }
    if (avgEfficiency < 0.7) {
      criticalIssues.push('运输效率低下');
      improvementSuggestions.push('优化运输路线和调度策略');
    }

    improvementSuggestions.push(...riskAssessment.recommendations.slice(0, 3));

    return {
      overallScore,
      resilienceScore: avgResilience * 100,
      efficiencyScore: avgEfficiency * 100,
      riskScore: riskAssessment.overallRisk * 100,
      connectivityScore: Math.min(avgConnectivity / 5, 1) * 100,
      criticalIssues,
      improvementSuggestions,
      trendPrediction,
    };
  }

  analyzeCascadeImpact(sourceNodeId: string): CascadeImpactAnalysis {
    const visited = new Set<string>();
    const directImpact: string[] = [];
    const secondaryImpact: string[] = [];
    const criticalPaths: string[][] = [];

    const sourceNode = this.nodes.get(sourceNodeId);
    if (!sourceNode) {
      return {
        sourceNodeId,
        directImpact: [],
        secondaryImpact: [],
        totalAffectedNodes: 0,
        estimatedLoss: 0,
        estimatedRecoveryTime: 0,
        criticalPaths: [],
      };
    }

    for (const conn of sourceNode.outputs) {
      if (!directImpact.includes(conn.targetId)) {
        directImpact.push(conn.targetId);
      }
    }

    for (const directNodeId of directImpact) {
      const directNode = this.nodes.get(directNodeId);
      if (directNode) {
        for (const conn of directNode.outputs) {
          if (!directImpact.includes(conn.targetId) && !secondaryImpact.includes(conn.targetId)) {
            secondaryImpact.push(conn.targetId);
          }
        }
      }
    }

    const allAffected = [sourceNodeId, ...directImpact, ...secondaryImpact];
    
    let estimatedLoss = 0;
    for (const nodeId of allAffected) {
      const features = this.nodeFeatures.get(nodeId);
      const node = this.nodes.get(nodeId);
      if (features && node) {
        const inventoryValue = Object.values(node.inventory).reduce((sum, v) => sum + v, 0);
        estimatedLoss += inventoryValue * features.centralityScore;
      }
    }

    const avgResilience = allAffected.reduce((sum, nodeId) => {
      const features = this.nodeFeatures.get(nodeId);
      return sum + (features?.resilience || 0.5);
    }, 0) / Math.max(allAffected.length, 1);

    const estimatedRecoveryTime = allAffected.length * 5 * (1 - avgResilience * 0.5);

    for (const targetId of directImpact) {
      const paths = this.findAllPaths(sourceNodeId, targetId);
      if (paths.length > 0) {
        criticalPaths.push(paths[0]);
      }
    }

    return {
      sourceNodeId,
      directImpact,
      secondaryImpact,
      totalAffectedNodes: allAffected.length,
      estimatedLoss,
      estimatedRecoveryTime,
      criticalPaths: criticalPaths.slice(0, 5),
    };
  }

  private generateMitigationStrategies(riskFactors: string[]): string[] {
    const strategies: string[] = [];
    
    for (const factor of riskFactors) {
      if (factor.includes('产能')) {
        strategies.push('扩建设施容量');
        strategies.push('优化生产调度');
      }
      if (factor.includes('库存')) {
        strategies.push('建立安全库存');
        strategies.push('多元化供应商');
      }
      if (factor.includes('连接')) {
        strategies.push('建立备用路径');
        strategies.push('增加网络冗余');
      }
      if (factor.includes('恢复')) {
        strategies.push('制定应急预案');
        strategies.push('储备关键资源');
      }
      if (factor.includes('中断')) {
        strategies.push('优先处理现有中断');
        strategies.push('隔离受影响区域');
      }
    }
    
    return Array.from(new Set(strategies));
  }

  optimizeFlow(): FlowOptimization[] {
    const optimizations: FlowOptimization[] = [];
    
    for (const [connId, conn] of Array.from(this.connections.entries())) {
      const edgeFeat = this.edgeFeatures.get(connId);
      const sourceFeatures = this.nodeFeatures.get(conn.sourceId);
      const targetFeatures = this.nodeFeatures.get(conn.targetId);
      
      if (!edgeFeat || !sourceFeatures || !targetFeatures) continue;
      
      let optimizedFlow = conn.currentFlow;
      
      if (edgeFeat.flowUtilization > 0.8) {
        optimizedFlow = conn.maxFlow * 0.9;
      } else if (edgeFeat.flowUtilization < 0.3 && sourceFeatures.inventoryLevel > 100) {
        optimizedFlow = Math.min(conn.maxFlow * 0.7, sourceFeatures.inventoryLevel * 0.5);
      }
      
      if (edgeFeat.alternativePaths > 0 && edgeFeat.reliability < 0.7) {
        optimizedFlow *= 0.8;
      }
      
      const efficiencyGain = Math.abs(optimizedFlow - conn.currentFlow) / Math.max(conn.currentFlow, 1);
      const costSaving = Math.abs(optimizedFlow - conn.currentFlow) * conn.transportCost;
      
      if (efficiencyGain > 0.05) {
        optimizations.push({
          connectionId: connId,
          currentFlow: conn.currentFlow,
          optimizedFlow,
          efficiencyGain,
          costSaving,
        });
      }
    }
    
    return optimizations.sort((a, b) => b.efficiencyGain - a.efficiencyGain);
  }

  simulateDisruption(sourceNodeId: string, severity: number, type: DisruptionType = DisruptionType.FACILITY_FAILURE): SupplyChainDisruption {
    const disruption: SupplyChainDisruption = {
      id: crypto.randomUUID(),
      type,
      sourceNodeId,
      severity: Math.max(0, Math.min(1, severity)),
      startTime: this.currentTime,
      duration: this.estimateDisruptionDuration(severity, type),
      affectedNodes: [],
      affectedConnections: [],
      cascadeDepth: 0,
      recoveryProgress: 0,
      estimatedRecoveryTime: 0,
      economicLoss: 0,
    };
    
    this.propagateDisruption(disruption);
    
    disruption.estimatedRecoveryTime = this.estimateRecoveryTime(disruption);
    disruption.economicLoss = this.calculateEconomicLoss(disruption);
    
    this.disruptions.push(disruption);
    
    this.computeRiskScores();
    
    return disruption;
  }

  private estimateDisruptionDuration(severity: number, type: DisruptionType): number {
    const baseDurations: Record<DisruptionType, number> = {
      [DisruptionType.FACILITY_FAILURE]: 10,
      [DisruptionType.RESOURCE_SHORTAGE]: 15,
      [DisruptionType.TRANSPORT_DISRUPTION]: 8,
      [DisruptionType.LABOR_SHORTAGE]: 20,
      [DisruptionType.NATURAL_DISASTER]: 30,
      [DisruptionType.EXTERNAL_SHOCK]: 25,
    };
    
    return baseDurations[type] * severity;
  }

  private propagateDisruption(disruption: SupplyChainDisruption): void {
    const visited = new Set<string>();
    const queue: { nodeId: string; depth: number; impact: number }[] = [
      { nodeId: disruption.sourceNodeId, depth: 0, impact: disruption.severity }
    ];
    
    while (queue.length > 0) {
      const { nodeId, depth, impact } = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      disruption.affectedNodes.push(nodeId);
      disruption.cascadeDepth = Math.max(disruption.cascadeDepth, depth);
      
      const node = this.nodes.get(nodeId);
      if (!node) continue;
      
      const features = this.nodeFeatures.get(nodeId);
      const resilience = features?.resilience || 0.5;
      
      for (const conn of node.outputs) {
        disruption.affectedConnections.push(conn.id);
        
        const targetFeatures = this.nodeFeatures.get(conn.targetId);
        const targetResilience = targetFeatures?.resilience || 0.5;
        const propagatedImpact = impact * (1 - resilience * 0.5) * (1 - targetResilience * 0.3);
        
        if (propagatedImpact > 0.1 && depth < 5) {
          queue.push({
            nodeId: conn.targetId,
            depth: depth + 1,
            impact: propagatedImpact,
          });
        }
      }
      
      for (const conn of node.inputs) {
        if (!disruption.affectedConnections.includes(conn.id)) {
          disruption.affectedConnections.push(conn.id);
        }
      }
    }
  }

  private estimateRecoveryTime(disruption: SupplyChainDisruption): number {
    let baseTime = disruption.duration;
    
    for (const nodeId of disruption.affectedNodes) {
      const features = this.nodeFeatures.get(nodeId);
      if (features) {
        baseTime *= (1 - features.resilience * 0.3);
      }
    }
    
    const avgResilience = disruption.affectedNodes.reduce((sum, nodeId) => {
      const features = this.nodeFeatures.get(nodeId);
      return sum + (features?.resilience || 0.5);
    }, 0) / Math.max(disruption.affectedNodes.length, 1);
    
    baseTime *= (1 - avgResilience * 0.2);
    
    return Math.max(baseTime, disruption.duration * 0.5);
  }

  private calculateEconomicLoss(disruption: SupplyChainDisruption): number {
    let loss = 0;
    
    for (const nodeId of disruption.affectedNodes) {
      const features = this.nodeFeatures.get(nodeId);
      const node = this.nodes.get(nodeId);
      
      if (features && node) {
        const inventoryValue = Object.values(node.inventory).reduce((sum, v) => sum + v, 0);
        loss += inventoryValue * disruption.severity * features.centralityScore;
      }
    }
    
    for (const connId of disruption.affectedConnections) {
      const conn = this.connections.get(connId);
      if (conn) {
        loss += conn.currentFlow * disruption.severity * disruption.duration;
      }
    }
    
    return loss;
  }

  getActiveDisruptions(): SupplyChainDisruption[] {
    return this.disruptions.filter(d => d.recoveryProgress < 1);
  }

  updateDisruptionRecovery(dt: number): void {
    for (const disruption of this.disruptions) {
      if (disruption.recoveryProgress >= 1) continue;
      
      const recoveryRate = 1 / Math.max(disruption.estimatedRecoveryTime, 1);
      disruption.recoveryProgress = Math.min(1, disruption.recoveryProgress + recoveryRate * dt);
      
      if (disruption.recoveryProgress >= 1) {
        this.cleanupDisruption(disruption);
      }
    }
    
    this.computeRiskScores();
  }

  private cleanupDisruption(disruption: SupplyChainDisruption): void {
    const index = this.disruptions.indexOf(disruption);
    if (index > -1) {
      this.disruptions.splice(index, 1);
    }
  }

  getVisualizationData(): SupplyChainVisualizationData {
    const nodes = Array.from(this.nodes.values()).map(node => {
      const features = this.nodeFeatures.get(node.id);
      const risk = this.predictDisruption(node.id);
      const bottleneckScore = this.calculateBottleneckScore(node.id, features || {} as GNNNodeFeatures);
      
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        inventory: node.inventory as Record<string, number>,
        status: node.facility?.status || 'idle',
        riskLevel: risk.riskLevel,
        centrality: features?.centralityScore || 0,
        bottleneckScore: bottleneckScore.total,
        resilienceScore: features?.resilience || 0,
      };
    });
    
    const connections = Array.from(this.connections.values()).map(conn => {
      const edgeFeat = this.edgeFeatures.get(conn.id);
      return {
        id: conn.id,
        source: conn.sourceId,
        target: conn.targetId,
        resource: conn.resource,
        currentFlow: conn.currentFlow,
        maxFlow: conn.maxFlow,
        utilization: conn.maxFlow > 0 ? conn.currentFlow / conn.maxFlow : 0,
        reliability: edgeFeat?.reliability || 0.9,
      };
    });
    
    const flowData = Array.from(this.connections.values()).map(conn => {
      const edgeFeat = this.edgeFeatures.get(conn.id);
      return {
        connectionId: conn.id,
        flowRate: conn.currentFlow,
        efficiency: edgeFeat?.transportEfficiency || 0.95,
      };
    });
    
    const bottlenecks = this.analyzeBottlenecks();
    const riskNodes = Array.from(this.nodeFeatures.values()).filter(f => f.riskScore > 0.5);
    const healthReport = this.generateNetworkHealthReport();
    const activeAlerts = this.getActiveAlerts();
    
    const avgResilience = Array.from(this.nodeFeatures.values())
      .reduce((sum, f) => sum + f.resilience, 0) / Math.max(this.nodeFeatures.size, 1);
    
    return {
      nodes,
      connections,
      flowData,
      statistics: {
        totalNodes: nodes.length,
        totalConnections: connections.length,
        averageUtilization: connections.reduce((sum, c) => sum + c.utilization, 0) / Math.max(connections.length, 1),
        bottleneckCount: bottlenecks.length,
        riskNodes: riskNodes.length,
        averageResilience: avgResilience,
        networkHealthScore: healthReport.overallScore,
      },
      activeDisruptions: this.getActiveDisruptions(),
      activeAlerts,
      healthReport,
    };
  }

  getNodeFeatures(nodeId: string): GNNNodeFeatures | undefined {
    return this.nodeFeatures.get(nodeId);
  }

  getEdgeFeatures(edgeId: string): GNNEdgeFeatures | undefined {
    return this.edgeFeatures.get(edgeId);
  }

  getNodeEmbedding(nodeId: string): number[] | undefined {
    return this.nodeEmbeddings.get(nodeId);
  }

  setCurrentTime(time: number): void {
    this.currentTime = time;
  }
}

/** 供应链类 */
export class SupplyChain {
  private nodes: Map<string, SupplyChainNode> = new Map();
  private connections: Map<string, SupplyChainConnection> = new Map();
  private globalResources: Record<ResourceType, number> = this.initResources();
  private productionQueue: ProductionFacility[] = [];
  public readonly gnn: SupplyChainGNN;
  public readonly socialGNN: GraphNeuralNetwork;
  private simulationTime: number = 0;
  private gnnSyncInterval: number = 0;
  private readonly GNN_SYNC_PERIOD: number = 5;

  constructor() {
    this.gnn = new SupplyChainGNN();
    this.socialGNN = new GraphNeuralNetwork();
    this.initializeSupplyChain();
  }

  /**
   * 初始化资源
   */
  private initResources(): Record<ResourceType, number> {
    return {
      [ResourceType.BIOMASS]: 1000,
      [ResourceType.CORE_ENERGY]: 500,
      [ResourceType.INFORMATION]: 100,
      [ResourceType.ENTROPY]: 50,
      [ResourceType.RAW_MATERIALS]: 500,
      [ResourceType.SEMI_FINISHED]: 200,
      [ResourceType.FINISHED_GOODS]: 50,
      [ResourceType.KNOWLEDGE]: 50,
      [ResourceType.ENTROPY_CRYSTAL]: 10,
      [ResourceType.QUANTUM_BIT]: 5,
    };
  }

  /**
   * 初始化供应链
   */
  private initializeSupplyChain(): void {
    // 创建初始产业节点
    const extractionNode = this.createNode('extraction', '采集中心', { x: 0, y: 0, z: 0 });
    const processingNode = this.createNode('processing', '加工中心', { x: 100, y: 0, z: 0 });
    const distributionNode = this.createNode('distribution', '分配中心', { x: 200, y: 0, z: 0 });

    // 创建初始设施
    const farm = this.createFacility('生物农场', IndustryType.EXTRACTION, { x: 0, y: 0, z: 0 });
    const factory = this.createFacility('材料工厂', IndustryType.PROCESSING, { x: 100, y: 0, z: 0 });
    const workshop = this.createFacility('制作工坊', IndustryType.MANUFACTURING, { x: 150, y: 50, z: 0 });

    // 连接节点
    this.connect(extractionNode.id, processingNode.id, ResourceType.BIOMASS, 100);
    this.connect(processingNode.id, distributionNode.id, ResourceType.SEMI_FINISHED, 80);
  }

  /**
   * 创建供应链节点
   */
  public createNode(
    type: SupplyChainNode['type'],
    name: string,
    position: { x: number; y: number; z: number }
  ): SupplyChainNode {
    const node: SupplyChainNode = {
      id: crypto.randomUUID(),
      type,
      facility: undefined,
      inputs: [],
      outputs: [],
      inventory: { ...this.initResources() },
      position,
    };
    this.nodes.set(node.id, node);
    return node;
  }

  /**
   * 创建生产设施
   */
  public createFacility(
    name: string,
    industry: IndustryType,
    position: { x: number; y: number; z: number }
  ): ProductionFacility {
    const facility: ProductionFacility = {
      id: crypto.randomUUID(),
      name,
      industry,
      level: 1,
      maxCapacity: 100,
      currentOutput: 0,
      efficiency: 0.8,
      workers: 10,
      maxWorkers: 50,
      energyConsumption: 10,
      inputRequirements: [],
      outputs: [],
      position,
      status: 'running',
      upgradeCost: {
        [ResourceType.BIOMASS]: 100,
        [ResourceType.CORE_ENERGY]: 50,
        [ResourceType.INFORMATION]: 20,
        [ResourceType.ENTROPY]: 10,
        [ResourceType.RAW_MATERIALS]: 100,
        [ResourceType.SEMI_FINISHED]: 50,
        [ResourceType.FINISHED_GOODS]: 20,
        [ResourceType.KNOWLEDGE]: 30,
        [ResourceType.ENTROPY_CRYSTAL]: 5,
        [ResourceType.QUANTUM_BIT]: 2,
      },
    };
    this.productionQueue.push(facility);
    return facility;
  }

  /**
   * 连接供应链节点
   */
  public connect(
    sourceId: string,
    targetId: string,
    resource: ResourceType,
    maxFlow: number
  ): SupplyChainConnection | null {
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);
    if (!source || !target) return null;

    const connection: SupplyChainConnection = {
      id: crypto.randomUUID(),
      sourceId,
      targetId,
      resource,
      maxFlow,
      currentFlow: 0,
      transportCost: 0.05,
    };

    this.connections.set(connection.id, connection);
    source.outputs.push(connection);
    target.inputs.push(connection);

    return connection;
  }

  /**
   * 模拟生产周期
   */
  public simulateProductionCycle(dt: number): void {
    this.simulationTime += dt;

    for (const facility of this.productionQueue) {
      if (facility.status === 'running') {
        this.updateFacility(facility, dt);
      }
    }

    for (const connection of Array.from(this.connections.values())) {
      this.transferResource(connection, dt);
    }

    for (const node of Array.from(this.nodes.values())) {
      this.updateNodeInventory(node, dt);
    }

    this.gnn.setCurrentTime(this.simulationTime);
    this.gnn.buildGraph(
      Array.from(this.nodes.values()),
      Array.from(this.connections.values())
    );

    this.gnn.updateDisruptionRecovery(dt);

    this.gnnSyncInterval += dt;
    if (this.gnnSyncInterval >= this.GNN_SYNC_PERIOD) {
      this.gnnSyncInterval = 0;
      this.syncToSocialGNN();
    }
  }

  /**
   * 同步到SocialGNN进行分析
   */
  private syncToSocialGNN(): void {
    this.socialGNN.clear();

    for (const [nodeId, node] of this.nodes) {
      const nodeType = this.mapNodeType(node.type);
      const inventoryValues = Object.values(node.inventory) as number[];
      const totalInventory = inventoryValues.reduce((sum: number, v: number) => sum + v, 0);
      const maxCap = node.maxCapacity || 1000;
      
      const features: SupplyChainNodeFeatures = {
        nodeType,
        capacity: maxCap,
        currentLoad: totalInventory / maxCap,
        efficiency: node.facility?.efficiency || 0.8,
        reliability: 1 - (this.gnn.getNodeFeatures(nodeId)?.riskScore || 0),
        inventoryLevel: totalInventory,
        throughput: node.outputs.reduce((sum, c) => sum + c.currentFlow, 0),
        leadTime: this.calculateNodeLeadTime(node),
        cost: this.calculateNodeCost(node),
        riskScore: this.gnn.getNodeFeatures(nodeId)?.riskScore || 0,
      };

      this.socialGNN.addSupplyChainNode(nodeId, features);
    }

    for (const conn of Array.from(this.connections.values())) {
      const edgeFeatures: SupplyChainEdgeFeatures = {
        edgeType: this.mapEdgeType(conn.resource),
        flowRate: conn.currentFlow,
        maxCapacity: conn.maxFlow,
        transportCost: conn.transportCost,
        leadTime: this.calculateEdgeLeadTime(conn),
        reliability: this.gnn.getEdgeFeatures(conn.id)?.reliability || 0.9,
        distance: this.calculateDistance(conn),
      };

      this.socialGNN.addSupplyChainEdge(conn.sourceId, conn.targetId, edgeFeatures);
    }

    this.socialGNN.messagePassing(3);
  }

  /**
   * 映射节点类型
   */
  private mapNodeType(type: SupplyChainNode['type']): SupplyChainNodeType {
    const typeMap: Record<string, SupplyChainNodeType> = {
      'extraction': SupplyChainNodeType.SUPPLIER,
      'processing': SupplyChainNodeType.PRODUCER,
      'distribution': SupplyChainNodeType.DISTRIBUTOR,
      'consumption': SupplyChainNodeType.CONSUMER,
    };
    return typeMap[type] || SupplyChainNodeType.PRODUCER;
  }

  /**
   * 映射边类型
   */
  private mapEdgeType(resource: ResourceType): SupplyChainEdgeType {
    if (resource === ResourceType.RAW_MATERIALS || resource === ResourceType.BIOMASS) {
      return SupplyChainEdgeType.SUPPLY;
    }
    if (resource === ResourceType.SEMI_FINISHED) {
      return SupplyChainEdgeType.TRANSPORT;
    }
    if (resource === ResourceType.FINISHED_GOODS) {
      return SupplyChainEdgeType.DISTRIBUTION;
    }
    return SupplyChainEdgeType.SUPPLY;
  }

  /**
   * 计算节点交付时间
   */
  private calculateNodeLeadTime(node: SupplyChainNode): number {
    const baseLeadTime = 5;
    const efficiencyFactor = node.facility ? (1 - node.facility.efficiency) * 10 : 0;
    const loadFactor = node.maxCapacity 
      ? Math.max(0, (Object.values(node.inventory).reduce((s, v) => s + (v as number), 0) / node.maxCapacity - 0.7) * 5)
      : 0;
    return baseLeadTime + efficiencyFactor + loadFactor;
  }

  /**
   * 计算节点成本
   */
  private calculateNodeCost(node: SupplyChainNode): number {
    const facilityCost = node.facility ? node.facility.energyConsumption * 2 : 10;
    const laborCost = node.facility ? node.facility.workers * 0.5 : 5;
    return facilityCost + laborCost;
  }

  /**
   * 计算边交付时间
   */
  private calculateEdgeLeadTime(conn: SupplyChainConnection): number {
    const baseTime = 3;
    const congestionFactor = conn.maxFlow > 0 
      ? Math.max(0, (conn.currentFlow / conn.maxFlow - 0.5) * 4)
      : 0;
    return baseTime + congestionFactor;
  }

  /**
   * 计算边距离
   */
  private calculateDistance(conn: SupplyChainConnection): number {
    const source = this.nodes.get(conn.sourceId);
    const target = this.nodes.get(conn.targetId);
    if (!source || !target) return 100;

    const dx = source.position.x - target.position.x;
    const dy = source.position.y - target.position.y;
    const dz = source.position.z - target.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 更新设施
   */
  private updateFacility(facility: ProductionFacility, dt: number): void {
    // 计算效率
    const workerEfficiency = facility.workers / facility.maxWorkers;
    const energyFactor = this.globalResources[ResourceType.CORE_ENERGY] > facility.energyConsumption ? 1 : 0.5;

    facility.efficiency = 0.5 + 0.5 * workerEfficiency * energyFactor;

    // 计算产量
    facility.currentOutput = facility.maxCapacity * facility.efficiency * facility.level * dt;

    // 消耗能源
    this.globalResources[ResourceType.CORE_ENERGY] -= facility.energyConsumption * dt;

    // 产出资源
    for (const output of facility.outputs) {
      this.globalResources[output.resource] += facility.currentOutput * output.quality;
    }
  }

  /**
   * 传输资源
   */
  private transferResource(connection: SupplyChainConnection, dt: number): void {
    const source = this.nodes.get(connection.sourceId);
    const target = this.nodes.get(connection.targetId);
    if (!source || !target) return;

    const available = source.inventory[connection.resource];
    const demand = target.maxCapacity - target.inventory[connection.resource];

    if (available > 0 && demand > 0) {
      const flow = Math.min(available, connection.maxFlow, demand) * dt;
      connection.currentFlow = flow;

      source.inventory[connection.resource] -= flow;
      target.inventory[connection.resource] += flow * (1 - connection.transportCost);
    } else {
      connection.currentFlow = 0;
    }
  }

  /**
   * 更新节点库存
   */
  private updateNodeInventory(node: SupplyChainNode, dt: number): void {
    // 简单的库存衰减
    for (const resource of Object.keys(node.inventory) as ResourceType[]) {
      if (node.inventory[resource] > node.maxCapacity * 0.1) {
        node.inventory[resource] *= 0.99;
      }
    }
  }

  /**
   * 获取全局资源
   */
  public getGlobalResources(): Record<ResourceType, number> {
    return { ...this.globalResources };
  }

  /**
   * 获取节点
   */
  public getNode(nodeId: string): SupplyChainNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * 获取所有节点
   */
  public getAllNodes(): SupplyChainNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * 获取所有设施
   */
  public getAllFacilities(): ProductionFacility[] {
    return [...this.productionQueue];
  }

  /**
   * 获取供应链统计
   */
  public getStats(): {
    totalOutput: number;
    totalInput: number;
    efficiency: number;
    bottleneck: string | null;
  } {
    let totalOutput = 0;
    let totalInput = 0;

    for (const facility of this.productionQueue) {
      totalOutput += facility.currentOutput;
      totalInput += facility.energyConsumption;
    }

    const efficiency = this.productionQueue.length > 0
      ? this.productionQueue.reduce((sum, f) => sum + f.efficiency, 0) / this.productionQueue.length
      : 0;

    return {
      totalOutput,
      totalInput,
      efficiency,
      bottleneck: this.findBottleneck(),
    };
  }

  /**
   * 找出瓶颈
   */
  private findBottleneck(): string | null {
    let maxLoad = 0;
    let bottleneckId: string | null = null;

    for (const connection of Array.from(this.connections.values())) {
      const load = connection.currentFlow / connection.maxFlow;
      if (load > maxLoad) {
        maxLoad = load;
        bottleneckId = connection.id;
      }
    }

    return maxLoad > 0.8 ? bottleneckId : null;
  }

  /**
   * 优化供应链
   */
  public optimize(): void {
    // 1. 找出瓶颈并增加产能
    const bottleneck = this.findBottleneck();
    if (bottleneck) {
      const connection = this.connections.get(bottleneck);
      if (connection) {
        connection.maxFlow *= 1.2;
      }
    }

    // 2. 平衡产能
    const avgOutput = this.productionQueue.reduce((sum, f) => sum + f.currentOutput, 0) / this.productionQueue.length;
    for (const facility of this.productionQueue) {
      if (facility.currentOutput < avgOutput * 0.5) {
        // 产能不足，增加投入
        facility.maxCapacity *= 1.1;
      }
    }
  }

  /**
   * 添加资源
   */
  public addResource(resource: ResourceType, amount: number): void {
    this.globalResources[resource] += amount;
  }

  /**
   * 消耗资源
   */
  public consumeResource(resource: ResourceType, amount: number): boolean {
    if (this.globalResources[resource] >= amount) {
      this.globalResources[resource] -= amount;
      return true;
    }
    return false;
  }

  /**
   * 获取供应链可视化数据
   */
  public getSupplyChainVisualizationData(): SupplyChainVisualizationData {
    return this.gnn.getVisualizationData();
  }

  /**
   * 模拟供应链中断
   */
  public simulateDisruption(
    sourceNodeId: string,
    severity: number,
    type: DisruptionType = DisruptionType.FACILITY_FAILURE
  ): SupplyChainDisruption | null {
    const node = this.nodes.get(sourceNodeId);
    if (!node) return null;

    this.gnn.buildGraph(
      Array.from(this.nodes.values()),
      Array.from(this.connections.values())
    );

    return this.gnn.simulateDisruption(sourceNodeId, severity, type);
  }

  /**
   * 获取瓶颈分析
   */
  public getBottleneckAnalysis(): BottleneckAnalysis[] {
    return this.gnn.analyzeBottlenecks();
  }

  /**
   * 获取节点中断风险预测
   */
  public getNodeDisruptionRisk(nodeId: string): DisruptionRisk {
    return this.gnn.predictDisruption(nodeId);
  }

  /**
   * 获取流量优化建议
   */
  public getFlowOptimizations(): FlowOptimization[] {
    return this.gnn.optimizeFlow();
  }

  /**
   * 获取活跃中断事件
   */
  public getActiveDisruptions(): SupplyChainDisruption[] {
    return this.gnn.getActiveDisruptions();
  }

  /**
   * 获取所有连接
   */
  public getAllConnections(): SupplyChainConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * 获取SocialGNN瓶颈检测
   */
  public getSocialGNNBottlenecks(): Array<{
    nodeId: string;
    bottleneckType: 'capacity' | 'flow' | 'reliability' | 'lead_time';
    severity: number;
    impact: number;
    recommendations: string[];
  }> {
    return this.socialGNN.detectSupplyChainBottlenecks();
  }

  /**
   * 获取供应链网络韧性分析
   */
  public getResilienceAnalysis(): {
    overallResilience: number;
    criticalNodes: string[];
    redundantPaths: Map<string, number>;
    vulnerabilityScore: number;
  } {
    return this.socialGNN.analyzeSupplyChainResilience();
  }

  /**
   * 获取供应链流量优化建议
   */
  getSupplyChainFlowOptimizations(): Array<{
    edgeSource: string;
    edgeTarget: string;
    currentFlow: number;
    optimizedFlow: number;
    improvement: number;
  }> {
    return this.socialGNN.optimizeSupplyChainFlow();
  }

  /**
   * 预测中断传播
   */
  public predictDisruptionSpread(
    sourceNodeId: string,
    severity: number = 0.8
  ): Map<string, { probability: number; impactLevel: number; timeToReach: number }> {
    return this.socialGNN.predictDisruptionPropagation(sourceNodeId, severity);
  }

  /**
   * 获取供应链网络统计
   */
  public getSupplyChainNetworkStats(): {
    nodeCount: number;
    edgeCount: number;
    avgReliability: number;
    avgLeadTime: number;
    totalCapacity: number;
    totalThroughput: number;
    nodeTypeDistribution: Record<SupplyChainNodeType, number>;
  } {
    return this.socialGNN.getSupplyChainStats();
  }

  /**
   * 获取高级瓶颈分析
   */
  public getAdvancedBottleneckAnalysis(): BottleneckAnalysis[] {
    return this.gnn.analyzeAdvancedBottlenecks();
  }

  /**
   * 获取网络风险评估
   */
  public getNetworkRiskAssessment(): {
    overallRisk: number;
    criticalNodes: string[];
    highRiskConnections: string[];
    riskDistribution: Record<string, number>;
    recommendations: string[];
  } {
    return this.gnn.assessNetworkRisk();
  }

  /**
   * 获取活跃预警
   */
  public getSupplyChainAlerts(): SupplyChainAlert[] {
    return this.gnn.generateAlerts();
  }

  /**
   * 确认预警
   */
  public acknowledgeAlert(alertId: string): boolean {
    return this.gnn.acknowledgeAlert(alertId);
  }

  /**
   * 获取网络健康报告
   */
  public getNetworkHealthReport(): NetworkHealthReport {
    return this.gnn.generateNetworkHealthReport();
  }

  /**
   * 分析级联影响
   */
  public analyzeCascadeImpact(sourceNodeId: string): CascadeImpactAnalysis {
    return this.gnn.analyzeCascadeImpact(sourceNodeId);
  }

  /**
   * 应用流量优化
   */
  public applyFlowOptimizations(): number {
    const optimizations = this.socialGNN.optimizeSupplyChainFlow();
    let totalImprovement = 0;

    for (const opt of optimizations) {
      const connId = Array.from(this.connections.entries())
        .find(([_, conn]) => 
          conn.sourceId === opt.edgeSource && conn.targetId === opt.edgeTarget
        )?.[0];
      
      if (connId) {
        const conn = this.connections.get(connId);
        if (conn) {
          conn.currentFlow = opt.optimizedFlow;
          totalImprovement += opt.improvement;
        }
      }
    }

    return totalImprovement;
  }
}

/** 产业经理类 */
export class IndustryManager {
  private divisions: Map<string, IndustryDivision> = new Map();
  private supplyChain: SupplyChain;

  constructor(supplyChain: SupplyChain) {
    this.supplyChain = supplyChain;
  }

  /**
   * 注册工人
   */
  public registerWorker(
    citizenId: string,
    industry: IndustryType,
    skillLevel: number = 1
  ): void {
    const division: IndustryDivision = {
      citizenId,
      industry,
      skillLevel,
      productivity: this.calculateProductivity(skillLevel, industry),
      wageRequirement: this.calculateWage(industry, skillLevel),
    };
    this.divisions.set(citizenId, division);
  }

  /**
   * 计算生产力
   */
  private calculateProductivity(skillLevel: number, industry: IndustryType): number {
    const baseProductivity: Record<IndustryType, number> = {
      [IndustryType.EXTRACTION]: 1.0,
      [IndustryType.PROCESSING]: 1.2,
      [IndustryType.MANUFACTURING]: 1.5,
      [IndustryType.INFORMATION]: 2.0,
      [IndustryType.ENERGY]: 1.3,
      [IndustryType.CONSTRUCTION]: 1.1,
      [IndustryType.SERVICE]: 1.4,
      [IndustryType.RESEARCH]: 3.0,
    };
    return baseProductivity[industry] * skillLevel;
  }

  /**
   * 计算工资
   */
  private calculateWage(industry: IndustryType, skillLevel: number): number {
    const baseWage: Record<IndustryType, number> = {
      [IndustryType.EXTRACTION]: 10,
      [IndustryType.PROCESSING]: 12,
      [IndustryType.MANUFACTURING]: 15,
      [IndustryType.INFORMATION]: 20,
      [IndustryType.ENERGY]: 13,
      [IndustryType.CONSTRUCTION]: 11,
      [IndustryType.SERVICE]: 14,
      [IndustryType.RESEARCH]: 30,
    };
    return baseWage[industry] * skillLevel;
  }

  /**
   * 获取产业统计
   */
  public getIndustryStats(): Record<IndustryType, {
    workerCount: number;
    avgSkill: number;
    totalProductivity: number;
    totalWage: number;
  }> {
    const stats: Record<IndustryType, { workerCount: number; avgSkill: number; totalProductivity: number; totalWage: number }> = {} as Record<IndustryType, { workerCount: number; avgSkill: number; totalProductivity: number; totalWage: number }>;

    for (const industry of Object.values(IndustryType)) {
      const workers = Array.from(this.divisions.values()).filter(d => d.industry === industry);
      stats[industry] = {
        workerCount: workers.length,
        avgSkill: workers.length > 0 ? workers.reduce((sum, w) => sum + w.skillLevel, 0) / workers.length : 0,
        totalProductivity: workers.reduce((sum, w) => sum + w.productivity, 0),
        totalWage: workers.reduce((sum, w) => sum + w.wageRequirement, 0),
      };
    }

    return stats;
  }

  /**
   * 支付工资
   */
  public payWages(): boolean {
    const totalWage = Array.from(this.divisions.values()).reduce((sum, d) => sum + d.wageRequirement, 0);
    return this.supplyChain.consumeResource(ResourceType.CORE_ENERGY, totalWage);
  }
}

// 导出单例
export const supplyChain = new SupplyChain();
export const industryManager = new IndustryManager(supplyChain);
export default { supplyChain, industryManager };
