/**
 * =============================================================================
 * 元认知决策映射器
 * Meta-Cognition Decision Mapper
 * 将元认知结果映射到决策权重，实现价值观和目标驱动的行为选择
 * =============================================================================
 */

import {
  ValueSystem,
  Goal,
  GoalStatus,
  Reflection,
  IntrospectionReport,
  MetaCognitionState,
} from './MetaCognitionEngine';

/** 决策选项类型 */
export type DecisionAction = 'work' | 'rest' | 'socialize' | 'explore' | 'migrate' | 'learn' | 'create' | 'trade';

/** 决策权重 */
export interface DecisionWeights {
  [action: string]: number;
}

/** 价值观到行动的映射配置 */
interface ValueActionMapping {
  action: DecisionAction;
  valueKey: keyof ValueSystem;
  weight: number;
  condition?: (values: ValueSystem, state: any) => boolean;
}

/** 目标到行动的映射配置 */
interface GoalActionMapping {
  goalCategory: string;
  preferredActions: DecisionAction[];
  weightMultiplier: number;
  priorityThreshold: number;
}

/** 反思影响配置 */
interface ReflectionInfluence {
  successActionBoost: number;
  failureActionPenalty: number;
  insightWeight: number;
}

/** 默认映射配置 */
const DEFAULT_VALUE_ACTION_MAPPINGS: ValueActionMapping[] = [
  { action: 'work', valueKey: 'achievement', weight: 0.3 },
  { action: 'work', valueKey: 'power', weight: 0.2 },
  { action: 'rest', valueKey: 'survival', weight: 0.25 },
  { action: 'rest', valueKey: 'security', weight: 0.15 },
  { action: 'socialize', valueKey: 'social', weight: 0.35 },
  { action: 'socialize', valueKey: 'harmony', weight: 0.2 },
  { action: 'explore', valueKey: 'exploration', weight: 0.35 },
  { action: 'explore', valueKey: 'autonomy', weight: 0.2 },
  { action: 'migrate', valueKey: 'autonomy', weight: 0.25 },
  { action: 'migrate', valueKey: 'exploration', weight: 0.15 },
  { action: 'learn', valueKey: 'achievement', weight: 0.2 },
  { action: 'learn', valueKey: 'exploration', weight: 0.15 },
  { action: 'create', valueKey: 'achievement', weight: 0.15 },
  { action: 'create', valueKey: 'autonomy', weight: 0.1 },
  { action: 'trade', valueKey: 'social', weight: 0.15 },
  { action: 'trade', valueKey: 'achievement', weight: 0.1 },
];

const DEFAULT_GOAL_ACTION_MAPPINGS: GoalActionMapping[] = [
  { goalCategory: 'health', preferredActions: ['rest'], weightMultiplier: 1.5, priorityThreshold: 0.6 },
  { goalCategory: 'social', preferredActions: ['socialize', 'trade'], weightMultiplier: 1.3, priorityThreshold: 0.5 },
  { goalCategory: 'exploration', preferredActions: ['explore', 'migrate'], weightMultiplier: 1.4, priorityThreshold: 0.5 },
  { goalCategory: 'work', preferredActions: ['work', 'create'], weightMultiplier: 1.3, priorityThreshold: 0.5 },
  { goalCategory: 'achievement', preferredActions: ['work', 'learn', 'create'], weightMultiplier: 1.4, priorityThreshold: 0.6 },
  { goalCategory: 'knowledge', preferredActions: ['learn', 'explore'], weightMultiplier: 1.2, priorityThreshold: 0.5 },
  { goalCategory: 'wealth', preferredActions: ['work', 'trade'], weightMultiplier: 1.3, priorityThreshold: 0.5 },
  { goalCategory: 'power', preferredActions: ['work', 'socialize'], weightMultiplier: 1.2, priorityThreshold: 0.6 },
];

const DEFAULT_REFLECTION_INFLUENCE: ReflectionInfluence = {
  successActionBoost: 0.15,
  failureActionPenalty: 0.1,
  insightWeight: 0.08,
};

/** 元认知决策影响结果 */
export interface MetaCognitionInfluence {
  baseWeights: DecisionWeights;
  valueAdjustedWeights: DecisionWeights;
  goalAdjustedWeights: DecisionWeights;
  reflectionAdjustedWeights: DecisionWeights;
  finalWeights: DecisionWeights;
  dominantValue: string;
  activeGoalInfluence: string[];
  reflectionInsights: string[];
  selfAwarenessModifier: number;
}

/** 决策上下文 */
export interface DecisionContext {
  energy: number;
  mood: number;
  health: number;
  hunger: number;
  timeOfDay?: string;
  nearbyCitizens?: number;
  resourceAvailability?: number;
}

/**
 * 元认知决策映射器
 * 负责将元认知结果转换为决策权重
 */
export class MetaCognitionDecisionMapper {
  private valueMappings: ValueActionMapping[];
  private goalMappings: GoalActionMapping[];
  private reflectionInfluence: ReflectionInfluence;
  private actionHistory: Map<string, { successes: number; failures: number; lastOutcome: string }> = new Map();
  private recentInsights: string[] = [];
  private insightActionMap: Map<string, DecisionAction[]> = new Map([
    ['能量', ['rest']],
    ['休息', ['rest']],
    ['社交', ['socialize']],
    ['探索', ['explore']],
    ['工作', ['work']],
    ['学习', ['learn']],
    ['健康', ['rest']],
    ['情绪', ['socialize', 'rest']],
  ]);

  constructor(config?: {
    valueMappings?: ValueActionMapping[];
    goalMappings?: GoalActionMapping[];
    reflectionInfluence?: Partial<ReflectionInfluence>;
  }) {
    this.valueMappings = config?.valueMappings || DEFAULT_VALUE_ACTION_MAPPINGS;
    this.goalMappings = config?.goalMappings || DEFAULT_GOAL_ACTION_MAPPINGS;
    this.reflectionInfluence = {
      ...DEFAULT_REFLECTION_INFLUENCE,
      ...config?.reflectionInfluence,
    };
    this.initializeActionHistory();
  }

  private initializeActionHistory(): void {
    const actions: DecisionAction[] = ['work', 'rest', 'socialize', 'explore', 'migrate', 'learn', 'create', 'trade'];
    for (const action of actions) {
      this.actionHistory.set(action, { successes: 0, failures: 0, lastOutcome: 'neutral' });
    }
  }

  public computeDecisionWeights(
    values: ValueSystem,
    goals: Goal[],
    reflections: Reflection[],
    metaState: MetaCognitionState,
    context: DecisionContext
  ): MetaCognitionInfluence {
    const baseWeights = this.computeBaseWeights(context);
    const valueAdjustedWeights = this.applyValueInfluence(baseWeights, values, metaState);
    const goalAdjustedWeights = this.applyGoalInfluence(valueAdjustedWeights, goals, metaState);
    const reflectionAdjustedWeights = this.applyReflectionInfluence(goalAdjustedWeights, reflections);
    const finalWeights = this.applySelfAwarenessModifier(reflectionAdjustedWeights, metaState);
    const dominantValue = this.getDominantValue(values);
    const activeGoalInfluence = this.getActiveGoalInfluence(goals);
    const reflectionInsights = this.extractRecentInsights(reflections);
    const selfAwarenessModifier = this.computeSelfAwarenessModifier(metaState);
    return {
      baseWeights,
      valueAdjustedWeights,
      goalAdjustedWeights,
      reflectionAdjustedWeights,
      finalWeights,
      dominantValue,
      activeGoalInfluence,
      reflectionInsights,
      selfAwarenessModifier,
    };
  }

  private computeBaseWeights(context: DecisionContext): DecisionWeights {
    const { energy, mood, health, hunger } = context;
    const energyFactor = energy / 100;
    const moodFactor = mood / 100;
    const healthFactor = health / 100;
    const hungerFactor = hunger / 100;
    const weights: DecisionWeights = {
      work: energyFactor * 0.4 + healthFactor * 0.2,
      rest: (1 - energyFactor) * 0.5 + (1 - healthFactor) * 0.3,
      socialize: moodFactor * 0.4 + energyFactor * 0.2,
      explore: energyFactor * 0.3 + hungerFactor * 0.2,
      migrate: (1 - moodFactor) * 0.3 + (1 - healthFactor) * 0.2,
      learn: energyFactor * 0.25 + moodFactor * 0.15,
      create: energyFactor * 0.3 + moodFactor * 0.2,
      trade: moodFactor * 0.25 + energyFactor * 0.15,
    };
    return this.normalizeWeights(weights);
  }

  private applyValueInfluence(
    baseWeights: DecisionWeights,
    values: ValueSystem,
    metaState: MetaCognitionState
  ): DecisionWeights {
    const weights = { ...baseWeights };
    const valueAlignmentBonus = metaState.valueAlignment * 0.2;
    for (const mapping of this.valueMappings) {
      const valueScore = values[mapping.valueKey];
      const influence = valueScore * mapping.weight * (1 + valueAlignmentBonus);
      if (weights[mapping.action] !== undefined) {
        weights[mapping.action] += influence;
      }
    }
    return this.normalizeWeights(weights);
  }

  private applyGoalInfluence(
    weights: DecisionWeights,
    goals: Goal[],
    metaState: MetaCognitionState
  ): DecisionWeights {
    const adjustedWeights = { ...weights };
    const activeGoals = goals.filter(
      g => g.status === GoalStatus.IN_PROGRESS || g.status === GoalStatus.PENDING
    );
    for (const goal of activeGoals) {
      const mapping = this.goalMappings.find(m => m.goalCategory === goal.category);
      if (!mapping) continue;
      if (goal.priority < mapping.priorityThreshold) continue;
      const progressFactor = 1 - goal.progress * 0.5;
      const urgencyFactor = this.computeUrgencyFactor(goal);
      const totalMultiplier = mapping.weightMultiplier * progressFactor * urgencyFactor * (1 + metaState.metaActivity * 0.3);
      for (const action of mapping.preferredActions) {
        if (adjustedWeights[action] !== undefined) {
          adjustedWeights[action] *= totalMultiplier;
        }
      }
    }
    return this.normalizeWeights(adjustedWeights);
  }

  private computeUrgencyFactor(goal: Goal): number {
    if (!goal.targetDate) return 1;
    const now = Date.now();
    const timeRemaining = goal.targetDate - now;
    const totalDuration = goal.targetDate - goal.createdAt;
    if (timeRemaining <= 0) return 2.0;
    const progressRate = goal.progress / (1 - timeRemaining / totalDuration);
    if (progressRate < 0.5) return 1.5;
    return 1;
  }

  private applyReflectionInfluence(
    weights: DecisionWeights,
    reflections: Reflection[]
  ): DecisionWeights {
    const adjustedWeights = { ...weights };
    if (reflections.length === 0) return adjustedWeights;
    const recentReflections = reflections.slice(-5);
    for (const reflection of recentReflections) {
      const action = reflection.context.action as DecisionAction;
      if (!adjustedWeights[action]) continue;
      const history = this.actionHistory.get(action);
      if (!history) continue;
      if (reflection.context.outcome === 'positive') {
        adjustedWeights[action] += this.reflectionInfluence.successActionBoost;
        history.successes++;
        history.lastOutcome = 'positive';
      } else if (reflection.context.outcome === 'negative') {
        adjustedWeights[action] -= this.reflectionInfluence.failureActionPenalty;
        history.failures++;
        history.lastOutcome = 'negative';
      }
      for (const insight of reflection.insights) {
        this.applyInsightToWeights(adjustedWeights, insight);
      }
    }
    return this.normalizeWeights(adjustedWeights);
  }

  private applyInsightToWeights(weights: DecisionWeights, insight: string): void {
    for (const [keyword, actions] of this.insightActionMap) {
      if (insight.includes(keyword)) {
        for (const action of actions) {
          if (weights[action] !== undefined) {
            weights[action] += this.reflectionInfluence.insightWeight;
          }
        }
      }
    }
  }

  private applySelfAwarenessModifier(
    weights: DecisionWeights,
    metaState: MetaCognitionState
  ): DecisionWeights {
    const adjustedWeights = { ...weights };
    const selfAwarenessFactor = metaState.selfAwareness;
    const reflectionDepthFactor = metaState.reflectionDepth;
    const cognitiveLoadPenalty = metaState.cognitiveLoad * 0.3;
    const maxWeight = Math.max(...Object.values(weights));
    const minWeight = Math.min(...Object.values(weights));
    const weightRange = maxWeight - minWeight;
    if (selfAwarenessFactor > 0.6 && weightRange > 0.1) {
      for (const action of Object.keys(adjustedWeights)) {
        const normalizedWeight = (adjustedWeights[action] - minWeight) / weightRange;
        const adjustment = (normalizedWeight - 0.5) * selfAwarenessFactor * 0.2;
        adjustedWeights[action] += adjustment;
      }
    }
    if (reflectionDepthFactor > 0.5) {
      const dominantAction = Object.entries(weights).sort((a, b) => b[1] - a[1])[0][0];
      adjustedWeights[dominantAction] *= 1 + reflectionDepthFactor * 0.1;
    }
    if (cognitiveLoadPenalty > 0) {
      for (const action of Object.keys(adjustedWeights)) {
        adjustedWeights[action] *= 1 - cognitiveLoadPenalty * 0.5;
      }
    }
    return this.normalizeWeights(adjustedWeights);
  }

  private normalizeWeights(weights: DecisionWeights): DecisionWeights {
    const total = Object.values(weights).reduce((sum, w) => sum + Math.max(0, w), 0);
    if (total === 0) {
      const count = Object.keys(weights).length;
      for (const key of Object.keys(weights)) {
        weights[key] = 1 / count;
      }
      return weights;
    }
    for (const key of Object.keys(weights)) {
      weights[key] = Math.max(0, weights[key]) / total;
    }
    return weights;
  }

  private getDominantValue(values: ValueSystem): string {
    let maxValue = 0;
    let dominantKey = 'survival';
    for (const [key, value] of Object.entries(values)) {
      if (value > maxValue) {
        maxValue = value;
        dominantKey = key;
      }
    }
    return dominantKey;
  }

  private getActiveGoalInfluence(goals: Goal[]): string[] {
    return goals
      .filter(g => g.status === GoalStatus.IN_PROGRESS || g.status === GoalStatus.PENDING)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
      .map(g => `${g.category}:${(g.progress * 100).toFixed(0)}%`);
  }

  private extractRecentInsights(reflections: Reflection[]): string[] {
    const insights: string[] = [];
    for (const reflection of reflections.slice(-3)) {
      insights.push(...reflection.insights.slice(0, 2));
    }
    return insights.slice(0, 6);
  }

  private computeSelfAwarenessModifier(metaState: MetaCognitionState): number {
    return (
      metaState.selfAwareness * 0.4 +
      metaState.reflectionDepth * 0.3 +
      metaState.valueAlignment * 0.2 +
      metaState.metaActivity * 0.1
    );
  }

  public selectAction(weights: DecisionWeights): DecisionAction {
    const random = Math.random();
    let cumulative = 0;
    for (const [action, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return action as DecisionAction;
      }
    }
    const actions = Object.keys(weights) as DecisionAction[];
    return actions[actions.length - 1];
  }

  public updateActionOutcome(action: DecisionAction, outcome: 'positive' | 'negative' | 'neutral'): void {
    const history = this.actionHistory.get(action);
    if (!history) return;
    if (outcome === 'positive') {
      history.successes++;
    } else if (outcome === 'negative') {
      history.failures++;
    }
    history.lastOutcome = outcome;
  }

  public getActionStatistics(): Map<string, { successRate: number; totalAttempts: number }> {
    const stats = new Map<string, { successRate: number; totalAttempts: number }>();
    for (const [action, history] of this.actionHistory) {
      const total = history.successes + history.failures;
      stats.set(action, {
        successRate: total > 0 ? history.successes / total : 0.5,
        totalAttempts: total,
      });
    }
    return stats;
  }

  public computeGoalDrivenAction(
    goals: Goal[],
    context: DecisionContext
  ): { action: DecisionAction; reason: string; goalMatch: string | null } {
    const activeGoals = goals
      .filter(g => g.status === GoalStatus.IN_PROGRESS || g.status === GoalStatus.PENDING)
      .sort((a, b) => b.priority - a.priority);
    if (activeGoals.length === 0) {
      return {
        action: this.selectAction(this.computeBaseWeights(context)),
        reason: '无活跃目标，基于状态决策',
        goalMatch: null,
      };
    }
    const topGoal = activeGoals[0];
    const mapping = this.goalMappings.find(m => m.goalCategory === topGoal.category);
    if (!mapping) {
      return {
        action: this.selectAction(this.computeBaseWeights(context)),
        reason: `目标"${topGoal.description}"无匹配行动`,
        goalMatch: topGoal.category,
      };
    }
    const preferredActions = mapping.preferredActions;
    const contextEnergy = context.energy / 100;
    const contextMood = context.mood / 100;
    let selectedAction: DecisionAction;
    let reason: string;
    if (topGoal.progress < 0.3 && contextEnergy > 0.4) {
      selectedAction = preferredActions[0];
      reason = `目标"${topGoal.description}"进度较低，优先执行主要行动`;
    } else if (topGoal.progress > 0.7) {
      selectedAction = preferredActions[preferredActions.length - 1] || preferredActions[0];
      reason = `目标"${topGoal.description}"接近完成，执行辅助行动`;
    } else if (contextMood < 0.3) {
      const restAction = preferredActions.includes('rest') ? 'rest' : 'socialize';
      selectedAction = preferredActions.includes(restAction) ? restAction : preferredActions[0];
      reason = `心情低落，调整行动以恢复状态`;
    } else {
      const randomIndex = Math.floor(Math.random() * preferredActions.length);
      selectedAction = preferredActions[randomIndex];
      reason = `执行目标"${topGoal.description}"相关行动`;
    }
    return {
      action: selectedAction,
      reason,
      goalMatch: topGoal.category,
    };
  }

  public computeValueDrivenAdjustment(
    values: ValueSystem,
    currentAction: DecisionAction,
    metaState: MetaCognitionState
  ): { adjusted: boolean; newAction: DecisionAction; reason: string } {
    const dominantValue = this.getDominantValue(values);
    const relevantMappings = this.valueMappings.filter(m => m.valueKey === dominantValue);
    const valueAlignedActions = relevantMappings.map(m => m.action);
    if (valueAlignedActions.includes(currentAction)) {
      return {
        adjusted: false,
        newAction: currentAction,
        reason: '当前行动与主导价值观一致',
      };
    }
    if (metaState.selfAwareness > 0.6 && metaState.valueAlignment > 0.5) {
      const bestAlignedAction = valueAlignedActions[0];
      return {
        adjusted: true,
        newAction: bestAlignedAction,
        reason: `高自我意识促使行动向价值观"${dominantValue}"对齐`,
      };
    }
    return {
      adjusted: false,
      newAction: currentAction,
      reason: '自我意识或价值观一致性不足，保持原行动',
    };
  }

  public exportState(): {
    actionHistory: Array<[string, { successes: number; failures: number; lastOutcome: string }]>;
    recentInsights: string[];
  } {
    return {
      actionHistory: Array.from(this.actionHistory.entries()),
      recentInsights: this.recentInsights,
    };
  }

  public importState(data: {
    actionHistory?: Array<[string, { successes: number; failures: number; lastOutcome: string }]>;
    recentInsights?: string[];
  }): void {
    if (data.actionHistory) {
      this.actionHistory = new Map(data.actionHistory);
    }
    if (data.recentInsights) {
      this.recentInsights = data.recentInsights;
    }
  }
}

export const metaCognitionDecisionMapper = new MetaCognitionDecisionMapper();

export default MetaCognitionDecisionMapper;
