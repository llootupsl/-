/**
 * 粒子系统 - WebGPU 计算着色器驱动
 * 实现汉字代码雨效果的GPU加速粒子渲染
 * 性能优化：WebGPU计算着色器、批处理、动态调整
 */

import { webgpuContext, createBuffer } from './WebGPUContext';
import { CitizenStateType } from '@/core/constants';
import { logger } from '@/core/utils/Logger';

export enum ParticleState {
  DORMANT = 'dormant',
  BACKGROUND = 'background',
  ACTIVE = 'active',
  DYING = 'dying',
  DEAD = 'dead',
}

export enum ParticleLifePhase {
  BIRTH = 'birth',
  GROWTH = 'growth',
  MATURE = 'mature',
  DECAY = 'decay',
  DEATH = 'death',
}

export enum QualityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  baseSize: number;
  char: string;
  color: [number, number, number, number];
  targetColor: [number, number, number, number];
  colorTransition: number;
  state: ParticleState;
  lifePhase: ParticleLifePhase;
  age: number;
  pulsePhase: number;
  glowIntensity: number;
}

export interface ParticleBatch {
  type: ParticleState;
  startIndex: number;
  count: number;
  avgDistance: number;
}

export interface PerformanceStats {
  particleCount: number;
  activeParticles: number;
  updateTime: number;
  renderTime: number;
  gpuTime: number;
  drawCalls: number;
  batchCount: number;
  fps: number;
  qualityLevel: QualityLevel;
  webGPUEnabled: boolean;
  gpuMemoryUsage: number;
  degradationLevel: number;
}

export interface ParticleSystemConfig {
  maxParticles: number;
  gravity: number;
  friction: number;
  spawnRate: number;
  particleLifetime: number;
  useWebGPU: boolean;
  qualityLevel: QualityLevel;
  targetFPS: number;
  boundsX: number;
  boundsY: number;
  boundsZ: number;
}

export const PARTICLE_COLORS = {
  CYAN: [0, 0.94, 1, 1] as [number, number, number, number],
  MAGENTA: [1, 0, 1, 1] as [number, number, number, number],
  NEON_GREEN: [0.22, 1, 0.08, 1] as [number, number, number, number],
  GOLD: [1, 0.84, 0, 1] as [number, number, number, number],
  ELECTRIC_BLUE: [0.2, 0.6, 1, 1] as [number, number, number, number],
  HOT_PINK: [1, 0.11, 0.68, 1] as [number, number, number, number],
  LIME: [0.5, 1, 0, 1] as [number, number, number, number],
  ORANGE: [1, 0.5, 0, 1] as [number, number, number, number],
  PURPLE: [0.6, 0.2, 0.8, 1] as [number, number, number, number],
  RED: [1, 0.2, 0.2, 1] as [number, number, number, number],
  WHITE: [1, 1, 1, 1] as [number, number, number, number],
  SILVER: [0.75, 0.75, 0.75, 1] as [number, number, number, number],
  DEEP_BLUE: [0.1, 0.2, 0.6, 1] as [number, number, number, number],
  CORAL: [1, 0.5, 0.31, 1] as [number, number, number, number],
  TEAL: [0, 0.5, 0.5, 1] as [number, number, number, number],
}

export const STATE_COLOR_MAP: Record<ParticleState, [number, number, number, number][]> = {
  [ParticleState.DORMANT]: [
    PARTICLE_COLORS.DEEP_BLUE,
    PARTICLE_COLORS.SILVER,
    PARTICLE_COLORS.TEAL,
  ],
  [ParticleState.BACKGROUND]: [
    PARTICLE_COLORS.CYAN,
    PARTICLE_COLORS.ELECTRIC_BLUE,
    PARTICLE_COLORS.TEAL,
  ],
  [ParticleState.ACTIVE]: [
    PARTICLE_COLORS.NEON_GREEN,
    PARTICLE_COLORS.LIME,
    PARTICLE_COLORS.GOLD,
    PARTICLE_COLORS.MAGENTA,
  ],
  [ParticleState.DYING]: [
    PARTICLE_COLORS.ORANGE,
    PARTICLE_COLORS.CORAL,
    PARTICLE_COLORS.RED,
  ],
  [ParticleState.DEAD]: [
    [0.3, 0.3, 0.3, 0.5] as [number, number, number, number],
    [0.2, 0.2, 0.2, 0.3] as [number, number, number, number],
  ],
}

export const LIFECYCLE_GRADIENTS = {
  [ParticleLifePhase.BIRTH]: {
    startColor: PARTICLE_COLORS.WHITE,
    endColor: PARTICLE_COLORS.CYAN,
    sizeMultiplier: 0.3,
    glowMultiplier: 1.5,
  },
  [ParticleLifePhase.GROWTH]: {
    startColor: PARTICLE_COLORS.CYAN,
    endColor: PARTICLE_COLORS.NEON_GREEN,
    sizeMultiplier: 0.7,
    glowMultiplier: 1.2,
  },
  [ParticleLifePhase.MATURE]: {
    startColor: PARTICLE_COLORS.NEON_GREEN,
    endColor: PARTICLE_COLORS.GOLD,
    sizeMultiplier: 1.0,
    glowMultiplier: 1.0,
  },
  [ParticleLifePhase.DECAY]: {
    startColor: PARTICLE_COLORS.GOLD,
    endColor: PARTICLE_COLORS.ORANGE,
    sizeMultiplier: 0.8,
    glowMultiplier: 0.8,
  },
  [ParticleLifePhase.DEATH]: {
    startColor: PARTICLE_COLORS.ORANGE,
    endColor: [0.3, 0.3, 0.3, 0.3] as [number, number, number, number],
    sizeMultiplier: 0.4,
    glowMultiplier: 0.3,
  },
}

export const QUALITY_CONFIGS: Record<QualityLevel, {
  maxParticles: number;
  updateInterval: number;
  batchSize: number;
  workgroupSize: number;
}> = {
  [QualityLevel.LOW]: {
    maxParticles: 5000,
    updateInterval: 33,
    batchSize: 500,
    workgroupSize: 128,
  },
  [QualityLevel.MEDIUM]: {
    maxParticles: 15000,
    updateInterval: 16,
    batchSize: 1000,
    workgroupSize: 256,
  },
  [QualityLevel.HIGH]: {
    maxParticles: 35000,
    updateInterval: 8,
    batchSize: 2000,
    workgroupSize: 256,
  },
  [QualityLevel.ULTRA]: {
    maxParticles: 75000,
    updateInterval: 4,
    batchSize: 4000,
    workgroupSize: 256,
  },
}

const PARTICLE_COMPUTE_SHADER = `
struct GPUParticle {
  position: vec4<f32>,
  velocity: vec4<f32>,
  color: vec4<f32>,
  life: f32,
  maxLife: f32,
  baseSize: f32,
  state: f32,
  age: f32,
  pulsePhase: f32,
  glowIntensity: f32,
  _pad1: f32,
  _pad2: f32,
}

struct SimParams {
  deltaTime: f32,
  gravity: f32,
  friction: f32,
  particleCount: u32,
  time: f32,
  boundsX: f32,
  boundsY: f32,
  boundsZ: f32,
  windX: f32,
  windZ: f32,
  turbulence: f32,
  _pad: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<GPUParticle>;
@group(0) @binding(1) var<uniform> params: SimParams;

fn hash(n: f32) -> f32 {
  return fract(sin(n) * 43758.5453);
}

fn randomState(seed: u32) -> f32 {
  let n = hash(f32(seed));
  if (n < 0.3) { return 0.0; }
  if (n < 0.7) { return 1.0; }
  return 2.0;
}

fn getLifePhase(life: f32, maxLife: f32) -> f32 {
  let ratio = life / maxLife;
  if (ratio > 0.9) { return 0.0; }
  if (ratio > 0.7) { return 1.0; }
  if (ratio > 0.4) { return 2.0; }
  if (ratio > 0.15) { return 3.0; }
  return 4.0;
}

fn getSizeMultiplier(lifePhase: f32) -> f32 {
  if (lifePhase < 0.5) { return 0.3; }
  if (lifePhase < 1.5) { return 0.7; }
  if (lifePhase < 2.5) { return 1.0; }
  if (lifePhase < 3.5) { return 0.8; }
  return 0.4;
}

fn getGlowMultiplier(lifePhase: f32) -> f32 {
  if (lifePhase < 0.5) { return 1.5; }
  if (lifePhase < 1.5) { return 1.2; }
  if (lifePhase < 2.5) { return 1.0; }
  if (lifePhase < 3.5) { return 0.8; }
  return 0.3;
}

fn lerpColor(a: vec4<f32>, b: vec4<f32>, t: f32) -> vec4<f32> {
  return mix(a, b, t);
}

fn getStateColor(state: f32, seed: u32) -> vec4<f32> {
  let colorIdx = hash(f32(seed) * 1.234);
  
  if (state < 0.5) {
    if (colorIdx < 0.33) { return vec4<f32>(0.1, 0.2, 0.6, 1.0); }
    if (colorIdx < 0.66) { return vec4<f32>(0.75, 0.75, 0.75, 1.0); }
    return vec4<f32>(0.0, 0.5, 0.5, 1.0);
  } else if (state < 1.5) {
    if (colorIdx < 0.33) { return vec4<f32>(0.0, 0.94, 1.0, 1.0); }
    if (colorIdx < 0.66) { return vec4<f32>(0.2, 0.6, 1.0, 1.0); }
    return vec4<f32>(0.0, 0.5, 0.5, 1.0);
  } else if (state < 2.5) {
    if (colorIdx < 0.25) { return vec4<f32>(0.22, 1.0, 0.08, 1.0); }
    if (colorIdx < 0.5) { return vec4<f32>(0.5, 1.0, 0.0, 1.0); }
    if (colorIdx < 0.75) { return vec4<f32>(1.0, 0.84, 0.0, 1.0); }
    return vec4<f32>(1.0, 0.0, 1.0, 1.0);
  } else if (state < 3.5) {
    if (colorIdx < 0.5) { return vec4<f32>(1.0, 0.5, 0.0, 1.0); }
    return vec4<f32>(1.0, 0.5, 0.31, 1.0);
  }
  return vec4<f32>(0.3, 0.3, 0.3, 0.5);
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let idx = id.x;
  let count = params.particleCount;

  if (idx >= count) {
    return;
  }

  var p = particles[idx];
  
  let dt = params.deltaTime;
  let gravity = params.gravity;
  let friction = params.friction;
  let time = params.time;

  p.age += dt;
  p.pulsePhase += dt * 2.0;

  let lifePhase = getLifePhase(p.life, p.maxLife);
  let sizeMult = getSizeMultiplier(lifePhase);
  let glowMult = getGlowMultiplier(lifePhase);
  
  let pulse = sin(p.pulsePhase) * 0.2 + 1.0;
  p.position.w = p.baseSize * sizeMult * pulse;
  p.glowIntensity = glowMult * (0.8 + sin(p.pulsePhase * 0.5) * 0.2);

  let lifeProgress = 1.0 - (p.life / p.maxLife);
  let stateColor = getStateColor(p.state, idx);
  p.color = lerpColor(p.color, stateColor, dt * 2.0);

  p.velocity.y -= gravity * dt;
  p.velocity.x += params.windX * dt;
  p.velocity.z += params.windZ * dt;

  let turb = params.turbulence;
  p.velocity.x += sin(p.position.y * 0.1 + time * 2.0) * turb * dt;
  p.velocity.z += cos(p.position.x * 0.1 + time * 2.0) * turb * dt;

  p.velocity.x *= friction;
  p.velocity.z *= friction;

  p.position.x += p.velocity.x * dt;
  p.position.y += p.velocity.y * dt;
  p.position.z += p.velocity.z * dt;

  p.life -= dt;

  if (p.position.y < -params.boundsY) {
    p.position.y = params.boundsY;
    p.velocity.y = abs(p.velocity.y) * 0.8;
    p.life = p.maxLife;
    p.age = 0.0;
  }
  if (p.position.x < -params.boundsX) { p.position.x = params.boundsX; }
  if (p.position.x > params.boundsX) { p.position.x = -params.boundsX; }
  if (p.position.z < -params.boundsZ) { p.position.z = params.boundsZ; }
  if (p.position.z > params.boundsZ) { p.position.z = -params.boundsZ; }

  if (p.life <= 0.0) {
    let gridX = f32(idx % 100u) / 100.0 - 0.5;
    let gridZ = f32((idx / 100u) % 100u) / 100.0 - 0.5;
    
    p.position.x = gridX * params.boundsX * 2.0;
    p.position.y = params.boundsY;
    p.position.z = gridZ * params.boundsZ * 2.0;
    p.position.w = p.baseSize;
    
    p.velocity.x = 0.0;
    p.velocity.y = -1.0 - f32(idx % 10u) * 0.3;
    p.velocity.z = 0.0;
    
    p.life = p.maxLife;
    p.age = 0.0;
    p.state = randomState(idx);
    p.pulsePhase = hash(f32(idx) * 3.14159) * 6.28318;
    p.color = getStateColor(p.state, idx + u32(time * 100.0));
  }

  particles[idx] = p;
}
`;

const PARTICLE_RENDER_VERTEX_SHADER = `
struct Uniforms {
  viewProjection: mat4x4<f32>,
  cameraPos: vec3<f32>,
  time: f32,
  particleSize: f32,
  screenWidth: f32,
  screenHeight: f32,
  _pad: f32,
}

struct GPUParticle {
  position: vec4<f32>,
  velocity: vec4<f32>,
  color: vec4<f32>,
  life: f32,
  maxLife: f32,
  baseSize: f32,
  state: f32,
  age: f32,
  pulsePhase: f32,
  glowIntensity: f32,
  _pad1: f32,
  _pad2: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> particles: array<GPUParticle>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) glowIntensity: f32,
}

@vertex
fn main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let particle = particles[instanceIndex];

  let quadVerts = array<vec2<f32>, 6>(
    vec2<f32>(-0.5, -0.5),
    vec2<f32>( 0.5, -0.5),
    vec2<f32>( 0.5,  0.5),
    vec2<f32>(-0.5, -0.5),
    vec2<f32>( 0.5,  0.5),
    vec2<f32>(-0.5,  0.5),
  );

  let vert = quadVerts[vertexIndex];
  let size = particle.position.w * uniforms.particleSize;
  
  let worldPos = vec3<f32>(
    particle.position.x + vert.x * size,
    particle.position.y + vert.y * size,
    particle.position.z
  );

  var output: VertexOutput;
  output.position = uniforms.viewProjection * vec4<f32>(worldPos, 1.0);
  output.color = particle.color;
  output.uv = vert + 0.5;
  output.glowIntensity = particle.glowIntensity;

  return output;
}
`;

const PARTICLE_RENDER_FRAGMENT_SHADER = `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) glowIntensity: f32,
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
  let center = vec2<f32>(0.5, 0.5);
  let dist = length(input.uv - center);

  if (dist > 0.5) {
    discard;
  }

  let glow = (1.0 - dist * 2.0) * input.glowIntensity;
  var color = input.color * glow;
  
  color.rgb += input.color.rgb * exp(-dist * 4.0) * 0.5;
  
  return color;
}
`;

const PARTICLE_SIZE = 48;

export class ParticleSystem {
  private config: ParticleSystemConfig;
  
  private particleStorageBuffer: GPUBuffer | null = null;
  private paramsBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  
  private computePipeline: GPUComputePipeline | null = null;
  private renderPipeline: GPURenderPipeline | null = null;
  private computeBindGroup: GPUBindGroup | null = null;
  private renderBindGroup: GPUBindGroup | null = null;
  
  private batches: ParticleBatch[] = [];
  private activeParticleCount: number = 0;
  
  private lastUpdateTime: number = 0;
  private lastRenderTime: number = 0;
  private gpuTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private lastFpsTime: number = 0;
  
  private currentParticleCount: number = 10000;
  private targetFPS: number = 60;
  
  private degradationLevel: number = 0;
  private performanceHistory: number[] = [];
  private readonly PERFORMANCE_HISTORY_SIZE = 60;
  
  private cpuParticles: Particle[] = [];
  private useGPU: boolean = true;
  private initialized: boolean = false;
  
  private viewProjectionMatrix: Float32Array = new Float32Array(16);
  private cameraPosition: { x: number; y: number; z: number } = { x: 0, y: 50, z: 100 };

  constructor(config: Partial<ParticleSystemConfig> = {}) {
    this.config = {
      maxParticles: config.maxParticles || 15000,
      gravity: config.gravity || 9.8,
      friction: config.friction || 0.99,
      spawnRate: config.spawnRate || 100,
      particleLifetime: config.particleLifetime || 5,
      useWebGPU: config.useWebGPU ?? true,
      qualityLevel: config.qualityLevel || QualityLevel.MEDIUM,
      targetFPS: config.targetFPS || 60,
      boundsX: config.boundsX || 100,
      boundsY: config.boundsY || 50,
      boundsZ: config.boundsZ || 100,
    };
    this.currentParticleCount = this.config.maxParticles;
    this.targetFPS = this.config.targetFPS;
  }

  public async init(): Promise<void> {
    if (!webgpuContext.isAvailable()) {
      logger.warn('ParticleSystem', 'WebGPU not available, falling back to CPU');
      this.useGPU = false;
      this.initCPUParticles();
      this.initialized = true;
      return;
    }

    const device = webgpuContext.getDevice();

    try {
      await this.createBuffers(device);
      await this.createPipelines(device);
      this.initGPUParticles(device);
      this.initialized = true;
      logger.info('ParticleSystem', `GPU initialized with ${this.config.maxParticles} particles`);
    } catch (error) {
      logger.error(
        'ParticleSystem',
        'GPU init failed, falling back to CPU',
        error instanceof Error ? error : new Error(String(error))
      );
      this.useGPU = false;
      this.initCPUParticles();
      this.initialized = true;
    }
  }

  private async createBuffers(device: GPUDevice): Promise<void> {
    const maxParticles = this.config.maxParticles;
    const storageSize = maxParticles * PARTICLE_SIZE;
    
    this.particleStorageBuffer = device.createBuffer({
      size: storageSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    this.paramsBuffer = device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.uniformBuffer = device.createBuffer({
      size: 128,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private async createPipelines(device: GPUDevice): Promise<void> {
    const computeModule = device.createShaderModule({
      code: PARTICLE_COMPUTE_SHADER,
    });

    this.computePipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: computeModule,
        entryPoint: 'main',
      },
    });

    const vertexModule = device.createShaderModule({
      code: PARTICLE_RENDER_VERTEX_SHADER,
    });

    const fragmentModule = device.createShaderModule({
      code: PARTICLE_RENDER_FRAGMENT_SHADER,
    });

    this.renderPipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: vertexModule,
        entryPoint: 'main',
      },
      fragment: {
        module: fragmentModule,
        entryPoint: 'main',
        targets: [{
          format: 'bgra8unorm',
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one',
              operation: 'add',
            },
          },
        }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    this.computeBindGroup = device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleStorageBuffer! } },
        { binding: 1, resource: { buffer: this.paramsBuffer! } },
      ],
    });

    this.renderBindGroup = device.createBindGroup({
      layout: this.renderPipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer! } },
        { binding: 1, resource: { buffer: this.particleStorageBuffer! } },
      ],
    });
  }

  private initGPUParticles(device: GPUDevice): void {
    const maxParticles = this.config.maxParticles;
    const data = new Float32Array(maxParticles * 12);

    const chars = '永夜熵纪数字文明智慧混沌宇宙市民';

    for (let i = 0; i < maxParticles; i++) {
      const offset = i * 12;
      const state = this.getRandomState();
      const color = this.getColorForState(state);
      const baseSize = 0.1 + Math.random() * 0.1;

      data[offset + 0] = (Math.random() - 0.5) * this.config.boundsX * 2;
      data[offset + 1] = Math.random() * this.config.boundsY * 2;
      data[offset + 2] = (Math.random() - 0.5) * this.config.boundsZ * 2;
      data[offset + 3] = baseSize;

      data[offset + 4] = 0;
      data[offset + 5] = -1 - Math.random() * 2;
      data[offset + 6] = 0;
      data[offset + 7] = 0;

      data[offset + 8] = color[0];
      data[offset + 9] = color[1];
      data[offset + 10] = color[2];
      data[offset + 11] = color[3];

      this.cpuParticles.push({
        x: data[offset + 0],
        y: data[offset + 1],
        z: data[offset + 2],
        vx: 0,
        vy: data[offset + 5],
        vz: 0,
        life: Math.random() * this.config.particleLifetime,
        maxLife: this.config.particleLifetime,
        size: baseSize,
        baseSize,
        char: chars[Math.floor(Math.random() * chars.length)],
        color: [...color] as [number, number, number, number],
        targetColor: [...color] as [number, number, number, number],
        colorTransition: 0,
        state,
        lifePhase: ParticleLifePhase.BIRTH,
        age: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        glowIntensity: 1.0,
      });
    }

    device.queue.writeBuffer(this.particleStorageBuffer!, 0, data);
  }

  private initCPUParticles(): void {
    const chars = '永夜熵纪数字文明智慧混沌宇宙市民';

    this.cpuParticles = [];
    for (let i = 0; i < this.config.maxParticles; i++) {
      const state = this.getRandomState();
      const color = this.getColorForState(state);

      this.cpuParticles.push({
        x: (Math.random() - 0.5) * this.config.boundsX * 2,
        y: Math.random() * this.config.boundsY * 2,
        z: (Math.random() - 0.5) * this.config.boundsZ * 2,
        vx: 0,
        vy: -1 - Math.random() * 2,
        vz: 0,
        life: Math.random() * this.config.particleLifetime,
        maxLife: this.config.particleLifetime,
        size: 0.1 + Math.random() * 0.1,
        baseSize: 0.1 + Math.random() * 0.1,
        char: chars[Math.floor(Math.random() * chars.length)],
        color: [...color] as [number, number, number, number],
        targetColor: [...color] as [number, number, number, number],
        colorTransition: 0,
        state,
        lifePhase: ParticleLifePhase.BIRTH,
        age: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        glowIntensity: 1.0,
      });
    }
  }

  public updateParticlesGPU(commandEncoder: GPUCommandEncoder): void {
    if (!this.useGPU || !this.computePipeline || !this.particleStorageBuffer || !this.paramsBuffer) {
      return;
    }

    const device = webgpuContext.getDevice();
    const startTime = performance.now();

    const paramsData = new Float32Array(12);
    paramsData[0] = 1 / 60;
    paramsData[1] = this.config.gravity;
    paramsData[2] = this.config.friction;
    paramsData[3] = this.currentParticleCount;
    paramsData[4] = performance.now() / 1000;
    paramsData[5] = this.config.boundsX;
    paramsData[6] = this.config.boundsY;
    paramsData[7] = this.config.boundsZ;
    paramsData[8] = 0.1;
    paramsData[9] = 0.1;
    paramsData[10] = 0.1;

    device.queue.writeBuffer(this.paramsBuffer, 0, paramsData);

    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(this.currentParticleCount / 256));
    computePass.end();

    this.gpuTime = performance.now() - startTime;
  }

  public update(deltaTime: number): void {
    const startTime = performance.now();
    const dt = deltaTime / 1000;
    const time = performance.now() / 1000;

    this.frameCount++;
    if (time - this.lastFpsTime >= 1.0) {
      this.fps = this.frameCount / (time - this.lastFpsTime);
      this.frameCount = 0;
      this.lastFpsTime = time;
      this.recordPerformance();
    }

    if (this.useGPU) {
      this.activeParticleCount = this.currentParticleCount;
      this.lastUpdateTime = performance.now() - startTime;
      return;
    }

    this.activeParticleCount = 0;

    for (let i = 0; i < this.currentParticleCount; i++) {
      const p = this.cpuParticles[i];

      p.age += dt;
      p.pulsePhase += dt * 2;

      const prevLifePhase = p.lifePhase;
      p.lifePhase = this.calculateLifePhase(p.life, p.maxLife);

      if (prevLifePhase !== p.lifePhase) {
        p.colorTransition = 0;
      }

      p.colorTransition = Math.min(1, p.colorTransition + dt * 0.5);

      const lifeProgress = 1 - (p.life / p.maxLife);
      const phaseColor = this.getColorForLifePhase(p.lifePhase, lifeProgress);

      if (p.colorTransition < 1) {
        p.color = this.lerpColor(p.color, phaseColor, p.colorTransition * dt * 3);
      } else {
        p.color = phaseColor;
      }

      const gradient = LIFECYCLE_GRADIENTS[p.lifePhase];
      const pulse = Math.sin(p.pulsePhase) * 0.2 + 1;
      p.size = p.baseSize * gradient.sizeMultiplier * pulse;
      p.glowIntensity = gradient.glowMultiplier * (0.8 + Math.sin(p.pulsePhase * 0.5) * 0.2);

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      p.vy -= this.config.gravity * dt;
      p.vx *= this.config.friction;
      p.vz *= this.config.friction;

      p.life -= dt;

      if (p.life > 0) {
        this.activeParticleCount++;
      }

      if (p.life <= 0) {
        this.resetParticle(p);
      }
    }

    this.lastUpdateTime = performance.now() - startTime;
  }

  private recordPerformance(): void {
    this.performanceHistory.push(this.fps);
    if (this.performanceHistory.length > this.PERFORMANCE_HISTORY_SIZE) {
      this.performanceHistory.shift();
    }
    this.adjustPerformance();
  }

  private adjustPerformance(): void {
    if (this.performanceHistory.length < 10) return;

    const avgFPS = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
    const minFPS = Math.min(...this.performanceHistory.slice(-10));

    if (minFPS < this.targetFPS * 0.7) {
      this.degradationLevel = Math.min(5, this.degradationLevel + 1);
      this.applyDegradation();
    } else if (avgFPS > this.targetFPS * 0.95 && this.degradationLevel > 0) {
      this.degradationLevel = Math.max(0, this.degradationLevel - 1);
      this.applyDegradation();
    }
  }

  private applyDegradation(): void {
    const baseCount = QUALITY_CONFIGS[this.config.qualityLevel].maxParticles;
    const reductionFactor = 1 - (this.degradationLevel * 0.15);
    this.currentParticleCount = Math.max(
      QUALITY_CONFIGS[QualityLevel.LOW].maxParticles,
      Math.floor(baseCount * reductionFactor)
    );
  }

  public batchParticles(cameraPosition?: { x: number; y: number; z: number }): ParticleBatch[] {
    const startTime = performance.now();
    this.batches = [];

    const particles = this.useGPU ? this.cpuParticles.slice(0, this.currentParticleCount) : this.cpuParticles.slice(0, this.currentParticleCount);

    const stateGroups: Map<ParticleState, number[]> = new Map();
    Object.values(ParticleState).forEach(state => {
      stateGroups.set(state, []);
    });

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life > 0) {
        stateGroups.get(p.state)!.push(i);
      }
    }

    const batchSize = QUALITY_CONFIGS[this.config.qualityLevel].batchSize;

    stateGroups.forEach((indices, state) => {
      if (indices.length === 0) return;

      if (cameraPosition) {
        indices.sort((a, b) => {
          const distA = Math.hypot(
            particles[a].x - cameraPosition.x,
            particles[a].y - cameraPosition.y,
            particles[a].z - cameraPosition.z
          );
          const distB = Math.hypot(
            particles[b].x - cameraPosition.x,
            particles[b].y - cameraPosition.y,
            particles[b].z - cameraPosition.z
          );
          return distA - distB;
        });
      }

      for (let i = 0; i < indices.length; i += batchSize) {
        const batchIndices = indices.slice(i, i + batchSize);
        let avgDistance = 0;

        if (cameraPosition) {
          avgDistance = batchIndices.reduce((sum, idx) => {
            const p = particles[idx];
            return sum + Math.hypot(
              p.x - cameraPosition.x,
              p.y - cameraPosition.y,
              p.z - cameraPosition.z
            );
          }, 0) / batchIndices.length;
        }

        this.batches.push({
          type: state,
          startIndex: batchIndices[0],
          count: batchIndices.length,
          avgDistance,
        });
      }
    });

    this.batches.sort((a, b) => a.avgDistance - b.avgDistance);
    this.lastUpdateTime = performance.now() - startTime;

    return this.batches;
  }

  public adjustParticleCount(targetFPS: number): void {
    this.targetFPS = targetFPS;
  }

  public setQualityLevel(level: QualityLevel): void {
    this.config.qualityLevel = level;
    const qualityConfig = QUALITY_CONFIGS[level];

    if (this.config.maxParticles !== qualityConfig.maxParticles) {
      this.config.maxParticles = qualityConfig.maxParticles;
      this.currentParticleCount = Math.min(this.currentParticleCount, qualityConfig.maxParticles);

      if (!this.useGPU) {
        this.initCPUParticles();
      }
    }
  }

  public getPerformanceStats(): PerformanceStats {
    const gpuMemoryUsage = this.useGPU && this.particleStorageBuffer
      ? this.config.maxParticles * PARTICLE_SIZE
      : 0;

    return {
      particleCount: this.currentParticleCount,
      activeParticles: this.activeParticleCount,
      updateTime: this.lastUpdateTime,
      renderTime: this.lastRenderTime,
      gpuTime: this.gpuTime,
      drawCalls: this.batches.length,
      batchCount: this.batches.length,
      fps: this.fps,
      qualityLevel: this.config.qualityLevel,
      webGPUEnabled: this.useGPU,
      gpuMemoryUsage,
      degradationLevel: this.degradationLevel,
    };
  }

  public setViewProjection(matrix: Float32Array): void {
    this.viewProjectionMatrix = matrix;
  }

  public setCameraPosition(x: number, y: number, z: number): void {
    this.cameraPosition = { x, y, z };
  }

  public updateUniforms(): void {
    if (!this.useGPU || !this.uniformBuffer) return;

    const device = webgpuContext.getDevice();
    const uniformData = new Float32Array(20);

    uniformData.set(this.viewProjectionMatrix, 0);
    uniformData.set([this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z, performance.now() / 1000], 16);
    uniformData.set([1.0, 1920, 1080, 0], 20);

    device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
  }

  public getRenderPipeline(): GPURenderPipeline | null {
    return this.renderPipeline;
  }

  public getRenderBindGroup(): GPUBindGroup | null {
    return this.renderBindGroup;
  }

  public getParticleBuffer(): GPUBuffer | null {
    return this.particleStorageBuffer;
  }

  private getRandomState(): ParticleState {
    const rand = Math.random();
    if (rand < 0.3) return ParticleState.DORMANT;
    if (rand < 0.7) return ParticleState.BACKGROUND;
    return ParticleState.ACTIVE;
  }

  private getColorForState(state: ParticleState): [number, number, number, number] {
    const colors = STATE_COLOR_MAP[state];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getColorForLifePhase(phase: ParticleLifePhase, progress: number): [number, number, number, number] {
    const gradient = LIFECYCLE_GRADIENTS[phase];
    return this.lerpColor(gradient.startColor, gradient.endColor, progress);
  }

  private lerpColor(a: [number, number, number, number], b: [number, number, number, number], t: number): [number, number, number, number] {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
      a[3] + (b[3] - a[3]) * t,
    ];
  }

  private calculateLifePhase(life: number, maxLife: number): ParticleLifePhase {
    const ratio = life / maxLife;
    if (ratio > 0.9) return ParticleLifePhase.BIRTH;
    if (ratio > 0.7) return ParticleLifePhase.GROWTH;
    if (ratio > 0.4) return ParticleLifePhase.MATURE;
    if (ratio > 0.15) return ParticleLifePhase.DECAY;
    return ParticleLifePhase.DEATH;
  }

  private resetParticle(p: Particle): void {
    const chars = '永夜熵纪数字文明智慧混沌宇宙市民';

    p.x = (Math.random() - 0.5) * this.config.boundsX * 2;
    p.y = this.config.boundsY;
    p.z = (Math.random() - 0.5) * this.config.boundsZ * 2;
    p.vx = 0;
    p.vy = -1 - Math.random() * 2;
    p.vz = 0;
    p.life = this.config.particleLifetime;
    p.maxLife = this.config.particleLifetime;
    p.age = 0;
    p.state = this.getRandomState();
    p.lifePhase = ParticleLifePhase.BIRTH;
    p.color = this.getColorForState(p.state);
    p.targetColor = [...p.color] as [number, number, number, number];
    p.colorTransition = 0;
    p.char = chars[Math.floor(Math.random() * chars.length)];
    p.pulsePhase = Math.random() * Math.PI * 2;
    p.glowIntensity = 1.5;
  }

  public setParticleState(index: number, state: ParticleState): void {
    if (index >= 0 && index < this.cpuParticles.length) {
      const p = this.cpuParticles[index];
      p.state = state;
      p.targetColor = this.getColorForState(state);
      p.colorTransition = 0;
    }
  }

  public mapCitizenStateToParticle(citizenState: CitizenStateType): ParticleState {
    switch (citizenState) {
      case CitizenStateType.DORMANT:
        return ParticleState.DORMANT;
      case CitizenStateType.BACKGROUND:
        return ParticleState.BACKGROUND;
      case CitizenStateType.ACTIVE:
        return ParticleState.ACTIVE;
      default:
        return ParticleState.BACKGROUND;
    }
  }

  public updateParticleStates(states: ParticleState[]): void {
    for (let i = 0; i < Math.min(states.length, this.cpuParticles.length); i++) {
      this.setParticleState(i, states[i]);
    }
  }

  public updateFromCitizenStates(citizenStates: CitizenStateType[]): void {
    for (let i = 0; i < Math.min(citizenStates.length, this.cpuParticles.length); i++) {
      const particleState = this.mapCitizenStateToParticle(citizenStates[i]);
      this.setParticleState(i, particleState);
    }
  }

  public getParticles(): Particle[] {
    return this.cpuParticles;
  }

  public getCount(): number {
    return this.currentParticleCount;
  }

  public getMaxCount(): number {
    return this.config.maxParticles;
  }

  public getBatches(): ParticleBatch[] {
    return this.batches;
  }

  public isWebGPUEnabled(): boolean {
    return this.useGPU;
  }

  public setRenderTime(time: number): void {
    this.lastRenderTime = time;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public destroy(): void {
    if (this.particleStorageBuffer) {
      this.particleStorageBuffer.destroy();
      this.particleStorageBuffer = null;
    }
    if (this.paramsBuffer) {
      this.paramsBuffer.destroy();
      this.paramsBuffer = null;
    }
    if (this.uniformBuffer) {
      this.uniformBuffer.destroy();
      this.uniformBuffer = null;
    }
    this.computePipeline = null;
    this.renderPipeline = null;
    this.computeBindGroup = null;
    this.renderBindGroup = null;
    this.initialized = false;
  }
}

export const particleSystem = new ParticleSystem();
export default particleSystem;
