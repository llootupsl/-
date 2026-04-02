/**
 * 市民模块 - 索引文件
 */

export { Citizen } from './Citizen';
export type { 
  BaZiAttributes, 
  EpisodicMemory, 
  RelationshipNode, 
  RelationshipEdge, 
  RelationshipNetworkData 
} from './Citizen';
export { CitizenManager, citizenManager } from './CitizenManager';
export {
  GenomeManager,
  genomeManager,
  EpigeneticsSystem,
  GeneInfluenceMapper,
  geneInfluenceMapper,
  GeneType,
} from './GenomeSystem';
export type {
  Gene,
  Genome as ExtendedGenome,
  EpigeneticMark,
  GeneInfluenceConfig,
  BehaviorInfluenceConfig,
} from './GenomeSystem';

export { MetaCognitionEngine, GoalType, GoalStatus } from './MetaCognitionEngine';
export type {
  MetaCognitionState,
  ValueSystem,
  Goal,
  GoalMetric,
  Reflection,
  ReflectionContext,
  ReflectionAnalysis,
  ValueChange,
  IntrospectionReport,
  SelfPerception,
  ValueAssessment,
  GoalProgressReport,
  EmotionalPattern,
  BehavioralTendency,
  DecisionEvaluation,
  MetaCognitionConfig,
} from './MetaCognitionEngine';

export { MetaCognitionDecisionMapper, metaCognitionDecisionMapper } from './MetaCognitionDecisionMapper';
export type {
  DecisionAction,
  DecisionWeights,
  MetaCognitionInfluence,
  DecisionContext,
} from './MetaCognitionDecisionMapper';

export { PersonalitySystem, personalitySystem } from './PersonalitySystem';
export type {
  PersonalityTraits,
  PersonalityDimension,
  DialogueScenario,
  DialogueContext,
  DialogueOption,
  PersonalitySystemConfig,
  PersonalityDevelopmentRecord,
} from './PersonalitySystem';

export {
  GenePluginManager,
  GenePluginEngine,
  WasmBytecodeParser,
  genePluginManager,
} from './GenePluginSystem';
export type {
  GenePluginMetadata,
  GenePluginContext,
  GenePluginResult,
  GenePluginInstance,
} from './GenePluginSystem';

export {
  GenePluginDebugger,
  genePluginDebugger,
  basicPluginBytecode,
  registerExamplePlugins,
  initializeGenePluginSystem,
} from './GenePluginExamples';
