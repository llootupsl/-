/**
 * 基础设施系统
 * 实现道路、桥梁、电力、水利等基础设施管理
 */

import { EntityId, createEntityId, Vec2, Timestamp, Duration } from '@/core/types';
import { ResourceType } from '@/core/constants';
import type { EconomicSystem } from './EconomicSystem';

/**
 * 基础设施类型
 */
export enum InfrastructureType {
  ROAD = 'road',
  BRIDGE = 'bridge',
  POWER_PLANT = 'power_plant',
  POWER_LINE = 'power_line',
  WATER_TREATMENT = 'water_treatment',
  IRRIGATION = 'irrigation',
  DAM = 'dam',
}

/**
 * 基础设施状态
 */
export enum InfrastructureStatus {
  PLANNING = 'planning',
  UNDER_CONSTRUCTION = 'under_construction',
  OPERATIONAL = 'operational',
  DAMAGED = 'damaged',
  UNDER_REPAIR = 'under_repair',
  DECOMMISSIONED = 'decommissioned',
}

/**
 * 基础设施质量等级
 */
export enum QualityLevel {
  POOR = 1,
  BASIC = 2,
  STANDARD = 3,
  ADVANCED = 4,
  PREMIUM = 5,
}

/**
 * 基础设施基础接口
 */
export interface InfrastructureBase {
  id: EntityId;
  type: InfrastructureType;
  name: string;
  status: InfrastructureStatus;
  quality: QualityLevel;
  position: Vec2;
  constructionProgress: number;
  health: number;
  age: number;
  createdAt: Timestamp;
  lastMaintenanceAt: Timestamp;
}

/**
 * 道路类型
 */
export enum RoadType {
  DIRT = 'dirt',
  GRAVEL = 'gravel',
  PAVED = 'paved',
  HIGHWAY = 'highway',
  MAGLEV = 'maglev',
}

/**
 * 道路节点
 */
export interface RoadNode {
  id: EntityId;
  position: Vec2;
  connections: EntityId[];
  trafficLoad: number;
  capacity: number;
}

/**
 * 道路段
 */
export interface RoadSegment extends InfrastructureBase {
  type: InfrastructureType.ROAD;
  roadType: RoadType;
  startNode: EntityId;
  endNode: EntityId;
  length: number;
  width: number;
  speedMultiplier: number;
  tradeEfficiencyBonus: number;
  maintenanceCost: number;
  trafficDensity: number;
  wearLevel: number;
}

/**
 * 桥梁类型
 */
export enum BridgeType {
  WOODEN = 'wooden',
  STONE = 'stone',
  STEEL = 'steel',
  SUSPENSION = 'suspension',
  MAGNETIC = 'magnetic',
}

/**
 * 桥梁
 */
export interface Bridge extends InfrastructureBase {
  type: InfrastructureType.BRIDGE;
  bridgeType: BridgeType;
  startRegion: EntityId;
  endRegion: EntityId;
  spanLength: number;
  loadCapacity: number;
  currentLoad: number;
  waterDepth: number;
  maintenanceCost: number;
  structuralIntegrity: number;
}

/**
 * 发电厂类型
 */
export enum PowerPlantType {
  COAL = 'coal',
  GAS = 'gas',
  NUCLEAR = 'nuclear',
  SOLAR = 'solar',
  WIND = 'wind',
  FUSION = 'fusion',
  QUANTUM = 'quantum',
}

/**
 * 发电厂
 */
export interface PowerPlant extends InfrastructureBase {
  type: InfrastructureType.POWER_PLANT;
  plantType: PowerPlantType;
  generationCapacity: number;
  currentOutput: number;
  efficiency: number;
  fuelType: ResourceType | null;
  fuelConsumption: number;
  emissionLevel: number;
  connectedGrids: EntityId[];
  maintenanceCost: number;
  operationalHours: number;
}

/**
 * 输电线
 */
export interface PowerLine extends InfrastructureBase {
  type: InfrastructureType.POWER_LINE;
  startPlant: EntityId;
  endRegion: EntityId;
  transmissionCapacity: number;
  currentLoad: number;
  transmissionLoss: number;
  voltageLevel: number;
  maintenanceCost: number;
}

/**
 * 水处理厂类型
 */
export enum WaterTreatmentType {
  BASIC = 'basic',
  STANDARD = 'standard',
  ADVANCED = 'advanced',
  QUANTUM_PURIFICATION = 'quantum_purification',
}

/**
 * 水处理厂
 */
export interface WaterTreatment extends InfrastructureBase {
  type: InfrastructureType.WATER_TREATMENT;
  treatmentType: WaterTreatmentType;
  processingCapacity: number;
  currentOutput: number;
  waterQuality: number;
  servedPopulation: number;
  pollutionReduction: number;
  maintenanceCost: number;
}

/**
 * 灌溉系统
 */
export interface Irrigation extends InfrastructureBase {
  type: InfrastructureType.IRRIGATION;
  coverageArea: number;
  waterSource: EntityId;
  efficiency: number;
  cropYieldBonus: number;
  waterConsumption: number;
  maintenanceCost: number;
  servedFarms: EntityId[];
}

/**
 * 大坝
 */
export interface Dam extends InfrastructureBase {
  type: InfrastructureType.DAM;
  reservoirCapacity: number;
  currentWaterLevel: number;
  powerGenerationCapacity: number;
  floodControlCapacity: number;
  downstreamRegions: EntityId[];
  maintenanceCost: number;
  structuralIntegrity: number;
}

/**
 * 基础设施联合类型
 */
export type Infrastructure =
  | RoadSegment
  | Bridge
  | PowerPlant
  | PowerLine
  | WaterTreatment
  | Irrigation
  | Dam;

/**
 * 建设成本配置
 */
export interface ConstructionCost {
  baseCost: number;
  resourceCosts: Partial<Record<ResourceType, number>>;
  constructionTime: Duration;
  laborRequired: number;
}

/**
 * 维护成本配置
 */
export interface MaintenanceCost {
  dailyCost: number;
  resourceCosts: Partial<Record<ResourceType, number>>;
  repairMultiplier: number;
}

/**
 * 故障记录
 */
export interface FailureRecord {
  id: EntityId;
  infrastructureId: EntityId;
  failureType: FailureType;
  severity: number;
  timestamp: Timestamp;
  resolved: boolean;
  resolvedAt?: Timestamp;
  repairCost: number;
}

/**
 * 故障类型
 */
export enum FailureType {
  STRUCTURAL = 'structural',
  MECHANICAL = 'mechanical',
  ELECTRICAL = 'electrical',
  CAPACITY = 'capacity',
  WEAR = 'wear',
  NATURAL_DISASTER = 'natural_disaster',
  SABOTAGE = 'sabotage',
}

/**
 * 基础设施网络
 */
export interface InfrastructureNetwork {
  roadNetwork: Map<EntityId, RoadNode>;
  powerGrid: Map<EntityId, EntityId[]>;
  waterNetwork: Map<EntityId, EntityId[]>;
}

/**
 * 基础设施统计
 */
export interface InfrastructureStatistics {
  totalInfrastructure: number;
  operationalCount: number;
  damagedCount: number;
  underConstructionCount: number;
  totalMaintenanceCost: number;
  averageHealth: number;
  roadNetworkCoverage: number;
  powerGridCoverage: number;
  waterSupplyCoverage: number;
  totalPowerGeneration: number;
  totalWaterProcessing: number;
}

/**
 * 基础设施系统配置
 */
export interface InfrastructureConfig {
  baseConstructionSpeed: number;
  maintenanceInterval: Duration;
  failureBaseProbability: number;
  repairSpeedMultiplier: number;
  qualityDecayRate: number;
}

/**
 * 基础设施系统
 */
export class InfrastructureSystem {
  private config: InfrastructureConfig;
  private infrastructures: Map<EntityId, Infrastructure> = new Map();
  private roadNodes: Map<EntityId, RoadNode> = new Map();
  private powerGridConnections: Map<EntityId, EntityId[]> = new Map();
  private waterNetworkConnections: Map<EntityId, EntityId[]> = new Map();
  private failures: FailureRecord[] = [];
  private economicSystem: EconomicSystem | null = null;
  private worldId: EntityId;

  private readonly constructionCosts: Record<InfrastructureType, ConstructionCost>;
  private readonly maintenanceCosts: Record<InfrastructureType, MaintenanceCost>;

  constructor(worldId: EntityId, config?: Partial<InfrastructureConfig>) {
    this.worldId = worldId;

    this.config = {
      baseConstructionSpeed: config?.baseConstructionSpeed || 0.01,
      maintenanceInterval: config?.maintenanceInterval || 86400000,
      failureBaseProbability: config?.failureBaseProbability || 0.001,
      repairSpeedMultiplier: config?.repairSpeedMultiplier || 0.02,
      qualityDecayRate: config?.qualityDecayRate || 0.0001,
    };

    this.constructionCosts = this.initializeConstructionCosts();
    this.maintenanceCosts = this.initializeMaintenanceCosts();
  }

  /**
   * 初始化建设成本
   */
  private initializeConstructionCosts(): Record<InfrastructureType, ConstructionCost> {
    return {
      [InfrastructureType.ROAD]: {
        baseCost: 1000,
        resourceCosts: { [ResourceType.BIOMASS]: 50, [ResourceType.CORE_ENERGY]: 20 },
        constructionTime: 86400000,
        laborRequired: 10,
      },
      [InfrastructureType.BRIDGE]: {
        baseCost: 5000,
        resourceCosts: { [ResourceType.BIOMASS]: 200, [ResourceType.CORE_ENERGY]: 100 },
        constructionTime: 259200000,
        laborRequired: 50,
      },
      [InfrastructureType.POWER_PLANT]: {
        baseCost: 10000,
        resourceCosts: { [ResourceType.CORE_ENERGY]: 500, [ResourceType.INFORMATION]: 100 },
        constructionTime: 604800000,
        laborRequired: 100,
      },
      [InfrastructureType.POWER_LINE]: {
        baseCost: 500,
        resourceCosts: { [ResourceType.CORE_ENERGY]: 50 },
        constructionTime: 43200000,
        laborRequired: 5,
      },
      [InfrastructureType.WATER_TREATMENT]: {
        baseCost: 8000,
        resourceCosts: { [ResourceType.BIOMASS]: 100, [ResourceType.INFORMATION]: 50 },
        constructionTime: 432000000,
        laborRequired: 80,
      },
      [InfrastructureType.IRRIGATION]: {
        baseCost: 2000,
        resourceCosts: { [ResourceType.BIOMASS]: 100 },
        constructionTime: 172800000,
        laborRequired: 20,
      },
      [InfrastructureType.DAM]: {
        baseCost: 20000,
        resourceCosts: { [ResourceType.BIOMASS]: 500, [ResourceType.CORE_ENERGY]: 200 },
        constructionTime: 2592000000,
        laborRequired: 200,
      },
    };
  }

  /**
   * 初始化维护成本
   */
  private initializeMaintenanceCosts(): Record<InfrastructureType, MaintenanceCost> {
    return {
      [InfrastructureType.ROAD]: {
        dailyCost: 10,
        resourceCosts: { [ResourceType.BIOMASS]: 5 },
        repairMultiplier: 2,
      },
      [InfrastructureType.BRIDGE]: {
        dailyCost: 50,
        resourceCosts: { [ResourceType.BIOMASS]: 20 },
        repairMultiplier: 3,
      },
      [InfrastructureType.POWER_PLANT]: {
        dailyCost: 100,
        resourceCosts: { [ResourceType.CORE_ENERGY]: 50 },
        repairMultiplier: 5,
      },
      [InfrastructureType.POWER_LINE]: {
        dailyCost: 5,
        resourceCosts: { [ResourceType.CORE_ENERGY]: 2 },
        repairMultiplier: 1.5,
      },
      [InfrastructureType.WATER_TREATMENT]: {
        dailyCost: 80,
        resourceCosts: { [ResourceType.BIOMASS]: 30 },
        repairMultiplier: 4,
      },
      [InfrastructureType.IRRIGATION]: {
        dailyCost: 20,
        resourceCosts: { [ResourceType.BIOMASS]: 10 },
        repairMultiplier: 2,
      },
      [InfrastructureType.DAM]: {
        dailyCost: 200,
        resourceCosts: { [ResourceType.BIOMASS]: 100, [ResourceType.CORE_ENERGY]: 50 },
        repairMultiplier: 10,
      },
    };
  }

  /**
   * 绑定经济系统
   */
  public bindEconomicSystem(economicSystem: EconomicSystem): void {
    this.economicSystem = economicSystem;
  }

  /**
   * 创建道路段
   */
  public createRoadSegment(
    name: string,
    roadType: RoadType,
    startPosition: Vec2,
    endPosition: Vec2,
    quality: QualityLevel = QualityLevel.STANDARD
  ): RoadSegment {
    const startNode = this.getOrCreateRoadNode(startPosition);
    const endNode = this.getOrCreateRoadNode(endPosition);

    const length = this.calculateDistance(startPosition, endPosition);
    const speedMultiplier = this.getRoadSpeedMultiplier(roadType, quality);
    const tradeEfficiencyBonus = this.getRoadTradeBonus(roadType, quality);

    const road: RoadSegment = {
      id: createEntityId(),
      type: InfrastructureType.ROAD,
      name,
      roadType,
      startNode: startNode.id,
      endNode: endNode.id,
      length,
      width: this.getRoadWidth(roadType),
      speedMultiplier,
      tradeEfficiencyBonus,
      maintenanceCost: this.calculateRoadMaintenance(roadType, length),
      status: InfrastructureStatus.PLANNING,
      quality,
      position: {
        x: (startPosition.x + endPosition.x) / 2,
        y: (startPosition.y + endPosition.y) / 2,
      },
      constructionProgress: 0,
      health: 100,
      age: 0,
      trafficDensity: 0,
      wearLevel: 0,
      createdAt: Date.now(),
      lastMaintenanceAt: Date.now(),
    };

    startNode.connections.push(endNode.id);
    endNode.connections.push(startNode.id);

    this.infrastructures.set(road.id, road);
    return road;
  }

  /**
   * 获取或创建道路节点
   */
  private getOrCreateRoadNode(position: Vec2): RoadNode {
    for (const node of this.roadNodes.values()) {
      if (this.calculateDistance(node.position, position) < 10) {
        return node;
      }
    }

    const node: RoadNode = {
      id: createEntityId(),
      position,
      connections: [],
      trafficLoad: 0,
      capacity: 100,
    };

    this.roadNodes.set(node.id, node);
    return node;
  }

  /**
   * 创建桥梁
   */
  public createBridge(
    name: string,
    bridgeType: BridgeType,
    startRegion: EntityId,
    endRegion: EntityId,
    startPosition: Vec2,
    endPosition: Vec2,
    waterDepth: number,
    quality: QualityLevel = QualityLevel.STANDARD
  ): Bridge {
    const spanLength = this.calculateDistance(startPosition, endPosition);

    const bridge: Bridge = {
      id: createEntityId(),
      type: InfrastructureType.BRIDGE,
      name,
      bridgeType,
      startRegion,
      endRegion,
      spanLength,
      loadCapacity: this.getBridgeLoadCapacity(bridgeType, quality),
      currentLoad: 0,
      waterDepth,
      maintenanceCost: this.calculateBridgeMaintenance(bridgeType, spanLength),
      position: {
        x: (startPosition.x + endPosition.x) / 2,
        y: (startPosition.y + endPosition.y) / 2,
      },
      status: InfrastructureStatus.PLANNING,
      quality,
      constructionProgress: 0,
      health: 100,
      age: 0,
      structuralIntegrity: 100,
      createdAt: Date.now(),
      lastMaintenanceAt: Date.now(),
    };

    this.infrastructures.set(bridge.id, bridge);
    return bridge;
  }

  /**
   * 创建发电厂
   */
  public createPowerPlant(
    name: string,
    plantType: PowerPlantType,
    position: Vec2,
    quality: QualityLevel = QualityLevel.STANDARD
  ): PowerPlant {
    const plant: PowerPlant = {
      id: createEntityId(),
      type: InfrastructureType.POWER_PLANT,
      name,
      plantType,
      generationCapacity: this.getPowerPlantCapacity(plantType, quality),
      currentOutput: 0,
      efficiency: this.getPowerPlantEfficiency(plantType, quality),
      fuelType: this.getPowerPlantFuelType(plantType),
      fuelConsumption: this.getPowerPlantFuelConsumption(plantType),
      emissionLevel: this.getPowerPlantEmission(plantType),
      connectedGrids: [],
      maintenanceCost: this.calculatePowerPlantMaintenance(plantType),
      position,
      status: InfrastructureStatus.PLANNING,
      quality,
      constructionProgress: 0,
      health: 100,
      age: 0,
      operationalHours: 0,
      createdAt: Date.now(),
      lastMaintenanceAt: Date.now(),
    };

    this.infrastructures.set(plant.id, plant);
    this.powerGridConnections.set(plant.id, []);
    return plant;
  }

  /**
   * 创建输电线
   */
  public createPowerLine(
    name: string,
    startPlant: EntityId,
    endRegion: EntityId,
    startPosition: Vec2,
    endPosition: Vec2,
    quality: QualityLevel = QualityLevel.STANDARD
  ): PowerLine | null {
    const plant = this.infrastructures.get(startPlant) as PowerPlant;
    if (!plant || plant.type !== InfrastructureType.POWER_PLANT) {
      return null;
    }

    const length = this.calculateDistance(startPosition, endPosition);

    const powerLine: PowerLine = {
      id: createEntityId(),
      type: InfrastructureType.POWER_LINE,
      name,
      startPlant,
      endRegion,
      transmissionCapacity: this.getTransmissionCapacity(quality),
      currentLoad: 0,
      transmissionLoss: this.calculateTransmissionLoss(length, quality),
      voltageLevel: this.getVoltageLevel(quality),
      maintenanceCost: this.calculatePowerLineMaintenance(length),
      position: {
        x: (startPosition.x + endPosition.x) / 2,
        y: (startPosition.y + endPosition.y) / 2,
      },
      status: InfrastructureStatus.PLANNING,
      quality,
      constructionProgress: 0,
      health: 100,
      age: 0,
      createdAt: Date.now(),
      lastMaintenanceAt: Date.now(),
    };

    plant.connectedGrids.push(powerLine.id);
    this.infrastructures.set(powerLine.id, powerLine);

    const connections = this.powerGridConnections.get(startPlant) || [];
    connections.push(powerLine.id);
    this.powerGridConnections.set(startPlant, connections);

    return powerLine;
  }

  /**
   * 创建水处理厂
   */
  public createWaterTreatment(
    name: string,
    treatmentType: WaterTreatmentType,
    position: Vec2,
    quality: QualityLevel = QualityLevel.STANDARD
  ): WaterTreatment {
    const treatment: WaterTreatment = {
      id: createEntityId(),
      type: InfrastructureType.WATER_TREATMENT,
      name,
      treatmentType,
      processingCapacity: this.getWaterProcessingCapacity(treatmentType, quality),
      currentOutput: 0,
      waterQuality: this.getWaterQuality(treatmentType, quality),
      servedPopulation: 0,
      pollutionReduction: this.getPollutionReduction(treatmentType),
      maintenanceCost: this.calculateWaterTreatmentMaintenance(treatmentType),
      position,
      status: InfrastructureStatus.PLANNING,
      quality,
      constructionProgress: 0,
      health: 100,
      age: 0,
      createdAt: Date.now(),
      lastMaintenanceAt: Date.now(),
    };

    this.infrastructures.set(treatment.id, treatment);
    this.waterNetworkConnections.set(treatment.id, []);
    return treatment;
  }

  /**
   * 创建灌溉系统
   */
  public createIrrigation(
    name: string,
    position: Vec2,
    coverageArea: number,
    waterSourceId: EntityId,
    quality: QualityLevel = QualityLevel.STANDARD
  ): Irrigation {
    const irrigation: Irrigation = {
      id: createEntityId(),
      type: InfrastructureType.IRRIGATION,
      name,
      coverageArea,
      waterSource: waterSourceId,
      efficiency: this.getIrrigationEfficiency(quality),
      cropYieldBonus: this.getCropYieldBonus(quality),
      waterConsumption: coverageArea * 0.1,
      maintenanceCost: this.calculateIrrigationMaintenance(coverageArea),
      servedFarms: [],
      position,
      status: InfrastructureStatus.PLANNING,
      quality,
      constructionProgress: 0,
      health: 100,
      age: 0,
      createdAt: Date.now(),
      lastMaintenanceAt: Date.now(),
    };

    this.infrastructures.set(irrigation.id, irrigation);

    const connections = this.waterNetworkConnections.get(waterSourceId) || [];
    connections.push(irrigation.id);
    this.waterNetworkConnections.set(waterSourceId, connections);

    return irrigation;
  }

  /**
   * 创建大坝
   */
  public createDam(
    name: string,
    position: Vec2,
    reservoirCapacity: number,
    quality: QualityLevel = QualityLevel.STANDARD
  ): Dam {
    const dam: Dam = {
      id: createEntityId(),
      type: InfrastructureType.DAM,
      name,
      reservoirCapacity,
      currentWaterLevel: 0,
      powerGenerationCapacity: this.getDamPowerCapacity(reservoirCapacity, quality),
      floodControlCapacity: reservoirCapacity * 0.3,
      downstreamRegions: [],
      maintenanceCost: this.calculateDamMaintenance(reservoirCapacity),
      position,
      status: InfrastructureStatus.PLANNING,
      quality,
      constructionProgress: 0,
      health: 100,
      age: 0,
      structuralIntegrity: 100,
      createdAt: Date.now(),
      lastMaintenanceAt: Date.now(),
    };

    this.infrastructures.set(dam.id, dam);
    return dam;
  }

  /**
   * 开始建设
   */
  public startConstruction(infrastructureId: EntityId): boolean {
    const infra = this.infrastructures.get(infrastructureId);
    if (!infra || infra.status !== InfrastructureStatus.PLANNING) {
      return false;
    }

    const cost = this.constructionCosts[infra.type];
    if (!this.deductConstructionCost(cost)) {
      return false;
    }

    infra.status = InfrastructureStatus.UNDER_CONSTRUCTION;
    infra.constructionProgress = 0;
    return true;
  }

  /**
   * 扣除建设成本
   */
  private deductConstructionCost(cost: ConstructionCost): boolean {
    if (!this.economicSystem) return true;

    const coreEnergy = this.economicSystem.getResource(ResourceType.CORE_ENERGY);
    if (coreEnergy && coreEnergy.amount < cost.baseCost) {
      return false;
    }

    for (const [resourceType, amount] of Object.entries(cost.resourceCosts)) {
      const resource = this.economicSystem.getResource(resourceType as ResourceType);
      if (resource && resource.amount < (amount || 0)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 更新系统
   */
  public update(deltaTime: number): void {
    const dt = deltaTime / 1000;

    for (const infra of this.infrastructures.values()) {
      this.updateInfrastructure(infra, dt);
    }

    this.processFailures(dt);
    this.updateNetworks(dt);
  }

  /**
   * 更新单个基础设施
   */
  private updateInfrastructure(infra: Infrastructure, dt: number): void {
    infra.age += dt;

    switch (infra.status) {
      case InfrastructureStatus.UNDER_CONSTRUCTION:
        this.updateConstruction(infra, dt);
        break;
      case InfrastructureStatus.OPERATIONAL:
        this.updateOperational(infra, dt);
        break;
      case InfrastructureStatus.DAMAGED:
        this.updateDamaged(infra, dt);
        break;
      case InfrastructureStatus.UNDER_REPAIR:
        this.updateRepair(infra, dt);
        break;
    }
  }

  /**
   * 更新建设进度
   */
  private updateConstruction(infra: Infrastructure, dt: number): void {
    const cost = this.constructionCosts[infra.type];
    const progressIncrement = (this.config.baseConstructionSpeed * dt) / (cost.constructionTime / 1000);
    infra.constructionProgress = Math.min(1, infra.constructionProgress + progressIncrement);

    if (infra.constructionProgress >= 1) {
      infra.status = InfrastructureStatus.OPERATIONAL;
      infra.health = 100;
    }
  }

  /**
   * 更新运营状态
   */
  private updateOperational(infra: Infrastructure, dt: number): void {
    const maintenanceCost = this.maintenanceCosts[infra.type];
    const timeSinceMaintenance = Date.now() - infra.lastMaintenanceAt;

    if (timeSinceMaintenance > this.config.maintenanceInterval) {
      infra.health -= this.config.qualityDecayRate * dt * 100;
      infra.health = Math.max(0, infra.health);
    }

    if (infra.type === InfrastructureType.ROAD) {
      const road = infra as RoadSegment;
      road.wearLevel += road.trafficDensity * 0.001 * dt;
      road.wearLevel = Math.min(100, road.wearLevel);
    }

    if (infra.health < 50) {
      this.triggerFailure(infra, FailureType.WEAR, 50 - infra.health);
    }

    if (Math.random() < this.config.failureBaseProbability * dt) {
      this.triggerRandomFailure(infra);
    }
  }

  /**
   * 更新损坏状态
   */
  private updateDamaged(infra: Infrastructure, dt: number): void {
    infra.health -= 0.1 * dt;
    infra.health = Math.max(0, infra.health);
  }

  /**
   * 更新修复进度
   */
  private updateRepair(infra: Infrastructure, dt: number): void {
    infra.health += this.config.repairSpeedMultiplier * dt * 10;
    infra.health = Math.min(100, infra.health);

    if (infra.health >= 80) {
      infra.status = InfrastructureStatus.OPERATIONAL;
      infra.lastMaintenanceAt = Date.now();

      if (infra.type === InfrastructureType.ROAD) {
        (infra as RoadSegment).wearLevel = Math.max(0, (infra as RoadSegment).wearLevel - 30);
      }
    }
  }

  /**
   * 触发故障
   */
  private triggerFailure(
    infra: Infrastructure,
    failureType: FailureType,
    severity: number
  ): FailureRecord {
    const failure: FailureRecord = {
      id: createEntityId(),
      infrastructureId: infra.id,
      failureType,
      severity,
      timestamp: Date.now(),
      resolved: false,
      repairCost: this.calculateRepairCost(infra, severity),
    };

    this.failures.push(failure);
    infra.status = InfrastructureStatus.DAMAGED;

    return failure;
  }

  /**
   * 触发随机故障
   */
  private triggerRandomFailure(infra: Infrastructure): void {
    const failureTypes = Object.values(FailureType);
    const randomType = failureTypes[Math.floor(Math.random() * failureTypes.length)];
    const severity = Math.random() * 50 + 10;
    this.triggerFailure(infra, randomType, severity);
  }

  /**
   * 计算修复成本
   */
  private calculateRepairCost(infra: Infrastructure, severity: number): number {
    const baseCost = this.maintenanceCosts[infra.type].dailyCost;
    const multiplier = this.maintenanceCosts[infra.type].repairMultiplier;
    return baseCost * multiplier * (severity / 100) * infra.quality;
  }

  /**
   * 开始修复
   */
  public startRepair(infrastructureId: EntityId): boolean {
    const infra = this.infrastructures.get(infrastructureId);
    if (!infra || infra.status !== InfrastructureStatus.DAMAGED) {
      return false;
    }

    const failure = this.failures.find(
      f => f.infrastructureId === infrastructureId && !f.resolved
    );
    if (!failure) return false;

    if (!this.deductRepairCost(failure.repairCost)) {
      return false;
    }

    infra.status = InfrastructureStatus.UNDER_REPAIR;
    return true;
  }

  /**
   * 扣除修复成本
   */
  private deductRepairCost(cost: number): boolean {
    if (!this.economicSystem) return true;

    const coreEnergy = this.economicSystem.getResource(ResourceType.CORE_ENERGY);
    if (coreEnergy && coreEnergy.amount < cost) {
      return false;
    }

    return true;
  }

  /**
   * 执行维护
   */
  public performMaintenance(infrastructureId: EntityId): boolean {
    const infra = this.infrastructures.get(infrastructureId);
    if (!infra || infra.status !== InfrastructureStatus.OPERATIONAL) {
      return false;
    }

    const cost = this.maintenanceCosts[infra.type];
    if (!this.deductMaintenanceCost(cost)) {
      return false;
    }

    infra.health = Math.min(100, infra.health + 20);
    infra.lastMaintenanceAt = Date.now();

    if (infra.type === InfrastructureType.ROAD) {
      (infra as RoadSegment).wearLevel = Math.max(0, (infra as RoadSegment).wearLevel - 20);
    }

    return true;
  }

  /**
   * 扣除维护成本
   */
  private deductMaintenanceCost(cost: MaintenanceCost): boolean {
    if (!this.economicSystem) return true;

    const coreEnergy = this.economicSystem.getResource(ResourceType.CORE_ENERGY);
    if (coreEnergy && coreEnergy.amount < cost.dailyCost) {
      return false;
    }

    return true;
  }

  /**
   * 处理故障
   */
  private processFailures(dt: number): void {
    for (const failure of this.failures) {
      if (failure.resolved) continue;

      const infra = this.infrastructures.get(failure.infrastructureId);
      if (!infra) continue;

      if (infra.status === InfrastructureStatus.OPERATIONAL && infra.health >= 80) {
        failure.resolved = true;
        failure.resolvedAt = Date.now();
      }
    }
  }

  /**
   * 更新网络
   */
  private updateNetworks(dt: number): void {
    this.updateRoadNetwork(dt);
    this.updatePowerGrid(dt);
    this.updateWaterNetwork(dt);
  }

  /**
   * 更新道路网络
   */
  private updateRoadNetwork(dt: number): void {
    for (const node of this.roadNodes.values()) {
      node.trafficLoad = 0;

      for (const connectionId of node.connections) {
        const connectedNode = this.roadNodes.get(connectionId);
        if (connectedNode) {
          node.trafficLoad += connectedNode.capacity * 0.1;
        }
      }
    }
  }

  /**
   * 更新电力网络
   */
  private updatePowerGrid(dt: number): void {
    for (const [plantId, connections] of this.powerGridConnections) {
      const plant = this.infrastructures.get(plantId) as PowerPlant;
      if (!plant || plant.status !== InfrastructureStatus.OPERATIONAL) continue;

      let totalDemand = 0;
      for (const lineId of connections) {
        const line = this.infrastructures.get(lineId) as PowerLine;
        if (line && line.status === InfrastructureStatus.OPERATIONAL) {
          totalDemand += line.transmissionCapacity;
        }
      }

      plant.currentOutput = Math.min(plant.generationCapacity, totalDemand);
      plant.operationalHours += dt / 3600;
    }
  }

  /**
   * 更新水利网络
   */
  private updateWaterNetwork(dt: number): void {
    for (const [sourceId, connections] of this.waterNetworkConnections) {
      const source = this.infrastructures.get(sourceId);
      if (!source || source.status !== InfrastructureStatus.OPERATIONAL) continue;

      if (source.type === InfrastructureType.WATER_TREATMENT) {
        const treatment = source as WaterTreatment;
        let totalServed = 0;

        for (const irrigationId of connections) {
          const irrigation = this.infrastructures.get(irrigationId) as Irrigation;
          if (irrigation && irrigation.status === InfrastructureStatus.OPERATIONAL) {
            totalServed += irrigation.coverageArea;
          }
        }

        treatment.currentOutput = Math.min(treatment.processingCapacity, totalServed * 0.1);
        treatment.servedPopulation = totalServed * 10;
      }
    }
  }

  /**
   * 获取道路速度倍数
   */
  private getRoadSpeedMultiplier(roadType: RoadType, quality: QualityLevel): number {
    const baseSpeed: Record<RoadType, number> = {
      [RoadType.DIRT]: 0.5,
      [RoadType.GRAVEL]: 0.7,
      [RoadType.PAVED]: 1.0,
      [RoadType.HIGHWAY]: 1.5,
      [RoadType.MAGLEV]: 2.5,
    };
    return baseSpeed[roadType] * (0.8 + quality * 0.1);
  }

  /**
   * 获取道路贸易加成
   */
  private getRoadTradeBonus(roadType: RoadType, quality: QualityLevel): number {
    const baseBonus: Record<RoadType, number> = {
      [RoadType.DIRT]: 0.02,
      [RoadType.GRAVEL]: 0.05,
      [RoadType.PAVED]: 0.1,
      [RoadType.HIGHWAY]: 0.2,
      [RoadType.MAGLEV]: 0.4,
    };
    return baseBonus[roadType] * (0.8 + quality * 0.1);
  }

  /**
   * 获取道路宽度
   */
  private getRoadWidth(roadType: RoadType): number {
    const widths: Record<RoadType, number> = {
      [RoadType.DIRT]: 3,
      [RoadType.GRAVEL]: 5,
      [RoadType.PAVED]: 8,
      [RoadType.HIGHWAY]: 15,
      [RoadType.MAGLEV]: 10,
    };
    return widths[roadType];
  }

  /**
   * 计算道路维护成本
   */
  private calculateRoadMaintenance(roadType: RoadType, length: number): number {
    const baseCost: Record<RoadType, number> = {
      [RoadType.DIRT]: 1,
      [RoadType.GRAVEL]: 2,
      [RoadType.PAVED]: 5,
      [RoadType.HIGHWAY]: 10,
      [RoadType.MAGLEV]: 20,
    };
    return baseCost[roadType] * length * 0.01;
  }

  /**
   * 获取桥梁承载能力
   */
  private getBridgeLoadCapacity(bridgeType: BridgeType, quality: QualityLevel): number {
    const baseCapacity: Record<BridgeType, number> = {
      [BridgeType.WOODEN]: 10,
      [BridgeType.STONE]: 50,
      [BridgeType.STEEL]: 200,
      [BridgeType.SUSPENSION]: 500,
      [BridgeType.MAGNETIC]: 1000,
    };
    return baseCapacity[bridgeType] * (0.8 + quality * 0.1);
  }

  /**
   * 计算桥梁维护成本
   */
  private calculateBridgeMaintenance(bridgeType: BridgeType, spanLength: number): number {
    const baseCost: Record<BridgeType, number> = {
      [BridgeType.WOODEN]: 5,
      [BridgeType.STONE]: 10,
      [BridgeType.STEEL]: 20,
      [BridgeType.SUSPENSION]: 50,
      [BridgeType.MAGNETIC]: 100,
    };
    return baseCost[bridgeType] * spanLength * 0.01;
  }

  /**
   * 获取发电厂容量
   */
  private getPowerPlantCapacity(plantType: PowerPlantType, quality: QualityLevel): number {
    const baseCapacity: Record<PowerPlantType, number> = {
      [PowerPlantType.COAL]: 100,
      [PowerPlantType.GAS]: 150,
      [PowerPlantType.NUCLEAR]: 500,
      [PowerPlantType.SOLAR]: 50,
      [PowerPlantType.WIND]: 30,
      [PowerPlantType.FUSION]: 2000,
      [PowerPlantType.QUANTUM]: 10000,
    };
    return baseCapacity[plantType] * (0.8 + quality * 0.1);
  }

  /**
   * 获取发电厂效率
   */
  private getPowerPlantEfficiency(plantType: PowerPlantType, quality: QualityLevel): number {
    const baseEfficiency: Record<PowerPlantType, number> = {
      [PowerPlantType.COAL]: 0.35,
      [PowerPlantType.GAS]: 0.45,
      [PowerPlantType.NUCLEAR]: 0.33,
      [PowerPlantType.SOLAR]: 0.2,
      [PowerPlantType.WIND]: 0.35,
      [PowerPlantType.FUSION]: 0.6,
      [PowerPlantType.QUANTUM]: 0.95,
    };
    return baseEfficiency[plantType] * (0.9 + quality * 0.02);
  }

  /**
   * 获取发电厂燃料类型
   */
  private getPowerPlantFuelType(plantType: PowerPlantType): ResourceType | null {
    const fuelMap: Partial<Record<PowerPlantType, ResourceType>> = {
      [PowerPlantType.COAL]: ResourceType.BIOMASS,
      [PowerPlantType.GAS]: ResourceType.BIOMASS,
      [PowerPlantType.NUCLEAR]: ResourceType.CORE_ENERGY,
      [PowerPlantType.FUSION]: ResourceType.CORE_ENERGY,
    };
    return fuelMap[plantType] || null;
  }

  /**
   * 获取发电厂燃料消耗
   */
  private getPowerPlantFuelConsumption(plantType: PowerPlantType): number {
    const consumption: Record<PowerPlantType, number> = {
      [PowerPlantType.COAL]: 10,
      [PowerPlantType.GAS]: 8,
      [PowerPlantType.NUCLEAR]: 1,
      [PowerPlantType.SOLAR]: 0,
      [PowerPlantType.WIND]: 0,
      [PowerPlantType.FUSION]: 0.5,
      [PowerPlantType.QUANTUM]: 0.1,
    };
    return consumption[plantType];
  }

  /**
   * 获取发电厂排放水平
   */
  private getPowerPlantEmission(plantType: PowerPlantType): number {
    const emission: Record<PowerPlantType, number> = {
      [PowerPlantType.COAL]: 100,
      [PowerPlantType.GAS]: 50,
      [PowerPlantType.NUCLEAR]: 5,
      [PowerPlantType.SOLAR]: 0,
      [PowerPlantType.WIND]: 0,
      [PowerPlantType.FUSION]: 1,
      [PowerPlantType.QUANTUM]: 0,
    };
    return emission[plantType];
  }

  /**
   * 计算发电厂维护成本
   */
  private calculatePowerPlantMaintenance(plantType: PowerPlantType): number {
    const maintenance: Record<PowerPlantType, number> = {
      [PowerPlantType.COAL]: 50,
      [PowerPlantType.GAS]: 40,
      [PowerPlantType.NUCLEAR]: 100,
      [PowerPlantType.SOLAR]: 10,
      [PowerPlantType.WIND]: 15,
      [PowerPlantType.FUSION]: 200,
      [PowerPlantType.QUANTUM]: 500,
    };
    return maintenance[plantType];
  }

  /**
   * 获取输电容量
   */
  private getTransmissionCapacity(quality: QualityLevel): number {
    return 100 * quality;
  }

  /**
   * 计算输电损耗
   */
  private calculateTransmissionLoss(length: number, quality: QualityLevel): number {
    return Math.max(0.01, 0.1 - quality * 0.01) * length * 0.001;
  }

  /**
   * 获取电压等级
   */
  private getVoltageLevel(quality: QualityLevel): number {
    return 110 + quality * 55;
  }

  /**
   * 计算输电线维护成本
   */
  private calculatePowerLineMaintenance(length: number): number {
    return length * 0.1;
  }

  /**
   * 获取水处理容量
   */
  private getWaterProcessingCapacity(treatmentType: WaterTreatmentType, quality: QualityLevel): number {
    const baseCapacity: Record<WaterTreatmentType, number> = {
      [WaterTreatmentType.BASIC]: 100,
      [WaterTreatmentType.STANDARD]: 500,
      [WaterTreatmentType.ADVANCED]: 2000,
      [WaterTreatmentType.QUANTUM_PURIFICATION]: 10000,
    };
    return baseCapacity[treatmentType] * (0.8 + quality * 0.1);
  }

  /**
   * 获取水质
   */
  private getWaterQuality(treatmentType: WaterTreatmentType, quality: QualityLevel): number {
    const baseQuality: Record<WaterTreatmentType, number> = {
      [WaterTreatmentType.BASIC]: 0.7,
      [WaterTreatmentType.STANDARD]: 0.85,
      [WaterTreatmentType.ADVANCED]: 0.95,
      [WaterTreatmentType.QUANTUM_PURIFICATION]: 0.999,
    };
    return baseQuality[treatmentType] * (0.95 + quality * 0.01);
  }

  /**
   * 获取污染减少量
   */
  private getPollutionReduction(treatmentType: WaterTreatmentType): number {
    const reduction: Record<WaterTreatmentType, number> = {
      [WaterTreatmentType.BASIC]: 0.5,
      [WaterTreatmentType.STANDARD]: 0.7,
      [WaterTreatmentType.ADVANCED]: 0.9,
      [WaterTreatmentType.QUANTUM_PURIFICATION]: 0.99,
    };
    return reduction[treatmentType];
  }

  /**
   * 计算水处理厂维护成本
   */
  private calculateWaterTreatmentMaintenance(treatmentType: WaterTreatmentType): number {
    const maintenance: Record<WaterTreatmentType, number> = {
      [WaterTreatmentType.BASIC]: 20,
      [WaterTreatmentType.STANDARD]: 50,
      [WaterTreatmentType.ADVANCED]: 100,
      [WaterTreatmentType.QUANTUM_PURIFICATION]: 300,
    };
    return maintenance[treatmentType];
  }

  /**
   * 获取灌溉效率
   */
  private getIrrigationEfficiency(quality: QualityLevel): number {
    return 0.5 + quality * 0.1;
  }

  /**
   * 获取作物产量加成
   */
  private getCropYieldBonus(quality: QualityLevel): number {
    return 0.1 + quality * 0.05;
  }

  /**
   * 计算灌溉系统维护成本
   */
  private calculateIrrigationMaintenance(coverageArea: number): number {
    return coverageArea * 0.05;
  }

  /**
   * 获取大坝发电容量
   */
  private getDamPowerCapacity(reservoirCapacity: number, quality: QualityLevel): number {
    return reservoirCapacity * 0.01 * quality;
  }

  /**
   * 计算大坝维护成本
   */
  private calculateDamMaintenance(reservoirCapacity: number): number {
    return reservoirCapacity * 0.001;
  }

  /**
   * 计算距离
   */
  private calculateDistance(a: Vec2, b: Vec2): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  /**
   * 获取基础设施
   */
  public getInfrastructure(id: EntityId): Infrastructure | undefined {
    return this.infrastructures.get(id);
  }

  /**
   * 获取所有基础设施
   */
  public getAllInfrastructure(): Infrastructure[] {
    return Array.from(this.infrastructures.values());
  }

  /**
   * 按类型获取基础设施
   */
  public getInfrastructureByType(type: InfrastructureType): Infrastructure[] {
    return this.getAllInfrastructure().filter(i => i.type === type);
  }

  /**
   * 获取道路网络
   */
  public getRoadNetwork(): Map<EntityId, RoadNode> {
    return this.roadNodes;
  }

  /**
   * 获取电力网络
   */
  public getPowerGrid(): Map<EntityId, EntityId[]> {
    return this.powerGridConnections;
  }

  /**
   * 获取水利网络
   */
  public getWaterNetwork(): Map<EntityId, EntityId[]> {
    return this.waterNetworkConnections;
  }

  /**
   * 获取故障记录
   */
  public getFailures(resolved?: boolean): FailureRecord[] {
    if (resolved === undefined) return this.failures;
    return this.failures.filter(f => f.resolved === resolved);
  }

  /**
   * 计算道路网络对贸易的影响
   */
  public calculateTradeEfficiency(regionId: EntityId): number {
    let totalBonus = 0;
    const roads = this.getInfrastructureByType(InfrastructureType.ROAD) as RoadSegment[];

    for (const road of roads) {
      if (road.status === InfrastructureStatus.OPERATIONAL) {
        totalBonus += road.tradeEfficiencyBonus * (road.health / 100);
      }
    }

    return Math.min(2, 1 + totalBonus);
  }

  /**
   * 计算电力供应对工业的影响
   */
  public calculateIndustrialOutput(regionId: EntityId): number {
    let totalPower = 0;
    const plants = this.getInfrastructureByType(InfrastructureType.POWER_PLANT) as PowerPlant[];

    for (const plant of plants) {
      if (plant.status === InfrastructureStatus.OPERATIONAL) {
        totalPower += plant.currentOutput * (plant.health / 100) * plant.efficiency;
      }
    }

    return totalPower;
  }

  /**
   * 计算水利系统对农业的影响
   */
  public calculateAgriculturalOutput(regionId: EntityId): number {
    let totalBonus = 0;
    const irrigations = this.getInfrastructureByType(InfrastructureType.IRRIGATION) as Irrigation[];

    for (const irrigation of irrigations) {
      if (irrigation.status === InfrastructureStatus.OPERATIONAL) {
        totalBonus += irrigation.cropYieldBonus * (irrigation.health / 100) * irrigation.efficiency;
      }
    }

    return 1 + totalBonus;
  }

  /**
   * 计算水利系统对市民健康的影响
   */
  public calculateHealthImpact(regionId: EntityId): number {
    let totalQuality = 0;
    let totalServed = 0;

    const treatments = this.getInfrastructureByType(InfrastructureType.WATER_TREATMENT) as WaterTreatment[];

    for (const treatment of treatments) {
      if (treatment.status === InfrastructureStatus.OPERATIONAL) {
        totalQuality += treatment.waterQuality * treatment.servedPopulation;
        totalServed += treatment.servedPopulation;
      }
    }

    return totalServed > 0 ? totalQuality / totalServed : 0.5;
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): InfrastructureStatistics {
    const all = this.getAllInfrastructure();

    return {
      totalInfrastructure: all.length,
      operationalCount: all.filter(i => i.status === InfrastructureStatus.OPERATIONAL).length,
      damagedCount: all.filter(i => i.status === InfrastructureStatus.DAMAGED).length,
      underConstructionCount: all.filter(i => i.status === InfrastructureStatus.UNDER_CONSTRUCTION).length,
      totalMaintenanceCost: all.reduce((sum, i) => {
        const cost = this.maintenanceCosts[i.type];
        return sum + cost.dailyCost;
      }, 0),
      averageHealth: all.length > 0
        ? all.reduce((sum, i) => sum + i.health, 0) / all.length
        : 0,
      roadNetworkCoverage: this.roadNodes.size / 100,
      powerGridCoverage: this.powerGridConnections.size / 50,
      waterSupplyCoverage: this.waterNetworkConnections.size / 30,
      totalPowerGeneration: this.getInfrastructureByType(InfrastructureType.POWER_PLANT)
        .reduce((sum, p) => sum + ((p as PowerPlant).currentOutput || 0), 0),
      totalWaterProcessing: this.getInfrastructureByType(InfrastructureType.WATER_TREATMENT)
        .reduce((sum, w) => sum + ((w as WaterTreatment).currentOutput || 0), 0),
    };
  }

  /**
   * 分解设施
   */
  public decommissionInfrastructure(id: EntityId): boolean {
    const infra = this.infrastructures.get(id);
    if (!infra) return false;

    infra.status = InfrastructureStatus.DECOMMISSIONED;

    if (infra.type === InfrastructureType.ROAD) {
      const road = infra as RoadSegment;
      const startNode = this.roadNodes.get(road.startNode);
      const endNode = this.roadNodes.get(road.endNode);

      if (startNode) {
        startNode.connections = startNode.connections.filter(c => c !== road.endNode);
      }
      if (endNode) {
        endNode.connections = endNode.connections.filter(c => c !== road.startNode);
      }
    }

    return true;
  }
}

export default InfrastructureSystem;
