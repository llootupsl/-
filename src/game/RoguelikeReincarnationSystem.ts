/**
 * =============================================================================
 * ROGUELIKE REINCARNATION SYSTEM - 极致Roguelike轮回系统
 * THE ULTIMATE ROGUELIKE REINCARNATION SYSTEM
 * 
 * 特性：
 * 1. 轮回积分系统 - 每次轮回积累元进度
 * 2. 解锁树系统 - 永久解锁新内容
 * 3. 遗传记忆 - 保留部分前世记忆
 * 4. 因果传承 - 影响下一世的初始条件
 * 5. 轮回挑战 - 特殊轮回条件获得额外奖励
 * 6. 元宇宙进度 - 跨轮回的长期目标
 * 7. 轮回商店 - 使用轮回点购买永久增益
 * 8. 轮回日志 - 完整的轮回历史记录
 * =============================================================================
 */

import { storage } from '../storage/StorageManager';
import { logger } from '@/core/utils/Logger';

/**
 * 轮回类型
 */
export enum ReincarnationType {
  NORMAL = 'normal',
  ASCENDED = 'ascended',
  FALLEN = 'fallen',
  TRANSCENDENT = 'transcendent',
  KARMIC = 'karmic',
  DIVINE = 'divine',
  VOID = 'void',
  PARALLEL = 'parallel',
}

/**
 * 轮回条件
 */
export interface ReincarnationCondition {
  id: string;
  name: string;
  description: string;
  type: ConditionType;
  requirement: ConditionRequirement;
  bonusMultiplier: number;
  required: boolean;
  met: boolean;
}

/**
 * 条件类型
 */
export enum ConditionType {
  POPULATION = 'population',
  TECHNOLOGY = 'technology',
  ENTROPY = 'entropy',
  TIME = 'time',
  KARMA = 'karma',
  FAITH = 'faith',
  ACHIEVEMENTS = 'achievements',
  OBSERVATIONS = 'observations',
  SPECIAL = 'special',
}

/**
 * 条件需求
 */
export interface ConditionRequirement {
  type: string;
  target: number;
  current: number;
}

/**
 * 轮回结果
 */
export interface ReincarnationResult {
  id: string;
  type: ReincarnationType;
  timestamp: number;
  duration: number;
  score: number;
  pointsEarned: number;
  conditions: ReincarnationCondition[];
  bonuses: ReincarnationBonus[];
  unlocks: string[];
  memories: InheritedMemory[];
  statistics: ReincarnationStatistics;
  rank: ReincarnationRank;
}

/**
 * 轮回奖励
 */
export interface ReincarnationBonus {
  id: string;
  name: string;
  description: string;
  type: BonusType;
  value: number;
  permanent: boolean;
}

/**
 * 奖励类型
 */
export enum BonusType {
  POINTS_MULTIPLIER = 'points_multiplier',
  STARTING_RESOURCES = 'starting_resources',
  UNLOCK_SLOT = 'unlock_slot',
  MEMORY_SLOT = 'memory_slot',
  KARMA_BOOST = 'karma_boost',
  FAITH_BOOST = 'faith_boost',
  SPECIAL_ABILITY = 'special_ability',
}

/**
 * 轮回统计
 */
export interface ReincarnationStatistics {
  totalPopulation: number;
  maxPopulation: number;
  totalDeaths: number;
  totalBirths: number;
  technologyLevel: number;
  entropyReached: number;
  timeElapsed: number;
  miraclesPerformed: number;
  catastrophesSurvived: number;
  divineInterventions: number;
  observations: number;
  achievementsUnlocked: number;
}

/**
 * 轮回等级
 */
export enum ReincarnationRank {
  DUST = 'dust',
  PEBBLE = 'pebble',
  STONE = 'stone',
  BOULDER = 'boulder',
  MOUNTAIN = 'mountain',
  PLANET = 'planet',
  STAR = 'star',
  GALAXY = 'galaxy',
  UNIVERSE = 'universe',
  MULTIVERSE = 'multiverse',
  OMNIVERSE = 'omniverse',
  ETERNAL = 'eternal',
}

/**
 * 遗传记忆
 */
export interface InheritedMemory {
  id: string;
  type: MemoryType;
  content: string;
  strength: number;
  source: string;
  generation: number;
  decayRate: number;
}

/**
 * 记忆类型
 */
export enum MemoryType {
  TECHNOLOGY = 'technology',
  CULTURE = 'culture',
  SKILL = 'skill',
  EVENT = 'event',
  RELATIONSHIP = 'relationship',
  SECRET = 'secret',
  PROPHECY = 'prophecy',
  CURSE = 'curse',
  BLESSING = 'blessing',
}

/**
 * 解锁项
 */
export interface Unlockable {
  id: string;
  name: string;
  description: string;
  category: UnlockCategory;
  tier: UnlockTier;
  cost: number;
  requirements: string[];
  effects: UnlockEffect[];
  unlocked: boolean;
  unlockedAt?: number;
  icon: string;
}

/**
 * 解锁类别
 */
export enum UnlockCategory {
  POWER = 'power',
  TECHNOLOGY = 'technology',
  BUILDING = 'building',
  CITIZEN = 'citizen',
  EVENT = 'event',
  WORLD = 'world',
  COSMETIC = 'cosmetic',
  ABILITY = 'ability',
}

/**
 * 解锁层级
 */
export enum UnlockTier {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
  DIVINE = 'divine',
}

/**
 * 解锁效果
 */
export interface UnlockEffect {
  type: string;
  value: number;
  duration: number;
}

/**
 * 元进度
 */
export interface MetaProgression {
  totalReincarnations: number;
  totalPoints: number;
  currentPoints: number;
  highestScore: number;
  totalPlaytime: number;
  longestRun: number;
  fastestReincarnation: number;
  highestPopulation: number;
  highestTechnology: number;
  totalObservations: number;
  totalAchievements: number;
  averageScore: number;
  reincarnationsByType: Record<ReincarnationType, number>;
  unlocksPurchased: number;
  memoriesInherited: number;
}

/**
 * 轮回挑战
 */
export interface ReincarnationChallenge {
  id: string;
  name: string;
  description: string;
  difficulty: ChallengeDifficulty;
  modifiers: ChallengeModifier[];
  rewards: ChallengeReward[];
  active: boolean;
  completed: boolean;
  bestScore: number;
  attempts: number;
}

/**
 * 挑战难度
 */
export enum ChallengeDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  NIGHTMARE = 'nightmare',
  IMPOSSIBLE = 'impossible',
  COSMIC = 'cosmic',
}

/**
 * 挑战修改器
 */
export interface ChallengeModifier {
  id: string;
  name: string;
  description: string;
  type: ModifierType;
  value: number;
  stackable: boolean;
}

/**
 * 修改器类型
 */
export enum ModifierType {
  MULTIPLIER = 'multiplier',
  ADDITIVE = 'additive',
  OVERRIDE = 'override',
  TOGGLE = 'toggle',
}

/**
 * 挑战奖励
 */
export interface ChallengeReward {
  type: RewardType;
  value: number;
  permanent: boolean;
}

/**
 * 奖励类型
 */
export enum RewardType {
  POINTS = 'points',
  UNLOCK = 'unlock',
  MEMORY = 'memory',
  COSMETIC = 'cosmetic',
  ACHIEVEMENT = 'achievement',
}

/**
 * 轮回商店物品
 */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  cost: number;
  effects: UnlockEffect[];
  purchased: boolean;
  purchaseCount: number;
  maxPurchases: number;
  icon: string;
}

/**
 * 商店类别
 */
export enum ShopCategory {
  PERMANENT = 'permanent',
  TEMPORARY = 'temporary',
  COSMETIC = 'cosmetic',
  SPECIAL = 'special',
}

/**
 * Roguelike轮回系统 - 主类
 */
export class RoguelikeReincarnationSystem {
  private metaProgression: MetaProgression;
  private currentRun: ReincarnationResult | null = null;
  private reincarnationHistory: ReincarnationResult[] = [];
  private unlockables: Map<string, Unlockable> = new Map();
  private challenges: Map<string, ReincarnationChallenge> = new Map();
  private shopItems: Map<string, ShopItem> = new Map();
  private inheritedMemories: InheritedMemory[] = [];
  private activeChallenges: string[] = [];
  
  private runStartTime: number = 0;
  private runStatistics: ReincarnationStatistics;
  
  private static readonly RANK_THRESHOLDS: Record<ReincarnationRank, number> = {
    [ReincarnationRank.DUST]: 0,
    [ReincarnationRank.PEBBLE]: 1000,
    [ReincarnationRank.STONE]: 5000,
    [ReincarnationRank.BOULDER]: 25000,
    [ReincarnationRank.MOUNTAIN]: 100000,
    [ReincarnationRank.PLANET]: 500000,
    [ReincarnationRank.STAR]: 2500000,
    [ReincarnationRank.GALAXY]: 10000000,
    [ReincarnationRank.UNIVERSE]: 50000000,
    [ReincarnationRank.MULTIVERSE]: 250000000,
    [ReincarnationRank.OMNIVERSE]: 1000000000,
    [ReincarnationRank.ETERNAL]: 5000000000,
  };
  
  private static readonly POINT_MULTIPLIERS: Record<ReincarnationType, number> = {
    [ReincarnationType.NORMAL]: 1.0,
    [ReincarnationType.ASCENDED]: 1.5,
    [ReincarnationType.FALLEN]: 0.8,
    [ReincarnationType.TRANSCENDENT]: 2.0,
    [ReincarnationType.KARMIC]: 1.2,
    [ReincarnationType.DIVINE]: 3.0,
    [ReincarnationType.VOID]: 0.5,
    [ReincarnationType.PARALLEL]: 1.8,
  };

  constructor() {
    this.metaProgression = this.initMetaProgression();
    this.runStatistics = this.initRunStatistics();
    this.initializeUnlockables();
    this.initializeChallenges();
    this.initializeShop();
  }
  
  private initMetaProgression(): MetaProgression {
    return {
      totalReincarnations: 0,
      totalPoints: 0,
      currentPoints: 0,
      highestScore: 0,
      totalPlaytime: 0,
      longestRun: 0,
      fastestReincarnation: Infinity,
      highestPopulation: 0,
      highestTechnology: 0,
      totalObservations: 0,
      totalAchievements: 0,
      averageScore: 0,
      reincarnationsByType: {} as Record<ReincarnationType, number>,
      unlocksPurchased: 0,
      memoriesInherited: 0,
    };
  }
  
  private initRunStatistics(): ReincarnationStatistics {
    return {
      totalPopulation: 0,
      maxPopulation: 0,
      totalDeaths: 0,
      totalBirths: 0,
      technologyLevel: 0,
      entropyReached: 0,
      timeElapsed: 0,
      miraclesPerformed: 0,
      catastrophesSurvived: 0,
      divineInterventions: 0,
      observations: 0,
      achievementsUnlocked: 0,
    };
  }
  
  private initializeUnlockables(): void {
    const unlockableDefinitions: Partial<Unlockable>[] = [
      { id: 'starting_population_1', name: '人口优势 I', description: '开局+10人口', category: UnlockCategory.CITIZEN, tier: UnlockTier.COMMON, cost: 100, effects: [{ type: 'starting_population', value: 10, duration: 0 }], icon: '👥' },
      { id: 'starting_population_2', name: '人口优势 II', description: '开局+25人口', category: UnlockCategory.CITIZEN, tier: UnlockTier.UNCOMMON, cost: 300, requirements: ['starting_population_1'], effects: [{ type: 'starting_population', value: 25, duration: 0 }], icon: '👥' },
      { id: 'starting_population_3', name: '人口优势 III', description: '开局+50人口', category: UnlockCategory.CITIZEN, tier: UnlockTier.RARE, cost: 800, requirements: ['starting_population_2'], effects: [{ type: 'starting_population', value: 50, duration: 0 }], icon: '👥' },
      
      { id: 'starting_resources_1', name: '资源储备 I', description: '开局+1000资源', category: UnlockCategory.BUILDING, tier: UnlockTier.COMMON, cost: 150, effects: [{ type: 'starting_resources', value: 1000, duration: 0 }], icon: '📦' },
      { id: 'starting_resources_2', name: '资源储备 II', description: '开局+5000资源', category: UnlockCategory.BUILDING, tier: UnlockTier.UNCOMMON, cost: 500, requirements: ['starting_resources_1'], effects: [{ type: 'starting_resources', value: 5000, duration: 0 }], icon: '📦' },
      
      { id: 'memory_slot_1', name: '记忆扩展 I', description: '+1记忆槽位', category: UnlockCategory.ABILITY, tier: UnlockTier.RARE, cost: 1000, effects: [{ type: 'memory_slots', value: 1, duration: 0 }], icon: '🧠' },
      { id: 'memory_slot_2', name: '记忆扩展 II', description: '+2记忆槽位', category: UnlockCategory.ABILITY, tier: UnlockTier.EPIC, cost: 2500, requirements: ['memory_slot_1'], effects: [{ type: 'memory_slots', value: 2, duration: 0 }], icon: '🧠' },
      
      { id: 'point_multiplier_1', name: '积分加成 I', description: '积分获取+10%', category: UnlockCategory.ABILITY, tier: UnlockTier.COMMON, cost: 200, effects: [{ type: 'point_multiplier', value: 0.1, duration: 0 }], icon: '✨' },
      { id: 'point_multiplier_2', name: '积分加成 II', description: '积分获取+25%', category: UnlockCategory.ABILITY, tier: UnlockTier.UNCOMMON, cost: 600, requirements: ['point_multiplier_1'], effects: [{ type: 'point_multiplier', value: 0.25, duration: 0 }], icon: '✨' },
      { id: 'point_multiplier_3', name: '积分加成 III', description: '积分获取+50%', category: UnlockCategory.ABILITY, tier: UnlockTier.RARE, cost: 1500, requirements: ['point_multiplier_2'], effects: [{ type: 'point_multiplier', value: 0.5, duration: 0 }], icon: '✨' },
      
      { id: 'karma_protection', name: '业力护盾', description: '负面业力效果-20%', category: UnlockCategory.ABILITY, tier: UnlockTier.EPIC, cost: 2000, effects: [{ type: 'karma_protection', value: 0.2, duration: 0 }], icon: '🛡️' },
      
      { id: 'divine_favor', name: '神恩', description: '神力冷却-15%', category: UnlockCategory.POWER, tier: UnlockTier.RARE, cost: 1200, effects: [{ type: 'divine_cooldown', value: 0.15, duration: 0 }], icon: '⚡' },
      
      { id: 'entropy_resistance', name: '熵抗性', description: '熵增长速度-10%', category: UnlockCategory.WORLD, tier: UnlockTier.EPIC, cost: 1800, effects: [{ type: 'entropy_resistance', value: 0.1, duration: 0 }], icon: '🌀' },
      
      { id: 'tech_boost', name: '科技加速', description: '科技研究速度+20%', category: UnlockCategory.TECHNOLOGY, tier: UnlockTier.UNCOMMON, cost: 400, effects: [{ type: 'tech_speed', value: 0.2, duration: 0 }], icon: '🔬' },
      
      { id: 'catastrophe_warning', name: '灾难预警', description: '提前30秒预警灾难', category: UnlockCategory.EVENT, tier: UnlockTier.RARE, cost: 800, effects: [{ type: 'disaster_warning', value: 30, duration: 0 }], icon: '⚠️' },
      
      { id: 'parallel_vision', name: '平行视野', description: '可观测平行世界', category: UnlockCategory.ABILITY, tier: UnlockTier.LEGENDARY, cost: 5000, effects: [{ type: 'parallel_vision', value: 1, duration: 0 }], icon: '👁️' },
      
      { id: 'time_fragment', name: '时间碎片', description: '可回溯30秒', category: UnlockCategory.ABILITY, tier: UnlockTier.MYTHIC, cost: 10000, effects: [{ type: 'time_rewind', value: 30, duration: 0 }], icon: '⏪' },
      
      { id: 'cosmic_awareness', name: '宇宙意识', description: '感知宇宙事件', category: UnlockCategory.ABILITY, tier: UnlockTier.DIVINE, cost: 25000, effects: [{ type: 'cosmic_awareness', value: 1, duration: 0 }], icon: '🌌' },
    ];
    
    for (const def of unlockableDefinitions) {
      const unlockable: Unlockable = {
        id: def.id!,
        name: def.name!,
        description: def.description!,
        category: def.category!,
        tier: def.tier!,
        cost: def.cost!,
        requirements: def.requirements || [],
        effects: def.effects!,
        unlocked: false,
        icon: def.icon || '🔒',
      };
      this.unlockables.set(unlockable.id, unlockable);
    }
  }
  
  private initializeChallenges(): void {
    const challengeDefinitions: Partial<ReincarnationChallenge>[] = [
      {
        id: 'speedrun_1',
        name: '速通挑战 I',
        description: '在5分钟内完成轮回',
        difficulty: ChallengeDifficulty.EASY,
        modifiers: [{ id: 'time_limit', name: '时间限制', description: '5分钟限制', type: ModifierType.OVERRIDE, value: 300000, stackable: false }],
        rewards: [{ type: RewardType.POINTS, value: 500, permanent: false }],
      },
      {
        id: 'speedrun_2',
        name: '速通挑战 II',
        description: '在3分钟内完成轮回',
        difficulty: ChallengeDifficulty.NORMAL,
        modifiers: [{ id: 'time_limit', name: '时间限制', description: '3分钟限制', type: ModifierType.OVERRIDE, value: 180000, stackable: false }],
        rewards: [{ type: RewardType.POINTS, value: 1500, permanent: false }],
      },
      {
        id: 'population_100',
        name: '人口挑战',
        description: '达到100人口后轮回',
        difficulty: ChallengeDifficulty.NORMAL,
        modifiers: [],
        rewards: [{ type: RewardType.POINTS, value: 1000, permanent: false }],
      },
      {
        id: 'population_1000',
        name: '人口大师',
        description: '达到1000人口后轮回',
        difficulty: ChallengeDifficulty.HARD,
        modifiers: [],
        rewards: [{ type: RewardType.POINTS, value: 5000, permanent: false }, { type: RewardType.UNLOCK, value: 0, permanent: true }],
      },
      {
        id: 'no_death',
        name: '不死挑战',
        description: '没有任何市民死亡完成轮回',
        difficulty: ChallengeDifficulty.NIGHTMARE,
        modifiers: [{ id: 'permadeath', name: '永久死亡', description: '任何死亡立即失败', type: ModifierType.TOGGLE, value: 1, stackable: false }],
        rewards: [{ type: RewardType.POINTS, value: 10000, permanent: false }, { type: RewardType.MEMORY, value: 2, permanent: true }],
      },
      {
        id: 'entropy_max',
        name: '熵之极限',
        description: '让熵值达到100%',
        difficulty: ChallengeDifficulty.HARD,
        modifiers: [{ id: 'entropy_accel', name: '熵加速', description: '熵增长+50%', type: ModifierType.MULTIPLIER, value: 1.5, stackable: false }],
        rewards: [{ type: RewardType.POINTS, value: 3000, permanent: false }],
      },
      {
        id: 'technology_max',
        name: '科技巅峰',
        description: '达到最高科技等级',
        difficulty: ChallengeDifficulty.IMPOSSIBLE,
        modifiers: [{ id: 'slow_tech', name: '科技减速', description: '科技研究-50%', type: ModifierType.MULTIPLIER, value: 0.5, stackable: false }],
        rewards: [{ type: RewardType.POINTS, value: 50000, permanent: false }, { type: RewardType.UNLOCK, value: 0, permanent: true }],
      },
      {
        id: 'cosmic_challenge',
        name: '宇宙挑战',
        description: '触发10次宇宙事件',
        difficulty: ChallengeDifficulty.COSMIC,
        modifiers: [
          { id: 'rare_events', name: '稀有事件', description: '宇宙事件概率+200%', type: ModifierType.MULTIPLIER, value: 3, stackable: false },
          { id: 'double_entropy', name: '双倍熵增', description: '熵增长+100%', type: ModifierType.MULTIPLIER, value: 2, stackable: false },
        ],
        rewards: [{ type: RewardType.POINTS, value: 100000, permanent: false }, { type: RewardType.MEMORY, value: 5, permanent: true }],
      },
    ];
    
    for (const def of challengeDefinitions) {
      const challenge: ReincarnationChallenge = {
        id: def.id!,
        name: def.name!,
        description: def.description!,
        difficulty: def.difficulty!,
        modifiers: def.modifiers || [],
        rewards: def.rewards || [],
        active: false,
        completed: false,
        bestScore: 0,
        attempts: 0,
      };
      this.challenges.set(challenge.id, challenge);
    }
  }
  
  private initializeShop(): void {
    const shopDefinitions: Partial<ShopItem>[] = [
      { id: 'point_boost_small', name: '积分小增幅', description: '下次轮回积分+20%', category: ShopCategory.TEMPORARY, cost: 200, effects: [{ type: 'point_multiplier', value: 0.2, duration: 1 }], maxPurchases: 1, icon: '💫' },
      { id: 'point_boost_large', name: '积分大增幅', description: '下次轮回积分+50%', category: ShopCategory.TEMPORARY, cost: 500, effects: [{ type: 'point_multiplier', value: 0.5, duration: 1 }], maxPurchases: 1, icon: '⭐' },
      { id: 'starting_boost', name: '开局优势', description: '下次轮回开局+500资源', category: ShopCategory.TEMPORARY, cost: 150, effects: [{ type: 'starting_resources', value: 500, duration: 1 }], maxPurchases: 3, icon: '🚀' },
      { id: 'memory_preserve', name: '记忆保存', description: '下次轮回保留1条额外记忆', category: ShopCategory.TEMPORARY, cost: 300, effects: [{ type: 'memory_slots', value: 1, duration: 1 }], maxPurchases: 3, icon: '💭' },
      { id: 'karma_cleanse', name: '业力净化', description: '清除50%负面业力', category: ShopCategory.SPECIAL, cost: 1000, effects: [{ type: 'karma_cleanse', value: 0.5, duration: 0 }], maxPurchases: 1, icon: '✨' },
      { id: 'divine_blessing', name: '神圣祝福', description: '下次轮回获得随机祝福', category: ShopCategory.SPECIAL, cost: 800, effects: [{ type: 'random_blessing', value: 1, duration: 1 }], maxPurchases: 1, icon: '🙏' },
      { id: 'cosmetic_frame', name: '传说边框', description: '解锁传说级头像边框', category: ShopCategory.COSMETIC, cost: 2000, effects: [{ type: 'cosmetic_frame', value: 1, duration: 0 }], maxPurchases: 1, icon: '🖼️' },
      { id: 'cosmetic_particle', name: '宇宙粒子', description: '解锁宇宙粒子效果', category: ShopCategory.COSMETIC, cost: 3000, effects: [{ type: 'cosmetic_particle', value: 1, duration: 0 }], maxPurchases: 1, icon: '✨' },
    ];
    
    for (const def of shopDefinitions) {
      const item: ShopItem = {
        id: def.id!,
        name: def.name!,
        description: def.description!,
        category: def.category!,
        cost: def.cost!,
        effects: def.effects!,
        purchased: false,
        purchaseCount: 0,
        maxPurchases: def.maxPurchases || 1,
        icon: def.icon || '🛒',
      };
      this.shopItems.set(item.id, item);
    }
  }
  
  public startRun(): void {
    this.runStartTime = Date.now();
    this.runStatistics = this.initRunStatistics();
    this.currentRun = null;
    
    logger.debug('ReincarnationSystem', '新轮回开始');
  }
  
  public updateStatistics(stats: Partial<ReincarnationStatistics>): void {
    Object.assign(this.runStatistics, stats);
    
    if (stats.maxPopulation && stats.maxPopulation > this.metaProgression.highestPopulation) {
      this.metaProgression.highestPopulation = stats.maxPopulation;
    }
    if (stats.technologyLevel && stats.technologyLevel > this.metaProgression.highestTechnology) {
      this.metaProgression.highestTechnology = stats.technologyLevel;
    }
  }
  
  public canReincarnate(): ReincarnationCondition[] {
    const conditions: ReincarnationCondition[] = [
      {
        id: 'min_time',
        name: '最低时间',
        description: '运行至少1分钟',
        type: ConditionType.TIME,
        requirement: { type: 'time', target: 60000, current: Date.now() - this.runStartTime },
        bonusMultiplier: 1.0,
        required: true,
        met: Date.now() - this.runStartTime >= 60000,
      },
      {
        id: 'min_population',
        name: '最低人口',
        description: '人口达到10人',
        type: ConditionType.POPULATION,
        requirement: { type: 'population', target: 10, current: this.runStatistics.maxPopulation },
        bonusMultiplier: 1.0,
        required: true,
        met: this.runStatistics.maxPopulation >= 10,
      },
    ];
    
    return conditions;
  }
  
  public reincarnate(type: ReincarnationType = ReincarnationType.NORMAL): ReincarnationResult {
    const now = Date.now();
    const duration = now - this.runStartTime;
    
    const conditions = this.canReincarnate();
    const allMet = conditions.every(c => !c.required || c.met);
    
    if (!allMet) {
      throw new Error('Not all required reincarnation conditions are met');
    }
    
    const baseScore = this.calculateBaseScore();
    const typeMultiplier = RoguelikeReincarnationSystem.POINT_MULTIPLIERS[type];
    const challengeBonus = this.calculateChallengeBonus();
    const unlockBonus = this.calculateUnlockBonus();
    
    const totalMultiplier = typeMultiplier * challengeBonus * unlockBonus;
    const finalScore = Math.floor(baseScore * totalMultiplier);
    const pointsEarned = Math.floor(finalScore * 0.1);
    
    const rank = this.determineRank(finalScore);
    const bonuses = this.generateBonuses(type, rank);
    const unlocks = this.checkUnlocks(finalScore);
    const memories = this.generateInheritedMemories();
    
    const result: ReincarnationResult = {
      id: crypto.randomUUID(),
      type,
      timestamp: now,
      duration,
      score: finalScore,
      pointsEarned,
      conditions,
      bonuses,
      unlocks,
      memories,
      statistics: { ...this.runStatistics },
      rank,
    };
    
    this.reincarnationHistory.push(result);
    this.currentRun = result;
    
    this.updateMetaProgression(result);
    this.updateChallenges(result);
    this.applyBonuses(bonuses);
    
    console.log(`[ReincarnationSystem] Reincarnation complete: ${rank} rank, ${pointsEarned} points earned`);
    
    return result;
  }
  
  private calculateBaseScore(): number {
    let score = 0;
    
    score += this.runStatistics.maxPopulation * 10;
    score += this.runStatistics.technologyLevel * 1000;
    score += this.runStatistics.observations * 5;
    score += this.runStatistics.achievementsUnlocked * 500;
    score += this.runStatistics.miraclesPerformed * 200;
    score += this.runStatistics.catastrophesSurvived * 300;
    score += this.runStatistics.divineInterventions * 100;
    
    score *= 1 + (1 - this.runStatistics.entropyReached) * 0.5;
    
    const durationMinutes = this.runStatistics.timeElapsed / 60000;
    if (durationMinutes > 0) {
      score *= Math.min(2, 1 + Math.log10(durationMinutes) * 0.2);
    }
    
    return Math.floor(score);
  }
  
  private calculateChallengeBonus(): number {
    let bonus = 1.0;
    
    for (const challengeId of this.activeChallenges) {
      const challenge = this.challenges.get(challengeId);
      if (challenge && challenge.active) {
        const difficultyBonus: Record<ChallengeDifficulty, number> = {
          [ChallengeDifficulty.EASY]: 1.1,
          [ChallengeDifficulty.NORMAL]: 1.25,
          [ChallengeDifficulty.HARD]: 1.5,
          [ChallengeDifficulty.NIGHTMARE]: 2.0,
          [ChallengeDifficulty.IMPOSSIBLE]: 3.0,
          [ChallengeDifficulty.COSMIC]: 5.0,
        };
        bonus *= difficultyBonus[challenge.difficulty];
      }
    }
    
    return bonus;
  }
  
  private calculateUnlockBonus(): number {
    let bonus = 1.0;
    
    for (const unlockable of this.unlockables.values()) {
      if (unlockable.unlocked) {
        for (const effect of unlockable.effects) {
          if (effect.type === 'point_multiplier') {
            bonus += effect.value;
          }
        }
      }
    }
    
    return bonus;
  }
  
  private determineRank(score: number): ReincarnationRank {
    const ranks = Object.entries(RoguelikeReincarnationSystem.RANK_THRESHOLDS);
    
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (score >= ranks[i][1]) {
        return ranks[i][0] as ReincarnationRank;
      }
    }
    
    return ReincarnationRank.DUST;
  }
  
  private generateBonuses(type: ReincarnationType, rank: ReincarnationRank): ReincarnationBonus[] {
    const bonuses: ReincarnationBonus[] = [];
    
    const rankBonus: Record<ReincarnationRank, number> = {
      [ReincarnationRank.DUST]: 0,
      [ReincarnationRank.PEBBLE]: 0.05,
      [ReincarnationRank.STONE]: 0.1,
      [ReincarnationRank.BOULDER]: 0.15,
      [ReincarnationRank.MOUNTAIN]: 0.2,
      [ReincarnationRank.PLANET]: 0.25,
      [ReincarnationRank.STAR]: 0.3,
      [ReincarnationRank.GALAXY]: 0.35,
      [ReincarnationRank.UNIVERSE]: 0.4,
      [ReincarnationRank.MULTIVERSE]: 0.45,
      [ReincarnationRank.OMNIVERSE]: 0.5,
      [ReincarnationRank.ETERNAL]: 1.0,
    };
    
    if (rankBonus[rank] > 0) {
      bonuses.push({
        id: 'rank_bonus',
        name: `${rank} 等级奖励`,
        description: `下次轮回积分+${rankBonus[rank] * 100}%`,
        type: BonusType.POINTS_MULTIPLIER,
        value: rankBonus[rank],
        permanent: false,
      });
    }
    
    if (type === ReincarnationType.TRANSCENDENT || type === ReincarnationType.DIVINE) {
      bonuses.push({
        id: 'memory_bonus',
        name: '超凡记忆',
        description: '+1记忆槽位',
        type: BonusType.MEMORY_SLOT,
        value: 1,
        permanent: false,
      });
    }
    
    return bonuses;
  }
  
  private checkUnlocks(score: number): string[] {
    const newUnlocks: string[] = [];
    
    for (const [id, unlockable] of this.unlockables) {
      if (unlockable.unlocked) continue;
      
      const requirementsMet = unlockable.requirements.every(
        reqId => this.unlockables.get(reqId)?.unlocked
      );
      
      if (requirementsMet && this.metaProgression.currentPoints >= unlockable.cost) {
        unlockable.unlocked = true;
        unlockable.unlockedAt = Date.now();
        newUnlocks.push(id);
        
        console.log(`[ReincarnationSystem] Unlocked: ${unlockable.name}`);
      }
    }
    
    return newUnlocks;
  }
  
  private generateInheritedMemories(): InheritedMemory[] {
    const memories: InheritedMemory[] = [];
    
    if (this.runStatistics.technologyLevel > 5) {
      memories.push({
        id: crypto.randomUUID(),
        type: MemoryType.TECHNOLOGY,
        content: `科技知识 Lv.${this.runStatistics.technologyLevel}`,
        strength: Math.min(1, this.runStatistics.technologyLevel / 10),
        source: 'technology_inheritance',
        generation: this.metaProgression.totalReincarnations,
        decayRate: 0.1,
      });
    }
    
    if (this.runStatistics.miraclesPerformed > 3) {
      memories.push({
        id: crypto.randomUUID(),
        type: MemoryType.BLESSING,
        content: '神圣祝福记忆',
        strength: Math.min(1, this.runStatistics.miraclesPerformed / 10),
        source: 'miracle_inheritance',
        generation: this.metaProgression.totalReincarnations,
        decayRate: 0.05,
      });
    }
    
    if (this.runStatistics.catastrophesSurvived > 2) {
      memories.push({
        id: crypto.randomUUID(),
        type: MemoryType.EVENT,
        content: '灾难生存经验',
        strength: Math.min(1, this.runStatistics.catastrophesSurvived / 5),
        source: 'catastrophe_inheritance',
        generation: this.metaProgression.totalReincarnations,
        decayRate: 0.15,
      });
    }
    
    return memories;
  }
  
  private updateMetaProgression(result: ReincarnationResult): void {
    this.metaProgression.totalReincarnations++;
    this.metaProgression.totalPoints += result.pointsEarned;
    this.metaProgression.currentPoints += result.pointsEarned;
    
    if (result.score > this.metaProgression.highestScore) {
      this.metaProgression.highestScore = result.score;
    }
    
    this.metaProgression.totalPlaytime += result.duration;
    
    if (result.duration > this.metaProgression.longestRun) {
      this.metaProgression.longestRun = result.duration;
    }
    
    if (result.duration < this.metaProgression.fastestReincarnation) {
      this.metaProgression.fastestReincarnation = result.duration;
    }
    
    this.metaProgression.totalObservations += result.statistics.observations;
    this.metaProgression.totalAchievements += result.statistics.achievementsUnlocked;
    
    this.metaProgression.averageScore =
      (this.metaProgression.averageScore * (this.metaProgression.totalReincarnations - 1) + result.score) /
      this.metaProgression.totalReincarnations;
    
    if (!this.metaProgression.reincarnationsByType[result.type]) {
      this.metaProgression.reincarnationsByType[result.type] = 0;
    }
    this.metaProgression.reincarnationsByType[result.type]++;
    
    this.metaProgression.memoriesInherited += result.memories.length;
  }
  
  private updateChallenges(result: ReincarnationResult): void {
    for (const challengeId of this.activeChallenges) {
      const challenge = this.challenges.get(challengeId);
      if (challenge) {
        challenge.attempts++;
        challenge.active = false;
        
        if (result.score > challenge.bestScore) {
          challenge.bestScore = result.score;
        }
        
        if (this.checkChallengeCompletion(challenge, result)) {
          challenge.completed = true;
          
          for (const reward of challenge.rewards) {
            if (reward.type === RewardType.POINTS) {
              this.metaProgression.currentPoints += reward.value;
            }
          }
          
          console.log(`[ReincarnationSystem] Challenge completed: ${challenge.name}`);
        }
      }
    }
    
    this.activeChallenges = [];
  }
  
  private checkChallengeCompletion(challenge: ReincarnationChallenge, result: ReincarnationResult): boolean {
    if (challenge.id === 'speedrun_1') {
      return result.duration <= 300000;
    }
    if (challenge.id === 'speedrun_2') {
      return result.duration <= 180000;
    }
    if (challenge.id === 'population_100') {
      return result.statistics.maxPopulation >= 100;
    }
    if (challenge.id === 'population_1000') {
      return result.statistics.maxPopulation >= 1000;
    }
    if (challenge.id === 'no_death') {
      return result.statistics.totalDeaths === 0;
    }
    if (challenge.id === 'entropy_max') {
      return result.statistics.entropyReached >= 1;
    }
    
    return false;
  }
  
  private applyBonuses(bonuses: ReincarnationBonus[]): void {
    for (const bonus of bonuses) {
      if (bonus.permanent) {
        switch (bonus.type) {
          case BonusType.POINTS_MULTIPLIER:
            break;
          case BonusType.MEMORY_SLOT:
            break;
        }
      }
    }
  }
  
  public purchaseUnlock(unlockId: string): boolean {
    const unlockable = this.unlockables.get(unlockId);
    if (!unlockable || unlockable.unlocked) return false;
    
    const requirementsMet = unlockable.requirements.every(
      reqId => this.unlockables.get(reqId)?.unlocked
    );
    if (!requirementsMet) return false;
    
    if (this.metaProgression.currentPoints < unlockable.cost) return false;
    
    this.metaProgression.currentPoints -= unlockable.cost;
    unlockable.unlocked = true;
    unlockable.unlockedAt = Date.now();
    this.metaProgression.unlocksPurchased++;
    
    console.log(`[ReincarnationSystem] Purchased: ${unlockable.name}`);
    return true;
  }
  
  public purchaseShopItem(itemId: string): boolean {
    const item = this.shopItems.get(itemId);
    if (!item) return false;
    if (item.purchaseCount >= item.maxPurchases) return false;
    if (this.metaProgression.currentPoints < item.cost) return false;
    
    this.metaProgression.currentPoints -= item.cost;
    item.purchaseCount++;
    if (item.purchaseCount >= item.maxPurchases) {
      item.purchased = true;
    }
    
    console.log(`[ReincarnationSystem] Purchased shop item: ${item.name}`);
    return true;
  }
  
  public activateChallenge(challengeId: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.active) return false;
    
    challenge.active = true;
    challenge.attempts++;
    this.activeChallenges.push(challengeId);
    
    logger.info('ReincarnationSystem', `挑战已激活: ${challenge.name}`);
    return true;
  }
  
  public getMetaProgression(): MetaProgression {
    return { ...this.metaProgression };
  }
  
  public getCurrentRun(): ReincarnationResult | null {
    return this.currentRun;
  }
  
  public getReincarnationHistory(limit: number = 100): ReincarnationResult[] {
    return this.reincarnationHistory.slice(-limit);
  }
  
  public getUnlockables(): Unlockable[] {
    return Array.from(this.unlockables.values());
  }
  
  public getUnlockedItems(): Unlockable[] {
    return this.getUnlockables().filter(u => u.unlocked);
  }
  
  public getChallenges(): ReincarnationChallenge[] {
    return Array.from(this.challenges.values());
  }
  
  public getActiveChallenges(): ReincarnationChallenge[] {
    return this.getChallenges().filter(c => c.active);
  }
  
  public getShopItems(): ShopItem[] {
    return Array.from(this.shopItems.values());
  }
  
  public getInheritedMemories(): InheritedMemory[] {
    return [...this.inheritedMemories];
  }
  
  public getRunStatistics(): ReincarnationStatistics {
    return { ...this.runStatistics };
  }
  
  public getRankProgress(): { current: ReincarnationRank; next: ReincarnationRank | null; progress: number } {
    const currentScore = this.currentRun?.score || 0;
    const ranks = Object.entries(RoguelikeReincarnationSystem.RANK_THRESHOLDS);
    
    let currentRank = ReincarnationRank.DUST;
    let nextRank: ReincarnationRank | null = null;
    let progress = 0;
    
    for (let i = 0; i < ranks.length; i++) {
      if (currentScore >= ranks[i][1]) {
        currentRank = ranks[i][0] as ReincarnationRank;
        if (i < ranks.length - 1) {
          nextRank = ranks[i + 1][0] as ReincarnationRank;
          const currentThreshold = ranks[i][1];
          const nextThreshold = ranks[i + 1][1];
          progress = (currentScore - currentThreshold) / (nextThreshold - currentThreshold);
        }
      }
    }
    
    return { current: currentRank, next: nextRank, progress: Math.min(1, progress) };
  }
  
  public async save(): Promise<void> {
    const data = {
      metaProgression: this.metaProgression,
      reincarnationHistory: this.reincarnationHistory.slice(-100),
      unlockables: Array.from(this.unlockables.entries()),
      challenges: Array.from(this.challenges.entries()),
      shopItems: Array.from(this.shopItems.entries()),
      inheritedMemories: this.inheritedMemories,
    };
    
    await storage.set('reincarnation_system', data);
  }
  
  public async load(): Promise<void> {
    const data = await storage.get('reincarnation_system') as {
      metaProgression?: MetaProgression;
      reincarnationHistory?: ReincarnationResult[];
      unlockables?: [string, Unlockable][];
      challenges?: [string, ReincarnationChallenge][];
      shopItems?: [string, ShopItem][];
      inheritedMemories?: InheritedMemory[];
    } | null;
    
    if (data) {
      this.metaProgression = data.metaProgression || this.initMetaProgression();
      this.reincarnationHistory = data.reincarnationHistory || [];
      this.inheritedMemories = data.inheritedMemories || [];
      
      if (data.unlockables) {
        for (const [id, unlockable] of data.unlockables) {
          this.unlockables.set(id, unlockable);
        }
      }
      
      if (data.challenges) {
        for (const [id, challenge] of data.challenges) {
          this.challenges.set(id, challenge);
        }
      }
      
      if (data.shopItems) {
        for (const [id, item] of data.shopItems) {
          this.shopItems.set(id, item);
        }
      }
    }
  }
  
  public reset(): void {
    this.metaProgression = this.initMetaProgression();
    this.reincarnationHistory = [];
    this.inheritedMemories = [];
    this.activeChallenges = [];
    this.currentRun = null;
    
    for (const unlockable of this.unlockables.values()) {
      unlockable.unlocked = false;
      unlockable.unlockedAt = undefined;
    }
    
    for (const challenge of this.challenges.values()) {
      challenge.active = false;
      challenge.completed = false;
      challenge.bestScore = 0;
      challenge.attempts = 0;
    }
    
    for (const item of this.shopItems.values()) {
      item.purchased = false;
      item.purchaseCount = 0;
    }
  }
}

export const roguelikeReincarnationSystem = new RoguelikeReincarnationSystem();
export default RoguelikeReincarnationSystem;
