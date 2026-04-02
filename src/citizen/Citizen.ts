/**
 * 市民核心系统
 * 实现市民的三态模型（休眠态/背景态/激活态）和 LOD 系统
 * 集成WASM量子决策和脉冲神经网络
 */

import { EntityId, createEntityId, Vec2, Vec3 } from '@/core/types';
import { CitizenStateType, LODLevel, LOD_DISTANCES } from '@/core/constants';
import { isWasmReady, wasmQuantum, wasmSNN, wasmPathFinder } from '@/wasm/WasmBridge';
import { logger } from '@/core/utils/Logger';
import type {
  Genome,
  Phenotype,
  Memory,
  CitizenState,
  CitizenPosition,
  CitizenRelation,
  Decision,
  Interaction,
  CitizenSnapshot,
  CitizenStatistics,
  ExtendedGenome,
} from '@/core/types/citizen';
import { RelationType } from '@/core/types/citizen';
import { genomeManager, GeneInfluenceMapper, geneInfluenceMapper, GeneType, Gene, Genome as ExtendedGenomeType } from './GenomeSystem';
import {
  MetaCognitionEngine,
  MetaCognitionState,
  ValueSystem,
  Goal,
  Reflection,
  IntrospectionReport,
  DecisionEvaluation,
  GoalType,
  GoalStatus,
} from './MetaCognitionEngine';
import {
  MetaCognitionDecisionMapper,
  DecisionAction,
  DecisionWeights,
  MetaCognitionInfluence,
  DecisionContext,
} from './MetaCognitionDecisionMapper';
import type { CitizenActivityModifier } from '@/world/DayNightCycle';
import type { WeatherCitizenImpact } from '@/world/WeatherEffects';

/** 决策选项 */
type DecisionOption = 'work' | 'rest' | 'socialize' | 'explore' | 'migrate';

/** 决策结果 */
interface DecisionResult {
  action: DecisionOption;
  confidence: number;
  coherence: number;
  neuralActivity: number;
}

/** 市民属性 */
interface CitizenAttributes {
  intelligence: number;
  socialStatus: number;
  strength: number;
  agility: number;
  charisma: number;
  politicalAlignment: number;
  economicPreference: number;
  [key: string]: number;
}

/** 八字属性 */
export interface BaZiAttributes {
  year: { stem: string; branch: string; element: string };
  month: { stem: string; branch: string; element: string };
  day: { stem: string; branch: string; element: string };
  hour: { stem: string; branch: string; element: string };
  elementStrength: string;
  dayMasterStrength: string;
}

/** 情景记忆 */
export interface EpisodicMemory {
  id: string;
  eventType: 'interaction' | 'achievement' | 'conflict' | 'discovery' | 'loss' | 'celebration' | 'travel' | 'work';
  title: string;
  description: string;
  participants: string[];
  location: { x: number; y: number };
  timestamp: number;
  emotionalValence: number;
  emotionalIntensity: number;
  importance: number;
  tags: string[];
  retrievalCues: string[];
  accessCount: number;
  lastAccessedAt: number;
}

/** 关系网络节点 */
export interface RelationshipNode {
  id: string;
  name: string;
  type: 'self' | 'citizen';
  relationType?: string;
  intimacy: number;
}

/** 关系网络边 */
export interface RelationshipEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
  establishedAt: number;
}

/** 关系网络数据 */
export interface RelationshipNetworkData {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
  statistics: {
    totalRelations: number;
    averageIntimacy: number;
    typeDistribution: Record<string, number>;
    strongestRelation: { targetId: string; intimacy: number } | null;
  };
}

/**
 * 市民
 */
export class Citizen {
  /** 唯一标识 */
  public readonly id: EntityId;

  /** 名称 */
  public name: string;

  /** 年龄（游戏时间年） */
  public age: number = 0;

  /** 属性（派生自表现型） */
  public attributes: CitizenAttributes;

  /** 基因组 */
  public genome: Genome;

  /** 表现型 */
  public phenotype: Phenotype;

  /** 当前状态 */
  public state: CitizenState;

  /** 位置 */
  public position: CitizenPosition;

  /** 记忆列表 */
  public memories: Memory[] = [];

  /** 关系列表 */
  public relations: CitizenRelation[] = [];

  /** 创建时间 */
  public readonly createdAt: number;

  /** 更新时间 */
  public updatedAt: number;

  /** LOD 级别 */
  private lodLevel: LODLevel = LODLevel.CLOUD;

  /** 所属世界 ID */
  public worldId: EntityId;

  /** 最后活动时间 */
  public lastActiveTime: number = 0;

  /** 是否可见 */
  public visible: boolean = true;

  /** 当前决策 */
  public currentDecision: DecisionResult | null = null;

  /** 八字属性（创建时计算） */
  public baZi: BaZiAttributes | null = null;

  /** 量子态是否有效 */
  private quantumValid: boolean = false;

  /** SNN发放率历史 */
  private firingRateHistory: number[] = [];

  /** 基因影响的行为概率 */
  public geneticBehaviorProbabilities: Map<string, number> = new Map();

  /** 基因影响的属性加成 */
  public geneticAttributeBonuses: Map<string, number> = new Map();

  /** 扩展基因组（来自GenomeSystem） */
  private extendedGenome: ExtendedGenomeType | null = null;

  /** 元认知引擎 */
  private metaCognitionEngine: MetaCognitionEngine;

  /** 元认知决策映射器 */
  private metaDecisionMapper: MetaCognitionDecisionMapper;

  /** 元认知状态 */
  public metaCognitionState: MetaCognitionState;

  /** 元认知决策影响（最新计算结果） */
  public lastMetaInfluence: MetaCognitionInfluence | null = null;

  /** 决策前状态快照（用于反思） */
  private preDecisionState: {
    mood: number;
    energy: number;
    health: number;
    timestamp: number;
  } | null = null;

  /** 最近决策记录（用于元认知） */
  private recentDecisions: Array<{
    id: string;
    action: string;
    confidence: number;
    moodBefore: number;
    energyBefore: number;
    timestamp: number;
    outcome?: 'positive' | 'negative' | 'neutral' | 'mixed';
  }> = [];

  /** 情景记忆存储 */
  private episodicMemory: EpisodicMemory[] = [];

  /** 性格特质 */
  public personalityTraits: import('./PersonalitySystem').PersonalityTraits | null = null;

  /** 司法状态 */
  public judicialState: import('../governance/DAOSystem').CitizenJudicialState = {
    citizenId: '',
    isImprisoned: false,
    isExiled: false,
    isOnProbation: false,
    restrictedRights: [],
    pendingSentences: [],
    totalFines: 0,
    totalImprisonmentDays: 0,
    criminalRecord: 0,
  };

  /** 金钱（用于罚款等） */
  public money: number = 100;

  /** 自由度（0-100，监禁时降低） */
  public freedom: number = 100;

  constructor(
    worldId: EntityId,
    name: string,
    genome?: Genome,
    position?: Vec2,
    baZi?: BaZiAttributes
  ) {
    this.id = createEntityId();
    this.worldId = worldId;
    this.name = name;
    this.genome = genome || this.generateRandomGenome();
    this.phenotype = this.derivePhenotype(this.genome);
    this.position = this.initPosition(position);
    this.state = this.initState();
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    this.baZi = baZi || null;
    
    this.initializeGeneticInfluences();
    
    this.attributes = {
      intelligence: this.phenotype.abilities.intelligence,
      socialStatus: this.phenotype.adaptability.social,
      strength: this.phenotype.abilities.strength,
      agility: this.phenotype.abilities.agility,
      charisma: this.phenotype.abilities.charisma,
      politicalAlignment: 0.5,
      economicPreference: 0.5,
    };
    
    this.applyGeneticAttributeBonuses();
    
    if (baZi) {
      this.applyBaZiToPhenotype(baZi);
    }

    this.metaCognitionEngine = new MetaCognitionEngine({
      reflectionFrequency: 0.1 + this.phenotype.abilities.intelligence * 0.1,
      selfAwarenessGrowthRate: 0.001 + this.phenotype.adaptability.learning * 0.002,
    });
    this.metaCognitionState = this.metaCognitionEngine.getState();
    this.metaDecisionMapper = new MetaCognitionDecisionMapper();

    this.initializePersonality();
    this.initializeEpisodicMemory();
    
    this.judicialState.citizenId = this.id;
  }

  private initializeEpisodicMemory(): void {
    const birthEvent = this.createBirthMemory();
    this.episodicMemory = [birthEvent];
  }

  private createBirthMemory(): EpisodicMemory {
    const birthDescriptions = [
      `在${this.getCurrentSeason()}的一个${this.getTimeOfDay()}，${this.name}来到了这个世界`,
      `${this.name}诞生于这片土地，开始了TA的人生旅程`,
      `新生命${this.name}降临，为世界带来新的希望`,
    ];

    return {
      id: crypto.randomUUID(),
      eventType: 'celebration',
      title: '诞生',
      description: birthDescriptions[Math.floor(Math.random() * birthDescriptions.length)],
      participants: [],
      location: { x: this.position.grid.x, y: this.position.grid.y },
      timestamp: this.createdAt,
      emotionalValence: 0.8,
      emotionalIntensity: 0.9,
      importance: 1.0,
      tags: ['birth', 'life', 'beginning'],
      retrievalCues: ['诞生', '出生', this.name, this.getCurrentSeason()],
      accessCount: 0,
      lastAccessedAt: this.createdAt,
    };
  }

  /**
   * 初始化基因影响
   */
  private initializeGeneticInfluences(): void {
    if (this.isExtendedGenome(this.genome)) {
      this.extendedGenome = this.genome as unknown as ExtendedGenomeType;
      const summary = geneInfluenceMapper.getInfluenceSummary(this.genome as unknown as ExtendedGenomeType);
      this.geneticBehaviorProbabilities = summary.behaviors;
      this.geneticAttributeBonuses = summary.attributes;
    } else {
      this.geneticBehaviorProbabilities = this.deriveBehaviorProbabilitiesFromSimpleGenome();
      this.geneticAttributeBonuses = this.deriveAttributeBonusesFromSimpleGenome();
    }
  }

  /**
   * 检查是否为扩展基因组
   */
  private isExtendedGenome(genome: any): genome is { genes: Gene[] } {
    return genome && Array.isArray(genome.genes) && 
           genome.genes.length > 0 && 
           typeof genome.genes[0] === 'object' && 
           'type' in genome.genes[0];
  }

  /**
   * 检查扩展基因组格式（别名方法）
   */
  private isExtendedGenomeFormat(genome: any): genome is { genes: Gene[] } {
    return this.isExtendedGenome(genome);
  }

  /**
   * 从简单基因组派生行为概率
   */
  private deriveBehaviorProbabilitiesFromSimpleGenome(): Map<string, number> {
    const genes = Uint8Array.from(atob(this.genome.genes), c => c.charCodeAt(0));
    const probabilities = new Map<string, number>();
    
    const workGene = (genes[10] + genes[11]) / 2 / 255;
    const socialGene = genes[6] / 255;
    const exploreGene = genes[7] / 255;
    
    probabilities.set('work', 0.2 + workGene * 0.15);
    probabilities.set('rest', 0.15 + (1 - workGene) * 0.1);
    probabilities.set('socialize', 0.2 + socialGene * 0.15);
    probabilities.set('explore', 0.15 + exploreGene * 0.15);
    probabilities.set('migrate', 0.1);
    probabilities.set('learn', 0.2 + workGene * 0.1);
    
    const total = Array.from(probabilities.values()).reduce((a, b) => a + b, 0);
    for (const [key, value] of probabilities) {
      probabilities.set(key, value / total);
    }
    
    return probabilities;
  }

  /**
   * 从简单基因组派生属性加成
   */
  private deriveAttributeBonusesFromSimpleGenome(): Map<string, number> {
    const genes = Uint8Array.from(atob(this.genome.genes), c => c.charCodeAt(0));
    const bonuses = new Map<string, number>();
    
    bonuses.set('intelligence', (genes[10] + genes[11]) / 2 / 255 * 0.2);
    bonuses.set('strength', (genes[12] + genes[13]) / 2 / 255 * 0.2);
    bonuses.set('agility', (genes[14] + genes[15]) / 2 / 255 * 0.2);
    bonuses.set('charisma', (genes[18] + genes[19]) / 2 / 255 * 0.2);
    bonuses.set('constitution', genes[20] / 255 * 0.15);
    bonuses.set('health', genes[22] / 255 * 0.15);
    
    return bonuses;
  }

  /**
   * 应用基因属性加成
   */
  private applyGeneticAttributeBonuses(): void {
    for (const [attr, bonus] of this.geneticAttributeBonuses) {
      if (attr in this.attributes) {
        this.attributes[attr] = Math.min(1, 
          Math.max(0, this.attributes[attr] + bonus)
        );
      }
    }
    
    if (this.geneticAttributeBonuses.has('intelligence')) {
      this.phenotype.abilities.intelligence = Math.min(1,
        this.phenotype.abilities.intelligence + (this.geneticAttributeBonuses.get('intelligence') || 0)
      );
    }
    if (this.geneticAttributeBonuses.has('strength')) {
      this.phenotype.abilities.strength = Math.min(1,
        this.phenotype.abilities.strength + (this.geneticAttributeBonuses.get('strength') || 0)
      );
    }
    if (this.geneticAttributeBonuses.has('agility')) {
      this.phenotype.abilities.agility = Math.min(1,
        this.phenotype.abilities.agility + (this.geneticAttributeBonuses.get('agility') || 0)
      );
    }
    if (this.geneticAttributeBonuses.has('charisma')) {
      this.phenotype.abilities.charisma = Math.min(1,
        this.phenotype.abilities.charisma + (this.geneticAttributeBonuses.get('charisma') || 0)
      );
    }
  }

  /**
   * 应用八字属性到表现型
   */
  private applyBaZiToPhenotype(baZi: BaZiAttributes): void {
    // 根据五行调整能力值 - V5修复：移除不存在的 adaptability 属性
    const elementBonus: Record<string, Partial<{
      intelligence: number; strength: number; agility: number; charisma: number;
    }>> = {
      '木': { intelligence: 0.1, agility: 0.1 },
      '火': { strength: 0.15, charisma: 0.05 },
      '土': { strength: 0.1, intelligence: 0.05 },
      '金': { agility: 0.15, strength: 0.1 },
      '水': { intelligence: 0.15, charisma: 0.1 },
    };

    const dayElement = baZi.day.element;
    const bonus = elementBonus[dayElement] || {};

    // 应用五行加成到能力
    Object.keys(bonus).forEach((key) => {
      const k = key as keyof typeof bonus;
      if (bonus[k] && key in this.phenotype.abilities) {
        this.phenotype.abilities[key] = Math.min(1, 
          this.phenotype.abilities[key] + (bonus[k] as number)
        );
      }
    });
  }

  /**
   * 生成随机基因组
   */
  private generateRandomGenome(): Genome {
    const geneCount = 32;
    const genes = new Uint8Array(geneCount);
    for (let i = 0; i < geneCount; i++) {
      genes[i] = Math.floor(Math.random() * 256);
    }

    return {
      genes: btoa(String.fromCharCode(...genes)),
      geneCount,
      mutationRate: 0.001,
      crossoverRate: 0.7,
    };
  }

  /**
   * 从基因组派生表现型
   */
  private derivePhenotype(genome: Genome): Phenotype {
    const genes = Uint8Array.from(atob(genome.genes), c => c.charCodeAt(0));

    return {
      appearance: {
        bodyType: genes[0] / 255,
        skinTone: genes[1] / 255,
        eyeColor: genes[2] / 255,
        hairStyle: Math.floor((genes[3] / 255) * 10),
        clothingStyle: Math.floor((genes[4] / 255) * 20),
      },
      behavior: {
        aggression: genes[5] / 255,
        sociability: genes[6] / 255,
        curiosity: genes[7] / 255,
        stability: genes[8] / 255,
        冒险精神: genes[9] / 255,
      },
      abilities: {
        intelligence: (genes[10] + genes[11]) / 2 / 255,
        strength: (genes[12] + genes[13]) / 2 / 255,
        agility: (genes[14] + genes[15]) / 2 / 255,
        perception: (genes[16] + genes[17]) / 2 / 255,
        charisma: (genes[18] + genes[19]) / 2 / 255,
      },
      adaptability: {
        environment: genes[20] / 255,
        social: genes[21] / 255,
        stress: genes[22] / 255,
        learning: genes[23] / 255,
      },
    };
  }

  /**
   * 初始化位置
   */
  private initPosition(gridPos?: Vec2): CitizenPosition {
    return {
      grid: gridPos || { x: Math.random() * 100, y: Math.random() * 100 },
      world: { x: Math.random() * 1000, y: 0, z: Math.random() * 1000 },
      altitude: 0,
    };
  }

  /**
   * 初始化状态
   */
  private initState(): CitizenState {
    return {
      type: CitizenStateType.BACKGROUND,
      energy: 100,
      health: 100,
      mood: 50,
      hunger: 100,
    };
  }

  /**
   * ========== WASM量子决策系统 ==========
   */

  /**
   * 使用WASM量子模拟器进行决策
   * 这是市民"量子叠加态"决策的核心
   * 集成元认知影响
   */
  public makeQuantumDecision(): DecisionResult {
    if (this.state.type !== CitizenStateType.ACTIVE) {
      return this.makeMetaCognitiveDecision();
    }

    try {
      const metaInfluence = this.computeMetaCognitiveInfluence();
      this.lastMetaInfluence = metaInfluence;

      const decisionOptions: DecisionOption[] = ['work', 'rest', 'socialize', 'explore', 'migrate'];
      
      const metaWeights = this.extractMetaWeights(metaInfluence.finalWeights, decisionOptions);
      
      wasmQuantum.applyDecisionState(decisionOptions);

      const quantumResult = wasmQuantum.measure();

      const measurements = quantumResult.measurements;
      let actionIndex = 0;
      if (measurements && measurements.length > 0) {
        let sum = 0;
        for (let i = 0; i < Math.min(measurements.length, decisionOptions.length); i++) {
          sum += measurements[i];
        }
        actionIndex = sum % decisionOptions.length;
      } else {
        actionIndex = Math.floor(quantumResult.confidence * decisionOptions.length);
      }
      
      let action = decisionOptions[Math.min(actionIndex, decisionOptions.length - 1)];

      const valueAdjustment = this.metaDecisionMapper.computeValueDrivenAdjustment(
        this.metaCognitionEngine.getValues(),
        action as DecisionAction,
        this.metaCognitionState
      );
      
      if (valueAdjustment.adjusted) {
        action = valueAdjustment.newAction as DecisionOption;
      }

      const firingRate = wasmSNN.getFiringRate(100);

      this.currentDecision = {
        action,
        confidence: quantumResult.confidence * (1 + metaInfluence.selfAwarenessModifier * 0.2),
        coherence: quantumResult.coherence,
        neuralActivity: firingRate,
      };

      console.log(`[Citizen ${this.name}] Quantum decision: ${action} (confidence: ${quantumResult.confidence.toFixed(2)}, coherence: ${quantumResult.coherence.toFixed(2)}, value: ${metaInfluence.dominantValue})`);

      return this.currentDecision;
    } catch (error) {
      console.warn(`[Citizen ${this.id}] Quantum decision failed:`, error);
      return this.makeMetaCognitiveDecision();
    }
  }

  /**
   * 计算元认知决策影响
   */
  private computeMetaCognitiveInfluence(): MetaCognitionInfluence {
    const context: DecisionContext = {
      energy: this.state.energy,
      mood: this.state.mood,
      health: this.state.health,
      hunger: this.state.hunger,
      timeOfDay: this.getTimeOfDay(),
      nearbyCitizens: this.relations.filter(r => r.intimacy > 0.3).length,
    };

    return this.metaDecisionMapper.computeDecisionWeights(
      this.metaCognitionEngine.getValues(),
      this.metaCognitionEngine.getGoals(),
      this.metaCognitionEngine.getReflectionHistory(),
      this.metaCognitionState,
      context
    );
  }

  /**
   * 从元认知权重提取指定行动的权重
   */
  private extractMetaWeights(metaWeights: DecisionWeights, actions: DecisionOption[]): Record<string, number> {
    const weights: Record<string, number> = {};
    for (const action of actions) {
      weights[action] = metaWeights[action] || 0.1;
    }
    return weights;
  }

  /**
   * 元认知驱动决策（备用）
   */
  private makeMetaCognitiveDecision(): DecisionResult {
    const metaInfluence = this.computeMetaCognitiveInfluence();
    this.lastMetaInfluence = metaInfluence;

    const decisionOptions: DecisionOption[] = ['work', 'rest', 'socialize', 'explore', 'migrate'];
    const weights = this.extractMetaWeights(metaInfluence.finalWeights, decisionOptions);
    
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedAction: DecisionOption = 'work';

    for (const [action, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        selectedAction = action as DecisionOption;
        break;
      }
    }

    return {
      action: selectedAction,
      confidence: 0.5 + metaInfluence.selfAwarenessModifier * 0.3,
      coherence: 0.8,
      neuralActivity: 0.3,
    };
  }

  /**
   * 简化决策（备用）
   */
  private makeSimpleDecision(): DecisionResult {
    return this.makeMetaCognitiveDecision();
  }

  /**
   * ========== 元认知系统 ==========
   */

  /**
   * 执行元认知过程
   * 在重要决策后触发反思
   */
  public metaCognize(): {
    reflection?: Reflection;
    valueChanges: Array<{ valueName: string; previousValue: number; newValue: number; reason: string }>;
    goalUpdates: Goal[];
    introspection?: IntrospectionReport;
  } {
    const context = {
      citizenState: {
        energy: this.state.energy,
        mood: this.state.mood,
        health: this.state.health,
        hunger: this.state.hunger,
      },
      recentDecisions: this.recentDecisions.slice(-10),
      environmentalContext: {
        timeOfDay: this.getTimeOfDay(),
        nearbyCitizens: this.relations.filter(r => r.intimacy > 0.3).length,
      },
    };

    const result = this.metaCognitionEngine.metaCognize(context);

    this.metaCognitionState = this.metaCognitionEngine.getState();

    if (result.valueChanges.length > 0) {
      this.applyValueChangesToBehavior(result.valueChanges);
    }

    return result;
  }

  /**
   * 反思决策
   * 评估决策结果并学习
   */
  public reflectOnDecision(decision: {
    id: string;
    action: string;
    confidence: number;
  }): DecisionEvaluation {
    const decisionRecord = this.recentDecisions.find(d => d.id === decision.id);
    
    if (decisionRecord) {
      const moodChange = this.state.mood - decisionRecord.moodBefore;
      const energyChange = this.state.energy - decisionRecord.energyBefore;

      if (moodChange > 5 && energyChange >= 0) {
        decisionRecord.outcome = 'positive';
      } else if (moodChange < -10 || energyChange < -20) {
        decisionRecord.outcome = 'negative';
      } else if (Math.abs(moodChange) < 5 && Math.abs(energyChange) < 10) {
        decisionRecord.outcome = 'neutral';
      } else {
        decisionRecord.outcome = 'mixed';
      }
    }

    const evaluation = this.metaCognitionEngine.evaluateDecision({
      id: decision.id,
      action: decision.action,
      confidence: decision.confidence,
      outcome: decisionRecord?.outcome ? {
        quality: decisionRecord.outcome === 'positive' ? 0.8 : 
                 decisionRecord.outcome === 'negative' ? 0.2 : 0.5,
        emotionalImpact: decisionRecord ? this.state.mood - decisionRecord.moodBefore : 0,
        resourceEfficiency: decisionRecord ? 
          Math.max(0, 1 - Math.abs(this.state.energy - decisionRecord.energyBefore) / 100) : 0.5,
      } : undefined,
    });

    if (evaluation.learningValue > 0.5) {
      this.state.mood = Math.min(100, this.state.mood + evaluation.learningValue * 5);
    }

    return evaluation;
  }

  /**
   * 调整价值观
   * 根据反思结果动态调整行为倾向
   */
  public adjustValues(): ValueSystem {
    const values = this.metaCognitionEngine.getValues();

    const behaviorModifiers = {
      aggression: (values.power - values.harmony) * 0.1,
      sociability: values.social * 0.1,
      curiosity: values.exploration * 0.1,
      stability: values.security * 0.1,
      冒险精神: (values.exploration + values.autonomy - values.security) * 0.05,
    };

    for (const [key, modifier] of Object.entries(behaviorModifiers)) {
      if (key in this.phenotype.behavior) {
        const currentValue = this.phenotype.behavior[key as keyof typeof this.phenotype.behavior];
        this.phenotype.behavior[key as keyof typeof this.phenotype.behavior] = 
          Math.max(0, Math.min(1, currentValue + modifier * 0.01));
      }
    }

    return values;
  }

  /**
   * 设定目标
   */
  public setMetaGoal(
    type: GoalType,
    category: string,
    description: string,
    priority: number,
    targetDate?: number
  ): Goal {
    return this.metaCognitionEngine.setGoal(type, category, description, priority, targetDate);
  }

  /**
   * 获取活跃目标
   */
  public getActiveMetaGoals(): Goal[] {
    return this.metaCognitionEngine.getActiveGoals();
  }

  /**
   * 生成内省报告
   */
  public generateIntrospection(): IntrospectionReport {
    return this.metaCognitionEngine.generateIntrospectionReport({
      citizenState: {
        energy: this.state.energy,
        mood: this.state.mood,
        health: this.state.health,
        hunger: this.state.hunger,
      },
      recentDecisions: this.recentDecisions,
    });
  }

  /**
   * 获取价值观体系
   */
  public getValueSystem(): ValueSystem {
    return this.metaCognitionEngine.getValues();
  }

  /**
   * 获取元认知状态摘要
   */
  public getMetaCognitionSummary(): {
    state: MetaCognitionState;
    dominantValues: string[];
    activeGoals: number;
    recentReflections: number;
    selfAwarenessLevel: string;
  } {
    const state = this.metaCognitionEngine.getState();
    const values = this.metaCognitionEngine.getValues();
    const goals = this.metaCognitionEngine.getActiveGoals();
    const reflections = this.metaCognitionEngine.getReflectionHistory();

    const sortedValues = Object.entries(values)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => key);

    let selfAwarenessLevel = '低';
    if (state.selfAwareness > 0.8) selfAwarenessLevel = '极高';
    else if (state.selfAwareness > 0.6) selfAwarenessLevel = '高';
    else if (state.selfAwareness > 0.4) selfAwarenessLevel = '中等';

    return {
      state,
      dominantValues: sortedValues,
      activeGoals: goals.length,
      recentReflections: reflections.length,
      selfAwarenessLevel,
    };
  }

  /**
   * 获取目标驱动的决策
   * 根据当前活跃目标选择最优行动
   */
  public getGoalDrivenDecision(): {
    action: DecisionAction;
    reason: string;
    goalMatch: string | null;
    priority: number;
  } {
    const context: DecisionContext = {
      energy: this.state.energy,
      mood: this.state.mood,
      health: this.state.health,
      hunger: this.state.hunger,
      timeOfDay: this.getTimeOfDay(),
      nearbyCitizens: this.relations.filter(r => r.intimacy > 0.3).length,
    };

    const result = this.metaDecisionMapper.computeGoalDrivenAction(
      this.metaCognitionEngine.getGoals(),
      context
    );

    const activeGoals = this.metaCognitionEngine.getActiveGoals();
    const topGoal = activeGoals.length > 0 ? activeGoals[0] : null;

    return {
      action: result.action,
      reason: result.reason,
      goalMatch: result.goalMatch,
      priority: topGoal?.priority || 0,
    };
  }

  /**
   * 获取价值观驱动的决策调整
   */
  public getValueDrivenAdjustment(currentAction: DecisionAction): {
    adjusted: boolean;
    newAction: DecisionAction;
    reason: string;
    dominantValue: string;
  } {
    const values = this.metaCognitionEngine.getValues();
    const dominantValue = Object.entries(values)
      .sort((a, b) => b[1] - a[1])[0][0];

    const result = this.metaDecisionMapper.computeValueDrivenAdjustment(
      values,
      currentAction,
      this.metaCognitionState
    );

    return {
      ...result,
      dominantValue,
    };
  }

  /**
   * 获取决策权重详情
   */
  public getDecisionWeightsDetail(): {
    base: DecisionWeights;
    valueAdjusted: DecisionWeights;
    goalAdjusted: DecisionWeights;
    final: DecisionWeights;
    dominantValue: string;
    activeGoals: string[];
  } {
    if (this.lastMetaInfluence) {
      return {
        base: this.lastMetaInfluence.baseWeights,
        valueAdjusted: this.lastMetaInfluence.valueAdjustedWeights,
        goalAdjusted: this.lastMetaInfluence.goalAdjustedWeights,
        final: this.lastMetaInfluence.finalWeights,
        dominantValue: this.lastMetaInfluence.dominantValue,
        activeGoals: this.lastMetaInfluence.activeGoalInfluence,
      };
    }

    const influence = this.computeMetaCognitiveInfluence();
    return {
      base: influence.baseWeights,
      valueAdjusted: influence.valueAdjustedWeights,
      goalAdjusted: influence.goalAdjustedWeights,
      final: influence.finalWeights,
      dominantValue: influence.dominantValue,
      activeGoals: influence.activeGoalInfluence,
    };
  }

  /**
   * 获取元认知决策影响
   */
  public getMetaCognitiveInfluence(): MetaCognitionInfluence | null {
    return this.lastMetaInfluence;
  }

  /**
   * 强制执行目标驱动决策
   * 用于紧急情况或高优先级目标
   */
  public forceGoalDrivenAction(): DecisionResult {
    const goalDecision = this.getGoalDrivenDecision();
    
    this.currentDecision = {
      action: goalDecision.action as DecisionOption,
      confidence: 0.7 + goalDecision.priority * 0.2,
      coherence: 0.9,
      neuralActivity: this.getAverageFiringRate(),
    };

    console.log(`[Citizen ${this.name}] Forced goal-driven action: ${goalDecision.action} (reason: ${goalDecision.reason})`);

    return this.currentDecision;
  }

  /**
   * 应用价值观变化到行为
   */
  private applyValueChangesToBehavior(changes: Array<{
    valueName: string;
    previousValue: number;
    newValue: number;
    reason: string;
  }>): void {
    for (const change of changes) {
      const delta = change.newValue - change.previousValue;

      switch (change.valueName) {
        case 'survival':
          this.phenotype.behavior.stability += delta * 0.05;
          break;
        case 'social':
          this.phenotype.behavior.sociability += delta * 0.05;
          break;
        case 'exploration':
          this.phenotype.behavior.curiosity += delta * 0.05;
          this.phenotype.behavior.冒险精神 += delta * 0.03;
          break;
        case 'security':
          this.phenotype.behavior.stability += delta * 0.05;
          this.phenotype.behavior.冒险精神 -= delta * 0.03;
          break;
        case 'achievement':
          this.phenotype.behavior.aggression += delta * 0.03;
          break;
        case 'harmony':
          this.phenotype.behavior.aggression -= delta * 0.05;
          this.phenotype.behavior.sociability += delta * 0.03;
          break;
      }
    }

    for (const key of Object.keys(this.phenotype.behavior)) {
      const k = key as keyof typeof this.phenotype.behavior;
      this.phenotype.behavior[k] = Math.max(0, Math.min(1, this.phenotype.behavior[k]));
    }
  }

  /**
   * 记录决策前状态
   */
  private recordPreDecisionState(): void {
    this.preDecisionState = {
      mood: this.state.mood,
      energy: this.state.energy,
      health: this.state.health,
      timestamp: Date.now(),
    };
  }

  /**
   * 记录决策
   */
  private recordDecisionToMeta(decision: DecisionResult): void {
    const decisionRecord = {
      id: crypto.randomUUID(),
      action: decision.action,
      confidence: decision.confidence,
      moodBefore: this.preDecisionState?.mood ?? this.state.mood,
      energyBefore: this.preDecisionState?.energy ?? this.state.energy,
      timestamp: Date.now(),
    };

    this.recentDecisions.push(decisionRecord);
    if (this.recentDecisions.length > 20) {
      this.recentDecisions.shift();
    }

    this.metaCognitionEngine.recordDecision({
      id: decisionRecord.id,
      action: decision.action,
      moodBefore: decisionRecord.moodBefore,
      energyBefore: decisionRecord.energyBefore,
    });
  }

  /**
   * 获取当前时段
   */
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return '上午';
    if (hour >= 12 && hour < 14) return '中午';
    if (hour >= 14 && hour < 18) return '下午';
    if (hour >= 18 && hour < 22) return '晚上';
    return '深夜';
  }

  /**
   * 根据市民状态获取决策权重
   * 集成基因影响系统
   */
  private getDecisionWeights(): Record<DecisionOption, number> {
    const energy = this.state.energy / 100;
    const mood = this.state.mood / 100;
    const hunger = this.state.hunger / 100;

    const baseWeights = {
      work: energy * 0.4 + this.phenotype.behavior.aggression * 0.2,
      rest: (1 - energy) * 0.5 + (1 - mood) * 0.3,
      socialize: this.phenotype.behavior.sociability * 0.4 + mood * 0.3,
      explore: this.phenotype.behavior.curiosity * 0.4 + hunger * 0.2,
      migrate: this.phenotype.behavior.冒险精神 * 0.3 + (1 - mood) * 0.4,
    };

    const geneticModifier = 0.3;
    const modifiedWeights = { ...baseWeights };

    for (const [behavior, geneticProb] of this.geneticBehaviorProbabilities) {
      if (behavior in modifiedWeights) {
        const baseWeight = modifiedWeights[behavior as DecisionOption] || 0;
        modifiedWeights[behavior as DecisionOption] = 
          baseWeight * (1 - geneticModifier) + geneticProb * geneticModifier * 2;
      }
    }

    return modifiedWeights;
  }

  /**
   * 获取基因影响摘要（用于UI显示）
   */
  public getGeneticInfluenceSummary(): {
    dominantTraits: string[];
    attributeBonuses: Array<{ name: string; value: number }>;
    behaviorProbabilities: Array<{ name: string; probability: number }>;
  } {
    const dominantTraits: string[] = [];
    
    if (this.extendedGenome && this.isExtendedGenomeFormat(this.extendedGenome)) {
      const summary = geneInfluenceMapper.getInfluenceSummary(this.extendedGenome);
      dominantTraits.push(...summary.dominantTraits);
    } else {
      const genes = Uint8Array.from(atob(this.genome.genes), c => c.charCodeAt(0));
      if (genes[10] > 200) dominantTraits.push('高智力基因');
      if (genes[12] > 200) dominantTraits.push('强壮基因');
      if (genes[6] > 200) dominantTraits.push('社交基因');
      if (genes[7] > 200) dominantTraits.push('探索基因');
    }

    const attributeBonuses = Array.from(this.geneticAttributeBonuses.entries())
      .filter(([_, value]) => Math.abs(value) > 0.01)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 5);

    const behaviorProbabilities = Array.from(this.geneticBehaviorProbabilities.entries())
      .map(([name, probability]) => ({ name, probability }))
      .sort((a, b) => b.probability - a.probability);

    return {
      dominantTraits,
      attributeBonuses,
      behaviorProbabilities,
    };
  }

  /**
   * ========== WASM脉冲神经网络系统 ==========
   */

  /**
   * 使用SNN处理感觉输入
   * @param inputs 感觉输入数组
   * @param dt 时间步长
   */
  public processSNN(inputs: number[], dt: number = 0): number {
    if (!isWasmReady() || this.state.type === CitizenStateType.DORMANT) {
      return 0;
    }

    try {
      const threshold = this.state.type === CitizenStateType.ACTIVE ? 1.0 : 0.5;
      
      const spikeCount = wasmSNN.step(inputs, dt, threshold);
      
      const firingRate = spikeCount / this.getNeuronCount();
      this.firingRateHistory.push(firingRate);
      if (this.firingRateHistory.length > 100) {
        this.firingRateHistory.shift();
      }

      if (firingRate > 5.5) {
        this.state.mood = Math.min(100, this.state.mood + firingRate * 0.1);
      }

      return spikeCount;
    } catch (error) {
      console.warn(`[Citizen ${this.id}] SNN processing failed:`, error);
      return 0;
    }
  }

  /**
   * 获取当前平均发放率
   */
  public getAverageFiringRate(): number {
    if (this.firingRateHistory.length === 0) return 0;
    return this.firingRateHistory.reduce((a, b) => a + b, 0) / this.firingRateHistory.length;
  }

  /**
   * SNN处理核心方法 - 将神经活动映射到情绪和行为
   * 这是SNN真正影响市民的关键方法
   */
  public snnProcess(deltaTime: number): {
    spikeCount: number;
    firingRate: number;
    emotionChange: { mood: number; energy: number; stress: number };
    behaviorModifier: Record<string, number>;
  } {
    if (!isWasmReady() || this.state.type === CitizenStateType.DORMANT) {
      return {
        spikeCount: 0,
        firingRate: 0,
        emotionChange: { mood: 0, energy: 0, stress: 0 },
        behaviorModifier: {},
      };
    }

    const sensoryInputs = this.buildSensoryInputs();
    const dt = deltaTime / 1000;
    
    const spikeCount = this.processSNN(sensoryInputs, dt);
    const firingRate = this.getAverageFiringRate();
    
    const emotionChange = this.mapSNNToEmotion(firingRate, spikeCount);
    this.applyEmotionChanges(emotionChange);
    
    const behaviorModifier = this.mapSNNToBehavior(firingRate, spikeCount);
    this.applyBehaviorModifiers(behaviorModifier);

    if (this.state.type === CitizenStateType.ACTIVE && Math.random() < 0.1) {
      logger.debug('SNN', `${this.name}: spikes=${spikeCount}, rate=${firingRate.toFixed(3)}, moodΔ=${emotionChange.mood.toFixed(2)}, energyΔ=${emotionChange.energy.toFixed(2)}`);
    }

    return {
      spikeCount,
      firingRate,
      emotionChange,
      behaviorModifier,
    };
  }

  /**
   * 构建感觉输入向量
   */
  private buildSensoryInputs(): number[] {
    const inputs = [
      this.state.energy / 100,
      this.state.mood / 100,
      this.state.hunger / 100,
      this.state.health / 100,
      this.phenotype.behavior.aggression,
      this.phenotype.behavior.sociability,
      this.phenotype.behavior.curiosity,
      this.phenotype.behavior.stability,
      this.phenotype.behavior.冒险精神,
      this.phenotype.abilities.intelligence,
      this.phenotype.abilities.strength,
      this.phenotype.abilities.charisma,
      this.relations.filter(r => r.intimacy > 0.5).length * 0.1,
      this.memories.length / 100,
      this.state.type === CitizenStateType.ACTIVE ? 1.0 : 0.5,
      Math.sin(Date.now() / 10000) * 0.5 + 0.5,
    ];

    return inputs.map(v => Math.max(0, Math.min(1, v || 0)));
  }

  /**
   * 将SNN输出映射到情绪变化
   */
  private mapSNNToEmotion(firingRate: number, spikeCount: number): { 
    mood: number; 
    energy: number; 
    stress: number;
  } {
    let moodDelta = 0;
    let energyDelta = 0;
    let stressDelta = 0;

    if (firingRate > 0.7) {
      moodDelta = 0.05 * (firingRate - 0.5);
      energyDelta = -0.02 * firingRate;
    } else if (firingRate > 0.3) {
      moodDelta = 0.02;
      energyDelta = -0.01;
    } else if (firingRate > 0.1) {
      moodDelta = -0.01;
      stressDelta = 0.01;
    } else {
      stressDelta = 0.02;
      moodDelta = -0.02;
    }

    const intelligence = this.phenotype.abilities.intelligence;
    moodDelta *= (0.8 + intelligence * 0.4);
    
    const stability = this.phenotype.behavior.stability;
    stressDelta *= (1.5 - stability);

    return {
      mood: moodDelta,
      energy: energyDelta,
      stress: stressDelta,
    };
  }

  /**
   * 将SNN输出映射到行为倾向
   */
  private mapSNNToBehavior(firingRate: number, spikeCount: number): Record<string, number> {
    const modifiers: Record<string, number> = {};

    if (firingRate > 0.6) {
      modifiers.work = 0.1;
      modifiers.explore = 0.15;
      modifiers.socialize = 0.05;
    } else if (firingRate > 0.3) {
      modifiers.work = 0.05;
      modifiers.rest = 0.05;
    } else {
      modifiers.rest = 0.15;
      modifiers.migrate = 0.05;
    }

    const sociability = this.phenotype.behavior.sociability;
    if (firingRate > 0.4 && sociability > 0.6) {
      modifiers.socialize = (modifiers.socialize || 0) + 0.1;
    }

    const curiosity = this.phenotype.behavior.curiosity;
    if (firingRate > 0.5 && curiosity > 0.5) {
      modifiers.explore = (modifiers.explore || 0) + 0.1;
    }

    return modifiers;
  }

  /**
   * 应用情绪变化
   */
  private applyEmotionChanges(changes: { mood: number; energy: number; stress: number }): void {
    this.state.mood = Math.max(0, Math.min(100, this.state.mood + changes.mood));
    this.state.energy = Math.max(0, Math.min(100, this.state.energy + changes.energy));
    
    if (changes.stress > 0 && this.state.mood > 30) {
      this.state.mood = Math.max(0, this.state.mood - changes.stress * 10);
    }
  }

  /**
   * 应用行为修饰符（影响决策权重）
   */
  private applyBehaviorModifiers(modifiers: Record<string, number>): void {
    for (const [behavior, modifier] of Object.entries(modifiers)) {
      this.phenotype.behavior[behavior as keyof typeof this.phenotype.behavior] = 
        Math.max(0, Math.min(1, 
          (this.phenotype.behavior[behavior as keyof typeof this.phenotype.behavior] || 0.5) + modifier * 0.01
        ));
    }
  }

  /**
   * 获取SNN调试信息
   */
  public getSNNDebugInfo(): {
    firingRate: number;
    firingRateHistory: number[];
    neuronCount: number;
    lastSpikeCount: number;
    membranePotentials: number[];
  } {
    return {
      firingRate: this.getAverageFiringRate(),
      firingRateHistory: [...this.firingRateHistory].slice(-20),
      neuronCount: this.getNeuronCount(),
      lastSpikeCount: this.firingRateHistory[this.firingRateHistory.length - 1] || 0,
      membranePotentials: Array.from(wasmSNN.getMembranePotentials()).slice(0, 16),
    };
  }

  /** 当前路径缓存 */
  private currentPath: Array<[number, number]> = [];
  private pathIndex: number = 0;

  /**
   * ========== WASM寻路系统 ==========
   */

  /**
   * 移动到目标位置（自动调用 WASM PathFinder）
   * @param targetX 目标X
   * @param targetY 目标Y
   */
  public moveTo(targetX: number, targetY: number): void {
    // 如果没有路径，重新计算
    if (this.currentPath.length === 0 || this.pathIndex >= this.currentPath.length) {
      if (isWasmReady()) {
        // 使用 WASM PathFinder 计算路径
        const startX = Math.floor(this.position.grid.x);
        const startY = Math.floor(this.position.grid.y);
        const endX = Math.floor(targetX);
        const endY = Math.floor(targetY);

        // ARCHITECTURE NOTE: 障碍物数据集成方案
        // ============================================
        // 当前状态: 使用空数组，市民可以穿过任何地形
        //
        // 需要集成的数据源:
        // 1. TerrainCell.traversable - 地形单元的可通行性
        //    - 定义于 src/core/types/world.ts:196-207
        //    - TerrainType.OCEAN, MOUNTAIN 等类型应标记为不可通行
        //    - 需要从 WorldMap/TerrainSystem 获取 terrain[] 数组
        //
        // 2. Region.bounds - 区域边界作为软障碍
        //    - 定义于 src/core/types/world.ts:212-226
        //    - 可用于限制市民活动范围
        //
        // 技术难点:
        // - Citizen 类当前无世界地图引用，只有 worldId
        // - 需要实现以下之一:
        //   a) 依赖注入: 构造函数传入 WorldMapService
        //   b) 全局访问: WorldMapService.getInstance().getObstacles(bounds)
        //   c) 事件系统: 发送请求障碍物的事件
        //
        // 数据转换:
        // - TerrainCell[] -> Uint8Array obstacles (0=可通行, 1=障碍)
        // - 需要按网格坐标索引: obstacles[y * width + x]
        //
        // 性能考虑:
        // - 避免每帧重新获取完整地图，应缓存局部区域
        // - 可使用空间分区仅获取路径相关区域
        const obstacles: number[] = [];
        this.currentPath = wasmPathFinder.findPath(startX, startY, endX, endY, obstacles);
        this.pathIndex = 1; // 从第二个点开始（第一个是当前位置）

        if (this.currentPath.length > 0) {
          logger.debug('Citizen', `Path calculated: ${this.currentPath.length} points`, { citizenId: this.id });
        }
      }

      if (this.currentPath.length < 2) {
        // 寻路失败，直接移动到目标
        const dx = targetX - this.position.grid.x;
        const dy = targetY - this.position.grid.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.1) {
          const speed = Math.min(1, this.state.energy / 100) * 0.1;
          this.position.grid.x += dx * speed;
          this.position.grid.y += dy * speed;
          this.position.world.x = this.position.grid.x * 10;
          this.position.world.z = this.position.grid.y * 10;
          this.state.energy = Math.max(0, this.state.energy - 0.01);
        }
        return;
      }
    }

    // 沿着缓存的路径移动
    if (this.pathIndex < this.currentPath.length) {
      const nextPos = this.currentPath[this.pathIndex];
      const dx = nextPos[0] - this.position.grid.x;
      const dy = nextPos[1] - this.position.grid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.1) {
        // 移动速度根据能量调整
        const speed = Math.min(1, this.state.energy / 100) * 0.1;
        this.position.grid.x += dx * speed;
        this.position.grid.y += dy * speed;

        // 更新世界坐标
        this.position.world.x = this.position.grid.x * 10;
        this.position.world.z = this.position.grid.y * 10;

        // 消耗能量
        this.state.energy = Math.max(0, this.state.energy - 0.01);
      } else {
        // 到达路径点，移动到下一个
        this.pathIndex++;
      }
    }
  }

  /**
   * ========== 主更新循环 ==========
   */

  /**
   * 更新市民（主循环调用）
   */
  public update(deltaTime: number): void {
    this.updateState(deltaTime);
    
    if (this.state.type === CitizenStateType.ACTIVE) {
      this.updateQuantumState();
      this.updateNeuralActivity(deltaTime);
      this.updateMetaCognition(deltaTime);
    }
    
    this.updateLOD();
    this.updateMemories();
    this.updatedAt = Date.now();
  }

  /**
   * 更新元认知状态
   */
  private updateMetaCognition(deltaTime: number): void {
    this.metaCognitionState = this.metaCognitionEngine.getState();

    if (this.metaCognitionState.cognitiveLoad > 0.7) {
      this.state.mood = Math.max(0, this.state.mood - deltaTime * 0.001);
    }

    if (this.metaCognitionState.selfAwareness > 0.7) {
      const values = this.metaCognitionEngine.getValues();
      const dominantValue = Object.entries(values)
        .sort((a, b) => b[1] - a[1])[0];

      if (dominantValue) {
        const valueInfluence = dominantValue[1] * 0.01;
        switch (dominantValue[0]) {
          case 'social':
            this.phenotype.behavior.sociability = Math.min(1, 
              this.phenotype.behavior.sociability + valueInfluence * deltaTime / 1000
            );
            break;
          case 'exploration':
            this.phenotype.behavior.curiosity = Math.min(1, 
              this.phenotype.behavior.curiosity + valueInfluence * deltaTime / 1000
            );
            break;
          case 'achievement':
            this.phenotype.behavior.aggression = Math.min(1, 
              this.phenotype.behavior.aggression + valueInfluence * deltaTime / 1000
            );
            break;
        }
      }
    }
  }

  /**
   * 更新量子态并执行决策
   */
  private updateQuantumState(): void {
    if (!this.quantumValid || Math.random() < 0.05) {
      this.recordPreDecisionState();
      
      const decision = this.makeQuantumDecision();
      this.quantumValid = true;

      this.recordDecisionToMeta(decision);

      this.executeDecision(decision);

      if (decision.confidence < 0.5 || Math.random() < this.metaCognitionState.selfAwareness * 0.3) {
        this.reflectOnDecision({
          id: this.recentDecisions[this.recentDecisions.length - 1]?.id || '',
          action: decision.action,
          confidence: decision.confidence,
        });
      }

      if (Math.random() < 0.1) {
        this.metaCognize();
      }
    }
  }

  /**
   * 执行决策
   * 根据量子决策结果执行具体行动
   */
  private executeDecision(decision: DecisionResult): void {
    if (!decision) return;

    // 记录当前决策
    this.currentDecision = decision;

    switch (decision.action) {
      case 'work':
        this.executeWorkAction(decision);
        break;
      case 'rest':
        this.executeRestAction(decision);
        break;
      case 'socialize':
        this.executeSocializeAction(decision);
        break;
      case 'explore':
        this.executeExploreAction(decision);
        break;
      case 'migrate':
        this.executeMigrateAction(decision);
        break;
    }
  }

  /**
   * 执行工作行动
   */
  private executeWorkAction(decision: DecisionResult): void {
    // 工作会增加产出但消耗能量
    if (this.state.energy > 20) {
      this.state.energy -= 0.1;
      // 工作效率受自信度影响
      if (decision.confidence > 0.7) {
        this.state.mood = Math.min(100, this.state.mood + 0.1);
      }
    }
  }

  /**
   * 执行休息行动
   */
  private executeRestAction(decision: DecisionResult): void {
    // 休息恢复能量
    this.state.energy = Math.min(100, this.state.energy + 0.2);
    this.state.mood = Math.min(100, this.state.mood + 0.05);
  }

  /**
   * 执行社交行动
   */
  private executeSocializeAction(decision: DecisionResult): void {
    // 社交增加心情
    this.state.mood = Math.min(100, this.state.mood + 0.15);

    // 神经活动高时社交效果更好
    if (decision.neuralActivity > 0.5) {
      this.state.mood = Math.min(100, this.state.mood + 0.1);
    }
  }

  /**
   * 执行探索行动
   */
  private executeExploreAction(decision: DecisionResult): void {
    // 探索随机移动到附近位置
    const currentX = this.position.grid.x;
    const currentY = this.position.grid.y;

    // 探索范围受好奇心影响
    const exploreRadius = 5 + this.phenotype.behavior.curiosity * 10;
    const targetX = currentX + (Math.random() - 0.5) * exploreRadius;
    const targetY = currentY + (Math.random() - 0.5) * exploreRadius;

    // 使用 WASM PathFinder 移动
    this.moveTo(
      Math.max(0, Math.min(100, targetX)),
      Math.max(0, Math.min(100, targetY))
    );

    // 探索消耗能量
    this.state.energy -= 0.05;
  }

  /**
   * 执行迁移行动
   */
  private executeMigrateAction(decision: DecisionResult): void {
    // 迁移到地图边缘
    const edge = Math.floor(Math.random() * 4);
    let targetX: number, targetY: number;

    switch (edge) {
      case 0: // 上
        targetX = this.position.grid.x;
        targetY = 0;
        break;
      case 1: // 右
        targetX = 100;
        targetY = this.position.grid.y;
        break;
      case 2: // 下
        targetX = this.position.grid.x;
        targetY = 100;
        break;
      default: // 左
        targetX = 0;
        targetY = this.position.grid.y;
    }

    // 使用 WASM PathFinder 迁移
    this.moveTo(targetX, targetY);

    // 迁移消耗大量能量
    this.state.energy -= 0.2;
  }

  /**
   * 更新神经活动
   */
  private updateNeuralActivity(deltaTime: number): void {
    if (!isWasmReady()) return;

    // 构建感觉输入
    const inputs = [
      this.state.energy / 100,
      this.state.mood / 100,
      this.state.hunger / 100,
      this.state.health / 100,
      this.phenotype.behavior.aggression,
      this.phenotype.behavior.sociability,
      this.phenotype.behavior.curiosity,
      // 添加周围市民的影响
      this.relations.filter(r => r.intimacy > 0.5).length * 0.1,
    ];

    this.processSNN(inputs, deltaTime / 1000);
  }

  /**
   * 更新状态
   */
  private updateState(deltaTime: number): void {
    const dt = deltaTime / 1000; // 转换为秒

    // 更新能量
    this.state.energy = Math.max(0, this.state.energy - dt * 0.1);

    // 更新饥饿度
    this.state.hunger = Math.max(0, this.state.hunger - dt * 0.05);

    // 更新心情（基于量子决策和神经活动）
    if (this.state.hunger < 20) {
      this.state.mood = Math.max(0, this.state.mood - dt * 2);
    } else if (this.state.energy > 50) {
      // 神经活动高时心情更好
      const neuralBonus = this.getAverageFiringRate() * 0.5;
      this.state.mood = Math.min(100, this.state.mood + dt * (0.5 + neuralBonus));
    }

    // 根据决策调整状态
    if (this.currentDecision) {
      switch (this.currentDecision.action) {
        case 'rest':
          this.state.energy = Math.min(100, this.state.energy + dt * 5);
          break;
        case 'work':
          this.state.energy = Math.max(0, this.state.energy - dt * 2);
          this.state.mood = Math.max(0, this.state.mood - dt * 0.5);
          break;
        case 'socialize':
          this.state.mood = Math.min(100, this.state.mood + dt * 1);
          break;
      }
    }

    // 更新健康
    if (this.state.hunger === 0 || this.state.energy === 0) {
      this.state.health = Math.max(0, this.state.health - dt * 1);
    } else if (this.state.hunger > 50 && this.state.energy > 50) {
      this.state.health = Math.min(100, this.state.health + dt * 0.1);
    }

    // 状态转换
    if (this.state.health < 20) {
      this.state.type = CitizenStateType.DORMANT;
    } else if (this.state.energy < 20) {
      this.state.type = CitizenStateType.DORMANT;
    } else if (this.state.mood > 70 && this.state.energy > 80) {
      this.state.type = CitizenStateType.ACTIVE;
      this.quantumValid = false; // 重置量子态
    } else {
      this.state.type = CitizenStateType.BACKGROUND;
    }

    // 更新最后活跃时间
    if (this.state.type === CitizenStateType.ACTIVE) {
      this.lastActiveTime = Date.now();
    }
  }

  /**
   * 更新 LOD 级别
   */
  private updateLOD(): void {
    const dist = Math.sqrt(
      this.position.world.x ** 2 +
      this.position.world.z ** 2
    );

    if (dist > LOD_DISTANCES[LODLevel.CLOUD]) {
      this.lodLevel = LODLevel.CLOUD;
      this.visible = false;
    } else if (dist > LOD_DISTANCES[LODLevel.GRID]) {
      this.lodLevel = LODLevel.GRID;
      this.visible = true;
    } else if (dist > LOD_DISTANCES[LODLevel.VOXEL]) {
      this.lodLevel = LODLevel.VOXEL;
      this.visible = true;
    } else {
      this.lodLevel = LODLevel.PORTRAIT;
      this.visible = true;
    }
  }

  /**
   * 更新记忆
   */
  private updateMemories(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时

    this.memories = this.memories.filter(m => {
      const age = m.importance > 0.7 ? maxAge * 7 : maxAge;
      return now - m.createdAt < age;
    });

    if (this.memories.length > 100) {
      this.memories.sort((a, b) => b.importance - a.importance);
      this.memories = this.memories.slice(0, 100);
    }
  }

  /**
   * 添加记忆
   */
  public addMemory(text: string, embedding: Float32Array, importance: number): Memory {
    const memory: Memory = {
      id: createEntityId(),
      embedding: new Float32Array(embedding),
      text,
      createdAt: Date.now(),
      importance,
      accessCount: 0,
      lastAccessedAt: Date.now(),
    };

    this.memories.push(memory);
    return memory;
  }

  /**
   * 获取记忆
   */
  public getMemory(id: EntityId): Memory | undefined {
    const memory = this.memories.find(m => m.id === id);
    if (memory) {
      memory.accessCount++;
      memory.lastAccessedAt = Date.now();
    }
    return memory;
  }

  /**
   * 添加关系
   */
  public addRelation(relation: Omit<CitizenRelation, 'establishedAt'>): void {
    const existing = this.relations.find(r => r.targetId === relation.targetId);
    if (existing) {
      existing.intimacy = (existing.intimacy + relation.intimacy) / 2;
      existing.type = relation.type;
    } else {
      this.relations.push({
        ...relation,
        establishedAt: Date.now(),
      });
    }
  }

  /**
   * 获取关系
   */
  public getRelation(targetId: EntityId): CitizenRelation | undefined {
    return this.relations.find(r => r.targetId === targetId);
  }

  /**
   * 获取关系网络数据
   * @param filterType 可选的关系类型过滤
   * @returns 关系网络数据（节点、边、统计信息）
   */
  public getRelationshipNetwork(filterType?: RelationType): RelationshipNetworkData {
    const filteredRelations = filterType 
      ? this.relations.filter(r => r.type === filterType)
      : this.relations;

    const nodes: RelationshipNode[] = [
      {
        id: this.id,
        name: this.name,
        type: 'self',
        intimacy: 1,
      },
    ];

    const edges: RelationshipEdge[] = [];

    for (const relation of filteredRelations) {
      nodes.push({
        id: relation.targetId,
        name: `市民${relation.targetId.slice(0, 4)}`,
        type: 'citizen',
        relationType: relation.type,
        intimacy: relation.intimacy,
      });

      edges.push({
        source: this.id,
        target: relation.targetId,
        weight: relation.intimacy,
        type: relation.type,
        establishedAt: relation.establishedAt,
      });
    }

    const typeDistribution: Record<string, number> = {};
    for (const relation of this.relations) {
      typeDistribution[relation.type] = (typeDistribution[relation.type] || 0) + 1;
    }

    let strongestRelation: { targetId: string; intimacy: number } | null = null;
    if (this.relations.length > 0) {
      const sorted = [...this.relations].sort((a, b) => b.intimacy - a.intimacy);
      strongestRelation = {
        targetId: sorted[0].targetId,
        intimacy: sorted[0].intimacy,
      };
    }

    const averageIntimacy = this.relations.length > 0
      ? this.relations.reduce((sum, r) => sum + r.intimacy, 0) / this.relations.length
      : 0;

    return {
      nodes,
      edges,
      statistics: {
        totalRelations: this.relations.length,
        averageIntimacy,
        typeDistribution,
        strongestRelation,
      },
    };
  }

  /**
   * 添加情景记忆
   */
  public addEpisodicMemory(
    eventType: EpisodicMemory['eventType'],
    title: string,
    description: string,
    options?: {
      participants?: string[];
      emotionalValence?: number;
      emotionalIntensity?: number;
      importance?: number;
      tags?: string[];
    }
  ): EpisodicMemory {
    const memory: EpisodicMemory = {
      id: crypto.randomUUID(),
      eventType,
      title,
      description,
      participants: options?.participants || [],
      location: { x: this.position.grid.x, y: this.position.grid.y },
      timestamp: Date.now(),
      emotionalValence: options?.emotionalValence ?? this.state.mood / 100 - 0.5,
      emotionalIntensity: options?.emotionalIntensity ?? 0.5,
      importance: options?.importance ?? 0.5,
      tags: options?.tags || [eventType],
      retrievalCues: this.generateRetrievalCues(title, description, eventType),
      accessCount: 0,
      lastAccessedAt: Date.now(),
    };

    this.episodicMemory.push(memory);

    if (this.episodicMemory.length > 200) {
      this.episodicMemory.sort((a, b) => b.importance - a.importance);
      this.episodicMemory = this.episodicMemory.slice(0, 200);
    }

    return memory;
  }

  /**
   * 生成记忆检索线索
   */
  private generateRetrievalCues(title: string, description: string, eventType: string): string[] {
    const cues: string[] = [eventType];
    
    const words = (title + ' ' + description).split(/\s+/);
    const significantWords = words.filter(w => w.length > 2).slice(0, 5);
    cues.push(...significantWords);

    cues.push(this.getTimeOfDay());
    cues.push(this.getCurrentSeason());

    return cues;
  }

  /**
   * 获取当前季节
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return '春季';
    if (month >= 5 && month <= 7) return '夏季';
    if (month >= 8 && month <= 10) return '秋季';
    return '冬季';
  }

  /**
   * 检索相关记忆
   * @param query 查询条件
   * @param limit 返回数量限制
   * @returns 匹配的记忆列表
   */
  public recallMemory(
    query: {
      text?: string;
      eventType?: EpisodicMemory['eventType'];
      participants?: string[];
      timeRange?: { start: number; end: number };
      minImportance?: number;
      emotionalValence?: 'positive' | 'negative' | 'neutral';
      tags?: string[];
    },
    limit: number = 10
  ): EpisodicMemory[] {
    let results = [...this.episodicMemory];

    if (query.eventType) {
      results = results.filter(m => m.eventType === query.eventType);
    }

    if (query.participants && query.participants.length > 0) {
      results = results.filter(m => 
        query.participants!.some(p => m.participants.includes(p))
      );
    }

    if (query.timeRange) {
      results = results.filter(m => 
        m.timestamp >= query.timeRange!.start && 
        m.timestamp <= query.timeRange!.end
      );
    }

    if (query.minImportance !== undefined) {
      results = results.filter(m => m.importance >= query.minImportance!);
    }

    if (query.emotionalValence) {
      results = results.filter(m => {
        switch (query.emotionalValence) {
          case 'positive': return m.emotionalValence > 0.2;
          case 'negative': return m.emotionalValence < -0.2;
          case 'neutral': return Math.abs(m.emotionalValence) <= 0.2;
        }
      });
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(m => 
        query.tags!.some(t => m.tags.includes(t))
      );
    }

    if (query.text) {
      const searchTerms = query.text.toLowerCase().split(/\s+/);
      results = results.filter(m => {
        const searchText = (m.title + ' ' + m.description).toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });
    }

    results.sort((a, b) => {
      const recencyScore = (m: EpisodicMemory) => {
        const ageDays = (Date.now() - m.timestamp) / (1000 * 60 * 60 * 24);
        return Math.exp(-ageDays / 30);
      };
      
      const scoreA = a.importance * 0.4 + recencyScore(a) * 0.3 + a.accessCount * 0.02 + Math.abs(a.emotionalIntensity) * 0.1;
      const scoreB = b.importance * 0.4 + recencyScore(b) * 0.3 + b.accessCount * 0.02 + Math.abs(b.emotionalIntensity) * 0.1;
      
      return scoreB - scoreA;
    });

    const limited = results.slice(0, limit);
    
    for (const memory of limited) {
      memory.accessCount++;
      memory.lastAccessedAt = Date.now();
    }

    return limited;
  }

  /**
   * 获取情景记忆统计
   */
  public getEpisodicMemoryStats(): {
    total: number;
    byType: Record<string, number>;
    averageImportance: number;
    averageEmotionalValence: number;
    mostFrequentTags: string[];
  } {
    const byType: Record<string, number> = {};
    let totalImportance = 0;
    let totalValence = 0;
    const tagCounts: Record<string, number> = {};

    for (const memory of this.episodicMemory) {
      byType[memory.eventType] = (byType[memory.eventType] || 0) + 1;
      totalImportance += memory.importance;
      totalValence += memory.emotionalValence;
      
      for (const tag of memory.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      total: this.episodicMemory.length,
      byType,
      averageImportance: this.episodicMemory.length > 0 
        ? totalImportance / this.episodicMemory.length 
        : 0,
      averageEmotionalValence: this.episodicMemory.length > 0 
        ? totalValence / this.episodicMemory.length 
        : 0,
      mostFrequentTags: sortedTags,
    };
  }

  /**
   * 初始化性格特质
   */
  public initializePersonality(): void {
    if (this.personalityTraits) return;

    const { PersonalitySystem } = require('./PersonalitySystem');
    const system = new PersonalitySystem();
    this.personalityTraits = system.generatePersonality(this.genome);
  }

  /**
   * 生成对话
   */
  public generateDialogue(
    scenario: import('./PersonalitySystem').DialogueScenario,
    context?: Partial<import('./PersonalitySystem').DialogueContext>
  ): string {
    this.initializePersonality();

    const { PersonalitySystem } = require('./PersonalitySystem');
    const system = new PersonalitySystem();

    return system.generateDialogue(
      {
        name: this.name,
        traits: this.personalityTraits!,
        mood: this.state.mood,
        energy: this.state.energy,
      },
      {
        scenario,
        mood: this.state.mood,
        energy: this.state.energy,
        timeOfDay: this.getTimeOfDay(),
        ...context,
      }
    );
  }

  public recordEvent(
    eventType: EpisodicMemory['eventType'],
    title: string,
    description: string,
    options?: {
      participants?: string[];
      emotionalValence?: number;
      emotionalIntensity?: number;
      importance?: number;
      tags?: string[];
    }
  ): EpisodicMemory {
    const memory = this.addEpisodicMemory(eventType, title, description, options);
    
    if (this.personalityTraits && options?.emotionalValence !== undefined) {
      const impact = Math.abs(options.emotionalValence) * options.emotionalIntensity || 0.5;
      
      if (options.emotionalValence > 0.3) {
        this.personalityTraits.neuroticism = Math.max(0, 
          this.personalityTraits.neuroticism - impact * 0.02
        );
        this.personalityTraits.extraversion = Math.min(1,
          this.personalityTraits.extraversion + impact * 0.01
        );
      } else if (options.emotionalValence < -0.3) {
        this.personalityTraits.neuroticism = Math.min(1,
          this.personalityTraits.neuroticism + impact * 0.03
        );
        this.personalityTraits.agreeableness = Math.max(0,
          this.personalityTraits.agreeableness - impact * 0.01
        );
      }
    }
    
    return memory;
  }

  public getRecentMemories(count: number = 5): EpisodicMemory[] {
    return this.episodicMemory
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  public getImportantMemories(threshold: number = 0.7): EpisodicMemory[] {
    return this.episodicMemory
      .filter(m => m.importance >= threshold)
      .sort((a, b) => b.importance - a.importance);
  }

  public getEmotionalMemories(): {
    positive: EpisodicMemory[];
    negative: EpisodicMemory[];
    neutral: EpisodicMemory[];
  } {
    const positive: EpisodicMemory[] = [];
    const negative: EpisodicMemory[] = [];
    const neutral: EpisodicMemory[] = [];

    for (const memory of this.episodicMemory) {
      if (memory.emotionalValence > 0.2) {
        positive.push(memory);
      } else if (memory.emotionalValence < -0.2) {
        negative.push(memory);
      } else {
        neutral.push(memory);
      }
    }

    return {
      positive: positive.sort((a, b) => b.emotionalIntensity - a.emotionalIntensity),
      negative: negative.sort((a, b) => b.emotionalIntensity - a.emotionalIntensity),
      neutral: neutral.sort((a, b) => b.timestamp - a.timestamp),
    };
  }

  public generateDialogueWithContext(
    scenario: import('./PersonalitySystem').DialogueScenario,
    targetName?: string,
    topic?: string
  ): string {
    const recentMemories = this.getRecentMemories(3);
    const emotionalMemories = this.getEmotionalMemories();
    
    const context: Partial<import('./PersonalitySystem').DialogueContext> = {
      scenario,
      targetName,
      topic,
      mood: this.state.mood,
      energy: this.state.energy,
      timeOfDay: this.getTimeOfDay(),
      recentEvents: recentMemories.map(m => m.title),
    };

    return this.generateDialogue(scenario, context);
  }

  public toSimpleFormat(): {
    id: string;
    name: string;
    state: string;
    mood: number;
    energy: number;
    health: number;
    position: { x: number; y: number };
    birthTime: number;
    profession?: string;
    age?: number;
    relationships?: Array<{ targetId: string; type: string; strength: number }>;
    memories?: Array<{ event: string; timestamp: number; emotion: string; importance?: number }>;
    geneticInfluences?: {
      dominantTraits: string[];
      attributeBonuses: Array<{ name: string; value: number }>;
      behaviorProbabilities: Array<{ name: string; probability: number }>;
    };
    personalityTraits?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
  } {
    return {
      id: this.id,
      name: this.name,
      state: this.state.type,
      mood: this.state.mood,
      energy: this.state.energy,
      health: this.state.health,
      position: this.position.grid,
      birthTime: this.createdAt,
      profession: this.attributes.socialStatus > 0.7 ? '领袖' : this.attributes.socialStatus > 0.4 ? '工匠' : '平民',
      age: Math.floor((Date.now() - this.createdAt) / (365 * 24 * 60 * 60 * 1000)),
      relationships: this.relations.map(r => ({
        targetId: r.targetId,
        type: r.type,
        strength: r.intimacy,
      })),
      memories: this.episodicMemory.slice(0, 10).map(m => ({
        event: m.description,
        timestamp: m.timestamp,
        emotion: m.emotionalValence > 0.2 ? 'happy' : m.emotionalValence < -0.2 ? 'sad' : 'neutral',
        importance: m.importance,
      })),
      geneticInfluences: this.getGeneticInfluenceSummary(),
      personalityTraits: this.personalityTraits || undefined,
    };
  }

  /**
   * 创建快照
   */
  public toSnapshot(): CitizenSnapshot {
    return {
      id: this.id,
      name: this.name,
      genome: { ...this.genome },
      phenotype: { ...this.phenotype },
      state: { ...this.state },
      position: { ...this.position },
      memories: [...this.memories],
      relations: [...this.relations],
      statistics: this.getStatistics(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 从快照恢复
   */
  public static fromSnapshot(snapshot: CitizenSnapshot, worldId: EntityId): Citizen {
    const citizen = new Citizen(worldId, snapshot.name);
    Object.assign(citizen, snapshot);
    return citizen;
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): CitizenStatistics {
    const avgIntimacy =
      this.relations.length > 0
        ? this.relations.reduce((sum, r) => sum + r.intimacy, 0) / this.relations.length
        : 0;

    return {
      totalBirths: 1,
      totalDeaths: 0,
      averageLifespan: Date.now() - this.createdAt,
      totalInteractions: this.relations.length,
      averageEnergy: this.state.energy,
      maxEnergy: Math.max(this.state.energy, 0),
      minEnergy: Math.min(this.state.energy, 0),
    };
  }

  /**
   * 获取 LOD 级别
   */
  public getLODLevel(): LODLevel {
    return this.lodLevel;
  }

  /**
   * 获取渲染数据（根据 LOD 级别）
   */
  public getRenderData(): {
    position: Vec3;
    lodLevel: LODLevel;
    visible: boolean;
    color?: string;
    character?: string;
    faceData?: unknown;
    neuralActivity?: number;
  } {
    const baseData = {
      position: this.position.world,
      lodLevel: this.lodLevel,
      visible: this.visible,
      neuralActivity: this.getAverageFiringRate(),
    };

    switch (this.lodLevel) {
      case LODLevel.CLOUD:
        return {
          ...baseData,
          character: this.getCloudCharacter(),
          color: this.getMoodColor(),
        };

      case LODLevel.GRID:
        return {
          ...baseData,
          color: this.getMoodColor(),
        };

      case LODLevel.VOXEL:
        return {
          ...baseData,
          color: this.getMoodColor(),
          character: this.getVoxelCharacter(),
        };

      case LODLevel.PORTRAIT:
        return {
          ...baseData,
          color: this.getMoodColor(),
          faceData: this.phenotype,
        };
    }
  }

  /**
   * 获取云层字符（用于代码雨）
   */
  private getCloudCharacter(): string {
    const chars = '永夜熵纪数字市民0123456789';
    const index = this.id.charCodeAt(0) % chars.length;
    return chars[index] || '民';
  }

  /**
   * 获取体素小人字符
   */
  private getVoxelCharacter(): string {
    const intensity = this.state.energy / 100;
    const chars = '▪▫';
    return intensity > 0.5 ? chars[0] : chars[1];
  }

  /**
   * 获取心情颜色（根据神经活动增强）
   */
  private getMoodColor(): string {
    const mood = this.state.mood;
    const neuralActivity = this.getAverageFiringRate();
    
    // 神经活动影响颜色饱和度
    const saturation = 1 + neuralActivity * 0.5;
    
    if (mood > 80) return '#39ff14'; // 绿色
    if (mood > 60) return '#00f0ff'; // 青色
    if (mood > 40) return '#ffff00'; // 黄色
    if (mood > 20) return '#ff6600'; // 橙色
    return '#ff3333'; // 红色
  }

  /**
   * 死亡
   */
  public isDead(): boolean {
    return this.state.health <= 0;
  }

  /**
   * 应用司法判决效果
   */
  public applySentenceEffect(
    sentence: import('../governance/DAOSystem').SentenceDetail
  ): { success: boolean; message: string } {
    const SentenceType = require('../governance/DAOSystem').SentenceType;

    switch (sentence.type) {
      case SentenceType.FINE: {
        const amount = sentence.amount || 100;
        if (this.money < amount) {
          this.state.mood = Math.max(0, this.state.mood - 20);
          return { success: false, message: '金钱不足，无法支付罚款' };
        }
        this.money -= amount;
        this.state.mood = Math.max(0, this.state.mood - 10);
        return { success: true, message: `罚款${amount}已扣除` };
      }

      case SentenceType.IMPRISONMENT: {
        const duration = sentence.duration || 30;
        this.judicialState.isImprisoned = true;
        this.judicialState.imprisonmentRemaining = duration;
        this.freedom = Math.max(0, this.freedom - 50);
        this.state.mood = Math.max(0, this.state.mood - 30);
        this.state.energy = Math.max(0, this.state.energy - 20);
        return { success: true, message: `监禁${duration}天已开始` };
      }

      case SentenceType.EXILE: {
        this.judicialState.isExiled = true;
        this.judicialState.exileLocation = { x: 0, y: 0 };
        this.position.grid = { x: 0, y: 0 };
        this.position.world = { x: 0, y: 0, z: 0 };
        this.state.mood = Math.max(0, this.state.mood - 40);
        return { success: true, message: '已被流放到边缘区域' };
      }

      case SentenceType.COMMUNITY_SERVICE: {
        const duration = sentence.duration || 7;
        this.state.energy = Math.max(0, this.state.energy - duration * 5);
        this.state.mood = Math.max(0, this.state.mood - 5);
        return { success: true, message: `社区服务${duration}天已开始` };
      }

      case SentenceType.DEATH_PENALTY: {
        this.state.health = 0;
        this.state.energy = 0;
        return { success: true, message: '死刑已执行' };
      }

      case SentenceType.RIGHTS_RESTRICTION: {
        this.judicialState.restrictedRights.push('voting', 'office');
        this.state.mood = Math.max(0, this.state.mood - 15);
        return { success: true, message: '权利限制已生效' };
      }

      case SentenceType.PROBATION: {
        this.judicialState.isOnProbation = true;
        this.judicialState.probationRemaining = sentence.probationPeriod || 30;
        return { success: true, message: `缓刑${sentence.probationPeriod || 30}天已开始` };
      }

      case SentenceType.COMPENSATION: {
        const amount = sentence.amount || 50;
        if (this.money < amount) {
          return { success: false, message: '金钱不足，无法支付赔偿' };
        }
        this.money -= amount;
        this.state.mood = Math.max(0, this.state.mood - 5);
        return { success: true, message: `赔偿${amount}已支付` };
      }

      default:
        return { success: false, message: '未知判决类型' };
    }
  }

  /**
   * 更新司法状态（每日调用）
   */
  public updateJudicialState(deltaDays: number): void {
    if (this.judicialState.isImprisoned && this.judicialState.imprisonmentRemaining) {
      this.judicialState.imprisonmentRemaining = Math.max(0, this.judicialState.imprisonmentRemaining - deltaDays);
      if (this.judicialState.imprisonmentRemaining <= 0) {
        this.judicialState.isImprisoned = false;
        this.judicialState.imprisonmentRemaining = undefined;
        this.freedom = Math.min(100, this.freedom + 30);
        this.addEpisodicMemory('achievement', '刑满释放', '完成了监禁刑期，重获自由', {
          emotionalValence: 0.5,
          importance: 0.7,
        });
      }
    }

    if (this.judicialState.isOnProbation && this.judicialState.probationRemaining) {
      this.judicialState.probationRemaining = Math.max(0, this.judicialState.probationRemaining - deltaDays);
      if (this.judicialState.probationRemaining <= 0) {
        this.judicialState.isOnProbation = false;
        this.judicialState.probationRemaining = undefined;
        this.addEpisodicMemory('achievement', '缓刑期满', '顺利度过缓刑期', {
          emotionalValence: 0.3,
          importance: 0.5,
        });
      }
    }
  }

  /**
   * 检查是否有特定权利
   */
  public hasRight(right: string): boolean {
    return !this.judicialState.restrictedRights.includes(right);
  }

  /**
   * 获取司法状态摘要
   */
  public getJudicialSummary(): {
    isImprisoned: boolean;
    isExiled: boolean;
    isOnProbation: boolean;
    criminalRecord: number;
    pendingSentences: number;
  } {
    return {
      isImprisoned: this.judicialState.isImprisoned,
      isExiled: this.judicialState.isExiled,
      isOnProbation: this.judicialState.isOnProbation,
      criminalRecord: this.judicialState.criminalRecord,
      pendingSentences: this.judicialState.pendingSentences.length,
    };
  }

  /**
   * 获取神经元数量（根据状态）
   */
  public getNeuronCount(): number {
    switch (this.state.type) {
      case CitizenStateType.DORMANT:
        return 16; // 元胞自动机
      case CitizenStateType.BACKGROUND:
        return 64; // 简化 SNN
      case CitizenStateType.ACTIVE:
        return 256; // 完整 SNN
    }
  }
}
