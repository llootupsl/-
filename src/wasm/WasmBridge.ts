/**
 * =============================================================================
 * WASM Bridge - WebAssembly 模块桥接层
 * =============================================================================
 * 
 * 提供对 WASM 模块的统一访问接口：
 * - 量子模拟器 (QuantumSimulator)
 * - 脉冲神经网络 (SpikingNeuralNetwork)
 * - 路径寻路 (PathFinder)
 * - 八字命理 (BaZiEngine)
 * 
 * 支持优雅降级：当 WASM 不可用时使用 JavaScript 备用实现
 */

import { QuantumSimulator } from '@/quantum/QuantumSimulator';
import { SpikingNeuralNetwork } from '@/compute/SpikingNeuralNetwork';
import { PathFinder } from '@/compute/PathFinder';
import { BaZiEngine } from '@/fortune/BaZiSystem';

let wasmReady = false;
let wasmVersion = '0.0.0-js-fallback';

interface WasmModule {
  get_version(): string;
  get_build_info(): string;
  benchmark_math(iterations: number): number;
  benchmark_matrix_multiply(size: number): number;
  timestamp_ms(): number;
  timestamp_ns(): bigint;
  QuantumSimulator: typeof QuantumSimulator;
  SpikingNeuralNetwork: typeof SpikingNeuralNetwork;
  PathFinder: typeof PathFinder;
  BaZiEngine: typeof BaZiEngine;
}

let wasmModule: WasmModule | null = null;

/**
 * 初始化 WASM 模块
 * 尝试加载真正的 WASM，失败则使用 JS 备用实现
 */
export async function initWasm(): Promise<boolean> {
  try {
    const wasmPath = '/wasm/omnis_apien_wasm_bg.wasm';
    
    const wasmBuffer = await fetch(wasmPath).then(r => {
      if (!r.ok) throw new Error('WASM not found');
      return r.arrayBuffer();
    });
    
    const wasmResult = await WebAssembly.instantiate(wasmBuffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 256, maximum: 4096 }),
        random: () => Math.random(),
        Math_sqrt: Math.sqrt,
        Math_sin: Math.sin,
        Math_cos: Math.cos,
        Math_tan: Math.tan,
        Math_exp: Math.exp,
        Math_log: Math.log,
        Math_pow: Math.pow,
        Math_abs: Math.abs,
        Math_floor: Math.floor,
        Math_ceil: Math.ceil,
        Math_min: Math.min,
        Math_max: Math.max,
        performance_now: () => performance.now(),
        console_log: (ptr: number, len: number) => {
          console.log(`[WASM] ptr=${ptr}, len=${len}`);
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
          const memory = new Uint8Array(256);
          for (let i = 0; i < len; i++) {
            memory[ptr + i] = Math.floor(Math.random() * 256);
          }
          return 0;
        },
        clock_time_get: () => 0,
        sched_yield: () => 0,
      },
    });
    
    wasmModule = wasmResult.instance.exports as unknown as WasmModule;
    wasmReady = true;
    wasmVersion = (wasmModule.get_version?.() || '1.0.0');
    
    console.log(`[WasmBridge] WASM loaded successfully, version: ${wasmVersion}`);
    return true;
  } catch (error) {
    console.warn('[WasmBridge] WASM load failed, using JavaScript fallback:', error);
    wasmReady = true;
    wasmVersion = '0.0.0-js-fallback';
    return true;
  }
}

/**
 * 检查 WASM 是否就绪
 */
export function isWasmReady(): boolean {
  return wasmReady;
}

/**
 * 获取 WASM 版本
 */
export function getWasmVersion(): string {
  return wasmVersion;
}

/**
 * 运行基准测试
 */
export function runBenchmark(type: 'math' | 'matrix' = 'math'): number {
  if (!wasmReady) {
    console.warn('[WasmBridge] WASM not ready, using JS benchmark');
    const start = performance.now();
    if (type === 'math') {
      let result = 0;
      for (let i = 0; i < 100000; i++) {
        const x = i / 1000;
        result += Math.sqrt(Math.sin(x) * Math.cos(x) + Math.tan(x));
      }
    } else {
      const size = 64;
      const a = new Float32Array(size * size);
      const b = new Float32Array(size * size);
      const c = new Float32Array(size * size);
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          let sum = 0;
          for (let k = 0; k < size; k++) {
            sum += a[i * size + k] * b[k * size + j];
          }
          c[i * size + j] = sum;
        }
      }
    }
    return performance.now() - start;
  }
  
  if (type === 'math') {
    return wasmModule?.benchmark_math?.(100000) || 0;
  } else {
    return wasmModule?.benchmark_matrix_multiply?.(64) || 0;
  }
}

/**
 * =============================================================================
 * 量子模拟器包装器
 * =============================================================================
 */
class QuantumWrapper {
  private simulator: QuantumSimulator | null = null;
  private numQubits: number = 0;
  private state: Float32Array = new Float32Array(0);
  private initialized: boolean = false;

  init(numQubits: number): void {
    this.numQubits = numQubits;
    this.simulator = new QuantumSimulator(numQubits);
    this.state = new Float32Array(Math.pow(2, numQubits) * 2);
    this.state[0] = 1;
    this.state[1] = 0;
    this.initialized = true;
    console.log(`[QuantumWrapper] Initialized with ${numQubits} qubits`);
  }

  hadamard(qubit: number): void {
    if (!this.initialized) return;
    this.simulator?.hadamard(qubit);
  }

  cnot(control: number, target: number): void {
    if (!this.initialized) return;
    this.simulator?.cnot(control, target);
  }

  phase(qubit: number, angle: number): void {
    if (!this.initialized) return;
    this.simulator?.phase(qubit, angle);
  }

  measure(): { measurements: number[]; confidence: number; coherence: number } {
    if (!this.initialized) {
      return { measurements: [], confidence: 0, coherence: 0 };
    }
    
    const result = this.simulator?.measure() || { measurements: [], confidence: 0.5, coherence: 0.5 };
    return result;
  }

  applyDecisionState(options: string[]): void {
    if (!this.initialized || options.length === 0) return;
    
    const numOptions = Math.min(options.length, Math.pow(2, this.numQubits));
    
    for (let i = 0; i < this.numQubits; i++) {
      this.hadamard(i);
    }
    
    for (let i = 0; i < this.numQubits - 1; i++) {
      this.cnot(i, i + 1);
    }
    
    const randomPhase = Math.random() * Math.PI * 2;
    this.phase(0, randomPhase);
  }

  getState(): Float32Array {
    return this.state;
  }

  reset(): void {
    if (this.initialized) {
      this.state.fill(0);
      this.state[0] = 1;
      this.state[1] = 0;
    }
  }
}

/**
 * =============================================================================
 * SNN 脉冲神经网络包装器
 * =============================================================================
 */
class SNNWrapper {
  private snn: SpikingNeuralNetwork | null = null;
  private numNeurons: number = 0;
  private numInputs: number = 0;
  private initialized: boolean = false;
  private lastSpikeTime: number = 0;
  private currentTime: number = 0;

  init(numNeurons: number, numInputs: number): void {
    this.numNeurons = numNeurons;
    this.numInputs = numInputs;
    this.snn = new SpikingNeuralNetwork(numNeurons, numInputs);
    this.initialized = true;
    console.log(`[SNNWrapper] Initialized with ${numNeurons} neurons, ${numInputs} inputs`);
  }

  step(inputs: number[], dt: number, threshold: number): number {
    if (!this.initialized) return 0;
    
    this.currentTime += dt;
    const spikes = this.snn?.step(inputs, dt, this.currentTime) || [];
    const spikeCount = spikes.filter(s => s > 0).length;
    this.lastSpikeTime = spikeCount > 0 ? this.currentTime : this.lastSpikeTime;
    
    return spikeCount;
  }

  getFiringRate(windowMs: number = 100): number {
    if (!this.initialized) return 0;
    return this.snn?.getFiringRate(windowMs) || 0;
  }

  getMembranePotentials(): Float32Array {
    if (!this.initialized) return new Float32Array(0);
    return this.snn?.getMembranePotentials() || new Float32Array(0);
  }

  applySTDP(preSpikes: number[], postSpikes: number[], dt: number): void {
    if (!this.initialized) return;
    this.snn?.applySTDP(preSpikes, postSpikes, dt);
  }

  reset(): void {
    if (this.initialized) {
      this.snn?.reset();
      this.currentTime = 0;
      this.lastSpikeTime = 0;
    }
  }

  getNeuronCount(): number {
    return this.numNeurons;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * =============================================================================
 * 路径寻路包装器
 * =============================================================================
 */
class PathFinderWrapper {
  private pathFinder: PathFinder | null = null;
  private width: number = 0;
  private height: number = 0;
  private obstacles: Uint8Array = new Uint8Array(0);
  private initialized: boolean = false;

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.pathFinder = new PathFinder(width, height);
    this.obstacles = new Uint8Array(width * height);
    this.initialized = true;
    console.log(`[PathFinderWrapper] Initialized ${width}x${height} grid`);
  }

  findPath(startX: number, startY: number, endX: number, endY: number, obstacles?: number[]): [number, number][] {
    if (!this.initialized) {
      return [[endX, endY]];
    }
    
    if (obstacles) {
      this.obstacles = new Uint8Array(obstacles);
    }
    
    const result = this.pathFinder?.findPath(startX, startY, endX, endY, this.obstacles);
    if (result?.found && result.path) {
      return result.path.map(p => [p.x, p.y] as [number, number]);
    }
    return [[endX, endY]];
  }

  setObstacle(x: number, y: number, blocked: boolean): void {
    if (!this.initialized) return;
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.obstacles[y * this.width + x] = blocked ? 1 : 0;
    }
  }

  reset(): void {
    if (this.initialized) {
      this.obstacles.fill(0);
    }
  }
}

/**
 * =============================================================================
 * 八字命理包装器
 * =============================================================================
 */
class BaziWrapper {
  private engine: BaZiEngine | null = null;
  private initialized: boolean = false;

  init(): void {
    this.engine = new BaZiEngine();
    this.initialized = true;
    console.log('[BaziWrapper] Initialized');
  }

  calculate(year: number, month: number, day: number, hour: number): {
    year: { stem: string; branch: string; element: string };
    month: { stem: string; branch: string; element: string };
    day: { stem: string; branch: string; element: string };
    hour: { stem: string; branch: string; element: string };
    elementStrength: string;
    dayMasterStrength: string;
  } {
    if (!this.initialized) {
      return {
        year: { stem: '甲', branch: '子', element: '木' },
        month: { stem: '乙', branch: '丑', element: '木' },
        day: { stem: '丙', branch: '寅', element: '火' },
        hour: { stem: '丁', branch: '卯', element: '火' },
        elementStrength: '平衡',
        dayMasterStrength: '中和',
      };
    }
    
    return this.engine?.calculate(year, month, day, hour) || {
      year: { stem: '甲', branch: '子', element: '木' },
      month: { stem: '乙', branch: '丑', element: '木' },
      day: { stem: '丙', branch: '寅', element: '火' },
      hour: { stem: '丁', branch: '卯', element: '火' },
      elementStrength: '平衡',
      dayMasterStrength: '中和',
    };
  }

  getFortune(bazi: unknown): { luck: number; description: string } {
    return { luck: 0.5, description: '运势平稳' };
  }
}

export const wasmQuantum = new QuantumWrapper();
export const wasmSNN = new SNNWrapper();
export const wasmPathFinder = new PathFinderWrapper();
export const wasmBazi = new BaziWrapper();

export default {
  initWasm,
  isWasmReady,
  getWasmVersion,
  runBenchmark,
  wasmQuantum,
  wasmSNN,
  wasmPathFinder,
  wasmBazi,
};
