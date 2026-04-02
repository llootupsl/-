/**
 * =============================================================================
 * GAME SYSTEMS INDEX - 游戏系统统一导出
 * THE ULTIMATE GAME SYSTEMS EXPORT
 * =============================================================================
 */

export { VoxelHumanRenderer, VoxelHumanManager, voxelHumanManager, VoxelMaterial, VoxelFlags, type Voxel, type VoxelDNA, type LODLevel, type FacialActionUnit, type FacialExpression, type AnimationState, type PhysicsConfig } from '../rendering/VoxelHumanRenderer';

export { ProceduralFaceGenerator, faceGenerator, type FaceFeatures, type UniqueMark, type FaceInstance, type ExpressionParams, type SDFMaterial } from '../rendering/ProceduralFaceGenerator';

export { ObservationValueSystem, observationValueSystem, type ObservationData, type Achievement, type Challenge, type ComboSystem, type ObservationStatistics, type LeaderboardEntry } from './ObservationValueSystem';
export type { ObservationType, Rarity, ObserverLevel, AchievementCategory, AchievementTier, LeaderboardType, ChallengeType } from './ObservationValueSystem';

export { DivineInterventionSystem, divineInterventionSystem, type DivinePower, type DivinePowerCost, type DivineEffect, type InterventionRecord, type CausalChainNode, type FaithSystem, type KarmaSystem, type DivinePowerCombo } from './DivineInterventionSystem';
export type { DivinePowerType, DivinePowerTier, DivineEffectType, DivineEffectTarget } from './DivineInterventionSystem';

export { RoguelikeReincarnationSystem, roguelikeReincarnationSystem, type ReincarnationCondition, type ReincarnationResult, type ReincarnationBonus, type ReincarnationStatistics, type InheritedMemory, type Unlockable, type ReincarnationChallenge, type ShopItem, type MetaProgression } from './RoguelikeReincarnationSystem';
export type { ReincarnationType, ReincarnationRank, ConditionType, BonusType, MemoryType, UnlockCategory, UnlockTier, ShopCategory } from './RoguelikeReincarnationSystem';

// Re-export ChallengeDifficulty (only from one place to avoid duplicates)
export { ChallengeDifficulty } from './ObservationValueSystem';
