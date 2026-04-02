/**
 * =============================================================================
 * 永夜熵纪 - 科技树系统
 * Technology Tree System
 * 实现科技研发、升级、依赖关系和文明演进
 * =============================================================================
 */

import { EventEmitter } from '@/core/EventEmitter';

/** 科技类型 */
export enum TechCategory {
  /** 基础科学 */
  BASIC = 'basic',
  /** 能源科技 */
  ENERGY = 'energy',
  /** 生物科技 */
  BIO = 'bio',
  /** 信息技术 */
  IT = 'it',
  /** 材料科技 */
  MATERIAL = 'material',
  /** 太空科技 */
  SPACE = 'space',
  /** 社会科技 */
  SOCIAL = 'social',
  /** 量子科技 */
  QUANTUM = 'quantum',
  /** 神经科技 */
  NEURAL = 'neural',
  /** 熵科技 */
  ENTROPY = 'entropy',
}

/** 科技状态 */
export enum TechStatus {
  /** 未解锁 */
  LOCKED = 'locked',
  /** 可研究 */
  AVAILABLE = 'available',
  /** 研究中 */
  RESEARCHING = 'researching',
  /** 已完成 */
  COMPLETED = 'completed',
}

/** 科技节点 */
export interface TechNode {
  /** 科技ID */
  id: string;
  /** 科技名称 */
  name: string;
  /** 科技描述 */
  description: string;
  /** 科技类别 */
  category: TechCategory;
  /** 科技图标 */
  icon: string;
  /** 所需研究点数 */
  researchCost: number;
  /** 前置科技 */
  prerequisites: string[];
  /** 解锁条件 */
  unlockCondition?: {
    type: 'year' | 'population' | 'resource' | 'tech';
    value: number | string;
  };
  /** 效果 */
  effects: TechEffect[];
  /** 当前状态 */
  status: TechStatus;
  /** 研究进度 (0-1) */
  progress: number;
  /** 研究者ID */
  researcherId?: string;
  /** 研究开始时间 */
  startTime?: number;
  /** 科技层级（兼容测试API） */
  tier?: number;
  /** 状态别名（兼容测试API） */
  state?: string;
}

/** 科技效果 */
export interface TechEffect {
  /** 效果类型 */
  type: 'resource_rate' | 'unlock_building' | 'unlock_unit' | 
        'unlock_ability' | 'citizen_bonus' | 'cost_reduction' |
        'unlock_tech' | 'special';
  /** 效果参数 */
  params: Record<string, number | string | boolean>;
  /** 效果强度 */
  intensity: number;
  /** 持续时间 (0 = 永久) */
  duration: number;
}

/** 科技树 - 支持事件发射 */
export class TechTree extends EventEmitter {
  private nodes: Map<string, TechNode> = new Map();
  private researchQueue: string[] = [];
  private completedTechs: Set<string> = new Set();
  private unlockedAbilities: Set<string> = new Set();
  private modifiers: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeTechTree();
  }

  /**
   * 获取所有科技节点（兼容测试API）
   */
  public getAllNodes(): TechNode[] {
    return this.getAllTechs();
  }

  /**
   * 开始研究（兼容测试API - 支持 researcherId 参数）
   */
  public startResearch(techId: string, researcherId?: string): boolean {
    const tech = this.nodes.get(techId);
    if (!tech) return false;
    if (tech.status !== TechStatus.AVAILABLE) return false;

    tech.status = TechStatus.RESEARCHING;
    tech.state = 'researching';
    tech.researcherId = researcherId || 'default';
    tech.startTime = Date.now();
    
    if (!this.researchQueue.includes(techId)) {
      this.researchQueue.push(techId);
    }

    this.emit('researchStarted', techId);

    return true;
  }

  /**
   * 更新研究进度（兼容测试API）
   */
  public updateResearch(deltaTime: number, scienceOutput: number): TechNode | null {
    if (this.researchQueue.length === 0) return null;

    const currentTechId = this.researchQueue[0];
    const tech = this.nodes.get(currentTechId);
    if (!tech || tech.status !== TechStatus.RESEARCHING) return null;

    const researchPoints = deltaTime * scienceOutput / 1000;
    tech.progress += researchPoints / tech.researchCost;

    this.emit('researchProgress', tech.id, tech.progress);

    if (tech.progress >= 1) {
      tech.progress = 1;
      tech.status = TechStatus.COMPLETED;
      tech.state = 'completed';
      this.completedTechs.add(currentTechId);
      this.researchQueue.shift();

      this.applyTechEffects(tech);
      this.updateTechStatus();

      this.emit('researchCompleted', currentTechId, tech.effects);

      return tech;
    }

    return null;
  }

  /**
   * 应用科技效果
   */
  private applyTechEffects(tech: TechNode): void {
    for (const effect of tech.effects) {
      if (effect.type === 'unlock_ability' || effect.type === 'unlock_building' || effect.type === 'unlock_unit') {
        const target = effect.params.ability || effect.params.building || effect.params.unit;
        if (target) {
          this.unlockedAbilities.add(target as string);
        }
      }
      
      if (effect.type === 'resource_rate' || effect.type === 'citizen_bonus') {
        const target = effect.params.resource || effect.params.attribute;
        if (target) {
          const currentValue = this.modifiers.get(target as string) || 1;
          const multiplier = effect.params.multiplier as number || (1 + (effect.params.value as number || 0));
          this.modifiers.set(target as string, currentValue * multiplier);
        }
      }
    }
  }

  /**
   * 获取研究进度（兼容测试API）
   */
  public getProgress(techId: string): number {
    const tech = this.nodes.get(techId);
    return tech ? tech.progress : 0;
  }

  /**
   * 获取统计信息（兼容测试API）
   */
  public getStats(): {
    total: number;
    completed: number;
    available: number;
    locked: number;
    researching: number;
    completionRate: number;
  } {
    const all = this.getAllTechs();
    const completed = all.filter(t => t.status === TechStatus.COMPLETED).length;
    const available = all.filter(t => t.status === TechStatus.AVAILABLE).length;
    const locked = all.filter(t => t.status === TechStatus.LOCKED).length;
    const researching = all.filter(t => t.status === TechStatus.RESEARCHING).length;

    return {
      total: all.length,
      completed,
      available,
      locked,
      researching,
      completionRate: all.length > 0 ? completed / all.length : 0,
    };
  }

  /**
   * 取消当前研究（兼容测试API）
   */
  public cancelResearch(): boolean {
    if (this.researchQueue.length === 0) return false;

    const currentTechId = this.researchQueue.shift()!;
    const tech = this.nodes.get(currentTechId);
    if (tech) {
      tech.status = TechStatus.AVAILABLE;
      tech.state = 'available';
      tech.progress = 0;
      tech.researcherId = undefined;
      tech.startTime = undefined;
    }

    return true;
  }

  /**
   * 重置科技树（兼容测试API）
   */
  public reset(): void {
    this.researchQueue = [];
    this.completedTechs.clear();
    this.unlockedAbilities.clear();
    this.modifiers.clear();

    for (const [, tech] of this.nodes) {
      tech.status = tech.prerequisites.length === 0 ? TechStatus.AVAILABLE : TechStatus.LOCKED;
      tech.state = tech.status.toLowerCase();
      tech.progress = 0;
      tech.researcherId = undefined;
      tech.startTime = undefined;
    }
  }

  /**
   * 检查能力是否已解锁（兼容测试API）
   */
  public isUnlocked(abilityId: string): boolean {
    return this.unlockedAbilities.has(abilityId);
  }

  /**
   * 获取修正值（兼容测试API）
   */
  public getModifier(target: string): number {
    return this.modifiers.get(target) || 1;
  }

  /**
   * 初始化科技树
   */
  private initializeTechTree(): void {
    const techs: Omit<TechNode, 'status' | 'progress'>[] = [
      // ===== 基础科学 =====
      {
        id: 'fire',
        name: '火焰控制',
        description: '学会使用和控制火焰，开启文明之路',
        category: TechCategory.BASIC,
        icon: '🔥',
        researchCost: 100,
        prerequisites: [],
        effects: [
          { type: 'unlock_building', params: { building: 'campfire' }, intensity: 1, duration: 0 },
          { type: 'citizen_bonus', params: { attribute: 'warmth', value: 0.1 }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'tools',
        name: '工具制造',
        description: '制造和使用工具，提高生产效率',
        category: TechCategory.BASIC,
        icon: '🔧',
        researchCost: 200,
        prerequisites: ['fire'],
        effects: [
          { type: 'resource_rate', params: { resource: 'biomass', multiplier: 1.2 }, intensity: 1, duration: 0 },
          { type: 'citizen_bonus', params: { attribute: 'efficiency', value: 0.15 }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'writing',
        name: '文字系统',
        description: '发明文字，记录知识和历史',
        category: TechCategory.BASIC,
        icon: '📜',
        researchCost: 500,
        prerequisites: ['tools'],
        effects: [
          { type: 'citizen_bonus', params: { attribute: 'intelligence', value: 0.2 }, intensity: 1, duration: 0 },
          { type: 'unlock_ability', params: { ability: 'teach' }, intensity: 1, duration: 0 },
        ],
      },

      // ===== 能源科技 =====
      {
        id: 'bioenergy',
        name: '生物能',
        description: '利用生物质产生能源',
        category: TechCategory.ENERGY,
        icon: '🌿',
        researchCost: 300,
        prerequisites: ['fire', 'bio_engineering'],
        effects: [
          { type: 'resource_rate', params: { resource: 'coreEnergy', multiplier: 1.5 }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'fusion',
        name: '核聚变',
        description: '掌握核聚变技术，能源无忧',
        category: TechCategory.ENERGY,
        icon: '☀️',
        researchCost: 5000,
        prerequisites: ['quantum_physics'],
        effects: [
          { type: 'resource_rate', params: { resource: 'coreEnergy', multiplier: 5 }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'zero_point',
        name: '零点能',
        description: '从量子真空提取能量',
        category: TechCategory.ENERGY,
        icon: '⚡',
        researchCost: 50000,
        prerequisites: ['fusion', 'quantum_mastery'],
        effects: [
          { type: 'resource_rate', params: { resource: 'coreEnergy', multiplier: 100 }, intensity: 1, duration: 0 },
          { type: 'special', params: { effect: 'entropy_reduction' }, intensity: 0.5, duration: 0 },
        ],
      },

      // ===== 生物科技 =====
      {
        id: 'bio_engineering',
        name: '基因工程',
        description: '操控基因，优化生物特性',
        category: TechCategory.BIO,
        icon: '🧬',
        researchCost: 800,
        prerequisites: ['writing', 'bioenergy'],
        effects: [
          { type: 'citizen_bonus', params: { attribute: 'health', value: 0.3 }, intensity: 1, duration: 0 },
          { type: 'citizen_bonus', params: { attribute: 'longevity', value: 0.2 }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'consciousness_upload',
        name: '意识上传',
        description: '将意识数字化，实现数字永生',
        category: TechCategory.BIO,
        icon: '🧠',
        researchCost: 100000,
        prerequisites: ['neural_interface', 'quantum_brain'],
        effects: [
          { type: 'special', params: { effect: 'immortality' }, intensity: 1, duration: 0 },
          { type: 'unlock_unit', params: { unit: 'digital_citizen' }, intensity: 1, duration: 0 },
        ],
      },

      // ===== 量子科技 =====
      {
        id: 'quantum_physics',
        name: '量子物理学',
        description: '理解量子世界的规律',
        category: TechCategory.QUANTUM,
        icon: '⚛️',
        researchCost: 2000,
        prerequisites: ['writing', 'mathematics'],
        effects: [
          { type: 'citizen_bonus', params: { attribute: 'quantum_coherence', value: 0.3 }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'quantum_mastery',
        name: '量子掌控',
        description: '完全掌控量子态，操控现实',
        category: TechCategory.QUANTUM,
        icon: '🔮',
        researchCost: 20000,
        prerequisites: ['quantum_physics', 'snn_theory'],
        effects: [
          { type: 'special', params: { effect: 'quantum_superposition' }, intensity: 1, duration: 0 },
          { type: 'cost_reduction', params: { category: 'all', reduction: 0.5 }, intensity: 1, duration: 0 },
        ],
      },

      // ===== 神经科技 =====
      {
        id: 'snn_theory',
        name: '脉冲神经网络理论',
        description: '理解大脑的信息处理机制',
        category: TechCategory.NEURAL,
        icon: '🧩',
        researchCost: 1500,
        prerequisites: ['writing', 'bio_engineering'],
        effects: [
          { type: 'citizen_bonus', params: { attribute: 'learning_speed', value: 0.5 }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'neural_interface',
        name: '神经接口',
        description: '实现人机意识互联',
        category: TechCategory.NEURAL,
        icon: '🔌',
        researchCost: 50000,
        prerequisites: ['snn_theory', 'quantum_mastery'],
        effects: [
          { type: 'unlock_ability', params: { ability: 'neural_link' }, intensity: 1, duration: 0 },
          { type: 'citizen_bonus', params: { attribute: 'intelligence', value: 1.0 }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'quantum_brain',
        name: '量子大脑',
        description: '利用量子效应增强思维能力',
        category: TechCategory.NEURAL,
        icon: '💫',
        researchCost: 80000,
        prerequisites: ['neural_interface', 'quantum_mastery'],
        effects: [
          { type: 'special', params: { effect: 'collective_consciousness' }, intensity: 1, duration: 0 },
          { type: 'citizen_bonus', params: { attribute: 'quantum_coherence', value: 0.8 }, intensity: 1, duration: 0 },
        ],
      },

      // ===== 熵科技 =====
      {
        id: 'entropy_theory',
        name: '熵增理论',
        description: '理解熵增定律和宇宙演化',
        category: TechCategory.ENTROPY,
        icon: '📈',
        researchCost: 3000,
        prerequisites: ['mathematics', 'physics'],
        effects: [
          { type: 'special', params: { effect: 'entropy_awareness' }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'entropy_control',
        name: '熵增控制',
        description: '减缓局部区域的熵增',
        category: TechCategory.ENTROPY,
        icon: '🌀',
        researchCost: 30000,
        prerequisites: ['entropy_theory', 'quantum_mastery'],
        effects: [
          { type: 'special', params: { effect: 'entropy_reduction' }, intensity: 0.3, duration: 0 },
          { type: 'cost_reduction', params: { category: 'entropy', reduction: 0.5 }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'entropy_reverse',
        name: '熵减技术',
        description: '逆转熵增，创造有序区域',
        category: TechCategory.ENTROPY,
        icon: '⏪',
        researchCost: 100000,
        prerequisites: ['entropy_control', 'consciousness_upload'],
        effects: [
          { type: 'special', params: { effect: 'entropy_reduction' }, intensity: 0.8, duration: 0 },
          { type: 'special', params: { effect: 'local_order' }, intensity: 1, duration: 0 },
        ],
      },

      // ===== 数学 (通用) =====
      {
        id: 'mathematics',
        name: '数学基础',
        description: '建立数学体系',
        category: TechCategory.BASIC,
        icon: '📐',
        researchCost: 400,
        prerequisites: ['writing'],
        effects: [
          { type: 'citizen_bonus', params: { attribute: 'logic', value: 0.2 }, intensity: 1, duration: 0 },
        ],
      },
      {
        id: 'physics',
        name: '物理学',
        description: '理解自然规律',
        category: TechCategory.BASIC,
        icon: '🔬',
        researchCost: 600,
        prerequisites: ['mathematics'],
        effects: [
          { type: 'resource_rate', params: { resource: 'information', multiplier: 1.3 }, intensity: 1, duration: 0 },
        ],
      },
    ];

    // 创建科技节点
    for (const tech of techs) {
      const tier = this.calculateTechTier(tech.id, tech.prerequisites);
      const status = tech.prerequisites.length === 0 ? TechStatus.AVAILABLE : TechStatus.LOCKED;
      const node: TechNode = {
        ...tech,
        status,
        progress: 0,
        tier,
        state: status.toLowerCase(),
      };
      this.nodes.set(tech.id, node);
    }
  }

  /**
   * 计算科技层级
   */
  private calculateTechTier(techId: string, prerequisites: string[], visited: Set<string> = new Set()): number {
    if (visited.has(techId)) return 0;
    visited.add(techId);
    
    if (prerequisites.length === 0) return 1;
    
    let maxTier = 0;
    for (const prereq of prerequisites) {
      const prereqTech = this.nodes.get(prereq);
      if (prereqTech) {
        maxTier = Math.max(maxTier, prereqTech.tier || this.calculateTechTier(prereq, prereqTech.prerequisites, visited));
      }
    }
    
    return maxTier + 1;
  }

  /**
   * 检查前置科技是否满足
   */
  public checkPrerequisites(techId: string): boolean {
    const tech = this.nodes.get(techId);
    if (!tech) return false;

    for (const prereq of tech.prerequisites) {
      const prereqTech = this.nodes.get(prereq);
      if (!prereqTech || prereqTech.status !== TechStatus.COMPLETED) {
        return false;
      }
    }

    // 检查解锁条件
    if (tech.unlockCondition) {
      // 需要额外检查
      return true;
    }

    return true;
  }

  /**
   * 更新科技状态
   */
  public updateTechStatus(): void {
    for (const [id, tech] of this.nodes) {
      if (tech.status === TechStatus.LOCKED) {
        if (this.checkPrerequisites(id)) {
          tech.status = TechStatus.AVAILABLE;
          tech.state = 'available';
          this.emit('unlocked', id);
        }
      }
    }
  }

  /**
   * 获取科技
   */
  public getTech(techId: string): TechNode | undefined {
    return this.nodes.get(techId);
  }

  /**
   * 获取所有科技
   */
  public getAllTechs(): TechNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * 获取某类别的科技
   */
  public getTechsByCategory(category: TechCategory): TechNode[] {
    return Array.from(this.nodes.values()).filter(t => t.category === category);
  }

  /**
   * 获取可研究的科技
   */
  public getAvailableTechs(): TechNode[] {
    return Array.from(this.nodes.values()).filter(t => t.status === TechStatus.AVAILABLE);
  }

  /**
   * 获取当前研究
   */
  public getCurrentResearch(): TechNode | null {
    if (this.researchQueue.length === 0) return null;
    return this.nodes.get(this.researchQueue[0]) || null;
  }

  /**
   * 获取已完成的科技
   */
  public getCompletedTechs(): TechNode[] {
    return Array.from(this.completedTechs).map(id => this.nodes.get(id)!);
  }

  /**
   * 获取科技效果
   */
  public getTechEffects(): TechEffect[] {
    const effects: TechEffect[] = [];
    for (const tech of this.getCompletedTechs()) {
      effects.push(...tech.effects);
    }
    return effects;
  }

  /**
   * 应用科技效果
   */
  public applyEffects(): Record<string, number> {
    const modifiers: Record<string, number> = {
      resourceMultiplier: 1,
      costReduction: 1,
      entropyReduction: 0,
      citizenBonus: 1,
    };

    for (const tech of this.getCompletedTechs()) {
      for (const effect of tech.effects) {
        switch (effect.type) {
          case 'resource_rate':
            if (effect.params.resource === 'coreEnergy') {
              modifiers.resourceMultiplier *= effect.params.multiplier as number;
            }
            break;
          case 'cost_reduction':
            modifiers.costReduction *= (1 - effect.intensity * (effect.params.reduction as number));
            break;
          case 'special':
            if (effect.params.effect === 'entropy_reduction') {
              modifiers.entropyReduction += effect.intensity * (effect.params.value as number || 0.1);
            }
            break;
        }
      }
    }

    return modifiers;
  }

  /**
   * 获取科技树依赖关系
   */
  public getTechTree(): Record<string, string[]> {
    const tree: Record<string, string[]> = {};
    for (const [id, tech] of this.nodes) {
      tree[id] = tech.prerequisites;
    }
    return tree;
  }

  /**
   * 计算解锁路径
   */
  public getUnlockPath(targetTechId: string): string[] | null {
    const path: string[] = [];
    const visited = new Set<string>();

    const dfs = (techId: string): boolean => {
      if (visited.has(techId)) return false;
      visited.add(techId);

      const tech = this.nodes.get(techId);
      if (!tech) return false;

      // 如果是起点（无前置）
      if (tech.prerequisites.length === 0) {
        path.push(techId);
        return true;
      }

      // 递归检查前置
      for (const prereq of tech.prerequisites) {
        if (!this.completedTechs.has(prereq)) {
          if (!dfs(prereq)) return false;
        }
      }

      path.push(techId);
      return true;
    };

    if (!dfs(targetTechId)) return null;
    return path;
  }

  /**
   * 更新科技树系统（每帧调用）
   */
  public update(_deltaMs: number): void {
    // 更新科技状态
    this.updateTechStatus();
  }
}

// 导出单例
export const techTree = new TechTree();
export default techTree;
