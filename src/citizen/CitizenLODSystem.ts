/**
 * =============================================================================
 * 永夜熵纪 - 三态市民模型（逻辑LOD）
 * Three-State Citizen Model with Level of Detail
 * 实现休眠态、背景态、激活态的平滑切换
 * =============================================================================
 */

import { QuantumNeuralDecisionEngine } from './QuantumNeuralEngine';
import { genomeManager, Genome, GeneType } from './GenomeSystem';
import { wasmQuantum } from '@/wasm/WasmBridge';
import type { WasmQuantumModule } from '@/types/global';
import { logger } from '@/core/utils/Logger';

/** 市民LOD状态 */
export enum CitizenLODState {
  /** 休眠态 - 不在视野内 */
  DORMANT = 'dormant',
  /** 背景态 - 在视野内但未选中 */
  BACKGROUND = 'background',
  /** 激活态 - 用户放大/点击/附身 */
  ACTIVE = 'active',
}

/** 市民基础属性 */
export interface CitizenBase {
  id: string;
  name: string;
  age: number;
  health: number;
  energy: number;
  position: { x: number; y: number; z: number };
  genome: Genome;
  /** LOD状态 */
  lodState: CitizenLODState;
  /** 最后更新时间 */
  lastUpdate: number;
  /** 交互计数 */
  interactionCount: number;
}

/** 休眠态市民 */
export interface DormantCitizen extends CitizenBase {
  lodState: CitizenLODState.DORMANT;
  /** 马尔可夫链状态 */
  markovState: DormantState;
  /** 宏观统计量 */
  statistics: CitizenStatistics;
}

/** 休眠态状态 */
export type DormantState = 'idle' | 'moving' | 'working' | 'resting';

/** 市民统计量 */
export interface CitizenStatistics {
  totalEnergy: number;
  avgHealth: number;
  totalWealth: number;
  socialActivity: number;
}

/** 背景态市民 */
export interface BackgroundCitizen extends CitizenBase {
  lodState: CitizenLODState.BACKGROUND;
  /** 简化SNN */
  snnState: SimplifiedSNNState;
  /** 基本感知 */
  perception: BasicPerception;
  /** 行为倾向 */
  behaviorTendency: BehaviorTendency;
}

/** 简化SNN状态 */
export interface SimplifiedSNNState {
  /** 膜电位 */
  membranePotential: number;
  /** 发放率 */
  firingRate: number;
  /** 突触权重摘要 */
  weightHash: string;
}

/** 基本感知 */
export interface BasicPerception {
  nearbyCitizens: string[];
  nearbyResources: ResourceType[];
  threatLevel: number;
  opportunityLevel: number;
}

/** 行为倾向 */
export interface BehaviorTendency {
  work: number;
  social: number;
  rest: number;
  explore: number;
}

/** 资源类型 */
export type ResourceType = 'food' | 'energy' | 'material' | 'knowledge';

/** 激活态市民 */
export interface ActiveCitizen extends CitizenBase {
  lodState: CitizenLODState.ACTIVE;
  /** 完整量子-神经混合引擎 */
  qnEngine: QuantumNeuralDecisionEngine;
  /** 长期记忆 */
  memories: MemoryVector[];
  /** 元认知模块 */
  metacognition: MetacognitionModule;
  /** 生理状态 */
  physiology: PhysiologyState;
  /** DID与钱包 */
  identity: CitizenIdentity;
  /** 语言模型对话 */
  dialogueHistory: DialogueEntry[];
  /** 强化学习策略 */
  rlStrategy: RLStrategy;
}

/** 记忆向量 */
export interface MemoryVector {
  id: string;
  embedding: number[];
  content: string;
  timestamp: number;
  importance: number;
  type: 'experience' | 'knowledge' | 'social' | 'emotion';
}

/** 元认知模块 */
export interface MetacognitionModule {
  selfAwareness: number;
  decisionQuality: number;
  learningEfficiency: number;
  socialStatus: number;
  goals: string[];
  lastReflection: number;
}

/** 生理状态 */
export interface PhysiologyState {
  muscle: number;
  metabolism: number;
  hormoneLevels: HormoneLevels;
  diseases: string[];
  fatigue: number;
}

/** 激素水平 */
export interface HormoneLevels {
  stress: number;     // 压力激素
  dopamine: number;   // 多巴胺
  serotonin: number;  // 血清素
  cortisol: number;   // 皮质醇
  oxytocin: number;   // 催产素
}

/** 市民身份 */
export interface CitizenIdentity {
  did: string;
  publicKey: string;
  privateKeyEncrypted: string;
  assets: number;
  reputation: number;
}

/** 对话条目 */
export interface DialogueEntry {
  timestamp: number;
  speaker: 'citizen' | 'user';
  content: string;
  sentiment: number;
}

/** 强化学习策略 */
export interface RLStrategy {
  survival: number;
  reproduction: number;
  wealth: number;
  social: number;
  learning: number;
}

/** 决策选项 */
interface DecisionOption {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  risk: number;
}

/** 三态市民系统 */
export class ThreeStateCitizenSystem {
  private dormantCitizens: Map<string, DormantCitizen> = new Map();
  private backgroundCitizens: Map<string, BackgroundCitizen> = new Map();
  private activeCitizens: Map<string, ActiveCitizen> = new Map();
  private viewPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private viewRadius: number = 100;
  private activatedCitizenIds: Set<string> = new Set();
  private maxActiveCitizens: number = 50;

  constructor() {}

  /**
   * 初始化市民系统
   */
  public init(wasmModule: WasmQuantumModule, initialCount: number = 100): void {
    for (let i = 0; i < initialCount; i++) {
      const citizen = this.createRandomCitizen(`citizen-${i}`, wasmModule);
      this.dormantCitizens.set(citizen.id, citizen);
    }

    logger.info('CitizenLODSystem', `Initialized ${initialCount} citizens`);
  }

  /**
   * 创建随机市民
   */
  public createRandomCitizen(id: string, _wasmModule: WasmQuantumModule): DormantCitizen {
    const genome = genomeManager.createRandomGenome();

    return {
      id,
      name: this.generateName(),
      age: Math.floor(Math.random() * 50) + 18,
      health: 0.8 + Math.random() * 0.2,
      energy: 0.7 + Math.random() * 0.3,
      position: {
        x: Math.random() * 1000 - 500,
        y: Math.random() * 1000 - 500,
        z: 0,
      },
      genome,
      lodState: CitizenLODState.DORMANT,
      lastUpdate: Date.now(),
      interactionCount: 0,
      markovState: 'idle',
      statistics: {
        totalEnergy: 100,
        avgHealth: 0.9,
        totalWealth: Math.random() * 1000,
        socialActivity: Math.random(),
      },
    };
  }

  /**
   * 生成随机名字
   */
  private generateName(): string {
    const surnames = ['李', '王', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高'];
    const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞'];
    return surnames[Math.floor(Math.random() * surnames.length)] + 
           givenNames[Math.floor(Math.random() * givenNames.length)];
  }

  /**
   * 更新视图位置
   */
  public updateView(position: { x: number; y: number; z: number }, radius: number): void {
    this.viewPosition = position;
    this.viewRadius = radius;
    this.updateLODStates();
  }

  /**
   * 更新LOD状态
   */
  private updateLODStates(): void {
    const toActivate: string[] = [];
    const toDeactivate: string[] = [];

    // 检查所有市民的视野距离
    for (const [id, citizen] of this.dormantCitizens) {
      const distance = this.getDistance(citizen.position, this.viewPosition);
      if (distance < this.viewRadius) {
        toActivate.push(id);
      }
    }

    for (const [id, citizen] of this.backgroundCitizens) {
      const distance = this.getDistance(citizen.position, this.viewPosition);
      if (distance >= this.viewRadius) {
        toDeactivate.push(id);
      }
    }

    // 执行状态切换
    for (const id of toActivate) {
      this.promoteToBackground(id);
    }

    for (const id of toDeactivate) {
      this.demoteToDormant(id);
    }
  }

  /**
   * 提升到背景态
   */
  private promoteToBackground(id: string): void {
    const citizen = this.dormantCitizens.get(id);
    if (!citizen) return;

    const backgroundCitizen: BackgroundCitizen = {
      ...citizen,
      lodState: CitizenLODState.BACKGROUND,
      snnState: {
        membranePotential: 0,
        firingRate: 0,
        weightHash: this.hashWeights(citizen.genome),
      },
      perception: this.createBasicPerception(citizen.position),
      behaviorTendency: this.createBehaviorTendency(citizen.genome),
    };

    this.dormantCitizens.delete(id);
    this.backgroundCitizens.set(id, backgroundCitizen);
  }

  /**
   * 降级到休眠态
   */
  private demoteToDormant(id: string): void {
    const citizen = this.backgroundCitizens.get(id);
    if (!citizen) return;

    // V5修复：BackgroundCitizen 没有 statistics 属性，创建默认值
    const dormantCitizen: DormantCitizen = {
      ...citizen,
      lodState: CitizenLODState.DORMANT,
      markovState: this.markovTransition(citizen.behaviorTendency),
      statistics: {
        totalEnergy: citizen.energy || 0,
        avgHealth: citizen.health || 0,
        totalWealth: 0,
        socialActivity: citizen.snnState.firingRate,
      },
    };

    this.backgroundCitizens.delete(id);
    this.dormantCitizens.set(id, dormantCitizen);
  }

  /**
   * 激活市民（用户点击）
   */
  public activateCitizen(id: string, wasmModule: WasmQuantumModule): ActiveCitizen | null {
    // 检查是否已达到最大激活数
    if (this.activeCitizens.size >= this.maxActiveCitizens) {
      // 找到最久未交互的激活市民降级
      let oldestId: string | null = null;
      let oldestTime = Infinity;
      for (const [citizenId, citizen] of this.activeCitizens) {
        if (citizen.interactionCount < oldestTime) {
          oldestTime = citizen.interactionCount;
          oldestId = citizenId;
        }
      }
      if (oldestId) {
        this.deactivateCitizen(oldestId);
      }
    }

    // 从任意状态提升到激活态
    let baseCitizen: CitizenBase | null = null;
    
    const dormant = this.dormantCitizens.get(id);
    if (dormant) {
      baseCitizen = { ...dormant };
      this.dormantCitizens.delete(id);
    } else {
      const background = this.backgroundCitizens.get(id);
      if (background) {
        baseCitizen = { ...background };
        this.backgroundCitizens.delete(id);
      }
    }

    if (!baseCitizen) return null;

    // 创建完整的激活态市民
    const activeCitizen = this.createActiveCitizen(baseCitizen, wasmModule);
    this.activeCitizens.set(id, activeCitizen);
    this.activatedCitizenIds.add(id);
    activeCitizen.interactionCount++;

    return activeCitizen;
  }

  /**
   * 创建激活态市民
   */
  private createActiveCitizen(base: CitizenBase, wasmModule: WasmQuantumModule): ActiveCitizen {
    // 初始化量子神经引擎
    const qnEngine = new QuantumNeuralDecisionEngine({
      numQubits: 16,
      numNeurons: 256,
      numInputs: 32,
    });
    qnEngine.init(wasmModule);

    return {
      ...base,
      lodState: CitizenLODState.ACTIVE,
      qnEngine,
      memories: this.initializeMemories(),
      metacognition: {
        selfAwareness: 0.5,
        decisionQuality: 0.5,
        learningEfficiency: 0.5,
        socialStatus: 0.5,
        goals: ['survive', 'thrive'],
        lastReflection: Date.now(),
      },
      physiology: this.initializePhysiology(),
      identity: this.generateIdentity(base.id),
      dialogueHistory: [],
      rlStrategy: {
        survival: 0.3,
        reproduction: 0.2,
        wealth: 0.2,
        social: 0.2,
        learning: 0.1,
      },
    };
  }

  /**
   * 初始化记忆
   */
  private initializeMemories(): MemoryVector[] {
    return [{
      id: crypto.randomUUID(),
      embedding: new Array(256).fill(0).map(() => Math.random() * 2 - 1),
      content: '创世纪记忆',
      timestamp: Date.now(),
      importance: 1.0,
      type: 'experience',
    }];
  }

  /**
   * 初始化生理状态
   */
  private initializePhysiology(): PhysiologyState {
    return {
      muscle: 0.8,
      metabolism: 1.0,
      hormoneLevels: {
        stress: 0.2,
        dopamine: 0.5,
        serotonin: 0.5,
        cortisol: 0.2,
        oxytocin: 0.3,
      },
      diseases: [],
      fatigue: 0.1,
    };
  }

  /**
   * 生成身份
   */
  private generateIdentity(citizenId: string): CitizenIdentity {
    // 生成Ed25519密钥对（简化版）
    return {
      did: `did:entropy:${citizenId}`,
      publicKey: crypto.getRandomValues(new Uint8Array(32)).toString(),
      privateKeyEncrypted: '',
      assets: Math.random() * 1000,
      reputation: 50,
    };
  }

  /**
   * 停用市民
   */
  public deactivateCitizen(id: string): void {
    const citizen = this.activeCitizens.get(id);
    if (!citizen) return;

    // 保存关键状态
    const dormantCitizen: DormantCitizen = {
      ...citizen,
      lodState: CitizenLODState.DORMANT,
      markovState: 'idle',
      statistics: {
        totalEnergy: citizen.physiology.metabolism * 100,
        avgHealth: citizen.health,
        totalWealth: citizen.identity.assets,
        socialActivity: 0.5,
      },
    };

    this.activeCitizens.delete(id);
    this.activatedCitizenIds.delete(id);
    this.dormantCitizens.set(id, dormantCitizen);
  }

  /**
   * 马尔可夫链状态转移
   */
  private markovTransition(tendency: BehaviorTendency): DormantState {
    const r = Math.random();
    const cumProb = {
      idle: tendency.rest,
      moving: tendency.explore,
      working: tendency.work,
      resting: tendency.rest * 0.5,
    };
    const total = cumProb.idle + cumProb.moving + cumProb.working + cumProb.resting;
    
    let p = r * total;
    if (p < cumProb.idle) return 'idle';
    p -= cumProb.idle;
    if (p < cumProb.moving) return 'moving';
    p -= cumProb.moving;
    if (p < cumProb.working) return 'working';
    return 'resting';
  }

  /**
   * 创建基本感知
   */
  private createBasicPerception(position: { x: number; y: number; z: number }): BasicPerception {
    return {
      nearbyCitizens: [],
      nearbyResources: ['food', 'energy', 'material', 'knowledge'].filter(() => Math.random() > 0.7) as ResourceType[],
      threatLevel: Math.random(),
      opportunityLevel: Math.random(),
    };
  }

  /**
   * 创建行为倾向
   */
  private createBehaviorTendency(genome: Genome): BehaviorTendency {
    const work = genomeManager.getPhenotypeValue(genome, GeneType.COGNITIVE);
    const social = genomeManager.getPhenotypeValue(genome, GeneType.SOCIAL);
    
    return {
      work: work * 0.8,
      social: social * 0.6,
      rest: 0.3 - work * 0.2,
      explore: 0.2 + Math.random() * 0.3,
    };
  }

  /**
   * 哈希权重
   */
  private hashWeights(genome: Genome): string {
    let hash = 0;
    for (const gene of genome.genes) {
      hash ^= gene.value * 31;
    }
    return hash.toString(16);
  }

  /**
   * 获取距离
   */
  private getDistance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 更新休眠态市民（批量）
   */
  public updateDormantCitizens(dt: number): void {
    for (const citizen of this.dormantCitizens.values()) {
      // 元胞自动机更新
      const behaviorTendency = { work: 0.3, social: 0.2, rest: 0.3, explore: 0.2 };
      citizen.markovState = this.markovTransition(behaviorTendency);
      
      // 简单位置更新
      if (citizen.markovState === 'moving') {
        citizen.position.x += (Math.random() - 0.5) * dt * 10;
        citizen.position.y += (Math.random() - 0.5) * dt * 10;
      }
      
      citizen.lastUpdate = Date.now();
    }
  }

  /**
   * 更新背景态市民
   */
  public updateBackgroundCitizens(dt: number): void {
    for (const citizen of this.backgroundCitizens.values()) {
      // 简化SNN更新
      citizen.snnState.membranePotential += dt * 0.1;
      citizen.snnState.firingRate = Math.max(0, Math.min(1, citizen.snnState.membranePotential - 0.5));
      
      // 行为更新
      this.updateBackgroundBehavior(citizen, dt);
      citizen.lastUpdate = Date.now();
    }
  }

  /**
   * 更新背景态行为
   */
  private updateBackgroundBehavior(citizen: BackgroundCitizen, dt: number): void {
    const { behaviorTendency, perception } = citizen;
    
    // 简化的行为决策
    const totalTendency = behaviorTendency.work + behaviorTendency.social + 
                          behaviorTendency.rest + behaviorTendency.explore;
    
    if (totalTendency > 0) {
      // 根据倾向移动
      const moveX = (behaviorTendency.explore - behaviorTendency.rest) * dt * 5;
      const moveY = (behaviorTendency.social - behaviorTendency.work) * dt * 5;
      citizen.position.x += moveX;
      citizen.position.y += moveY;
    }

    // 能量消耗
    citizen.energy -= dt * 0.01;
    citizen.energy = Math.max(0, Math.min(1, citizen.energy));
  }

  /**
   * 更新激活态市民
   */
  public async updateActiveCitizens(dt: number): Promise<void> {
    for (const citizen of this.activeCitizens.values()) {
      // 完整量子神经更新
      await this.updateActiveCitizen(citizen, dt);
    }
  }

  /**
   * 更新单个激活态市民
   */
  private async updateActiveCitizen(citizen: ActiveCitizen, dt: number): Promise<void> {
    // 1. 更新生理状态
    this.updatePhysiology(citizen, dt);
    
    // 2. 更新元认知
    this.updateMetacognition(citizen, dt);
    
    // 3. 量子神经决策
    const context = this.buildDecisionContext(citizen);
    const options = this.buildDecisionOptions(citizen);
    
    citizen.qnEngine.makeDecision(options, context);
    
    // 4. 强化学习更新
    this.updateRLStrategy(citizen, dt);
    
    // 5. 更新位置（基于决策）
    this.updateActivePosition(citizen, dt);
    
    citizen.lastUpdate = Date.now();
  }

  /**
   * 更新生理状态
   */
  private updatePhysiology(citizen: ActiveCitizen, dt: number): void {
    const { physiology } = citizen;
    
    // 肌肉疲劳恢复/消耗
    physiology.fatigue += dt * 0.05;
    physiology.muscle -= dt * 0.005;
    physiology.fatigue = Math.max(0, physiology.fatigue - dt * 0.02);
    physiology.muscle = Math.min(1, physiology.muscle + dt * 0.001);
    
    // 新陈代谢
    const baseMetabolism = 1.0;
    physiology.metabolism = baseMetabolism;
    
    // 激素动态
    const stressDecay = 0.1;
    const dopamineBase = 0.5;
    physiology.hormoneLevels.stress = Math.max(0, physiology.hormoneLevels.stress - dt * stressDecay);
    physiology.hormoneLevels.dopamine = dopamineBase + 
      (physiology.hormoneLevels.oxytocin - 0.5) * 0.2 - 
      physiology.hormoneLevels.cortisol * 0.1;
    physiology.hormoneLevels.serotonin = 0.5 + (physiology.metabolism - 1.0) * 0.1;
    
    // 限制范围
    physiology.fatigue = Math.max(0, Math.min(1, physiology.fatigue));
    physiology.muscle = Math.max(0, Math.min(1, physiology.muscle));
  }

  /**
   * 更新元认知
   */
  private updateMetacognition(citizen: ActiveCitizen, dt: number): void {
    const metacog = citizen.metacognition;
    const now = Date.now();
    
    // 每分钟自省一次
    if (now - metacog.lastReflection > 60000) {
      metacog.selfAwareness = Math.min(1, metacog.selfAwareness + dt * 0.01);
      metacog.learningEfficiency = Math.max(0, Math.min(1, 
        metacog.learningEfficiency + (Math.random() - 0.5) * 0.1
      ));
      metacog.decisionQuality = (metacog.decisionQuality + citizen.qnEngine.getStats().avgConfidence) / 2;
      metacog.lastReflection = now;
    }
  }

  /**
   * 构建决策上下文
   */
  private buildDecisionContext(citizen: ActiveCitizen): number[] {
    const { physiology, metacognition, identity } = citizen;
    
    return [
      physiology.muscle,
      physiology.metabolism,
      physiology.hormoneLevels.stress,
      physiology.hormoneLevels.dopamine,
      physiology.fatigue,
      citizen.health,
      citizen.energy,
      identity.assets,
      identity.reputation / 100,
      metacognition.selfAwareness,
      metacognition.decisionQuality,
      metacognition.learningEfficiency,
      metacognition.socialStatus,
      // ... 填充到32维
      ...new Array(20).fill(0).map(() => Math.random()),
    ];
  }

  /**
   * 构建决策选项
   */
  private buildDecisionOptions(citizen: ActiveCitizen): DecisionOption[] {
    const { physiology } = citizen;
    
    return [
      {
        id: 'work',
        name: '工作',
        description: '进行生产活动',
        energyCost: 30 * physiology.metabolism,
        risk: 0.1,
      },
      {
        id: 'social',
        name: '社交',
        description: '与他人互动',
        energyCost: 15,
        risk: 0.2,
      },
      {
        id: 'rest',
        name: '休息',
        description: '恢复体力',
        energyCost: 5,
        risk: 0,
      },
      {
        id: 'explore',
        name: '探索',
        description: '发现新机会',
        energyCost: 25,
        risk: 0.4,
      },
    ];
  }

  /**
   * 更新RL策略
   */
  private updateRLStrategy(citizen: ActiveCitizen, dt: number): void {
    const { rlStrategy, physiology } = citizen;
    const learningRate = 0.01;
    
    // 根据生理状态调整策略权重
    if (physiology.fatigue > 0.7) {
      rlStrategy.survival += learningRate * (1 - rlStrategy.survival);
      rlStrategy.reproduction -= learningRate * rlStrategy.reproduction * 0.5;
    } else if (physiology.hormoneLevels.dopamine > 0.6) {
      rlStrategy.social += learningRate * 0.5;
      rlStrategy.wealth += learningRate * 0.5;
    }
    
    // 归一化
    const total = rlStrategy.survival + rlStrategy.reproduction + 
                   rlStrategy.wealth + rlStrategy.social + rlStrategy.learning;
    if (total > 0) {
      rlStrategy.survival /= total;
      rlStrategy.reproduction /= total;
      rlStrategy.wealth /= total;
      rlStrategy.social /= total;
      rlStrategy.learning /= total;
    }
  }

  /**
   * 更新激活态位置
   */
  private updateActivePosition(citizen: ActiveCitizen, dt: number): void {
    const decision = citizen.qnEngine.getHistory().slice(-1)[0];
    if (!decision) return;
    
    const selectedOption = decision.options[decision.selectedIndex];
    if (!selectedOption) return;
    
    switch (selectedOption.id) {
      case 'work':
        // 待在原地工作
        break;
      case 'social':
        citizen.position.x += (Math.random() - 0.5) * dt * 20;
        citizen.position.y += (Math.random() - 0.5) * dt * 20;
        break;
      case 'rest':
        // 待在原地
        break;
      case 'explore':
        citizen.position.x += (Math.random() - 0.5) * dt * 50;
        citizen.position.y += (Math.random() - 0.5) * dt * 50;
        break;
    }
  }

  /**
   * 获取市民（任意状态）
   */
  public getCitizen(id: string): DormantCitizen | BackgroundCitizen | ActiveCitizen | undefined {
    return this.dormantCitizens.get(id) || 
           this.backgroundCitizens.get(id) || 
           this.activeCitizens.get(id);
  }

  /**
   * 获取各状态市民数量
   */
  public getStats(): { dormant: number; background: number; active: number; total: number } {
    return {
      dormant: this.dormantCitizens.size,
      background: this.backgroundCitizens.size,
      active: this.activeCitizens.size,
      total: this.dormantCitizens.size + this.backgroundCitizens.size + this.activeCitizens.size,
    };
  }

  /**
   * 获取所有激活市民
   */
  public getActiveCitizens(): ActiveCitizen[] {
    return Array.from(this.activeCitizens.values());
  }
}

// 导出单例
export const citizenLODSystem = new ThreeStateCitizenSystem();
export default citizenLODSystem;
