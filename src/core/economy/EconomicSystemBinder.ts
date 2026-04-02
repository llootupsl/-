/**
 * =============================================================================
 * 经济系统双向绑定器
 * Economic System Two-Way Binder
 * =============================================================================
 * 
 * 解决问题：经济系统同步数据但单向流动，不响应游戏状态变化
 * 此模块建立游戏状态与经济系统之间的双向绑定
 */

import { EventEmitter } from 'eventemitter3';

/** 经济资源 */
interface EconomicResource {
  id: string;
  type: 'food' | 'materials' | 'energy' | 'technology' | 'culture' | 'military';
  amount: number;
  productionRate: number;
  consumptionRate: number;
  price: number;
}

/** 市民经济状态 */
interface CitizenEconomicState {
  id: string;
  wealth: number;
  income: number;
  expenses: number;
  profession: string;
  productivity: number;
  satisfaction: number;
}

/** 建筑经济状态 */
interface BuildingEconomicState {
  id: string;
  type: string;
  level: number;
  production: { resource: string; amount: number }[];
  consumption: { resource: string; amount: number }[];
  workers: number;
  efficiency: number;
}

/** 建筑生产/消费项 */
interface BuildingProductionItem {
  resource: string;
  amount: number;
}

/** 经济事件 */
interface EconomicEvent {
  type: 'production' | 'consumption' | 'trade' | 'crisis' | 'boom' | 'shortage';
  timestamp: number;
  details: Record<string, unknown>;
  effects: EconomicEffect[];
}

/** 经济效果 */
interface EconomicEffect {
  target: string;
  targetType: 'citizen' | 'building' | 'resource' | 'market';
  attribute: string;
  change: number;
}

/** 双向绑定事件 */
export interface EconomicBinderEvents {
  /** 游戏状态变化影响经济 */
  gameStateToEconomy: (change: GameStateChange) => void;
  /** 经济变化影响游戏状态 */
  economyToGameState: (effect: EconomicEffect) => void;
  /** 经济事件 */
  economicEvent: (event: EconomicEvent) => void;
  /** 市场波动 */
  marketFluctuation: (resource: string, oldPrice: number, newPrice: number) => void;
  /** 短缺警告 */
  shortage: (resource: string, demand: number, supply: number) => void;
}

/** 游戏状态变化 */
interface GameStateChange {
  source: 'population' | 'building' | 'technology' | 'event' | 'policy';
  type: string;
  data: Record<string, unknown>;
  economicImpact: number;
}

/** 绑定配置 */
interface BinderConfig {
  /** 价格波动因子 */
  priceVolatility: number;
  /** 短缺阈值 */
  shortageThreshold: number;
  /** 危机触发阈值 */
  crisisThreshold: number;
  /** 繁荣触发阈值 */
  boomThreshold: number;
  /** 同步间隔 */
  syncInterval: number;
}

const DEFAULT_CONFIG: BinderConfig = {
  priceVolatility: 0.1,
  shortageThreshold: 0.2,
  crisisThreshold: 0.1,
  boomThreshold: 2.0,
  syncInterval: 1000,
};

/**
 * 经济系统双向绑定器
 * 
 * 建立游戏状态与经济系统之间的双向数据流
 */
export class EconomicSystemBinder extends EventEmitter<EconomicBinderEvents> {
  private config: BinderConfig;
  
  // 资源市场
  private resources: Map<string, EconomicResource> = new Map();
  
  // 市民经济状态
  private citizens: Map<string, CitizenEconomicState> = new Map();
  
  // 建筑经济状态
  private buildings: Map<string, BuildingEconomicState> = new Map();
  
  // 市场历史
  private priceHistory: Map<string, number[]> = new Map();
  
  // 事件队列
  private events: EconomicEvent[] = [];
  
  private lastSync: number = 0;

  constructor(config: Partial<BinderConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 初始化资源市场
   */
  public initResources(resources: EconomicResource[]): void {
    for (const resource of resources) {
      this.resources.set(resource.id, { ...resource });
      this.priceHistory.set(resource.id, [resource.price]);
    }
  }

  /**
   * 注册市民
   */
  public registerCitizen(citizen: CitizenEconomicState): void {
    this.citizens.set(citizen.id, { ...citizen });
  }

  /**
   * 注册建筑
   */
  public registerBuilding(building: BuildingEconomicState): void {
    this.buildings.set(building.id, { ...building });
  }

  /**
   * 主更新循环 - 双向绑定
   */
  public update(deltaTime: number): void {
    const now = Date.now();
    
    if (now - this.lastSync < this.config.syncInterval) return;
    this.lastSync = now;

    // 1. 生产阶段 - 建筑 -> 资源
    this.processProduction(deltaTime);

    // 2. 消费阶段 - 市民 -> 资源
    this.processConsumption(deltaTime);

    // 3. 市场定价 - 供需 -> 价格
    this.updateMarketPrices();

    // 4. 反馈阶段 - 价格 -> 行为
    this.applyPriceFeedback();

    // 5. 事件检测
    this.detectEconomicEvents();
  }

  /**
   * 处理生产 - 游戏状态到经济
   */
  private processProduction(deltaTime: number): void {
    for (const [buildingId, building] of this.buildings) {
      // 计算生产效率
      const efficiency = building.efficiency * (1 + building.workers * 0.01);
      
      for (const prod of building.production) {
        const resource = this.resources.get(prod.resource);
        if (!resource) continue;

        const amount = prod.amount * efficiency * deltaTime / 1000;
        resource.amount += amount;
        resource.productionRate = amount * 1000 / deltaTime;

        // 发送效果到游戏状态
        this.emit('economyToGameState', {
          target: buildingId,
          targetType: 'building',
          attribute: 'productionOutput',
          change: amount,
        });
      }

      // 消费输入资源
      for (const cons of building.consumption) {
        const resource = this.resources.get(cons.resource);
        if (!resource) continue;

        const amount = Math.min(
          cons.amount * efficiency * deltaTime / 1000,
          resource.amount
        );
        resource.amount -= amount;
        resource.consumptionRate = amount * 1000 / deltaTime;
      }
    }
  }

  /**
   * 处理消费 - 游戏状态到经济
   */
  private processConsumption(deltaTime: number): void {
    const foodResource = this.resources.get('food');
    const energyResource = this.resources.get('energy');

    for (const [citizenId, citizen] of this.citizens) {
      // 计算消费
      const foodConsumption = 0.1 * deltaTime / 1000;
      const energyConsumption = 0.05 * deltaTime / 1000;

      // 检查是否满足需求
      if (foodResource && foodResource.amount > foodConsumption) {
        foodResource.amount -= foodConsumption;
        citizen.satisfaction = Math.min(1, citizen.satisfaction + 0.01);
      } else {
        // 短缺导致不满
        citizen.satisfaction = Math.max(0, citizen.satisfaction - 0.05);
        this.emit('shortage', 'food', foodConsumption, foodResource?.amount || 0);
      }

      if (energyResource && energyResource.amount > energyConsumption) {
        energyResource.amount -= energyConsumption;
      }

      // 计算收入
      citizen.income = citizen.productivity * citizen.profession.length * 0.5;
      citizen.wealth += (citizen.income - citizen.expenses) * deltaTime / 1000;
    }
  }

  /**
   * 更新市场价格 - 经济状态
   */
  private updateMarketPrices(): void {
    for (const [resourceId, resource] of this.resources) {
      const oldPrice = resource.price;
      
      // 供需决定价格
      const supply = resource.amount;
      const demand = resource.consumptionRate;
      
      if (demand > 0) {
        const supplyDemandRatio = supply / demand;
        
        // 价格调整
        let priceChange = 0;
        
        if (supplyDemandRatio < this.config.shortageThreshold) {
          // 短缺 - 价格上涨
          priceChange = this.config.priceVolatility * 2;
        } else if (supplyDemandRatio > 1 / this.config.shortageThreshold) {
          // 过剩 - 价格下跌
          priceChange = -this.config.priceVolatility;
        } else {
          // 正常波动
          priceChange = (Math.random() - 0.5) * this.config.priceVolatility;
        }

        resource.price = Math.max(0.1, resource.price * (1 + priceChange));

        // 记录历史
        const history = this.priceHistory.get(resourceId) || [];
        history.push(resource.price);
        if (history.length > 100) history.shift();
        this.priceHistory.set(resourceId, history);

        // 发送价格变化事件
        if (Math.abs(resource.price - oldPrice) > 0.01) {
          this.emit('marketFluctuation', resourceId, oldPrice, resource.price);
        }
      }
    }
  }

  /**
   * 应用价格反馈 - 经济到游戏状态
   */
  private applyPriceFeedback(): void {
    for (const [resourceId, resource] of this.resources) {
      // 高价格刺激生产
      if (resource.price > 1.5) {
        // 找到生产该资源的建筑并提高效率
        for (const [buildingId, building] of this.buildings) {
          if (building.production.some(p => p.resource === resourceId)) {
            // 市场信号刺激效率提升
            building.efficiency = Math.min(1.5, building.efficiency + 0.01);
            
            this.emit('economyToGameState', {
              target: buildingId,
              targetType: 'building',
              attribute: 'efficiency',
              change: 0.01,
            });
          }
        }
      }

      // 低价格抑制生产
      if (resource.price < 0.5) {
        for (const [buildingId, building] of this.buildings) {
          if (building.production.some(p => p.resource === resourceId)) {
            building.efficiency = Math.max(0.5, building.efficiency - 0.01);
            
            this.emit('economyToGameState', {
              target: buildingId,
              targetType: 'building',
              attribute: 'efficiency',
              change: -0.01,
            });
          }
        }
      }
    }

    // 市民根据财富调整行为
    for (const [citizenId, citizen] of this.citizens) {
      if (citizen.wealth < 10) {
        // 贫困市民降低消费，提高工作意愿
        citizen.productivity = Math.min(1.5, citizen.productivity + 0.01);
        citizen.satisfaction = Math.max(0.2, citizen.satisfaction - 0.02);
        
        this.emit('economyToGameState', {
          target: citizenId,
          targetType: 'citizen',
          attribute: 'productivity',
          change: 0.01,
        });
      } else if (citizen.wealth > 100) {
        // 富裕市民可能更活跃
        citizen.satisfaction = Math.min(1, citizen.satisfaction + 0.01);
      }
    }
  }

  /**
   * 检测经济事件
   */
  private detectEconomicEvents(): void {
    for (const [resourceId, resource] of this.resources) {
      const history = this.priceHistory.get(resourceId) || [];
      
      if (history.length < 10) continue;

      const recentPrices = history.slice(-10);
      const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;

      // 检测危机
      if (resource.price < avgPrice * this.config.crisisThreshold) {
        this.events.push({
          type: 'crisis',
          timestamp: Date.now(),
          details: {
            resource: resourceId,
            currentPrice: resource.price,
            avgPrice,
            drop: (avgPrice - resource.price) / avgPrice,
          },
          effects: [{
            target: resourceId,
            targetType: 'resource',
            attribute: 'price',
            change: resource.price - avgPrice,
          }],
        });

        // 危机反馈到游戏状态
        this.emit('economicEvent', this.events[this.events.length - 1]);
      }

      // 检测繁荣
      if (resource.price > avgPrice * this.config.boomThreshold) {
        this.events.push({
          type: 'boom',
          timestamp: Date.now(),
          details: {
            resource: resourceId,
            currentPrice: resource.price,
            avgPrice,
            growth: (resource.price - avgPrice) / avgPrice,
          },
          effects: [{
            target: resourceId,
            targetType: 'resource',
            attribute: 'price',
            change: resource.price - avgPrice,
          }],
        });

        this.emit('economicEvent', this.events[this.events.length - 1]);
      }

      // 检测短缺
      if (resource.amount < resource.consumptionRate * 10) {
        this.events.push({
          type: 'shortage',
          timestamp: Date.now(),
          details: {
            resource: resourceId,
            currentSupply: resource.amount,
            consumptionRate: resource.consumptionRate,
            hoursRemaining: resource.amount / resource.consumptionRate,
          },
          effects: [{
            target: resourceId,
            targetType: 'resource',
            attribute: 'amount',
            change: -resource.amount,
          }],
        });

        this.emit('shortage', resourceId, resource.consumptionRate, resource.amount);
      }
    }
  }

  /**
   * 接收游戏状态变化 - 反向绑定
   */
  public handleGameStateChange(change: GameStateChange): void {
    this.emit('gameStateToEconomy', change);

    switch (change.source) {
      case 'population':
        this.handlePopulationChange(change);
        break;
      case 'building':
        this.handleBuildingChange(change);
        break;
      case 'technology':
        this.handleTechnologyChange(change);
        break;
      case 'event':
        this.handleGameEvent(change);
        break;
      case 'policy':
        this.handlePolicyChange(change);
        break;
    }
  }

  /**
   * 处理人口变化
   */
  private handlePopulationChange(change: GameStateChange): void {
    const { type, data } = change;

    if (type === 'citizenBorn') {
      // 新市民增加消费需求
      this.registerCitizen({
        id: data.id as string,
        wealth: 10,
        income: 0.5,
        expenses: 0.3,
        profession: 'unemployed',
        productivity: 0.5,
        satisfaction: 0.8,
      });
    } else if (type === 'citizenDied') {
      // 市民死亡减少需求
      const citizen = this.citizens.get(data.id as string);
      if (citizen) {
        // 遗产分配
        this.citizens.delete(data.id as string);
      }
    } else if (type === 'migration') {
      // 迁移影响人口结构
      const count = data.count as number;
      for (let i = 0; i < Math.abs(count); i++) {
        if (count > 0) {
          this.registerCitizen({
            id: `migrant_${Date.now()}_${i}`,
            wealth: 20,
            income: 0.8,
            expenses: 0.5,
            profession: 'worker',
            productivity: 0.7,
            satisfaction: 0.6,
          });
        } else {
          // 移出
          const citizens = Array.from(this.citizens.keys());
          if (citizens.length > 0) {
            const randomIndex = Math.floor(Math.random() * citizens.length);
            this.citizens.delete(citizens[randomIndex]);
          }
        }
      }
    }
  }

  /**
   * 处理建筑变化
   */
  private handleBuildingChange(change: GameStateChange): void {
    const { type, data } = change;

    if (type === 'buildingBuilt') {
      this.registerBuilding({
        id: data.id as string,
        type: data.buildingType as string,
        level: 1,
        production: (data.production as BuildingProductionItem[]) || [],
        consumption: (data.consumption as BuildingProductionItem[]) || [],
        workers: 0,
        efficiency: 1.0,
      });
    } else if (type === 'buildingUpgraded') {
      const building = this.buildings.get(data.id as string);
      if (building) {
        building.level = data.level as number;
        building.efficiency *= 1.1;
        
        for (const prod of building.production) {
          prod.amount *= 1.2;
        }
      }
    } else if (type === 'buildingDestroyed') {
      this.buildings.delete(data.id as string);
    }
  }

  /**
   * 处理科技变化
   */
  private handleTechnologyChange(change: GameStateChange): void {
    const { data } = change;

    // 科技解锁提升效率
    if (data.productionBonus) {
      for (const [_, building] of this.buildings) {
        building.efficiency *= 1 + (data.productionBonus as number);
      }
    }

    if (data.newResource) {
      // 解锁新资源类型
      this.resources.set(data.newResource as string, {
        id: data.newResource as string,
        type: (data.resourceType as EconomicResource['type']) || 'materials',
        amount: 100,
        productionRate: 0,
        consumptionRate: 0,
        price: 1.0,
      });
    }
  }

  /**
   * 处理游戏事件
   */
  private handleGameEvent(change: GameStateChange): void {
    const { type, data } = change;

    if (type === 'disaster') {
      // 灾害影响生产和消费
      const affectedResource = data.resource as string;
      const resource = this.resources.get(affectedResource);
      if (resource) {
        resource.amount *= 0.5; // 损失50%
        resource.price *= 1.5; // 价格上涨
      }
    } else if (type === 'festival') {
      // 节日增加消费
      for (const [_, citizen] of this.citizens) {
        citizen.expenses *= 2;
        citizen.satisfaction = Math.min(1, citizen.satisfaction + 0.2);
      }
    }
  }

  /**
   * 处理政策变化
   */
  private handlePolicyChange(change: GameStateChange): void {
    const { type, data } = change;

    if (type === 'tax') {
      // 税收影响市民财富
      const taxRate = data.rate as number;
      for (const [_, citizen] of this.citizens) {
        citizen.expenses += citizen.income * taxRate;
      }
    } else if (type === 'subsidy') {
      // 补贴影响生产
      const targetResource = data.resource as string;
      for (const [_, building] of this.buildings) {
        if (building.production.some(p => p.resource === targetResource)) {
          building.efficiency *= 1.2;
        }
      }
    }
  }

  /**
   * 获取资源状态
   */
  public getResource(id: string): EconomicResource | undefined {
    return this.resources.get(id);
  }

  /**
   * 获取所有资源
   */
  public getAllResources(): EconomicResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * 获取市民经济状态
   */
  public getCitizenState(id: string): CitizenEconomicState | undefined {
    return this.citizens.get(id);
  }

  /**
   * 获取建筑经济状态
   */
  public getBuildingState(id: string): BuildingEconomicState | undefined {
    return this.buildings.get(id);
  }

  /**
   * 获取价格历史
   */
  public getPriceHistory(resourceId: string): number[] {
    return this.priceHistory.get(resourceId) || [];
  }

  /**
   * 获取经济事件
   */
  public getRecentEvents(count: number = 10): EconomicEvent[] {
    return this.events.slice(-count);
  }

  /**
   * 获取经济统计
   */
  public getStats(): {
    totalResources: number;
    totalCitizens: number;
    totalBuildings: number;
    avgPrice: number;
    avgSatisfaction: number;
    eventsCount: number;
  } {
    let totalValue = 0;
    for (const resource of this.resources.values()) {
      totalValue += resource.amount * resource.price;
    }

    let totalSatisfaction = 0;
    for (const citizen of this.citizens.values()) {
      totalSatisfaction += citizen.satisfaction;
    }

    return {
      totalResources: this.resources.size,
      totalCitizens: this.citizens.size,
      totalBuildings: this.buildings.size,
      avgPrice: totalValue / this.resources.size || 0,
      avgSatisfaction: totalSatisfaction / this.citizens.size || 0,
      eventsCount: this.events.length,
    };
  }

  /**
   * 重置绑定器
   */
  public reset(): void {
    this.resources.clear();
    this.citizens.clear();
    this.buildings.clear();
    this.priceHistory.clear();
    this.events = [];
    this.lastSync = 0;
  }
}

// 单例
export const economicSystemBinder = new EconomicSystemBinder();

export default EconomicSystemBinder;
