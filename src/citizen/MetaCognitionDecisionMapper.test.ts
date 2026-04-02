/**
 * =============================================================================
 * 元认知决策映射器测试
 * Meta-Cognition Decision Mapper Test
 * =============================================================================
 */

import { MetaCognitionDecisionMapper, DecisionContext } from './MetaCognitionDecisionMapper';
import { ValueSystem, Goal, GoalStatus, MetaCognitionState, Reflection } from './MetaCognitionEngine';

function createTestMapper(): MetaCognitionDecisionMapper {
  return new MetaCognitionDecisionMapper();
}

function createTestValues(): ValueSystem {
  return {
    survival: 0.8,
    social: 0.6,
    achievement: 0.7,
    exploration: 0.5,
    security: 0.6,
    autonomy: 0.4,
    power: 0.3,
    harmony: 0.5,
  };
}

function createTestGoals(): Goal[] {
  return [
    {
      id: 'goal-1',
      type: 'short_term' as any,
      category: 'health',
      description: '恢复健康',
      priority: 0.8,
      progress: 0.3,
      status: GoalStatus.IN_PROGRESS,
      createdAt: Date.now() - 86400000,
      subGoals: [],
      metrics: [],
    },
    {
      id: 'goal-2',
      type: 'medium_term' as any,
      category: 'social',
      description: '建立社交网络',
      priority: 0.6,
      progress: 0.5,
      status: GoalStatus.IN_PROGRESS,
      createdAt: Date.now() - 172800000,
      subGoals: [],
      metrics: [],
    },
  ];
}

function createTestReflections(): Reflection[] {
  return [
    {
      id: 'reflection-1',
      timestamp: Date.now() - 3600000,
      triggerType: 'decision',
      context: {
        action: 'work',
        outcome: 'positive',
        expectedOutcome: '完成工作',
        actualOutcome: '成功完成工作',
        emotionalState: { before: 50, after: 60 },
        energyState: { before: 80, after: 70 },
        environmentalFactors: [],
      },
      analysis: {
        successFactors: ['专注'],
        failureFactors: [],
        alternativeActions: [],
        lessonsLearned: ['工作效率高'],
        confidenceLevel: 0.8,
        attributionStyle: 'internal',
      },
      insights: ['工作带来成就感'],
      valueChanges: [],
      goalsAffected: [],
    },
  ];
}

function createTestMetaState(): MetaCognitionState {
  return {
    selfAwareness: 0.6,
    reflectionDepth: 0.5,
    valueAlignment: 0.7,
    cognitiveLoad: 0.3,
    metaActivity: 0.4,
  };
}

function createTestContext(): DecisionContext {
  return {
    energy: 60,
    mood: 50,
    health: 70,
    hunger: 80,
    timeOfDay: '上午',
    nearbyCitizens: 3,
  };
}

function runTests(): void {
  console.log('=== 元认知决策映射器测试 ===\n');

  const mapper = createTestMapper();
  const values = createTestValues();
  const goals = createTestGoals();
  const reflections = createTestReflections();
  const metaState = createTestMetaState();
  const context = createTestContext();

  console.log('测试1: 计算决策权重');
  const influence = mapper.computeDecisionWeights(values, goals, reflections, metaState, context);
  console.log('基础权重:', influence.baseWeights);
  console.log('价值观调整后:', influence.valueAdjustedWeights);
  console.log('目标调整后:', influence.goalAdjustedWeights);
  console.log('最终权重:', influence.finalWeights);
  console.log('主导价值观:', influence.dominantValue);
  console.log('活跃目标影响:', influence.activeGoalInfluence);
  console.log('自我意识修正:', influence.selfAwarenessModifier);
  console.log('');

  console.log('测试2: 选择行动');
  const selectedAction = mapper.selectAction(influence.finalWeights);
  console.log('选择的行动:', selectedAction);
  console.log('');

  console.log('测试3: 目标驱动决策');
  const goalDecision = mapper.computeGoalDrivenAction(goals, context);
  console.log('目标驱动行动:', goalDecision.action);
  console.log('原因:', goalDecision.reason);
  console.log('匹配目标:', goalDecision.goalMatch);
  console.log('');

  console.log('测试4: 价值观驱动调整');
  const valueAdjustment = mapper.computeValueDrivenAdjustment(values, 'explore', metaState);
  console.log('是否调整:', valueAdjustment.adjusted);
  console.log('新行动:', valueAdjustment.newAction);
  console.log('原因:', valueAdjustment.reason);
  console.log('');

  console.log('测试5: 更新行动结果');
  mapper.updateActionOutcome('work', 'positive');
  mapper.updateActionOutcome('work', 'positive');
  mapper.updateActionOutcome('work', 'negative');
  const stats = mapper.getActionStatistics();
  console.log('工作行动统计:', stats.get('work'));
  console.log('');

  console.log('测试6: 权重归一化验证');
  const totalWeight = Object.values(influence.finalWeights).reduce((a, b) => a + b, 0);
  console.log('最终权重总和:', totalWeight.toFixed(4), '(应接近1.0)');
  console.log('');

  console.log('=== 所有测试完成 ===');
}

runTests();

export { runTests };
