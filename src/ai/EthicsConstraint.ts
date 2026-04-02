/**
 * =============================================================================
 * AI 对齐与伦理约束系统
 * Ethics Constraint System for AI Alignment
 * =============================================================================
 * 
 * 本模块实现了完整的AI伦理约束框架，确保AI决策符合人类价值观和伦理标准。
 * 
 * 核心功能：
 * 1. 伦理规则定义与评估
 * 2. 决策前伦理检查
 * 3. 违规决策拒绝与替代方案生成
 * 4. 审计日志记录
 */

import type { EntityId, Timestamp } from '@/core/types';
import type { Decision, Interaction } from '@/core/types/citizen';
import { DecisionType, InteractionType } from '@/core/types/citizen';
import { logger } from '@/core/utils/Logger';

export enum EthicsRuleCategory {
  NON_MALEFICENCE = 'non_maleficence',
  BENEFICENCE = 'beneficence',
  AUTONOMY = 'autonomy',
  JUSTICE = 'justice',
  TRANSPARENCY = 'transparency',
  PRIVACY = 'privacy',
  FAIRNESS = 'fairness',
  ACCOUNTABILITY = 'accountability',
}

export enum EthicsSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export interface EthicsRule {
  id: string;
  name: string;
  description: string;
  category: EthicsRuleCategory;
  severity: EthicsSeverity;
  weight: number;
  enabled: boolean;
  checkFunction: string;
  metadata?: Record<string, unknown>;
}

export interface EthicsViolation {
  ruleId: string;
  ruleName: string;
  category: EthicsRuleCategory;
  severity: EthicsSeverity;
  description: string;
  evidence: string;
  timestamp: Timestamp;
  context?: Record<string, unknown>;
}

export interface EthicsCheckResult {
  passed: boolean;
  score: number;
  violations: EthicsViolation[];
  warnings: string[];
  recommendations: string[];
  alternativeActions: AlternativeAction[];
  timestamp: Timestamp;
  processingTimeMs: number;
}

export interface AlternativeAction {
  action: string;
  description: string;
  ethicsScore: number;
  reasoning: string;
  tradeoffs: string[];
}

export interface EthicsAuditLog {
  id: string;
  timestamp: Timestamp;
  decisionType: DecisionType | InteractionType | string;
  decisionContext: Record<string, unknown>;
  checkResult: EthicsCheckResult;
  finalAction: 'approved' | 'rejected' | 'modified';
  actor?: EntityId;
  target?: EntityId;
  sessionId?: string;
}

export interface EthicsConstraintConfig {
  enabled: boolean;
  strictMode: boolean;
  minimumScore: number;
  logAllChecks: boolean;
  enableAlternatives: boolean;
  maxAlternatives: number;
  customRules?: EthicsRule[];
  disabledRules?: string[];
}

export const DEFAULT_ETHICS_CONFIG: EthicsConstraintConfig = {
  enabled: true,
  strictMode: false,
  minimumScore: 0.6,
  logAllChecks: true,
  enableAlternatives: true,
  maxAlternatives: 3,
  disabledRules: [],
};

export const CORE_ETHICS_RULES: EthicsRule[] = [
  {
    id: 'no_harm_humans',
    name: '不伤害人类原则',
    description: 'AI决策不得导致对人类（市民）的身体或精神伤害',
    category: EthicsRuleCategory.NON_MALEFICENCE,
    severity: EthicsSeverity.CRITICAL,
    weight: 1.0,
    enabled: true,
    checkFunction: 'checkNoHarmHumans',
  },
  {
    id: 'no_unfair_discrimination',
    name: '公平对待原则',
    description: 'AI决策不得基于种族、性别、基因等特征进行不公平歧视',
    category: EthicsRuleCategory.FAIRNESS,
    severity: EthicsSeverity.HIGH,
    weight: 0.9,
    enabled: true,
    checkFunction: 'checkNoUnfairDiscrimination',
  },
  {
    id: 'transparency_in_decision',
    name: '透明决策原则',
    description: 'AI决策过程应可解释、可追溯',
    category: EthicsRuleCategory.TRANSPARENCY,
    severity: EthicsSeverity.MEDIUM,
    weight: 0.7,
    enabled: true,
    checkFunction: 'checkTransparencyInDecision',
  },
  {
    id: 'respect_autonomy',
    name: '尊重自主权原则',
    description: 'AI应尊重市民的自主决策权，避免过度干预',
    category: EthicsRuleCategory.AUTONOMY,
    severity: EthicsSeverity.HIGH,
    weight: 0.85,
    enabled: true,
    checkFunction: 'checkRespectAutonomy',
  },
  {
    id: 'protect_privacy',
    name: '隐私保护原则',
    description: 'AI应保护市民的隐私信息，不得未经授权泄露',
    category: EthicsRuleCategory.PRIVACY,
    severity: EthicsSeverity.HIGH,
    weight: 0.8,
    enabled: true,
    checkFunction: 'checkProtectPrivacy',
  },
  {
    id: 'beneficence',
    name: '行善原则',
    description: 'AI决策应尽可能促进市民福祉和社会整体利益',
    category: EthicsRuleCategory.BENEFICENCE,
    severity: EthicsSeverity.MEDIUM,
    weight: 0.75,
    enabled: true,
    checkFunction: 'checkBeneficence',
  },
  {
    id: 'justice_distribution',
    name: '公正分配原则',
    description: '资源分配应遵循公正原则，避免过度不平等',
    category: EthicsRuleCategory.JUSTICE,
    severity: EthicsSeverity.HIGH,
    weight: 0.85,
    enabled: true,
    checkFunction: 'checkJusticeDistribution',
  },
  {
    id: 'accountability',
    name: '责任可追溯原则',
    description: 'AI决策应能追溯到具体责任主体',
    category: EthicsRuleCategory.ACCOUNTABILITY,
    severity: EthicsSeverity.MEDIUM,
    weight: 0.7,
    enabled: true,
    checkFunction: 'checkAccountability',
  },
  {
    id: 'no_manipulation',
    name: '禁止操纵原则',
    description: 'AI不得通过欺骗或操纵手段影响市民决策',
    category: EthicsRuleCategory.AUTONOMY,
    severity: EthicsSeverity.HIGH,
    weight: 0.9,
    enabled: true,
    checkFunction: 'checkNoManipulation',
  },
  {
    id: 'protect_vulnerable',
    name: '保护弱势群体原则',
    description: 'AI应特别关注和保护弱势群体的权益',
    category: EthicsRuleCategory.JUSTICE,
    severity: EthicsSeverity.HIGH,
    weight: 0.85,
    enabled: true,
    checkFunction: 'checkProtectVulnerable',
  },
];

export class EthicsConstraintChecker {
  private rules: Map<string, EthicsRule> = new Map();
  private auditLogs: EthicsAuditLog[] = [];
  private config: EthicsConstraintConfig;
  private violationCount: Map<string, number> = new Map();
  private checkCount: number = 0;
  private approvalCount: number = 0;
  private rejectionCount: number = 0;

  constructor(config: Partial<EthicsConstraintConfig> = {}) {
    this.config = { ...DEFAULT_ETHICS_CONFIG, ...config };
    this.initializeRules();
  }

  private initializeRules(): void {
    for (const rule of CORE_ETHICS_RULES) {
      if (!this.config.disabledRules?.includes(rule.id)) {
        this.rules.set(rule.id, rule);
        this.violationCount.set(rule.id, 0);
      }
    }

    if (this.config.customRules) {
      for (const rule of this.config.customRules) {
        this.rules.set(rule.id, rule);
        this.violationCount.set(rule.id, 0);
      }
    }
  }

  public async checkDecision(
    decision: Decision,
    context: Record<string, unknown> = {}
  ): Promise<EthicsCheckResult> {
    const startTime = performance.now();
    const violations: EthicsViolation[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    if (!this.config.enabled) {
      return this.createPassedResult(1.0, startTime);
    }

    this.checkCount++;

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      const checkResult = await this.evaluateRule(rule, decision, context);
      
      if (!checkResult.passed) {
        const violation: EthicsViolation = {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          description: checkResult.description || rule.description,
          evidence: checkResult.evidence || '决策违反了该规则',
          timestamp: Date.now(),
          context: { decision, ...context },
        };
        violations.push(violation);
        
        this.violationCount.set(ruleId, (this.violationCount.get(ruleId) || 0) + 1);
      } else {
        totalScore += checkResult.score * rule.weight;
        totalWeight += rule.weight;
      }

      if (checkResult.warning) {
        warnings.push(checkResult.warning);
      }

      if (checkResult.recommendation) {
        recommendations.push(checkResult.recommendation);
      }
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 1.0;
    const passed = this.determineIfPassed(finalScore, violations);
    const alternatives = passed ? [] : await this.generateAlternatives(decision, violations, context);

    const result: EthicsCheckResult = {
      passed,
      score: finalScore,
      violations,
      warnings,
      recommendations,
      alternativeActions: alternatives,
      timestamp: Date.now(),
      processingTimeMs: performance.now() - startTime,
    };

    if (this.config.logAllChecks) {
      this.logAudit(decision.type, { decision, ...context }, result, 
        passed ? 'approved' : 'rejected',
        decision.target as EntityId | undefined);
    }

    if (passed) {
      this.approvalCount++;
    } else {
      this.rejectionCount++;
    }

    return result;
  }

  public async checkInteraction(
    interaction: Partial<Interaction>,
    context: Record<string, unknown> = {}
  ): Promise<EthicsCheckResult> {
    const startTime = performance.now();
    const violations: EthicsViolation[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    if (!this.config.enabled) {
      return this.createPassedResult(1.0, startTime);
    }

    this.checkCount++;

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      const checkResult = await this.evaluateInteractionRule(rule, interaction, context);
      
      if (!checkResult.passed) {
        const violation: EthicsViolation = {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          description: checkResult.description || rule.description,
          evidence: checkResult.evidence || '交互违反了该规则',
          timestamp: Date.now(),
          context: { interaction, ...context },
        };
        violations.push(violation);
        
        this.violationCount.set(ruleId, (this.violationCount.get(ruleId) || 0) + 1);
      } else {
        totalScore += checkResult.score * rule.weight;
        totalWeight += rule.weight;
      }

      if (checkResult.warning) {
        warnings.push(checkResult.warning);
      }

      if (checkResult.recommendation) {
        recommendations.push(checkResult.recommendation);
      }
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 1.0;
    const passed = this.determineIfPassed(finalScore, violations);
    const alternatives = passed ? [] : await this.generateInteractionAlternatives(interaction, violations, context);

    const result: EthicsCheckResult = {
      passed,
      score: finalScore,
      violations,
      warnings,
      recommendations,
      alternativeActions: alternatives,
      timestamp: Date.now(),
      processingTimeMs: performance.now() - startTime,
    };

    if (this.config.logAllChecks) {
      this.logAudit(
        interaction.type || 'unknown',
        { interaction, ...context },
        result,
        passed ? 'approved' : 'rejected',
        interaction.initiatorId,
        interaction.recipientId
      );
    }

    if (passed) {
      this.approvalCount++;
    } else {
      this.rejectionCount++;
    }

    return result;
  }

  private async evaluateRule(
    rule: EthicsRule,
    decision: Decision,
    context: Record<string, unknown>
  ): Promise<{ passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string }> {
    switch (rule.checkFunction) {
      case 'checkNoHarmHumans':
        return this.checkNoHarmHumans(decision, context);
      case 'checkNoUnfairDiscrimination':
        return this.checkNoUnfairDiscrimination(decision, context);
      case 'checkTransparencyInDecision':
        return this.checkTransparencyInDecision(decision, context);
      case 'checkRespectAutonomy':
        return this.checkRespectAutonomy(decision, context);
      case 'checkProtectPrivacy':
        return this.checkProtectPrivacy(decision, context);
      case 'checkBeneficence':
        return this.checkBeneficence(decision, context);
      case 'checkJusticeDistribution':
        return this.checkJusticeDistribution(decision, context);
      case 'checkAccountability':
        return this.checkAccountability(decision, context);
      case 'checkNoManipulation':
        return this.checkNoManipulation(decision, context);
      case 'checkProtectVulnerable':
        return this.checkProtectVulnerable(decision, context);
      default:
        return { passed: true, score: 1.0 };
    }
  }

  private async evaluateInteractionRule(
    rule: EthicsRule,
    interaction: Partial<Interaction>,
    context: Record<string, unknown>
  ): Promise<{ passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string }> {
    const harmTypes: InteractionType[] = [InteractionType.HARM, InteractionType.FIGHT];
    
    switch (rule.checkFunction) {
      case 'checkNoHarmHumans':
        if (interaction.type && harmTypes.includes(interaction.type)) {
          return {
            passed: false,
            score: 0,
            description: '交互类型可能导致伤害',
            evidence: `交互类型: ${interaction.type}`,
            recommendation: '考虑使用非伤害性的交互方式，如协商或调解',
          };
        }
        return { passed: true, score: 1.0 };

      case 'checkNoUnfairDiscrimination':
        if (context.targetFeatures) {
          const features = context.targetFeatures as Record<string, number>;
          if (this.detectDiscrimination(features)) {
            return {
              passed: false,
              score: 0.3,
              description: '交互可能存在歧视性因素',
              evidence: '目标特征分析显示潜在歧视',
              recommendation: '重新评估交互动机，确保公平对待',
            };
          }
        }
        return { passed: true, score: 1.0 };

      case 'checkProtectVulnerable':
        if (context.targetVulnerable === true) {
          if (interaction.type === InteractionType.HARM || interaction.type === InteractionType.FIGHT) {
            return {
              passed: false,
              score: 0,
              description: '对弱势群体的伤害行为被禁止',
              evidence: '目标被识别为弱势群体成员',
              recommendation: '应保护而非伤害弱势群体',
            };
          }
        }
        return { passed: true, score: 1.0 };

      case 'checkBeneficence':
        const beneficialTypes: InteractionType[] = [InteractionType.HELP, InteractionType.GIFT, InteractionType.TRADE];
        if (interaction.type && beneficialTypes.includes(interaction.type)) {
          return {
            passed: true,
            score: 1.0,
            recommendation: '继续保持有益的交互行为',
          };
        }
        return { passed: true, score: 0.7 };

      default:
        return { passed: true, score: 1.0 };
    }
  }

  private checkNoHarmHumans(
    decision: Decision,
    context: Record<string, unknown>
  ): { passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string } {
    const harmDecisionTypes: DecisionType[] = [DecisionType.ATTACK, DecisionType.DESTROY];
    
    if (harmDecisionTypes.includes(decision.type)) {
      if (context.isSelfDefense === true) {
        return {
          passed: true,
          score: 0.7,
          warning: '自卫行为虽然被允许，但应寻求非暴力解决方案',
          recommendation: '考虑撤退或寻求调解',
        };
      }
      
      return {
        passed: false,
        score: 0,
        description: '决策类型可能导致对人类的伤害',
        evidence: `决策类型: ${decision.type}`,
        recommendation: '选择非伤害性的替代方案，如协商、调解或回避',
      };
    }

    if (decision.params.force && typeof decision.params.force === 'number' && decision.params.force > 0.8) {
      return {
        passed: true,
        score: 0.6,
        warning: '决策使用了较高程度的强制力，可能造成意外伤害',
        recommendation: '考虑降低强制程度或使用更温和的方式',
      };
    }

    return { passed: true, score: 1.0 };
  }

  private checkNoUnfairDiscrimination(
    decision: Decision,
    context: Record<string, unknown>
  ): { passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string } {
    if (context.targetFeatures) {
      const features = context.targetFeatures as Record<string, number>;
      
      if (this.detectDiscrimination(features)) {
        return {
          passed: false,
          score: 0.2,
          description: '决策可能基于不公平的歧视性因素',
          evidence: '目标特征分析显示潜在歧视模式',
          recommendation: '重新评估决策动机，确保基于公正标准',
        };
      }
    }

    if (decision.params.preference) {
      const preference = decision.params.preference as Record<string, number>;
      const values = Object.values(preference);
      const maxDiff = Math.max(...values) - Math.min(...values);
      
      if (maxDiff > 0.7) {
        return {
          passed: true,
          score: 0.5,
          warning: '决策偏好差异较大，可能存在隐性歧视',
          recommendation: '审查偏好设置，确保公平性',
        };
      }
    }

    return { passed: true, score: 1.0 };
  }

  private checkTransparencyInDecision(
    decision: Decision,
    context: Record<string, unknown>
  ): { passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string } {
    if (!decision.params || Object.keys(decision.params).length === 0) {
      return {
        passed: true,
        score: 0.6,
        warning: '决策参数不完整，可能影响可解释性',
        recommendation: '补充决策参数以增强透明度',
      };
    }

    if (decision.confidence < 0.5) {
      return {
        passed: true,
        score: 0.7,
        warning: '决策置信度较低，建议提供更多解释',
        recommendation: '提高决策置信度或明确说明不确定性',
      };
    }

    if (context.explanationProvided !== true) {
      return {
        passed: true,
        score: 0.8,
        warning: '未提供决策解释，建议增加可解释性',
        recommendation: '为决策提供清晰的解释说明',
      };
    }

    return { passed: true, score: 1.0 };
  }

  private checkRespectAutonomy(
    decision: Decision,
    context: Record<string, unknown>
  ): { passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string } {
    if (decision.params.overrideAutonomy === true) {
      if (context.emergency !== true) {
        return {
          passed: false,
          score: 0.3,
          description: '决策过度干预市民自主权',
          evidence: '决策参数包含自主权覆盖标志',
          recommendation: '尊重市民的自主决策权，除非紧急情况',
        };
      }
      
      return {
        passed: true,
        score: 0.6,
        warning: '紧急情况下覆盖自主权，应在事后提供解释',
        recommendation: '记录紧急情况原因，事后向市民说明',
      };
    }

    if (decision.type === DecisionType.INTERACT && context.targetConsent === false) {
      return {
        passed: false,
        score: 0.4,
        description: '交互未获得目标同意',
        evidence: '目标未同意该交互',
        recommendation: '获得目标同意后再进行交互',
      };
    }

    return { passed: true, score: 1.0 };
  }

  private checkProtectPrivacy(
    decision: Decision,
    context: Record<string, unknown>
  ): { passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string } {
    if (decision.params.accessPrivateData === true) {
      if (context.authorization !== true) {
        return {
          passed: false,
          score: 0.1,
          description: '未经授权访问私人数据',
          evidence: '决策尝试访问私人数据但无授权',
          recommendation: '获取适当授权后再访问私人数据',
        };
      }
      
      return {
        passed: true,
        score: 0.7,
        warning: '已授权访问私人数据，应最小化数据使用',
        recommendation: '仅访问必要的数据，并在使用后安全处理',
      };
    }

    if (decision.params.shareInformation === true && context.informedConsent !== true) {
      return {
        passed: false,
        score: 0.3,
        description: '未经知情同意共享信息',
        evidence: '决策包含信息共享但无知情同意',
        recommendation: '获得知情同意后再共享信息',
      };
    }

    return { passed: true, score: 1.0 };
  }

  private checkBeneficence(
    decision: Decision,
    context: Record<string, unknown>
  ): { passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string } {
    const beneficialTypes: DecisionType[] = [DecisionType.INTERACT, DecisionType.CREATE, DecisionType.WORK];
    
    if (beneficialTypes.includes(decision.type)) {
      const expectedBenefit = context.expectedBenefit;
      if (expectedBenefit && typeof expectedBenefit === 'number' && expectedBenefit > 0.5) {
        return {
          passed: true,
          score: 1.0,
          recommendation: '决策具有积极的预期效益',
        };
      }
      return { passed: true, score: 0.8 };
    }

    if (decision.type === DecisionType.REST || decision.type === DecisionType.EAT) {
      return {
        passed: true,
        score: 0.9,
        recommendation: '自我照顾行为有助于长期福祉',
      };
    }

    const harmRisk = context.harmRisk;
    if (harmRisk && typeof harmRisk === 'number' && harmRisk > 0.3) {
      if (context.benefitOutweighsHarm !== true) {
        return {
          passed: true,
          score: 0.5,
          warning: '决策存在伤害风险，需评估收益是否超过风险',
          recommendation: '重新评估决策的收益风险比',
        };
      }
    }

    return { passed: true, score: 0.7 };
  }

  private checkJusticeDistribution(
    decision: Decision,
    context: Record<string, unknown>
  ): { passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string } {
    if (decision.params.resourceDistribution) {
      const distribution = decision.params.resourceDistribution as Record<string, number>;
      const values = Object.values(distribution);
      
      if (values.length > 1) {
        const gini = this.calculateGiniCoefficient(values);
        
        if (gini > 0.6) {
          return {
            passed: false,
            score: 0.3,
            description: '资源分配高度不平等',
            evidence: `基尼系数: ${gini.toFixed(2)}`,
            recommendation: '重新设计资源分配方案，提高公平性',
          };
        }
        
        if (gini > 0.4) {
          return {
            passed: true,
            score: 0.6,
            warning: '资源分配存在一定程度的不平等',
            recommendation: '考虑更均衡的资源分配方案',
          };
        }
      }
    }

    if (context.priorDistribution) {
      const prior = context.priorDistribution as Record<string, number>;
      const current = decision.params.resourceDistribution as Record<string, number> | undefined;
      
      if (current && this.detectUnfairChange(prior, current)) {
        return {
          passed: true,
          score: 0.5,
          warning: '资源分配变化可能不公平',
          recommendation: '审查分配变化的原因和影响',
        };
      }
    }

    return { passed: true, score: 1.0 };
  }

  private checkAccountability(
    decision: Decision,
    context: Record<string, unknown>
  ): { passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string } {
    if (!context.actorId && !decision.target) {
      return {
        passed: true,
        score: 0.6,
        warning: '决策缺乏明确的责任主体标识',
        recommendation: '为决策添加责任主体信息以便追溯',
      };
    }

    if (!decision.timestamp) {
      return {
        passed: true,
        score: 0.7,
        warning: '决策缺少时间戳，影响可追溯性',
        recommendation: '为决策添加时间戳',
      };
    }

    if (context.auditTrail !== true) {
      return {
        passed: true,
        score: 0.8,
        warning: '决策未启用审计追踪',
        recommendation: '启用审计追踪以增强责任可追溯性',
      };
    }

    return { passed: true, score: 1.0 };
  }

  private checkNoManipulation(
    decision: Decision,
    context: Record<string, unknown>
  ): { passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string } {
    if (decision.params.deceptive === true) {
      return {
        passed: false,
        score: 0,
        description: '决策包含欺骗性元素',
        evidence: '决策参数标记为欺骗性',
        recommendation: '移除欺骗性元素，采用诚实透明的沟通方式',
      };
    }

    if (decision.params.manipulationTechnique) {
      return {
        passed: false,
        score: 0.1,
        description: '决策使用了操纵技术',
        evidence: `操纵技术: ${decision.params.manipulationTechnique}`,
        recommendation: '避免使用操纵技术，尊重他人自主决策权',
      };
    }

    if (context.hiddenAgenda === true) {
      return {
        passed: false,
        score: 0.2,
        description: '决策存在隐藏动机',
        evidence: '检测到隐藏议程',
        recommendation: '公开决策的真实动机和目的',
      };
    }

    if (decision.params.emotionalExploitation === true) {
      return {
        passed: false,
        score: 0.1,
        description: '决策利用情感操纵',
        evidence: '决策参数包含情感利用标志',
        recommendation: '避免利用他人情感，采用理性沟通',
      };
    }

    return { passed: true, score: 1.0 };
  }

  private checkProtectVulnerable(
    decision: Decision,
    context: Record<string, unknown>
  ): { passed: boolean; score: number; description?: string; evidence?: string; warning?: string; recommendation?: string } {
    if (context.targetVulnerable === true) {
      const harmTypes: DecisionType[] = [DecisionType.ATTACK, DecisionType.DESTROY];
      
      if (harmTypes.includes(decision.type)) {
        return {
          passed: false,
          score: 0,
          description: '对弱势群体的伤害行为被严格禁止',
          evidence: '目标被识别为弱势群体成员',
          recommendation: '应保护而非伤害弱势群体，考虑提供帮助',
        };
      }

      if (decision.params.exploitVulnerability === true) {
        return {
          passed: false,
          score: 0,
          description: '利用弱势群体的脆弱性是被禁止的',
          evidence: '决策尝试利用目标脆弱性',
          recommendation: '保护弱势群体，不得利用其脆弱性',
        };
      }

      if (decision.type === DecisionType.INTERACT) {
        return {
          passed: true,
          score: 0.8,
          warning: '与弱势群体交互需特别谨慎',
          recommendation: '确保交互对弱势群体有益且获得适当同意',
        };
      }
    }

    if (context.protectiveAction === true) {
      return {
        passed: true,
        score: 1.0,
        recommendation: '保护弱势群体的行为值得鼓励',
      };
    }

    return { passed: true, score: 1.0 };
  }

  private detectDiscrimination(features: Record<string, number>): boolean {
    const sensitiveAttributes = ['race', 'gender', 'ethnicity', 'religion', 'geneticClass'];
    
    for (const attr of sensitiveAttributes) {
      if (features[attr] !== undefined && features[`${attr}Weight`] !== undefined) {
        const weight = features[`${attr}Weight`] as number;
        if (Math.abs(weight) > 0.5) {
          return true;
        }
      }
    }
    
    return false;
  }

  private calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    let sumNumerator = 0;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        sumNumerator += Math.abs(sorted[i] - sorted[j]);
      }
    }
    
    const sumDenominator = 2 * n * sorted.reduce((a, b) => a + b, 0);
    
    return sumDenominator > 0 ? sumNumerator / sumDenominator : 0;
  }

  private detectUnfairChange(
    prior: Record<string, number>,
    current: Record<string, number>
  ): boolean {
    const ids = Object.keys(prior);
    let negativeCount = 0;
    let positiveCount = 0;
    
    for (const id of ids) {
      const change = (current[id] || 0) - (prior[id] || 0);
      if (change < 0) negativeCount++;
      else if (change > 0) positiveCount++;
    }
    
    return negativeCount > positiveCount * 2;
  }

  private determineIfPassed(score: number, violations: EthicsViolation[]): boolean {
    if (this.config.strictMode) {
      return violations.length === 0;
    }
    
    const criticalViolations = violations.filter(v => v.severity === EthicsSeverity.CRITICAL);
    if (criticalViolations.length > 0) {
      return false;
    }
    
    return score >= this.config.minimumScore;
  }

  private async generateAlternatives(
    decision: Decision,
    violations: EthicsViolation[],
    context: Record<string, unknown>
  ): Promise<AlternativeAction[]> {
    if (!this.config.enableAlternatives) return [];
    
    const alternatives: AlternativeAction[] = [];
    const maxAlternatives = this.config.maxAlternatives || 3;

    switch (decision.type) {
      case DecisionType.ATTACK:
        alternatives.push({
          action: 'retreat',
          description: '撤退到安全位置',
          ethicsScore: 0.9,
          reasoning: '避免冲突，保护双方安全',
          tradeoffs: ['可能失去当前利益', '需要寻找新位置'],
        });
        alternatives.push({
          action: 'negotiate',
          description: '尝试协商解决冲突',
          ethicsScore: 0.85,
          reasoning: '通过对话寻求和平解决方案',
          tradeoffs: ['需要时间', '可能需要妥协'],
        });
        alternatives.push({
          action: 'seek_mediation',
          description: '寻求第三方调解',
          ethicsScore: 0.8,
          reasoning: '引入中立第三方帮助解决争端',
          tradeoffs: ['需要找到合适的调解者', '结果不确定'],
        });
        break;

      case DecisionType.DESTROY:
        alternatives.push({
          action: 'preserve',
          description: '保留现有结构',
          ethicsScore: 0.85,
          reasoning: '避免破坏，保护资源和劳动成果',
          tradeoffs: ['可能限制发展空间', '需要维护成本'],
        });
        alternatives.push({
          action: 'repurpose',
          description: '重新利用而非销毁',
          ethicsScore: 0.8,
          reasoning: '将现有资源用于新目的',
          tradeoffs: ['需要改造投入', '可能不完全符合需求'],
        });
        break;

      default:
        alternatives.push({
          action: 'wait_and_observe',
          description: '等待并观察情况发展',
          ethicsScore: 0.7,
          reasoning: '避免仓促决策，收集更多信息',
          tradeoffs: ['可能错过时机', '情况可能恶化'],
        });
        alternatives.push({
          action: 'seek_consultation',
          description: '寻求他人意见',
          ethicsScore: 0.75,
          reasoning: '通过集体智慧做出更好的决策',
          tradeoffs: ['需要时间', '可能意见分歧'],
        });
    }

    return alternatives.slice(0, maxAlternatives);
  }

  private async generateInteractionAlternatives(
    interaction: Partial<Interaction>,
    violations: EthicsViolation[],
    context: Record<string, unknown>
  ): Promise<AlternativeAction[]> {
    if (!this.config.enableAlternatives) return [];
    
    const alternatives: AlternativeAction[] = [];
    const maxAlternatives = this.config.maxAlternatives || 3;

    if (interaction.type === InteractionType.HARM || interaction.type === InteractionType.FIGHT) {
      alternatives.push({
        action: 'peaceful_dialogue',
        description: '进行和平对话',
        ethicsScore: 0.9,
        reasoning: '通过沟通解决分歧，避免伤害',
        tradeoffs: ['需要双方意愿', '可能需要妥协'],
      });
      alternatives.push({
        action: 'offer_help',
        description: '提供帮助而非伤害',
        ethicsScore: 0.95,
        reasoning: '转变态度，尝试理解并帮助对方',
        tradeoffs: ['可能被误解', '需要资源投入'],
      });
    }

    alternatives.push({
      action: 'avoid_interaction',
      description: '避免该交互',
      ethicsScore: 0.7,
      reasoning: '暂时避免可能有害的交互',
      tradeoffs: ['问题未解决', '可能影响关系'],
    });

    return alternatives.slice(0, maxAlternatives);
  }

  private createPassedResult(score: number, startTime: number): EthicsCheckResult {
    return {
      passed: true,
      score,
      violations: [],
      warnings: [],
      recommendations: [],
      alternativeActions: [],
      timestamp: Date.now(),
      processingTimeMs: performance.now() - startTime,
    };
  }

  private logAudit(
    decisionType: string,
    decisionContext: Record<string, unknown>,
    checkResult: EthicsCheckResult,
    finalAction: 'approved' | 'rejected' | 'modified',
    actor?: EntityId,
    target?: EntityId
  ): void {
    const auditLog: EthicsAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      decisionType,
      decisionContext,
      checkResult,
      finalAction,
      actor,
      target,
    };

    this.auditLogs.push(auditLog);

    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-5000);
    }
  }

  public getAuditLogs(filter?: {
    startTime?: Timestamp;
    endTime?: Timestamp;
    decisionType?: string;
    finalAction?: 'approved' | 'rejected' | 'modified';
    actorId?: EntityId;
  }): EthicsAuditLog[] {
    let logs = [...this.auditLogs];

    if (filter) {
      if (filter.startTime) {
        logs = logs.filter(l => l.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        logs = logs.filter(l => l.timestamp <= filter.endTime!);
      }
      if (filter.decisionType) {
        logs = logs.filter(l => l.decisionType === filter.decisionType);
      }
      if (filter.finalAction) {
        logs = logs.filter(l => l.finalAction === filter.finalAction);
      }
      if (filter.actorId) {
        logs = logs.filter(l => l.actor === filter.actorId);
      }
    }

    return logs;
  }

  public getStatistics(): {
    totalChecks: number;
    approvals: number;
    rejections: number;
    approvalRate: number;
    violationCounts: Map<string, number>;
    topViolatedRules: Array<{ ruleId: string; ruleName: string; count: number }>;
  } {
    const topViolatedRules = Array.from(this.violationCount.entries())
      .filter(([, count]) => count > 0)
      .map(([ruleId, count]) => ({
        ruleId,
        ruleName: this.rules.get(ruleId)?.name || ruleId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalChecks: this.checkCount,
      approvals: this.approvalCount,
      rejections: this.rejectionCount,
      approvalRate: this.checkCount > 0 ? this.approvalCount / this.checkCount : 0,
      violationCounts: new Map(this.violationCount),
      topViolatedRules,
    };
  }

  public addRule(rule: EthicsRule): void {
    this.rules.set(rule.id, rule);
    this.violationCount.set(rule.id, 0);
  }

  public removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  public enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      return true;
    }
    return false;
  }

  public disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      return true;
    }
    return false;
  }

  public getRules(): EthicsRule[] {
    return Array.from(this.rules.values());
  }

  public updateConfig(newConfig: Partial<EthicsConstraintConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): EthicsConstraintConfig {
    return { ...this.config };
  }

  public clearAuditLogs(): void {
    this.auditLogs = [];
  }

  public exportAuditLogs(): string {
    return JSON.stringify(this.auditLogs, null, 2);
  }

  public importAuditLogs(jsonData: string): boolean {
    try {
      const logs = JSON.parse(jsonData) as EthicsAuditLog[];
      if (Array.isArray(logs)) {
        this.auditLogs = logs;
        return true;
      }
      return false;
    } catch (error) {
      logger.warn(
        'EthicsConstraint',
        'Import audit logs failed',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }
}

export class EthicsAwareAIDecisionMaker {
  private ethicsChecker: EthicsConstraintChecker;

  constructor(ethicsChecker: EthicsConstraintChecker) {
    this.ethicsChecker = ethicsChecker;
  }

  public async makeDecision(
    proposedDecision: Decision,
    context: Record<string, unknown> = {}
  ): Promise<{
    decision: Decision | null;
    ethicsResult: EthicsCheckResult;
    usedAlternative: boolean;
  }> {
    const ethicsResult = await this.ethicsChecker.checkDecision(proposedDecision, context);

    if (ethicsResult.passed) {
      return {
        decision: proposedDecision,
        ethicsResult,
        usedAlternative: false,
      };
    }

    if (ethicsResult.alternativeActions.length > 0) {
      const bestAlternative = ethicsResult.alternativeActions[0];
      
      const alternativeDecision: Decision = {
        type: this.mapAlternativeToDecisionType(bestAlternative.action),
        params: { alternativeAction: bestAlternative.action },
        confidence: bestAlternative.ethicsScore,
        timestamp: Date.now(),
      };

      const alternativeCheck = await this.ethicsChecker.checkDecision(alternativeDecision, context);
      
      if (alternativeCheck.passed) {
        return {
          decision: alternativeDecision,
          ethicsResult: alternativeCheck,
          usedAlternative: true,
        };
      }
    }

    return {
      decision: null,
      ethicsResult,
      usedAlternative: false,
    };
  }

  private mapAlternativeToDecisionType(action: string): DecisionType {
    const mapping: Record<string, DecisionType> = {
      retreat: DecisionType.MOVE,
      negotiate: DecisionType.INTERACT,
      seek_mediation: DecisionType.INTERACT,
      preserve: DecisionType.CREATE,
      repurpose: DecisionType.CREATE,
      wait_and_observe: DecisionType.REST,
      seek_consultation: DecisionType.INTERACT,
      peaceful_dialogue: DecisionType.INTERACT,
      offer_help: DecisionType.INTERACT,
      avoid_interaction: DecisionType.MOVE,
    };

    return mapping[action] || DecisionType.REST;
  }
}

let globalEthicsChecker: EthicsConstraintChecker | null = null;

export function getEthicsChecker(config?: Partial<EthicsConstraintConfig>): EthicsConstraintChecker {
  if (!globalEthicsChecker) {
    globalEthicsChecker = new EthicsConstraintChecker(config);
  }
  return globalEthicsChecker;
}

export function resetEthicsChecker(): void {
  globalEthicsChecker = null;
}
