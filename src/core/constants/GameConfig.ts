/**
 * =============================================================================
 * 游戏配置常量
 * 集中管理所有可配置的游戏参数
 * =============================================================================
 */

/**
 * GNN（图神经网络）配置
 */
export const GNN_CONFIG = {
  /** GNN更新间隔（毫秒） */
  UPDATE_INTERVAL: 5000,
  /** 消息传递迭代次数 */
  MESSAGE_PASSING_ITERATIONS: 2,
  /** Embedding维度 */
  EMBEDDING_DIMENSION: 64,
  /** 节点类型 */
  NODE_TYPES: ['citizen', 'institution', 'religion', 'event'] as const,
  /** 关系类型 */
  EDGE_TYPES: ['friend', 'family', 'work', 'trade', 'follow', 'conflict'] as const,
} as const;

/**
 * 资源配置
 */
export const RESOURCE_CONFIG = {
  /** 初始资源 */
  INITIAL: {
    coreEnergy: 1000,
    computeQuota: 500,
    biomass: 2000,
    information: 100,
    trust: 50,
  },
  /** 资源上限 */
  CAPACITIES: {
    coreEnergy: 10000,
    computeQuota: 5000,
    biomass: 20000,
    information: 1000,
    trust: 500,
  },
  /** 资源衰减率（每秒） */
  DECAY_RATES: {
    coreEnergy: 0.5,
    computeQuota: 0.1,
    biomass: 0.2,
    information: -0.05, // 信息增长
    trust: 0.01,
  },
} as const;

/**
 * 熵值配置
 */
export const ENTROPY_CONFIG = {
  /** 熵值上限 */
  MAX: 100,
  /** 熵值下限 */
  MIN: 0,
  /** 基础增长速率（每秒） */
  BASE_GROWTH_RATE: 0.001,
  /** 游戏结束阈值 */
  GAME_OVER_THRESHOLD: 100,
} as const;

/**
 * 情感网络配置
 */
export const EMOTION_CONFIG = {
  /** 希望值范围 */
  HOPE_RANGE: { min: 0, max: 100 },
  /** 不满值范围 */
  DISCONTENT_RANGE: { min: 0, max: 100 },
  /** 暴乱风险阈值 */
  REBELLION_THRESHOLD: 50,
  /** 情感传播衰减系数 */
  PROPAGATION_DECAY: 0.7,
} as const;

/**
 * 时间配置
 */
export const TIME_CONFIG = {
  /** 每年天数 */
  DAYS_PER_YEAR: 365,
  /** 每天小时数 */
  HOURS_PER_DAY: 24,
  /** 每小时分钟数 */
  MINUTES_PER_HOUR: 60,
  /** 游戏速度选项 */
  SPEED_OPTIONS: [0, 1, 2, 5, 10] as const,
} as const;

/**
 * 音频配置
 */
export const AUDIO_CONFIG = {
  /** 目标采样率（需求规格） */
  TARGET_SAMPLE_RATE: 192000,
  /** 浏览器支持的最高采样率 */
  MAX_BROWSER_RATE: 96000,
  /** 降级默认采样率 */
  FALLBACK_RATE: 48000,
  /** 默认音量 */
  DEFAULT_VOLUME: 0.5,
  /** BGM音量 */
  BGM_VOLUME: 0.3,
} as const;

/**
 * 渲染配置
 */
export const RENDER_CONFIG = {
  /** 粒子数量上限（各性能模式） */
  PARTICLE_LIMITS: {
    apex: 1000000,
    extreme: 500000,
    balanced: 100000,
    eco: 10000,
  },
  /** 帧率目标 */
  TARGET_FPS: {
    apex: 1000,
    extreme: 240,
    balanced: 120,
    eco: 30,
  },
} as const;

/**
 * 市民配置
 */
export const CITIZEN_CONFIG = {
  /** 初始市民数量 */
  INITIAL_COUNT: 100,
  /** 最大市民数量 */
  MAX_COUNT: 10000,
  /** LOD距离阈值 */
  LOD_DISTANCES: {
    dormant: 1000,
    background: 500,
    active: 100,
  },
} as const;

/**
 * DAO配置
 */
export const DAO_CONFIG = {
  /** 投票通过所需最低票数 */
  MIN_VOTES_FOR_PASS: 10,
  /** 法案冷却时间（毫秒） */
  LAW_COOLDOWN: 60000,
} as const;

/**
 * 存储配置
 */
export const STORAGE_CONFIG = {
  /** 存档key */
  SAVE_KEY: 'game_save',
  /** 自动保存间隔（毫秒） */
  AUTO_SAVE_INTERVAL: 60000,
  /** 叙事队列最大长度 */
  MAX_NARRATIVE_LENGTH: 100,
} as const;
