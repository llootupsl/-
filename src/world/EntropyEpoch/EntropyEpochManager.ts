/**
 * 熵增纪元模组
 * 实现熵增世界模型和灾难系统
 */

import { EntityId, createEntityId } from '@/core/types';
import type { WorldEvent, WorldEventImpact, WorldEventType } from '@/core/types/world';

/**
 * 熵增纪元配置
 */
export interface EntropyConfig {
  /** 初始熵值 (0-1) */
  initialEntropy: number;
  /** 每秒熵增率 */
  entropyIncreaseRate: number;
  /** 灾难阈值 */
  catastropheThreshold: number;
  /** 恢复率 */
  recoveryRate: number;
  /** 最大熵值 */
  maxEntropy: number;
}

/**
 * 灾难类型
 */
export enum CatastropheType {
  ENERGY_CRISIS = 'energy_crisis',       // 能源危机
  BIOMASS_DECAY = 'biomass_decay',     // 生物质衰减
  INFORMATION_OVERFLOW = 'information_overflow', // 信息过载
  TRUST_COLLAPSE = 'trust_collapse',   // 信任崩溃
  SYSTEM_CORRUPTION = 'system_corruption', // 系统崩溃
  ENTROPY_CATASTROPHE = 'entropy_catastrophe', // 熵增灾变
}

/**
 * 灾难事件
 */
export interface Catastrophe {
  id: EntityId;
  type: CatastropheType;
  name: string;
  description: string;
  intensity: number; // 0-1
  duration: number; // 持续时间 (ms)
  startTime: number;
  effects: CatastropheEffect[];
  resolved: boolean;
}

/**
 * 灾难效果
 */
export interface CatastropheEffect {
  resourceType: string;
  multiplier: number; // 资源倍率
  duration: number;
}

/**
 * 熵增纪元管理器
 */
export class EntropyEpochManager {
  private config: EntropyConfig;
  private entropy: number;
  private catastrophes: Catastrophe[] = [];
  private activeEffects: Map<string, { multiplier: number; endTime: number }> = new Map();
  private worldId: EntityId;
  private lastUpdate: number = 0;

  constructor(worldId: EntityId, config?: Partial<EntropyConfig>) {
    this.worldId = worldId;
    this.config = {
      initialEntropy: config?.initialEntropy ?? 0.1,
      entropyIncreaseRate: config?.entropyIncreaseRate ?? 0.0001,
      catastropheThreshold: config?.catastropheThreshold ?? 0.9,
      recoveryRate: config?.recoveryRate ?? 0.00001,
      maxEntropy: config?.maxEntropy ?? 1.0,
    };
    this.entropy = this.config.initialEntropy;
  }

  /**
   * 更新熵值
   */
  public update(deltaTime: number): void {
    const dt = deltaTime / 1000;

    // 应用活跃灾难效果
    this.applyEffects();

    // 熵增
    let entropyChange = this.config.entropyIncreaseRate * dt;

    // 活跃灾难增加熵增
    for (const cat of this.catastrophes) {
      if (!cat.resolved) {
        entropyChange += cat.intensity * 0.001 * dt;
      }
    }

    // 应用效果倍率
    for (const effect of this.activeEffects.values()) {
      entropyChange *= effect.multiplier;
    }

    // 更新熵值
    this.entropy = Math.min(
      this.config.maxEntropy,
      Math.max(0, this.entropy + entropyChange)
    );

    // 恢复（如果熵值低于阈值）
    if (this.entropy < this.config.catastropheThreshold) {
      this.entropy -= this.config.recoveryRate * dt;
    }

    // 检查灾难触发
    this.checkCatastrophes();

    // 更新灾难状态
    this.updateCatastrophes();

    this.lastUpdate = Date.now();
  }

  /**
   * 应用效果
   */
  private applyEffects(): void {
    const now = Date.now();

    for (const [key, effect] of this.activeEffects) {
      if (now > effect.endTime) {
        this.activeEffects.delete(key);
      }
    }
  }

  /**
   * 检查灾难
   */
  private checkCatastrophes(): void {
    // 能源危机
    if (this.entropy > 0.6 && this.entropy < 0.75) {
      this.triggerCatastrophe(CatastropheType.ENERGY_CRISIS, 0.3);
    }

    // 生物质衰减
    if (this.entropy > 0.65 && this.entropy < 0.8) {
      this.triggerCatastrophe(CatastropheType.BIOMASS_DECAY, 0.4);
    }

    // 信息过载
    if (this.entropy > 0.7) {
      this.triggerCatastrophe(CatastropheType.INFORMATION_OVERFLOW, 0.3);
    }

    // 信任崩溃
    if (this.entropy > 0.8) {
      this.triggerCatastrophe(CatastropheType.TRUST_COLLAPSE, 0.5);
    }

    // 系统崩溃
    if (this.entropy > 0.85) {
      this.triggerCatastrophe(CatastropheType.SYSTEM_CORRUPTION, 0.6);
    }

    // 熵增灾变（最高级）
    if (this.entropy > this.config.catastropheThreshold) {
      this.triggerCatastrophe(CatastropheType.ENTROPY_CATASTROPHE, 0.8);
    }
  }

  /**
   * 触发灾难
   */
  private triggerCatastrophe(type: CatastropheType, intensity: number): void {
    // 检查是否已有相同类型的活跃灾难
    const existing = this.catastrophes.find(c => c.type === type && !c.resolved);
    if (existing) return;

    const catastrophe = this.createCatastrophe(type, intensity);
    this.catastrophes.push(catastrophe);

    // 应用灾难效果
    this.applyCatastropheEffects(catastrophe);

    console.log(`[EntropyEpoch] Catastrophe triggered: ${type}`, catastrophe);
  }

  /**
   * 创建灾难
   */
  private createCatastrophe(type: CatastropheType, intensity: number): Catastrophe {
    const info = this.getCatastropheInfo(type);

    return {
      id: createEntityId(),
      type,
      name: info.name,
      description: info.description,
      intensity,
      duration: info.duration * (1 + intensity),
      startTime: Date.now(),
      effects: info.effects,
      resolved: false,
    };
  }

  /**
   * 获取灾难信息
   */
  private getCatastropheInfo(type: CatastropheType): {
    name: string;
    description: string;
    duration: number;
    effects: CatastropheEffect[];
  } {
    const catastrophes: Record<CatastropheType, {
      name: string;
      description: string;
      duration: number;
      effects: CatastropheEffect[];
    }> = {
      [CatastropheType.ENERGY_CRISIS]: {
        name: '能源危机',
        description: '核心能源供应出现严重短缺，整个系统面临崩溃边缘。',
        duration: 60000,
        effects: [
          { resourceType: 'core_energy', multiplier: 2, duration: 60000 },
          { resourceType: 'compute_quota', multiplier: 1.5, duration: 60000 },
        ],
      },
      [CatastropheType.BIOMASS_DECAY]: {
        name: '生物质衰减',
        description: '纯净生物质开始大规模衰减，生态系统受到严重威胁。',
        duration: 120000,
        effects: [
          { resourceType: 'biomass', multiplier: 3, duration: 120000 },
        ],
      },
      [CatastropheType.INFORMATION_OVERFLOW]: {
        name: '信息过载',
        description: '信息熵急剧上升，系统无法处理如此大量的数据。',
        duration: 90000,
        effects: [
          { resourceType: 'information', multiplier: 0.1, duration: 90000 },
          { resourceType: 'compute_quota', multiplier: 2, duration: 90000 },
        ],
      },
      [CatastropheType.TRUST_COLLAPSE]: {
        name: '信任崩溃',
        description: '社会信任体系彻底崩溃，市民间的关系降至冰点。',
        duration: 180000,
        effects: [
          { resourceType: 'trust', multiplier: 0, duration: 180000 },
        ],
      },
      [CatastropheType.SYSTEM_CORRUPTION]: {
        name: '系统崩溃',
        description: '核心系统发生不可逆转的崩溃，熵增达到临界点。',
        duration: 60000,
        effects: [
          { resourceType: 'core_energy', multiplier: 5, duration: 60000 },
          { resourceType: 'biomass', multiplier: 3, duration: 60000 },
          { resourceType: 'information', multiplier: 0.05, duration: 60000 },
          { resourceType: 'trust', multiplier: 0, duration: 60000 },
        ],
      },
      [CatastropheType.ENTROPY_CATASTROPHE]: {
        name: '熵增灾变',
        description: '宇宙终极熵增降临，一切归于虚无。文明的火种能否延续？',
        duration: 300000,
        effects: [
          { resourceType: 'core_energy', multiplier: 10, duration: 300000 },
          { resourceType: 'biomass', multiplier: 5, duration: 300000 },
          { resourceType: 'information', multiplier: 0.01, duration: 300000 },
          { resourceType: 'trust', multiplier: 0, duration: 300000 },
          { resourceType: 'compute_quota', multiplier: 10, duration: 300000 },
        ],
      },
    };

    return catastrophes[type];
  }

  /**
   * 应用灾难效果
   */
  private applyCatastropheEffects(catastrophe: Catastrophe): void {
    const now = Date.now();

    for (const effect of catastrophe.effects) {
      this.activeEffects.set(effect.resourceType, {
        multiplier: effect.multiplier,
        endTime: now + effect.duration,
      });
    }
  }

  /**
   * 更新灾难状态
   */
  private updateCatastrophes(): void {
    const now = Date.now();

    for (const catastrophe of this.catastrophes) {
      if (!catastrophe.resolved && now - catastrophe.startTime > catastrophe.duration) {
        catastrophe.resolved = true;
        console.log(`[EntropyEpoch] Catastrophe resolved: ${catastrophe.type}`);
      }
    }
  }

  /**
   * 获取当前熵值
   */
  public getEntropy(): number {
    return this.entropy;
  }

  /**
   * 获取熵值百分比
   */
  public getEntropyPercentage(): number {
    return this.entropy * 100;
  }

  /**
   * 获取灾难状态
   */
  public getCatastropheStatus(): {
    active: Catastrophe[];
    resolved: Catastrophe[];
    total: number;
  } {
    const active = this.catastrophes.filter(c => !c.resolved);
    const resolved = this.catastrophes.filter(c => c.resolved);

    return {
      active,
      resolved,
      total: this.catastrophes.length,
    };
  }

  /**
   * 获取活跃效果
   */
  public getActiveEffects(): Map<string, { multiplier: number; endTime: number }> {
    return new Map(this.activeEffects);
  }

  /**
   * 获取灾难严重程度
   */
  public getSeverityLevel(): 'normal' | 'warning' | 'danger' | 'critical' {
    if (this.entropy < 0.3) return 'normal';
    if (this.entropy < 0.5) return 'warning';
    if (this.entropy < 0.8) return 'danger';
    return 'critical';
  }

  /**
   * 是否达到灾难阈值
   */
  public isCatastrophic(): boolean {
    return this.entropy >= this.config.catastropheThreshold;
  }

  /**
   * 获取熵增纪元描述
   */
  public getEpochDescription(): string {
    if (this.entropy < 0.1) return '黄金时代 - 熵值极低，一切繁荣昌盛';
    if (this.entropy < 0.3) return '稳定时代 - 熵值平稳，系统运行良好';
    if (this.entropy < 0.5) return '压力时代 - 熵值上升，需要警惕';
    if (this.entropy < 0.7) return '危机时代 - 熵值警告，系统承压';
    if (this.entropy < 0.9) return '崩溃边缘 - 熵值临界，灾难频发';
    return '熵增纪元 - 一切归于虚无';
  }

  /**
   * 人工降低熵值（用于紧急干预）
   */
  public reduceEntropy(amount: number): void {
    this.entropy = Math.max(0, this.entropy - amount);
  }

  /**
   * 获取世界事件
   */
  public generateWorldEvent(type: WorldEventType): WorldEvent {
    const impact: WorldEventImpact = {
      population: this.entropy > 0.7 ? -100 : 10,
      economy: this.entropy > 0.5 ? -50 : 20,
      environment: this.entropy > 0.6 ? -80 : 30,
      social: this.entropy > 0.8 ? -100 : 10,
      entropy: this.entropy > 0.7 ? 0.1 : -0.01,
    };

    return {
      id: createEntityId(),
      type,
      name: this.getEpochDescription(),
      description: `当前熵值：${this.getEntropyPercentage().toFixed(2)}%`,
      timestamp: Date.now(),
      impact,
      severity: this.getSeverityLevel() === 'critical' ? 1 : 0.5,
      handled: false,
    };
  }
}

/**
 * 导出默认实例
 */
export const entropyEpochManager = new EntropyEpochManager(createEntityId());
export default entropyEpochManager;
