/**
 * AI 模块 - 索引文件
 */

export { LLMManager } from './LLMBridge';
export type { LLMConfig, LLMMessage, LLMResponse, LLMProvider } from './LLMBridge';
export { 
  GraphNeuralNetwork, 
  socialGNN,
  SupplyChainNodeType,
  SupplyChainEdgeType,
} from './SocialGNN';
export type {
  CitizenFeatures,
  SupplyChainNodeFeatures,
  SupplyChainEdgeFeatures,
  GraphNode,
  GraphEdge,
  Community,
} from './SocialGNN';
export { LocalThinker } from './LocalThinker';

export {
  EthicsConstraintChecker,
  EthicsAwareAIDecisionMaker,
  getEthicsChecker,
  resetEthicsChecker,
  CORE_ETHICS_RULES,
  DEFAULT_ETHICS_CONFIG,
} from './EthicsConstraint';
export type {
  EthicsRule,
  EthicsViolation,
  EthicsCheckResult,
  AlternativeAction,
  EthicsAuditLog,
  EthicsConstraintConfig,
} from './EthicsConstraint';
export { EthicsRuleCategory, EthicsSeverity } from './EthicsConstraint';
