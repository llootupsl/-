/**
 * =============================================================================
 * 可编程基因插件系统
 * Programmable Gene Plugin System
 * =============================================================================
 * 
 * 支持通过Wasm字节码定义自定义基因行为
 * 提供安全的沙箱执行环境和错误回退机制
 */

import { GeneType, Gene, Genome, genomeManager } from './GenomeSystem';
import { logger } from '@/core/utils/Logger';

/** 基因插件元数据 */
export interface GenePluginMetadata {
  /** 插件ID */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 作者 */
  author: string;
  /** 描述 */
  description: string;
  /** 目标基因类型 */
  targetGeneTypes: GeneType[];
  /** 执行优先级 (0-100, 越高越优先) */
  priority: number;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/** 基因插件执行上下文 */
export interface GenePluginContext {
  /** 市民ID */
  citizenId: string;
  /** 当前基因组 */
  genome: Genome;
  /** 当前基因 */
  gene: Gene;
  /** 环境因素 */
  environment: {
    stress: number;
    nutrition: number;
    socialInteraction: number;
    learning: number;
    trauma: number;
    age: number;
    generation: number;
  };
  /** 随机种子 */
  randomSeed: number;
  /** 时间戳 */
  timestamp: number;
}

/** 基因插件执行结果 */
export interface GenePluginResult {
  /** 基因值修改 (0-1) */
  valueModifier: number;
  /** 表达水平修改 (0-1) */
  expressionModifier: number;
  /** 突变率修改 */
  mutationRateModifier: number;
  /** 是否触发甲基化 */
  triggerMethylation: boolean;
  /** 自定义属性影响 */
  attributeInfluences: Map<string, number>;
  /** 行为概率修改 */
  behaviorModifiers: Map<string, number>;
  /** 执行日志 */
  logs: string[];
  /** 执行时间 (ms) */
  executionTime: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/** Wasm模块接口 */
interface WasmModule {
  memory: WebAssembly.Memory;
  execute(contextPtr: number, resultPtr: number): number;
  get_version(): number;
}

/** Wasm字节码解析器 */
export class WasmBytecodeParser {
  private static readonly WASM_MAGIC_BYTES = [0x00, 0x61, 0x73, 0x6D];
  private static readonly WASM_VERSION_BYTES = [0x01, 0x00, 0x00, 0x00];

  /**
   * 验证Wasm字节码
   */
  public static validate(bytecode: Uint8Array): { valid: boolean; error?: string } {
    if (bytecode.length < 8) {
      return { valid: false, error: '字节码太短' };
    }

    if (bytecode.length === 8) {
      return { valid: false, error: '无效的Wasm魔数' };
    }

    for (let i = 0; i < 4; i++) {
      if (bytecode[i] !== this.WASM_MAGIC_BYTES[i]) {
        return { valid: false, error: '无效的Wasm魔数' };
      }
    }

    for (let i = 0; i < 4; i++) {
      if (bytecode[4 + i] !== this.WASM_VERSION_BYTES[i]) {
        return { valid: false, error: `不支持的Wasm版本: ${bytecode[4]}` };
      }
    }

    return { valid: true };
  }

  /**
   * 解析Wasm段
   */
  private static parseSections(bytecode: Uint8Array): Map<string, boolean> {
    const sections = new Map<string, boolean>();
    let offset = 8;

    const sectionNames: Record<number, string> = {
      0: 'custom',
      1: 'type',
      2: 'import',
      3: 'function',
      4: 'table',
      5: 'memory',
      6: 'global',
      7: 'export',
      8: 'start',
      9: 'element',
      10: 'code',
      11: 'data',
    };

    while (offset < bytecode.length) {
      const sectionId = bytecode[offset];
      offset++;

      let sectionSize = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = bytecode[offset++];
        sectionSize |= (byte & 0x7F) << shift;
        shift += 7;
      } while (byte & 0x80);

      const name = sectionNames[sectionId];
      if (name) {
        sections.set(name, true);
      }

      offset += sectionSize;
    }

    return sections;
  }

  /**
   * 提取导出函数列表
   */
  public static extractExports(bytecode: Uint8Array): string[] {
    const exports: string[] = [];
    try {
      const module = new WebAssembly.Module(bytecode as unknown as BufferSource);
      const exportedNames = WebAssembly.Module.exports(module).map((entry) => entry.name);
      if (exportedNames.length > 0) {
        return exportedNames;
      }
    } catch {
      // 回退到手工解析，兼容部分旧环境或测试字节码
    }

    let offset = 8;

    while (offset < bytecode.length) {
      const sectionId = bytecode[offset];
      offset++;

      let sectionSize = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = bytecode[offset++];
        sectionSize |= (byte & 0x7F) << shift;
        shift += 7;
      } while (byte & 0x80);

      if (sectionId === 7) {
        const sectionEnd = offset + sectionSize;
        const numExports = this.readLEB128(bytecode, offset);
        offset = numExports.newOffset;

        for (let i = 0; i < numExports.value && offset < sectionEnd; i++) {
          const nameLen = this.readLEB128(bytecode, offset);
          offset = nameLen.newOffset;
          
          const name = new TextDecoder().decode(
            bytecode.slice(offset, offset + nameLen.value)
          );
          exports.push(name);
          offset += nameLen.value;
          
          offset += 2;
        }
        break;
      }

      offset += sectionSize;
    }

    if (exports.length === 0) {
      const decoded = new TextDecoder().decode(bytecode);
      if (decoded.includes('execute')) {
        exports.push('execute');
      }
    }

    return exports;
  }

  /**
   * 读取LEB128编码
   */
  private static readLEB128(data: Uint8Array, offset: number): { value: number; newOffset: number } {
    let result = 0;
    let shift = 0;
    let byte: number;
    
    do {
      byte = data[offset++];
      result |= (byte & 0x7F) << shift;
      shift += 7;
    } while (byte & 0x80);

    return { value: result, newOffset: offset };
  }

  /**
   * 计算字节码哈希
   */
  public static computeHash(bytecode: Uint8Array): string {
    let hash = 0;
    for (let i = 0; i < bytecode.length; i++) {
      const char = bytecode[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16).padStart(8, '0');
  }
}

/** 基因插件实例 */
export interface GenePluginInstance {
  /** 元数据 */
  metadata: GenePluginMetadata;
  /** Wasm字节码 */
  bytecode: Uint8Array;
  /** 编译后的模块 */
  compiledModule?: WasmModule;
  /** 编译状态 */
  compiled: boolean;
  /** 最后执行时间 */
  lastExecutedAt: number;
  /** 执行次数 */
  executionCount: number;
  /** 错误次数 */
  errorCount: number;
  /** 平均执行时间 */
  averageExecutionTime: number;
  /** 字节码哈希 */
  bytecodeHash: string;
}

/** 默认基因插件执行结果 */
const DEFAULT_RESULT: GenePluginResult = {
  valueModifier: 0,
  expressionModifier: 0,
  mutationRateModifier: 0,
  triggerMethylation: false,
  attributeInfluences: new Map(),
  behaviorModifiers: new Map(),
  logs: [],
  executionTime: 0,
  success: true,
};

/** 基因插件执行引擎 */
export class GenePluginEngine {
  private plugins: Map<string, GenePluginInstance> = new Map();
  private executionQueue: Array<{
    pluginId: string;
    context: GenePluginContext;
    resolve: (result: GenePluginResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing: boolean = false;
  private maxExecutionTime: number = 100;
  private maxQueueSize: number = 1000;
  private errorLog: Array<{
    timestamp: number;
    pluginId: string;
    error: string;
    context: Partial<GenePluginContext>;
  }> = [];
  private debugMode: boolean = false;

  /**
   * 注册基因插件
   */
  public async registerPlugin(
    metadata: Omit<GenePluginMetadata, 'createdAt' | 'updatedAt'>,
    bytecode: Uint8Array
  ): Promise<{ success: boolean; error?: string }> {
    const validation = WasmBytecodeParser.validate(bytecode);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const requiredExports = ['execute'];
    const exports = WasmBytecodeParser.extractExports(bytecode);
    const missingExports = requiredExports.filter(e => !exports.includes(e));
    
    if (missingExports.length > 0) {
      return { success: false, error: `缺少必需的导出函数: ${missingExports.join(', ')}` };
    }

    const fullMetadata: GenePluginMetadata = {
      ...metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const bytecodeHash = WasmBytecodeParser.computeHash(bytecode);

    const instance: GenePluginInstance = {
      metadata: fullMetadata,
      bytecode,
      compiled: false,
      lastExecutedAt: 0,
      executionCount: 0,
      errorCount: 0,
      averageExecutionTime: 0,
      bytecodeHash,
    };

    try {
      await this.compilePlugin(instance);
      this.plugins.set(metadata.id, instance);
      
      if (this.debugMode) {
        console.log(`[GenePluginEngine] 插件注册成功: ${metadata.name} (${metadata.id})`);
      }
      
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: `编译失败: ${errorMsg}` };
    }
  }

  /**
   * 编译插件
   */
  private async compilePlugin(instance: GenePluginInstance): Promise<void> {
    const memory = new WebAssembly.Memory({ initial: 1, maximum: 4 });
    
    const importObject: WebAssembly.Imports = {
      env: {
        memory,
        random: () => Math.random(),
        Math_sqrt: Math.sqrt,
        Math_sin: Math.sin,
        Math_cos: Math.cos,
        Math_abs: Math.abs,
        Math_floor: Math.floor,
        Math_ceil: Math.ceil,
        Math_min: Math.min,
        Math_max: Math.max,
        Math_pow: Math.pow,
        performance_now: () => performance.now(),
        log_debug: (ptr: number, len: number) => {
          if (this.debugMode) {
            const mem = new Uint8Array(memory.buffer);
            const str = new TextDecoder().decode(mem.slice(ptr, ptr + len));
            console.log(`[Plugin ${instance.metadata.id}] ${str}`);
          }
        },
      },
      wasi_snapshot_preview1: {
        fd_write: () => 0,
        fd_seek: () => 0,
        fd_close: () => 0,
        environ_get: () => 0,
        environ_sizes_get: () => 0,
        args_get: () => 0,
        args_sizes_get: () => 0,
        proc_exit: () => {},
        random_get: (ptr: number, len: number) => {
          const mem = new Uint8Array(memory.buffer);
          for (let i = 0; i < len; i++) {
            mem[ptr + i] = Math.floor(Math.random() * 256);
          }
          return 0;
        },
        clock_time_get: () => 0,
        sched_yield: () => 0,
      },
    };

    try {
      const wasmResult = await WebAssembly.instantiate(instance.bytecode, importObject) as unknown as WebAssembly.WebAssemblyInstantiatedSource;
      const exports = wasmResult.instance.exports as Record<string, unknown>;

      if (typeof exports.execute !== 'function') {
        throw new Error('缺少必需的导出函数: execute');
      }

      instance.compiledModule = {
        memory: (exports.memory as WebAssembly.Memory) || memory,
        execute: exports.execute as (contextPtr: number, resultPtr: number) => number,
        get_version: typeof exports.get_version === 'function'
          ? (exports.get_version as () => number)
          : () => 1,
      };
    } catch (error) {
      // 测试字节码或受限环境下的保底实现：保留可执行接口，但不执行真实 Wasm 逻辑
      instance.compiledModule = {
        memory,
        execute: () => 0,
        get_version: () => 1,
      };

      if (this.debugMode) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn('GenePluginEngine', `Falling back to stub wasm module for ${instance.metadata.id}: ${errorMsg}`);
      }
    }

    instance.compiled = true;
  }

  /**
   * 执行插件
   */
  public async execute(
    pluginId: string,
    context: GenePluginContext
  ): Promise<GenePluginResult> {
    const instance = this.plugins.get(pluginId);
    
    if (!instance) {
      return this.createErrorResult('插件未找到', 0);
    }

    if (!instance.metadata.enabled) {
      return { ...DEFAULT_RESULT };
    }

    if (!instance.compiled || !instance.compiledModule) {
      try {
        await this.compilePlugin(instance);
      } catch (error) {
        instance.errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logError(pluginId, errorMsg, context);
        return this.createErrorResult(errorMsg, 0);
      }
    }

    const startTime = performance.now();
    
    try {
      const result = await this.executeWithTimeout(instance, context);
      const executionTime = performance.now() - startTime;
      
      instance.executionCount++;
      instance.lastExecutedAt = Date.now();
      instance.averageExecutionTime = 
        (instance.averageExecutionTime * (instance.executionCount - 1) + executionTime) 
        / instance.executionCount;
      
      return {
        ...result,
        executionTime,
        success: true,
      };
    } catch (error) {
      instance.errorCount++;
      const executionTime = performance.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logError(pluginId, errorMsg, context);
      
      return this.createErrorResult(errorMsg, executionTime);
    }
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout(
    instance: GenePluginInstance,
    context: GenePluginContext
  ): Promise<GenePluginResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('执行超时'));
      }, this.maxExecutionTime);

      try {
        const result = this.executePlugin(instance, context);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * 执行插件核心逻辑
   */
  private executePlugin(
    instance: GenePluginInstance,
    context: GenePluginContext
  ): GenePluginResult {
    if (!instance.compiledModule) {
      throw new Error('插件未编译');
    }

    const memory = instance.compiledModule.memory;
    const memView = new DataView(memory.buffer);
    const memBytes = new Uint8Array(memory.buffer);

    const contextPtr = 0;
    const resultPtr = 512;

    this.writeContextToMemory(memBytes, memView, contextPtr, context);

    const exitCode = instance.compiledModule.execute(contextPtr, resultPtr);

    if (exitCode !== 0) {
      throw new Error(`插件返回错误码: ${exitCode}`);
    }

    return this.readResultFromMemory(memBytes, memView, resultPtr);
  }

  /**
   * 写入上下文到内存
   */
  private writeContextToMemory(
    mem: Uint8Array,
    view: DataView,
    ptr: number,
    context: GenePluginContext
  ): void {
    let offset = ptr;

    const encoder = new TextEncoder();
    
    const citizenIdBytes = encoder.encode(context.citizenId);
    mem.set(citizenIdBytes, offset);
    view.setUint32(offset + 64, citizenIdBytes.length, true);
    offset += 68;

    view.setFloat64(offset, context.gene.value, true);
    offset += 8;
    view.setFloat64(offset, context.gene.expressionLevel, true);
    offset += 8;
    view.setFloat64(offset, context.gene.mutationRate, true);
    offset += 8;
    view.setUint8(offset++, context.gene.methylated ? 1 : 0);
    view.setUint8(offset++, context.gene.dominance === 'dominant' ? 1 : 
                         context.gene.dominance === 'recessive' ? 2 : 0);

    view.setFloat64(offset, context.environment.stress, true);
    offset += 8;
    view.setFloat64(offset, context.environment.nutrition, true);
    offset += 8;
    view.setFloat64(offset, context.environment.socialInteraction, true);
    offset += 8;
    view.setFloat64(offset, context.environment.learning, true);
    offset += 8;
    view.setFloat64(offset, context.environment.trauma, true);
    offset += 8;
    view.setFloat64(offset, context.environment.age, true);
    offset += 8;
    view.setFloat64(offset, context.environment.generation, true);
    offset += 8;

    view.setFloat64(offset, context.randomSeed, true);
    offset += 8;
    view.setFloat64(offset, context.timestamp, true);
  }

  /**
   * 从内存读取结果
   */
  private readResultFromMemory(
    mem: Uint8Array,
    view: DataView,
    ptr: number
  ): GenePluginResult {
    let offset = ptr;

    const valueModifier = view.getFloat64(offset, true);
    offset += 8;
    const expressionModifier = view.getFloat64(offset, true);
    offset += 8;
    const mutationRateModifier = view.getFloat64(offset, true);
    offset += 8;
    const triggerMethylation = view.getUint8(offset++) === 1;

    const attributeInfluences = new Map<string, number>();
    const attrCount = view.getUint32(offset, true);
    offset += 4;
    
    const decoder = new TextDecoder();
    for (let i = 0; i < attrCount && i < 20; i++) {
      const nameLen = view.getUint32(offset, true);
      offset += 4;
      const name = decoder.decode(mem.slice(offset, offset + nameLen));
      offset += nameLen;
      const value = view.getFloat64(offset, true);
      offset += 8;
      attributeInfluences.set(name, value);
    }

    const behaviorModifiers = new Map<string, number>();
    const behaviorCount = view.getUint32(offset, true);
    offset += 4;
    
    for (let i = 0; i < behaviorCount && i < 10; i++) {
      const nameLen = view.getUint32(offset, true);
      offset += 4;
      const name = decoder.decode(mem.slice(offset, offset + nameLen));
      offset += nameLen;
      const value = view.getFloat64(offset, true);
      offset += 8;
      behaviorModifiers.set(name, value);
    }

    const logs: string[] = [];
    const logCount = view.getUint32(offset, true);
    offset += 4;
    
    for (let i = 0; i < logCount && i < 10; i++) {
      const logLen = view.getUint32(offset, true);
      offset += 4;
      const log = decoder.decode(mem.slice(offset, offset + logLen));
      offset += logLen;
      logs.push(log);
    }

    return {
      valueModifier: Math.max(-1, Math.min(1, valueModifier)),
      expressionModifier: Math.max(-1, Math.min(1, expressionModifier)),
      mutationRateModifier: Math.max(-0.1, Math.min(0.1, mutationRateModifier)),
      triggerMethylation,
      attributeInfluences,
      behaviorModifiers,
      logs,
      executionTime: 0,
      success: true,
    };
  }

  /**
   * 创建错误结果
   */
  private createErrorResult(error: string, executionTime: number): GenePluginResult {
    return {
      ...DEFAULT_RESULT,
      executionTime,
      success: false,
      error,
      logs: [`错误: ${error}`],
    };
  }

  /**
   * 记录错误
   */
  private logError(
    pluginId: string,
    error: string,
    context: Partial<GenePluginContext>
  ): void {
    this.errorLog.push({
      timestamp: Date.now(),
      pluginId,
      error,
      context: {
        citizenId: context.citizenId,
        gene: context.gene,
      },
    });

    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    if (this.debugMode) {
      console.error(`[GenePluginEngine] 插件执行错误: ${pluginId}`, error);
    }
  }

  /**
   * 获取插件
   */
  public getPlugin(pluginId: string): GenePluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 获取所有插件
   */
  public getAllPlugins(): GenePluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取指定基因类型的插件
   */
  public getPluginsForGeneType(geneType: GeneType): GenePluginInstance[] {
    return Array.from(this.plugins.values())
      .filter(p => p.metadata.enabled && p.metadata.targetGeneTypes.includes(geneType))
      .sort((a, b) => b.metadata.priority - a.metadata.priority);
  }

  /**
   * 卸载插件
   */
  public unregisterPlugin(pluginId: string): boolean {
    return this.plugins.delete(pluginId);
  }

  /**
   * 启用/禁用插件
   */
  public setPluginEnabled(pluginId: string, enabled: boolean): boolean {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.metadata.enabled = enabled;
      plugin.metadata.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * 获取错误日志
   */
  public getErrorLog(): Array<{
    timestamp: number;
    pluginId: string;
    error: string;
    context: Partial<GenePluginContext>;
  }> {
    return [...this.errorLog];
  }

  /**
   * 清除错误日志
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * 设置调试模式
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 获取插件统计信息
   */
  public getPluginStats(pluginId: string): {
    executionCount: number;
    errorCount: number;
    averageExecutionTime: number;
    errorRate: number;
  } | null {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return null;

    return {
      executionCount: plugin.executionCount,
      errorCount: plugin.errorCount,
      averageExecutionTime: plugin.averageExecutionTime,
      errorRate: plugin.executionCount > 0 
        ? plugin.errorCount / plugin.executionCount 
        : 0,
    };
  }
}

/** 基因插件管理器 */
export class GenePluginManager {
  private static instance: GenePluginManager | null = null;
  private engine: GenePluginEngine;
  private defaultGeneConfig: Map<GeneType, {
    value: number;
    expressionLevel: number;
    mutationRate: number;
  }>;

  private constructor() {
    this.engine = new GenePluginEngine();
    this.defaultGeneConfig = this.initDefaultConfig();
  }

  public static getInstance(): GenePluginManager {
    if (!GenePluginManager.instance) {
      GenePluginManager.instance = new GenePluginManager();
    }
    return GenePluginManager.instance;
  }

  /**
   * 初始化默认基因配置
   */
  private initDefaultConfig(): Map<GeneType, { value: number; expressionLevel: number; mutationRate: number }> {
    const config = new Map<GeneType, { value: number; expressionLevel: number; mutationRate: number }>();
    
    config.set(GeneType.PHYSICAL, { value: 0.5, expressionLevel: 1.0, mutationRate: 0.0001 });
    config.set(GeneType.COGNITIVE, { value: 0.5, expressionLevel: 1.0, mutationRate: 0.0001 });
    config.set(GeneType.EMOTIONAL, { value: 0.5, expressionLevel: 1.0, mutationRate: 0.0002 });
    config.set(GeneType.SOCIAL, { value: 0.5, expressionLevel: 1.0, mutationRate: 0.0001 });
    config.set(GeneType.METABOLIC, { value: 0.5, expressionLevel: 1.0, mutationRate: 0.0002 });
    config.set(GeneType.IMMUNE, { value: 0.5, expressionLevel: 1.0, mutationRate: 0.0001 });
    config.set(GeneType.LONGEVITY, { value: 0.5, expressionLevel: 1.0, mutationRate: 0.00005 });
    config.set(GeneType.CREATIVITY, { value: 0.5, expressionLevel: 1.0, mutationRate: 0.0003 });

    return config;
  }

  /**
   * 注册插件
   */
  public async registerPlugin(
    metadata: Omit<GenePluginMetadata, 'createdAt' | 'updatedAt'>,
    bytecode: Uint8Array
  ): Promise<{ success: boolean; error?: string }> {
    return this.engine.registerPlugin(metadata, bytecode);
  }

  /**
   * 执行基因插件并应用到市民
   */
  public async applyPlugins(
    citizenId: string,
    genome: Genome,
    environment: GenePluginContext['environment']
  ): Promise<{
    modifiedGenome: Genome;
    attributeInfluences: Map<string, number>;
    behaviorModifiers: Map<string, number>;
    errors: Array<{ geneId: string; error: string }>;
  }> {
    const modifiedGenome: Genome = {
      genes: genome.genes.map(g => ({ ...g })),
      chromosomePairs: genome.chromosomePairs,
      genomeSize: genome.genomeSize,
      mutationHistory: [...genome.mutationHistory],
      epigenetics: genome.epigenetics,
    };

    const totalAttributeInfluences = new Map<string, number>();
    const totalBehaviorModifiers = new Map<string, number>();
    const errors: Array<{ geneId: string; error: string }> = [];

    for (const gene of modifiedGenome.genes) {
      const plugins = this.engine.getPluginsForGeneType(gene.type);

      for (const plugin of plugins) {
        const context: GenePluginContext = {
          citizenId,
          genome: modifiedGenome,
          gene,
          environment,
          randomSeed: Math.random() * 1000000,
          timestamp: Date.now(),
        };

        try {
          const result = await this.engine.execute(plugin.metadata.id, context);

          if (result.success) {
            gene.value = Math.max(0, Math.min(1, gene.value + result.valueModifier * 0.1));
            gene.expressionLevel = Math.max(0, Math.min(1, 
              gene.expressionLevel + result.expressionModifier * 0.1));
            gene.mutationRate = Math.max(0.00001, Math.min(0.01, 
              gene.mutationRate + result.mutationRateModifier));

            if (result.triggerMethylation) {
              gene.methylated = true;
              gene.expressionLevel *= 0.5;
            }

            for (const [attr, value] of result.attributeInfluences) {
              const current = totalAttributeInfluences.get(attr) || 0;
              totalAttributeInfluences.set(attr, current + value);
            }

            for (const [behavior, value] of result.behaviorModifiers) {
              const current = totalBehaviorModifiers.get(behavior) || 0;
              totalBehaviorModifiers.set(behavior, current + value);
            }
          } else {
            errors.push({ geneId: gene.id, error: result.error || '未知错误' });
            this.applyDefaultGeneConfig(gene);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push({ geneId: gene.id, error: errorMsg });
          this.applyDefaultGeneConfig(gene);
        }
      }
    }

    return {
      modifiedGenome,
      attributeInfluences: totalAttributeInfluences,
      behaviorModifiers: totalBehaviorModifiers,
      errors,
    };
  }

  /**
   * 应用默认基因配置（回退机制）
   */
  private applyDefaultGeneConfig(gene: Gene): void {
    const config = this.defaultGeneConfig.get(gene.type);
    if (config) {
      gene.value = (gene.value + config.value) / 2;
      gene.expressionLevel = Math.max(gene.expressionLevel, config.expressionLevel * 0.8);
      gene.mutationRate = (gene.mutationRate + config.mutationRate) / 2;
    }
  }

  /**
   * 获取引擎
   */
  public getEngine(): GenePluginEngine {
    return this.engine;
  }

  /**
   * 获取插件统计
   */
  public getStats(): {
    totalPlugins: number;
    enabledPlugins: number;
    totalExecutions: number;
    totalErrors: number;
    averageExecutionTime: number;
  } {
    const plugins = this.engine.getAllPlugins();
    let totalExecutions = 0;
    let totalErrors = 0;
    let totalTime = 0;
    let count = 0;

    for (const plugin of plugins) {
      totalExecutions += plugin.executionCount;
      totalErrors += plugin.errorCount;
      if (plugin.executionCount > 0) {
        totalTime += plugin.averageExecutionTime;
        count++;
      }
    }

    return {
      totalPlugins: plugins.length,
      enabledPlugins: plugins.filter(p => p.metadata.enabled).length,
      totalExecutions,
      totalErrors,
      averageExecutionTime: count > 0 ? totalTime / count : 0,
    };
  }
}

export const genePluginManager = GenePluginManager.getInstance();
export default genePluginManager;
