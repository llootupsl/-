/**
 * 经济系统类型定义
 */

import type { EntityId, Timestamp, Probability } from './index';
import { ResourceType } from '@/core/constants';

/**
 * 资源定义
 */
export interface Resource {
  /** 资源 ID */
  id: EntityId;
  /** 资源类型 */
  type: ResourceType;
  /** 资源名称 */
  name: string;
  /** 资源数量 */
  amount: number;
  /** 最大容量 */
  capacity: number;
  /** 增长率 */
  growthRate: number;
  /** 消耗率 */
  consumptionRate: number;
}

/**
 * 市场订单
 */
export interface MarketOrder {
  /** 订单 ID */
  id: EntityId;
  /** 订单类型 */
  type: OrderType;
  /** 资源类型 */
  resourceType: ResourceType;
  /** 数量 */
  quantity: number;
  /** 单价 */
  price: number;
  /** 发起者 ID */
  issuerId: EntityId;
  /** 时间戳 */
  timestamp: Timestamp;
  /** 是否完成 */
  fulfilled: boolean;
}

/**
 * 订单类型
 */
export enum OrderType {
  BUY = 'buy',
  SELL = 'sell',
}

/**
 * 市场状态
 */
export interface MarketState {
  /** 市场 ID */
  id: EntityId;
  /** 资源类型 */
  resourceType: ResourceType;
  /** 当前价格 */
  currentPrice: number;
  /** 历史价格 */
  priceHistory: PricePoint[];
  /** 买盘订单 */
  buyOrders: MarketOrder[];
  /** 卖盘订单 */
  sellOrders: MarketOrder[];
  /** 交易量 */
  volume: number;
  /** 波动率 */
  volatility: number;
}

/**
 * 价格点
 */
export interface PricePoint {
  /** 时间戳 */
  timestamp: Timestamp;
  /** 价格 */
  price: number;
  /** 交易量 */
  volume: number;
}

/**
 * 交易记录
 */
export interface Transaction {
  /** 交易 ID */
  id: EntityId;
  /** 买方 ID */
  buyerId: EntityId;
  /** 卖方 ID */
  sellerId: EntityId;
  /** 资源类型 */
  resourceType: ResourceType;
  /** 数量 */
  quantity: number;
  /** 单价 */
  price: number;
  /** 总价 */
  total: number;
  /** 时间戳 */
  timestamp: Timestamp;
}

/**
 * 供应链节点
 */
export interface SupplyChainNode {
  /** 节点 ID */
  id: EntityId;
  /** 节点名称 */
  name: string;
  /** 节点类型 */
  type: SupplyChainNodeType;
  /** 位置坐标 */
  position: { x: number; y: number };
  /** 输入资源 */
  inputs: { resourceType: ResourceType; amount: number }[];
  /** 输出资源 */
  outputs: { resourceType: ResourceType; amount: number }[];
  /** 效率 */
  efficiency: number;
  /** 运行状态 */
  operational: boolean;
}

/**
 * 供应链节点类型
 */
export enum SupplyChainNodeType {
  EXTRACTION = 'extraction',     // 开采
  PRODUCTION = 'production',     // 生产
  PROCESSING = 'processing',     // 加工
  DISTRIBUTION = 'distribution', // 分销
  STORAGE = 'storage',           // 储存
  RECYCLING = 'recycling',       // 回收
}

/**
 * 供应链
 */
export interface SupplyChain {
  /** 供应链 ID */
  id: EntityId;
  /** 供应链名称 */
  name: string;
  /** 节点列表 */
  nodes: SupplyChainNode[];
  /** 起始节点 */
  startNodeId: EntityId;
  /** 终点节点 */
  endNodeId: EntityId;
  /** 总成本 */
  totalCost: number;
  /** 总效率 */
  totalEfficiency: number;
}

/**
 * 经济政策
 */
export interface EconomicPolicy {
  /** 政策 ID */
  id: EntityId;
  /** 政策名称 */
  name: string;
  /** 政策描述 */
  description: string;
  /** 政策类型 */
  type: EconomicPolicyType;
  /** 税率 */
  taxRate: number;
  /** 补贴率 */
  subsidyRate: number;
  /** 生效时间 */
  effectiveTime: Timestamp;
  /** 有效期 */
  duration?: number;
  /** 是否激活 */
  active: boolean;
}

/**
 * 经济政策类型
 */
export enum EconomicPolicyType {
  TAX = 'tax',
  SUBSIDY = 'subsidy',
  TRADE_BAN = 'trade_ban',
  PRICE_CONTROL = 'price_control',
  RESOURCE_RESTRICTION = 'resource_restriction',
  MARKET_INTERVENTION = 'market_intervention',
}

/**
 * 经济统计
 */
export interface EconomicStatistics {
  /** GDP */
  gdp: number;
  /** GDP 增长率 */
  gdpGrowthRate: number;
  /** 通货膨胀率 */
  inflationRate: number;
  /** 失业率 */
  unemploymentRate: number;
  /** 收入不平等度 */
  inequality: number;
  /** 基尼系数 */
  giniCoefficient: number;
  /** 总交易量 */
  totalVolume: number;
  /** 平均工资 */
  averageWage: number;
}

/**
 * 预算
 */
export interface Budget {
  /** 预算 ID */
  id: EntityId;
  /** 预算名称 */
  name: string;
  /** 总预算 */
  totalBudget: number;
  /** 已支出 */
  spent: number;
  /** 剩余 */
  remaining: number;
  /** 分配 */
  allocations: { category: string; amount: number }[];
}

/**
 * 税收记录
 */
export interface TaxRecord {
  /** 记录 ID */
  id: EntityId;
  /** 纳税人 ID */
  taxpayerId: EntityId;
  /** 税种 */
  taxType: TaxType;
  /** 税额 */
  amount: number;
  /** 时间戳 */
  timestamp: Timestamp;
  /** 是否缴纳 */
  paid: boolean;
}

/**
 * 税种
 */
export enum TaxType {
  INCOME = 'income',
  PROPERTY = 'property',
  CONSUMPTION = 'consumption',
  TRADE = 'trade',
  ENVIRONMENTAL = 'environmental',
}

/**
 * 财产
 */
export interface Property {
  /** 财产 ID */
  id: EntityId;
  /** 所有者 ID */
  ownerId: EntityId;
  /** 财产类型 */
  type: PropertyType;
  /** 财产名称 */
  name: string;
  /** 价值 */
  value: number;
  /** 位置 */
  location?: { x: number; y: number };
  /** 状态 */
  status: PropertyStatus;
}

/**
 * 财产类型
 */
export enum PropertyType {
  LAND = 'land',
  BUILDING = 'building',
  VEHICLE = 'vehicle',
  EQUIPMENT = 'equipment',
  INTELLECTUAL = 'intellectual',
}

/**
 * 财产状态
 */
export enum PropertyStatus {
  OWNED = 'owned',
  MORTGAGED = 'mortgaged',
  LIENED = 'liened',
  CONFISCATED = 'confiscated',
}

/**
 * 合同
 */
export interface Contract {
  /** 合同 ID */
  id: EntityId;
  /** 甲方 */
  partyA: EntityId;
  /** 乙方 */
  partyB: EntityId;
  /** 合同类型 */
  type: ContractType;
  /** 条款 */
  terms: ContractTerm[];
  /** 生效时间 */
  effectiveTime: Timestamp;
  /** 到期时间 */
  expirationTime?: Timestamp;
  /** 状态 */
  status: ContractStatus;
}

/**
 * 合同类型
 */
export enum ContractType {
  EMPLOYMENT = 'employment',
  LEASE = 'lease',
  SALE = 'sale',
  TRADE = 'trade',
  PARTNERSHIP = 'partnership',
}

/**
 * 合同条款
 */
export interface ContractTerm {
  /** 条款 ID */
  id: string;
  /** 条款描述 */
  description: string;
  /** 违约惩罚 */
  penalty: number;
  /** 是否已履行 */
  fulfilled: boolean;
}

/**
 * 合同状态
 */
export enum ContractStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  TERMINATED = 'terminated',
  BREACHED = 'breached',
}
