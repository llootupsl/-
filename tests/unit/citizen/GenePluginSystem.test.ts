/**
 * =============================================================================
 * 基因插件系统测试
 * Gene Plugin System Tests
 * =============================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GenePluginEngine,
  GenePluginManager,
  WasmBytecodeParser,
  genePluginManager,
} from '../../../src/citizen/GenePluginSystem';
import { GeneType, Gene, Genome, EpigeneticsSystem } from '../../../src/citizen/GenomeSystem';

describe('WasmBytecodeParser', () => {
  describe('validate', () => {
    it('should reject bytecode that is too short', () => {
      const shortBytecode = new Uint8Array([0x00, 0x01, 0x02]);
      const result = WasmBytecodeParser.validate(shortBytecode);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('字节码太短');
    });

    it('should reject bytecode with invalid magic number', () => {
      const invalidMagic = new Uint8Array(8);
      invalidMagic.set([0x00, 0x61, 0x73, 0x6D], 0);
      invalidMagic.set([0x01, 0x00, 0x00, 0x00], 4);
      const result = WasmBytecodeParser.validate(invalidMagic);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('无效的Wasm魔数');
    });

    it('should accept valid minimal wasm bytecode', () => {
      const validWasm = new Uint8Array([
        0x00, 0x61, 0x73, 0x6D,
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
        0x03, 0x02, 0x01, 0x00,
        0x0A, 0x04, 0x01, 0x02, 0x00, 0x0B,
      ]);
      const result = WasmBytecodeParser.validate(validWasm);
      expect(result.valid).toBe(true);
    });
  });

  describe('computeHash', () => {
    it('should produce consistent hashes for same bytecode', () => {
      const bytecode = new Uint8Array([0x00, 0x61, 0x73, 0x6D, 0x01, 0x00, 0x00, 0x00]);
      const hash1 = WasmBytecodeParser.computeHash(bytecode);
      const hash2 = WasmBytecodeParser.computeHash(bytecode);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different bytecode', () => {
      const bytecode1 = new Uint8Array([0x00, 0x61, 0x73, 0x6D, 0x01, 0x00, 0x00, 0x00]);
      const bytecode2 = new Uint8Array([0x00, 0x61, 0x73, 0x6D, 0x02, 0x00, 0x00, 0x00]);
      const hash1 = WasmBytecodeParser.computeHash(bytecode1);
      const hash2 = WasmBytecodeParser.computeHash(bytecode2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('extractExports', () => {
    it('should extract export names from valid wasm', () => {
      const wasmWithExports = new Uint8Array([
        0x00, 0x61, 0x73, 0x6D,
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
        0x03, 0x02, 0x01, 0x00,
        0x07, 0x0A, 0x01,
        0x07, 0x65, 0x78, 0x65, 0x63, 0x75, 0x74, 0x65,
        0x00, 0x00,
        0x0A, 0x04, 0x01, 0x02, 0x00, 0x0B,
      ]);
      const exports = WasmBytecodeParser.extractExports(wasmWithExports);
      expect(exports).toContain('execute');
    });
  });
});

describe('GenePluginEngine', () => {
  let engine: GenePluginEngine;

  beforeEach(() => {
    engine = new GenePluginEngine();
    engine.setDebugMode(true);
  });

  describe('registerPlugin', () => {
    it('should reject invalid bytecode', async () => {
      const invalidBytecode = new Uint8Array([0x00, 0x01]);
      const result = await engine.registerPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        author: 'Test',
        description: 'Test plugin',
        targetGeneTypes: [GeneType.PHYSICAL],
        priority: 50,
        enabled: true,
      }, invalidBytecode);

      expect(result.success).toBe(false);
      expect(result.error).toContain('字节码太短');
    });

    it('should accept valid wasm bytecode with execute export', async () => {
      const validWasm = new Uint8Array([
        0x00, 0x61, 0x73, 0x6D,
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x08, 0x02, 0x60, 0x02, 0x7F, 0x7F, 0x01, 0x7F,
        0x60, 0x00, 0x01, 0x7F,
        0x03, 0x03, 0x02, 0x00, 0x01,
        0x07, 0x0D, 0x02,
        0x07, 0x65, 0x78, 0x65, 0x63, 0x75, 0x74, 0x65,
        0x00, 0x00,
        0x0A, 0x0B, 0x01,
        0x09, 0x00, 0x20, 0x00, 0x20, 0x01, 0x41, 0x00, 0x6A, 0x0B,
      ]);

      const result = await engine.registerPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        author: 'Test',
        description: 'Test plugin',
        targetGeneTypes: [GeneType.PHYSICAL],
        priority: 50,
        enabled: true,
      }, validWasm);

      expect(result.success).toBe(true);
    });
  });

  describe('getPluginsForGeneType', () => {
    it('should return empty array when no plugins registered', () => {
      const plugins = engine.getPluginsForGeneType(GeneType.PHYSICAL);
      expect(plugins).toHaveLength(0);
    });

    it('should return plugins sorted by priority', async () => {
      const validWasm = new Uint8Array([
        0x00, 0x61, 0x73, 0x6D,
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x08, 0x02, 0x60, 0x02, 0x7F, 0x7F, 0x01, 0x7F,
        0x60, 0x00, 0x01, 0x7F,
        0x03, 0x03, 0x02, 0x00, 0x01,
        0x07, 0x0D, 0x02,
        0x07, 0x65, 0x78, 0x65, 0x63, 0x75, 0x74, 0x65,
        0x00, 0x00,
        0x0A, 0x0B, 0x01,
        0x09, 0x00, 0x20, 0x00, 0x20, 0x01, 0x41, 0x00, 0x6A, 0x0B,
      ]);

      await engine.registerPlugin({
        id: 'low-priority',
        name: 'Low Priority',
        version: '1.0.0',
        author: 'Test',
        description: 'Low priority plugin',
        targetGeneTypes: [GeneType.PHYSICAL],
        priority: 10,
        enabled: true,
      }, validWasm);

      await engine.registerPlugin({
        id: 'high-priority',
        name: 'High Priority',
        version: '1.0.0',
        author: 'Test',
        description: 'High priority plugin',
        targetGeneTypes: [GeneType.PHYSICAL],
        priority: 90,
        enabled: true,
      }, validWasm);

      const plugins = engine.getPluginsForGeneType(GeneType.PHYSICAL);
      expect(plugins).toHaveLength(2);
      expect(plugins[0].metadata.priority).toBeGreaterThan(plugins[1].metadata.priority);
    });
  });

  describe('setPluginEnabled', () => {
    it('should enable/disable plugins', async () => {
      const validWasm = new Uint8Array([
        0x00, 0x61, 0x73, 0x6D,
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x08, 0x02, 0x60, 0x02, 0x7F, 0x7F, 0x01, 0x7F,
        0x60, 0x00, 0x01, 0x7F,
        0x03, 0x03, 0x02, 0x00, 0x01,
        0x07, 0x0D, 0x02,
        0x07, 0x65, 0x78, 0x65, 0x63, 0x75, 0x74, 0x65,
        0x00, 0x00,
        0x0A, 0x0B, 0x01,
        0x09, 0x00, 0x20, 0x00, 0x20, 0x01, 0x41, 0x00, 0x6A, 0x0B,
      ]);

      await engine.registerPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        author: 'Test',
        description: 'Test plugin',
        targetGeneTypes: [GeneType.PHYSICAL],
        priority: 50,
        enabled: true,
      }, validWasm);

      engine.setPluginEnabled('test-plugin', false);
      const plugin = engine.getPlugin('test-plugin');
      expect(plugin?.metadata.enabled).toBe(false);

      engine.setPluginEnabled('test-plugin', true);
      expect(plugin?.metadata.enabled).toBe(true);
    });
  });

  describe('unregisterPlugin', () => {
    it('should remove plugin from registry', async () => {
      const validWasm = new Uint8Array([
        0x00, 0x61, 0x73, 0x6D,
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x08, 0x02, 0x60, 0x02, 0x7F, 0x7F, 0x01, 0x7F,
        0x60, 0x00, 0x01, 0x7F,
        0x03, 0x03, 0x02, 0x00, 0x01,
        0x07, 0x0D, 0x02,
        0x07, 0x65, 0x78, 0x65, 0x63, 0x75, 0x74, 0x65,
        0x00, 0x00,
        0x0A, 0x0B, 0x01,
        0x09, 0x00, 0x20, 0x00, 0x20, 0x01, 0x41, 0x00, 0x6A, 0x0B,
      ]);

      await engine.registerPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        author: 'Test',
        description: 'Test plugin',
        targetGeneTypes: [GeneType.PHYSICAL],
        priority: 50,
        enabled: true,
      }, validWasm);

      expect(engine.getPlugin('test-plugin')).toBeDefined();
      
      engine.unregisterPlugin('test-plugin');
      
      expect(engine.getPlugin('test-plugin')).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should return error result for non-existent plugin', async () => {
      const context = createMockContext();
      const result = await engine.execute('non-existent', context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('插件未找到');
    });

    it('should return default result for disabled plugin', async () => {
      const validWasm = new Uint8Array([
        0x00, 0x61, 0x73, 0x6D,
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x08, 0x02, 0x60, 0x02, 0x7F, 0x7F, 0x01, 0x7F,
        0x60, 0x00, 0x01, 0x7F,
        0x03, 0x03, 0x02, 0x00, 0x01,
        0x07, 0x0D, 0x02,
        0x07, 0x65, 0x78, 0x65, 0x63, 0x75, 0x74, 0x65,
        0x00, 0x00,
        0x0A, 0x0B, 0x01,
        0x09, 0x00, 0x20, 0x00, 0x20, 0x01, 0x41, 0x00, 0x6A, 0x0B,
      ]);

      await engine.registerPlugin({
        id: 'disabled-plugin',
        name: 'Disabled Plugin',
        version: '1.0.0',
        author: 'Test',
        description: 'Disabled plugin',
        targetGeneTypes: [GeneType.PHYSICAL],
        priority: 50,
        enabled: false,
      }, validWasm);

      const context = createMockContext();
      const result = await engine.execute('disabled-plugin', context);
      
      expect(result.success).toBe(true);
      expect(result.valueModifier).toBe(0);
    });
  });

  describe('getPluginStats', () => {
    it('should return null for non-existent plugin', () => {
      const stats = engine.getPluginStats('non-existent');
      expect(stats).toBeNull();
    });

    it('should return stats for registered plugin', async () => {
      const validWasm = new Uint8Array([
        0x00, 0x61, 0x73, 0x6D,
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x08, 0x02, 0x60, 0x02, 0x7F, 0x7F, 0x01, 0x7F,
        0x60, 0x00, 0x01, 0x7F,
        0x03, 0x03, 0x02, 0x00, 0x01,
        0x07, 0x0D, 0x02,
        0x07, 0x65, 0x78, 0x65, 0x63, 0x75, 0x74, 0x65,
        0x00, 0x00,
        0x0A, 0x0B, 0x01,
        0x09, 0x00, 0x20, 0x00, 0x20, 0x01, 0x41, 0x00, 0x6A, 0x0B,
      ]);

      await engine.registerPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        author: 'Test',
        description: 'Test plugin',
        targetGeneTypes: [GeneType.PHYSICAL],
        priority: 50,
        enabled: true,
      }, validWasm);

      const stats = engine.getPluginStats('test-plugin');
      expect(stats).toBeDefined();
      expect(stats?.executionCount).toBe(0);
      expect(stats?.errorCount).toBe(0);
    });
  });
});

describe('GenePluginManager', () => {
  let manager: GenePluginManager;

  beforeEach(() => {
    manager = GenePluginManager.getInstance();
    manager.getEngine().setDebugMode(true);
  });

  describe('getStats', () => {
    it('should return overall statistics', () => {
      const stats = manager.getStats();
      expect(stats).toHaveProperty('totalPlugins');
      expect(stats).toHaveProperty('enabledPlugins');
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('averageExecutionTime');
    });
  });

  describe('applyPlugins', () => {
    it('should return modified genome with no plugins', async () => {
      const genome = createMockGenome();
      const result = await manager.applyPlugins('citizen-1', genome, {
        stress: 0.3,
        nutrition: 0.7,
        socialInteraction: 0.5,
        learning: 0.6,
        trauma: 0.1,
        age: 25,
        generation: 1,
      });

      expect(result.modifiedGenome).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });
});

function createMockGene(): Gene {
  return {
    id: 'gene_1',
    name: 'Test Gene',
    type: GeneType.PHYSICAL,
    value: 0.5,
    dominance: 'co-dominant',
    mutationRate: 0.001,
    methylated: false,
    expressionLevel: 1.0,
  };
}

function createMockGenome(): Genome {
  return {
    genes: [createMockGene()],
    chromosomePairs: 23,
    genomeSize: 1,
    mutationHistory: [],
    epigenetics: new EpigeneticsSystem(),
  };
}

function createMockContext() {
  return {
    citizenId: 'citizen-1',
    genome: createMockGenome(),
    gene: createMockGene(),
    environment: {
      stress: 0.3,
      nutrition: 0.7,
      socialInteraction: 0.5,
      learning: 0.6,
      trauma: 0.1,
      age: 25,
      generation: 1,
    },
    randomSeed: 12345,
    timestamp: Date.now(),
  };
}
