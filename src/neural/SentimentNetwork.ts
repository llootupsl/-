/**
 * 情感计算网络
 * 基于 GNN 的市民情感状态建模和分析
 */

import { GNNEngine, type GNNConfig, type NodeFeatures, type GraphStructure, createGNNEngine } from './GNNEngine';
import type { EntityId } from '@/core/types';

/**
 * 情感维度
 */
export type SentimentDimension =
  | 'happiness'      // 幸福感
  | 'anger'          // 愤怒
  | 'fear'           // 恐惧
  | 'sadness'        // 悲伤
  | 'surprise'       // 惊讶
  | 'disgust'        // 厌恶
  | 'trust'          // 信任
  | 'anticipation';  // 期待

/**
 * 情感状态
 */
export interface SentimentState {
  /** 市民 ID */
  citizenId: EntityId;
  /** 情感向量 (8 维度) */
  emotions: Record<SentimentDimension, number>;
  /** 综合情感值 (-1 到 1) */
  overallSentiment: number;
  /** 情感强度 (0 到 1) */
  intensity: number;
  /** 情感稳定性 (0 到 1) */
  stability: number;
  /** 更新时间戳 */
  timestamp: number;
  /** 预测趋势 */
  trend: 'rising' | 'falling' | 'stable';
}

/**
 * 情感影响因子
 */
export interface SentimentInfluence {
  /** 事件类型 */
  eventType: string;
  /** 影响强度 */
  intensity: number;
  /** 持续时间 (ms) */
  duration: number;
  /** 影响的目标维度 */
  targetDimensions: SentimentDimension[];
}

/**
 * 社交关系
 */
export interface SocialRelation {
  /** 关系类型 */
  type: 'family' | 'friend' | 'colleague' | 'stranger' | 'enemy';
  /** 亲密度 (0 到 1) */
  intimacy: number;
  /** 互动频率 */
  interactionFrequency: number;
  /** 最后互动时间 */
  lastInteraction: number;
}

/**
 * 情感网络配置
 */
export interface SentimentNetworkConfig {
  /** GNN 配置 */
  gnnConfig: GNNConfig;
  /** 情感维度数 */
  sentimentDimensions: number;
  /** 情感衰减率 */
  decayRate: number;
  /** 情感更新间隔 (ms) */
  updateInterval: number;
  /** 是否启用社交传播 */
  socialPropagation: boolean;
  /** 社交传播强度 */
  propagationStrength: number;
}

/**
 * 情感分析结果
 */
export interface SentimentAnalysis {
  /** 平均情感 */
  averageSentiment: number;
  /** 情感分布 */
  sentimentDistribution: Record<SentimentDimension, number>;
  /** 情感波动指数 */
  volatilityIndex: number;
  /** 群体极化程度 */
  polarization: number;
  /** 主导情感 */
  dominantEmotion: SentimentDimension;
  /** 异常值检测 */
  anomalies: EntityId[];
}

/**
 * 情感计算网络
 */
export class SentimentNetwork {
  private config: SentimentNetworkConfig;
  private gnnEngine: GNNEngine;
  private citizenSentiments: Map<EntityId, SentimentState> = new Map();
  private socialRelations: Map<EntityId, Map<EntityId, SocialRelation>> = new Map();
  private activeInfluences: Map<EntityId, SentimentInfluence[]> = new Map();
  private sentimentHistory: Map<EntityId, SentimentState[]> = new Map();
  private isRunning: boolean = false;
  private updateTimer: number | null = null;

  // 情感维度定义
  private readonly DIMENSIONS: SentimentDimension[] = [
    'happiness', 'anger', 'fear', 'sadness',
    'surprise', 'disgust', 'trust', 'anticipation'
  ];

  // 情感转换矩阵 (简化)
  private readonly TRANSITION_MATRIX: Record<string, Record<string, number>> = {
    happiness: { happiness: 0.9, anger: -0.1, trust: 0.5 },
    anger: { happiness: -0.3, anger: 0.8, fear: 0.2 },
    fear: { happiness: -0.2, fear: 0.8, anger: 0.1 },
    sadness: { happiness: -0.4, sadness: 0.7, trust: -0.2 },
  };

  constructor(config: SentimentNetworkConfig) {
    this.config = config;
    this.gnnEngine = createGNNEngine(config.gnnConfig);
  }

  /**
   * 初始化情感网络
   */
  public initialize(numCitizens: number, connectivity: number = 0.1): void {
    // 创建图结构
    const nodes: NodeFeatures[] = [];
    const edges: { source: EntityId; target: EntityId; weight: number }[] = [];

    for (let i = 0; i < numCitizens; i++) {
      const citizenId = `citizen_${i}` as EntityId;
      nodes.push({
        id: citizenId,
        features: this.initRandomSentimentFeatures(),
        embedding: null,
        activation: 0,
        gradient: null,
      });

      // 初始化情感状态
      this.citizenSentiments.set(citizenId, {
        citizenId,
        emotions: this.initRandomEmotions(),
        overallSentiment: 0,
        intensity: 0.5,
        stability: 0.8,
        timestamp: Date.now(),
        trend: 'stable',
      });

      // 初始化社交关系
      this.socialRelations.set(citizenId, new Map());
    }

    // 创建随机连接
    for (let i = 0; i < numCitizens; i++) {
      for (let j = i + 1; j < numCitizens; j++) {
        if (Math.random() < connectivity) {
          const citizenA = `citizen_${i}` as EntityId;
          const citizenB = `citizen_${j}` as EntityId;

          edges.push({ source: citizenA, target: citizenB, weight: Math.random() });
          edges.push({ source: citizenB, target: citizenA, weight: Math.random() });

          // 随机关系类型
          const relationTypes: SocialRelation['type'][] = ['family', 'friend', 'colleague', 'stranger'];
          const relation: SocialRelation = {
            type: relationTypes[Math.floor(Math.random() * 3)],
            intimacy: Math.random(),
            interactionFrequency: Math.random(),
            lastInteraction: Date.now(),
          };

          this.socialRelations.get(citizenA)!.set(citizenB, relation);
          this.socialRelations.get(citizenB)!.set(citizenA, relation);
        }
      }
    }

    // 构建图结构
    const adjacencyList = new Map<EntityId, EntityId[]>();
    const reverseAdjacencyList = new Map<EntityId, EntityId[]>();

    for (const citizen of this.citizenSentiments.keys()) {
      adjacencyList.set(citizen, []);
      reverseAdjacencyList.set(citizen, []);
    }

    for (const edge of edges) {
      adjacencyList.get(edge.source)!.push(edge.target);
      reverseAdjacencyList.get(edge.target)!.push(edge.source);
    }

    const graph: GraphStructure = {
      nodes,
      edges: edges.map(e => ({
        sourceId: e.source,
        targetId: e.target,
        weight: e.weight,
        type: 'social',
        message: null,
      })),
      adjacencyList,
      reverseAdjacencyList,
    };

    this.gnnEngine.loadGraph(graph);
  }

  /**
   * 初始化随机情感特征
   */
  private initRandomSentimentFeatures(): Float32Array {
    const features = new Float32Array(this.config.sentimentDimensions);
    for (let i = 0; i < features.length; i++) {
      features[i] = Math.random() * 2 - 1; // -1 到 1
    }
    return features;
  }

  /**
   * 初始化随机情感
   */
  private initRandomEmotions(): Record<SentimentDimension, number> {
    const emotions: Partial<Record<SentimentDimension, number>> = {};
    for (const dim of this.DIMENSIONS) {
      emotions[dim] = Math.random();
    }
    return emotions as Record<SentimentDimension, number>;
  }

  /**
   * 启动情感网络
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.updateTimer = window.setInterval(() => {
      this.updateAllSentiments();
    }, this.config.updateInterval);
  }

  /**
   * 停止情感网络
   */
  public stop(): void {
    this.isRunning = false;
    if (this.updateTimer !== null) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * 更新所有市民情感
   */
  public updateAllSentiments(): void {
    for (const [citizenId, state] of this.citizenSentiments) {
      // 1. 应用活跃影响
      this.applyActiveInfluences(citizenId, state);

      // 2. 应用情感衰减
      this.applyDecay(state);

      // 3. 应用社交传播
      if (this.config.socialPropagation) {
        this.applySocialPropagation(citizenId);
      }

      // 4. 计算综合情感
      this.calculateOverallSentiment(state);

      // 5. 更新状态
      state.timestamp = Date.now();
      this.citizenSentiments.set(citizenId, state);

      // 6. 记录历史
      this.recordHistory(citizenId, state);
    }
  }

  /**
   * 应用活跃影响
   */
  private applyActiveInfluences(citizenId: EntityId, state: SentimentState): void {
    const influences = this.activeInfluences.get(citizenId) || [];
    const remainingInfluences: SentimentInfluence[] = [];

    for (const influence of influences) {
      if (Date.now() - state.timestamp < influence.duration) {
        // 应用影响
        for (const dim of influence.targetDimensions) {
          state.emotions[dim] += influence.intensity * 0.1;
          state.emotions[dim] = Math.max(0, Math.min(1, state.emotions[dim]));
        }
        remainingInfluences.push(influence);
      }
    }

    this.activeInfluences.set(citizenId, remainingInfluences);
  }

  /**
   * 应用情感衰减
   */
  private applyDecay(state: SentimentState): void {
    const decay = Math.pow(this.config.decayRate, this.config.updateInterval / 1000);

    for (const dim of this.DIMENSIONS) {
      // 积极情感衰减更快
      const isPositive = dim === 'happiness' || dim === 'trust' || dim === 'anticipation';
      const dimDecay = isPositive ? decay * 1.1 : decay;

      state.emotions[dim] *= dimDecay;

      // 情感回归中性
      const neutrality = 0.2;
      state.emotions[dim] = state.emotions[dim] * (1 - neutrality) + neutrality * 0.5;
    }
  }

  /**
   * 应用社交传播
   */
  private applySocialPropagation(citizenId: EntityId): void {
    const relations = this.socialRelations.get(citizenId);
    if (!relations) return;

    const neighbors = Array.from(relations.entries());
    if (neighbors.length === 0) return;

    // 计算邻居平均情感
    let avgNeighborSentiment = 0;
    let totalWeight = 0;

    for (const [neighborId, relation] of neighbors) {
      const neighborState = this.citizenSentiments.get(neighborId);
      if (!neighborState) continue;

      const neighborSentiment = neighborState.overallSentiment;
      const influence = relation.intimacy * relation.interactionFrequency;

      avgNeighborSentiment += neighborSentiment * influence;
      totalWeight += influence;
    }

    if (totalWeight > 0) {
      avgNeighborSentiment /= totalWeight;

      // 获取当前市民状态
      const currentState = this.citizenSentiments.get(citizenId);
      if (currentState) {
        // 情感趋同
        const pullStrength = this.config.propagationStrength * 0.1;
        currentState.overallSentiment += (avgNeighborSentiment - currentState.overallSentiment) * pullStrength;

        // 情感波动降低稳定性
        currentState.stability *= 0.99;
        currentState.stability = Math.max(0.1, currentState.stability);
      }
    }
  }

  /**
   * 计算综合情感
   */
  private calculateOverallSentiment(state: SentimentState): void {
    // 加权平均
    const positiveWeight = state.emotions.happiness + state.emotions.trust + state.emotions.anticipation;
    const negativeWeight = state.emotions.anger + state.emotions.fear + state.emotions.sadness;

    state.overallSentiment = (positiveWeight - negativeWeight) / (positiveWeight + negativeWeight + 0.1);

    // 计算强度
    let emotionSum = 0;
    for (const dim of this.DIMENSIONS) {
      emotionSum += Math.abs(state.emotions[dim] - 0.5);
    }
    state.intensity = emotionSum / this.DIMENSIONS.length;

    // 计算稳定性 (基于历史波动)
    const history = this.sentimentHistory.get(state.citizenId);
    if (history && history.length >= 5) {
      const recent = history.slice(-5);
      let variance = 0;
      const mean = recent.reduce((sum, s) => sum + s.overallSentiment, 0) / recent.length;
      for (const s of recent) {
        variance += (s.overallSentiment - mean) ** 2;
      }
      variance /= recent.length;
      state.stability = 1 - Math.min(1, Math.sqrt(variance));
    }

    // 确定趋势
    if (history && history.length >= 3) {
      const recent = history.slice(-3);
      const trend = recent[2].overallSentiment - recent[0].overallSentiment;
      if (trend > 0.05) state.trend = 'rising';
      else if (trend < -0.05) state.trend = 'falling';
      else state.trend = 'stable';
    }
  }

  /**
   * 记录历史
   */
  private recordHistory(citizenId: EntityId, state: SentimentState): void {
    if (!this.sentimentHistory.has(citizenId)) {
      this.sentimentHistory.set(citizenId, []);
    }

    const history = this.sentimentHistory.get(citizenId)!;
    history.push({ ...state });

    // 限制历史长度
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * 添加情感影响
   */
  public addInfluence(
    citizenId: EntityId,
    influence: SentimentInfluence
  ): void {
    if (!this.activeInfluences.has(citizenId)) {
      this.activeInfluences.set(citizenId, []);
    }
    this.activeInfluences.get(citizenId)!.push(influence);
  }

  /**
   * 获取市民情感状态
   */
  public getSentiment(citizenId: EntityId): SentimentState | null {
    return this.citizenSentiments.get(citizenId) || null;
  }

  /**
   * 获取所有情感状态
   */
  public getAllSentiments(): SentimentState[] {
    return Array.from(this.citizenSentiments.values());
  }

  /**
   * 获取情感历史
   */
  public getSentimentHistory(citizenId: EntityId, limit: number = 50): SentimentState[] {
    const history = this.sentimentHistory.get(citizenId) || [];
    return history.slice(-limit);
  }

  /**
   * 情感分析
   */
  public analyze(): SentimentAnalysis {
    const sentiments = this.getAllSentiments();

    if (sentiments.length === 0) {
      return {
        averageSentiment: 0,
        sentimentDistribution: this.initRandomEmotions() as Record<SentimentDimension, number>,
        volatilityIndex: 0,
        polarization: 0,
        dominantEmotion: 'happiness',
        anomalies: [],
      };
    }

    // 计算平均情感
    const averageSentiment = sentiments.reduce((sum, s) => sum + s.overallSentiment, 0) / sentiments.length;

    // 计算情感分布
    const sentimentDistribution: Record<SentimentDimension, number> = {} as Record<SentimentDimension, number>;
    for (const dim of this.DIMENSIONS) {
      sentimentDistribution[dim] = sentiments.reduce((sum, s) => sum + s.emotions[dim], 0) / sentiments.length;
    }

    // 计算波动指数
    const mean = averageSentiment;
    const variance = sentiments.reduce((sum, s) => sum + (s.overallSentiment - mean) ** 2, 0) / sentiments.length;
    const volatilityIndex = Math.sqrt(variance);

    // 计算极化程度 (情感分布的熵)
    let entropy = 0;
    const values = Object.values(sentimentDistribution);
    const sum = values.reduce((a, b) => a + b, 0);
    for (const v of values) {
      const p = v / sum;
      if (p > 0) entropy -= p * Math.log(p);
    }
    const maxEntropy = Math.log(values.length);
    const polarization = 1 - entropy / maxEntropy;

    // 确定主导情感
    let dominantEmotion: SentimentDimension = 'happiness';
    let maxValue = -Infinity;
    for (const [dim, value] of Object.entries(sentimentDistribution)) {
      if (value > maxValue) {
        maxValue = value;
        dominantEmotion = dim as SentimentDimension;
      }
    }

    // 检测异常值 (情感极端或波动剧烈)
    const anomalies: EntityId[] = [];
    const stdDev = Math.sqrt(variance);
    for (const s of sentiments) {
      if (Math.abs(s.overallSentiment - mean) > 2 * stdDev || s.intensity > 0.8) {
        anomalies.push(s.citizenId);
      }
    }

    return {
      averageSentiment,
      sentimentDistribution,
      volatilityIndex,
      polarization,
      dominantEmotion,
      anomalies,
    };
  }

  /**
   * 批量更新特征
   */
  public batchUpdateFeatures(
    updates: Array<{ citizenId: EntityId; features: Float32Array }>
  ): void {
    for (const update of updates) {
      this.gnnEngine.setNodeFeatures(update.citizenId, update.features);
    }
  }

  /**
   * 运行 GNN 前向传播
   */
  public runGNNForward(nodeIds?: EntityId[]): Map<EntityId, Float32Array> {
    return this.gnnEngine.forward(nodeIds, {
      aggregator: 'mean',
      messageFunction: 'linear',
      includeSelfLoop: true,
    });
  }

  /**
   * 获取市民嵌入
   */
  public getCitizenEmbedding(citizenId: EntityId): Float32Array | null {
    return this.gnnEngine.getNodeEmbedding(citizenId);
  }

  /**
   * 获取统计信息
   */
  public getStats(): {
    citizenCount: number;
    relationCount: number;
    gnnStats: ReturnType<typeof this.gnnEngine.getStats>;
  } {
    let relationCount = 0;
    for (const relations of this.socialRelations.values()) {
      relationCount += relations.size;
    }

    return {
      citizenCount: this.citizenSentiments.size,
      relationCount: relationCount / 2, // 除以2因为是无向关系
      gnnStats: this.gnnEngine.getStats(),
    };
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.stop();
    this.gnnEngine.dispose();
    this.citizenSentiments.clear();
    this.socialRelations.clear();
    this.activeInfluences.clear();
    this.sentimentHistory.clear();
  }
}

/**
 * 创建情感网络工厂
 */
export function createSentimentNetwork(config: SentimentNetworkConfig): SentimentNetwork {
  return new SentimentNetwork(config);
}
