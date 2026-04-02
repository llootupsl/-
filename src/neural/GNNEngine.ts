/**
 * 图神经网络引擎
 * 实现 GNN 核心算法：消息传递、聚合、更新
 */

import type { EntityId } from '@/core/types';

/**
 * 节点特征
 */
export interface NodeFeatures {
  /** 节点 ID */
  id: EntityId;
  /** 特征向量 */
  features: Float32Array;
  /** 嵌入向量 */
  embedding: Float32Array | null;
  /** 激活值 */
  activation: number;
  /** 梯度 */
  gradient: Float32Array | null;
}

/**
 * 边特征
 */
export interface EdgeFeatures {
  /** 源节点 */
  sourceId: EntityId;
  /** 目标节点 */
  targetId: EntityId;
  /** 边权重 */
  weight: number;
  /** 边类型 */
  type: string;
  /** 消息向量 */
  message: Float32Array | null;
}

/**
 * 图结构
 */
export interface GraphStructure {
  /** 节点列表 */
  nodes: NodeFeatures[];
  /** 边列表 */
  edges: EdgeFeatures[];
  /** 邻接表 */
  adjacencyList: Map<EntityId, EntityId[]>;
  /** 反向邻接表 */
  reverseAdjacencyList: Map<EntityId, EntityId[]>;
}

/**
 * GNN 层配置
 */
export interface GNNLayerConfig {
  /** 输入特征维度 */
  inputDim: number;
  /** 输出特征维度 */
  outputDim: number;
  /** 隐藏维度 */
  hiddenDim?: number;
  /** 激活函数 */
  activation: 'relu' | 'sigmoid' | 'tanh' | 'leaky_relu';
  /** Dropout 率 */
  dropout?: number;
  /** 归一化 */
  normalize?: boolean;
  /** 层类型 */
  layerType: 'gcn' | 'gat' | 'sage' | 'gin';
}

/**
 * GNN 配置
 */
export interface GNNConfig {
  /** 层配置列表 */
  layers: GNNLayerConfig[];
  /** 学习率 */
  learningRate: number;
  /** 图卷积迭代次数 */
  propagationSteps: number;
  /** 是否使用残差连接 */
  residual?: boolean;
  /** 是否使用图注意力 */
  attentionHeads?: number;
}

/**
 * 消息传递配置
 */
export interface MessagePassingConfig {
  /** 聚合函数 */
  aggregator: 'sum' | 'mean' | 'max' | 'min' | 'attention';
  /** 消息函数类型 */
  messageFunction: 'linear' | 'mlp' | 'product';
  /** 是否包含自环 */
  includeSelfLoop: boolean;
  /** 注意力机制配置 */
  attentionConfig?: {
    heads: number;
    negativeSlope: number;
  };
}

/**
 * GNN 操作统计
 */
export interface GNNStats {
  /** 前向传播次数 */
  forwardPasses: number;
  /** 反向传播次数 */
  backwardPasses: number;
  /** 总消息传递次数 */
  messagePasses: number;
  /** 内存使用 (字节) */
  memoryUsage: number;
  /** 计算时间 (ms) */
  computationTime: number;
}

/**
 * 图神经网络引擎
 */
export class GNNEngine {
  private config: GNNConfig;
  private graph: GraphStructure | null = null;
  private weights: Map<string, Float32Array> = new Map();
  private biases: Map<string, Float32Array> = new Map();
  private nodeFeatures: Map<EntityId, NodeFeatures> = new Map();
  private stats: GNNStats = {
    forwardPasses: 0,
    backwardPasses: 0,
    messagePasses: 0,
    memoryUsage: 0,
    computationTime: 0,
  };

  constructor(config: GNNConfig) {
    this.config = config;
    this.initializeWeights();
  }

  /**
   * 初始化权重
   */
  private initializeWeights(): void {
    for (let i = 0; i < this.config.layers.length; i++) {
      const layer = this.config.layers[i];
      const hiddenDim = layer.hiddenDim || layer.outputDim;

      // 层间权重
      const weightKey = `layer_${i}_weight`;
      this.weights.set(weightKey, this.xavierInit(layer.inputDim, hiddenDim));

      // 层间偏置
      const biasKey = `layer_${i}_bias`;
      this.biases.set(biasKey, new Float32Array(hiddenDim));

      // 注意力权重 (如果使用 GAT)
      if (this.config.attentionHeads && this.config.attentionHeads > 1) {
        const attWeightKey = `layer_${i}_att_weight`;
        this.weights.set(attWeightKey, this.xavierInit(hiddenDim * 2, this.config.attentionHeads));
      }
    }
  }

  /**
   * Xavier 初始化
   */
  private xavierInit(fanIn: number, fanOut: number): Float32Array {
    const stddev = Math.sqrt(2.0 / (fanIn + fanOut));
    const size = fanIn * fanOut;
    const weights = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      weights[i] = (Math.random() * 2 - 1) * stddev;
    }
    return weights;
  }

  /**
   * 加载图结构
   */
  public loadGraph(graph: GraphStructure): void {
    this.graph = graph;
    this.nodeFeatures.clear();

    // 初始化节点特征
    for (const node of graph.nodes) {
      this.nodeFeatures.set(node.id, {
        ...node,
        embedding: null,
        activation: 0,
        gradient: null,
      });
    }

    // 更新统计
    this.updateMemoryStats();
  }

  /**
   * 设置节点特征
   */
  public setNodeFeatures(nodeId: EntityId, features: Float32Array): void {
    const node = this.nodeFeatures.get(nodeId);
    if (node) {
      node.features = new Float32Array(features);
    }
  }

  /**
   * 获取节点嵌入
   */
  public getNodeEmbedding(nodeId: EntityId): Float32Array | null {
    const node = this.nodeFeatures.get(nodeId);
    return node?.embedding ? new Float32Array(node.embedding) : null;
  }

  /**
   * 前向传播
   */
  public forward(
    startNodes?: EntityId[],
    messageConfig?: MessagePassingConfig
  ): Map<EntityId, Float32Array> {
    if (!this.graph) {
      throw new Error('No graph loaded');
    }

    const startTime = performance.now();
    const config = messageConfig || {
      aggregator: 'mean',
      messageFunction: 'linear',
      includeSelfLoop: true,
    };

    // 确定要更新的节点
    const nodesToUpdate = startNodes ||
      Array.from(this.nodeFeatures.keys());

    // 逐层处理
    let currentEmbeddings = new Map<EntityId, Float32Array>();

    // 初始化：使用原始特征
    for (const nodeId of nodesToUpdate) {
      const node = this.nodeFeatures.get(nodeId);
      if (node) {
        currentEmbeddings.set(nodeId, new Float32Array(node.features));
      }
    }

    // 消息传递迭代
    for (let step = 0; step < this.config.propagationSteps; step++) {
      currentEmbeddings = this.messagePassingStep(
        currentEmbeddings,
        nodesToUpdate,
        config
      );
    }

    // 通过 GNN 层
    for (let i = 0; i < this.config.layers.length; i++) {
      const layer = this.config.layers[i];
      currentEmbeddings = this.applyLayer(currentEmbeddings, nodesToUpdate, i, layer);
    }

    // 更新节点嵌入
    for (const [nodeId, embedding] of currentEmbeddings) {
      const node = this.nodeFeatures.get(nodeId);
      if (node) {
        node.embedding = new Float32Array(embedding);
        node.activation = this.calculateActivation(embedding);
      }
    }

    this.stats.forwardPasses++;
    this.stats.computationTime += performance.now() - startTime;

    return currentEmbeddings;
  }

  /**
   * 消息传递步骤
   */
  private messagePassingStep(
    embeddings: Map<EntityId, Float32Array>,
    nodeIds: EntityId[],
    config: MessagePassingConfig
  ): Map<EntityId, Float32Array> {
    if (!this.graph) return embeddings;

    const newEmbeddings = new Map<EntityId, Float32Array>();

    for (const nodeId of nodeIds) {
      const neighbors = this.graph.adjacencyList.get(nodeId) || [];
      const messages: Float32Array[] = [];

      // 收集邻居消息
      for (const neighborId of neighbors) {
        const neighborEmbedding = embeddings.get(neighborId);
        if (neighborEmbedding) {
          // 计算消息
          const message = this.computeMessage(
            neighborEmbedding,
            embeddings.get(nodeId)!,
            config.messageFunction
          );
          messages.push(message);
        }
      }

      // 添加自环消息 (如果配置)
      if (config.includeSelfLoop) {
        const selfEmbedding = embeddings.get(nodeId);
        if (selfEmbedding) {
          messages.push(new Float32Array(selfEmbedding));
        }
      }

      // 聚合消息
      if (messages.length > 0) {
        const aggregated = this.aggregateMessages(messages, config.aggregator);
        newEmbeddings.set(nodeId, aggregated);
      } else {
        // 没有邻居，使用原始嵌入
        newEmbeddings.set(nodeId, embeddings.get(nodeId) || new Float32Array(0));
      }
    }

    this.stats.messagePasses += nodeIds.length;
    return newEmbeddings;
  }

  /**
   * 计算消息
   */
  private computeMessage(
    sourceEmbedding: Float32Array,
    targetEmbedding: Float32Array,
    functionType: string
  ): Float32Array {
    switch (functionType) {
      case 'linear':
        // 简单的线性变换
        return new Float32Array(sourceEmbedding);
      case 'product':
        // 元素级乘积
        const product = new Float32Array(sourceEmbedding.length);
        for (let i = 0; i < sourceEmbedding.length; i++) {
          product[i] = sourceEmbedding[i] * targetEmbedding[i];
        }
        return product;
      case 'mlp':
        // 多层感知机 (简化)
        return new Float32Array(sourceEmbedding);
      default:
        return new Float32Array(sourceEmbedding);
    }
  }

  /**
   * 聚合消息
   */
  private aggregateMessages(messages: Float32Array[], aggregator: string): Float32Array {
    if (messages.length === 0) return new Float32Array(0);

    const dim = messages[0].length;
    const result = new Float32Array(dim);

    switch (aggregator) {
      case 'sum':
        for (const msg of messages) {
          for (let i = 0; i < dim; i++) {
            result[i] += msg[i];
          }
        }
        break;

      case 'mean':
        for (const msg of messages) {
          for (let i = 0; i < dim; i++) {
            result[i] += msg[i];
          }
        }
        for (let i = 0; i < dim; i++) {
          result[i] /= messages.length;
        }
        break;

      case 'max':
        for (let i = 0; i < dim; i++) {
          let maxVal = messages[0][i];
          for (const msg of messages) {
            maxVal = Math.max(maxVal, msg[i]);
          }
          result[i] = maxVal;
        }
        break;

      case 'min':
        for (let i = 0; i < dim; i++) {
          let minVal = messages[0][i];
          for (const msg of messages) {
            minVal = Math.min(minVal, msg[i]);
          }
          result[i] = minVal;
        }
        break;

      case 'attention':
        // 简化的注意力聚合
        const attentionWeights = new Float32Array(messages.length);
        let totalWeight = 0;
        for (let i = 0; i < messages.length; i++) {
          attentionWeights[i] = Math.exp(Math.random()); // 简化
          totalWeight += attentionWeights[i];
        }
        for (let i = 0; i < messages.length; i++) {
          attentionWeights[i] /= totalWeight;
        }
        for (let i = 0; i < dim; i++) {
          result[i] = 0;
          for (let j = 0; j < messages.length; j++) {
            result[i] += messages[j][i] * attentionWeights[j];
          }
        }
        break;

      default:
        // 默认使用 mean
        for (const msg of messages) {
          for (let i = 0; i < dim; i++) {
            result[i] += msg[i];
          }
        }
        for (let i = 0; i < dim; i++) {
          result[i] /= messages.length;
        }
    }

    return result;
  }

  /**
   * 应用 GNN 层
   */
  private applyLayer(
    embeddings: Map<EntityId, Float32Array>,
    nodeIds: EntityId[],
    layerIndex: number,
    layerConfig: GNNLayerConfig
  ): Map<EntityId, Float32Array> {
    const weightKey = `layer_${layerIndex}_weight`;
    const biasKey = `layer_${layerIndex}_bias`;
    const weight = this.weights.get(weightKey);
    const bias = this.biases.get(biasKey);

    if (!weight || !bias) {
      throw new Error(`Layer ${layerIndex} weights not found`);
    }

    const newEmbeddings = new Map<EntityId, Float32Array>();
    const inputDim = layerConfig.inputDim;
    const outputDim = layerConfig.outputDim;

    for (const nodeId of nodeIds) {
      const input = embeddings.get(nodeId);
      if (!input) continue;

      // 矩阵乘法: output = input @ W^T + b
      const output = new Float32Array(outputDim);

      for (let j = 0; j < outputDim; j++) {
        let sum = bias[j];
        for (let i = 0; i < inputDim; i++) {
          sum += input[i] * weight[i * outputDim + j];
        }

        // 应用激活函数
        output[j] = this.applyActivation(sum, layerConfig.activation);
      }

      // 残差连接
      if (this.config.residual && layerConfig.inputDim === layerConfig.outputDim) {
        for (let i = 0; i < outputDim; i++) {
          output[i] += input[i];
        }
      }

      newEmbeddings.set(nodeId, output);
    }

    return newEmbeddings;
  }

  /**
   * 应用激活函数
   */
  private applyActivation(x: number, activation: string): number {
    switch (activation) {
      case 'relu':
        return Math.max(0, x);
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'tanh':
        return Math.tanh(x);
      case 'leaky_relu':
        return x > 0 ? x : 0.01 * x;
      default:
        return x;
    }
  }

  /**
   * 计算激活值
   */
  private calculateActivation(embedding: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < embedding.length; i++) {
      sum += embedding[i] * embedding[i];
    }
    return Math.sqrt(sum);
  }

  /**
   * 反向传播 (简化版)
   */
  public backward(targetEmbeddings: Map<EntityId, Float32Array>): Map<EntityId, Float32Array> {
    const startTime = performance.now();
    const gradients = new Map<EntityId, Float32Array>();

    // 计算损失梯度
    for (const [nodeId, target] of targetEmbeddings) {
      const current = this.nodeFeatures.get(nodeId)?.embedding;
      if (!current) continue;

      // 简化的均方误差梯度
      const gradient = new Float32Array(current.length);
      for (let i = 0; i < current.length; i++) {
        gradient[i] = 2 * (current[i] - target[i]) / current.length;
      }

      gradients.set(nodeId, gradient);
    }

    this.stats.backwardPasses++;
    this.stats.computationTime += performance.now() - startTime;

    return gradients;
  }

  /**
   * 获取统计信息
   */
  public getStats(): GNNStats {
    return { ...this.stats };
  }

  /**
   * 更新内存统计
   */
  private updateMemoryStats(): void {
    let totalMemory = 0;

    // 计算权重内存
    for (const weight of this.weights.values()) {
      totalMemory += weight.byteLength;
    }

    // 计算节点特征内存
    for (const node of this.nodeFeatures.values()) {
      totalMemory += node.features.byteLength;
      if (node.embedding) totalMemory += node.embedding.byteLength;
      if (node.gradient) totalMemory += node.gradient.byteLength;
    }

    this.stats.memoryUsage = totalMemory;
  }

  /**
   * 序列化
   */
  public serialize(): {
    config: GNNConfig;
    weights: Record<string, number[]>;
    biases: Record<string, number[]>;
  } {
    const weights: Record<string, number[]> = {};
    const biases: Record<string, number[]> = {};

    for (const [key, value] of this.weights) {
      weights[key] = Array.from(value);
    }

    for (const [key, value] of this.biases) {
      biases[key] = Array.from(value);
    }

    return { config: this.config, weights, biases };
  }

  /**
   * 反序列化
   */
  public static deserialize(data: ReturnType<GNNEngine['serialize']>): GNNEngine {
    const engine = new GNNEngine(data.config);

    for (const [key, value] of Object.entries(data.weights)) {
      engine.weights.set(key, new Float32Array(value));
    }

    for (const [key, value] of Object.entries(data.biases)) {
      engine.biases.set(key, new Float32Array(value));
    }

    return engine;
  }

  /**
   * 克隆引擎
   */
  public clone(): GNNEngine {
    const serialized = this.serialize();
    return GNNEngine.deserialize(serialized);
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.graph = null;
    this.nodeFeatures.clear();
    this.weights.clear();
    this.biases.clear();
  }
}

/**
 * 创建 GNN 引擎工厂
 */
export function createGNNEngine(config: GNNConfig): GNNEngine {
  return new GNNEngine(config);
}
