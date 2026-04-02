/**
 * =============================================================================
 * DIVINE INTERVENTION SYSTEM - 极致神力干预系统
 * THE ULTIMATE DIVINE INTERVENTION SYSTEM
 * 
 * 特性：
 * 1. 神力类型系统 - 12种神力，每种有独特效果
 * 2. 因果链追踪 - 记录每次干预的蝴蝶效应
 * 3. 神力冷却系统 - 平衡游戏性
 * 4. 神力组合技 - 多种神力组合产生特殊效果
 * 5. 信仰系统 - 市民对神的信仰影响神力强度
 * 6. 神迹可视化 - 壮观的视觉特效
 * 7. 代价系统 - 每次干预都有代价
 * 8. 历史记录 - 完整的神力使用历史
 * =============================================================================
 */

import { observationValueSystem, ObservationType } from './ObservationValueSystem';
import { logger } from '@/core/utils/Logger';

/**
 * 神力类型
 */
export enum DivinePowerType {
  CREATION = 'creation',           // 创造 - 创造生命、物质
  DESTRUCTION = 'destruction',     // 毁灭 - 摧毁建筑、生命
  HEALING = 'healing',             // 治愈 - 恢复健康、修复建筑
  CURSE = 'curse',                 // 诅咒 - 降下厄运
  BLESSING = 'blessing',           // 祝福 - 赐予好运
  TIME_MANIPULATION = 'time',      // 时间 - 加速、倒流、暂停
  WEATHER_CONTROL = 'weather',     // 天气 - 控制气候
  MIND_CONTROL = 'mind',           // 心灵 - 影响思想、情感
  MATTER_TRANSFORMATION = 'matter', // 物质 - 转化物质形态
  REALITY_WARPING = 'reality',     // 现实 - 扭曲现实法则
  LIFE_DEATH = 'life_death',       // 生死 - 掌控生死界限
  COSMIC = 'cosmic',               // 宇宙 - 操控宇宙力量
}

/**
 * 神力等级
 */
export enum DivinePowerTier {
  MINOR = 'minor',           // 微小神力
  MODERATE = 'moderate',     // 中等神力
  MAJOR = 'major',           // 强大神力
  LEGENDARY = 'legendary',   // 传奇神力
  DIVINE = 'divine',         // 神圣神力
  TRANSCENDENT = 'transcendent', // 超越神力
}

/**
 * 神力定义
 */
export interface DivinePower {
  id: string;
  type: DivinePowerType;
  name: string;
  description: string;
  tier: DivinePowerTier;
  cooldown: number;
  currentCooldown: number;
  cost: DivinePowerCost;
  range: number;
  duration: number;
  intensity: number;
  requirements: DivinePowerRequirement[];
  effects: DivineEffect[];
  visualEffect: VisualEffectConfig;
  soundEffect: string;
  unlocked: boolean;
  usageCount: number;
}

/**
 * 神力代价
 */
export interface DivinePowerCost {
  faith: number;
  entropy: number;
  karma: number;
  observationPoints: number;
}

/**
 * 神力需求
 */
export interface DivinePowerRequirement {
  type: 'level' | 'achievement' | 'observation' | 'faith';
  value: number;
  met: boolean;
}

/**
 * 神力效果
 */
export interface DivineEffect {
  type: DivineEffectType;
  target: DivineEffectTarget;
  value: number;
  duration: number;
  probability: number;
  conditions?: Record<string, unknown>;
}

/**
 * 神力效果类型
 */
export enum DivineEffectType {
  HEAL = 'heal',
  DAMAGE = 'damage',
  BUFF = 'buff',
  DEBUFF = 'debuff',
  TRANSFORM = 'transform',
  SUMMON = 'summon',
  DISPEL = 'dispel',
  PROTECT = 'protect',
  EMPOWER = 'empower',
  WEAKEN = 'weaken',
  REVIVE = 'revive',
  KILL = 'kill',
  AGE = 'age',
  YOUTH = 'youth',
  MUTATE = 'mutate',
  EVOLVE = 'evolve',
}

/**
 * 神力效果目标
 */
export enum DivineEffectTarget {
  SELF = 'self',
  SINGLE = 'single',
  AREA = 'area',
  GLOBAL = 'global',
  FACTION = 'faction',
  TYPE = 'type',
}

/**
 * 视觉效果配置
 */
export interface VisualEffectConfig {
  particleType: string;
  color: [number, number, number];
  intensity: number;
  duration: number;
  radius: number;
  height: number;
  pattern: 'burst' | 'beam' | 'wave' | 'spiral' | 'aura' | 'rain';
}

/**
 * 干预记录
 */
export interface InterventionRecord {
  id: string;
  powerId: string;
  powerType: DivinePowerType;
  timestamp: number;
  position: [number, number, number];
  targetIds: string[];
  effects: DivineEffect[];
  causalChain: CausalChainNode[];
  cost: DivinePowerCost;
  result: InterventionResult;
  significance: number;
}

/**
 * 因果链节点
 */
export interface CausalChainNode {
  id: string;
  timestamp: number;
  type: 'direct' | 'indirect' | 'butterfly';
  description: string;
  affectedEntities: string[];
  consequences: CausalConsequence[];
  probability: number;
}

/**
 * 因果后果
 */
export interface CausalConsequence {
  type: string;
  description: string;
  magnitude: number;
  delay: number;
}

/**
 * 干预结果
 */
export interface InterventionResult {
  success: boolean;
  affectedCount: number;
  totalEffect: number;
  sideEffects: string[];
  karmaChange: number;
  faithChange: number;
}

/**
 * 信仰系统
 */
export interface FaithSystem {
  globalFaith: number;
  factionFaith: Map<string, number>;
  individualFaith: Map<string, number>;
  faithTrend: number;
  miraclesPerformed: number;
  prayersAnswered: number;
  templesBuilt: number;
  sacrificesOffered: number;
}

/**
 * 业力系统
 */
export interface KarmaSystem {
  currentKarma: number;
  maxKarma: number;
  karmaHistory: KarmaEvent[];
  karmaMultiplier: number;
  karmaDecayRate: number;
}

/**
 * 业力事件
 */
export interface KarmaEvent {
  id: string;
  timestamp: number;
  change: number;
  reason: string;
  powerType: DivinePowerType;
}

/**
 * 神力组合
 */
export interface DivinePowerCombo {
  id: string;
  name: string;
  description: string;
  powers: DivinePowerType[];
  bonusEffects: DivineEffect[];
  reducedCost: number;
  unlocked: boolean;
}

/**
 * 神力干预系统 - 主类
 */
export class DivineInterventionSystem {
  private powers: Map<string, DivinePower> = new Map();
  private interventionHistory: InterventionRecord[] = [];
  private faithSystem: FaithSystem;
  private karmaSystem: KarmaSystem;
  private combos: DivinePowerCombo[] = [];
  
  private activeEffects: Map<string, ActiveDivineEffect> = new Map();
  private causalChains: Map<string, CausalChainNode[]> = new Map();
  
  private lastInterventionTime: number = 0;
  private totalInterventions: number = 0;
  
  private static readonly POWER_DEFINITIONS: Partial<DivinePower>[] = [
    {
      id: 'create_life',
      type: DivinePowerType.CREATION,
      name: '创生之手',
      description: '创造新的生命体',
      tier: DivinePowerTier.MAJOR,
      cooldown: 300000,
      cost: { faith: 50, entropy: 10, karma: -20, observationPoints: 1000 },
      range: 50,
      duration: 0,
      intensity: 1.0,
      effects: [
        { type: DivineEffectType.SUMMON, target: DivineEffectTarget.SINGLE, value: 1, duration: 0, probability: 1.0 }
      ],
      visualEffect: {
        particleType: 'creation',
        color: [255, 215, 0],
        intensity: 1.0,
        duration: 3000,
        radius: 10,
        height: 5,
        pattern: 'burst'
      }
    },
    {
      id: 'smite',
      type: DivinePowerType.DESTRUCTION,
      name: '神罚',
      description: '降下毁灭性的打击',
      tier: DivinePowerTier.LEGENDARY,
      cooldown: 600000,
      cost: { faith: 100, entropy: 50, karma: -100, observationPoints: 5000 },
      range: 100,
      duration: 0,
      intensity: 2.0,
      effects: [
        { type: DivineEffectType.DAMAGE, target: DivineEffectTarget.AREA, value: 1000, duration: 0, probability: 1.0 }
      ],
      visualEffect: {
        particleType: 'lightning',
        color: [255, 255, 255],
        intensity: 2.0,
        duration: 2000,
        radius: 30,
        height: 100,
        pattern: 'beam'
      }
    },
    {
      id: 'heal_all',
      type: DivinePowerType.HEALING,
      name: '神圣治愈',
      description: '治愈范围内的所有生命',
      tier: DivinePowerTier.MODERATE,
      cooldown: 120000,
      cost: { faith: 30, entropy: 5, karma: 30, observationPoints: 500 },
      range: 50,
      duration: 5000,
      intensity: 1.0,
      effects: [
        { type: DivineEffectType.HEAL, target: DivineEffectTarget.AREA, value: 100, duration: 5000, probability: 1.0 }
      ],
      visualEffect: {
        particleType: 'healing',
        color: [144, 238, 144],
        intensity: 1.0,
        duration: 5000,
        radius: 50,
        height: 10,
        pattern: 'aura'
      }
    },
    {
      id: 'curse',
      type: DivinePowerType.CURSE,
      name: '厄运诅咒',
      description: '对目标降下诅咒',
      tier: DivinePowerTier.MODERATE,
      cooldown: 180000,
      cost: { faith: 40, entropy: 20, karma: -50, observationPoints: 800 },
      range: 30,
      duration: 60000,
      intensity: 1.0,
      effects: [
        { type: DivineEffectType.DEBUFF, target: DivineEffectTarget.SINGLE, value: -50, duration: 60000, probability: 0.9 }
      ],
      visualEffect: {
        particleType: 'curse',
        color: [128, 0, 128],
        intensity: 1.0,
        duration: 2000,
        radius: 5,
        height: 3,
        pattern: 'spiral'
      }
    },
    {
      id: 'blessing',
      type: DivinePowerType.BLESSING,
      name: '神圣祝福',
      description: '赐予目标祝福',
      tier: DivinePowerTier.MINOR,
      cooldown: 60000,
      cost: { faith: 20, entropy: 5, karma: 20, observationPoints: 200 },
      range: 30,
      duration: 300000,
      intensity: 1.0,
      effects: [
        { type: DivineEffectType.BUFF, target: DivineEffectTarget.SINGLE, value: 50, duration: 300000, probability: 1.0 }
      ],
      visualEffect: {
        particleType: 'blessing',
        color: [255, 223, 0],
        intensity: 0.8,
        duration: 3000,
        radius: 10,
        height: 5,
        pattern: 'aura'
      }
    },
    {
      id: 'time_accelerate',
      type: DivinePowerType.TIME_MANIPULATION,
      name: '时间加速',
      description: '加速目标区域的时间流逝',
      tier: DivinePowerTier.MAJOR,
      cooldown: 300000,
      cost: { faith: 60, entropy: 30, karma: -10, observationPoints: 2000 },
      range: 100,
      duration: 60000,
      intensity: 10.0,
      effects: [
        { type: DivineEffectType.BUFF, target: DivineEffectTarget.AREA, value: 10, duration: 60000, probability: 1.0, conditions: { type: 'time_multiplier' } }
      ],
      visualEffect: {
        particleType: 'time',
        color: [0, 191, 255],
        intensity: 1.5,
        duration: 60000,
        radius: 100,
        height: 20,
        pattern: 'wave'
      }
    },
    {
      id: 'time_reverse',
      type: DivinePowerType.TIME_MANIPULATION,
      name: '时间倒流',
      description: '将目标区域的时间倒流',
      tier: DivinePowerTier.LEGENDARY,
      cooldown: 900000,
      cost: { faith: 150, entropy: 100, karma: -50, observationPoints: 10000 },
      range: 50,
      duration: 30000,
      intensity: -5.0,
      effects: [
        { type: DivineEffectType.HEAL, target: DivineEffectTarget.AREA, value: 200, duration: 0, probability: 0.8, conditions: { type: 'time_reverse' } }
      ],
      visualEffect: {
        particleType: 'time_reverse',
        color: [138, 43, 226],
        intensity: 2.0,
        duration: 5000,
        radius: 50,
        height: 30,
        pattern: 'spiral'
      }
    },
    {
      id: 'storm',
      type: DivinePowerType.WEATHER_CONTROL,
      name: '风暴召唤',
      description: '召唤一场强大的风暴',
      tier: DivinePowerTier.MAJOR,
      cooldown: 240000,
      cost: { faith: 50, entropy: 25, karma: -30, observationPoints: 1500 },
      range: 200,
      duration: 120000,
      intensity: 1.0,
      effects: [
        { type: DivineEffectType.DAMAGE, target: DivineEffectTarget.AREA, value: 50, duration: 120000, probability: 0.3 }
      ],
      visualEffect: {
        particleType: 'storm',
        color: [70, 130, 180],
        intensity: 1.5,
        duration: 120000,
        radius: 200,
        height: 50,
        pattern: 'wave'
      }
    },
    {
      id: 'inspire',
      type: DivinePowerType.MIND_CONTROL,
      name: '神启',
      description: '向目标灌输神圣灵感',
      tier: DivinePowerTier.MODERATE,
      cooldown: 150000,
      cost: { faith: 35, entropy: 10, karma: 15, observationPoints: 600 },
      range: 50,
      duration: 300000,
      intensity: 1.0,
      effects: [
        { type: DivineEffectType.EMPOWER, target: DivineEffectTarget.SINGLE, value: 100, duration: 300000, probability: 0.8 }
      ],
      visualEffect: {
        particleType: 'inspiration',
        color: [255, 255, 224],
        intensity: 1.0,
        duration: 5000,
        radius: 15,
        height: 10,
        pattern: 'burst'
      }
    },
    {
      id: 'transmute',
      type: DivinePowerType.MATTER_TRANSFORMATION,
      name: '物质转化',
      description: '将一种物质转化为另一种',
      tier: DivinePowerTier.MAJOR,
      cooldown: 200000,
      cost: { faith: 45, entropy: 35, karma: 0, observationPoints: 1200 },
      range: 20,
      duration: 0,
      intensity: 1.0,
      effects: [
        { type: DivineEffectType.TRANSFORM, target: DivineEffectTarget.SINGLE, value: 1, duration: 0, probability: 1.0 }
      ],
      visualEffect: {
        particleType: 'transmute',
        color: [255, 140, 0],
        intensity: 1.2,
        duration: 3000,
        radius: 20,
        height: 5,
        pattern: 'spiral'
      }
    },
    {
      id: 'miracle',
      type: DivinePowerType.REALITY_WARPING,
      name: '奇迹',
      description: '扭曲现实，创造奇迹',
      tier: DivinePowerTier.DIVINE,
      cooldown: 1800000,
      cost: { faith: 200, entropy: 150, karma: 100, observationPoints: 50000 },
      range: 100,
      duration: 0,
      intensity: 3.0,
      effects: [
        { type: DivineEffectType.HEAL, target: DivineEffectTarget.AREA, value: 500, duration: 0, probability: 1.0 },
        { type: DivineEffectType.BUFF, target: DivineEffectTarget.AREA, value: 200, duration: 600000, probability: 1.0 },
        { type: DivineEffectType.EMPOWER, target: DivineEffectTarget.AREA, value: 300, duration: 600000, probability: 1.0 }
      ],
      visualEffect: {
        particleType: 'miracle',
        color: [255, 255, 255],
        intensity: 3.0,
        duration: 10000,
        radius: 100,
        height: 50,
        pattern: 'burst'
      }
    },
    {
      id: 'resurrect',
      type: DivinePowerType.LIFE_DEATH,
      name: '复活',
      description: '将死者带回人间',
      tier: DivinePowerTier.LEGENDARY,
      cooldown: 600000,
      cost: { faith: 100, entropy: 80, karma: 50, observationPoints: 8000 },
      range: 10,
      duration: 0,
      intensity: 1.0,
      effects: [
        { type: DivineEffectType.REVIVE, target: DivineEffectTarget.SINGLE, value: 1, duration: 0, probability: 0.7 }
      ],
      visualEffect: {
        particleType: 'resurrection',
        color: [255, 250, 205],
        intensity: 2.0,
        duration: 8000,
        radius: 10,
        height: 15,
        pattern: 'beam'
      }
    },
    {
      id: 'cosmic_event',
      type: DivinePowerType.COSMIC,
      name: '宇宙事件',
      description: '触发一个宇宙级事件',
      tier: DivinePowerTier.TRANSCENDENT,
      cooldown: 3600000,
      cost: { faith: 500, entropy: 300, karma: -200, observationPoints: 100000 },
      range: 1000,
      duration: 300000,
      intensity: 5.0,
      effects: [
        { type: DivineEffectType.EVOLVE, target: DivineEffectTarget.GLOBAL, value: 1, duration: 0, probability: 0.5 }
      ],
      visualEffect: {
        particleType: 'cosmic',
        color: [75, 0, 130],
        intensity: 5.0,
        duration: 30000,
        radius: 500,
        height: 200,
        pattern: 'burst'
      }
    },
  ];
  
  private static readonly COMBO_DEFINITIONS: DivinePowerCombo[] = [
    {
      id: 'creation_destruction',
      name: '创世循环',
      description: '同时使用创造和毁灭，达到平衡',
      powers: [DivinePowerType.CREATION, DivinePowerType.DESTRUCTION],
      bonusEffects: [
        { type: DivineEffectType.BUFF, target: DivineEffectTarget.AREA, value: 100, duration: 60000, probability: 1.0 }
      ],
      reducedCost: 0.3,
      unlocked: false
    },
    {
      id: 'life_death_cycle',
      name: '生死轮回',
      description: '掌控生死，形成循环',
      powers: [DivinePowerType.LIFE_DEATH, DivinePowerType.HEALING],
      bonusEffects: [
        { type: DivineEffectType.EMPOWER, target: DivineEffectTarget.AREA, value: 200, duration: 120000, probability: 1.0 }
      ],
      reducedCost: 0.4,
      unlocked: false
    },
    {
      id: 'time_space',
      name: '时空主宰',
      description: '操控时间和空间',
      powers: [DivinePowerType.TIME_MANIPULATION, DivinePowerType.REALITY_WARPING],
      bonusEffects: [
        { type: DivineEffectType.TRANSFORM, target: DivineEffectTarget.GLOBAL, value: 1, duration: 0, probability: 0.5 }
      ],
      reducedCost: 0.5,
      unlocked: false
    },
    {
      id: 'divine_trinity',
      name: '神圣三位一体',
      description: '祝福、治愈、保护的完美结合',
      powers: [DivinePowerType.BLESSING, DivinePowerType.HEALING, DivinePowerType.COSMIC],
      bonusEffects: [
        { type: DivineEffectType.PROTECT, target: DivineEffectTarget.GLOBAL, value: 500, duration: 300000, probability: 1.0 }
      ],
      reducedCost: 0.6,
      unlocked: false
    },
  ];

  constructor() {
    this.initializePowers();
    this.initializeCombos();
    this.faithSystem = this.initFaithSystem();
    this.karmaSystem = this.initKarmaSystem();
  }
  
  /** V5修复：添加初始化方法 */
  public init(): void {
    // 重新初始化所有系统
    this.initializePowers();
    this.initializeCombos();
    this.faithSystem = this.initFaithSystem();
    this.karmaSystem = this.initKarmaSystem();
    this.activeEffects.clear();
    this.causalChains.clear();
    this.interventionHistory = [];
    this.lastInterventionTime = 0;
    this.totalInterventions = 0;
    logger.info('DivineInterventionSystem', 'Initialized');
  }
  
  private initializePowers(): void {
    for (const def of DivineInterventionSystem.POWER_DEFINITIONS) {
      const power: DivinePower = {
        id: def.id!,
        type: def.type!,
        name: def.name!,
        description: def.description!,
        tier: def.tier!,
        cooldown: def.cooldown!,
        currentCooldown: 0,
        cost: def.cost!,
        range: def.range!,
        duration: def.duration!,
        intensity: def.intensity!,
        requirements: def.requirements || [],
        effects: def.effects!,
        visualEffect: def.visualEffect!,
        soundEffect: def.soundEffect || 'divine',
        unlocked: def.tier === DivinePowerTier.MINOR || def.tier === DivinePowerTier.MODERATE,
        usageCount: 0,
      };
      this.powers.set(power.id, power);
    }
  }
  
  private initializeCombos(): void {
    this.combos = [...DivineInterventionSystem.COMBO_DEFINITIONS];
  }
  
  private initFaithSystem(): FaithSystem {
    return {
      globalFaith: 50,
      factionFaith: new Map(),
      individualFaith: new Map(),
      faithTrend: 0,
      miraclesPerformed: 0,
      prayersAnswered: 0,
      templesBuilt: 0,
      sacrificesOffered: 0,
    };
  }
  
  private initKarmaSystem(): KarmaSystem {
    return {
      currentKarma: 0,
      maxKarma: 1000,
      karmaHistory: [],
      karmaMultiplier: 1.0,
      karmaDecayRate: 0.01,
    };
  }
  
  public async intervene(
    powerId: string,
    position: [number, number, number],
    targetIds: string[] = [],
    additionalParams: Record<string, unknown> = {}
  ): Promise<InterventionRecord> {
    const power = this.powers.get(powerId);
    
    if (!power) {
      throw new Error(`Power not found: ${powerId}`);
    }
    
    if (!power.unlocked) {
      throw new Error(`Power not unlocked: ${power.name}`);
    }
    
    if (power.currentCooldown > 0) {
      throw new Error(`Power on cooldown: ${power.name} (${Math.ceil(power.currentCooldown / 1000)}s remaining)`);
    }
    
    if (!this.canAfford(power.cost)) {
      throw new Error(`Insufficient resources for: ${power.name}`);
    }
    
    const now = Date.now();
    
    this.payCost(power.cost);
    
    power.currentCooldown = power.cooldown;
    power.usageCount++;
    this.totalInterventions++;
    this.lastInterventionTime = now;
    
    const effects = this.applyEffects(power, position, targetIds, additionalParams);
    
    const causalChain = this.generateCausalChain(power, position, targetIds, effects);
    
    const result = this.calculateResult(power, effects, targetIds);
    
    this.updateFaith(power, result);
    this.updateKarma(power, result);
    
    const record: InterventionRecord = {
      id: crypto.randomUUID(),
      powerId,
      powerType: power.type,
      timestamp: now,
      position,
      targetIds,
      effects,
      causalChain,
      cost: { ...power.cost },
      result,
      significance: this.calculateSignificance(power, result),
    };
    
    this.interventionHistory.push(record);
    
    observationValueSystem.observe(
      ObservationType.DIVINE_INTERVENTION,
      `使用神力: ${power.name}`,
      { powerType: power.type, tier: power.tier, affectedCount: result.affectedCount },
      causalChain.map(c => c.id)
    );
    
    this.checkComboUnlock();
    logger.info(
      'DivineInterventionSystem',
      `${power.name} used at (${position.join(', ')}) - ${result.affectedCount} affected`
    );
    
    return record;
  }
  
  private canAfford(cost: DivinePowerCost): boolean {
    return (
      this.faithSystem.globalFaith >= cost.faith &&
      observationValueSystem.getTotalPoints() >= cost.observationPoints
    );
  }
  
  private payCost(cost: DivinePowerCost): void {
    this.faithSystem.globalFaith -= cost.faith;
  }
  
  private applyEffects(
    power: DivinePower,
    position: [number, number, number],
    targetIds: string[],
    params: Record<string, unknown>
  ): DivineEffect[] {
    const appliedEffects: DivineEffect[] = [];
    
    for (const effect of power.effects) {
      if (Math.random() > effect.probability) continue;
      
      let modifiedEffect = { ...effect };
      
      const karmaBonus = this.karmaSystem.currentKarma > 0 ? 1.1 : 0.9;
      modifiedEffect.value *= karmaBonus;
      
      const faithBonus = 1 + (this.faithSystem.globalFaith / 1000);
      modifiedEffect.value *= faithBonus;
      
      modifiedEffect.value *= power.intensity;
      
      const activeEffect: ActiveDivineEffect = {
        id: crypto.randomUUID(),
        effect: modifiedEffect,
        source: power.id,
        position,
        targetIds,
        startTime: Date.now(),
        endTime: Date.now() + modifiedEffect.duration,
        active: true,
      };
      
      this.activeEffects.set(activeEffect.id, activeEffect);
      
      appliedEffects.push(modifiedEffect);
    }
    
    return appliedEffects;
  }
  
  private generateCausalChain(
    power: DivinePower,
    position: [number, number, number],
    targetIds: string[],
    effects: DivineEffect[]
  ): CausalChainNode[] {
    const chain: CausalChainNode[] = [];
    
    const directNode: CausalChainNode = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'direct',
      description: `直接效果: ${power.name}`,
      affectedEntities: targetIds,
      consequences: effects.map(e => ({
        type: e.type,
        description: `${e.type} 效果，强度 ${e.value}`,
        magnitude: Math.abs(e.value),
        delay: 0,
      })),
      probability: 1.0,
    };
    chain.push(directNode);
    
    const indirectConsequences = this.generateIndirectConsequences(power, effects);
    if (indirectConsequences.length > 0) {
      const indirectNode: CausalChainNode = {
        id: crypto.randomUUID(),
        timestamp: Date.now() + 1000,
        type: 'indirect',
        description: `间接影响: ${power.name}`,
        affectedEntities: [],
        consequences: indirectConsequences,
        probability: 0.7,
      };
      chain.push(indirectNode);
    }
    
    if (power.tier === DivinePowerTier.LEGENDARY || power.tier === DivinePowerTier.DIVINE || power.tier === DivinePowerTier.TRANSCENDENT) {
      const butterflyNode: CausalChainNode = {
        id: crypto.randomUUID(),
        timestamp: Date.now() + 10000,
        type: 'butterfly',
        description: `蝴蝶效应: ${power.name}`,
        affectedEntities: [],
        consequences: [
          {
            type: 'unknown',
            description: '未知的连锁反应',
            magnitude: power.intensity * 10,
            delay: Math.random() * 86400000,
          }
        ],
        probability: 0.3,
      };
      chain.push(butterflyNode);
    }
    
    this.causalChains.set(power.id, chain);
    
    return chain;
  }
  
  private generateIndirectConsequences(power: DivinePower, effects: DivineEffect[]): CausalConsequence[] {
    const consequences: CausalConsequence[] = [];
    
    for (const effect of effects) {
      switch (effect.type) {
        case DivineEffectType.HEAL:
          consequences.push({
            type: 'population_growth',
            description: '治愈可能导致人口增长',
            magnitude: effect.value * 0.1,
            delay: 86400000,
          });
          break;
        case DivineEffectType.DAMAGE:
          consequences.push({
            type: 'fear',
            description: '破坏可能引发恐惧',
            magnitude: effect.value * 0.2,
            delay: 3600000,
          });
          break;
        case DivineEffectType.BUFF:
          consequences.push({
            type: 'productivity',
            description: '增益可能提高生产力',
            magnitude: effect.value * 0.05,
            delay: 7200000,
          });
          break;
        case DivineEffectType.DEBUFF:
          consequences.push({
            type: 'unrest',
            description: '减益可能引发不满',
            magnitude: effect.value * 0.15,
            delay: 1800000,
          });
          break;
      }
    }
    
    return consequences;
  }
  
  private calculateResult(
    power: DivinePower,
    effects: DivineEffect[],
    targetIds: string[]
  ): InterventionResult {
    const success = effects.length > 0;
    const affectedCount = targetIds.length || Math.floor(Math.random() * 10 + 1);
    const totalEffect = effects.reduce((sum, e) => sum + Math.abs(e.value), 0);
    
    const sideEffects: string[] = [];
    if (power.cost.karma < 0) {
      sideEffects.push('业力下降');
    }
    if (power.cost.entropy > 50) {
      sideEffects.push('熵增加速');
    }
    if (power.tier === DivinePowerTier.TRANSCENDENT) {
      sideEffects.push('现实扭曲');
    }
    
    const karmaChange = power.cost.karma;
    const faithChange = success ? 5 : -10;
    
    return {
      success,
      affectedCount,
      totalEffect,
      sideEffects,
      karmaChange,
      faithChange,
    };
  }
  
  private updateFaith(power: DivinePower, result: InterventionResult): void {
    this.faithSystem.globalFaith += result.faithChange;
    this.faithSystem.globalFaith = Math.max(0, Math.min(1000, this.faithSystem.globalFaith));
    
    if (result.success) {
      this.faithSystem.miraclesPerformed++;
    }
    
    const trend = result.faithChange > 0 ? 0.1 : -0.1;
    this.faithSystem.faithTrend = this.faithSystem.faithTrend * 0.9 + trend * 0.1;
  }
  
  private updateKarma(power: DivinePower, result: InterventionResult): void {
    const karmaChange = result.karmaChange * this.karmaSystem.karmaMultiplier;
    
    this.karmaSystem.currentKarma += karmaChange;
    this.karmaSystem.currentKarma = Math.max(-this.karmaSystem.maxKarma, Math.min(this.karmaSystem.maxKarma, this.karmaSystem.currentKarma));
    
    this.karmaSystem.karmaHistory.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      change: karmaChange,
      reason: power.name,
      powerType: power.type,
    });
    
    if (this.karmaSystem.karmaHistory.length > 1000) {
      this.karmaSystem.karmaHistory.shift();
    }
  }
  
  private calculateSignificance(power: DivinePower, result: InterventionResult): number {
    let significance = 0.5;
    
    const tierWeights: Record<DivinePowerTier, number> = {
      [DivinePowerTier.MINOR]: 0.1,
      [DivinePowerTier.MODERATE]: 0.2,
      [DivinePowerTier.MAJOR]: 0.4,
      [DivinePowerTier.LEGENDARY]: 0.6,
      [DivinePowerTier.DIVINE]: 0.8,
      [DivinePowerTier.TRANSCENDENT]: 1.0,
    };
    
    significance += tierWeights[power.tier] * 0.3;
    significance += Math.min(0.2, result.affectedCount / 1000);
    
    return Math.min(1, significance);
  }
  
  private checkComboUnlock(): void {
    const usedPowers = new Set<DivinePowerType>();
    
    for (const power of this.powers.values()) {
      if (power.usageCount > 0) {
        usedPowers.add(power.type);
      }
    }
    
    for (const combo of this.combos) {
      if (combo.unlocked) continue;
      
      const hasAllPowers = combo.powers.every(p => usedPowers.has(p));
      if (hasAllPowers) {
        combo.unlocked = true;
        logger.info('DivineInterventionSystem', `Combo unlocked: ${combo.name}`);
      }
    }
  }
  
  public update(deltaTime: number): void {
    for (const power of this.powers.values()) {
      if (power.currentCooldown > 0) {
        power.currentCooldown = Math.max(0, power.currentCooldown - deltaTime);
      }
    }
    
    const now = Date.now();
    for (const [id, activeEffect] of this.activeEffects) {
      if (now >= activeEffect.endTime) {
        activeEffect.active = false;
        this.activeEffects.delete(id);
      }
    }
    
    if (Math.random() < 0.01) {
      this.karmaSystem.currentKarma *= (1 - this.karmaSystem.karmaDecayRate);
    }
  }
  
  public getPower(id: string): DivinePower | undefined {
    return this.powers.get(id);
  }
  
  public getPowers(): DivinePower[] {
    return Array.from(this.powers.values());
  }
  
  public getAvailablePowers(): DivinePower[] {
    return this.getPowers().filter(p => p.unlocked && p.currentCooldown === 0);
  }
  
  public getPowersByType(type: DivinePowerType): DivinePower[] {
    return this.getPowers().filter(p => p.type === type);
  }
  
  public getPowersByTier(tier: DivinePowerTier): DivinePower[] {
    return this.getPowers().filter(p => p.tier === tier);
  }
  
  public getInterventionHistory(limit: number = 100): InterventionRecord[] {
    return this.interventionHistory.slice(-limit);
  }
  
  public getCausalChain(interventionId: string): CausalChainNode[] | undefined {
    return this.causalChains.get(interventionId);
  }
  
  public getFaithSystem(): FaithSystem {
    return { ...this.faithSystem };
  }
  
  public getKarmaSystem(): KarmaSystem {
    return { ...this.karmaSystem };
  }
  
  public getCombos(): DivinePowerCombo[] {
    return this.combos.filter(c => c.unlocked);
  }
  
  public getActiveEffects(): ActiveDivineEffect[] {
    return Array.from(this.activeEffects.values());
  }
  
  public getTotalInterventions(): number {
    return this.totalInterventions;
  }
  
  public unlockPower(powerId: string): boolean {
    const power = this.powers.get(powerId);
    if (power && !power.unlocked) {
      power.unlocked = true;
      logger.info('DivineInterventionSystem', `Power unlocked: ${power.name}`);
      return true;
    }
    return false;
  }
  
  public addFaith(amount: number): void {
    this.faithSystem.globalFaith = Math.max(0, Math.min(1000, this.faithSystem.globalFaith + amount));
  }
  
  public answerPrayer(): void {
    this.faithSystem.prayersAnswered++;
    this.addFaith(1);
  }
  
  public buildTemple(): void {
    this.faithSystem.templesBuilt++;
    this.addFaith(5);
  }
  
  public offerSacrifice(value: number): void {
    this.faithSystem.sacrificesOffered++;
    this.addFaith(value);
  }
}

/**
 * 活跃的神力效果
 */
interface ActiveDivineEffect {
  id: string;
  effect: DivineEffect;
  source: string;
  position: [number, number, number];
  targetIds: string[];
  startTime: number;
  endTime: number;
  active: boolean;
}

export const divineInterventionSystem = new DivineInterventionSystem();
export default DivineInterventionSystem;
