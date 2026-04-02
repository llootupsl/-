/**
 * 神经网络引擎
 * 实现量子-SNN 混合神经网络，用于市民决策
 */

import type { EntityId } from '@/core/types';

/**
 * 神经网络配置
 */
export interface NeuralConfig {
  /** 输入维度 */
  inputSize: number;
  /** 隐藏层大小 */
  hiddenSize: number;
  /** 输出维度 */
  outputSize: number;
  /** 学习率 */
  learningRate: number;
  /** 是否启用量子增强 */
  quantumEnabled: boolean;
}

/**
 * 神经活动
 */
export interface NeuralActivity {
  /** 市民 ID */
  citizenId: EntityId;
  /** 时间戳 */
  timestamp: number;
  /** 输入激活 */
  inputs: Float32Array;
  /** 隐藏层激活 */
  hidden: Float32Array;
  /** 输出激活 */
  outputs: Float32Array;
  /** 量子相位（如果有） */
  quantumPhase?: Float32Array;
}

/**
 * 神经网络引擎
 */
export class NeuralEngine {
  private config: NeuralConfig;
  private weights: Float32Array;
  private biases: Float32Array;
  private quantumWeights: Float32Array | null = null;
  private lastActivity: Map<EntityId, NeuralActivity> = new Map();
  private activityHistory: NeuralActivity[] = [];

  constructor(config: NeuralConfig) {
    this.config = config;
    this.initializeWeights();
  }

  /**
   * 初始化权重
   */
  private initializeWeights(): void {
    const inputSize = this.config.inputSize;
    const hiddenSize = this.config.hiddenSize;
    const outputSize = this.config.outputSize;

    // Xavier 初始化
    const scaleInput = Math.sqrt(2.0 / (inputSize + hiddenSize));
    const scaleHidden = Math.sqrt(2.0 / (hiddenSize + outputSize));

    // 输入到隐藏层权重
    const inputWeights = new Float32Array(inputSize * hiddenSize);
    for (let i = 0; i < inputWeights.length; i++) {
      inputWeights[i] = (Math.random() * 2 - 1) * scaleInput;
    }

    // 隐藏层到输出权重
    const outputWeights = new Float32Array(hiddenSize * outputSize);
    for (let i = 0; i < outputWeights.length; i++) {
      outputWeights[i] = (Math.random() * 2 - 1) * scaleHidden;
    }

    // 合并权重
    this.weights = new Float32Array(inputWeights.length + outputWeights.length);
    this.weights.set(inputWeights, 0);
    this.weights.set(outputWeights, inputWeights.length);

    // 初始化偏置
    this.biases = new Float32Array(hiddenSize + outputSize);

    // 初始化量子权重（如果启用）
    if (this.config.quantumEnabled) {
      this.quantumWeights = new Float32Array(hiddenSize * outputSize);
      for (let i = 0; i < this.quantumWeights.length; i++) {
        this.quantumWeights[i] = Math.random() * 2 * Math.PI;
      }
    }
  }

  /**
   * 前向传播
   */
  public forward(inputs: Float32Array, citizenId: EntityId): Float32Array {
    const { inputSize, hiddenSize, outputSize } = this.config;

    // 验证输入
    if (inputs.length !== inputSize) {
      throw new Error(`Input size mismatch: expected ${inputSize}, got ${inputs.length}`);
    }

    // 隐藏层输入
    const hiddenInput = new Float32Array(hiddenSize);

    // 计算隐藏层
    for (let j = 0; j < hiddenSize; j++) {
      let sum = this.biases[j];
      for (let i = 0; i < inputSize; i++) {
        sum += inputs[i] * this.weights[j * inputSize + i];
      }
      // ReLU 激活
      hiddenInput[j] = Math.max(0, sum);
    }

    // 输出层输入
    const outputs = new Float32Array(outputSize);

    // 计算输出层
    const outputWeightOffset = inputSize * hiddenSize;
    for (let k = 0; k < outputSize; k++) {
      let sum = this.biases[hiddenSize + k];
      for (let j = 0; j < hiddenSize; j++) {
        sum += hiddenInput[j] * this.weights[outputWeightOffset + k * hiddenSize + j];
      }
      // Sigmoid 激活
      outputs[k] = 1 / (1 + Math.exp(-sum));
    }

    // 量子相位调整（如果启用）
    if (this.config.quantumEnabled && this.quantumWeights) {
      this.applyQuantumPhase(outputs);
    }

    // 记录活动
    const activity: NeuralActivity = {
      citizenId,
      timestamp: Date.now(),
      inputs: new Float32Array(inputs),
      hidden: hiddenInput,
      outputs: new Float32Array(outputs),
      quantumPhase: this.quantumWeights
        ? new Float32Array(this.quantumWeights)
        : undefined,
    };

    this.lastActivity.set(citizenId, activity);
    this.activityHistory.push(activity);

    // 限制历史长度
    if (this.activityHistory.length > 1000) {
      this.activityHistory.shift();
    }

    return outputs;
  }

  /**
   * 应用量子相位
   */
  private applyQuantumPhase(outputs: Float32Array): void {
    if (!this.quantumWeights) return;

    for (let i = 0; i < outputs.length; i++) {
      // 量子振幅调制
      const phase = this.quantumWeights[i % this.quantumWeights.length];
      const amplitude = Math.cos(phase) * 0.5 + 0.5;
      outputs[i] = outputs[i] * amplitude;
    }
  }

  /**
   * 反向传播（简化版）
   */
  public backward(
    inputs: Float32Array,
    targets: Float32Array,
    learningRate?: number
  ): number {
    const lr = learningRate ?? this.config.learningRate;
    const { inputSize, hiddenSize, outputSize } = this.config;

    // 前向传播
    const hiddenInput = new Float32Array(hiddenSize);
    for (let j = 0; j < hiddenSize; j++) {
      let sum = this.biases[j];
      for (let i = 0; i < inputSize; i++) {
        sum += inputs[i] * this.weights[j * inputSize + i];
      }
      hiddenInput[j] = Math.max(0, sum);
    }

    const outputs = new Float32Array(outputSize);
    const outputWeightOffset = inputSize * hiddenSize;
    for (let k = 0; k < outputSize; k++) {
      let sum = this.biases[hiddenSize + k];
      for (let j = 0; j < hiddenSize; j++) {
        sum += hiddenInput[j] * this.weights[outputWeightOffset + k * hiddenSize + j];
      }
      outputs[k] = 1 / (1 + Math.exp(-sum));
    }

    // 计算输出层误差
    const outputErrors = new Float32Array(outputSize);
    let totalError = 0;
    for (let k = 0; k < outputSize; k++) {
      const error = targets[k] - outputs[k];
      outputErrors[k] = error * outputs[k] * (1 - outputs[k]);
      totalError += error * error;
    }

    // 计算隐藏层误差
    const hiddenErrors = new Float32Array(hiddenSize);
    for (let j = 0; j < hiddenSize; j++) {
      let error = 0;
      for (let k = 0; k < outputSize; k++) {
        error += outputErrors[k] * this.weights[outputWeightOffset + k * hiddenSize + j];
      }
      hiddenErrors[j] = error * (hiddenInput[j] > 0 ? 1 : 0);
    }

    // 更新输出层权重
    for (let k = 0; k < outputSize; k++) {
      for (let j = 0; j < hiddenSize; j++) {
        const idx = outputWeightOffset + k * hiddenSize + j;
        this.weights[idx] += lr * outputErrors[k] * hiddenInput[j];
      }
      this.biases[hiddenSize + k] += lr * outputErrors[k];
    }

    // 更新隐藏层权重
    for (let j = 0; j < hiddenSize; j++) {
      for (let i = 0; i < inputSize; i++) {
        const idx = j * inputSize + i;
        this.weights[idx] += lr * hiddenErrors[j] * inputs[i];
      }
      this.biases[j] += lr * hiddenErrors[j];
    }

    return Math.sqrt(totalError / outputSize);
  }

  /**
   * 获取市民的最后活动
   */
  public getLastActivity(citizenId: EntityId): NeuralActivity | undefined {
    return this.lastActivity.get(citizenId);
  }

  /**
   * 获取活动历史
   */
  public getActivityHistory(): NeuralActivity[] {
    return [...this.activityHistory];
  }

  /**
   * 获取权重
   */
  public getWeights(): Float32Array {
    return new Float32Array(this.weights);
  }

  /**
   * 设置权重
   */
  public setWeights(weights: Float32Array): void {
    if (weights.length !== this.weights.length) {
      throw new Error('Weight size mismatch');
    }
    this.weights = new Float32Array(weights);
  }

  /**
   * 克隆神经网络
   */
  public clone(): NeuralEngine {
    const cloned = new NeuralEngine(this.config);
    cloned.setWeights(this.weights);
    return cloned;
  }

  /**
   * 序列化
   */
  public serialize(): {
    config: NeuralConfig;
    weights: number[];
    biases: number[];
    quantumWeights: number[] | null;
  } {
    return {
      config: this.config,
      weights: Array.from(this.weights),
      biases: Array.from(this.biases),
      quantumWeights: this.quantumWeights
        ? Array.from(this.quantumWeights)
        : null,
    };
  }

  /**
   * 反序列化
   */
  public static deserialize(data: {
    config: NeuralConfig;
    weights: number[];
    biases: number[];
    quantumWeights: number[] | null;
  }): NeuralEngine {
    const engine = new NeuralEngine(data.config);
    engine.setWeights(new Float32Array(data.weights));
    engine.biases = new Float32Array(data.biases);
    if (data.quantumWeights) {
      engine.quantumWeights = new Float32Array(data.quantumWeights);
    }
    return engine;
  }
}

/**
 * 神经网络管理器
 */
export class NeuralManager {
  private static instance: NeuralManager | null = null;
  private networks: Map<EntityId, NeuralEngine> = new Map();
  private globalNetwork: NeuralEngine;

  private constructor() {
    // 创建全局共享网络
    this.globalNetwork = new NeuralEngine({
      inputSize: 64,
      hiddenSize: 128,
      outputSize: 32,
      learningRate: 0.001,
      quantumEnabled: true,
    });
  }

  public static getInstance(): NeuralManager {
    if (!NeuralManager.instance) {
      NeuralManager.instance = new NeuralManager();
    }
    return NeuralManager.instance;
  }

  /**
   * 获取或创建市民的神经网络
   */
  public getNetwork(citizenId: EntityId, neuronCount: number): NeuralEngine {
    if (!this.networks.has(citizenId)) {
      const network = new NeuralEngine({
        inputSize: Math.max(16, Math.floor(neuronCount / 4)),
        hiddenSize: Math.max(32, Math.floor(neuronCount / 2)),
        outputSize: Math.max(8, Math.floor(neuronCount / 8)),
        learningRate: 0.001,
        quantumEnabled: true,
      });
      this.networks.set(citizenId, network);
    }
    return this.networks.get(citizenId)!;
  }

  /**
   * 获取全局网络
   */
  public getGlobalNetwork(): NeuralEngine {
    return this.globalNetwork;
  }

  /**
   * 推理
   */
  public infer(
    citizenId: EntityId,
    inputs: Float32Array,
    neuronCount: number
  ): Float32Array {
    const network = this.getNetwork(citizenId, neuronCount);
    return network.forward(inputs, citizenId);
  }

  /**
   * 学习
   */
  public learn(
    citizenId: EntityId,
    inputs: Float32Array,
    targets: Float32Array,
    neuronCount: number
  ): number {
    const network = this.getNetwork(citizenId, neuronCount);
    return network.backward(inputs, targets);
  }

  /**
   * 移除网络
   */
  public removeNetwork(citizenId: EntityId): void {
    this.networks.delete(citizenId);
  }

  /**
   * 清除所有网络
   */
  public clear(): void {
    this.networks.clear();
  }
}

export const neuralManager = NeuralManager.getInstance();
export default neuralManager;
