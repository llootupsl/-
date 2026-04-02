/**
 * 市民相关类型定义
 */

import type { EntityId, Vec2, Vec3, Timestamp, Duration, Probability } from './index';
import { CitizenStateType } from '@/core/constants';

/** 基因类型枚举 */
export type GeneTypeValue = 'physical' | 'cognitive' | 'emotional' | 'social' | 'metabolic' | 'immune' | 'longevity' | 'creativity';

/** 基因显性类型 */
export type GeneDominance = 'dominant' | 'recessive' | 'co-dominant';

/** 单个基因 */
export interface Gene {
  id: string;
  name: string;
  type: GeneTypeValue;
  value: number;
  dominance: GeneDominance;
  mutationRate: number;
  methylated: boolean;
  expressionLevel: number;
}

/**
 * 市民基因型（简单格式 - base64编码）
 */
export interface Genome {
  /** 基因序列 (base64 编码) */
  genes: string;
  /** 基因数量 */
  geneCount: number;
  /** 突变率 */
  mutationRate: number;
  /** 交叉率 */
  crossoverRate: number;
}

/**
 * 扩展基因组（完整格式 - Gene数组）
 */
export interface ExtendedGenome {
  /** 基因序列 */
  genes: Gene[];
  /** 染色体对数 */
  chromosomePairs: number;
  /** 基因组大小 */
  genomeSize: number;
  /** 突变历史 */
  mutationHistory: MutationEvent[];
}

/** 突变事件 */
export interface MutationEvent {
  timestamp: number;
  geneId: string;
  oldValue: number;
  newValue: number;
  type: 'point' | 'insertion' | 'deletion' | 'duplication';
  source: 'random' | 'radiation' | 'chemical' | 'viral';
}

/** 存储层市民快照格式 */
export interface StoredCitizenSnapshot {
  id: EntityId;
  name: string;
  genome: string;
  phenotype: string;
  state: string;
  position: string;
  memories: string;
  relations: string;
  statistics: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * 市民表现型
 */
export interface Phenotype {
  /** 外观特征 */
  appearance: AppearanceTraits;
  /** 行为倾向 */
  behavior: BehaviorTraits;
  /** 能力值 */
  abilities: AbilityTraits;
  /** 适应性 */
  adaptability: AdaptabilityTraits;
}

/**
 * 外观特征
 */
export interface AppearanceTraits {
  /** 体型 */
  bodyType: number;
  /** 肤色 */
  skinTone: number;
  /** 眼睛颜色 */
  eyeColor: number;
  /** 发型 */
  hairStyle: number;
  /** 服装风格 */
  clothingStyle: number;
}

/**
 * 行为特征
 */
export interface BehaviorTraits {
  /** 攻击性 */
  aggression: number;
  /** 社交性 */
  sociability: number;
  /** 好奇心 */
  curiosity: number;
  /** 稳定性 */
  stability: number;
  /** 冒险精神 */
 冒险精神: number;
}

/**
 * 能力值
 */
export interface AbilityTraits {
  /** 智力 */
  intelligence: number;
  /** 体力 */
  strength: number;
  /** 敏捷 */
  agility: number;
  /** 感知 */
  perception: number;
  /** 魅力 */
  charisma: number;
  /** 索引签名 - 允许动态访问 */
  [key: string]: number;
}

/**
 * 适应性
 */
export interface AdaptabilityTraits {
  /** 环境适应 */
  environment: number;
  /** 社会适应 */
  social: number;
  /** 压力适应 */
  stress: number;
  /** 学习速度 */
  learning: number;
}

/**
 * 市民记忆
 */
export interface Memory {
  /** 记忆 ID */
  id: EntityId;
  /** 内容向量 (embedding) */
  embedding: Float32Array;
  /** 记忆文本 */
  text: string;
  /** 创建时间戳 */
  createdAt: Timestamp;
  /** 重要程度 */
  importance: number;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessedAt: Timestamp;
}

/**
 * 市民状态
 */
export interface CitizenState {
  /** 状态类型 */
  type: CitizenStateType;
  /** 能量 */
  energy: number;
  /** 健康值 */
  health: number;
  /** 心情 */
  mood: number;
  /** 饱食度 */
  hunger: number;
}

/**
 * 市民位置
 */
export interface CitizenPosition {
  /** 网格坐标 */
  grid: Vec2;
  /** 世界坐标 */
  world: Vec3;
  /** 高度 */
  altitude: number;
}

/**
 * 市民关系
 */
export interface CitizenRelation {
  /** 关系对象 ID */
  targetId: EntityId;
  /** 关系类型 */
  type: RelationType;
  /** 亲密度 */
  intimacy: number;
  /** 建立时间 */
  establishedAt: Timestamp;
}

/**
 * 关系类型
 */
export enum RelationType {
  FAMILY = 'family',
  FRIEND = 'friend',
  ROMANTIC = 'romantic',
  WORK = 'work',
  NEUTRAL = 'neutral',
  ENEMY = 'enemy',
}

/**
 * 市民决策
 */
export interface Decision {
  /** 决策类型 */
  type: DecisionType;
  /** 决策目标 */
  target?: EntityId;
  /** 决策参数 */
  params: Record<string, unknown>;
  /** 决策置信度 */
  confidence: number;
  /** 决策时间戳 */
  timestamp: Timestamp;
}

/**
 * 决策类型
 */
export enum DecisionType {
  MOVE = 'move',
  INTERACT = 'interact',
  REST = 'rest',
  EAT = 'eat',
  WORK = 'work',
  SOCIALIZE = 'socialize',
  ATTACK = 'attack',
  FLEE = 'flee',
  CREATE = 'create',
  DESTROY = 'destroy',
}

/**
 * 市民交互
 */
export interface Interaction {
  /** 交互 ID */
  id: EntityId;
  /** 发起者 */
  initiatorId: EntityId;
  /** 接收者 */
  recipientId: EntityId;
  /** 交互类型 */
  type: InteractionType;
  /** 交互结果 */
  result: InteractionResult;
  /** 时间戳 */
  timestamp: Timestamp;
}

/**
 * 交互类型
 */
export enum InteractionType {
  TRADE = 'trade',
  GIFT = 'gift',
  TALK = 'talk',
  FIGHT = 'fight',
  HELP = 'help',
  HARM = 'harm',
  MATE = 'mate',
}

/**
 * 交互结果
 */
export interface InteractionResult {
  /** 是否成功 */
  success: boolean;
  /** 结果值 */
  value: number;
  /** 效果描述 */
  effect: string;
  /** 对双方的影响 */
  impact: {
    initiator: number;
    recipient: number;
  };
}

/**
 * 市民死亡原因
 */
export enum DeathCause {
  AGE = 'age',
  HUNGER = 'hunger',
  DISEASE = 'disease',
  VIOLENCE = 'violence',
  ACCIDENT = 'accident',
  CATASTROPHE = 'catastrophe',
}

/**
 * 市民出生参数
 */
export interface CitizenBirthParams {
  /** 基因组 (可选，默认为随机) */
  genome?: Genome;
  /** 出生位置 (可选) */
  position?: Vec2;
  /** 父母 ID (可选) */
  parentIds?: [EntityId, EntityId];
  /** 是否强制 (用于测试) */
  force?: boolean;
}

/**
 * 市民统计数据
 */
export interface CitizenStatistics {
  /** 总出生数 */
  totalBirths: number;
  /** 总死亡数 */
  totalDeaths: number;
  /** 平均寿命 */
  averageLifespan: Duration;
  /** 总交互数 */
  totalInteractions: number;
  /** 平均能量 */
  averageEnergy: number;
  /** 最高能量 */
  maxEnergy: number;
  /** 最低能量 */
  minEnergy: number;
}

/**
 * 市民快照 (用于存档)
 */
export interface CitizenSnapshot {
  id: EntityId;
  name: string;
  genome: Genome;
  phenotype: Phenotype;
  state: CitizenState;
  position: CitizenPosition;
  memories: Memory[];
  relations: CitizenRelation[];
  statistics: CitizenStatistics;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 市民排序方式
 */
export enum CitizenSortBy {
  ID = 'id',
  ENERGY = 'energy',
  HEALTH = 'health',
  MOOD = 'mood',
  AGE = 'age',
  INTELLIGENCE = 'intelligence',
  SOCIAL = 'social',
}

/**
 * 市民筛选条件
 */
export interface CitizenFilter {
  /** 状态类型 */
  stateType?: CitizenStateType;
  /** 能量范围 */
  energyRange?: { min: number; max: number };
  /** 健康范围 */
  healthRange?: { min: number; max: number };
  /** 心情范围 */
  moodRange?: { min: number; max: number };
  /** 位置范围 */
  positionRange?: { min: Vec2; max: Vec2 };
  /** 关系类型 */
  relationType?: RelationType;
  /** 关系对象 ID */
  relatedTo?: EntityId;
}

/**
 * 市民查询选项
 */
export interface CitizenQueryOptions {
  /** 排序方式 */
  sortBy?: CitizenSortBy;
  /** 是否升序 */
  ascending?: boolean;
  /** 分页偏移 */
  offset?: number;
  /** 分页限制 */
  limit?: number;
  /** 筛选条件 */
  filter?: CitizenFilter;
}

/**
 * 市民查询结果
 */
export interface CitizenQueryResult {
  /** 市民列表 */
  citizens: CitizenSnapshot[];
  /** 总数 */
  total: number;
  /** 偏移 */
  offset: number;
  /** 限制 */
  limit: number;
}
