/**
 * 世界状态类型定义
 */

import type { EntityId, Vec2, Vec3, Timestamp, Duration } from './index';

/**
 * 世界配置
 */
export interface WorldConfig {
  /** 世界名称 */
  name: string;
  /** 世界大小 */
  size: Vec2;
  /** 初始市民数量 */
  initialCitizens: number;
  /** 最大市民数量 */
  maxCitizens: number;
  /** 时间流速 */
  timeScale: number;
  /** 是否启用熵增纪元 */
  entropyEnabled: boolean;
}

/**
 * 世界状态
 */
export interface WorldState {
  /** 世界 ID */
  id: EntityId;
  /** 世界名称 */
  name: string;
  /** 当前时间 */
  currentTime: Timestamp;
  /** 游戏开始时间 */
  startTime: Timestamp;
  /** 总游戏时间 */
  totalGameTime: Duration;
  /** Tick 计数 */
  tickCount: number;
  /** 时间流速 */
  timeScale: number;
  /** 是否暂停 */
  paused: boolean;
  /** 熵值 */
  entropy: number;
  /** 时代 */
  epoch: EpochType;
}

/**
 * 时代类型
 */
export enum EpochType {
  GENESIS = 'genesis',         // 创世纪
  TRIBAL = 'tribal',           // 部落时代
  CIVILIZATION = 'civilization', // 文明时代
  INDUSTRIAL = 'industrial',   // 工业时代
  DIGITAL = 'digital',         // 数字时代
  QUANTUM = 'quantum',         // 量子时代
  ENTROPY = 'entropy',        // 熵增纪元
  REBIRTH = 'rebirth',         // 重生
}

/**
 * 时代信息
 */
export interface EpochInfo {
  /** 时代类型 */
  type: EpochType;
  /** 时代名称 */
  name: string;
  /** 时代描述 */
  description: string;
  /** 开始时间 */
  startTime: Timestamp;
  /** 结束时间 (如果结束) */
  endTime?: Timestamp;
  /** 时代特征 */
  features: EpochFeature[];
}

/**
 * 时代特征
 */
export interface EpochFeature {
  /** 特征 ID */
  id: string;
  /** 特征名称 */
  name: string;
  /** 特征描述 */
  description: string;
  /** 特征强度 */
  intensity: number;
}

/**
 * 世界事件
 */
export interface WorldEvent {
  /** 事件 ID */
  id: EntityId;
  /** 事件类型 */
  type: WorldEventType;
  /** 事件名称 */
  name: string;
  /** 事件描述 */
  description: string;
  /** 事件时间 */
  timestamp: Timestamp;
  /** 事件影响 */
  impact: WorldEventImpact;
  /** 严重程度 */
  severity: number;
  /** 是否已处理 */
  handled: boolean;
}

/**
 * 世界事件类型
 */
export enum WorldEventType {
  BIRTH = 'birth',
  DEATH = 'death',
  DISEASE = 'disease',
  FAMINE = 'famine',
  WAR = 'war',
  PEACE = 'peace',
  INVENTION = 'invention',
  CATASTROPHE = 'catastrophe',
  METAMORPHOSIS = 'metamorphosis',
  AWAKENING = 'awakening',
}

/**
 * 世界事件影响
 */
export interface WorldEventImpact {
  /** 人口影响 */
  population: number;
  /** 经济影响 */
  economy: number;
  /** 环境影响 */
  environment: number;
  /** 社会影响 */
  social: number;
  /** 熵增影响 */
  entropy: number;
}

/**
 * 气候类型
 */
export enum ClimateType {
  TROPICAL = 'tropical',
  ARID = 'arid',
  TEMPERATE = 'temperate',
  CONTINENTAL = 'continental',
  POLAR = 'polar',
}

/**
 * 气候状态
 */
export interface ClimateState {
  /** 气候类型 */
  type: ClimateType;
  /** 温度 */
  temperature: number;
  /** 湿度 */
  humidity: number;
  /** 降水量 */
  precipitation: number;
  /** 风速 */
  windSpeed: number;
  /** 风向 */
  windDirection: number;
}

/**
 * 地形类型
 */
export enum TerrainType {
  PLAINS = 'plains',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  DESERT = 'desert',
  OCEAN = 'ocean',
  URBAN = 'urban',
  WASTELAND = 'wasteland',
}

/**
 * 地形单元
 */
export interface TerrainCell {
  /** 坐标 */
  position: Vec2;
  /** 地形类型 */
  type: TerrainType;
  /** 高度 */
  altitude: number;
  /** 资源丰富度 */
  resourceRichness: number;
  /** 可通行性 */
  traversable: boolean;
}

/**
 * 区域
 */
export interface Region {
  /** 区域 ID */
  id: EntityId;
  /** 区域名称 */
  name: string;
  /** 区域类型 */
  type: RegionType;
  /** 区域边界 */
  bounds: {
    min: Vec2;
    max: Vec2;
  };
  /** 区域状态 */
  state: RegionState;
}

/**
 * 区域类型
 */
export enum RegionType {
  SETTLEMENT = 'settlement',
  AGRICULTURAL = 'agricultural',
  INDUSTRIAL = 'industrial',
  COMMERCIAL = 'commercial',
  RESIDENTIAL = 'residential',
  MILITARY = 'military',
  RELIGIOUS = 'religious',
  SACRED = 'sacred',
}

/**
 * 区域状态
 */
export interface RegionState {
  /** 繁荣度 */
  prosperity: number;
  /** 人口 */
  population: number;
  /** 发展等级 */
  developmentLevel: number;
  /** 设施列表 */
  facilities: string[];
}

/**
 * 基础设施
 */
export interface Infrastructure {
  /** 基础设施 ID */
  id: EntityId;
  /** 基础设施类型 */
  type: InfrastructureType;
  /** 位置 */
  position: Vec3;
  /** 等级 */
  level: number;
  /** 状态 */
  operational: boolean;
  /** 覆盖范围 */
  coverage: number;
}

/**
 * 基础设施类型
 */
export enum InfrastructureType {
  ROAD = 'road',
  POWER_GRID = 'power_grid',
  WATER_SYSTEM = 'water_system',
  COMMUNICATION = 'communication',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  TRANSPORTATION = 'transportation',
}

/**
 * 世界快照
 */
export interface WorldSnapshot {
  id: EntityId;
  config: WorldConfig;
  state: WorldState;
  currentEpoch: EpochInfo;
  climate: ClimateState;
  terrain: TerrainCell[];
  regions: Region[];
  statistics: WorldStatistics;
  timestamp: Timestamp;
}

/**
 * 世界统计
 */
export interface WorldStatistics {
  /** 总人口 */
  totalPopulation: number;
  /** 出生率 */
  birthRate: number;
  /** 死亡率 */
  deathRate: number;
  /** 平均寿命 */
  averageLifespan: Duration;
  /** GDP */
  gdp: number;
  /** 总资源量 */
  totalResources: Record<string, number>;
  /** 幸福指数 */
  happinessIndex: number;
  /** 技术等级 */
  technologyLevel: number;
  /** 熵增总量 */
  totalEntropy: number;
}

/**
 * 世界难度
 */
export enum WorldDifficulty {
  PEACEFUL = 'peaceful',       // 和平
  EASY = 'easy',              // 简单
  NORMAL = 'normal',          // 普通
  HARD = 'hard',              // 困难
  EXTREME = 'extreme',        // 极限
  CUSTOM = 'custom',          // 自定义
}

/**
 * 世界难度配置
 */
export interface DifficultyConfig {
  /** 难度类型 */
  type: WorldDifficulty;
  /** 资源倍率 */
  resourceMultiplier: number;
  /** 灾害频率 */
  disasterFrequency: number;
  /** AI 强度 */
  aiStrength: number;
  /** 时间倍率 */
  timeScale: number;
}
