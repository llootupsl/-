/**
 * =============================================================================
 * 永夜熵纪 - 游戏核心状态管理
 * 基于 Zustand 的游戏状态管理 + 观测值系统集成
 * =============================================================================
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from '@/core/utils/Logger';
import { PerformanceMode } from '@/core/constants/PerformanceMode';
import { EpochType } from '@/core/types/world';
import { ResourceType } from '@/core/constants';
import { citizenManager, BaZiAttributes } from '@/citizen';
import { economicSystem } from '@/economy';
import { observationValueSystem, ObservationType } from '@/game/ObservationValueSystem';
import { divineInterventionSystem } from '@/game/DivineInterventionSystem';
import { roguelikeReincarnationSystem } from '@/game/RoguelikeReincarnationSystem';
import { storage } from '@/storage/StorageManager';
import { warmupManager } from '@/warmup';
import { performanceMonitor } from '@/monitor/PerformanceMonitor';
import { wasmBazi, isWasmReady } from '@/wasm/WasmBridge';
import type { EntityId } from '@/core/types';

/** V5修复：SaveData 类型定义 */
interface SaveData {
  phase?: 'loading' | 'select' | 'genesis' | 'running' | 'paused' | 'gameover';
  time?: Partial<{
    year: number;
    season: number;
    day: number;
    hour: number;
  }>;
  resources?: Partial<{
    food: number;
    energy: number;
    materials: number;
    knowledge: number;
    coreEnergy: number;
  }>;
  entropy?: number;
  emotion?: Partial<{
    mood: number;
    tension: number;
    hope: number;
  }>;
  achievements?: string[];
  activeLaws?: Array<{ id: string; name: string; description: string; voteYes: number; voteNo: number; enacted: boolean }>;
  warmupComplete?: boolean;
  externalAPI?: Partial<{
    enabled: boolean;
    provider: string;
    model: string;
  }>;
}

/* ==========================================================================
   性能模式映射
   ========================================================================== */

type AppPerformanceMode = 'apex' | 'extreme' | 'balanced' | 'eco';

function toSystemMode(appMode: AppPerformanceMode): PerformanceMode {
  const map: Record<AppPerformanceMode, PerformanceMode> = {
    apex: PerformanceMode.APEX,
    extreme: PerformanceMode.EXTREME,
    balanced: PerformanceMode.BALANCED,
    eco: PerformanceMode.ECO,
  };
  return map[appMode];
}

function fromSystemMode(sysMode: PerformanceMode): AppPerformanceMode {
  const map: Record<PerformanceMode, AppPerformanceMode> = {
    [PerformanceMode.APEX]: 'apex',
    [PerformanceMode.EXTREME]: 'extreme',
    [PerformanceMode.BALANCED]: 'balanced',
    [PerformanceMode.ECO]: 'eco',
  };
  return map[sysMode];
}

/* ==========================================================================
   熵增纪元资源
   ========================================================================== */

interface EntropyResources {
  coreEnergy: number;      // 核心能源
  computeQuota: number;    // 算力配额
  biomass: number;         // 纯净生物质
  information: number;    // 信息熵
  trust: number;           // 信任值
}

interface EntropyCapacities {
  coreEnergy: number;
  computeQuota: number;
  biomass: number;
  information: number;
  trust: number;
}

/* ==========================================================================
   熵增纪元情感网络
   ========================================================================== */

interface EmotionNetwork {
  hope: number;       // 希望值 0-100
  discontent: number;  // 不满值 0-100
  rebellionRisk: number; // 暴乱风险 0-100
}

/* ==========================================================================
   世界观时间
   ========================================================================== */

interface GameTime {
  year: number;
  day: number;       // 1-365
  hour: number;       // 0-23
  minute: number;    // 0-59
  tickCount: number;
  speed: number;      // 1=正常, 2=2倍, 0=暂停
  paused: boolean;
}

/* ==========================================================================
   视角与交互状态
   ========================================================================== */

type ViewMode = 'god' | 'citizen' | 'spectator';
type LODLevel = 'cloud' | 'grid' | 'voxel' | 'portrait';

interface CameraState {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  zoom: number;       // 0.1 - 10
  rotation: number;   // 弧度
  pitch: number;      // 弧度
}

interface InteractionState {
  hoveredCitizenId: string | null;
  selectedCitizenId: string | null;
  hoveredPosition: { x: number; y: number; z: number } | null;
  viewMode: ViewMode;
}

/* ==========================================================================
   UI 面板状态
   ========================================================================== */

interface UIPanels {
  settings: boolean;
  performance: boolean;
  citizenInfo: boolean;
  resource: boolean;
  narrative: boolean;
  divinePower: boolean;
  dao: boolean;
  benchmark: boolean;
  bazi: boolean;
  llm: boolean;
  chat: boolean;
}

/* ==========================================================================
   外部 API 配置
   ========================================================================== */

export interface LLMConfig {
  enabled: boolean;
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ExternalAPIConfig {
  genesisEnabled: boolean;      // 创世纪数据孪生
  macroEconEnabled: boolean;    // 宏观经济联动
  blockchainEnabled: boolean;     // 区块链快照
  llm: LLMConfig;
}

/* ==========================================================================
   主游戏状态
   ========================================================================== */

interface GameState {
  phase: 'loading' | 'select' | 'genesis' | 'running' | 'paused' | 'gameover';

  performanceMode: AppPerformanceMode;

  time: GameTime;

  resources: EntropyResources;
  resourceCapacities: EntropyCapacities;

  entropy: number;

  emotion: EmotionNetwork;

  citizenStats: {
    total: number;
    active: number;
    background: number;
    dormant: number;
    births: number;
    deaths: number;
  };

  camera: CameraState;

  interaction: InteractionState;

  panels: UIPanels;

  externalAPI: ExternalAPIConfig;

  observationPoints: number;
  observerLevel: number;
  achievements: string[];
  activeChallenges: string[];

  narrativeQueue: Array<{
    id: string;
    text: string;
    timestamp: number;
    type: 'system' | 'event' | 'achievement' | 'divine';
    rarity?: string;
  }>;

  fps: number;
  frameTime: number;
  particleCount: number;

  quantumCoherence: number;

  activeLaws: Array<{
    id: string;
    name: string;
    description: string;
    voteYes: number;
    voteNo: number;
    enacted: boolean;
  }>;

  warmupComplete: boolean;

  warnings: {
    resourceDepleted: string[];
    criticalEntropy: boolean;
    populationZero: boolean;
  };

  gameOverReason: string | null;
}

/* ==========================================================================
   游戏动作
   ========================================================================== */

interface GameActions {
  // 阶段控制
  setPhase: (phase: GameState['phase']) => void;

  // 性能模式
  setPerformanceMode: (mode: AppPerformanceMode) => void;

  // 时间控制
  tick: (deltaMs: number) => void;
  setSpeed: (speed: number) => void;
  togglePause: () => void;

  // 熵增纪元资源
  updateResources: (deltaMs: number) => void;
  consumeResource: (type: keyof EntropyResources, amount: number) => boolean;
  addResource: (type: keyof EntropyResources, amount: number) => void;

  // 熵值与情感
  updateEntropy: (delta: number) => void;
  updateEmotion: (deltaMs: number) => void;

  // 市民
  syncCitizenStats: () => void;
  selectCitizen: (id: string | null) => void;
  hoverCitizen: (id: string | null) => void;

  // 相机
  setCamera: (update: Partial<CameraState>) => void;
  zoomTo: (level: number) => void;
  panTo: (x: number, y: number, z: number) => void;

  // 视角
  setViewMode: (mode: ViewMode) => void;
  enterCitizenView: (citizenId: string) => void;
  exitCitizenView: () => void;

  // UI 面板
  togglePanel: (panel: keyof UIPanels) => void;
  closeAllPanels: () => void;

  // 观测系统
  observe: (type: ObservationType, description: string, meta?: Record<string, unknown>) => void;
  spendObservationPoints: (amount: number) => boolean;

  // 神力系统
  useDivinePower: (powerId: string, targetId?: string) => void;

  // 外部 API
  updateExternalAPI: (config: Partial<ExternalAPIConfig>) => void;
  updateLLMConfig: (config: Partial<LLMConfig>) => void;

  // 叙事
  addNarrative: (text: string, type: 'system' | 'event' | 'achievement' | 'divine', rarity?: string) => void;
  clearNarrative: () => void;

  // FPS 更新
  updateFPS: (fps: number, frameTime: number) => void;

  // 预热完成
  setWarmupComplete: (complete: boolean) => void;

  // DAO 投票
  proposeLaw: (name: string, description: string) => void;
  voteLaw: (lawId: string, approve: boolean) => void;

  // 创世纪
  startGenesis: () => Promise<void>;
  endGame: () => void;

  // 持久化
  saveGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;

  // 重置
  resetGame: () => void;

  checkWarnings: () => void;
  clearWarning: (type: 'resourceDepleted' | 'criticalEntropy' | 'populationZero') => void;
  canConsumeResource: (type: keyof EntropyResources, amount: number) => boolean;
}

/* ==========================================================================
   初始状态
   ========================================================================== */

const initialResources: EntropyResources = {
  coreEnergy: 1000,
  computeQuota: 500,
  biomass: 2000,
  information: 100,
  trust: 50,
};

const initialCapacities: EntropyCapacities = {
  coreEnergy: 10000,
  computeQuota: 5000,
  biomass: 20000,
  information: 1000,
  trust: 500,
};

const initialState: GameState = {
  phase: 'loading',
  performanceMode: 'balanced',
  time: { year: 1, day: 1, hour: 0, minute: 0, tickCount: 0, speed: 1, paused: false },
  resources: { ...initialResources },
  resourceCapacities: { ...initialCapacities },
  entropy: 30,
  emotion: { hope: 50, discontent: 20, rebellionRisk: 5 },
  citizenStats: { total: 0, active: 0, background: 0, dormant: 0, births: 0, deaths: 0 },
  camera: { x: 0, y: 100, z: 0, targetX: 0, targetY: 0, targetZ: 0, zoom: 1, rotation: 0, pitch: Math.PI / 4 },
  interaction: { hoveredCitizenId: null, selectedCitizenId: null, hoveredPosition: null, viewMode: 'god' },
  panels: {
    settings: false, performance: false, citizenInfo: false, resource: true,
    narrative: true, divinePower: false, dao: false, benchmark: false,
    bazi: false, llm: false, chat: false,
  },
  externalAPI: {
    genesisEnabled: true,
    macroEconEnabled: false,
    blockchainEnabled: false,
    llm: {
      enabled: false,
      provider: 'openai',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      maxTokens: 1024,
      temperature: 0.7,
    },
  },
  observationPoints: 0,
  observerLevel: 1,
  achievements: [],
  activeChallenges: [],
  narrativeQueue: [],
  fps: 0,
  frameTime: 0,
  particleCount: 0,
  quantumCoherence: 0.95,
  activeLaws: [],
  warmupComplete: false,
  warnings: {
    resourceDepleted: [],
    criticalEntropy: false,
    populationZero: false,
  },
  gameOverReason: null,
};

/* ==========================================================================
   创建 Store
   ========================================================================== */

export const useGameStore = create<GameState & GameActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // ---------- 阶段控制 ----------
      setPhase: (phase) => set((s) => { s.phase = phase; }),

      // ---------- 性能模式 ----------
      setPerformanceMode: (mode) => {
        set((s) => { s.performanceMode = mode; });
        warmupManager.setMode(toSystemMode(mode));
      },

      // ---------- 时间控制 ----------
      tick: (deltaMs) => {
        const state = get();
        if (state.time.paused) return;

        const scaledDelta = deltaMs * state.time.speed;
        const minuteDelta = scaledDelta / 60000;

        set((s) => {
          s.time.tickCount++;
          s.time.minute += minuteDelta;

          while (s.time.minute >= 60) {
            s.time.minute -= 60;
            s.time.hour++;
          }
          while (s.time.hour >= 24) {
            s.time.hour -= 24;
            s.time.day++;
          }
          while (s.time.day > 365) {
            s.time.day -= 365;
            s.time.year++;
          }
        });
      },

      setSpeed: (speed) => set((s) => { s.time.speed = Math.max(0, Math.min(10, speed)); }),
      togglePause: () => set((s) => { s.time.paused = !s.time.paused; }),

      // ---------- 熵增纪元资源 ----------
      updateResources: (deltaMs) => {
        const dt = deltaMs / 1000;
        const state = get();
        const rates = {
          coreEnergy: -0.5 * dt,
          computeQuota: -0.1 * dt,
          biomass: -0.2 * dt,
          information: 0.05 * dt,
          trust: -0.01 * dt,
        };

        set((s) => {
          const res = s.resources;
          const cap = s.resourceCapacities;
          (Object.keys(rates) as (keyof EntropyResources)[]).forEach((key) => {
            res[key] = Math.max(0, Math.min(cap[key], res[key] + rates[key]));
          });
        });

        get().checkWarnings();
      },

      consumeResource: (type, amount) => {
        const state = get();
        if (state.resources[type] < amount) return false;
        set((s) => { s.resources[type] -= amount; });
        return true;
      },

      addResource: (type, amount) => {
        set((s) => {
          s.resources[type] = Math.min(
            s.resourceCapacities[type],
            s.resources[type] + amount
          );
        });
      },

      // ---------- 熵值与情感 ----------
      updateEntropy: (delta) => {
        set((s) => {
          s.entropy = Math.max(0, Math.min(100, s.entropy + delta));
          if (s.entropy >= 100) s.phase = 'gameover';
        });
      },

      updateEmotion: (deltaMs) => {
        const dt = deltaMs / 1000;
        const state = get();

        // 情感受资源影响
        const energyRatio = state.resources.coreEnergy / state.resourceCapacities.coreEnergy;
        const biomassRatio = state.resources.biomass / state.resourceCapacities.biomass;
        const entropyPenalty = state.entropy / 100;

        const hopeDelta = (
          (energyRatio - 0.5) * 0.1 +
          (biomassRatio - 0.5) * 0.05 -
          entropyPenalty * 0.05
        ) * dt;

        const discontentDelta = (
          (1 - energyRatio) * 0.1 +
          (1 - biomassRatio) * 0.05 +
          entropyPenalty * 0.08
        ) * dt;

        set((s) => {
          s.emotion.hope = Math.max(0, Math.min(100, s.emotion.hope + hopeDelta));
          s.emotion.discontent = Math.max(0, Math.min(100, s.emotion.discontent + discontentDelta));
          s.emotion.rebellionRisk = Math.max(0, Math.min(100,
            s.emotion.discontent * 0.5 + s.entropy * 0.3 - s.emotion.hope * 0.2
          ));
        });
      },

      // ---------- 市民 ----------
      syncCitizenStats: () => {
        const stats = citizenManager.getStatistics();
        set((s) => {
          s.citizenStats.total = stats.total;
          s.citizenStats.active = stats.active;
          s.citizenStats.background = stats.background;
          s.citizenStats.dormant = stats.dormant;
        });
      },

      selectCitizen: (id) => set((s) => { s.interaction.selectedCitizenId = id; }),
      hoverCitizen: (id) => set((s) => { s.interaction.hoveredCitizenId = id; }),

      // ---------- 相机 ----------
      setCamera: (update) => set((s) => { Object.assign(s.camera, update); }),

      zoomTo: (level) => set((s) => {
        s.camera.zoom = Math.max(0.1, Math.min(10, level));
      }),

      panTo: (x, y, z) => set((s) => {
        s.camera.targetX = x;
        s.camera.targetY = y;
        s.camera.targetZ = z;
        s.camera.x = x;
        s.camera.y = y;
        s.camera.z = z;
      }),

      // ---------- 视角 ----------
      setViewMode: (mode) => set((s) => { s.interaction.viewMode = mode; }),

      enterCitizenView: (citizenId) => {
        const citizen = citizenManager.get(citizenId as EntityId);
        if (!citizen) return;
        const pos = citizen.position.world;
        set((s) => {
          s.interaction.viewMode = 'citizen';
          s.interaction.selectedCitizenId = citizenId;
          s.camera.x = pos.x;
          s.camera.y = pos.y + 2;
          s.camera.z = pos.z;
        });
      },

      exitCitizenView: () => set((s) => {
        s.interaction.viewMode = 'god';
        s.interaction.selectedCitizenId = null;
      }),

      // ---------- UI 面板 ----------
      togglePanel: (panel) => set((s) => { s.panels[panel] = !s.panels[panel]; }),
      closeAllPanels: () => set((s) => {
        (Object.keys(s.panels) as (keyof UIPanels)[]).forEach((k) => { s.panels[k] = false; });
      }),

      // ---------- 观测系统 ----------
      observe: (type, description, meta) => {
        const obs = observationValueSystem.observe(type, description, meta);
        set((s) => {
          s.observationPoints = observationValueSystem.getTotalPoints();
          s.observerLevel = observationValueSystem.getObserverLevel().level;
        });
        get().addNarrative(description, 'event', obs.rarity);
      },

      spendObservationPoints: (amount) => {
        const state = get();
        if (state.observationPoints < amount) return false;
        set((s) => { s.observationPoints -= amount; });
        return true;
      },

      // ---------- 神力系统 ----------
      useDivinePower: async (powerId, targetId) => {
        await divineInterventionSystem.intervene(powerId, [0, 0, 0], targetId ? [targetId] : []);
        get().observe(ObservationType.DIVINE_INTERVENTION, `使用了神力: ${powerId}`);
      },

      // ---------- 外部 API ----------
      updateExternalAPI: (config) => set((s) => { Object.assign(s.externalAPI, config); }),
      updateLLMConfig: (config) => set((s) => { Object.assign(s.externalAPI.llm, config); }),

      // ---------- 叙事 ----------
      addNarrative: (text, type, rarity) => set((s) => {
        s.narrativeQueue.push({
          id: crypto.randomUUID(),
          text,
          timestamp: Date.now(),
          type,
          rarity,
        });
        // 保留最近100条
        if (s.narrativeQueue.length > 100) {
          s.narrativeQueue = s.narrativeQueue.slice(-100);
        }
      }),

      clearNarrative: () => set((s) => { s.narrativeQueue = []; }),

      // ---------- FPS ----------
      updateFPS: (fps, frameTime) => set((s) => {
        s.fps = fps;
        s.frameTime = frameTime;
      }),

      // ---------- 预热 ----------
      setWarmupComplete: (complete) => set((s) => { s.warmupComplete = complete; }),

      // ---------- DAO ----------
      proposeLaw: (name, description) => {
        const law = {
          id: crypto.randomUUID(),
          name,
          description,
          voteYes: 0,
          voteNo: 0,
          enacted: false,
        };
        set((s) => { s.activeLaws.push(law); });
        get().addNarrative(`新法案提案: ${name}`, 'system');
      },

      voteLaw: (lawId, approve) => {
        set((s) => {
          const law = s.activeLaws.find((l) => l.id === lawId);
          if (!law || law.enacted) return;
          if (approve) law.voteYes++;
          else law.voteNo++;

          // 简单多数票
          const total = law.voteYes + law.voteNo;
          if (total >= 10 && law.voteYes > law.voteNo) {
            law.enacted = true;
          }
        });
      },

      // ---------- 创世纪 ----------
      startGenesis: async () => {
        const state = get();

        set((s) => { s.phase = 'genesis'; });

        // 创建初始市民
        const names = ['永', '夜', '熵', '纪', '宇', '宙', '文', '明', '智', '慧',
          '混沌', '秩序', '永恒', '起源', '终结', '光', '暗', '星', '辰', '命运'];
        const count = Math.min(100, state.citizenStats.total || 100);

        for (let i = 0; i < count; i++) {
          const name = names[i % names.length] + (i > 20 ? i : '');
          
          // 计算八字命理（如果WASM可用）
          let baZi: BaZiAttributes | undefined;
          if (isWasmReady()) {
            try {
              // 创世纪时间：公元2024年1月1日，随机时辰
              const birthYear = 2024;
              const birthMonth = 1;
              const birthDay = 1 + Math.floor(Math.random() * 365);
              const birthHour = Math.floor(Math.random() * 24);
              
              const baziResult = wasmBazi.calculate(birthYear, birthMonth, birthDay, birthHour);
              if (baziResult) {
                baZi = baziResult;
                logger.info(
                  'GameStore',
                  `[Genesis] ${name} 八字: ${baziResult.year.stem}${baziResult.year.branch} ${baziResult.month.stem}${baziResult.month.branch} ${baziResult.day.stem}${baziResult.day.branch} ${baziResult.hour.stem}${baziResult.hour.branch}`
                );
              }
            } catch (e) {
              logger.warn(
                'GameStore',
                `八字计算失败 for ${name}`,
                e instanceof Error ? e : new Error(String(e))
              );
            }
          }
          
          await citizenManager.create(name, undefined, {
            x: Math.random() * 100,
            y: Math.random() * 100,
          }, baZi);
        }

        get().syncCitizenStats();
        get().observe(ObservationType.CITIZEN_BORN, `创世纪开始，${count}位市民诞生`, { scale: count });

        // 记录叙事
        get().addNarrative('「起初，没有光。宇宙是一片永恒的黑暗。」', 'system');
        get().addNarrative(`创世纪元 ${state.time.year}年 开始了。${count} 个意识在黑暗中苏醒。`, 'event');

        set((s) => { s.phase = 'running'; });
      },

      endGame: () => {
        const state = get();
        
        let reason = '熵增纪元终结';
        if (state.entropy >= 100) {
          reason = '宇宙熵值达到100%，热寂降临';
        } else if (state.citizenStats.total === 0) {
          reason = '文明灭绝，所有市民已消亡';
        } else if (state.resources.coreEnergy <= 0) {
          reason = '核心能源耗尽，文明陷入黑暗';
        }

        const result = roguelikeReincarnationSystem.reincarnate();

        get().addNarrative(`「文明毁灭。熵增纪元终结。」`, 'system');
        get().addNarrative(`轮回类型: ${result.type}。获得 ${result.pointsEarned} 阿卡夏碎片。`, 'event');

        set((s) => {
          s.phase = 'gameover';
          s.gameOverReason = reason;
        });
      },

      // ---------- 持久化 ----------
      saveGame: async () => {
        const state = get();
        const saveData = {
          version: '1.0.0',
          timestamp: Date.now(),
          phase: state.phase,
          time: state.time,
          resources: state.resources,
          entropy: state.entropy,
          emotion: state.emotion,
          externalAPI: {
            ...state.externalAPI,
            llm: { ...state.externalAPI.llm, apiKey: '' }, // 不保存 API Key
          },
          achievements: state.achievements,
          activeLaws: state.activeLaws,
          warmupComplete: state.warmupComplete,
        };

        await storage.set('game_save', saveData);
        await citizenManager.saveAll();
        await observationValueSystem.save();
        await roguelikeReincarnationSystem.save();

        get().addNarrative('世界状态已保存。', 'system');
      },

      loadGame: async () => {
        const saveData = await storage.get('game_save') as SaveData | undefined;
        if (!saveData) return false;

        // 恢复基础状态
        set((s) => {
          if (saveData.phase) s.phase = saveData.phase;
          if (saveData.time) Object.assign(s.time, saveData.time);
          if (saveData.resources) Object.assign(s.resources, saveData.resources);
          if (saveData.entropy !== undefined) s.entropy = saveData.entropy;
          if (saveData.emotion) Object.assign(s.emotion, saveData.emotion);
          if (saveData.achievements) s.achievements = saveData.achievements;
          if (saveData.activeLaws) s.activeLaws = saveData.activeLaws;
          if (saveData.warmupComplete !== undefined) s.warmupComplete = saveData.warmupComplete;
          if (saveData.externalAPI) {
            Object.assign(s.externalAPI, saveData.externalAPI);
          }
        });

        // 重新加载市民
        await citizenManager.init('world-1' as EntityId);
        get().syncCitizenStats();

        // 加载观测系统
        await observationValueSystem.load();
        const ovs = observationValueSystem;
        set((s) => {
          s.observationPoints = ovs.getTotalPoints();
          s.observerLevel = ovs.getObserverLevel().level;
        });

        get().addNarrative('存档已恢复。文明从永恒中苏醒。', 'system');
        return true;
      },

      // ---------- 重置 ----------
      resetGame: () => {
        citizenManager.reset();
        observationValueSystem.reset();
        roguelikeReincarnationSystem.reset();
        set(initialState);
      },

      checkWarnings: () => {
        const state = get();
        const depletedResources: string[] = [];
        
        (Object.keys(state.resources) as (keyof EntropyResources)[]).forEach((key) => {
          if (state.resources[key] <= 0) {
            depletedResources.push(key);
          }
        });

        const criticalEntropy = state.entropy >= 90;
        const populationZero = state.citizenStats.total === 0 && state.phase === 'running';

        set((s) => {
          s.warnings.resourceDepleted = depletedResources;
          s.warnings.criticalEntropy = criticalEntropy;
          s.warnings.populationZero = populationZero;
        });

        if (depletedResources.length > 0 && state.phase === 'running') {
          get().addNarrative(`警告：资源耗尽 - ${depletedResources.join(', ')}`, 'event');
        }
        if (criticalEntropy && state.phase === 'running') {
          get().addNarrative('警告：熵值已达临界点，文明即将终结！', 'event');
        }
      },

      clearWarning: (type) => set((s) => {
        if (type === 'resourceDepleted') {
          s.warnings.resourceDepleted = [];
        } else if (type === 'criticalEntropy') {
          s.warnings.criticalEntropy = false;
        } else if (type === 'populationZero') {
          s.warnings.populationZero = false;
        }
      }),

      canConsumeResource: (type, amount) => {
        const state = get();
        return state.resources[type] >= amount;
      },
    }))
  )
);

/* ==========================================================================
   便捷选择器
   ========================================================================== */

export const useGamePhase = () => useGameStore((s) => s.phase);
export const useResources = () => useGameStore((s) => s.resources);
export const useEntropy = () => useGameStore((s) => s.entropy);
export const useEmotion = () => useGameStore((s) => s.emotion);
export const useCitizenStats = () => useGameStore((s) => s.citizenStats);
export const useCamera = () => useGameStore((s) => s.camera);
export const useInteraction = () => useGameStore((s) => s.interaction);
export const usePanels = () => useGameStore((s) => s.panels);
export const useTime = () => useGameStore((s) => s.time);
export const useObservation = () => useGameStore((s) => ({
  points: s.observationPoints,
  level: s.observerLevel,
}));
export const usePerformanceMode = () => useGameStore((s) => s.performanceMode);
export const useNarrative = () => useGameStore((s) => s.narrativeQueue);
export const useExternalAPI = () => useGameStore((s) => s.externalAPI);
export const useLaws = () => useGameStore((s) => s.activeLaws);
export const useWarnings = () => useGameStore((s) => s.warnings);
export const useGameOverReason = () => useGameStore((s) => s.gameOverReason);
