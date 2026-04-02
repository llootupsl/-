/**
 * 市民管理器
 * 管理世界上所有市民的创建、更新、查询和销毁
 */

import { EntityId, createEntityId } from '@/core/types';
import { Citizen, BaZiAttributes } from './Citizen';
import { storage } from '@/storage';
import { logger } from '@/core/utils/Logger';
import type {
  CitizenSnapshot,
  CitizenFilter,
  CitizenQueryOptions,
  CitizenQueryResult,
  StoredCitizenSnapshot,
  ExtendedGenome,
} from '@/core/types/citizen';
import { CitizenSortBy } from '@/core/types/citizen';
import { CitizenStateType } from '@/core/constants';
import { genomeManager, GenomeManager, Genome } from './GenomeSystem';
import { daoSystem } from '@/governance/DAOSystem';
import { EventEmitter } from '@/core/EventEmitter';
import { dayNightCycle } from '@/world/DayNightCycle';
import { weatherEffects } from '@/world/WeatherEffects';

/**
 * 市民管理器 - 支持事件发射
 */
export class CitizenManager extends EventEmitter {
  private static instance: CitizenManager | null = null;

  /** 市民映射 */
  private citizens: Map<EntityId, Citizen> = new Map();

  /** 市民数量 */
  private count: number = 0;

  /** 最大市民数量 */
  private maxCitizens: number = 10000;

  /** 世界 ID */
  private worldId: EntityId;

  /** 是否已初始化 */
  private initialized: boolean = false;

  /**
   * 获取单例实例
   */
  public static getInstance(): CitizenManager {
    if (!CitizenManager.instance) {
      CitizenManager.instance = new CitizenManager();
    }
    return CitizenManager.instance;
  }

  /**
   * 构造函数
   */
  private constructor() {
    super();
  }

  /**
   * 初始化管理器
   */
  public async init(worldId: EntityId, maxCitizens: number = 10000): Promise<void> {
    this.worldId = worldId;
    this.maxCitizens = maxCitizens;
    await storage.init();

    // 从数据库加载市民
    await this.loadFromStorage();

    this.initialized = true;
    console.log(`[CitizenManager] Initialized with ${this.count} citizens`);
  }

  /**
   * 从存储加载市民
   */
  private async loadFromStorage(): Promise<void> {
    const snapshots = storage.getCitizens();

    for (const snapshot of snapshots) {
      try {
        const extSnapshot = snapshot as StoredCitizenSnapshot;
        const parsed: CitizenSnapshot = {
          id: snapshot.id as EntityId,
          name: snapshot.name,
          genome: JSON.parse(extSnapshot.genome || '{}'),
          phenotype: JSON.parse(extSnapshot.phenotype || '{}'),
          state: JSON.parse(extSnapshot.state || '{}'),
          position: JSON.parse(snapshot.position || '{}'),
          memories: JSON.parse(extSnapshot.memories || '[]'),
          relations: JSON.parse(extSnapshot.relations || '[]'),
          statistics: JSON.parse(extSnapshot.statistics || '{}'),
          createdAt: extSnapshot.created_at || Date.now(),
          updatedAt: snapshot.updated_at,
        };

        const citizen = Citizen.fromSnapshot(parsed, this.worldId);
        this.citizens.set(citizen.id, citizen);
        this.count++;
      } catch (error) {
        console.warn('[CitizenManager] Failed to load citizen:', snapshot.id, error);
      }
    }
  }

  /**
   * 创建新市民
   */
  public async create(
    name: string,
    genome?: unknown,
    position?: { x: number; y: number },
    baZi?: BaZiAttributes
  ): Promise<Citizen | null> {
    if (this.count >= this.maxCitizens) {
      console.warn('[CitizenManager] Maximum citizens reached');
      return null;
    }

    // 使用基因组管理器创建基因组（集成）
    const citizenGenome = genomeManager.createRandomGenome();

    const citizen = new Citizen(this.worldId, name, citizenGenome as unknown as import('@/core/types/citizen').Genome, position, baZi);

    this.citizens.set(citizen.id, citizen);
    this.count++;

    // 注册市民到DAO系统（集成）
    daoSystem.registerCitizen(citizen.id, 1);

    // 异步保存到存储
    this.saveCitizen(citizen);

    // 触发市民出生事件（用于经济系统绑定）
    this.emit('citizenBorn', {
      id: citizen.id,
      name: citizen.name,
      needs: {}, // 市民初始需求
      state: citizen.state,
    });

    return citizen;
  }

  /**
   * 批量创建市民
   */
  public async createBatch(
    names: string[],
    genomes?: unknown[],
    positions?: { x: number; y: number }[]
  ): Promise<Citizen[]> {
    const created: Citizen[] = [];

    for (let i = 0; i < names.length; i++) {
      const citizen = await this.create(
        names[i],
        genomes?.[i],
        positions?.[i]
      );

      if (citizen) {
        created.push(citizen);
      }
    }

    return created;
  }

  /**
   * 获取市民
   */
  public get(id: EntityId): Citizen | undefined {
    return this.citizens.get(id);
  }

  /**
   * 通过ID获取市民（别名）
   */
  public getById(id: EntityId): Citizen | undefined {
    return this.citizens.get(id);
  }

  /**
   * 获取所有市民
   */
  public getAll(): Citizen[] {
    return Array.from(this.citizens.values());
  }

  /**
   * 获取市民数量
   */
  public getCount(): number {
    return this.count;
  }

  /**
   * 查询市民
   */
  public query(options?: CitizenQueryOptions): CitizenQueryResult {
    let citizens = this.getAll();

    // 筛选
    if (options?.filter) {
      citizens = this.applyFilter(citizens, options.filter);
    }

    // 排序
    if (options?.sortBy) {
      citizens = this.applySort(citizens, options.sortBy, options.ascending ?? false);
    }

    const total = citizens.length;

    // 分页
    if (options?.offset) {
      citizens = citizens.slice(options.offset);
    }

    if (options?.limit) {
      citizens = citizens.slice(0, options.limit);
    }

    return {
      citizens: citizens.map(c => c.toSnapshot()),
      total,
      offset: options?.offset ?? 0,
      limit: options?.limit ?? total,
    };
  }

  /**
   * 应用筛选
   */
  private applyFilter(citizens: Citizen[], filter: CitizenFilter): Citizen[] {
    return citizens.filter(c => {
      if (filter.stateType && c.state.type !== filter.stateType) {
        return false;
      }

      if (filter.energyRange) {
        if (
          c.state.energy < filter.energyRange.min ||
          c.state.energy > filter.energyRange.max
        ) {
          return false;
        }
      }

      if (filter.healthRange) {
        if (
          c.state.health < filter.healthRange.min ||
          c.state.health > filter.healthRange.max
        ) {
          return false;
        }
      }

      if (filter.moodRange) {
        if (
          c.state.mood < filter.moodRange.min ||
          c.state.mood > filter.moodRange.max
        ) {
          return false;
        }
      }

      if (filter.positionRange) {
        if (
          c.position.grid.x < filter.positionRange.min.x ||
          c.position.grid.x > filter.positionRange.max.x ||
          c.position.grid.y < filter.positionRange.min.y ||
          c.position.grid.y > filter.positionRange.max.y
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 应用排序
   */
  private applySort(
    citizens: Citizen[],
    sortBy: CitizenSortBy,
    ascending: boolean
  ): Citizen[] {
    const sorted = [...citizens];

    sorted.sort((a, b) => {
      let valueA: number;
      let valueB: number;

      switch (sortBy) {
        case CitizenSortBy.ENERGY:
          valueA = a.state.energy;
          valueB = b.state.energy;
          break;
        case CitizenSortBy.HEALTH:
          valueA = a.state.health;
          valueB = b.state.health;
          break;
        case CitizenSortBy.MOOD:
          valueA = a.state.mood;
          valueB = b.state.mood;
          break;
        case CitizenSortBy.AGE:
          valueA = a.createdAt;
          valueB = b.createdAt;
          break;
        case CitizenSortBy.INTELLIGENCE:
          valueA = a.phenotype.abilities.intelligence;
          valueB = b.phenotype.abilities.intelligence;
          break;
        case CitizenSortBy.SOCIAL:
          valueA = a.phenotype.adaptability.social;
          valueB = b.phenotype.adaptability.social;
          break;
        default:
          return 0;
      }

      return ascending ? valueA - valueB : valueB - valueA;
    });

    return sorted;
  }

  /**
   * 获取激活态市民
   */
  public getActiveCitizens(): Citizen[] {
    return this.getAll().filter(c => c.state.type === 'active');
  }

  /**
   * 获取背景态市民
   */
  public getBackgroundCitizens(): Citizen[] {
    return this.getAll().filter(c => c.state.type === 'background');
  }

  /**
   * 获取休眠态市民
   */
  public getDormantCitizens(): Citizen[] {
    return this.getAll().filter(c => c.state.type === 'dormant');
  }

  /**
   * 获取可见市民（用于渲染）
   */
  public getVisibleCitizens(): Citizen[] {
    return this.getAll().filter(c => c.visible);
  }

  /**
   * 获取特定位置的市民
   */
  public getCitizensAt(gridX: number, gridY: number, radius: number = 1): Citizen[] {
    return this.getAll().filter(c => {
      const dx = c.position.grid.x - gridX;
      const dy = c.position.grid.y - gridY;
      return dx * dx + dy * dy <= radius * radius;
    });
  }

  /**
   * 更新所有市民
   */
  public updateAll(deltaTime: number): void {
    const dayNightModifier = dayNightCycle.getCitizenActivityModifier();
    const weatherImpact = weatherEffects.getCitizenImpact();

    for (const citizen of this.citizens.values()) {
      genomeManager.applyEnvironment(citizen.id, citizen.genome as unknown as Genome, {
        stress: citizen.state.energy / 100 < 0.2 ? 1 : 0,
        nutrition: citizen.state.hunger / 100,
        socialInteraction: citizen.relations.length > 0 ? 0.5 : 0,
        learning: citizen.state.mood > 70 ? 0.5 : 0,
        trauma: citizen.state.health < 30 ? 0.5 : 0,
      });
      
      this.applyEnvironmentEffects(citizen, dayNightModifier, weatherImpact, deltaTime);
      
      citizen.update(deltaTime);
      
      if (citizen.state.type !== 'dormant') {
        citizen.snnProcess(deltaTime);
      }
    }

    this.removeDead();

    if (Math.random() < 0.01) {
      this.saveAll();
    }
  }

  /**
   * 应用环境效果到市民
   */
  private applyEnvironmentEffects(
    citizen: Citizen,
    dayNight: ReturnType<typeof dayNightCycle.getCitizenActivityModifier>,
    weather: ReturnType<typeof weatherEffects.getCitizenImpact>,
    deltaTime: number
  ): void {
    const dt = deltaTime / 1000;

    const workEfficiency = dayNight.workEfficiency * weather.workEfficiency;
    const moveSpeed = dayNight.moveSpeed * weather.moveSpeed;
    const moodModifier = dayNight.socialDesire * 0.5 + weather.moodModifier;
    const dangerLevel = dayNight.dangerLevel + weather.healthRisk;

    citizen.state.mood = Math.max(0, Math.min(100, 
      citizen.state.mood + moodModifier * dt * 10
    ));

    if (dangerLevel > 0.3 && Math.random() < dangerLevel * 0.01) {
      citizen.state.health = Math.max(0, citizen.state.health - dangerLevel * dt * 5);
    }

    if (dayNight.restNeed > 0.7 && citizen.state.energy < 30) {
      citizen.state.type = CitizenStateType.DORMANT;
    }

    if (weather.visibility < 0.5) {
      citizen.visible = Math.random() > (1 - weather.visibility) * 0.5;
    }
  }

  /**
   * 移除死亡的市民
   */
  private removeDead(): void {
    const dead: EntityId[] = [];

    for (const citizen of this.citizens.values()) {
      if (citizen.isDead()) {
        dead.push(citizen.id);
      }
    }

    for (const id of dead) {
      this.remove(id);
    }

    if (dead.length > 0) {
      logger.info('CitizenManager', `Removed ${dead.length} dead citizens`);
    }
  }

  /**
   * 移除市民
   */
  public remove(id: EntityId): void {
    if (this.citizens.has(id)) {
      const citizen = this.citizens.get(id);
      this.citizens.delete(id);
      this.count--;

      // 从存储删除
      storage.execute('DELETE FROM citizens WHERE id = ?', [id]);

      // 触发市民死亡事件（用于经济系统绑定）
      if (citizen) {
        this.emit('citizenDied', id);
      }
    }
  }

  /**
   * 保存市民到存储
   */
  private saveCitizen(citizen: Citizen): void {
    const snapshot = citizen.toSnapshot();

    storage.upsert('citizens', {
      id: snapshot.id,
      name: snapshot.name,
      genome: JSON.stringify(snapshot.genome),
      phenotype: JSON.stringify(snapshot.phenotype),
      state: JSON.stringify(snapshot.state),
      position: JSON.stringify(snapshot.position),
      memories: JSON.stringify(snapshot.memories),
      relations: JSON.stringify(snapshot.relations),
      statistics: JSON.stringify(snapshot.statistics),
      created_at: snapshot.createdAt,
      updated_at: snapshot.updatedAt,
    }, 'id');
  }

  /**
   * 保存所有市民
   */
  public async saveAll(): Promise<void> {
    storage.transaction(() => {
      for (const citizen of this.citizens.values()) {
        this.saveCitizen(citizen);
      }
    });
    await storage.save();
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): {
    total: number;
    active: number;
    background: number;
    dormant: number;
    avgEnergy: number;
    avgHealth: number;
    avgMood: number;
  } {
    const all = this.getAll();

    const active = all.filter(c => c.state.type === 'active').length;
    const background = all.filter(c => c.state.type === 'background').length;
    const dormant = all.filter(c => c.state.type === 'dormant').length;

    const avgEnergy = all.reduce((sum, c) => sum + c.state.energy, 0) / all.length;
    const avgHealth = all.reduce((sum, c) => sum + c.state.health, 0) / all.length;
    const avgMood = all.reduce((sum, c) => sum + c.state.mood, 0) / all.length;

    return {
      total: all.length,
      active,
      background,
      dormant,
      avgEnergy: isNaN(avgEnergy) ? 0 : avgEnergy,
      avgHealth: isNaN(avgHealth) ? 0 : avgHealth,
      avgMood: isNaN(avgMood) ? 0 : avgMood,
    };
  }

  /**
   * 重置管理器
   */
  public async reset(): Promise<void> {
    this.citizens.clear();
    this.count = 0;
    await storage.clear();
  }

  /**
   * 销毁管理器
   */
  public dispose(): void {
    this.saveAll();
    this.citizens.clear();
    CitizenManager.instance = null;
  }
}

/**
 * 导出单例
 */
export const citizenManager = CitizenManager.getInstance();
export default citizenManager;
