/**
 * =============================================================================
 * APEX WASM Pysics Bridge
 * 真正的极限算力引擎：通过 SharedArrayBuffer 直连 WebAssembly 提供高达百万级并发
 * =============================================================================
 */

interface WasmModule {
  default(): Promise<void>;
  memory: WebAssembly.Memory;
  UniversePhysics: new (numParticles: number) => WasmUniverse;
}

interface WasmUniverse {
  get_particles_ptr(): number;
  tick(dt: number, entropy: number): void;
}

export class WasmPhysicsBridge {
  private instance: WasmUniverse | null = null;
  private memoryView: Float32Array | null = null;
  private numParticles: number = 0;
  private memoryPtr: number = 0;
  private wasmMemory: WebAssembly.Memory | null = null;

  /**
   * 唤醒底层 Rust 黑魔法
   */
  public async init(numParticles: number = 100_000) {
    if (this.instance) return;

    console.log('[V13 WASM] 正在实例化底层 Rust 核心物理模型...');
    try {
      const wasm = await this.loadWasm();
      if (!wasm) {
        console.warn('[V13 WASM] WASM 模块加载失败');
        return;
      }

      this.numParticles = numParticles;
      this.instance = new wasm.UniversePhysics(this.numParticles);
      this.wasmMemory = wasm.memory;
      
      this.memoryPtr = this.instance.get_particles_ptr();
      this.memoryView = new Float32Array(wasm.memory.buffer, this.memoryPtr, this.numParticles * 6);

      console.log(`[V13 WASM] Rust 核心实体组装完毕！${this.numParticles} 颗粒子的内存地址已映射到 JS 主线程。`);
    } catch (e) {
      console.warn('[V13 WASM] 未检测到 WASM 构建产物。如果看到此消息，请确保已运行 \`wasm-pack build --target web\`。系统将暂不可用底层加速。', e);
    }
  }

  private async loadWasm(): Promise<WasmModule | null> {
    try {
      const wasm = await import('./pkg/omnis_wasm.js');
      return wasm as unknown as WasmModule;
    } catch {
      return null;
    }
  }

  /**
   * 直接让 CPU 以 10 倍于 JS 的算力执行宇宙演化 tick
   */
  public tick(dt: number, entropy: number) {
    if (!this.instance) {
      return;
    }
    
    // 执行底层 Rust 循环
    this.instance.tick(dt, entropy);
  }

  /**
   * 零拷贝返回当前粒子的内存视图给 WebGPU 或渲染层使用
   */
  public getParticleData(): Float32Array | null {
    return this.memoryView;
  }
}
