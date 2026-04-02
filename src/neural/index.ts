/**
 * 神经网络模块 - 索引文件
 */

export { NeuralEngine, NeuralManager, neuralManager } from './NeuralEngine';
export type { NeuralConfig, NeuralActivity } from './NeuralEngine';

export { GNNEngine, createGNNEngine } from './GNNEngine';
export type {
  NodeFeatures,
  EdgeFeatures,
  GraphStructure,
  GNNLayerConfig,
  GNNConfig,
  GNNStats,
  MessagePassingConfig,
} from './GNNEngine';

export { SentimentNetwork, createSentimentNetwork } from './SentimentNetwork';
export type {
  SentimentDimension,
  SentimentState,
  SentimentInfluence,
  SentimentNetworkConfig,
  SentimentAnalysis,
  SocialRelation,
} from './SentimentNetwork';

export { CitizensGNN } from './CitizensGNN';
export type { CitizensGNNProps } from './CitizensGNN';
