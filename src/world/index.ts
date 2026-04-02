/**
 * =============================================================================
 * 世界模块导出
 * World Module Exports
 * =============================================================================
 */

export {
  DayNightCycle,
  dayNightCycle,
} from './DayNightCycle';

export type {
  DayNightState,
  DayNightConfig,
  DayNightEventData,
} from './DayNightCycle';

export {
  TimeOfDay,
  DayNightEventType,
} from './DayNightCycle';

export {
  WeatherEffects,
  weatherEffects,
} from './WeatherEffects';

export type {
  WeatherState,
  WeatherParticle,
  WeatherEffectConfig,
  WeatherEventData,
} from './WeatherEffects';

export {
  WeatherType,
  WeatherEventType,
} from './WeatherEffects';

export {
  WorldEventEffects,
  worldEventEffects,
} from './WorldEventEffects';

export type {
  EventNotificationConfig,
  ScreenShakeConfig,
  FlashConfig,
  ColorShiftConfig,
  VignetteConfig,
  GlitchConfig,
  RippleConfig,
  ParticleBurstConfig,
  EventEffectEventData,
} from './WorldEventEffects';

export {
  EventEffectType,
  EventEffectEventType,
} from './WorldEventEffects';

export {
  EpidemicSystem,
  ClimateSystem,
  SeasonSystem,
  DisasterManager,
  Season,
  DisasterType,
  DiseaseState,
  SocialClass,
  MarxistEconomics,
  epidemicSystem,
  climateSystem,
  seasonSystem,
  disasterManager,
  marxistEconomics,
} from './EpidemicClimateSystem';

export type {
  SeasonConfig,
  SeasonState,
  NaturalDisaster,
  DisasterEffects,
  DisasterWarning,
  Disease,
  CitizenDiseaseState,
  ClimateState as ClimateSystemState,
  Ecosystem,
  ChaosWarning,
  CitizenEnvironmentState,
  EnvironmentVisualizationData,
  CommodityValue,
  MarxistEconomicState,
} from './EpidemicClimateSystem';

export {
  EntropyEpochManager,
  entropyEpochManager,
  CatastropheType,
} from './EntropyEpoch';

export type {
  EntropyConfig,
  Catastrophe,
  CatastropheEffect,
} from './EntropyEpoch';
