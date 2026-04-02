/**
 * WASM 模块类型声明
 * 用于 omnis_wasm.js 模块的类型安全
 */

declare module '*/omnis_wasm.js' {
  export default function init(): Promise<void>;
  export const memory: WebAssembly.Memory;
  export class UniversePhysics {
    constructor(numParticles: number);
    get_particles_ptr(): number;
    tick(dt: number, entropy: number): void;
  }
}

declare module './pkg/omnis_wasm.js' {
  export default function init(): Promise<void>;
  export const memory: WebAssembly.Memory;
  export class UniversePhysics {
    constructor(numParticles: number);
    get_particles_ptr(): number;
    tick(dt: number, entropy: number): void;
  }
}
