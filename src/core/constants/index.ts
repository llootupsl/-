/**
 * 核心常量定义
 */

// 游戏时间
export const GAME_TICK_INTERVAL = 1000 / 60; // 60 FPS
export const GAME_TICK_RATE = 60; // 每秒 tick 数

// 世界规模
export const WORLD_GRID_SIZE = 1024;
export const WORLD_MAX_CITIZENS = 10000;

// 市民系统
export const CITIZEN_MEMORY_CAPACITY = 1000;
export const CITIZEN_MAX_HEALTH = 100;
export const CITIZEN_INITIAL_ENERGY = 100;

// LOD 层级
export enum LODLevel {
  CLOUD = 'cloud',       // 远处 - 汉字代码雨
  GRID = 'grid',         // 中距离 - 简化网格
  VOXEL = 'voxel',       // 近景 - 体素小人
  PORTRAIT = 'portrait'  // 激活态 - SDF 头像
}

// LOD 距离阈值
export const LOD_DISTANCES = {
  [LODLevel.CLOUD]: 1000,
  [LODLevel.GRID]: 100,
  [LODLevel.VOXEL]: 10,
  [LODLevel.PORTRAIT]: 0,
};

// 市民三态
export enum CitizenStateType {
  DORMANT = 'dormant',     // 休眠态 - 元胞自动机
  BACKGROUND = 'background', // 背景态 - 64 神经元 SNN
  ACTIVE = 'active',       // 激活态 - 完整 SNN + LLM
}

// SNN 配置
export const SNN_CONFIG = {
  DORMANT_NEURONS: 16,
  BACKGROUND_NEURONS: 64,
  ACTIVE_NEURONS: 256,
  STDP_LEARNING_RATE: 0.01,
  STDP_TIME_CONSTANT: 20, // ms
};

// 量子核心配置
export const QUANTUM_CONFIG = {
  ACTIVE_QUBITS: 16,
  DECOHERENCE_TIME: 1000, // ms
  GATE_FIDELITY: 0.99,
};

// 经济系统
export enum ResourceType {
  CORE_ENERGY = 'core_energy',     // 核心能源（熵增纪元）
  COMPUTE_QUOTA = 'compute_quota',   // 算力配额
  BIOMASS = 'biomass',             // 纯净生物质
  INFORMATION = 'information',      // 信息熵
  TRUST = 'trust',                 // 信任值
}

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  [ResourceType.CORE_ENERGY]: '核心能源',
  [ResourceType.COMPUTE_QUOTA]: '算力配额',
  [ResourceType.BIOMASS]: '纯净生物质',
  [ResourceType.INFORMATION]: '信息熵',
  [ResourceType.TRUST]: '信任值',
};

// 熵增纪元参数
export const ENTROPY_EPOCH = {
  INITIAL_ENTROPY: 0.5,
  ENTROPY_INCREASE_RATE: 0.001,
  CATASTROPHE_THRESHOLD: 0.9,
  RECOVERY_RATE: 0.0001,
};

// UI 常量
export const UI = {
  FONT_FAMILY_DISPLAY: "'Noto Sans SC', sans-serif",
  FONT_FAMILY_MONO: "'JetBrains Mono', monospace",
  TRANSITION_DURATION: 300,
  ANIMATION_DURATION: 200,
};

// 赛博朋克主题色
export const CYBERPUNK_THEME = {
  PRIMARY: '#00f0ff',
  SECONDARY: '#ff00ff',
  ACCENT: '#39ff14',
  BACKGROUND: '#0a0a0f',
  SURFACE: '#1a1a2e',
  TEXT: '#e0e0e0',
  WARNING: '#ff6b6b',
  SUCCESS: '#39ff14',
  ERROR: '#ff3333',
  GRADIENT_PRIMARY: 'linear-gradient(135deg, #00f0ff, #ff00ff)',
  GRADIENT_SECONDARY: 'linear-gradient(135deg, #ff00ff, #39ff14)',
};

// 存储键名
export const STORAGE_KEYS = {
  PERFORMANCE_MODE: 'omnis_performance_mode',
  LAST_WORLD_ID: 'omnis_last_world_id',
  SETTINGS: 'omnis_settings',
  BENCHMARK_RESULTS: 'omnis_benchmark_results',
  ACHIEVEMENTS: 'omnis_achievements',
};

// API 常量
export const API = {
  DEFAULT_LLM_MODEL: 'Qwen2.5-7B-Instruct',
  LLM_FALLBACK_MODELS: ['Qwen2.5-3B-Instruct', 'Qwen2.5-1.5B-Instruct'],
  EMBEDDING_MODEL: 'sentence-transformers',
  MAX_CONTEXT_LENGTH: 8192,
  MAX_TOKENS: 2048,
};

// WebGPU 常量
export const WEBGPU = {
  MAX_TEXTURE_SIZE: 8192,
  MAX_BUFFER_SIZE: 256 * 1024 * 1024, // 256MB
  MAX_PARTICLES: 100000,
  MAX_INSTANCES: 10000,
};

// 游戏配置（新增）
export * from './GameConfig';
