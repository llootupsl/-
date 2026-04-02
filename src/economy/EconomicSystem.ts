/**
 * 经济系统
 * 实现资源管理、市场交易和经济模型
 */

import { EntityId, createEntityId } from '@/core/types';
import { ResourceType, RESOURCE_LABELS } from '@/core/constants';
import type {
  Resource,
  MarketOrder,
  MarketState,
  Transaction,
  SupplyChain,
  EconomicPolicy,
  EconomicStatistics,
} from '@/core/types/economy';
import { OrderType } from '@/core/types/economy';

/**
 * 经济系统配置
 */
export interface EconomicConfig {
  initialResources: Record<ResourceType, number>;
  resourceCapacity: Record<ResourceType, number>;
  growthRates: Record<ResourceType, number>;
  consumptionRates: Record<ResourceType, number>;
  priceRanges: Record<ResourceType, { min: number; max: number }>;
}

/**
 * 经济系统
 */
export class EconomicSystem {
  private config: EconomicConfig;
  private resources: Map<ResourceType, Resource> = new Map();
  private markets: Map<ResourceType, MarketState> = new Map();
  private transactions: Transaction[] = [];
  private policies: EconomicPolicy[] = [];
  private worldId: EntityId;

  constructor(worldId: EntityId, config?: Partial<EconomicConfig>) {
    this.worldId = worldId;

    this.config = {
      initialResources: config?.initialResources || {
        [ResourceType.CORE_ENERGY]: 1000,
        [ResourceType.COMPUTE_QUOTA]: 500,
        [ResourceType.BIOMASS]: 2000,
        [ResourceType.INFORMATION]: 100,
        [ResourceType.TRUST]: 50,
      },
      resourceCapacity: config?.resourceCapacity || {
        [ResourceType.CORE_ENERGY]: 10000,
        [ResourceType.COMPUTE_QUOTA]: 5000,
        [ResourceType.BIOMASS]: 20000,
        [ResourceType.INFORMATION]: 1000,
        [ResourceType.TRUST]: 500,
      },
      growthRates: config?.growthRates || {
        [ResourceType.CORE_ENERGY]: 0.01,
        [ResourceType.COMPUTE_QUOTA]: 0.005,
        [ResourceType.BIOMASS]: 0.02,
        [ResourceType.INFORMATION]: 0.03,
        [ResourceType.TRUST]: 0.001,
      },
      consumptionRates: config?.consumptionRates || {
        [ResourceType.CORE_ENERGY]: 0.02,
        [ResourceType.COMPUTE_QUOTA]: 0.01,
        [ResourceType.BIOMASS]: 0.015,
        [ResourceType.INFORMATION]: 0.005,
        [ResourceType.TRUST]: 0.001,
      },
      priceRanges: config?.priceRanges || {
        [ResourceType.CORE_ENERGY]: { min: 0.5, max: 2 },
        [ResourceType.COMPUTE_QUOTA]: { min: 1, max: 5 },
        [ResourceType.BIOMASS]: { min: 0.2, max: 1 },
        [ResourceType.INFORMATION]: { min: 2, max: 10 },
        [ResourceType.TRUST]: { min: 5, max: 20 },
      },
    };

    this.initializeResources();
    this.initializeMarkets();
  }

  /**
   * 初始化资源
   */
  private initializeResources(): void {
    for (const type of Object.values(ResourceType)) {
      const resource: Resource = {
        id: createEntityId(),
        type,
        name: RESOURCE_LABELS[type],
        amount: this.config.initialResources[type],
        capacity: this.config.resourceCapacity[type],
        growthRate: this.config.growthRates[type],
        consumptionRate: this.config.consumptionRates[type],
      };
      this.resources.set(type, resource);
    }
  }

  /**
   * 初始化市场
   */
  private initializeMarkets(): void {
    for (const type of Object.values(ResourceType)) {
      const market: MarketState = {
        id: createEntityId(),
        resourceType: type,
        currentPrice: 1,
        priceHistory: [],
        buyOrders: [],
        sellOrders: [],
        volume: 0,
        volatility: 0.1,
      };
      this.markets.set(type, market);
    }
  }

  /**
   * 更新经济系统
   */
  public update(deltaTime: number): void {
    const dt = deltaTime / 1000; // 转换为秒

    // 更新资源增长和消耗
    for (const [type, resource] of this.resources) {
      const netChange = (resource.growthRate - resource.consumptionRate) * dt;
      resource.amount = Math.max(0, Math.min(
        resource.capacity,
        resource.amount * (1 + netChange)
      ));
    }

    // 更新市场价格
    this.updateMarketPrices(dt);
  }

  /**
   * 更新市场价格
   */
  private updateMarketPrices(dt: number): void {
    for (const [type, market] of this.markets) {
      // 计算供需比
      const buyVolume = market.buyOrders
        .filter(o => !o.fulfilled)
        .reduce((sum, o) => sum + o.quantity, 0);
      const sellVolume = market.sellOrders
        .filter(o => !o.fulfilled)
        .reduce((sum, o) => sum + o.quantity, 0);

      const supplyDemandRatio = buyVolume / (sellVolume || 1);

      // 价格调整
      const priceRange = this.config.priceRanges[type];
      const priceChange = (supplyDemandRatio - 1) * market.volatility * dt;
      market.currentPrice = Math.max(
        priceRange.min,
        Math.min(priceRange.max, market.currentPrice * (1 + priceChange))
      );

      // 记录价格历史
      market.priceHistory.push({
        timestamp: Date.now(),
        price: market.currentPrice,
        volume: buyVolume + sellVolume,
      });

      // 限制历史长度
      if (market.priceHistory.length > 1000) {
        market.priceHistory = market.priceHistory.slice(-1000);
      }
    }
  }

  /**
   * 创建订单
   */
  public createOrder(
    type: OrderType,
    resourceType: ResourceType,
    quantity: number,
    price: number,
    issuerId: EntityId
  ): MarketOrder {
    const order: MarketOrder = {
      id: createEntityId(),
      type,
      resourceType,
      quantity,
      price,
      issuerId,
      timestamp: Date.now(),
      fulfilled: false,
    };

    const market = this.markets.get(resourceType);
    if (!market) throw new Error('Market not found');

    if (type === OrderType.BUY) {
      market.buyOrders.push(order);
    } else {
      market.sellOrders.push(order);
    }

    return order;
  }

  /**
   * 执行交易
   */
  public executeTrade(order: MarketOrder, counterparty: EntityId): Transaction | null {
    const market = this.markets.get(order.resourceType);
    if (!market) return null;

    const buyer = order.type === OrderType.BUY ? order.issuerId : counterparty;
    const seller = order.type === OrderType.BUY ? counterparty : order.issuerId;

    const transaction: Transaction = {
      id: createEntityId(),
      buyerId: buyer,
      sellerId: seller,
      resourceType: order.resourceType,
      quantity: order.quantity,
      price: order.price,
      total: order.quantity * order.price,
      timestamp: Date.now(),
    };

    this.transactions.push(transaction);
    order.fulfilled = true;

    // 更新市场交易量
    market.volume += transaction.total;

    // 标记订单为已完成
    market.buyOrders = market.buyOrders.filter(o => o.id !== order.id);
    market.sellOrders = market.sellOrders.filter(o => o.id !== order.id);

    return transaction;
  }

  /**
   * 获取资源
   */
  public getResource(type: ResourceType): Resource | undefined {
    return this.resources.get(type);
  }

  /**
   * 获取所有资源
   */
  public getAllResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  /**
   * 获取市场状态
   */
  public getMarket(type: ResourceType): MarketState | undefined {
    return this.markets.get(type);
  }

  /**
   * 获取交易历史
   */
  public getTransactions(limit: number = 100): Transaction[] {
    return this.transactions.slice(-limit);
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): EconomicStatistics {
    const totalValue = this.transactions.reduce((sum, t) => sum + t.total, 0);
    const recentTransactions = this.transactions.filter(
      t => Date.now() - t.timestamp < 24 * 60 * 60 * 1000
    );

    return {
      gdp: totalValue,
      gdpGrowthRate: recentTransactions.length > 0 ? 0.02 : 0,
      inflationRate: 0.01,
      unemploymentRate: 0.05,
      inequality: 0.3,
      giniCoefficient: 0.4,
      totalVolume: totalValue,
      averageWage: 50,
    };
  }

  /**
   * 应用政策
   */
  public applyPolicy(policy: EconomicPolicy): void {
    // 更新相关资源的增长率
    if (policy.type === 'tax') {
      for (const resource of this.resources.values()) {
        resource.consumptionRate *= (1 + policy.taxRate);
      }
    } else if (policy.type === 'subsidy') {
      for (const resource of this.resources.values()) {
        resource.growthRate *= (1 + policy.subsidyRate);
      }
    }

    this.policies.push(policy);
  }

  /**
   * 获取 GDP
   */
  public getGDP(): number {
    return this.getAllResources().reduce((sum, r) => {
      const market = this.markets.get(r.type);
      return sum + r.amount * (market?.currentPrice || 1);
    }, 0);
  }
}

/**
 * 导出默认实例
 */
export const economicSystem = new EconomicSystem(createEntityId());
export default economicSystem;
