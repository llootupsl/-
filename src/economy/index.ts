/**
 * 经济模块 - 索引文件
 */

export { EconomicSystem, economicSystem } from './EconomicSystem';
export { InfrastructureSystem } from './InfrastructureSystem';
export {
  InfrastructureType,
  InfrastructureStatus,
  QualityLevel,
  RoadType,
  BridgeType,
  PowerPlantType,
  WaterTreatmentType,
  FailureType,
} from './InfrastructureSystem';
export type {
  Infrastructure,
  InfrastructureBase,
  RoadNode,
  RoadSegment,
  Bridge,
  PowerPlant,
  PowerLine,
  WaterTreatment,
  Irrigation,
  Dam,
  ConstructionCost,
  MaintenanceCost,
  FailureRecord,
  InfrastructureStatistics,
  InfrastructureConfig,
} from './InfrastructureSystem';
