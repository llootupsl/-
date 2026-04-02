/**
 * =============================================================================
 * 元认知引擎
 * Meta-Cognition Engine
 * 实现市民的自我反思、价值观调整、目标设定和内省报告
 * =============================================================================
 */

/** 元认知状态 */
export interface MetaCognitionState {
  /** 自我意识程度 (0-1) */
  selfAwareness: number;
  /** 反思深度 (0-1) */
  reflectionDepth: number;
  /** 价值观一致性 (0-1) */
  valueAlignment: number;
  /** 认知负荷 (0-1) */
  cognitiveLoad: number;
  /** 元认知活跃度 (0-1) */
  metaActivity: number;
}

/** 价值观体系 */
export interface ValueSystem {
  /** 生存价值观 */
  survival: number;
  /** 社交价值观 */
  social: number;
  /** 成就价值观 */
  achievement: number;
  /** 探索价值观 */
  exploration: number;
  /** 安全价值观 */
  security: number;
  /** 自主价值观 */
  autonomy: number;
  /** 权力价值观 */
  power: number;
  /** 和谐价值观 */
  harmony: number;
}

/** 目标类型 */
export enum GoalType {
  SHORT_TERM = 'short_term',
  MEDIUM_TERM = 'medium_term',
  LONG_TERM = 'long_term',
  LIFE_GOAL = 'life_goal',
}

/** 目标状态 */
export enum GoalStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  FAILED = 'failed',
}

/** 目标 */
export interface Goal {
  id: string;
  type: GoalType;
  category: string;
  description: string;
  priority: number;
  progress: number;
  status: GoalStatus;
  createdAt: number;
  targetDate?: number;
  completedAt?: number;
  subGoals: string[];
  parentGoal?: string;
  metrics: GoalMetric[];
}

/** 目标度量 */
export interface GoalMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  weight: number;
}

/** 反思记录 */
export interface Reflection {
  id: string;
  timestamp: number;
  triggerType: 'decision' | 'event' | 'periodic' | 'milestone' | 'failure';
  context: ReflectionContext;
  analysis: ReflectionAnalysis;
  insights: string[];
  valueChanges: ValueChange[];
  goalsAffected: string[];
}

/** 反思上下文 */
export interface ReflectionContext {
  decisionId?: string;
  action: string;
  outcome: 'positive' | 'negative' | 'neutral' | 'mixed';
  expectedOutcome: string;
  actualOutcome: string;
  emotionalState: {
    before: number;
    after: number;
  };
  energyState: {
    before: number;
    after: number;
  };
  environmentalFactors: string[];
}

/** 反思分析 */
export interface ReflectionAnalysis {
  successFactors: string[];
  failureFactors: string[];
  alternativeActions: string[];
  lessonsLearned: string[];
  confidenceLevel: number;
  attributionStyle: 'internal' | 'external' | 'mixed';
}

/** 价值观变化 */
export interface ValueChange {
  valueName: string;
  previousValue: number;
  newValue: number;
  reason: string;
  confidence: number;
}

/** 内省报告 */
export interface IntrospectionReport {
  timestamp: number;
  selfPerception: SelfPerception;
  valueAssessment: ValueAssessment;
  goalProgress: GoalProgressReport;
  emotionalPatterns: EmotionalPattern[];
  behavioralTendencies: BehavioralTendency[];
  recommendations: string[];
  metaCognitiveScore: number;
}

/** 自我感知 */
export interface SelfPerception {
  strengths: string[];
  weaknesses: string[];
  currentRole: string;
  desiredRole: string;
  identityCoherence: number;
  selfEfficacy: number;
}

/** 价值观评估 */
export interface ValueAssessment {
  dominantValues: string[];
  conflictingValues: Array<{ value1: string; value2: string; conflict: number }>;
  valueSatisfaction: Record<string, number>;
  valueStability: number;
}

/** 目标进度报告 */
export interface GoalProgressReport {
  activeGoals: number;
  completedGoals: number;
  failedGoals: number;
  averageProgress: number;
  goalAlignment: number;
  priorityDistribution: Record<string, number>;
}

/** 情绪模式 */
export interface EmotionalPattern {
  pattern: string;
  frequency: number;
  triggers: string[];
  intensity: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

/** 行为倾向 */
export interface BehavioralTendency {
  behavior: string;
  frequency: number;
  successRate: number;
  contextPreference: string[];
  adaptability: number;
}

/** 决策评估结果 */
export interface DecisionEvaluation {
  decisionId: string;
  overallScore: number;
  outcomeQuality: number;
  processQuality: number;
  learningValue: number;
  emotionalImpact: number;
  resourceEfficiency: number;
  recommendations: string[];
}

/** 元认知配置 */
export interface MetaCognitionConfig {
  reflectionFrequency: number;
  maxReflections: number;
  maxGoals: number;
  valueAdjustmentRate: number;
  selfAwarenessGrowthRate: number;
  cognitiveLoadThreshold: number;
}

/** 默认配置 */
const DEFAULT_CONFIG: MetaCognitionConfig = {
  reflectionFrequency: 0.1,
  maxReflections: 50,
  maxGoals: 20,
  valueAdjustmentRate: 0.05,
  selfAwarenessGrowthRate: 0.001,
  cognitiveLoadThreshold: 0.8,
};

/**
 * 元认知引擎
 * 负责市民的自我反思、价值观调整、目标设定和内省报告
 */
export class MetaCognitionEngine {
  private state: MetaCognitionState;
  private values: ValueSystem;
  private goals: Map<string, Goal> = new Map();
  private reflections: Reflection[] = [];
  private config: MetaCognitionConfig;
  private decisionHistory: Array<{
    id: string;
    action: string;
    timestamp: number;
    context: any;
    outcome?: any;
  }> = [];
  private introspectionHistory: IntrospectionReport[] = [];
  private lastReflectionTime: number = 0;
  private valueChangeHistory: ValueChange[] = [];

  constructor(config: Partial<MetaCognitionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.initializeState();
    this.values = this.initializeValues();
  }

  /**
   * 初始化元认知状态
   */
  private initializeState(): MetaCognitionState {
    return {
      selfAwareness: 0.3 + Math.random() * 0.2,
      reflectionDepth: 0.2 + Math.random() * 0.2,
      valueAlignment: 0.5 + Math.random() * 0.2,
      cognitiveLoad: 0,
      metaActivity: 0.1,
    };
  }

  /**
   * 初始化价值观体系
   */
  private initializeValues(): ValueSystem {
    return {
      survival: 0.7 + Math.random() * 0.3,
      social: 0.3 + Math.random() * 0.4,
      achievement: 0.3 + Math.random() * 0.4,
      exploration: 0.2 + Math.random() * 0.4,
      security: 0.4 + Math.random() * 0.3,
      autonomy: 0.3 + Math.random() * 0.3,
      power: 0.2 + Math.random() * 0.3,
      harmony: 0.3 + Math.random() * 0.3,
    };
  }

  /**
   * 核心方法：执行元认知过程
   */
  public metaCognize(context: {
    citizenState: any;
    recentDecisions: any[];
    environmentalContext?: any;
  }): {
    reflection?: Reflection;
    valueChanges: ValueChange[];
    goalUpdates: Goal[];
    introspection?: IntrospectionReport;
  } {
    this.state.metaActivity = Math.min(1, this.state.metaActivity + 0.1);

    const result = {
      reflection: undefined as Reflection | undefined,
      valueChanges: [] as ValueChange[],
      goalUpdates: [] as Goal[],
      introspection: undefined as IntrospectionReport | undefined,
    };

    if (this.shouldReflect(context)) {
      result.reflection = this.performReflection(context);
      if (result.reflection) {
        result.valueChanges = this.adjustValues(result.reflection);
        this.updateGoalsFromReflection(result.reflection);
      }
    }

    if (this.shouldGenerateIntrospection()) {
      result.introspection = this.generateIntrospectionReport(context);
    }

    result.goalUpdates = this.updateGoalProgress(context);

    this.updateMetaCognitiveState(context);

    return result;
  }

  /**
   * 判断是否应该进行反思
   */
  private shouldReflect(context: {
    citizenState: any;
    recentDecisions: any[];
  }): boolean {
    const timeSinceLastReflection = Date.now() - this.lastReflectionTime;
    const minInterval = 60000 / this.config.reflectionFrequency;

    if (timeSinceLastReflection < minInterval && this.reflections.length > 0) {
      return false;
    }

    if (context.recentDecisions.length > 0) {
      const lastDecision = context.recentDecisions[context.recentDecisions.length - 1];
      if (lastDecision.outcome === 'negative' || lastDecision.confidence < 0.3) {
        return true;
      }
    }

    if (context.citizenState.mood < 30 || context.citizenState.energy < 20) {
      return Math.random() < 0.3;
    }

    return Math.random() < this.state.selfAwareness * this.config.reflectionFrequency;
  }

  /**
   * 判断是否应该生成内省报告
   */
  private shouldGenerateIntrospection(): boolean {
    return this.reflections.length > 0 && 
           this.reflections.length % 5 === 0 &&
           Date.now() - (this.introspectionHistory[this.introspectionHistory.length - 1]?.timestamp || 0) > 300000;
  }

  /**
   * 执行反思过程
   */
  private performReflection(context: {
    citizenState: any;
    recentDecisions: any[];
    environmentalContext?: any;
  }): Reflection {
    this.lastReflectionTime = Date.now();

    const triggerType = this.determineTriggerType(context);
    const reflectionContext = this.buildReflectionContext(context);
    const analysis = this.analyzeReflection(reflectionContext, context);
    const insights = this.generateInsights(analysis, reflectionContext);
    const valueChanges = this.identifyValueChanges(analysis);
    const goalsAffected = this.identifyAffectedGoals(analysis);

    const reflection: Reflection = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      triggerType,
      context: reflectionContext,
      analysis,
      insights,
      valueChanges,
      goalsAffected,
    };

    this.reflections.push(reflection);
    if (this.reflections.length > this.config.maxReflections) {
      this.reflections.shift();
    }

    this.state.reflectionDepth = Math.min(1, this.state.reflectionDepth + 0.02);

    return reflection;
  }

  /**
   * 确定反思触发类型
   */
  private determineTriggerType(context: {
    citizenState: any;
    recentDecisions: any[];
  }): Reflection['triggerType'] {
    if (context.recentDecisions.length > 0) {
      const lastDecision = context.recentDecisions[context.recentDecisions.length - 1];
      if (lastDecision.outcome === 'negative') return 'failure';
      if (lastDecision.outcome === 'positive') return 'decision';
    }

    if (context.citizenState.mood < 30) return 'event';
    if (Math.random() < 0.1) return 'periodic';

    return 'decision';
  }

  /**
   * 构建反思上下文
   */
  private buildReflectionContext(context: {
    citizenState: any;
    recentDecisions: any[];
    environmentalContext?: any;
  }): ReflectionContext {
    const lastDecision = context.recentDecisions[context.recentDecisions.length - 1];

    return {
      decisionId: lastDecision?.id,
      action: lastDecision?.action || 'unknown',
      outcome: this.evaluateOutcome(lastDecision, context.citizenState),
      expectedOutcome: lastDecision?.expectedOutcome || 'unknown',
      actualOutcome: this.describeActualOutcome(lastDecision, context.citizenState),
      emotionalState: {
        before: lastDecision?.moodBefore || context.citizenState.mood,
        after: context.citizenState.mood,
      },
      energyState: {
        before: lastDecision?.energyBefore || context.citizenState.energy,
        after: context.citizenState.energy,
      },
      environmentalFactors: this.extractEnvironmentalFactors(context.environmentalContext),
    };
  }

  /**
   * 评估结果
   */
  private evaluateOutcome(decision: any, state: any): ReflectionContext['outcome'] {
    if (!decision) return 'neutral';

    const moodChange = state.mood - (decision.moodBefore || state.mood);
    const energyChange = state.energy - (decision.energyBefore || state.energy);

    const score = moodChange * 0.5 + energyChange * 0.3 + (decision.confidence || 0.5) * 0.2;

    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    if (Math.abs(score) < 0.1) return 'neutral';
    return 'mixed';
  }

  /**
   * 描述实际结果
   */
  private describeActualOutcome(decision: any, state: any): string {
    if (!decision) return '无决策记录';

    const parts: string[] = [];
    parts.push(`执行了${decision.action}行动`);

    if (state.mood > (decision.moodBefore || state.mood)) {
      parts.push('心情有所改善');
    } else if (state.mood < (decision.moodBefore || state.mood)) {
      parts.push('心情有所下降');
    }

    if (state.energy > (decision.energyBefore || state.energy)) {
      parts.push('能量得到恢复');
    } else if (state.energy < (decision.energyBefore || state.energy)) {
      parts.push('消耗了能量');
    }

    return parts.join('，');
  }

  /**
   * 提取环境因素
   */
  private extractEnvironmentalFactors(envContext: any): string[] {
    const factors: string[] = [];

    if (!envContext) return factors;

    if (envContext.timeOfDay) {
      factors.push(`时段: ${envContext.timeOfDay}`);
    }
    if (envContext.nearbyCitizens > 0) {
      factors.push(`附近有${envContext.nearbyCitizens}人`);
    }
    if (envContext.resourceAvailability !== undefined) {
      factors.push(`资源可用性: ${envContext.resourceAvailability > 0.5 ? '充足' : '匮乏'}`);
    }

    return factors;
  }

  /**
   * 分析反思
   */
  private analyzeReflection(
    reflectionContext: ReflectionContext,
    context: any
  ): ReflectionAnalysis {
    const successFactors: string[] = [];
    const failureFactors: string[] = [];
    const alternativeActions: string[] = [];
    const lessonsLearned: string[] = [];

    if (reflectionContext.outcome === 'positive' || reflectionContext.outcome === 'mixed') {
      if (reflectionContext.emotionalState.after > reflectionContext.emotionalState.before) {
        successFactors.push('情绪管理得当');
      }
      if (reflectionContext.energyState.after >= reflectionContext.energyState.before * 0.8) {
        successFactors.push('能量分配合理');
      }
      lessonsLearned.push(`${reflectionContext.action}行动在当前情况下是有效的`);
    }

    if (reflectionContext.outcome === 'negative' || reflectionContext.outcome === 'mixed') {
      if (reflectionContext.emotionalState.after < reflectionContext.emotionalState.before) {
        failureFactors.push('情绪受到负面影响');
      }
      if (reflectionContext.energyState.after < reflectionContext.energyState.before * 0.5) {
        failureFactors.push('能量消耗过大');
      }

      alternativeActions.push('考虑休息恢复能量');
      alternativeActions.push('寻求社交支持');
      alternativeActions.push('调整行动策略');
    }

    const confidenceLevel = this.calculateReflectionConfidence(reflectionContext);
    const attributionStyle = this.determineAttributionStyle(reflectionContext, context);

    return {
      successFactors,
      failureFactors,
      alternativeActions,
      lessonsLearned,
      confidenceLevel,
      attributionStyle,
    };
  }

  /**
   * 计算反思置信度
   */
  private calculateReflectionConfidence(context: ReflectionContext): number {
    let confidence = 0.5;

    if (context.emotionalState.before !== context.emotionalState.after) {
      confidence += 0.1;
    }
    if (context.energyState.before !== context.energyState.after) {
      confidence += 0.1;
    }
    if (context.environmentalFactors.length > 0) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  /**
   * 确定归因风格
   */
  private determineAttributionStyle(
    context: ReflectionContext,
    fullContext: any
  ): ReflectionAnalysis['attributionStyle'] {
    const environmentalInfluence = context.environmentalFactors.length > 2;
    const personalInfluence = context.emotionalState.before !== context.emotionalState.after;

    if (environmentalInfluence && personalInfluence) return 'mixed';
    if (environmentalInfluence) return 'external';
    return 'internal';
  }

  /**
   * 生成洞察
   */
  private generateInsights(analysis: ReflectionAnalysis, context: ReflectionContext): string[] {
    const insights: string[] = [];

    if (analysis.successFactors.length > 0) {
      insights.push(`成功因素: ${analysis.successFactors.join('、')}`);
    }

    if (analysis.failureFactors.length > 0) {
      insights.push(`需要改进: ${analysis.failureFactors.join('、')}`);
    }

    if (context.emotionalState.after < 30) {
      insights.push('当前情绪状态较低，需要关注心理健康');
    }

    if (context.energyState.after < 20) {
      insights.push('能量不足，应优先休息恢复');
    }

    if (analysis.attributionStyle === 'external') {
      insights.push('外部环境影响较大，需要增强适应能力');
    }

    return insights;
  }

  /**
   * 识别价值观变化
   */
  private identifyValueChanges(analysis: ReflectionAnalysis): ValueChange[] {
    const changes: ValueChange[] = [];

    for (const factor of analysis.failureFactors) {
      if (factor.includes('能量')) {
        changes.push({
          valueName: 'survival',
          previousValue: this.values.survival,
          newValue: Math.min(1, this.values.survival + 0.05),
          reason: '能量管理失败，提高生存价值观优先级',
          confidence: 0.7,
        });
      }

      if (factor.includes('情绪')) {
        changes.push({
          valueName: 'harmony',
          previousValue: this.values.harmony,
          newValue: Math.min(1, this.values.harmony + 0.03),
          reason: '情绪受影响，重视内心和谐',
          confidence: 0.6,
        });
      }
    }

    for (const factor of analysis.successFactors) {
      if (factor.includes('社交') || factor.includes('情绪管理')) {
        changes.push({
          valueName: 'social',
          previousValue: this.values.social,
          newValue: Math.min(1, this.values.social + 0.02),
          reason: '社交策略有效',
          confidence: 0.8,
        });
      }
    }

    return changes;
  }

  /**
   * 识别受影响的目标
   */
  private identifyAffectedGoals(analysis: ReflectionAnalysis): string[] {
    const affectedIds: string[] = [];

    for (const [id, goal] of this.goals) {
      if (goal.status !== GoalStatus.IN_PROGRESS) continue;

      const isRelevant = analysis.lessonsLearned.some(lesson =>
        lesson.toLowerCase().includes(goal.category.toLowerCase())
      );

      if (isRelevant) {
        affectedIds.push(id);
      }
    }

    return affectedIds;
  }

  /**
   * 调整价值观
   */
  public adjustValues(reflection: Reflection): ValueChange[] {
    const appliedChanges: ValueChange[] = [];

    for (const change of reflection.valueChanges) {
      const valueKey = change.valueName as keyof ValueSystem;
      if (valueKey in this.values) {
        const oldValue = this.values[valueKey];
        const adjustment = (change.newValue - change.previousValue) * 
                          this.config.valueAdjustmentRate * 
                          change.confidence;

        this.values[valueKey] = Math.max(0, Math.min(1, oldValue + adjustment));

        appliedChanges.push({
          ...change,
          previousValue: oldValue,
          newValue: this.values[valueKey],
        });

        this.valueChangeHistory.push(appliedChanges[appliedChanges.length - 1]);
      }
    }

    this.updateValueAlignment();

    return appliedChanges;
  }

  /**
   * 更新价值观一致性
   */
  private updateValueAlignment(): void {
    const valueArray = Object.values(this.values);
    const mean = valueArray.reduce((a, b) => a + b, 0) / valueArray.length;
    const variance = valueArray.reduce((a, b) => a + (b - mean) ** 2, 0) / valueArray.length;

    this.state.valueAlignment = Math.max(0, 1 - Math.sqrt(variance) * 2);
  }

  /**
   * 设定目标
   */
  public setGoal(
    type: GoalType,
    category: string,
    description: string,
    priority: number,
    targetDate?: number,
    parentGoalId?: string
  ): Goal {
    if (this.goals.size >= this.config.maxGoals) {
      this.pruneGoals();
    }

    const goal: Goal = {
      id: crypto.randomUUID(),
      type,
      category,
      description,
      priority: Math.max(0, Math.min(1, priority)),
      progress: 0,
      status: GoalStatus.PENDING,
      createdAt: Date.now(),
      targetDate,
      subGoals: [],
      parentGoal: parentGoalId,
      metrics: [],
    };

    if (parentGoalId && this.goals.has(parentGoalId)) {
      const parent = this.goals.get(parentGoalId)!;
      parent.subGoals.push(goal.id);
    }

    this.goals.set(goal.id, goal);

    return goal;
  }

  /**
   * 修剪目标（移除低优先级或已放弃的目标）
   */
  private pruneGoals(): void {
    const goalsToRemove: string[] = [];

    for (const [id, goal] of this.goals) {
      if (goal.status === GoalStatus.ABANDONED || goal.status === GoalStatus.FAILED) {
        goalsToRemove.push(id);
      } else if (goal.status === GoalStatus.COMPLETED && Date.now() - (goal.completedAt || 0) > 86400000) {
        goalsToRemove.push(id);
      }
    }

    if (goalsToRemove.length === 0) {
      let lowestPriority = Infinity;
      let lowestId = '';
      for (const [id, goal] of this.goals) {
        if (goal.priority < lowestPriority && goal.status === GoalStatus.PENDING) {
          lowestPriority = goal.priority;
          lowestId = id;
        }
      }
      if (lowestId) {
        goalsToRemove.push(lowestId);
      }
    }

    for (const id of goalsToRemove) {
      this.goals.delete(id);
    }
  }

  /**
   * 更新目标进度
   */
  private updateGoalProgress(context: { citizenState: any; recentDecisions: any[] }): Goal[] {
    const updatedGoals: Goal[] = [];

    for (const [id, goal] of this.goals) {
      if (goal.status !== GoalStatus.IN_PROGRESS && goal.status !== GoalStatus.PENDING) {
        continue;
      }

      const progressDelta = this.calculateGoalProgress(goal, context);
      goal.progress = Math.min(1, goal.progress + progressDelta);

      if (goal.progress >= 1) {
        goal.status = GoalStatus.COMPLETED;
        goal.completedAt = Date.now();
        this.state.selfAwareness = Math.min(1, 
          this.state.selfAwareness + this.config.selfAwarenessGrowthRate * 2
        );
      } else if (goal.progress > 0) {
        goal.status = GoalStatus.IN_PROGRESS;
      }

      if (goal.targetDate && Date.now() > goal.targetDate && goal.progress < 1) {
        goal.status = GoalStatus.FAILED;
      }

      updatedGoals.push(goal);
    }

    return updatedGoals;
  }

  /**
   * 计算目标进度增量
   */
  private calculateGoalProgress(goal: Goal, context: { citizenState: any; recentDecisions: any[] }): number {
    let progress = 0;

    for (const decision of context.recentDecisions) {
      if (this.isDecisionRelevantToGoal(decision, goal)) {
        progress += 0.05 * decision.confidence;
      }
    }

    switch (goal.category) {
      case 'health':
        if (context.citizenState.health > 80) progress += 0.02;
        break;
      case 'social':
        if (context.recentDecisions.some(d => d.action === 'socialize')) progress += 0.03;
        break;
      case 'exploration':
        if (context.recentDecisions.some(d => d.action === 'explore')) progress += 0.03;
        break;
      case 'work':
        if (context.recentDecisions.some(d => d.action === 'work')) progress += 0.03;
        break;
    }

    return progress;
  }

  /**
   * 判断决策是否与目标相关
   */
  private isDecisionRelevantToGoal(decision: any, goal: Goal): boolean {
    const actionGoalMap: Record<string, string[]> = {
      work: ['work', 'achievement', 'power'],
      rest: ['health', 'survival'],
      socialize: ['social', 'harmony'],
      explore: ['exploration', 'autonomy'],
      migrate: ['exploration', 'autonomy', 'survival'],
    };

    const relevantGoals = actionGoalMap[decision.action] || [];
    return relevantGoals.includes(goal.category);
  }

  /**
   * 从反思更新目标
   */
  private updateGoalsFromReflection(reflection: Reflection): void {
    for (const goalId of reflection.goalsAffected) {
      const goal = this.goals.get(goalId);
      if (!goal) continue;

      if (reflection.context.outcome === 'positive') {
        goal.progress = Math.min(1, goal.progress + 0.05);
      } else if (reflection.context.outcome === 'negative') {
        goal.priority = Math.max(0, goal.priority - 0.1);
      }
    }

    for (const insight of reflection.insights) {
      if (insight.includes('能量') && insight.includes('不足')) {
        if (!this.hasActiveGoalInCategory('health')) {
          this.setGoal(GoalType.SHORT_TERM, 'health', '恢复能量和健康', 0.8);
        }
      }
    }
  }

  /**
   * 检查是否有活跃目标在指定类别
   */
  private hasActiveGoalInCategory(category: string): boolean {
    for (const goal of this.goals.values()) {
      if (goal.category === category && 
          (goal.status === GoalStatus.PENDING || goal.status === GoalStatus.IN_PROGRESS)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 生成内省报告
   */
  public generateIntrospectionReport(context: {
    citizenState: any;
    recentDecisions: any[];
  }): IntrospectionReport {
    const report: IntrospectionReport = {
      timestamp: Date.now(),
      selfPerception: this.generateSelfPerception(context),
      valueAssessment: this.assessValues(),
      goalProgress: this.generateGoalProgressReport(),
      emotionalPatterns: this.analyzeEmotionalPatterns(),
      behavioralTendencies: this.analyzeBehavioralTendencies(context),
      recommendations: this.generateRecommendations(context),
      metaCognitiveScore: this.calculateMetaCognitiveScore(),
    };

    this.introspectionHistory.push(report);
    if (this.introspectionHistory.length > 20) {
      this.introspectionHistory.shift();
    }

    return report;
  }

  /**
   * 生成自我感知
   */
  private generateSelfPerception(context: { citizenState: any }): SelfPerception {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (context.citizenState.energy > 70) strengths.push('精力充沛');
    if (context.citizenState.mood > 70) strengths.push('情绪稳定');
    if (context.citizenState.health > 80) strengths.push('身体健康');

    if (context.citizenState.energy < 30) weaknesses.push('精力不足');
    if (context.citizenState.mood < 30) weaknesses.push('情绪低落');
    if (context.citizenState.health < 50) weaknesses.push('健康状况欠佳');

    const dominantValue = this.getDominantValue();
    const currentRole = this.inferRole(context, dominantValue);

    return {
      strengths,
      weaknesses,
      currentRole,
      desiredRole: this.inferDesiredRole(dominantValue),
      identityCoherence: this.state.valueAlignment,
      selfEfficacy: this.calculateSelfEfficacy(context),
    };
  }

  /**
   * 获取主导价值观
   */
  private getDominantValue(): string {
    let maxValue = 0;
    let dominantKey = 'survival';

    for (const [key, value] of Object.entries(this.values)) {
      if (value > maxValue) {
        maxValue = value;
        dominantKey = key;
      }
    }

    return dominantKey;
  }

  /**
   * 推断当前角色
   */
  private inferRole(context: any, dominantValue: string): string {
    const roleMap: Record<string, string> = {
      survival: '生存者',
      social: '社交者',
      achievement: '成就者',
      exploration: '探索者',
      security: '守护者',
      autonomy: '独立者',
      power: '领导者',
      harmony: '调和者',
    };

    return roleMap[dominantValue] || '普通市民';
  }

  /**
   * 推断期望角色
   */
  private inferDesiredRole(dominantValue: string): string {
    const aspirationMap: Record<string, string> = {
      survival: '健康长寿者',
      social: '社交达人',
      achievement: '成功人士',
      exploration: '冒险家',
      security: '稳定生活者',
      autonomy: '自由人',
      power: '领袖',
      harmony: '智者',
    };

    return aspirationMap[dominantValue] || '更好的自己';
  }

  /**
   * 计算自我效能感
   */
  private calculateSelfEfficacy(context: { citizenState: any }): number {
    let efficacy = 0.5;

    efficacy += (context.citizenState.energy / 100) * 0.2;
    efficacy += (context.citizenState.mood / 100) * 0.15;
    efficacy += (context.citizenState.health / 100) * 0.15;

    const completedGoals = Array.from(this.goals.values())
      .filter(g => g.status === GoalStatus.COMPLETED).length;
    efficacy += Math.min(0.2, completedGoals * 0.02);

    return Math.min(1, Math.max(0, efficacy));
  }

  /**
   * 评估价值观
   */
  private assessValues(): ValueAssessment {
    const sortedValues = Object.entries(this.values)
      .sort((a, b) => b[1] - a[1]);

    const dominantValues = sortedValues.slice(0, 3).map(([key]) => key);

    const conflictingValues: ValueAssessment['conflictingValues'] = [];
    const conflicts: Array<[string, string]> = [
      ['exploration', 'security'],
      ['autonomy', 'social'],
      ['power', 'harmony'],
    ];

    for (const [v1, v2] of conflicts) {
      if (this.values[v1 as keyof ValueSystem] > 0.6 && 
          this.values[v2 as keyof ValueSystem] > 0.6) {
        conflictingValues.push({
          value1: v1,
          value2: v2,
          conflict: Math.abs(this.values[v1 as keyof ValueSystem] - this.values[v2 as keyof ValueSystem]),
        });
      }
    }

    const valueSatisfaction: Record<string, number> = {};
    for (const [key, value] of Object.entries(this.values)) {
      valueSatisfaction[key] = value * this.state.valueAlignment;
    }

    return {
      dominantValues,
      conflictingValues,
      valueSatisfaction,
      valueStability: 1 - (this.valueChangeHistory.length / 100),
    };
  }

  /**
   * 生成目标进度报告
   */
  private generateGoalProgressReport(): GoalProgressReport {
    const goals = Array.from(this.goals.values());

    const activeGoals = goals.filter(g => 
      g.status === GoalStatus.IN_PROGRESS || g.status === GoalStatus.PENDING
    ).length;

    const completedGoals = goals.filter(g => g.status === GoalStatus.COMPLETED).length;
    const failedGoals = goals.filter(g => g.status === GoalStatus.FAILED).length;

    const averageProgress = goals.length > 0
      ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
      : 0;

    const goalAlignment = this.calculateGoalAlignment();

    const priorityDistribution: Record<string, number> = {
      high: goals.filter(g => g.priority > 0.7).length,
      medium: goals.filter(g => g.priority >= 0.3 && g.priority <= 0.7).length,
      low: goals.filter(g => g.priority < 0.3).length,
    };

    return {
      activeGoals,
      completedGoals,
      failedGoals,
      averageProgress,
      goalAlignment,
      priorityDistribution,
    };
  }

  /**
   * 计算目标一致性
   */
  private calculateGoalAlignment(): number {
    const activeGoals = Array.from(this.goals.values())
      .filter(g => g.status === GoalStatus.IN_PROGRESS || g.status === GoalStatus.PENDING);

    if (activeGoals.length < 2) return 1;

    let alignment = 0;
    for (let i = 0; i < activeGoals.length; i++) {
      for (let j = i + 1; j < activeGoals.length; j++) {
        const categoryMatch = activeGoals[i].category === activeGoals[j].category ? 1 : 0.5;
        alignment += categoryMatch;
      }
    }

    const maxPairs = (activeGoals.length * (activeGoals.length - 1)) / 2;
    return alignment / maxPairs;
  }

  /**
   * 分析情绪模式
   */
  private analyzeEmotionalPatterns(): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];

    if (this.reflections.length < 3) return patterns;

    const recentReflections = this.reflections.slice(-10);
    const positiveCount = recentReflections.filter(r => r.context.outcome === 'positive').length;
    const negativeCount = recentReflections.filter(r => r.context.outcome === 'negative').length;

    if (positiveCount > negativeCount * 2) {
      patterns.push({
        pattern: '积极情绪主导',
        frequency: positiveCount / recentReflections.length,
        triggers: recentReflections
          .filter(r => r.context.outcome === 'positive')
          .map(r => r.context.action)
          .slice(0, 3),
        intensity: 0.7,
        trend: 'stable',
      });
    } else if (negativeCount > positiveCount * 2) {
      patterns.push({
        pattern: '消极情绪主导',
        frequency: negativeCount / recentReflections.length,
        triggers: recentReflections
          .filter(r => r.context.outcome === 'negative')
          .map(r => r.context.action)
          .slice(0, 3),
        intensity: 0.6,
        trend: 'increasing',
      });
    }

    return patterns;
  }

  /**
   * 分析行为倾向
   */
  private analyzeBehavioralTendencies(context: { recentDecisions: any[] }): BehavioralTendency[] {
    const tendencies: BehavioralTendency[] = [];
    const actionCounts: Record<string, { count: number; successCount: number }> = {};

    for (const decision of context.recentDecisions) {
      const action = decision.action;
      if (!actionCounts[action]) {
        actionCounts[action] = { count: 0, successCount: 0 };
      }
      actionCounts[action].count++;
      if (decision.outcome === 'positive') {
        actionCounts[action].successCount++;
      }
    }

    for (const [action, stats] of Object.entries(actionCounts)) {
      tendencies.push({
        behavior: action,
        frequency: stats.count / Math.max(1, context.recentDecisions.length),
        successRate: stats.successCount / Math.max(1, stats.count),
        contextPreference: [],
        adaptability: this.state.selfAwareness,
      });
    }

    return tendencies.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  }

  /**
   * 生成建议
   */
  private generateRecommendations(context: { citizenState: any }): string[] {
    const recommendations: string[] = [];

    if (context.citizenState.energy < 30) {
      recommendations.push('建议优先休息恢复能量');
    }

    if (context.citizenState.mood < 30) {
      recommendations.push('建议进行社交活动改善心情');
    }

    if (context.citizenState.health < 50) {
      recommendations.push('建议关注健康状况，减少消耗性行动');
    }

    const dominantValue = this.getDominantValue();
    if (dominantValue === 'exploration' && context.citizenState.energy > 50) {
      recommendations.push('可以尝试探索新区域');
    }

    if (this.state.valueAlignment < 0.5) {
      recommendations.push('价值观存在冲突，建议进行深度反思');
    }

    return recommendations;
  }

  /**
   * 计算元认知分数
   */
  private calculateMetaCognitiveScore(): number {
    return (
      this.state.selfAwareness * 0.3 +
      this.state.reflectionDepth * 0.25 +
      this.state.valueAlignment * 0.25 +
      this.state.metaActivity * 0.2
    );
  }

  /**
   * 更新元认知状态
   */
  private updateMetaCognitiveState(context: { citizenState: any }): void {
    const energyFactor = context.citizenState.energy / 100;
    const moodFactor = context.citizenState.mood / 100;

    this.state.cognitiveLoad = (1 - energyFactor) * 0.5 + (1 - moodFactor) * 0.3;

    if (this.state.cognitiveLoad > this.config.cognitiveLoadThreshold) {
      this.state.metaActivity = Math.max(0, this.state.metaActivity - 0.1);
    } else {
      this.state.metaActivity = Math.min(1, this.state.metaActivity + 0.02);
    }

    this.state.selfAwareness = Math.min(1, 
      this.state.selfAwareness + this.config.selfAwarenessGrowthRate * this.state.metaActivity
    );
  }

  /**
   * 评估决策
   */
  public evaluateDecision(decision: {
    id: string;
    action: string;
    confidence: number;
    outcome?: any;
    context?: any;
  }): DecisionEvaluation {
    const overallScore = this.calculateDecisionScore(decision);

    return {
      decisionId: decision.id,
      overallScore,
      outcomeQuality: decision.outcome?.quality || 0.5,
      processQuality: decision.confidence,
      learningValue: this.calculateLearningValue(decision),
      emotionalImpact: decision.outcome?.emotionalImpact || 0,
      resourceEfficiency: decision.outcome?.resourceEfficiency || 0.5,
      recommendations: this.generateDecisionRecommendations(decision),
    };
  }

  /**
   * 计算决策分数
   */
  private calculateDecisionScore(decision: any): number {
    let score = 0.5;

    score += decision.confidence * 0.2;

    if (decision.outcome?.quality) {
      score += decision.outcome.quality * 0.3;
    }

    const relevantValue = this.getActionRelevantValue(decision.action);
    if (relevantValue && this.values[relevantValue as keyof ValueSystem] > 0.6) {
      score += 0.1;
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * 获取行动相关的价值观
   */
  private getActionRelevantValue(action: string): string | null {
    const actionValueMap: Record<string, string> = {
      work: 'achievement',
      rest: 'survival',
      socialize: 'social',
      explore: 'exploration',
      migrate: 'autonomy',
    };

    return actionValueMap[action] || null;
  }

  /**
   * 计算学习价值
   */
  private calculateLearningValue(decision: any): number {
    let value = 0.3;

    if (decision.outcome && decision.outcome !== 'expected') {
      value += 0.3;
    }

    if (decision.confidence < 0.5) {
      value += 0.2;
    }

    const recentSimilarDecisions = this.decisionHistory.filter(
      d => d.action === decision.action && Date.now() - d.timestamp < 3600000
    ).length;

    if (recentSimilarDecisions < 3) {
      value += 0.2;
    }

    return Math.min(1, value);
  }

  /**
   * 生成决策建议
   */
  private generateDecisionRecommendations(decision: any): string[] {
    const recommendations: string[] = [];

    if (decision.confidence < 0.5) {
      recommendations.push('决策置信度较低，建议收集更多信息');
    }

    if (decision.outcome?.quality < 0.5) {
      recommendations.push('决策结果不理想，建议反思决策过程');
    }

    return recommendations;
  }

  /**
   * 记录决策
   */
  public recordDecision(decision: {
    id: string;
    action: string;
    context?: any;
    moodBefore?: number;
    energyBefore?: number;
  }): void {
    this.decisionHistory.push({
      id: decision.id,
      action: decision.action,
      timestamp: Date.now(),
      context: decision.context,
    });

    if (this.decisionHistory.length > 100) {
      this.decisionHistory.shift();
    }
  }

  /**
   * 更新决策结果
   */
  public updateDecisionOutcome(decisionId: string, outcome: any): void {
    const decision = this.decisionHistory.find(d => d.id === decisionId);
    if (decision) {
      decision.outcome = outcome;
    }
  }

  /**
   * 获取当前状态
   */
  public getState(): MetaCognitionState {
    return { ...this.state };
  }

  /**
   * 获取价值观体系
   */
  public getValues(): ValueSystem {
    return { ...this.values };
  }

  /**
   * 获取所有目标
   */
  public getGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  /**
   * 获取活跃目标
   */
  public getActiveGoals(): Goal[] {
    return Array.from(this.goals.values()).filter(
      g => g.status === GoalStatus.IN_PROGRESS || g.status === GoalStatus.PENDING
    );
  }

  /**
   * 获取反思历史
   */
  public getReflectionHistory(): Reflection[] {
    return [...this.reflections];
  }

  /**
   * 获取内省历史
   */
  public getIntrospectionHistory(): IntrospectionReport[] {
    return [...this.introspectionHistory];
  }

  /**
   * 获取决策历史
   */
  public getDecisionHistory(): typeof this.decisionHistory {
    return [...this.decisionHistory];
  }

  /**
   * 重置引擎
   */
  public reset(): void {
    this.state = this.initializeState();
    this.values = this.initializeValues();
    this.goals.clear();
    this.reflections = [];
    this.decisionHistory = [];
    this.introspectionHistory = [];
    this.valueChangeHistory = [];
    this.lastReflectionTime = 0;
  }

  /**
   * 导出状态
   */
  public exportState(): {
    state: MetaCognitionState;
    values: ValueSystem;
    goals: Goal[];
    reflections: Reflection[];
    decisionHistory: typeof this.decisionHistory;
  } {
    return {
      state: this.getState(),
      values: this.getValues(),
      goals: this.getGoals(),
      reflections: this.getReflectionHistory(),
      decisionHistory: this.getDecisionHistory(),
    };
  }

  /**
   * 导入状态
   */
  public importState(data: {
    state?: MetaCognitionState;
    values?: ValueSystem;
    goals?: Goal[];
    reflections?: Reflection[];
    decisionHistory?: typeof this.decisionHistory;
  }): void {
    if (data.state) this.state = { ...data.state };
    if (data.values) this.values = { ...data.values };
    if (data.goals) {
      this.goals.clear();
      for (const goal of data.goals) {
        this.goals.set(goal.id, goal);
      }
    }
    if (data.reflections) this.reflections = [...data.reflections];
    if (data.decisionHistory) this.decisionHistory = [...data.decisionHistory];
  }
}

export default MetaCognitionEngine;
