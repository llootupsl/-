/**
 * =============================================================================
 * 基因插件示例和调试工具
 * Gene Plugin Examples and Debugging Tools
 * =============================================================================
 */

import { genePluginManager } from './GenePluginSystem';
import { GeneType } from './GenomeSystem';
import { logger } from '@/core/utils/Logger';

/**
 * 基础基因插件字节码模板
 * 这是一个最小化的Wasm模块，导出execute函数
 */
export const basicPluginBytecode = new Uint8Array([
  0x00, 0x61, 0x73, 0x6D,
  0x01, 0x00, 0x00, 0x00,
  0x01, 0x08, 0x02,
  0x60, 0x02, 0x7F, 0x7F, 0x01, 0x7F,
  0x60, 0x00, 0x01, 0x7F,
  0x03, 0x03, 0x02, 0x00, 0x01,
  0x07, 0x0D, 0x02,
  0x07, 0x65, 0x78, 0x65, 0x63, 0x75, 0x74, 0x65,
  0x00, 0x00,
  0x0B, 0x67, 0x65, 0x74, 0x5F, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6F, 0x6E,
  0x00, 0x01,
  0x0A, 0x0B, 0x02,
  0x09, 0x00, 0x20, 0x00, 0x20, 0x01, 0x41, 0x00, 0x6A, 0x0B,
  0x02, 0x00, 0x41, 0x01, 0x0B,
]);

/**
 * 注册示例基因插件
 */
export async function registerExamplePlugins(): Promise<void> {
  const basicPlugin = basicPluginBytecode;

  await genePluginManager.registerPlugin({
    id: 'stress-response-plugin',
    name: '压力响应插件',
    version: '1.0.0',
    author: 'OMNIS',
    description: '根据环境压力调整基因表达，高压力会降低表达水平',
    targetGeneTypes: [GeneType.EMOTIONAL, GeneType.COGNITIVE],
    priority: 60,
    enabled: true,
  }, basicPlugin);

  await genePluginManager.registerPlugin({
    id: 'longevity-plugin',
    name: '长寿基因插件',
    version: '1.0.0',
    author: 'OMNIS',
    description: '影响寿命相关基因的表达，根据营养和学习调整',
    targetGeneTypes: [GeneType.LONGEVITY],
    priority: 80,
    enabled: true,
  }, basicPlugin);

  await genePluginManager.registerPlugin({
    id: 'creativity-boost-plugin',
    name: '创造力增强插件',
    version: '1.0.0',
    author: 'OMNIS',
    description: '在社交和学习环境良好时增强创造力基因表达',
    targetGeneTypes: [GeneType.CREATIVITY],
    priority: 70,
    enabled: true,
  }, basicPlugin);

  await genePluginManager.registerPlugin({
    id: 'immune-defense-plugin',
    name: '免疫防御插件',
    version: '1.0.0',
    author: 'OMNIS',
    description: '根据压力和创伤调整免疫系统基因',
    targetGeneTypes: [GeneType.IMMUNE],
    priority: 90,
    enabled: true,
  }, basicPlugin);

  await genePluginManager.registerPlugin({
    id: 'physical-development-plugin',
    name: '身体发育插件',
    version: '1.0.0',
    author: 'OMNIS',
    description: '影响身体发育相关基因，根据营养和年龄调整',
    targetGeneTypes: [GeneType.PHYSICAL],
    priority: 50,
    enabled: true,
  }, basicPlugin);

  logger.info('GenePlugins', '示例插件注册完成');
}

/**
 * 基因插件调试器
 */
export class GenePluginDebugger {
  private static instance: GenePluginDebugger | null = null;
  private logEnabled: boolean = false;
  private executionHistory: Array<{
    timestamp: number;
    pluginId: string;
    citizenId: string;
    geneId: string;
    result: {
      success: boolean;
      valueModifier: number;
      expressionModifier: number;
      executionTime: number;
    };
  }> = [];

  private constructor() {}

  public static getInstance(): GenePluginDebugger {
    if (!GenePluginDebugger.instance) {
      GenePluginDebugger.instance = new GenePluginDebugger();
    }
    return GenePluginDebugger.instance;
  }

  public setLogEnabled(enabled: boolean): void {
    this.logEnabled = enabled;
  }

  public recordExecution(
    pluginId: string,
    citizenId: string,
    geneId: string,
    result: {
      success: boolean;
      valueModifier: number;
      expressionModifier: number;
      executionTime: number;
    }
  ): void {
    this.executionHistory.push({
      timestamp: Date.now(),
      pluginId,
      citizenId,
      geneId,
      result,
    });

    if (this.executionHistory.length > 1000) {
      this.executionHistory.shift();
    }

    if (this.logEnabled) {
      console.log(
        `[GenePluginDebug] ${pluginId} -> ${geneId}: ` +
        `value=${result.valueModifier.toFixed(3)}, ` +
        `expr=${result.expressionModifier.toFixed(3)}, ` +
        `time=${result.executionTime.toFixed(2)}ms`
      );
    }
  }

  public getExecutionHistory(filter?: {
    pluginId?: string;
    citizenId?: string;
    limit?: number;
  }): Array<{
    timestamp: number;
    pluginId: string;
    citizenId: string;
    geneId: string;
    result: {
      success: boolean;
      valueModifier: number;
      expressionModifier: number;
      executionTime: number;
    };
  }> {
    let history = [...this.executionHistory];

    if (filter?.pluginId) {
      history = history.filter(h => h.pluginId === filter.pluginId);
    }

    if (filter?.citizenId) {
      history = history.filter(h => h.citizenId === filter.citizenId);
    }

    if (filter?.limit) {
      history = history.slice(-filter.limit);
    }

    return history;
  }

  public clearHistory(): void {
    this.executionHistory = [];
  }

  public generateReport(): {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    pluginStats: Map<string, {
      executions: number;
      successRate: number;
      avgValueModifier: number;
    }>;
    recentErrors: Array<{
      timestamp: number;
      pluginId: string;
      error: string;
    }>;
  } {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(h => h.result.success).length;
    const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;

    const totalTime = this.executionHistory.reduce(
      (sum, h) => sum + h.result.executionTime, 0
    );
    const averageExecutionTime = totalExecutions > 0 ? totalTime / totalExecutions : 0;

    const pluginStats = new Map<string, {
      executions: number;
      successRate: number;
      avgValueModifier: number;
    }>();

    for (const entry of this.executionHistory) {
      const stats = pluginStats.get(entry.pluginId) || {
        executions: 0,
        successRate: 0,
        avgValueModifier: 0,
      };

      stats.executions++;
      if (entry.result.success) {
        stats.successRate = (stats.successRate * (stats.executions - 1) + 1) / stats.executions;
      }
      stats.avgValueModifier = 
        (stats.avgValueModifier * (stats.executions - 1) + entry.result.valueModifier) 
        / stats.executions;

      pluginStats.set(entry.pluginId, stats);
    }

    const errorLog = genePluginManager.getEngine().getErrorLog();
    const recentErrors = errorLog.slice(-10).map(e => ({
      timestamp: e.timestamp,
      pluginId: e.pluginId,
      error: e.error,
    }));

    return {
      totalExecutions,
      successRate,
      averageExecutionTime,
      pluginStats,
      recentErrors,
    };
  }

  public exportDebugData(): string {
    const report = this.generateReport();
    const pluginStatsObj: Record<string, unknown> = {};
    report.pluginStats.forEach((value, key) => {
      pluginStatsObj[key] = value;
    });

    return JSON.stringify({
      report: {
        ...report,
        pluginStats: pluginStatsObj,
      },
      history: this.executionHistory.slice(-100),
      exportedAt: Date.now(),
    }, null, 2);
  }
}

export const genePluginDebugger = GenePluginDebugger.getInstance();

/**
 * 初始化基因插件系统
 */
export async function initializeGenePluginSystem(): Promise<void> {
  await registerExamplePlugins();
  logger.info('GenePluginSystem', '基因插件系统初始化完成');
}
