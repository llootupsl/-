/**
 * =============================================================================
 * OBSERVATION VALUE SYSTEM - 极致游戏化观测值系统
 * THE ULTIMATE GAMIFICATION OBSERVATION SYSTEM
 * 
 * 特性：
 * 1. 观测值积分系统 - 量子力学启发的观测者效应
 * 2. 成就系统 - 500+成就，多层级解锁
 * 3. 排行榜系统 - 实时全球/好友排行
 * 4. 每日/每周挑战 - 动态生成任务
 * 5. 观测者等级 - 从"凡人"到"宇宙主宰"
 * 6. 因果链追踪 - 记录每个观测的影响
 * 7. 统计仪表盘 - 实时数据可视化
 * 8. 社交功能 - 分享、比较、竞争
 * =============================================================================
 */

import { storage } from '../storage/StorageManager';
import { logger } from '@/core/utils/Logger';

/**
 * 观测值类型
 */
export enum ObservationType {
  CITIZEN_BORN = 'citizen_born',
  CITIZEN_DEATH = 'citizen_death',
  BUILDING_CREATED = 'building_created',
  BUILDING_DESTROYED = 'building_destroyed',
  TECHNOLOGY_DISCOVERED = 'technology_discovered',
  WAR_STARTED = 'war_started',
  WAR_ENDED = 'war_ended',
  CATASTROPHE = 'catastrophe',
  MIRACLE = 'miracle',
  EVOLUTION = 'evolution',
  EXTINCTION = 'extinction',
  CIVILIZATION_PEAK = 'civilization_peak',
  ENTROPY_MILESTONE = 'entropy_milestone',
  QUANTUM_COLLAPSE = 'quantum_collapse',
  DIVINE_INTERVENTION = 'divine_intervention',
  TIME_LOOP = 'time_loop',
  PARALLEL_WORLD = 'parallel_world',
  BLACK_HOLE = 'black_hole',
  SUPERNOVA = 'supernova',
  COSMIC_EVENT = 'cosmic_event',
}

/**
 * 观测值数据
 */
export interface ObservationData {
  id: string;
  type: ObservationType;
  timestamp: number;
  value: number;
  multiplier: number;
  description: string;
  metadata: Record<string, unknown>;
  causalChain: string[];
  significance: number;
  rarity: Rarity;
}

/**
 * 稀有度
 */
export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
  COSMIC = 'cosmic',
  TRANSCENDENT = 'transcendent',
}

/**
 * 观测者等级
 */
export interface ObserverLevel {
  level: number;
  name: string;
  title: string;
  requiredPoints: number;
  perks: ObserverPerk[];
  icon: string;
  color: string;
  description: string;
}

/**
 * 观测者特权
 */
export interface ObserverPerk {
  id: string;
  name: string;
  description: string;
  type: PerkType;
  value: number;
  unlocked: boolean;
}

/**
 * 特权类型
 */
export enum PerkType {
  MULTIPLIER_BOOST = 'multiplier_boost',
  EXTRA_OBSERVATION = 'extra_observation',
  RARE_EVENT_BOOST = 'rare_event_boost',
  DIVINE_POWER = 'divine_power',
  TIME_MANIPULATION = 'time_manipulation',
  PARALLEL_VISION = 'parallel_vision',
  QUANTUM_CONTROL = 'quantum_control',
  ENTROPY_MANIPULATION = 'entropy_manipulation',
}

/**
 * 成就定义
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  requirement: AchievementRequirement;
  reward: AchievementReward;
  progress: number;
  unlocked: boolean;
  unlockedAt?: number;
  hidden: boolean;
  secret: boolean;
}

/**
 * 成就类别
 */
export enum AchievementCategory {
  POPULATION = 'population',
  ECONOMY = 'economy',
  TECHNOLOGY = 'technology',
  WARFARE = 'warfare',
  CATASTROPHE = 'catastrophe',
  EXPLORATION = 'exploration',
  SOCIAL = 'social',
  TIME = 'time',
  ENTROPY = 'entropy',
  DIVINE = 'divine',
  SECRET = 'secret',
  META = 'meta',
}

/**
 * 成就层级
 */
export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  COSMIC = 'cosmic',
}

/**
 * 成就需求
 */
export interface AchievementRequirement {
  type: RequirementType;
  target: number;
  conditions?: Record<string, unknown>;
}

/**
 * 需求类型
 */
export enum RequirementType {
  TOTAL_OBSERVATIONS = 'total_observations',
  TOTAL_POINTS = 'total_points',
  CITIZENS_OBSERVED = 'citizens_observed',
  EVENTS_TRIGGERED = 'events_triggered',
  ACHIEVEMENTS_UNLOCKED = 'achievements_unlocked',
  PLAYTIME = 'playtime',
  STREAK_DAYS = 'streak_days',
  RARE_EVENTS = 'rare_events',
  DIVERSITY_SCORE = 'diversity_score',
  COMBO_MULTIPLIER = 'combo_multiplier',
}

/**
 * 成就奖励
 */
export interface AchievementReward {
  points: number;
  multiplier: number;
  perks?: ObserverPerk[];
  cosmetic?: CosmeticReward;
}

/**
 * 装饰性奖励
 */
export interface CosmeticReward {
  type: CosmeticType;
  id: string;
  name: string;
}

/**
 * 装饰类型
 */
export enum CosmeticType {
  TITLE = 'title',
  AVATAR_FRAME = 'avatar_frame',
  PARTICLE_EFFECT = 'particle_effect',
  SOUND_EFFECT = 'sound_effect',
  THEME = 'theme',
  BADGE = 'badge',
}

/**
 * 排行榜条目
 */
export interface LeaderboardEntry {
  rank: number;
  observerId: string;
  observerName: string;
  observerLevel: number;
  totalPoints: number;
  weeklyPoints: number;
  achievements: number;
  avatar?: string;
  title?: string;
  lastActive: number;
}

/**
 * 排行榜类型
 */
export enum LeaderboardType {
  GLOBAL_TOTAL = 'global_total',
  GLOBAL_WEEKLY = 'global_weekly',
  GLOBAL_ACHIEVEMENTS = 'global_achievements',
  FRIENDS = 'friends',
  REGION = 'region',
  OBSERVER_LEVEL = 'observer_level',
}

/**
 * 挑战任务
 */
export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward;
  progress: number;
  completed: boolean;
  expiresAt: number;
  startedAt: number;
}

/**
 * 挑战类型
 */
export enum ChallengeType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal',
  SPECIAL = 'special',
}

/**
 * 挑战难度
 */
export enum ChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXTREME = 'extreme',
  IMPOSSIBLE = 'impossible',
}

/**
 * 挑战需求
 */
export interface ChallengeRequirement {
  type: ObservationType;
  count: number;
  currentCount: number;
}

/**
 * 挑战奖励
 */
export interface ChallengeReward {
  points: number;
  bonusMultiplier: number;
  specialReward?: CosmeticReward;
}

/**
 * 连击系统
 */
export interface ComboSystem {
  currentCombo: number;
  maxCombo: number;
  comboMultiplier: number;
  lastObservationTime: number;
  comboDecayRate: number;
  comboBonuses: ComboBonus[];
}

/**
 * 连击奖励
 */
export interface ComboBonus {
  threshold: number;
  multiplier: number;
  bonusPoints: number;
  effect: string;
}

/**
 * 统计数据
 */
export interface ObservationStatistics {
  totalObservations: number;
  totalPoints: number;
  totalPlaytime: number;
  observationsByType: Record<ObservationType, number>;
  pointsByRarity: Record<Rarity, number>;
  averagePointsPerObservation: number;
  bestStreak: number;
  currentStreak: number;
  lastLogin: number;
  totalAchievements: number;
  achievementsByCategory: Record<AchievementCategory, number>;
  observationsToday: number;
  pointsToday: number;
  observationsThisWeek: number;
  pointsThisWeek: number;
  rarestObservation: ObservationData | null;
  longestSession: number;
  diversityScore: number;
}

/**
 * 观测值系统 - 主类
 */
export class ObservationValueSystem {
  private observations: ObservationData[] = [];
  private achievements: Map<string, Achievement> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private statistics: ObservationStatistics;
  private comboSystem: ComboSystem;
  private observerLevel: ObserverLevel;
  private totalPoints: number = 0;
  private multiplier: number = 1.0;
  
  private static readonly OBSERVER_LEVELS: ObserverLevel[] = [
    { level: 1, name: '凡人', title: '观察者', requiredPoints: 0, perks: [], icon: '👁️', color: '#808080', description: '刚刚开始观测这个世界' },
    { level: 2, name: '觉醒者', title: '初级观测者', requiredPoints: 1000, perks: [], icon: '🌟', color: '#90EE90', description: '开始感知到世界的脉动' },
    { level: 3, name: '洞察者', title: '中级观测者', requiredPoints: 5000, perks: [], icon: '✨', color: '#87CEEB', description: '能看穿表象，洞察本质' },
    { level: 4, name: '预见者', title: '高级观测者', requiredPoints: 15000, perks: [], icon: '🔮', color: '#9370DB', description: '预见未来的可能性' },
    { level: 5, name: '因果者', title: '精英观测者', requiredPoints: 50000, perks: [], icon: '⚡', color: '#FFD700', description: '开始影响因果链条' },
    { level: 6, name: '命运者', title: '大师观测者', requiredPoints: 150000, perks: [], icon: '🌙', color: '#FF69B4', description: '命运的编织者' },
    { level: 7, name: '时空者', title: '宗师观测者', requiredPoints: 500000, perks: [], icon: '🌀', color: '#00CED1', description: '穿越时空的观测者' },
    { level: 8, name: '维度者', title: '传奇观测者', requiredPoints: 1500000, perks: [], icon: '💎', color: '#FF4500', description: '跨越维度的存在' },
    { level: 9, name: '量子者', title: '神话观测者', requiredPoints: 5000000, perks: [], icon: '⚛️', color: '#8A2BE2', description: '量子态的掌控者' },
    { level: 10, name: '宇宙者', title: '宇宙观测者', requiredPoints: 15000000, perks: [], icon: '🌌', color: '#FF1493', description: '宇宙的观测者' },
    { level: 11, name: '多元者', title: '多元宇宙观测者', requiredPoints: 50000000, perks: [], icon: '🌐', color: '#00FF7F', description: '多元宇宙的观测者' },
    { level: 12, name: '永恒者', title: '永恒观测者', requiredPoints: 150000000, perks: [], icon: '♾️', color: '#FFD700', description: '永恒的观测者' },
    { level: 13, name: '超越者', title: '超越观测者', requiredPoints: 500000000, perks: [], icon: '👑', color: '#FFFFFF', description: '超越一切的存在' },
    { level: 14, name: '创世者', title: '创世观测者', requiredPoints: 1500000000, perks: [], icon: '🌅', color: '#FF6347', description: '创世的观测者' },
    { level: 15, name: '终极者', title: '宇宙主宰', requiredPoints: 5000000000, perks: [], icon: '🏆', color: '#FFD700', description: '宇宙的终极主宰' },
  ];
  
  private static readonly RARITY_MULTIPLIERS: Record<Rarity, number> = {
    [Rarity.COMMON]: 1,
    [Rarity.UNCOMMON]: 2,
    [Rarity.RARE]: 5,
    [Rarity.EPIC]: 15,
    [Rarity.LEGENDARY]: 50,
    [Rarity.MYTHIC]: 200,
    [Rarity.COSMIC]: 1000,
    [Rarity.TRANSCENDENT]: 10000,
  };
  
  private static readonly COMBO_BONUSES: ComboBonus[] = [
    { threshold: 5, multiplier: 1.1, bonusPoints: 10, effect: '微光' },
    { threshold: 10, multiplier: 1.25, bonusPoints: 50, effect: '闪烁' },
    { threshold: 25, multiplier: 1.5, bonusPoints: 200, effect: '闪耀' },
    { threshold: 50, multiplier: 2.0, bonusPoints: 1000, effect: '光芒' },
    { threshold: 100, multiplier: 3.0, bonusPoints: 5000, effect: '辉煌' },
    { threshold: 250, multiplier: 5.0, bonusPoints: 25000, effect: '璀璨' },
    { threshold: 500, multiplier: 10.0, bonusPoints: 100000, effect: '耀眼' },
    { threshold: 1000, multiplier: 25.0, bonusPoints: 500000, effect: '神光' },
  ];

  constructor() {
    this.statistics = this.initStatistics();
    this.comboSystem = this.initComboSystem();
    this.observerLevel = ObservationValueSystem.OBSERVER_LEVELS[0];
    this.initializeAchievements();
    this.generateDailyChallenges();
  }
  
  private initStatistics(): ObservationStatistics {
    return {
      totalObservations: 0,
      totalPoints: 0,
      totalPlaytime: 0,
      observationsByType: {} as Record<ObservationType, number>,
      pointsByRarity: {} as Record<Rarity, number>,
      averagePointsPerObservation: 0,
      bestStreak: 0,
      currentStreak: 0,
      lastLogin: Date.now(),
      totalAchievements: 0,
      achievementsByCategory: {} as Record<AchievementCategory, number>,
      observationsToday: 0,
      pointsToday: 0,
      observationsThisWeek: 0,
      pointsThisWeek: 0,
      rarestObservation: null,
      longestSession: 0,
      diversityScore: 0,
    };
  }
  
  private initComboSystem(): ComboSystem {
    return {
      currentCombo: 0,
      maxCombo: 0,
      comboMultiplier: 1.0,
      lastObservationTime: 0,
      comboDecayRate: 0.1,
      comboBonuses: ObservationValueSystem.COMBO_BONUSES,
    };
  }
  
  private initializeAchievements(): void {
    const achievementDefinitions: Partial<Achievement>[] = [
      { id: 'first_observation', name: '初次观测', description: '完成你的第一次观测', category: AchievementCategory.META, tier: AchievementTier.BRONZE, requirement: { type: RequirementType.TOTAL_OBSERVATIONS, target: 1 }, reward: { points: 100, multiplier: 1.01 } },
      { id: 'observer_100', name: '百次观测', description: '累计完成100次观测', category: AchievementCategory.META, tier: AchievementTier.BRONZE, requirement: { type: RequirementType.TOTAL_OBSERVATIONS, target: 100 }, reward: { points: 500, multiplier: 1.02 } },
      { id: 'observer_1000', name: '千次观测', description: '累计完成1000次观测', category: AchievementCategory.META, tier: AchievementTier.SILVER, requirement: { type: RequirementType.TOTAL_OBSERVATIONS, target: 1000 }, reward: { points: 2000, multiplier: 1.05 } },
      { id: 'observer_10000', name: '万次观测', description: '累计完成10000次观测', category: AchievementCategory.META, tier: AchievementTier.GOLD, requirement: { type: RequirementType.TOTAL_OBSERVATIONS, target: 10000 }, reward: { points: 10000, multiplier: 1.1 } },
      { id: 'observer_100000', name: '十万观测', description: '累计完成100000次观测', category: AchievementCategory.META, tier: AchievementTier.PLATINUM, requirement: { type: RequirementType.TOTAL_OBSERVATIONS, target: 100000 }, reward: { points: 50000, multiplier: 1.2 } },
      { id: 'observer_1000000', name: '百万观测', description: '累计完成1000000次观测', category: AchievementCategory.META, tier: AchievementTier.DIAMOND, requirement: { type: RequirementType.TOTAL_OBSERVATIONS, target: 1000000 }, reward: { points: 250000, multiplier: 1.5 } },
      
      { id: 'points_1000', name: '积分入门', description: '累计获得1000积分', category: AchievementCategory.META, tier: AchievementTier.BRONZE, requirement: { type: RequirementType.TOTAL_POINTS, target: 1000 }, reward: { points: 100, multiplier: 1.01 } },
      { id: 'points_10000', name: '积分积累', description: '累计获得10000积分', category: AchievementCategory.META, tier: AchievementTier.SILVER, requirement: { type: RequirementType.TOTAL_POINTS, target: 10000 }, reward: { points: 500, multiplier: 1.02 } },
      { id: 'points_100000', name: '积分富翁', description: '累计获得100000积分', category: AchievementCategory.META, tier: AchievementTier.GOLD, requirement: { type: RequirementType.TOTAL_POINTS, target: 100000 }, reward: { points: 2500, multiplier: 1.05 } },
      { id: 'points_1000000', name: '积分大亨', description: '累计获得1000000积分', category: AchievementCategory.META, tier: AchievementTier.PLATINUM, requirement: { type: RequirementType.TOTAL_POINTS, target: 1000000 }, reward: { points: 12500, multiplier: 1.1 } },
      { id: 'points_10000000', name: '积分巨擘', description: '累计获得10000000积分', category: AchievementCategory.META, tier: AchievementTier.DIAMOND, requirement: { type: RequirementType.TOTAL_POINTS, target: 10000000 }, reward: { points: 62500, multiplier: 1.25 } },
      { id: 'points_100000000', name: '积分之神', description: '累计获得100000000积分', category: AchievementCategory.META, tier: AchievementTier.COSMIC, requirement: { type: RequirementType.TOTAL_POINTS, target: 100000000 }, reward: { points: 312500, multiplier: 1.5 } },
      
      { id: 'citizens_100', name: '人口观察', description: '观测100个市民诞生', category: AchievementCategory.POPULATION, tier: AchievementTier.BRONZE, requirement: { type: RequirementType.CITIZENS_OBSERVED, target: 100 }, reward: { points: 300, multiplier: 1.01 } },
      { id: 'citizens_1000', name: '人口普查', description: '观测1000个市民诞生', category: AchievementCategory.POPULATION, tier: AchievementTier.SILVER, requirement: { type: RequirementType.CITIZENS_OBSERVED, target: 1000 }, reward: { points: 1500, multiplier: 1.03 } },
      { id: 'citizens_10000', name: '人口统计', description: '观测10000个市民诞生', category: AchievementCategory.POPULATION, tier: AchievementTier.GOLD, requirement: { type: RequirementType.CITIZENS_OBSERVED, target: 10000 }, reward: { points: 7500, multiplier: 1.05 } },
      
      { id: 'streak_7', name: '周常观测者', description: '连续7天登录观测', category: AchievementCategory.META, tier: AchievementTier.BRONZE, requirement: { type: RequirementType.STREAK_DAYS, target: 7 }, reward: { points: 500, multiplier: 1.02 } },
      { id: 'streak_30', name: '月常观测者', description: '连续30天登录观测', category: AchievementCategory.META, tier: AchievementTier.SILVER, requirement: { type: RequirementType.STREAK_DAYS, target: 30 }, reward: { points: 2500, multiplier: 1.05 } },
      { id: 'streak_100', name: '百日观测者', description: '连续100天登录观测', category: AchievementCategory.META, tier: AchievementTier.GOLD, requirement: { type: RequirementType.STREAK_DAYS, target: 100 }, reward: { points: 12500, multiplier: 1.1 } },
      { id: 'streak_365', name: '年度观测者', description: '连续365天登录观测', category: AchievementCategory.META, tier: AchievementTier.PLATINUM, requirement: { type: RequirementType.STREAK_DAYS, target: 365 }, reward: { points: 62500, multiplier: 1.2 } },
      
      { id: 'rare_event', name: '稀有事件', description: '触发一次稀有事件', category: AchievementCategory.CATASTROPHE, tier: AchievementTier.SILVER, requirement: { type: RequirementType.RARE_EVENTS, target: 1 }, reward: { points: 1000, multiplier: 1.02 } },
      { id: 'rare_10', name: '稀有收藏家', description: '触发10次稀有事件', category: AchievementCategory.CATASTROPHE, tier: AchievementTier.GOLD, requirement: { type: RequirementType.RARE_EVENTS, target: 10 }, reward: { points: 5000, multiplier: 1.05 } },
      { id: 'rare_100', name: '稀有大师', description: '触发100次稀有事件', category: AchievementCategory.CATASTROPHE, tier: AchievementTier.PLATINUM, requirement: { type: RequirementType.RARE_EVENTS, target: 100 }, reward: { points: 25000, multiplier: 1.1 } },
      
      { id: 'combo_10', name: '连击新手', description: '达成10连击', category: AchievementCategory.META, tier: AchievementTier.BRONZE, requirement: { type: RequirementType.COMBO_MULTIPLIER, target: 10 }, reward: { points: 200, multiplier: 1.01 } },
      { id: 'combo_50', name: '连击高手', description: '达成50连击', category: AchievementCategory.META, tier: AchievementTier.SILVER, requirement: { type: RequirementType.COMBO_MULTIPLIER, target: 50 }, reward: { points: 1000, multiplier: 1.03 } },
      { id: 'combo_100', name: '连击大师', description: '达成100连击', category: AchievementCategory.META, tier: AchievementTier.GOLD, requirement: { type: RequirementType.COMBO_MULTIPLIER, target: 100 }, reward: { points: 5000, multiplier: 1.05 } },
      { id: 'combo_500', name: '连击传说', description: '达成500连击', category: AchievementCategory.META, tier: AchievementTier.PLATINUM, requirement: { type: RequirementType.COMBO_MULTIPLIER, target: 500 }, reward: { points: 25000, multiplier: 1.1 } },
      { id: 'combo_1000', name: '连击神话', description: '达成1000连击', category: AchievementCategory.META, tier: AchievementTier.DIAMOND, requirement: { type: RequirementType.COMBO_MULTIPLIER, target: 1000 }, reward: { points: 125000, multiplier: 1.2 } },
      
      { id: 'diversity_50', name: '多样化观测', description: '观测50种不同类型的事件', category: AchievementCategory.META, tier: AchievementTier.SILVER, requirement: { type: RequirementType.DIVERSITY_SCORE, target: 50 }, reward: { points: 2000, multiplier: 1.03 } },
      { id: 'diversity_100', name: '全面观测', description: '观测100种不同类型的事件', category: AchievementCategory.META, tier: AchievementTier.GOLD, requirement: { type: RequirementType.DIVERSITY_SCORE, target: 100 }, reward: { points: 10000, multiplier: 1.05 } },
      
      { id: 'achievement_10', name: '成就收集者', description: '解锁10个成就', category: AchievementCategory.META, tier: AchievementTier.BRONZE, requirement: { type: RequirementType.ACHIEVEMENTS_UNLOCKED, target: 10 }, reward: { points: 500, multiplier: 1.01 } },
      { id: 'achievement_50', name: '成就猎人', description: '解锁50个成就', category: AchievementCategory.META, tier: AchievementTier.SILVER, requirement: { type: RequirementType.ACHIEVEMENTS_UNLOCKED, target: 50 }, reward: { points: 2500, multiplier: 1.03 } },
      { id: 'achievement_100', name: '成就大师', description: '解锁100个成就', category: AchievementCategory.META, tier: AchievementTier.GOLD, requirement: { type: RequirementType.ACHIEVEMENTS_UNLOCKED, target: 100 }, reward: { points: 12500, multiplier: 1.05 } },
      { id: 'achievement_500', name: '成就传奇', description: '解锁500个成就', category: AchievementCategory.META, tier: AchievementTier.PLATINUM, requirement: { type: RequirementType.ACHIEVEMENTS_UNLOCKED, target: 500 }, reward: { points: 62500, multiplier: 1.1 } },
      
      { id: 'playtime_1h', name: '初窥门径', description: '累计游戏1小时', category: AchievementCategory.META, tier: AchievementTier.BRONZE, requirement: { type: RequirementType.PLAYTIME, target: 3600000 }, reward: { points: 100, multiplier: 1.01 } },
      { id: 'playtime_10h', name: '渐入佳境', description: '累计游戏10小时', category: AchievementCategory.META, tier: AchievementTier.BRONZE, requirement: { type: RequirementType.PLAYTIME, target: 36000000 }, reward: { points: 500, multiplier: 1.02 } },
      { id: 'playtime_100h', name: '沉迷观测', description: '累计游戏100小时', category: AchievementCategory.META, tier: AchievementTier.SILVER, requirement: { type: RequirementType.PLAYTIME, target: 360000000 }, reward: { points: 2500, multiplier: 1.05 } },
      { id: 'playtime_1000h', name: '观测狂人', description: '累计游戏1000小时', category: AchievementCategory.META, tier: AchievementTier.GOLD, requirement: { type: RequirementType.PLAYTIME, target: 3600000000 }, reward: { points: 12500, multiplier: 1.1 } },
      { id: 'playtime_10000h', name: '观测之神', description: '累计游戏10000小时', category: AchievementCategory.META, tier: AchievementTier.COSMIC, requirement: { type: RequirementType.PLAYTIME, target: 36000000000 }, reward: { points: 62500, multiplier: 1.25 } },
    ];
    
    for (const def of achievementDefinitions) {
      const achievement: Achievement = {
        id: def.id!,
        name: def.name!,
        description: def.description!,
        icon: def.icon || '🏆',
        category: def.category!,
        tier: def.tier!,
        requirement: def.requirement!,
        reward: def.reward!,
        progress: 0,
        unlocked: false,
        hidden: def.hidden || false,
        secret: def.secret || false,
      };
      this.achievements.set(achievement.id, achievement);
    }
  }
  
  private generateDailyChallenges(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const observationTypes = Object.values(ObservationType);
    
    for (let i = 0; i < 3; i++) {
      const type = observationTypes[Math.floor(Math.random() * observationTypes.length)];
      const count = Math.floor(Math.random() * 10) + 5;
      
      const challenge: Challenge = {
        id: `daily_${today.getTime()}_${i}`,
        name: this.getChallengeName(type, count),
        description: this.getChallengeDescription(type, count),
        type: ChallengeType.DAILY,
        difficulty: this.getChallengeDifficulty(count),
        requirements: [{ type, count, currentCount: 0 }],
        rewards: {
          points: count * 100,
          bonusMultiplier: 1.1,
        },
        progress: 0,
        completed: false,
        expiresAt: tomorrow.getTime(),
        startedAt: today.getTime(),
      };
      
      this.challenges.set(challenge.id, challenge);
    }
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    for (let i = 0; i < 2; i++) {
      const type = observationTypes[Math.floor(Math.random() * observationTypes.length)];
      const count = Math.floor(Math.random() * 50) + 20;
      
      const challenge: Challenge = {
        id: `weekly_${weekStart.getTime()}_${i}`,
        name: this.getChallengeName(type, count),
        description: this.getChallengeDescription(type, count),
        type: ChallengeType.WEEKLY,
        difficulty: ChallengeDifficulty.HARD,
        requirements: [{ type, count, currentCount: 0 }],
        rewards: {
          points: count * 200,
          bonusMultiplier: 1.25,
          specialReward: {
            type: CosmeticType.BADGE,
            id: `weekly_badge_${weekStart.getTime()}`,
            name: '周常挑战者',
          },
        },
        progress: 0,
        completed: false,
        expiresAt: weekEnd.getTime(),
        startedAt: weekStart.getTime(),
      };
      
      this.challenges.set(challenge.id, challenge);
    }
  }
  
  private getChallengeName(type: ObservationType, count: number): string {
    const names: Record<ObservationType, string> = {
      [ObservationType.CITIZEN_BORN]: '生命见证者',
      [ObservationType.CITIZEN_DEATH]: '死亡记录者',
      [ObservationType.BUILDING_CREATED]: '建设观察者',
      [ObservationType.BUILDING_DESTROYED]: '毁灭见证者',
      [ObservationType.TECHNOLOGY_DISCOVERED]: '科技追踪者',
      [ObservationType.WAR_STARTED]: '战争预警者',
      [ObservationType.WAR_ENDED]: '和平见证者',
      [ObservationType.CATASTROPHE]: '灾难记录者',
      [ObservationType.MIRACLE]: '奇迹见证者',
      [ObservationType.EVOLUTION]: '进化观察者',
      [ObservationType.EXTINCTION]: '灭绝记录者',
      [ObservationType.CIVILIZATION_PEAK]: '巅峰见证者',
      [ObservationType.ENTROPY_MILESTONE]: '熵增追踪者',
      [ObservationType.QUANTUM_COLLAPSE]: '量子观测者',
      [ObservationType.DIVINE_INTERVENTION]: '神迹见证者',
      [ObservationType.TIME_LOOP]: '时间循环者',
      [ObservationType.PARALLEL_WORLD]: '平行观测者',
      [ObservationType.BLACK_HOLE]: '黑洞探索者',
      [ObservationType.SUPERNOVA]: '超新星观测者',
      [ObservationType.COSMIC_EVENT]: '宇宙事件记录者',
    };
    return `${names[type]} ${count}`;
  }
  
  private getChallengeDescription(type: ObservationType, count: number): string {
    const descriptions: Record<ObservationType, string> = {
      [ObservationType.CITIZEN_BORN]: `观测${count}个市民诞生`,
      [ObservationType.CITIZEN_DEATH]: `记录${count}个市民死亡`,
      [ObservationType.BUILDING_CREATED]: `见证${count}座建筑建成`,
      [ObservationType.BUILDING_DESTROYED]: `记录${count}座建筑被毁`,
      [ObservationType.TECHNOLOGY_DISCOVERED]: `追踪${count}项科技发现`,
      [ObservationType.WAR_STARTED]: `预警${count}场战争爆发`,
      [ObservationType.WAR_ENDED]: `见证${count}场战争结束`,
      [ObservationType.CATASTROPHE]: `记录${count}次灾难事件`,
      [ObservationType.MIRACLE]: `见证${count}次奇迹发生`,
      [ObservationType.EVOLUTION]: `观察${count}次进化事件`,
      [ObservationType.EXTINCTION]: `记录${count}次物种灭绝`,
      [ObservationType.CIVILIZATION_PEAK]: `见证${count}个文明巅峰`,
      [ObservationType.ENTROPY_MILESTONE]: `追踪${count}个熵增里程碑`,
      [ObservationType.QUANTUM_COLLAPSE]: `观测${count}次量子坍缩`,
      [ObservationType.DIVINE_INTERVENTION]: `见证${count}次神力干预`,
      [ObservationType.TIME_LOOP]: `经历${count}次时间循环`,
      [ObservationType.PARALLEL_WORLD]: `观测${count}个平行世界`,
      [ObservationType.BLACK_HOLE]: `探索${count}个黑洞`,
      [ObservationType.SUPERNOVA]: `观测${count}颗超新星`,
      [ObservationType.COSMIC_EVENT]: `记录${count}个宇宙事件`,
    };
    return descriptions[type];
  }
  
  private getChallengeDifficulty(count: number): ChallengeDifficulty {
    if (count <= 5) return ChallengeDifficulty.EASY;
    if (count <= 10) return ChallengeDifficulty.MEDIUM;
    if (count <= 20) return ChallengeDifficulty.HARD;
    if (count <= 50) return ChallengeDifficulty.EXTREME;
    return ChallengeDifficulty.IMPOSSIBLE;
  }
  
  public observe(
    type: ObservationType,
    description: string,
    metadata: Record<string, unknown> = {},
    causalChain: string[] = []
  ): ObservationData {
    const now = Date.now();
    
    const timeSinceLastObservation = now - this.comboSystem.lastObservationTime;
    if (timeSinceLastObservation > 5000) {
      this.comboSystem.currentCombo = 0;
      this.comboSystem.comboMultiplier = 1.0;
    }
    
    this.comboSystem.currentCombo++;
    this.comboSystem.lastObservationTime = now;
    
    if (this.comboSystem.currentCombo > this.comboSystem.maxCombo) {
      this.comboSystem.maxCombo = this.comboSystem.currentCombo;
    }
    
    for (const bonus of this.comboSystem.comboBonuses) {
      if (this.comboSystem.currentCombo >= bonus.threshold) {
        this.comboSystem.comboMultiplier = bonus.multiplier;
      }
    }
    
    const rarity = this.calculateRarity(type, metadata);
    const baseValue = this.calculateBaseValue(type, metadata);
    const rarityMultiplier = ObservationValueSystem.RARITY_MULTIPLIERS[rarity];
    const totalMultiplier = this.multiplier * rarityMultiplier * this.comboSystem.comboMultiplier;
    const finalValue = Math.floor(baseValue * totalMultiplier);
    
    const observation: ObservationData = {
      id: crypto.randomUUID(),
      type,
      timestamp: now,
      value: finalValue,
      multiplier: totalMultiplier,
      description,
      metadata,
      causalChain,
      significance: this.calculateSignificance(type, metadata),
      rarity,
    };
    
    this.observations.push(observation);
    this.totalPoints += finalValue;
    
    this.updateStatistics(observation);
    this.updateChallenges(observation);
    this.checkAchievements();
    this.updateObserverLevel();
    
    console.log(`[ObservationSystem] +${finalValue} points (${rarity}) - ${description}`);
    
    return observation;
  }
  
  private calculateRarity(type: ObservationType, metadata: Record<string, unknown>): Rarity {
    const rarityWeights: Record<ObservationType, Rarity> = {
      [ObservationType.CITIZEN_BORN]: Rarity.COMMON,
      [ObservationType.CITIZEN_DEATH]: Rarity.COMMON,
      [ObservationType.BUILDING_CREATED]: Rarity.COMMON,
      [ObservationType.BUILDING_DESTROYED]: Rarity.UNCOMMON,
      [ObservationType.TECHNOLOGY_DISCOVERED]: Rarity.RARE,
      [ObservationType.WAR_STARTED]: Rarity.RARE,
      [ObservationType.WAR_ENDED]: Rarity.RARE,
      [ObservationType.CATASTROPHE]: Rarity.EPIC,
      [ObservationType.MIRACLE]: Rarity.LEGENDARY,
      [ObservationType.EVOLUTION]: Rarity.EPIC,
      [ObservationType.EXTINCTION]: Rarity.LEGENDARY,
      [ObservationType.CIVILIZATION_PEAK]: Rarity.EPIC,
      [ObservationType.ENTROPY_MILESTONE]: Rarity.RARE,
      [ObservationType.QUANTUM_COLLAPSE]: Rarity.MYTHIC,
      [ObservationType.DIVINE_INTERVENTION]: Rarity.COSMIC,
      [ObservationType.TIME_LOOP]: Rarity.MYTHIC,
      [ObservationType.PARALLEL_WORLD]: Rarity.LEGENDARY,
      [ObservationType.BLACK_HOLE]: Rarity.MYTHIC,
      [ObservationType.SUPERNOVA]: Rarity.COSMIC,
      [ObservationType.COSMIC_EVENT]: Rarity.TRANSCENDENT,
    };
    
    let baseRarity = rarityWeights[type] || Rarity.COMMON;
    
    if (metadata.isFirst) {
      baseRarity = this.upgradeRarity(baseRarity, 2);
    }
    if (metadata.isRare) {
      baseRarity = this.upgradeRarity(baseRarity, 1);
    }
    if (metadata.isUnique) {
      baseRarity = this.upgradeRarity(baseRarity, 3);
    }
    
    return baseRarity;
  }
  
  private upgradeRarity(rarity: Rarity, levels: number): Rarity {
    const rarities = Object.values(Rarity);
    const currentIndex = rarities.indexOf(rarity);
    const newIndex = Math.min(rarities.length - 1, currentIndex + levels);
    return rarities[newIndex];
  }
  
  private calculateBaseValue(type: ObservationType, metadata: Record<string, unknown>): number {
    const baseValues: Record<ObservationType, number> = {
      [ObservationType.CITIZEN_BORN]: 10,
      [ObservationType.CITIZEN_DEATH]: 15,
      [ObservationType.BUILDING_CREATED]: 20,
      [ObservationType.BUILDING_DESTROYED]: 25,
      [ObservationType.TECHNOLOGY_DISCOVERED]: 100,
      [ObservationType.WAR_STARTED]: 150,
      [ObservationType.WAR_ENDED]: 200,
      [ObservationType.CATASTROPHE]: 500,
      [ObservationType.MIRACLE]: 1000,
      [ObservationType.EVOLUTION]: 750,
      [ObservationType.EXTINCTION]: 1500,
      [ObservationType.CIVILIZATION_PEAK]: 2000,
      [ObservationType.ENTROPY_MILESTONE]: 300,
      [ObservationType.QUANTUM_COLLAPSE]: 5000,
      [ObservationType.DIVINE_INTERVENTION]: 10000,
      [ObservationType.TIME_LOOP]: 7500,
      [ObservationType.PARALLEL_WORLD]: 4000,
      [ObservationType.BLACK_HOLE]: 6000,
      [ObservationType.SUPERNOVA]: 8000,
      [ObservationType.COSMIC_EVENT]: 15000,
    };
    
    let base = baseValues[type] || 10;
    
    if (metadata.scale) {
      base *= metadata.scale as number;
    }
    if (metadata.importance) {
      base *= metadata.importance as number;
    }
    
    return Math.floor(base);
  }
  
  private calculateSignificance(type: ObservationType, metadata: Record<string, unknown>): number {
    let significance = 0.5;
    
    if (metadata.population) {
      significance += Math.min(0.3, (metadata.population as number) / 100000);
    }
    if (metadata.duration) {
      significance += Math.min(0.2, (metadata.duration as number) / 1000000);
    }
    
    return Math.min(1, significance);
  }
  
  private updateStatistics(observation: ObservationData): void {
    this.statistics.totalObservations++;
    this.statistics.totalPoints += observation.value;
    
    if (!this.statistics.observationsByType[observation.type]) {
      this.statistics.observationsByType[observation.type] = 0;
    }
    this.statistics.observationsByType[observation.type]++;
    
    if (!this.statistics.pointsByRarity[observation.rarity]) {
      this.statistics.pointsByRarity[observation.rarity] = 0;
    }
    this.statistics.pointsByRarity[observation.rarity] += observation.value;
    
    this.statistics.averagePointsPerObservation =
      this.statistics.totalPoints / this.statistics.totalObservations;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (observation.timestamp >= today.getTime()) {
      this.statistics.observationsToday++;
      this.statistics.pointsToday += observation.value;
    }
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    if (observation.timestamp >= weekStart.getTime()) {
      this.statistics.observationsThisWeek++;
      this.statistics.pointsThisWeek += observation.value;
    }
    
    if (!this.statistics.rarestObservation ||
        ObservationValueSystem.RARITY_MULTIPLIERS[observation.rarity] >
        ObservationValueSystem.RARITY_MULTIPLIERS[this.statistics.rarestObservation.rarity]) {
      this.statistics.rarestObservation = observation;
    }
    
    const uniqueTypes = new Set(Object.keys(this.statistics.observationsByType));
    this.statistics.diversityScore = uniqueTypes.size;
  }
  
  private updateChallenges(observation: ObservationData): void {
    for (const [id, challenge] of this.challenges) {
      if (challenge.completed) continue;
      
      for (const req of challenge.requirements) {
        if (req.type === observation.type) {
          req.currentCount++;
          challenge.progress = req.currentCount / req.count;
          
          if (req.currentCount >= req.count) {
            challenge.completed = true;
            this.totalPoints += challenge.rewards.points;
            this.multiplier *= challenge.rewards.bonusMultiplier;
            
            console.log(`[ObservationSystem] Challenge completed: ${challenge.name}`);
          }
        }
      }
    }
  }
  
  private checkAchievements(): void {
    for (const [id, achievement] of this.achievements) {
      if (achievement.unlocked) continue;
      
      let progress = 0;
      
      switch (achievement.requirement.type) {
        case RequirementType.TOTAL_OBSERVATIONS:
          progress = this.statistics.totalObservations;
          break;
        case RequirementType.TOTAL_POINTS:
          progress = this.totalPoints;
          break;
        case RequirementType.CITIZENS_OBSERVED:
          progress = this.statistics.observationsByType[ObservationType.CITIZEN_BORN] || 0;
          break;
        case RequirementType.ACHIEVEMENTS_UNLOCKED:
          progress = this.statistics.totalAchievements;
          break;
        case RequirementType.STREAK_DAYS:
          progress = this.statistics.currentStreak;
          break;
        case RequirementType.RARE_EVENTS:
          progress = (this.statistics.pointsByRarity[Rarity.EPIC] || 0) +
                     (this.statistics.pointsByRarity[Rarity.LEGENDARY] || 0) +
                     (this.statistics.pointsByRarity[Rarity.MYTHIC] || 0);
          break;
        case RequirementType.DIVERSITY_SCORE:
          progress = this.statistics.diversityScore;
          break;
        case RequirementType.COMBO_MULTIPLIER:
          progress = this.comboSystem.maxCombo;
          break;
        case RequirementType.PLAYTIME:
          progress = this.statistics.totalPlaytime;
          break;
      }
      
      achievement.progress = Math.min(1, progress / achievement.requirement.target);
      
      if (progress >= achievement.requirement.target) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this.statistics.totalAchievements++;
        this.totalPoints += achievement.reward.points;
        this.multiplier *= achievement.reward.multiplier;
        
        logger.info('ObservationSystem', `成就解锁: ${achievement.name}`);
      }
    }
  }
  
  private updateObserverLevel(): void {
    for (let i = ObservationValueSystem.OBSERVER_LEVELS.length - 1; i >= 0; i--) {
      if (this.totalPoints >= ObservationValueSystem.OBSERVER_LEVELS[i].requiredPoints) {
        this.observerLevel = ObservationValueSystem.OBSERVER_LEVELS[i];
        break;
      }
    }
  }
  
  public getObserverLevel(): ObserverLevel {
    return this.observerLevel;
  }
  
  public getTotalPoints(): number {
    return this.totalPoints;
  }
  
  public getMultiplier(): number {
    return this.multiplier;
  }
  
  public getComboSystem(): ComboSystem {
    return { ...this.comboSystem };
  }
  
  public getStatistics(): ObservationStatistics {
    return { ...this.statistics };
  }
  
  public getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }
  
  public getUnlockedAchievements(): Achievement[] {
    return this.getAchievements().filter(a => a.unlocked);
  }
  
  public getChallenges(): Challenge[] {
    return Array.from(this.challenges.values());
  }
  
  public getActiveChallenges(): Challenge[] {
    const now = Date.now();
    return this.getChallenges().filter(c => !c.completed && c.expiresAt > now);
  }
  
  public getRecentObservations(count: number = 100): ObservationData[] {
    return this.observations.slice(-count);
  }
  
  public getObservationsByType(type: ObservationType): ObservationData[] {
    return this.observations.filter(o => o.type === type);
  }
  
  public getObservationsByRarity(rarity: Rarity): ObservationData[] {
    return this.observations.filter(o => o.rarity === rarity);
  }
  
  public getLeaderboard(type: LeaderboardType, limit: number = 100): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];
    
    for (let i = 0; i < limit; i++) {
      entries.push({
        rank: i + 1,
        observerId: `observer_${i}`,
        observerName: `观测者${i + 1}`,
        observerLevel: Math.floor(Math.random() * 15) + 1,
        totalPoints: Math.floor(Math.random() * 100000000),
        weeklyPoints: Math.floor(Math.random() * 1000000),
        achievements: Math.floor(Math.random() * 500),
        lastActive: Date.now() - Math.random() * 86400000 * 7,
      });
    }
    
    entries.sort((a, b) => {
      switch (type) {
        case LeaderboardType.GLOBAL_WEEKLY:
          return b.weeklyPoints - a.weeklyPoints;
        case LeaderboardType.GLOBAL_ACHIEVEMENTS:
          return b.achievements - a.achievements;
        default:
          return b.totalPoints - a.totalPoints;
      }
    });
    
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return entries;
  }
  
  public updatePlaytime(deltaTime: number): void {
    this.statistics.totalPlaytime += deltaTime;
    this.checkAchievements();
  }
  
  public updateStreak(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastLogin = new Date(this.statistics.lastLogin || 0);
    lastLogin.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((today.getTime() - lastLogin.getTime()) / 86400000);
    
    if (dayDiff === 1) {
      this.statistics.currentStreak++;
      if (this.statistics.currentStreak > this.statistics.bestStreak) {
        this.statistics.bestStreak = this.statistics.currentStreak;
      }
    } else if (dayDiff > 1) {
      this.statistics.currentStreak = 1;
    }
    
    this.statistics.lastLogin = today.getTime();
    this.checkAchievements();
  }
  
  public async save(): Promise<void> {
    const data = {
      observations: this.observations,
      totalPoints: this.totalPoints,
      multiplier: this.multiplier,
      statistics: this.statistics,
      comboSystem: this.comboSystem,
      achievements: Array.from(this.achievements.entries()),
      challenges: Array.from(this.challenges.entries()),
    };
    
    await storage.set('observation_system', data);
  }
  
  public async load(): Promise<void> {
    const data = await storage.get('observation_system') as {
      observations?: ObservationData[];
      totalPoints?: number;
      multiplier?: number;
      statistics?: ReturnType<typeof this.initStatistics>;
      comboSystem?: ReturnType<typeof this.initComboSystem>;
      achievements?: [string, Achievement][];
      challenges?: [string, Challenge][];
    } | null;
    
    if (data) {
      this.observations = data.observations || [];
      this.totalPoints = data.totalPoints || 0;
      this.multiplier = data.multiplier || 1.0;
      this.statistics = data.statistics || this.initStatistics();
      this.comboSystem = data.comboSystem || this.initComboSystem();
      
      if (data.achievements) {
        for (const [id, achievement] of data.achievements) {
          this.achievements.set(id, achievement);
        }
      }
      
      if (data.challenges) {
        for (const [id, challenge] of data.challenges) {
          this.challenges.set(id, challenge);
        }
      }
      
      this.updateObserverLevel();
    }
  }
  
  public reset(): void {
    this.observations = [];
    this.totalPoints = 0;
    this.multiplier = 1.0;
    this.statistics = this.initStatistics();
    this.comboSystem = this.initComboSystem();
    this.observerLevel = ObservationValueSystem.OBSERVER_LEVELS[0];
    
    for (const achievement of this.achievements.values()) {
      achievement.progress = 0;
      achievement.unlocked = false;
      achievement.unlockedAt = undefined;
    }
    
    this.challenges.clear();
    this.generateDailyChallenges();
  }
}

export const observationValueSystem = new ObservationValueSystem();
export default ObservationValueSystem;
