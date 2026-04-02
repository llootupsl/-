/**
 * =============================================================================
 * OMNIS APIEN - 永夜熵纪 核心系统
 * THE COSMIC CONTAINER - 整合一切系统的核心容器
 * =============================================================================
 */

import { SpikingNeuralNetwork, BaziEngine, PathFinder } from '../compute';
import { QuantumSimulator, QuantumCircuit } from '../quantum';
import { logger } from './utils/Logger';

// ============================================================================
// 常量定义
// ============================================================================

const APEX = {
  // 宇宙级参数
  PLANCK_TIME: 5.39125e-44,
  PLANCK_LENGTH: 1.616e-35,
  GRAVITATIONAL_CONSTANT: 6.674e-11,

  // 渲染极限
  MAX_PARTICLES_EXTREME: 1_000_000,
  MAX_PARTICLES_BALANCED: 100_000,
  MAX_PARTICLES_ECO: 10_000,

  // 市民极限
  MAX_CITIZENS_EXTREME: 100_000,
  MAX_CITIZENS_BALANCED: 10_000,
  MAX_CITIZENS_ECO: 1_000,

  // 神经网络极限
  MAX_NEURONS_ACTIVE: 1024,
  MAX_NEURONS_BACKGROUND: 256,
  MAX_NEURONS_DORMANT: 64,

  // 记忆极限
  MAX_MEMORIES_CITIZEN: 10_000,
  MAX_RELATIONS_CITIZEN: 1_000,

  // 量子极限
  MAX_QUBITS: 32,

  // 熵增极限
  ENTROPY_CATASTROPHE_THRESHOLD: 0.99,
  ENTROPY_MAX: 1.0,

  // 音频极限
  MAX_CONCURRENT_SOUNDS: 64,
  AUDIO_SAMPLE_RATE: 192000,

  // 网络极限
  MAX_PEER_CONNECTIONS: 256,
  MAX_MESSAGE_QUEUE: 10_000,
} as const;

export const PerformanceModeExtended = {
  APEX: 'apex',
  EXTREME: 'extreme',
  BALANCED: 'balanced',
  ECO: 'eco',
} as const;

export type ExtendedPerformanceMode = typeof PerformanceModeExtended[keyof typeof PerformanceModeExtended];

export const APEX_MODE_CONFIG = {
  [PerformanceModeExtended.APEX]: {
    name: 'APEX',
    nameCN: '神之领域',
    description: '超越物理极限，解锁宇宙法则',
    color: '#ffd700',
    particleCount: APEX.MAX_PARTICLES_EXTREME,
    citizenCount: APEX.MAX_CITIZENS_EXTREME,
    neuralNeurons: APEX.MAX_NEURONS_ACTIVE,
    memoryCapacity: APEX.MAX_MEMORIES_CITIZEN,
    targetFPS: 1000,
    quantumEnabled: true,
    qubitCount: APEX.MAX_QUBITS,
    entropyRate: 0.0001,
    // V5修复：添加缺少的属性
    particleSize: 0.01,
    particleLifetime: 30,
    resolutionScale: 2.0,
  },
  [PerformanceModeExtended.EXTREME]: {
    name: '极致',
    nameCN: '极致性能',
    description: '压榨硬件潜能，追求极致体验',
    color: '#ff0080',
    particleCount: 500_000,
    citizenCount: 50_000,
    neuralNeurons: 512,
    memoryCapacity: 5000,
    targetFPS: 240,
    quantumEnabled: true,
    qubitCount: 16,
    entropyRate: 0.001,
    // V5修复：添加缺少的属性
    particleSize: 0.02,
    particleLifetime: 25,
    resolutionScale: 1.5,
  },
  [PerformanceModeExtended.BALANCED]: {
    name: '均衡',
    nameCN: '均衡模式',
    description: '性能与体验的完美平衡',
    color: '#00d4ff',
    particleCount: 100_000,
    citizenCount: 10_000,
    neuralNeurons: 256,
    memoryCapacity: 2000,
    targetFPS: 120,
    quantumEnabled: true,
    qubitCount: 8,
    entropyRate: 0.01,
    // V5修复：添加缺少的属性
    particleSize: 0.05,
    particleLifetime: 20,
    resolutionScale: 1.0,
  },
  [PerformanceModeExtended.ECO]: {
    name: '节能',
    nameCN: '节能模式',
    description: '降低资源占用，延长设备寿命',
    color: '#10b981',
    particleCount: 10_000,
    citizenCount: 1_000,
    neuralNeurons: 64,
    memoryCapacity: 500,
    targetFPS: 30,
    quantumEnabled: false,
    qubitCount: 0,
    entropyRate: 0.05,
    // V5修复：添加缺少的属性
    particleSize: 0.1,
    particleLifetime: 15,
    resolutionScale: 0.5,
  },
} as const;

export type APEXModeConfig = typeof APEX_MODE_CONFIG[keyof typeof APEX_MODE_CONFIG];

// ============================================================================
// 游戏状态接口
// ============================================================================

export interface UniverseState {
  year: number;
  day: number;
  entropy: number;
  epoch: string;
  citizens: number;
  energy: number;
  biomass: number;
  computeQuota: number;
  phase: 'golden' | 'stable' | 'stressed' | 'crisis' | 'collapse' | 'entropy';
}

export interface GameStatus {
  initialized: boolean;
  running: boolean;
  paused: boolean;
  mode: ExtendedPerformanceMode;
  universe: UniverseState;
}

// ============================================================================
// 市民系统 - ApexCitizen (带量子脑)
// ============================================================================

interface CitizenMemory {
  id: string;
  content: string;
  timestamp: number;
  importance: number;
}

interface CitizenRelation {
  targetId: string;
  type: string;
  intimacy: number;
}

export class ApexCitizen {
  public readonly id: string;
  public name: string;

  // 状态
  public state: 'active' | 'background' | 'dormant' = 'background';
  public energy: number = 100;
  public health: number = 100;
  public mood: number = 50;
  public hunger: number = 100;

  // 位置
  public position = { x: 0, y: 0, z: 0 };
  public velocity = { x: 0, y: 0, z: 0 };

  // 记忆
  private memories: CitizenMemory[] = [];
  private maxMemories: number;

  // 关系
  private relations: Map<string, CitizenRelation> = new Map();

  // 量子决策脑（使用真正的量子模拟器）
  private quantumBrain: QuantumSimulator;
  private quantumEnabled: boolean;

  // 脉冲神经网络（使用真正的SNN）
  private neuralNet: SpikingNeuralNetwork;

  // 八字命理
  private bazi: BaziEngine | null = null;
  private destinyBonus: number = 0;

  // 路径规划
  private pathTarget: { x: number; y: number } | null = null;
  private currentPath: { x: number; y: number }[] = [];

  constructor(
    id: string,
    name: string,
    quantumEnabled: boolean,
    neuralSize: number,
    memoryCapacity: number,
    birthYear?: number,
    birthMonth?: number,
    birthDay?: number
  ) {
    this.id = id;
    this.name = name;
    this.maxMemories = memoryCapacity;
    this.quantumEnabled = quantumEnabled;

    // 初始化量子模拟器
    if (quantumEnabled) {
      this.quantumBrain = new QuantumSimulator(8); // 8个量子比特
    }

    // 初始化脉冲神经网络
    this.neuralNet = new SpikingNeuralNetwork(neuralSize, 16);

    // 如果有出生日期，计算八字
    if (birthYear && birthMonth && birthDay) {
      this.bazi = new BaziEngine(birthYear, birthMonth, birthDay, 12);
      const strength = this.bazi.dayMasterStrength();
      // 命强则意志坚定，命运加成高
      this.destinyBonus = strength === '强' ? 0.2 : strength === '弱' ? -0.2 : 0;
    }
  }

  /**
   * 量子决策：用量子测量做决策
   */
  public quantumDecision(): number {
    if (!this.quantumEnabled || !this.quantumBrain) {
      return Math.random();
    }

    // 准备叠加态
    this.quantumBrain.initialize(8);
    const circuit = new QuantumCircuit({ numQubits: 8 });
    circuit.addGate('H', 0);

    // 纠缠
    for (let i = 1; i < 4; i++) {
      circuit.cnot(0, i);
    }

    // 测量得到决策
    const result = this.quantumBrain.run(circuit);
    const measurements = result.measurements;
    const measurement = measurements && measurements.length > 0 ? measurements[0] : null;
    const measuredValue = measurement ? measurement.result : 0;

    // 考虑命运加成
    const quantumFactor = measuredValue + this.destinyBonus;
    return Math.max(0, Math.min(1, quantumFactor));
  }

  /**
   * 神经网络推理
   */
  public neuralProcess(inputs: number[]): number[] {
    const spikes = this.neuralNet.step(inputs, 1.0, performance.now());
    return spikes;
  }

  /**
   * 学习新模式
   */
  public learn(inputs: number[], targets: number[]): void {
    const preSpikes = this.neuralNet.step(inputs, 1.0, performance.now());
    this.neuralNet.applySTDP(inputs, targets, 1.0);
  }

  /**
   * 更新市民状态
   */
  public update(deltaTime: number, entropy: number): void {
    // 基础属性更新
    this.energy = Math.max(0, Math.min(100, this.energy - deltaTime * 0.1 * (1 + entropy * 0.5)));
    this.hunger = Math.max(0, Math.min(100, this.hunger - deltaTime * 0.05));

    // 心情影响
    if (this.hunger < 20) {
      this.mood = Math.max(0, this.mood - deltaTime * 2);
    } else if (this.energy > 80) {
      this.mood = Math.min(100, this.mood + deltaTime * 0.5);
    }

    // 健康影响
    if (this.hunger === 0 || this.energy === 0) {
      this.health = Math.max(0, this.health - deltaTime);
    }

    // 熵增影响心情和行为
    if (entropy > 0.5) {
      this.mood = Math.max(0, this.mood - entropy * deltaTime * 0.5);
    }

    // 状态转换（使用量子决策）
    this.updateState();

    // 更新物理
    this.updatePhysics(deltaTime);
  }

  private updateState(): void {
    // 使用量子决策确定状态转换
    const decision = this.quantumDecision();

    if (this.health < 20 || this.energy < 20) {
      this.state = 'dormant';
    } else if (decision > 0.7 && this.mood > 70 && this.energy > 80) {
      this.state = 'active';
    } else {
      this.state = 'background';
    }
  }

  private updatePhysics(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // 边界检测
    const bounds = 1000;
    if (Math.abs(this.position.x) > bounds) this.velocity.x *= -0.8;
    if (Math.abs(this.position.z) > bounds) this.velocity.z *= -0.8;
  }

  /**
   * 添加记忆
   */
  public addMemory(content: string, importance: number): void {
    this.memories.push({
      id: crypto.randomUUID(),
      content,
      timestamp: Date.now(),
      importance,
    });

    // 限制记忆数量
    if (this.memories.length > this.maxMemories) {
      this.memories.sort((a, b) => a.importance - b.importance);
      this.memories.shift();
    }
  }

  /**
   * 获取八字信息
   */
  public getBazi(): BaziEngine | null {
    return this.bazi;
  }

  /**
   * 是否死亡
   */
  public isDead(): boolean {
    return this.health <= 0;
  }

  /**
   * 获取神经网络状态
   */
  public getNeuralActivity(): number {
    return this.neuralNet.getFiringRate();
  }
}

// ============================================================================
// 宇宙级游戏循环 - 性能优化版
// ============================================================================

interface LoopStats {
  fps: number;
  frameTime: number;
  updateTime: number;
  renderTime: number;
  droppedFrames: number;
  quality: number;
}

interface LoopConfig {
  targetFPS: number;
  maxDeltaTime: number;
  fixedTimeStep: number;
  adaptiveQuality: boolean;
  skipFrameThreshold: number;
}

export class CosmicGameLoop {
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private fps = 0;
  private frameCount = 0;
  private currentTime = 0;
  private updateCallbacks: ((deltaTime: number) => void)[] = [];
  private renderCallbacks: ((alpha: number, deltaTime: number) => void)[] = [];

  private config: LoopConfig = {
    targetFPS: 60,
    maxDeltaTime: 0.1,
    fixedTimeStep: 1 / 60,
    adaptiveQuality: true,
    skipFrameThreshold: 0.05,
  };

  private stats: LoopStats = {
    fps: 0,
    frameTime: 0,
    updateTime: 0,
    renderTime: 0,
    droppedFrames: 0,
    quality: 1.0,
  };

  private accumulator = 0;
  private slowFrameCount = 0;
  private fastFrameCount = 0;
  private currentQuality = 1.0;
  private lastUpdateTime = 0;
  private lastRenderTime = 0;
  private frameTimeHistory: number[] = [];
  private maxHistoryLength = 60;

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.currentTime = this.lastTime;
    this.accumulator = 0;
    logger.info('CosmicLoop', 'Started with optimizations');
    this.loop();
  }

  public stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    logger.info('CosmicLoop', 'Stopped');
  }

  public onUpdate(callback: (deltaTime: number) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) this.updateCallbacks.splice(index, 1);
    };
  }

  public onRender(callback: (alpha: number, deltaTime: number) => void): () => void {
    this.renderCallbacks.push(callback);
    return () => {
      const index = this.renderCallbacks.indexOf(callback);
      if (index > -1) this.renderCallbacks.splice(index, 1);
    };
  }

  public getFPS(): number {
    return this.fps;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getStats(): LoopStats {
    return { ...this.stats };
  }

  public setTargetFPS(fps: number): void {
    this.config.targetFPS = Math.max(15, Math.min(240, fps));
  }

  public setQuality(quality: number): void {
    this.currentQuality = Math.max(0.1, Math.min(1.0, quality));
    this.stats.quality = this.currentQuality;
  }

  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    let deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    deltaTime = Math.min(deltaTime, this.config.maxDeltaTime);

    this.frameCount++;
    if (now - this.currentTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.currentTime = now;
      this.adaptiveQualityAdjust();
    }

    this.accumulator += deltaTime;

    const updateStart = performance.now();
    let updatesThisFrame = 0;
    const maxUpdatesPerFrame = 5;

    while (this.accumulator >= this.config.fixedTimeStep && updatesThisFrame < maxUpdatesPerFrame) {
      for (const callback of this.updateCallbacks) {
        callback(this.config.fixedTimeStep);
      }
      this.accumulator -= this.config.fixedTimeStep;
      updatesThisFrame++;
    }

    this.lastUpdateTime = performance.now() - updateStart;
    this.stats.updateTime = this.lastUpdateTime;

    const alpha = this.accumulator / this.config.fixedTimeStep;
    const renderStart = performance.now();

    for (const callback of this.renderCallbacks) {
      callback(alpha, deltaTime);
    }

    this.lastRenderTime = performance.now() - renderStart;
    this.stats.renderTime = this.lastRenderTime;
    this.stats.frameTime = deltaTime * 1000;
    this.stats.fps = this.fps;

    this.recordFrameTime(deltaTime * 1000);

    this.rafId = requestAnimationFrame(this.loop);
  };

  private recordFrameTime(frameTime: number): void {
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.maxHistoryLength) {
      this.frameTimeHistory.shift();
    }
  }

  private adaptiveQualityAdjust(): void {
    if (!this.config.adaptiveQuality) return;

    const avgFrameTime = this.frameTimeHistory.length > 0
      ? this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length
      : 16.67;

    const targetFrameTime = 1000 / this.config.targetFPS;

    if (avgFrameTime > targetFrameTime * 1.5) {
      this.slowFrameCount++;
      this.fastFrameCount = 0;

      if (this.slowFrameCount >= 3) {
        this.currentQuality = Math.max(0.5, this.currentQuality - 0.1);
        this.stats.quality = this.currentQuality;
        this.slowFrameCount = 0;
        logger.info('CosmicLoop', `Quality reduced to ${this.currentQuality.toFixed(2)}`);
      }
    } else if (avgFrameTime < targetFrameTime * 0.8) {
      this.fastFrameCount++;
      this.slowFrameCount = 0;

      if (this.fastFrameCount >= 5 && this.currentQuality < 1.0) {
        this.currentQuality = Math.min(1.0, this.currentQuality + 0.05);
        this.stats.quality = this.currentQuality;
        this.fastFrameCount = 0;
        logger.info('CosmicLoop', `Quality increased to ${this.currentQuality.toFixed(2)}`);
      }
    } else {
      this.slowFrameCount = 0;
      this.fastFrameCount = 0;
    }
  }
}

// ============================================================================
// 主游戏类 - OMNISGame
// ============================================================================

class OMNISGame {
  private static instance: OMNISGame | null = null;

  private gameLoop!: CosmicGameLoop;
  private mode: ExtendedPerformanceMode = PerformanceModeExtended.BALANCED;
  private modeConfig!: APEXModeConfig;

  private citizens: Map<string, ApexCitizen> = new Map();
  private pathFinder!: PathFinder;

  private entropy: number = 0.1;
  private year: number = 1;
  private day: number = 1;

  private initialized = false;
  private paused = false;

  private constructor() {}

  public static getInstance(): OMNISGame {
    if (!OMNISGame.instance) {
      OMNISGame.instance = new OMNISGame();
    }
    return OMNISGame.instance;
  }

  /**
   * 初始化游戏
   */
  public async init(mode: ExtendedPerformanceMode = PerformanceModeExtended.BALANCED): Promise<void> {
    if (this.initialized) {
      logger.warn('OMNIS', 'Already initialized');
      return;
    }

    logger.info('OMNIS', 'Initializing APEX...');
    logger.info('OMNIS', `Mode: ${mode}`);

    this.mode = mode;
    this.modeConfig = APEX_MODE_CONFIG[mode];
    this.gameLoop = new CosmicGameLoop();

    // 初始化路径规划器
    this.pathFinder = new PathFinder(100, 100);

    // 初始化市民
    await this.initCitizens();

    // 注册更新回调
    this.gameLoop.onUpdate((dt) => this.update(dt));

    this.initialized = true;
    logger.info('OMNIS', 'APEX Initialized');
  }

  /**
   * 初始化市民
   */
  private async initCitizens(): Promise<void> {
    const initialCount = Math.min(100, this.modeConfig.citizenCount);
    const quantumEnabled = this.modeConfig.quantumEnabled;

    for (let i = 0; i < initialCount; i++) {
      const id = crypto.randomUUID();
      const birthYear = 2000 + Math.floor(Math.random() * 25);
      const birthMonth = 1 + Math.floor(Math.random() * 12);
      const birthDay = 1 + Math.floor(Math.random() * 28);

      const citizen = new ApexCitizen(
        id,
        `市民_${i}`,
        quantumEnabled,
        this.modeConfig.neuralNeurons,
        this.modeConfig.memoryCapacity,
        birthYear,
        birthMonth,
        birthDay
      );

      this.citizens.set(id, citizen);
    }

    logger.info('OMNIS', `${this.citizens.size} citizens spawned`);
  }

  /**
   * 游戏主更新
   */
  private update(deltaTime: number): void {
    // 更新宇宙时钟
    this.day++;
    if (this.day > 365) {
      this.day = 1;
      this.year++;
    }

    // 熵增系统
    this.updateEntropy(deltaTime);

    // 更新市民
    for (const citizen of this.citizens.values()) {
      citizen.update(deltaTime, this.entropy);
      if (citizen.isDead()) {
        this.citizens.delete(citizen.id);
      }
    }

    // 补充市民
    this.replenishCitizens();
  }

  /**
   * 更新熵值
   */
  private updateEntropy(deltaTime: number): void {
    // 基于市民活跃度调整熵增
    let activityLevel = 0;
    for (const citizen of this.citizens.values()) {
      if (citizen.state === 'active') activityLevel += 0.01;
    }

    this.entropy += this.modeConfig.entropyRate * deltaTime * (1 + activityLevel);
    this.entropy = Math.max(0, Math.min(1, this.entropy));
  }

  /**
   * 补充市民
   */
  private replenishCitizens(): void {
    const target = Math.min(100, Math.floor(this.modeConfig.citizenCount * 0.1));
    while (this.citizens.size < target) {
      const id = crypto.randomUUID();
      const citizen = new ApexCitizen(
        id,
        `市民_${Date.now()}`,
        this.modeConfig.quantumEnabled,
        this.modeConfig.neuralNeurons,
        this.modeConfig.memoryCapacity
      );
      this.citizens.set(id, citizen);
    }
  }

  /**
   * 启动游戏
   */
  public start(): void {
    if (!this.initialized) {
      logger.error('OMNIS', 'Not initialized');
      return;
    }
    logger.info('OMNIS', 'Starting...');
    this.gameLoop.start();
  }

  /**
   * 暂停游戏
   */
  public pause(): void {
    this.paused = true;
    this.gameLoop.stop();
  }

  /**
   * 恢复游戏
   */
  public resume(): void {
    this.paused = false;
    this.gameLoop.start();
  }

  /**
   * 获取宇宙状态
   */
  public getUniverseState(): UniverseState {
    return {
      year: this.year,
      day: this.day,
      entropy: this.entropy,
      epoch: this.getEpoch(),
      citizens: this.citizens.size,
      energy: this.getAverageEnergy(),
      biomass: this.getAverageHealth() * 0.6,
      computeQuota: this.getComputeQuota(),
      phase: this.getPhase(),
    };
  }

  private getEpoch(): string {
    if (this.entropy < 0.1) return '黄金时代';
    if (this.entropy < 0.3) return '稳定时代';
    if (this.entropy < 0.5) return '压力时代';
    if (this.entropy < 0.7) return '危机时代';
    if (this.entropy < 0.9) return '崩溃边缘';
    return '熵增纪元';
  }

  private getPhase(): UniverseState['phase'] {
    if (this.entropy < 0.1) return 'golden';
    if (this.entropy < 0.3) return 'stable';
    if (this.entropy < 0.5) return 'stressed';
    if (this.entropy < 0.7) return 'crisis';
    if (this.entropy < 0.9) return 'collapse';
    return 'entropy';
  }

  private getAverageEnergy(): number {
    if (this.citizens.size === 0) return 50;
    let total = 0;
    for (const c of this.citizens.values()) total += c.energy;
    return total / this.citizens.size;
  }

  private getAverageHealth(): number {
    if (this.citizens.size === 0) return 50;
    let total = 0;
    for (const c of this.citizens.values()) total += c.health;
    return total / this.citizens.size;
  }

  private getComputeQuota(): number {
    return this.citizens.size * this.modeConfig.neuralNeurons;
  }

  /**
   * 获取游戏状态
   */
  public getStatus(): GameStatus {
    return {
      initialized: this.initialized,
      running: this.gameLoop.isRunning(),
      paused: this.paused,
      mode: this.mode,
      universe: this.getUniverseState(),
    };
  }

  /**
   * 获取市民
   */
  public getCitizen(id: string): ApexCitizen | undefined {
    return this.citizens.get(id);
  }

  /**
   * 获取所有市民
   */
  public getAllCitizens(): ApexCitizen[] {
    return Array.from(this.citizens.values());
  }

  /**
   * 获取路径规划器
   */
  public getPathFinder(): PathFinder {
    return this.pathFinder;
  }
}

// ============================================================================
// 市民系统管理器
// ============================================================================

export class CitizenSystem {
  private citizens: Map<string, ApexCitizen> = new Map();
  private maxCitizens: number;
  private quantumEnabled: boolean;
  private neuralSize: number;
  private memoryCapacity: number;

  constructor(maxCitizens: number = 100, neuralSize: number = 64, memoryCapacity: number = 500) {
    this.maxCitizens = maxCitizens;
    this.quantumEnabled = true;
    this.neuralSize = neuralSize;
    this.memoryCapacity = memoryCapacity;
  }

  public createCitizen(name: string): ApexCitizen {
    const id = crypto.randomUUID();
    const citizen = new ApexCitizen(
      id,
      name,
      this.quantumEnabled,
      this.neuralSize,
      this.memoryCapacity
    );
    this.citizens.set(id, citizen);
    return citizen;
  }

  public getCitizen(id: string): ApexCitizen | undefined {
    return this.citizens.get(id);
  }

  public getAllCitizens(): ApexCitizen[] {
    return Array.from(this.citizens.values());
  }

  public removeCitizen(id: string): boolean {
    return this.citizens.delete(id);
  }

  public update(deltaTime: number, entropy: number): void {
    for (const citizen of this.citizens.values()) {
      citizen.update(deltaTime, entropy);
      if (citizen.isDead()) {
        this.citizens.delete(citizen.id);
      }
    }
  }

  public getCount(): number {
    return this.citizens.size;
  }
}

// ============================================================================
// 熵增系统
// ============================================================================

export interface EntropyStatus {
  entropy: number;
  epoch: string;
  year: number;
  day: number;
}

export class EntropySystem {
  private entropy: number = 0.1;
  private year: number = 1;
  private day: number = 1;
  private entropyRate: number;

  constructor(config: { entropyRate?: number } = {}) {
    this.entropyRate = config.entropyRate ?? 0.01;
  }

  public update(deltaTime: number): void {
    this.entropy += this.entropyRate * deltaTime;
    this.entropy = Math.max(0, Math.min(1, this.entropy));

    this.day++;
    if (this.day > 365) {
      this.day = 1;
      this.year++;
    }
  }

  public getStatus(): EntropyStatus {
    return {
      entropy: this.entropy,
      epoch: this.getEpoch(),
      year: this.year,
      day: this.day,
    };
  }

  private getEpoch(): string {
    if (this.entropy < 0.1) return '黄金时代';
    if (this.entropy < 0.3) return '稳定时代';
    if (this.entropy < 0.5) return '压力时代';
    if (this.entropy < 0.7) return '危机时代';
    if (this.entropy < 0.9) return '崩溃边缘';
    return '熵增纪元';
  }

  public getEntropy(): number {
    return this.entropy;
  }

  public setEntropy(value: number): void {
    this.entropy = Math.max(0, Math.min(1, value));
  }
}

// ============================================================================
// 导出
// ============================================================================

export const omnisGame = OMNISGame.getInstance();
export { APEX };
export default omnisGame;
