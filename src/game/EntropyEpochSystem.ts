/**
 * =============================================================================
 * 永夜熵纪 - 熵增纪元游戏化系统
 * Entropy Epoch Gamification System
 * =============================================================================
 */

import { logger } from '@/core/utils/Logger';

/** 核心资源 */
export interface CoreResources {
  /** 核心能源 */
  coreEnergy: number;
  maxCoreEnergy: number;
  /** 算力配额 */
  computeQuota: number;
  maxComputeQuota: number;
  /** 纯净生物质 */
  pureBiomass: number;
  maxPureBiomass: number;
}

/** 情感网络 */
export interface EmotionalNetwork {
  /** 不满值（0-1） */
  discontent: number;
  /** 希望值（0-1） */
  hope: number;
  /** 传播速度 */
  spreadRate: number;
}

/** 法案效果 */
export interface LawEffect {
  description: string;
  energyChange: number;
  biomassChange: number;
  discontentChange: number;
  hopeChange: number;
}

/** 灾难类型 */
export enum DisasterType {
  ABSOLUTE_ZERO_STORM = 'absolute_zero_storm',
  NETWORK_COLLAPSE = 'network_collapse',
  RESOURCE_SHORTAGE = 'resource_shortage',
  PANDEMIC = 'pandemic',
}

/** 灾难事件 */
export interface Disaster {
  type: DisasterType;
  intensity: number;
  duration: number;
  remainingTime: number;
  effects: Record<string, number>;
}

/** 阿卡夏记录 */
export interface AkashicRecord {
  totalFragments: number;
  inheritedGenes: string[];
  techLegacy: string[];
  divineBlessings: DivineBlessing[];
  achievements: Achievement[];
}

/** 神谕加持 */
export interface DivineBlessing {
  name: string;
  description: string;
  effect: Record<string, number>;
}

/** 成就 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  timestamp?: number;
}

/** 熵增纪元系统 */
export class EntropyEpochSystem {
  private resources: CoreResources;
  private emotionalNetwork: EmotionalNetwork;
  private disasterProbability: number = 0.01;
  private currentDisaster: Disaster | null = null;
  private eraLevel: number = 1;
  private energyDecayRate: number = 0.1;
  private akashicRecord: AkashicRecord;
  private achievements: Achievement[] = [];

  constructor() {
    this.resources = {
      coreEnergy: 100,
      maxCoreEnergy: 100,
      computeQuota: 50,
      maxComputeQuota: 100,
      pureBiomass: 100,
      maxPureBiomass: 100,
    };

    this.emotionalNetwork = {
      discontent: 0.2,
      hope: 0.5,
      spreadRate: 0.1,
    };

    this.akashicRecord = {
      totalFragments: 0,
      inheritedGenes: [],
      techLegacy: [],
      divineBlessings: [],
      achievements: [],
    };

    this.initializeAchievements();
  }

  /**
   * 初始化成就系统
   */
  private initializeAchievements(): void {
    this.achievements = [
      { id: 'survivor_1', name: '初阶生存者', description: '存活10分钟', unlocked: false },
      { id: 'survivor_2', name: '中阶生存者', description: '存活30分钟', unlocked: false },
      { id: 'survivor_3', name: '高阶生存者', description: '存活60分钟', unlocked: false },
      { id: 'energy_master', name: '能源大师', description: '达到1000核心能源', unlocked: false },
      { id: 'rebellion_suppressor', name: '平息叛乱', description: '将不满值降至10%以下', unlocked: false },
      { id: 'tech_achiever', name: '科技先锋', description: '研究10项科技', unlocked: false },
      { id: 'eternal_light', name: '永恒之光', description: '解锁永恒能源科技', unlocked: false },
    ];
  }

  /**
   * 更新系统
   */
  public update(dt: number): void {
    // 能源自然衰减
    this.resources.coreEnergy -= this.energyDecayRate * dt;
    this.resources.coreEnergy = Math.max(0, this.resources.coreEnergy);

    // 检查灾难
    this.checkDisaster(dt);

    // 更新情感网络
    this.updateEmotionalNetwork(dt);

    // 检查游戏结束条件
    if (this.resources.coreEnergy <= 0) {
      this.triggerGameOver();
    }

    // 更新成就
    this.checkAchievements();
  }

  /**
   * 检查灾难
   */
  private checkDisaster(dt: number): void {
    // 更新当前灾难
    if (this.currentDisaster) {
      this.currentDisaster.remainingTime -= dt;
      
      // 应用灾难效果
      for (const [key, value] of Object.entries(this.currentDisaster.effects)) {
        if (key === 'coreEnergy') {
          this.resources.coreEnergy -= value * dt;
        } else if (key === 'computeQuota') {
          this.resources.computeQuota -= value * dt;
        }
      }

      if (this.currentDisaster.remainingTime <= 0) {
        this.currentDisaster = null;
      }
      return;
    }

    // 随机触发灾难
    if (Math.random() < this.disasterProbability * dt) {
      this.triggerDisaster();
    }
  }

  /**
   * 触发灾难
   */
  private triggerDisaster(): void {
    const disasters = Object.values(DisasterType);
    const type = disasters[Math.floor(Math.random() * disasters.length)];
    const intensity = Math.min(1, 0.3 + this.eraLevel * 0.1);

    let disaster: Disaster;

    switch (type) {
      case DisasterType.ABSOLUTE_ZERO_STORM:
        disaster = {
          type,
          intensity,
          duration: 30,
          remainingTime: 30,
          effects: {
            coreEnergy: -5 * intensity,
            computeQuota: -2 * intensity,
          },
        };
        break;
      case DisasterType.NETWORK_COLLAPSE:
        disaster = {
          type,
          intensity,
          duration: 20,
          remainingTime: 20,
          effects: {
            computeQuota: -10 * intensity,
          },
        };
        break;
      case DisasterType.RESOURCE_SHORTAGE:
        disaster = {
          type,
          intensity,
          duration: 60,
          remainingTime: 60,
          effects: {
            pureBiomass: -3 * intensity,
          },
        };
        break;
      case DisasterType.PANDEMIC:
        disaster = {
          type,
          intensity,
          duration: 45,
          remainingTime: 45,
          effects: {
            computeQuota: -5 * intensity,
            pureBiomass: -2 * intensity,
          },
        };
        break;
    }

    this.currentDisaster = disaster;
  }

  /**
   * 更新情感网络
   */
  private updateEmotionalNetwork(dt: number): void {
    // 饥饿导致不满
    if (this.resources.pureBiomass < 20) {
      this.emotionalNetwork.discontent += 0.1 * dt;
    }

    // 能源危机导致不满
    if (this.resources.coreEnergy < 20) {
      this.emotionalNetwork.discontent += 0.2 * dt;
    }

    // 成功抵御灾难增加希望
    if (this.currentDisaster && this.currentDisaster.remainingTime < 5) {
      this.emotionalNetwork.hope += 0.1;
    }

    // 自然衰减
    this.emotionalNetwork.discontent *= (1 - 0.01 * dt);
    this.emotionalNetwork.hope *= (1 - 0.005 * dt);

    // 限制范围
    this.emotionalNetwork.discontent = Math.max(0, Math.min(1, this.emotionalNetwork.discontent));
    this.emotionalNetwork.hope = Math.max(0, Math.min(1, this.emotionalNetwork.hope));

    // 超过阈值触发暴乱
    if (this.emotionalNetwork.discontent > 0.8) {
      this.triggerRebellion();
    }
  }

  /**
   * 触发暴乱
   */
  private triggerRebellion(): void {
    this.resources.coreEnergy *= 0.8;
    this.resources.computeQuota *= 0.8;
    this.emotionalNetwork.hope -= 0.2;
    
    console.log('[EntropyEpoch] 暴乱爆发！能源和算力受损！');
  }

  /**
   * 执行法案
   */
  public executeLaw(lawId: string): LawEffect | null {
    const laws: Record<string, LawEffect> = {
      'forced_sleep': {
        description: '强制休眠指令：部分市民进入休眠以节省能源',
        energyChange: 0.3,
        biomassChange: 0,
        discontentChange: 0.3,
        hopeChange: -0.1,
      },
      'recycling_nutrient': {
        description: '循环营养液法案：提高生物质效率',
        energyChange: 0,
        biomassChange: 0.5,
        discontentChange: 0.2,
        hopeChange: -0.2,
      },
      'omniscient_surveillance': {
        description: '全知监控法案：消除暴乱风险',
        energyChange: -0.1,
        biomassChange: 0,
        discontentChange: 0.1,
        hopeChange: -0.3,
      },
      'mechanical_ascension': {
        description: '机械飞升教派：希望锁定100%，但智力逐渐下降',
        energyChange: 0,
        biomassChange: 0,
        discontentChange: 0,
        hopeChange: 0.5,
      },
    };

    const effect = laws[lawId];
    if (!effect) return null;

    // 应用法案效果
    this.resources.coreEnergy *= (1 + effect.energyChange);
    this.resources.pureBiomass *= (1 + effect.biomassChange);
    this.emotionalNetwork.discontent += effect.discontentChange;
    this.emotionalNetwork.hope += effect.hopeChange;

    // 限制范围
    this.resources.coreEnergy = Math.min(this.resources.maxCoreEnergy, this.resources.coreEnergy);
    this.resources.pureBiomass = Math.min(this.resources.maxPureBiomass, this.resources.pureBiomass);
    this.emotionalNetwork.discontent = Math.max(0, Math.min(1, this.emotionalNetwork.discontent));
    this.emotionalNetwork.hope = Math.max(0, Math.min(1, this.emotionalNetwork.hope));

    return effect;
  }

  /**
   * 添加资源
   */
  public addResource(type: 'coreEnergy' | 'computeQuota' | 'pureBiomass', amount: number): void {
    switch (type) {
      case 'coreEnergy':
        this.resources.coreEnergy = Math.min(
          this.resources.maxCoreEnergy,
          this.resources.coreEnergy + amount
        );
        break;
      case 'computeQuota':
        this.resources.computeQuota = Math.min(
          this.resources.maxComputeQuota,
          this.resources.computeQuota + amount
        );
        break;
      case 'pureBiomass':
        this.resources.pureBiomass = Math.min(
          this.resources.maxPureBiomass,
          this.resources.pureBiomass + amount
        );
        break;
    }
  }

  /**
   * 消耗资源
   */
  public consumeResource(type: 'coreEnergy' | 'computeQuota' | 'pureBiomass', amount: number): boolean {
    switch (type) {
      case 'coreEnergy':
        if (this.resources.coreEnergy >= amount) {
          this.resources.coreEnergy -= amount;
          return true;
        }
        break;
      case 'computeQuota':
        if (this.resources.computeQuota >= amount) {
          this.resources.computeQuota -= amount;
          return true;
        }
        break;
      case 'pureBiomass':
        if (this.resources.pureBiomass >= amount) {
          this.resources.pureBiomass -= amount;
          return true;
        }
        break;
    }
    return false;
  }

  /**
   * 获取熵增系数
   */
  public calculateEntropyCoefficient(): number {
    return (
      this.emotionalNetwork.discontent * 0.3 +
      (1 - this.resources.coreEnergy / this.resources.maxCoreEnergy) * 0.3 +
      (this.currentDisaster ? this.currentDisaster.intensity * 0.4 : 0)
    );
  }

  /**
   * 触发游戏结束
   */
  private triggerGameOver(): void {
    // 计算阿卡夏碎片
    const entropyCoeff = this.calculateEntropyCoefficient();
    this.akashicRecord.totalFragments = Math.floor(entropyCoeff * 100);

    console.log(`[EntropyEpoch] 游戏结束！获得 ${this.akashicRecord.totalFragments} 阿卡夏碎片`);
  }

  /**
   * 检查成就
   */
  private checkAchievements(): void {
    for (const achievement of this.achievements) {
      if (achievement.unlocked) continue;

      switch (achievement.id) {
        case 'energy_master':
          if (this.resources.coreEnergy >= 1000) {
            achievement.unlocked = true;
            achievement.timestamp = Date.now();
          }
          break;
        case 'rebellion_suppressor':
          if (this.emotionalNetwork.discontent < 0.1) {
            achievement.unlocked = true;
            achievement.timestamp = Date.now();
          }
          break;
      }
    }
  }

  /**
   * 获取系统状态
   */
  public getState(): {
    resources: CoreResources;
    emotionalNetwork: EmotionalNetwork;
    currentDisaster: Disaster | null;
    eraLevel: number;
    entropyCoefficient: number;
    achievements: Achievement[];
  } {
    return {
      resources: { ...this.resources },
      emotionalNetwork: { ...this.emotionalNetwork },
      currentDisaster: this.currentDisaster ? { ...this.currentDisaster } : null,
      eraLevel: this.eraLevel,
      entropyCoefficient: this.calculateEntropyCoefficient(),
      achievements: [...this.achievements],
    };
  }

  /**
   * 获取阿卡夏记录
   */
  public getAkashicRecord(): AkashicRecord {
    return { ...this.akashicRecord };
  }

  /**
   * 应用阿卡夏继承
   */
  public applyAkashicInheritance(): void {
    // 在新一轮游戏中应用上一轮的遗产
    console.log('[EntropyEpoch] 应用阿卡夏继承...');
  }

  /**
   * 获取可用的末日法案
   */
  public getAvailableLaws(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'forced_sleep', name: '强制休眠指令', description: '能源+30%，但部分市民死亡' },
      { id: 'recycling_nutrient', name: '循环营养液法案', description: '生物质效率+50%，疾病爆发率+300%' },
      { id: 'omniscient_surveillance', name: '全知监控法案', description: '暴乱概率归零，但不满转为抑郁' },
      { id: 'mechanical_ascension', name: '机械飞升教派', description: '希望锁定100%，智力逐年下降' },
    ];
  }
}

// 导出单例
export const entropyEpochSystem = new EntropyEpochSystem();
export default entropyEpochSystem;
