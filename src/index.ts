/**
 * =============================================================================
 * 永夜熵纪 - 主入口文件
 * Main Entry Point
 * 导出所有核心模块
 * =============================================================================
 */

// WASM Bridge
export { 
  initWasm, 
  isWasmReady, 
  getWasmVersion, 
  runBenchmark,
  wasmQuantum,
  wasmSNN,
  wasmPathFinder,
  wasmBazi,
} from './wasm/WasmBridge';

// Quantum Neural Engine
export { 
  QuantumNeuralDecisionEngine, 
  qnDecisionEngine,
  type Decision,
  type DecisionOption,
  type QuantumState,
  type QNConfig,
} from './citizen/QuantumNeuralEngine';

// Genome System
export { 
  GenomeManager, 
  genomeManager,
  type Genome,
  type Gene,
  type EpigeneticMark,
  type MutationEvent,
  GeneType,
} from './citizen/GenomeSystem';

// Tech Tree
export { 
  TechTree, 
  techTree,
  type TechNode,
  type TechEffect,
  TechCategory,
  TechStatus,
} from './economy/TechTree';

// Supply Chain
export { 
  SupplyChain, 
  IndustryManager,
  supplyChain,
  industryManager,
  type ProductionFacility,
  type SupplyChainNode,
  type SupplyChainConnection,
  type ResourceRequirement,
  type ResourceOutput,
  ResourceType,
  IndustryType,
} from './economy/SupplyChain';

// DAO System
export { 
  DAOSystem, 
  daoSystem,
  type Bill,
  type Vote,
  type SmartContract,
  type Constitution,
  type JudicialRuling,
  BillType,
  VotingType,
  VoteStatus,
} from './governance/DAOSystem';

// Blockchain
export { 
  Blockchain, 
  blockchain,
  type Block,
  type Transaction,
  type Validator,
  type DIDDocument,
  TransactionType,
} from './blockchain/Blockchain';

// P2P Network
export { 
  P2PNetwork, 
  p2pNetwork,
  type Peer,
  type NetworkMessage,
  type ConsensusMessage,
  MessageType,
  PeerStatus,
} from './network/P2PNetwork';

// BaZi Fortune
export { 
  BaZiEngine,
  LunarCalendar,
  baziEngine,
  lunarCalendar,
  type BaZiChart,
  type Pillar,
  type DaYun,
  type LiuNian,
  type FortuneAnalysis,
  HeavenlyStem,
  EarthlyBranch,
  FiveElements,
  TenGods,
} from './fortune/BaZiSystem';

// Procedural Face
export { 
  ProceduralFaceGenerator, 
  faceGenerator,
  type FaceFeatures,
  type FaceInstance,
  type ExpressionParams,
  type SDFMaterial,
} from './rendering/ProceduralFaceGenerator';

// Spatial Audio
export { 
  SpatialAudioSystem, 
  SoundSynthesizer,
  spatialAudio,
  soundSynth,
  type AudioSource,
  type AudioZone,
  SoundType,
} from './audio/SpatialAudio';

// Rendering
export { 
  WebGPURenderer,
  type RenderConfig,
} from './rendering/WebGPURenderer';

// Three-State Citizen LOD
export { 
  ThreeStateCitizenSystem,
  citizenLODSystem,
  type CitizenBase,
  type DormantCitizen,
  type BackgroundCitizen,
  type ActiveCitizen,
  type PhysiologyState,
  type HormoneLevels,
  CitizenLODState,
} from './citizen/CitizenLODSystem';

// Epidemic and Climate
export { 
  EpidemicSystem,
  ClimateSystem,
  epidemicSystem,
  climateSystem,
  type Disease,
  type ClimateState,
  type Ecosystem,
  type ChaosWarning,
} from './world/EpidemicClimateSystem';

// Media, Education, Religion
export { 
  MediaSystem,
  EducationSystem,
  ReligionSystem,
  mediaSystem,
  educationSystem,
  religionSystem,
  type NewsArticle,
  type SchoolContract,
  type Religion,
} from './society/MediaEducationReligion';

// Crime and War
export { 
  CrimeSystem,
  LawEnforcementSystem,
  WarSystem,
  crimeSystem,
  lawEnforcement,
  warSystem,
  type CrimeRecord,
  type CityState,
  type War,
} from './conflict/CrimeWarSystem';

// Social GNN
export { 
  GraphNeuralNetwork,
  socialGNN,
  type GraphNode,
  type GraphEdge,
  type Community,
} from './ai/SocialGNN';

// Narrative Engine
export { 
  NarrativeEngine,
  WorldChat,
  narrativeEngine,
  worldChat,
  type HistoricalEvent,
  type Chronicle,
  type ChatMessage,
  EventType,
} from './narrative/NarrativeEngine';

// Entropy Epoch
export { 
  EntropyEpochSystem,
  entropyEpochSystem,
  type CoreResources,
  type EmotionalNetwork,
  type Achievement,
  type AkashicRecord,
  DisasterType,
} from './game/EntropyEpochSystem';

// Benchmark and Preheater
export { 
  PerformanceBenchmark,
  HardwarePreheater,
  performanceBenchmark,
  hardwarePreheater,
  type BenchmarkResult,
  type PerformanceReport,
  PerformanceMode,
} from './benchmark/PerformanceBenchmark';

// Audio Engine
export { 
  AudioEngine,
  SoundType as AudioEngineSoundType,
} from './audio/AudioEngine';

// AI Bridge
export { 
  LLMManager,
  type LLMConfig,
  type LLMMessage,
  type LLMResponse,
  type LLMProvider,
} from './ai/LLMBridge';

// Game Store
export { 
  useGameStore,
  useGamePhase,
  useResources,
  useEntropy,
  useEmotion,
  useCitizenStats,
  useCamera,
  useInteraction,
  usePanels,
  useTime,
  useObservation,
  usePerformanceMode,
  useNarrative,
  useExternalAPI,
  useLaws,
  useWarnings,
  useGameOverReason,
} from './store/gameStore';
