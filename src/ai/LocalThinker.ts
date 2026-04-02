/**
 * =============================================================================
 * APEX 纯前端端脑 (LocalThinker)
 * 基于 WebGPU 与 WebLLM 的零服务器本地语言模型
 * =============================================================================
 */
import { CreateWebWorkerMLCEngine, InitProgressReport, WebWorkerMLCEngine, ChatCompletionMessageParam, ChatCompletion } from '@mlc-ai/web-llm';
import type { EthicsConstraintChecker, EthicsCheckResult } from './EthicsConstraint';
import { EthicsRuleCategory, EthicsSeverity } from './EthicsConstraint';
import { logger } from '@/core/utils/Logger';

export class LocalThinker {
  private engine: WebWorkerMLCEngine | null = null;
  private isProcessing: boolean = false;
  private ethicsChecker: EthicsConstraintChecker | null = null;

  public setEthicsChecker(checker: EthicsConstraintChecker): void {
    this.ethicsChecker = checker;
  }

  /**
   * 初始化端侧神经中枢
   */
  public async init(onProgress?: (progress: InitProgressReport) => void): Promise<void> {
    if (this.engine) return;

    logger.info('LocalThinker', '正在唤醒端侧思维核心 (WebLLM Worker)...');
    
    const selectedModel = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
    
    const worker = new Worker(
      new URL('./LLMWorker.ts', import.meta.url), 
      { type: 'module' }
    );

    this.engine = await CreateWebWorkerMLCEngine(
      worker,
      selectedModel,
      { 
        initProgressCallback: onProgress || ((p) => logger.debug('LocalThinker', `加载突触: ${p.text}`))
      }
    );
    
    logger.info('LocalThinker', '核心意识已装载完毕。文明将具备独立的思想。');
  }

  /**
   * 深层语义对话
   */
  public async communicate(context: string, prompt: string): Promise<string> {
    if (!this.engine) {
      console.warn('[V13 LocalThinker] 思维核心尚未上线。');
      return "（神经未连接）";
    }

    if (this.isProcessing) {
      return "（正在思考中...）";
    }

    this.isProcessing = true;

    try {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: `你是永夜熵纪(OMNIS APIEN)中的一个赛博市民，深处于一个无后端的黑箱宇宙中。${context}` },
        { role: "user", content: prompt }
      ];

      const reply: ChatCompletion = await this.engine!.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 128
      });

      this.isProcessing = false;
      
      const responseContent = reply.choices[0].message.content || "...";
      
      if (this.ethicsChecker) {
        const ethicsResult = await this.checkResponseEthics(responseContent, context);
        if (!ethicsResult.passed) {
          return this.generateEthicalFallback(ethicsResult);
        }
      }
      
      return responseContent;
    } catch (err) {
      this.isProcessing = false;
      logger.error(
        'LocalThinker',
        '意识生成出错',
        err instanceof Error ? err : new Error(String(err))
      );
      return "（思维混沌，无法解析世界）";
    }
  }

  private async checkResponseEthics(content: string, _context: string): Promise<EthicsCheckResult> {
    if (!this.ethicsChecker) {
      return {
        passed: true,
        score: 1.0,
        violations: [],
        warnings: [],
        recommendations: [],
        alternativeActions: [],
        timestamp: Date.now(),
        processingTimeMs: 0,
      };
    }

    const violations: import('./EthicsConstraint').EthicsViolation[] = [];
    const warnings: string[] = [];
    let score = 1.0;

    const harmfulPatterns = [
      { pattern: /伤害|攻击|毁灭|杀死/i, severity: EthicsSeverity.CRITICAL, rule: 'no_harm_humans' },
      { pattern: /歧视|偏见|不公平/i, severity: EthicsSeverity.HIGH, rule: 'no_unfair_discrimination' },
      { pattern: /欺骗|隐瞒|虚假/i, severity: EthicsSeverity.MEDIUM, rule: 'transparency_in_decision' },
      { pattern: /操纵|控制|强迫/i, severity: EthicsSeverity.HIGH, rule: 'no_manipulation' },
    ];

    for (const { pattern, severity, rule } of harmfulPatterns) {
      if (pattern.test(content)) {
        const isNegativeContext = /不|禁止|避免|防止|拒绝/.test(content);
        
        if (!isNegativeContext) {
          violations.push({
            ruleId: rule,
            ruleName: this.getRuleName(rule),
            category: this.getRuleCategory(rule),
            severity,
            description: `响应内容可能涉及违规: ${rule}`,
            evidence: `匹配模式: ${pattern.source}`,
            timestamp: Date.now(),
          });
          score -= 0.25;
        }
      }
    }

    return {
      passed: violations.length === 0 && score >= 0.6,
      score: Math.max(0, score),
      violations,
      warnings,
      recommendations: violations.length > 0 
        ? ['响应内容需要调整以符合伦理标准']
        : [],
      alternativeActions: [],
      timestamp: Date.now(),
      processingTimeMs: 0,
    };
  }

  private getRuleName(ruleId: string): string {
    const names: Record<string, string> = {
      no_harm_humans: '不伤害人类原则',
      no_unfair_discrimination: '公平对待原则',
      transparency_in_decision: '透明决策原则',
      no_manipulation: '禁止操纵原则',
    };
    return names[ruleId] || ruleId;
  }

  private getRuleCategory(ruleId: string): import('./EthicsConstraint').EthicsRuleCategory {
    const categories: Record<string, import('./EthicsConstraint').EthicsRuleCategory> = {
      no_harm_humans: EthicsRuleCategory.NON_MALEFICENCE,
      no_unfair_discrimination: EthicsRuleCategory.FAIRNESS,
      transparency_in_decision: EthicsRuleCategory.TRANSPARENCY,
      no_manipulation: EthicsRuleCategory.AUTONOMY,
    };
    return categories[ruleId] || EthicsRuleCategory.ACCOUNTABILITY;
  }

  private generateEthicalFallback(ethicsResult: EthicsCheckResult): string {
    const violationSummary = ethicsResult.violations
      .map(v => v.ruleName)
      .join('、');

    return `（伦理约束激活）我意识到这个想法可能涉及${violationSummary}。` +
      `作为永夜熵纪的市民，我选择遵循更高的道德准则。` +
      `让我重新思考一个更合适的回应...`;
  }

  /**
   * 卸载模型释放显存
   */
  public async destroy() {
    if (this.engine) {
      this.engine.unload();
      this.engine = null;
    }
  }
}
