/**
 * =============================================================================
 * WebGPU 渲染引擎 - 永夜熵纪
 * 支持汉字雨、体素小人、程序化面孔和后处理效果
 * =============================================================================
 */

import { PerformanceMode } from '@/core/constants/PerformanceMode';
import { PERFORMANCE_CONFIGS } from '@/core/constants/PerformanceMode';
import { LODLevel, LOD_DISTANCES, CitizenStateType } from '@/core/constants';
import { EntityId, Vec3 as Vec3Interface } from '@/core/types';
import type { Phenotype } from '@/core/types/citizen';
import { faceGenerator, ProceduralFaceGenerator, FaceFeatures } from './ProceduralFaceGenerator';
import { logger } from '@/core/utils/Logger';

type Vec3 = [number, number, number];
import { GlobalIlluminationManager } from './raytracing';
import { 
  PARTICLE_COLORS, 
  ParticleState, 
  ParticleLifePhase,
  STATE_COLOR_MAP,
  LIFECYCLE_GRADIENTS 
} from './ParticleSystem';

export interface RenderableCitizen {
  id: EntityId;
  position: Vec3Interface;
  lodLevel: LODLevel;
  visible: boolean;
  color?: string;
  character?: string;
  faceData?: unknown;
  energy: number;
  health: number;
  mood: number;
  name?: string;
}

export interface RenderConfig {
  width: number;
  height: number;
  pixelRatio: number;
  mode: PerformanceMode;
}

export interface ParticleVertex {
  position: [number, number, number, number]; // x, y, z, size
  color: [number, number, number, number];       // r, g, b, a
  uv: [number, number];
  velocity: [number, number, number];
  life: number;
}

/* ==========================================================================
   WGSL 着色器代码
   ========================================================================== */

/** 汉字粒子顶点着色器 */
const HANZI_VERTEX_SHADER = `
struct Uniforms {
  viewProjection: mat4x4<f32>,
  cameraPos: vec3<f32>,
  time: f32,
  particleSize: f32,
  _pad: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> particles: array<Particle>;
@group(0) @binding(2) var texture_2d<f32> fontTexture;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) worldPos: vec3<f32>,
}

@vertex
fn main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let particle = particles[instanceIndex];

  // 顶点偏移（4个顶点组成一个quad）
  let quadVerts = array<vec2<f32>, 4>(
    vec2<f32>(-0.5, -0.5),
    vec2<f32>( 0.5, -0.5),
    vec2<f32>( 0.5,  0.5),
    vec2<f32>(-0.5,  0.5),
  );

  let vert = quadVerts[vertexIndex];

  // 缩放
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
  output.worldPos = worldPos;

  return output;
}
`;

/** 汉字粒子片段着色器 */
const HANZI_FRAGMENT_SHADER = `
struct Uniforms {
  viewProjection: mat4x4<f32>,
  cameraPos: vec3<f32>,
  time: f32,
  particleSize: f32,
  _pad: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> particles: array<Particle>;
@group(0) @binding(2) var texture_2d<f32> fontTexture;
@group(0) @binding(3) var sampler_default: sampler;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) worldPos: vec3<f32>,
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
  // 读取字形纹理（简化版：用颜色代替）
  let texColor = textureSample(fontTexture, sampler_default, input.uv);

  // 如果字形区域透明，使用粒子颜色
  let alpha = max(texColor.r, max(texColor.g, texColor.b));
  let finalColor = mix(input.color, input.color * 2.0, alpha);

  // 发光效果
  let glow = exp(-length(input.uv - 0.5) * 4.0) * 0.5;
  finalColor = finalColor + vec4<f32>(finalColor.rgb * glow, glow);

  // 距离衰减
  let dist = length(uniforms.cameraPos - input.worldPos);
  let fog = exp(-dist * 0.01);
  finalColor.a *= fog;

  return finalColor;
}
`;

/** 体素顶点着色器 */
const VOXEL_VERTEX_SHADER = `
struct Uniforms {
  viewProjection: mat4x4<f32>,
  cameraPos: vec3<f32>,
  time: f32,
  particleSize: f32,
  _pad: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> voxels: array<VoxelInstance>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) worldPos: vec3<f32>,
}

var<private> quadVerts: array<vec3<f32>, 24> = array<vec3<f32>, 24>(
  // 前面
  vec3<f32>(0,0,0), vec3<f32>(1,0,0), vec3<f32>(1,1,0),
  vec3<f32>(0,0,0), vec3<f32>(1,1,0), vec3<f32>(0,1,0),
  // 后面
  vec3<f32>(1,0,1), vec3<f32>(0,0,1), vec3<f32>(0,1,1),
  vec3<f32>(1,0,1), vec3<f32>(0,1,1), vec3<f32>(1,1,1),
  // 上面
  vec3<f32>(0,1,0), vec3<f32>(1,1,0), vec3<f32>(1,1,1),
  vec3<f32>(0,1,0), vec3<f32>(1,1,1), vec3<f32>(0,1,1),
  // 下面
  vec3<f32>(0,0,1), vec3<f32>(1,0,1), vec3<f32>(1,0,0),
  vec3<f32>(0,0,1), vec3<f32>(1,0,0), vec3<f32>(0,0,0),
  // 左面
  vec3<f32>(0,0,1), vec3<f32>(0,0,0), vec3<f32>(0,1,0),
  vec3<f32>(0,0,1), vec3<f32>(0,1,0), vec3<f32>(0,1,1),
  // 右面
  vec3<f32>(1,0,0), vec3<f32>(1,0,1), vec3<f32>(1,1,1),
  vec3<f32>(1,0,0), vec3<f32>(1,1,1), vec3<f32>(1,1,0),
);

var<private> normals: array<vec3<f32>, 6> = array<vec3<f32>, 6>(
  vec3<f32>(0, 0,-1),
  vec3<f32>(0, 0, 1),
  vec3<f32>(0, 1, 0),
  vec3<f32>(0,-1, 0),
  vec3<f32>(-1, 0, 0),
  vec3<f32>(1, 0, 0),
);

@vertex
fn main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let voxel = voxels[instanceIndex];
  let corner = quadVerts[vertexIndex];
  let normal = normals[vertexIndex / 6u];

  let worldPos = vec3<f32>(
    voxel.position.x + corner.x * voxel.scale,
    voxel.position.y + corner.y * voxel.scale,
    voxel.position.z + corner.z * voxel.scale,
  );

  var output: VertexOutput;
  output.position = uniforms.viewProjection * vec4<f32>(worldPos, 1.0);
  output.color = voxel.color;
  output.normal = normal;
  output.worldPos = worldPos;

  return output;
}
`;

/** 体素片段着色器 */
const VOXEL_FRAGMENT_SHADER = `
struct Uniforms {
  viewProjection: mat4x4<f32>,
  cameraPos: vec3<f32>,
  time: f32,
  particleSize: f32,
  _pad: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) worldPos: vec3<f32>,
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
  // 简单光照
  let lightDir = normalize(vec3<f32>(0.5, 1.0, 0.3));
  let diffuse = max(dot(input.normal, lightDir), 0.2);

  let ambient = 0.15;
  let lighting = ambient + diffuse * 0.85;

  var color = vec4<f32>(input.color * lighting, 1.0);

  // 边缘发光
  let edge = abs(dot(input.normal, normalize(uniforms.cameraPos - input.worldPos)));
  if (edge > 0.95) {
    color.rgb += input.color * 0.3;
  }

  // 赛博朋克辉光
  let pulse = sin(uniforms.time * 2.0) * 0.5 + 0.5;
  color.g += pulse * 0.05;

  return color;
}
`;

/** 后处理顶点着色器（全屏四边形） */
const POST_VERTEX_SHADER = `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn main(
  @builtin(vertex_index) vertexIndex: u32,
) -> VertexOutput {
  let quadVerts = array<vec2<f32>, 4>(
    vec2<f32>(-1, -1),
    vec2<f32>( 1, -1),
    vec2<f32>( 1,  1),
    vec2<f32>(-1, -1),
    vec2<f32>( 1,  1),
    vec2<f32>(-1,  1),
  );

  var output: VertexOutput;
  output.position = vec4<f32>(quadVerts[vertexIndex], 0.0, 1.0);
  output.uv = quadVerts[vertexIndex] * 0.5 + 0.5;
  return output;
}
`;

/** Bloom 效果片段着色器 */
const BLOOM_FRAGMENT_SHADER = `
struct Uniforms {
  threshold: f32,
  intensity: f32,
  radius: f32,
  _pad: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var texture_2d<f32> inputTexture;
@group(0) @binding(2) var sampler_default: sampler;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

fn gaussian(x: f32, sigma: f32) -> f32 {
  return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(6.28318530718) * sigma);
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
  let texelSize = 1.0 / vec2<f32>(textureDimensions(inputTexture));
  var result = vec4<f32>(0.0);
  var weightSum = 0.0;

  let radius = i32(uniforms.radius * 10.0);

  // 模糊采样
  for (var i = -radius; i <= radius; i++) {
    for (var j = -radius; j <= radius; j++) {
      let offset = vec2<f32>(f32(i), f32(j)) * texelSize;
      let texColor = textureSample(inputTexture, sampler_default, input.uv + offset);

      // 提取亮部
      let brightness = dot(texColor.rgb, vec3<f32>(0.299, 0.587, 0.114));
      let extracted = texColor * step(uniforms.threshold, brightness);

      let weight = gaussian(length(vec2<f32>(f32(i), f32(j))), uniforms.radius * 2.0);
      result += extracted * weight;
      weightSum += weight;
    }
  }

  result /= weightSum;
  result *= uniforms.intensity;

  return result;
}
`;

/** 组合着色器 */
const COMPOSITE_FRAGMENT_SHADER = `
@group(0) @binding(0) var texture_2d<f32> sceneTexture;
@group(0) @binding(1) var texture_2d<f32> bloomTexture;
@group(0) @binding(2) var sampler_default: sampler;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
  let scene = textureSample(sceneTexture, sampler_default, input.uv);
  let bloom = textureSample(bloomTexture, sampler_default, input.uv);

  // 叠加 bloom
  var color = scene + bloom * 0.8;

  // 色差
  let aberration = 0.002;
  let r = textureSample(sceneTexture, sampler_default, input.uv + vec2<f32>(aberration, 0.0)).r;
  let b = textureSample(sceneTexture, sampler_default, input.uv - vec2<f32>(aberration, 0.0)).b;
  color.r = r;
  color.b = b;

  // 暗角
  let vignette = 1.0 - length(input.uv - 0.5) * 0.8;
  color.rgb *= vignette;

  // 胶片颗粒
  let grain = (fract(sin(dot(input.uv, vec2<f32>(12.9898, 78.233)) * 43758.5453) * 12345.6789) - 0.5) * 0.03;
  color.rgb += grain;

  // 色调映射
  color.rgb = color.rgb / (color.rgb + vec3<f32>(1.0));

  // 伽马校正
  color.rgb = pow(color.rgb, vec3<f32>(1.0 / 2.2));

  return vec4<f32>(color.rgb, 1.0);
}
`;

/* ==========================================================================
   计算着色器 - 粒子物理更新
   ========================================================================== */

const PARTICLE_COMPUTE_SHADER = `
struct Particle {
  position: vec4<f32>,  // xyz = pos, w = size
  velocity: vec3<f32>,
  color: vec4<f32>,
  life: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> params: SimParams;

struct SimParams {
  deltaTime: f32,
  gravity: f32,
  windX: f32,
  windY: f32,
  windZ: f32,
  boundsX: f32,
  boundsY: f32,
  boundsZ: f32,
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let idx = id.x;

  if (idx >= arrayLength(&particles)) {
    return;
  }

  var p = particles[idx];

  // 重力
  p.velocity.y -= params.gravity * params.deltaTime;

  // 风力
  p.velocity.x += params.windX * params.deltaTime;
  p.velocity.z += params.windZ * params.deltaTime;

  // 湍流
  let turb = 0.1;
  p.velocity.x += sin(p.position.y * 0.1 + params.deltaTime * 2.0) * turb;
  p.velocity.z += cos(p.position.x * 0.1 + params.deltaTime * 2.0) * turb;

  // 速度阻尼
  let damping = 0.98;
  p.velocity.x *= damping;
  p.velocity.z *= damping;

  // 位置更新
  p.position.x += p.velocity.x * params.deltaTime;
  p.position.y += p.velocity.y * params.deltaTime;
  p.position.z += p.velocity.z * params.deltaTime;

  // 生命周期
  p.life -= params.deltaTime * 0.1;

  // 边界环绕
  if (p.position.y < -params.boundsY) {
    p.position.y = params.boundsY;
    p.velocity.y = abs(p.velocity.y) * 0.8;
    p.life = 1.0;
  }
  if (p.position.x < -params.boundsX) { p.position.x = params.boundsX; }
  if (p.position.x > params.boundsX) { p.position.x = -params.boundsX; }
  if (p.position.z < -params.boundsZ) { p.position.z = params.boundsZ; }
  if (p.position.z > params.boundsZ) { p.position.z = -params.boundsZ; }

  // 粒子死亡则重置
  if (p.life <= 0.0) {
    p.position = vec4<f32>(
      (f32(idx % 50u) / 25.0 - 1.0) * params.boundsX,
      params.boundsY,
      (f32(idx / 50u % 50u) / 25.0 - 1.0) * params.boundsZ,
      p.position.w
    );
    p.velocity = vec3<f32>(0.0, -1.0 - f32(idx % 10u) * 0.3, 0.0);
    p.life = 1.0;
  }

  particles[idx] = p;
}
`;

/* ==========================================================================
   主渲染器类
   ========================================================================== */

interface GPUParticle {
  position: Float32Array;  // [x,y,z,w]
  velocity: Float32Array;  // [x,y,z]
  color: Float32Array;      // [r,g,b,a]
  life: Float32Array;       // [life]
}

export class WebGPURenderer {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private canvas: HTMLCanvasElement | null = null;

  // 渲染管线
  private hanziPipeline: GPURenderPipeline | null = null;
  private voxelPipeline: GPURenderPipeline | null = null;
  private bloomExtractPipeline: GPURenderPipeline | null = null;
  private bloomBlurPipeline: GPURenderPipeline | null = null;
  private compositePipeline: GPURenderPipeline | null = null;

  // 计算管线
  private particleComputePipeline: GPUComputePipeline | null = null;

  // 绑定组
  private hanziBindGroup: GPUBindGroup | null = null;
  private voxelBindGroup: GPUBindGroup | null = null;

  // 缓冲区
  private particleBuffer: GPUBuffer | null = null;
  private voxelBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;

  // 纹理
  private fontTexture: GPUTexture | null = null;
  private sceneTexture: GPUTexture | null = null;
  private bloomTextureA: GPUTexture | null = null;
  private bloomTextureB: GPUTexture | null = null;
  private depthTexture: GPUTexture | null = null;

  // 采样器
  private sampler: GPUSampler | null = null;

  // 粒子数据
  private particles: GPUParticle[] = [];
  private maxParticles: number = 50000;

  // 视角矩阵
  private viewMatrix: Float32Array = new Float32Array(16);
  private projectionMatrix: Float32Array = new Float32Array(16);
  private viewProjectionMatrix: Float32Array = new Float32Array(16);

  // 相机
  private camera = {
    x: 0, y: 50, z: 100,
    targetX: 0, targetY: 0, targetZ: 0,
    upX: 0, upY: 1, upZ: 0,
  };

  // 渲染配置
  private config: RenderConfig = {
    width: 0,
    height: 0,
    pixelRatio: 1,
    mode: PerformanceMode.BALANCED,
  };

  // 时间
  private time: number = 0;

  // 是否初始化
  private initialized: boolean = false;

  // 渲染目标市民
  private citizens: RenderableCitizen[] = [];

  // 面孔缓存（用于 PORTRAIT LOD）
  private faceCache: Map<string, FaceFeatures> = new Map();

  // 性能配置
  private perfConfig = PERFORMANCE_CONFIGS[PerformanceMode.BALANCED];

  // 全局光照管理器
  private giManager: GlobalIlluminationManager | null = null;
  private giEnabled: boolean = true;

  // 清理函数数组（用于内存泄漏防护）
  private cleanupHandlers: (() => void)[] = [];

  /* -------------------- 初始化 -------------------- */

  /**
   * 异步初始化 WebGPU
   */
  public async init(canvas: HTMLCanvasElement): Promise<boolean> {
    this.canvas = canvas;

    // 检查 WebGPU 支持
    if (!navigator.gpu) {
      console.warn('[WebGPURenderer] WebGPU 不可用，使用 Canvas2D 回退');
      return false;
    }

    try {
      // 请求适配器
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (!adapter) {
        console.warn('[WebGPURenderer] 无法获取 GPU 适配器');
        return false;
      }

      // 创建设备
      this.device = await adapter.requestDevice({
        requiredLimits: {
          maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
        },
        requiredFeatures: [],
      });

      // 获取上下文
      const context = canvas.getContext('webgpu') as unknown as GPUCanvasContext | null;
      if (!context) {
        console.error('[WebGPURenderer] 无法获取 WebGPU 上下文');
        return false;
      }
      this.context = context;

      // 配置渲染格式
      const format = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format,
        alphaMode: 'opaque',
      });

      // 初始化着色器模块
      await this.initShaders();

      // 初始化缓冲区
      await this.initBuffers();

      // 初始化纹理
      await this.initTextures();

      // 初始化全局光照
      await this.initGlobalIllumination();

      // 初始化粒子
      this.initParticles();

      // 设置相机
      this.updateCamera();

      // 监听窗口调整
      this.handleResize();

      this.initialized = true;
      logger.info('WebGPURenderer', 'WebGPU 渲染器初始化完成');
      return true;

    } catch (error) {
      logger.error(
        'WebGPURenderer',
        '初始化失败',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * 初始化着色器模块和渲染管线
   */
  private async initShaders(): Promise<void> {
    if (!this.device) return;

    const device = this.device;

    // 编译着色器
    const hanziVertModule = device.createShaderModule({ code: HANZI_VERTEX_SHADER });
    const hanziFragModule = device.createShaderModule({ code: HANZI_FRAGMENT_SHADER });
    const voxelVertModule = device.createShaderModule({ code: VOXEL_VERTEX_SHADER });
    const voxelFragModule = device.createShaderModule({ code: VOXEL_FRAGMENT_SHADER });
    const postVertModule = device.createShaderModule({ code: POST_VERTEX_SHADER });
    const bloomFragModule = device.createShaderModule({ code: BLOOM_FRAGMENT_SHADER });
    const compositeFragModule = device.createShaderModule({ code: COMPOSITE_FRAGMENT_SHADER });
    const computeModule = device.createShaderModule({ code: PARTICLE_COMPUTE_SHADER });

    // 统一变量布局
    const uniformLayout: GPUBindGroupLayoutEntry[] = [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
        buffer: { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: 'read-only-storage' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'float' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: 'filtering' } },
    ];

    const bindGroupLayout = device.createBindGroupLayout({ entries: uniformLayout });
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });

    // 汉字体素管线
    this.hanziPipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: hanziVertModule,
        entryPoint: 'main',
        buffers: [],
      },
      fragment: {
        module: hanziFragModule,
        entryPoint: 'main',
        targets: [{ format: 'rgba16float' }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // 体素管线
    this.voxelPipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: voxelVertModule,
        entryPoint: 'main',
        buffers: [],
      },
      fragment: {
        module: voxelFragModule,
        entryPoint: 'main',
        targets: [{ format: 'rgba16float' }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // Bloom 提亮管线
    const bloomLayout = device.createBindGroupLayout({ entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
    ]});

    this.bloomExtractPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [bloomLayout] }),
      vertex: { module: postVertModule, entryPoint: 'main' },
      fragment: { module: bloomFragModule, entryPoint: 'main', targets: [{ format: 'rgba16float' }] },
      primitive: { topology: 'triangle-list' },
    });

    this.bloomBlurPipeline = this.bloomExtractPipeline;

    // 合成管线
    const compositeLayout = device.createBindGroupLayout({ entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
    ]});

    this.compositePipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [compositeLayout] }),
      vertex: { module: postVertModule, entryPoint: 'main' },
      fragment: { module: compositeFragModule, entryPoint: 'main', targets: [{ format: 'rgba8unorm' }] },
      primitive: { topology: 'triangle-list' },
    });

    // 计算管线
    this.particleComputePipeline = device.createComputePipeline({
      layout: pipelineLayout,
      compute: { module: computeModule, entryPoint: 'main' },
    });

    // 采样器
    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    });
  }

  /**
   * 初始化缓冲区
   */
  private async initBuffers(): Promise<void> {
    if (!this.device) return;

    const device = this.device;

    // 统一变量缓冲区（视图投影矩阵 + 其他）
    this.uniformBuffer = device.createBuffer({
      size: 256, // 对齐到 256 字节
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // 粒子缓冲区
    const particleSize = (4 + 3 + 4 + 1) * 4; // pos(4) + vel(3) + color(4) + life(1) = 48 bytes
    this.particleBuffer = device.createBuffer({
      size: this.maxParticles * particleSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // 体素实例缓冲区
    const voxelSize = (3 + 1 + 4) * 4; // pos(3) + scale(1) + color(4) = 32 bytes
    this.voxelBuffer = device.createBuffer({
      size: 10000 * voxelSize, // 最大 10000 个实例
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * 初始化纹理
   */
  private async initTextures(): Promise<void> {
    if (!this.device) return;

    const device = this.device;
    const width = this.config.width || 1920;
    const height = this.config.height || 1080;

    // 字体纹理（创建占位符）
    this.fontTexture = device.createTexture({
      size: [256, 256] as unknown as GPUExtent3D,
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // 场景纹理
    this.sceneTexture = device.createTexture({
      size: [width, height] as unknown as GPUExtent3D,
      format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    // Bloom 纹理 A
    this.bloomTextureA = device.createTexture({
      size: [Math.floor(width / 2), Math.floor(height / 2)] as unknown as GPUExtent3D,
      format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // Bloom 纹理 B
    this.bloomTextureB = device.createTexture({
      size: [Math.floor(width / 2), Math.floor(height / 2)] as unknown as GPUExtent3D,
      format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // 深度纹理
    this.depthTexture = device.createTexture({
      size: [width, height] as unknown as GPUExtent3D,
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  /**
   * 初始化全局光照系统
   */
  private async initGlobalIllumination(): Promise<void> {
    if (!this.device || !this.giEnabled) return;

    try {
      this.giManager = new GlobalIlluminationManager({
        enabled: true,
        maxBounces: 3,
        probeGridResolution: [16, 16, 16],
        svoMaxDepth: 8,
        minVoxelSize: 0.5,
      });

      const success = await this.giManager.init(this.device);
      if (success) {
        logger.info('WebGPURenderer', 'Global Illumination initialized');
      } else {
        logger.warn('WebGPURenderer', 'GI initialization failed, disabling');
        this.giManager = null;
      }
    } catch (error) {
      logger.error(
        'WebGPURenderer',
        'GI init error',
        error instanceof Error ? error : new Error(String(error))
      );
      this.giManager = null;
    }
  }

  /**
   * 初始化粒子系统
   */
  private initParticles(): void {
    this.particles = [];

    const chars = '永夜熵纪数字市民智慧混沌宇宙文明'.split('');
    const allColors = Object.values(PARTICLE_COLORS);

    for (let i = 0; i < this.maxParticles; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = Math.random() * 100;
      const z = (Math.random() - 0.5) * 200;
      const size = 0.5 + Math.random() * 0.5;

      const state = this.getRandomParticleState();
      const color = this.getParticleColorForState(state);

      this.particles.push({
        position: new Float32Array([x, y, z, size]),
        velocity: new Float32Array([0, -1 - Math.random() * 2, 0]),
        color: new Float32Array(color),
        life: new Float32Array([Math.random()]),
      });
    }

    this.uploadParticles();
  }

  /**
   * 获取随机粒子状态
   */
  private getRandomParticleState(): ParticleState {
    const rand = Math.random();
    if (rand < 0.3) return ParticleState.DORMANT;
    if (rand < 0.7) return ParticleState.BACKGROUND;
    return ParticleState.ACTIVE;
  }

  /**
   * 根据状态获取粒子颜色
   */
  private getParticleColorForState(state: ParticleState): [number, number, number, number] {
    const colors = STATE_COLOR_MAP[state];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 颜色线性插值
   */
  private lerpColor(
    a: [number, number, number, number],
    b: [number, number, number, number],
    t: number
  ): [number, number, number, number] {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
      a[3] + (b[3] - a[3]) * t,
    ];
  }

  /**
   * 根据生命周期获取颜色
   */
  private getParticleColorForLifePhase(
    phase: ParticleLifePhase,
    progress: number
  ): [number, number, number, number] {
    const gradient = LIFECYCLE_GRADIENTS[phase];
    return this.lerpColor(gradient.startColor, gradient.endColor, progress);
  }

  /**
   * 上传粒子数据到 GPU
   */
  private uploadParticles(): void {
    if (!this.device || !this.particleBuffer) return;

    const data = new Float32Array(this.maxParticles * 12);

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      const offset = i * 12;

      data[offset + 0] = p.position[0];
      data[offset + 1] = p.position[1];
      data[offset + 2] = p.position[2];
      data[offset + 3] = p.position[3]; // size

      data[offset + 4] = p.velocity[0];
      data[offset + 5] = p.velocity[1];
      data[offset + 6] = p.velocity[2];

      data[offset + 7] = p.color[0];
      data[offset + 8] = p.color[1];
      data[offset + 9] = p.color[2];
      data[offset + 10] = p.color[3];

      data[offset + 11] = p.life[0];
    }

    this.device.queue.writeBuffer(this.particleBuffer, 0, data);
  }

  /* -------------------- 矩阵计算 -------------------- */

  /**
   * 创建透视投影矩阵
   */
  private createPerspectiveMatrix(fov: number, aspect: number, near: number, far: number): Float32Array {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  }

  /**
   * 创建视图矩阵（看向目标）
   */
  private createLookAtMatrix(eye: Vec3, target: Vec3, up: Vec3): Float32Array {
    const zAxis = this.normalize([
      eye[0] - target[0], eye[1] - target[1], eye[2] - target[2],
    ]);
    const xAxis = this.normalize(this.cross(up, zAxis));
    const yAxis = this.cross(zAxis, xAxis);

    return new Float32Array([
      xAxis[0], yAxis[0], zAxis[0], 0,
      xAxis[1], yAxis[1], zAxis[1], 0,
      xAxis[2], yAxis[2], zAxis[2], 0,
      -this.dot(xAxis, eye), -this.dot(yAxis, eye), -this.dot(zAxis, eye), 1,
    ]);
  }

  private normalize(v: number[]): number[] {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  private cross(a: Vec3 | number[], b: Vec3 | number[]): Vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  private dot(a: Vec3 | number[], b: Vec3 | number[]): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  private multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
    const result = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] =
          a[j] * b[i * 4] +
          a[4 + j] * b[i * 4 + 1] +
          a[8 + j] * b[i * 4 + 2] +
          a[12 + j] * b[i * 4 + 3];
      }
    }
    return result;
  }

  /* -------------------- 相机控制 -------------------- */

  /**
   * 更新相机
   */
  public updateCamera(): void {
    const eye: Vec3 = [this.camera.x, this.camera.y, this.camera.z];
    const target: Vec3 = [this.camera.targetX, this.camera.targetY, this.camera.targetZ];
    const up: Vec3 = [this.camera.upX, this.camera.upY, this.camera.upZ];

    this.viewMatrix = this.createLookAtMatrix(eye, target, up);
    this.updateViewProjection();
  }

  /**
   * 设置相机位置
   */
  public setCameraPosition(x: number, y: number, z: number): void {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.z = z;
    this.updateCamera();
  }

  /**
   * 相机看向目标
   */
  public lookAt(x: number, y: number, z: number): void {
    this.camera.targetX = x;
    this.camera.targetY = y;
    this.camera.targetZ = z;
    this.updateCamera();
  }

  /**
   * 缩放
   */
  public setZoom(zoom: number): void {
    // 调整相机距离
    const dist = 100 / zoom;
    this.camera.z = dist;
    this.camera.y = dist * 0.5;
    this.updateCamera();
  }

  private updateViewProjection(): void {
    const aspect = this.config.width / this.config.height;
    this.projectionMatrix = this.createPerspectiveMatrix(
      Math.PI / 4, // 45度 FOV
      aspect,
      0.1,
      1000
    );
    this.viewProjectionMatrix = this.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
  }

  /* -------------------- 粒子更新 -------------------- */

  /**
   * 更新粒子（CPU 模拟，用于调试或低性能模式）
   */
  public updateParticlesCPU(deltaTime: number): void {
    const dt = deltaTime / 1000;
    const gravity = 0.5;
    const wind = 0.1;
    const time = performance.now() / 1000;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];

      const lifeRatio = p.life[0];
      const pulsePhase = time * 2 + i * 0.1;
      const pulse = Math.sin(pulsePhase) * 0.2 + 1;

      let lifePhase: ParticleLifePhase;
      if (lifeRatio > 0.9) lifePhase = ParticleLifePhase.BIRTH;
      else if (lifeRatio > 0.7) lifePhase = ParticleLifePhase.GROWTH;
      else if (lifeRatio > 0.4) lifePhase = ParticleLifePhase.MATURE;
      else if (lifeRatio > 0.15) lifePhase = ParticleLifePhase.DECAY;
      else lifePhase = ParticleLifePhase.DEATH;

      const gradient = LIFECYCLE_GRADIENTS[lifePhase];
      const lifeProgress = 1 - lifeRatio;
      const targetColor = this.getParticleColorForLifePhase(lifePhase, lifeProgress);

      p.color[0] += (targetColor[0] - p.color[0]) * dt * 2;
      p.color[1] += (targetColor[1] - p.color[1]) * dt * 2;
      p.color[2] += (targetColor[2] - p.color[2]) * dt * 2;
      p.color[3] += (targetColor[3] - p.color[3]) * dt * 2;

      const baseSize = 0.5 + (i % 10) * 0.05;
      p.position[3] = baseSize * gradient.sizeMultiplier * pulse;

      p.velocity[1] -= gravity * dt;

      p.velocity[0] += wind * dt;

      p.position[0] += p.velocity[0] * dt;
      p.position[1] += p.velocity[1] * dt;
      p.position[2] += p.velocity[2] * dt;

      p.life[0] -= dt * 0.1;

      if (p.position[1] < -50) {
        p.position[1] = 50;
        p.velocity[1] = Math.abs(p.velocity[1]) * 0.8;
        p.life[0] = 1;
      }
      if (p.position[0] < -100) p.position[0] = 100;
      if (p.position[0] > 100) p.position[0] = -100;
      if (p.position[2] < -100) p.position[2] = 100;
      if (p.position[2] > 100) p.position[2] = -100;

      if (p.life[0] <= 0) {
        p.position[0] = (Math.random() - 0.5) * 200;
        p.position[1] = 50;
        p.position[2] = (Math.random() - 0.5) * 200;
        p.velocity[0] = 0;
        p.velocity[1] = -1 - Math.random() * 2;
        p.velocity[2] = 0;
        p.life[0] = 1;

        const state = this.getRandomParticleState();
        const newColor = this.getParticleColorForState(state);
        p.color[0] = newColor[0];
        p.color[1] = newColor[1];
        p.color[2] = newColor[2];
        p.color[3] = newColor[3];
      }
    }
  }

  /**
   * 设置渲染目标市民
   */
  public setCitizens(citizens: RenderableCitizen[]): void {
    this.citizens = citizens;

    // 更新体素实例数据
    if (!this.device || !this.voxelBuffer) return;

    const voxelData = new Float32Array(10000 * 8);
    let count = 0;

    for (const citizen of citizens) {
      if (citizen.lodLevel !== LODLevel.CLOUD && citizen.visible && count < 10000) {
        const moodColor = this.getMoodColor(citizen.mood);
        const offset = count * 8;

        voxelData[offset + 0] = citizen.position.x;
        voxelData[offset + 1] = citizen.position.y;
        voxelData[offset + 2] = citizen.position.z;
        voxelData[offset + 3] = 0.5; // scale

        voxelData[offset + 4] = moodColor[0];
        voxelData[offset + 5] = moodColor[1];
        voxelData[offset + 6] = moodColor[2];
        voxelData[offset + 7] = 1.0;

        count++;

        // 为 PORTRAIT LOD 级别的市民生成面孔（集成程序化面孔生成器）
        if (citizen.lodLevel === LODLevel.PORTRAIT && citizen.faceData) {
          const phenotype = citizen.faceData as Phenotype & { createdAt?: number };
          if (!this.faceCache.has(citizen.id)) {
            // V5修复：使用正确的字符串类型映射 - eyeShape 必须在 FaceFeatures 允许的类型范围内
            const eyeShapes: ('round' | 'almond' | 'hooded' | 'upturned' | 'downturned' | 'wide')[] = ['round', 'almond', 'hooded', 'upturned', 'downturned', 'wide'];
            const noseShapes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
            const mouthShapes: ('thin' | 'medium' | 'full')[] = ['thin', 'medium', 'full'];
            const chinShapes: ('pointed' | 'rounded' | 'square')[] = ['pointed', 'rounded', 'square'];
            const faceShapes: ('oval' | 'round' | 'square' | 'heart')[] = ['oval', 'round', 'square', 'heart'];
            
            const seed = Math.random() * 10000;
            const age = Math.floor((Date.now() - (phenotype.createdAt ?? Date.now())) / (365 * 24 * 60 * 60 * 1000)) + 18;
            
            // 根据表现型生成面孔特征 - V5修复：使用完整的 FaceFeatures 属性
            const faceFeatures: FaceFeatures = {
              faceId: citizen.id,
              seed,
              faceShape: faceShapes[Math.floor((phenotype.appearance?.bodyType || 0.5) * 4) % 4] as FaceFeatures['faceShape'],
              faceWidth: 0.5 + (phenotype.appearance?.bodyType || 0.5) * 0.3,
              faceHeight: 0.5 + (phenotype.appearance?.bodyType || 0.5) * 0.2,
              foreheadHeight: 0.5,
              cheekboneWidth: 0.5,
              jawlineWidth: 0.5,
              skinTone: 'medium',
              skinUndertone: 'neutral',
              skinTexture: 0.5,
              age,
              ageSigns: { wrinkles: 0, crowFeet: 0, foreheadLines: 0, nasolabialFolds: 0, ageSpots: 0, sagging: 0 },
              genderFeature: (phenotype.appearance?.bodyType || 0.5) * 2 - 1,
              eyeSize: 0.5 + (phenotype.appearance?.eyeColor || 0.5),
              eyeSpacing: 0.6 + (phenotype.appearance?.bodyType || 0.5) * 0.2,
              eyeShape: eyeShapes[Math.floor((phenotype.appearance?.eyeColor || 0.5) * 6) % 6],
              eyeColor: 'brown',
              eyeSlant: 0,
              eyelidType: 'double',
              eyebrowShape: 'arched',
              eyebrowThickness: 0.5,
              eyebrowAngle: 0,
              eyebrowSpacing: 0.5,
              noseSize: 0.5 + (phenotype.appearance?.skinTone || 0.5) * 0.3,
              noseWidth: 0.5,
              noseShape: noseShapes[Math.floor((phenotype.appearance?.skinTone || 0.5) * 3) % 3] as FaceFeatures['noseShape'],
              noseBridge: 'medium',
              nostrilVisibility: 0.5,
              mouthSize: 0.5 + (phenotype.behavior?.aggression || 0.5) * 0.3,
              mouthWidth: 0.5,
              lipThickness: mouthShapes[Math.floor((phenotype.behavior?.aggression || 0.5) * 3) % 3] as FaceFeatures['lipThickness'],
              lipShape: 'bow',
              cupidBow: 0.5,
              chinShape: chinShapes[Math.floor((phenotype.appearance?.bodyType || 0.5) * 3) % 3] as FaceFeatures['chinShape'],
              chinSize: 0.5,
              chinProjection: 0.5,
              jawline: 'soft',
              earShape: 'normal',
              earSize: 0.5,
              earAngle: 0,
              hairStyle: 'short',
              hairColor: 'brown',
              hairDensity: 0.8,
              hairline: 'medium',
              facialHair: { hasFacialHair: false, style: 'none', density: 0, color: 'brown' },
              uniqueMarks: [],
              distinguishingFeatures: [],
              geneticHash: citizen.id,
            };
            this.faceCache.set(citizen.id, faceFeatures);
            // 使用 faceGenerator 生成面孔实例
            faceGenerator.generateFace(faceFeatures, ProceduralFaceGenerator.getNeutralExpression());
          }
        }
      }
    }

    this.device.queue.writeBuffer(this.voxelBuffer, 0, voxelData.subarray(0, count * 8));
  }

  private getMoodColor(mood: number): [number, number, number] {
    if (mood > 80) return [0.22, 1, 0.08];   // 绿色
    if (mood > 60) return [0, 0.94, 1];       // 青色
    if (mood > 40) return [1, 0.84, 0];        // 黄色
    if (mood > 20) return [1, 0.4, 0];         // 橙色
    return [1, 0.2, 0.2];                     // 红色
  }

  /* -------------------- 主渲染循环 -------------------- */

  /**
   * 渲染一帧
   */
  public render(deltaTime: number): void {
    if (!this.initialized || !this.device || !this.context) return;

    this.time += deltaTime / 1000;

    // 更新粒子（CPU 版本）
    this.updateParticlesCPU(deltaTime);
    this.uploadParticles();

    // 获取渲染目标
    const textureView = this.context.getCurrentTexture().createView();
    const renderPass: GPURenderPassDescriptor = {
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.02, g: 0.02, b: 0.03, a: 1 }, // 深蓝黑背景
        loadOp: 'clear',
        storeOp: 'store',
      }],
    };

    // 开始渲染
    const commandEncoder = this.device.createCommandEncoder();

    // 更新统一变量
    const uniformData = new Float32Array(16 + 4 + 4); // viewProjection(16) + cameraPos(4) + time(4)
    uniformData.set(this.viewProjectionMatrix, 0);
    uniformData.set([this.camera.x, this.camera.y, this.camera.z, 0], 16);
    uniformData.set([this.time, 0, 0, 0], 20);

    if (this.uniformBuffer) {
      this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }

    // 渲染到场景纹理
    const scenePass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: this.sceneTexture!.createView(),
        clearValue: { r: 0.02, g: 0.02, b: 0.03, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
      // depthStencilAttachment: {
      //   view: this.depthTexture.createView(),
      //   depthClearValue: 1.0,
      //   depthLoadOp: 'clear',
      //   depthStoreOp: 'store',
      // },
    });

    // 绑定统一变量
    const bindGroup = this.device.createBindGroup({
      layout: this.hanziPipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer! } },
        { binding: 1, resource: { buffer: this.particleBuffer! } },
        { binding: 2, resource: this.fontTexture!.createView() },
        { binding: 3, resource: this.sampler! },
      ],
    });

    // 渲染汉字雨（粒子系统）
    scenePass.setPipeline(this.hanziPipeline!);
    scenePass.setBindGroup(0, bindGroup);
    scenePass.draw(6, this.maxParticles); // 6 顶点（2三角形） x 实例数

    // 渲染体素
    if (this.voxelBuffer && this.citizens.length > 0) {
      const voxelBindGroup = this.device.createBindGroup({
        layout: this.voxelPipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.uniformBuffer! } },
          { binding: 1, resource: { buffer: this.voxelBuffer! } },
        ],
      });

      scenePass.setPipeline(this.voxelPipeline!);
      scenePass.setBindGroup(0, voxelBindGroup);
      scenePass.draw(36, Math.min(this.citizens.length, 10000)); // 36顶点（立方体6面）
    }

    scenePass.end();

    // 全局光照计算
    if (this.giManager && this.sceneTexture) {
      this.giManager.computeGI(
        commandEncoder,
        [this.camera.x, this.camera.y, this.camera.z],
        [0.5, 1.0, 0.3], // 光照方向
        this.sceneTexture
      );
    }

    // Bloom 提亮
    const bloomUniform = new Float32Array(4);
    bloomUniform[0] = 0.8;  // threshold
    bloomUniform[1] = 1.0;  // intensity
    bloomUniform[2] = 1.0;  // radius
    bloomUniform[3] = 0;

    const bloomBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(bloomBuffer, 0, bloomUniform);

    const bloomExtractPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: this.bloomTextureA!.createView(),
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });

    const bloomBindGroup = this.device.createBindGroup({
      layout: this.bloomExtractPipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: bloomBuffer } },
        { binding: 1, resource: this.sceneTexture!.createView() },
        { binding: 2, resource: this.sampler! },
      ],
    });

    bloomExtractPass.setPipeline(this.bloomExtractPipeline!);
    bloomExtractPass.setBindGroup(0, bloomBindGroup);
    bloomExtractPass.draw(6);
    bloomExtractPass.end();

    // 合成最终图像
    const compositePass = commandEncoder.beginRenderPass(renderPass);

    const compositeBindGroup = this.device.createBindGroup({
      layout: this.compositePipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.sceneTexture!.createView() },
        { binding: 1, resource: this.bloomTextureA!.createView() },
        { binding: 2, resource: this.sampler! },
      ],
    });

    compositePass.setPipeline(this.compositePipeline!);
    compositePass.setBindGroup(0, compositeBindGroup);
    compositePass.draw(6);
    compositePass.end();

    // 提交命令
    this.device.queue.submit([commandEncoder.finish()]);
  }

  /* -------------------- 窗口调整 -------------------- */

  /**
   * 处理窗口大小调整
   */
  private handleResize(): void {
    const update = () => {
      if (!this.canvas) return;

      const dpr = Math.min(window.devicePixelRatio, 2);
      const width = this.canvas.clientWidth * dpr;
      const height = this.canvas.clientHeight * dpr;

      this.config.width = width;
      this.config.height = height;
      this.config.pixelRatio = dpr;

      this.canvas.width = width;
      this.canvas.height = height;

      // 重新创建渲染目标纹理
      if (this.device) {
        this.initTextures();
        this.updateViewProjection();
      }
    };

    window.addEventListener('resize', update);
    this.cleanupHandlers.push(() => window.removeEventListener('resize', update));
    update();
  }

  /* -------------------- 性能模式 -------------------- */

  /**
   * 设置性能模式
   */
  public setPerformanceMode(mode: PerformanceMode): void {
    this.perfConfig = PERFORMANCE_CONFIGS[mode];
    this.maxParticles = this.perfConfig.particleCount;

    this.initParticles();
  }

  /**
   * 根据市民状态更新粒子颜色
   */
  public updateParticlesFromCitizens(citizens: RenderableCitizen[]): void {
    if (!this.particles || this.particles.length === 0) return;

    const particleCount = this.particles.length;
    const citizenCount = citizens.length;

    for (let i = 0; i < particleCount; i++) {
      const citizenIndex = i % citizenCount;
      const citizen = citizens[citizenIndex];

      if (citizen) {
        const state = this.mapCitizenStateToParticle(citizen.lodLevel);
        const colors = STATE_COLOR_MAP[state];
        const targetColor = colors[Math.floor(Math.random() * colors.length)];

        const p = this.particles[i];
        p.color[0] = targetColor[0];
        p.color[1] = targetColor[1];
        p.color[2] = targetColor[2];
        p.color[3] = targetColor[3];
      }
    }

    this.uploadParticles();
  }

  /**
   * 将市民 LOD 映射到粒子状态
   */
  private mapCitizenStateToParticle(lodLevel: LODLevel): ParticleState {
    switch (lodLevel) {
      case LODLevel.CLOUD:
        return ParticleState.DORMANT;
      case LODLevel.GRID:
        return ParticleState.BACKGROUND;
      case LODLevel.VOXEL:
      case LODLevel.PORTRAIT:
        return ParticleState.ACTIVE;
      default:
        return ParticleState.BACKGROUND;
    }
  }

  /**
   * 根据市民情绪更新粒子效果
   */
  public updateParticlesFromMood(citizens: RenderableCitizen[]): void {
    if (!this.particles || this.particles.length === 0) return;

    const time = performance.now() / 1000;

    for (let i = 0; i < this.particles.length; i++) {
      const citizenIndex = i % citizens.length;
      const citizen = citizens[citizenIndex];

      if (citizen) {
        const mood = citizen.mood || 50;
        const energy = citizen.energy || 50;
        const health = citizen.health || 50;

        let state: ParticleState;
        if (health < 20) {
          state = ParticleState.DYING;
        } else if (energy < 20) {
          state = ParticleState.DORMANT;
        } else if (mood > 70 && energy > 70) {
          state = ParticleState.ACTIVE;
        } else {
          state = ParticleState.BACKGROUND;
        }

        const colors = STATE_COLOR_MAP[state];
        const baseColor = colors[0];

        const p = this.particles[i];
        const pulseIntensity = 0.3 + (mood / 100) * 0.7;
        const pulse = Math.sin(time * 3 + i * 0.1) * 0.2 + 1;

        p.color[0] = baseColor[0] * pulseIntensity;
        p.color[1] = baseColor[1] * pulseIntensity;
        p.color[2] = baseColor[2] * pulseIntensity;
        p.color[3] = baseColor[3];

        const baseSize = 0.5 + (energy / 100) * 0.5;
        p.position[3] = baseSize * pulse;
      }
    }

    this.uploadParticles();
  }

  /* -------------------- 清理 -------------------- */

  /**
   * 销毁渲染器
   */
  public dispose(): void {
    // 执行所有清理函数（移除事件监听器等）
    this.cleanupHandlers.forEach(cleanup => cleanup());
    this.cleanupHandlers = [];

    if (this.device) {
      this.particleBuffer?.destroy();
      this.voxelBuffer?.destroy();
      this.uniformBuffer?.destroy();
      this.fontTexture?.destroy();
      this.sceneTexture?.destroy();
      this.bloomTextureA?.destroy();
      this.bloomTextureB?.destroy();
      this.depthTexture?.destroy();
      this.device.destroy();
    }

    this.initialized = false;
  }

  /* -------------------- 状态查询 -------------------- */

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getParticleCount(): number {
    return this.maxParticles;
  }

  public getDevice(): GPUDevice | null {
    return this.device;
  }

  /**
   * 获取市民面孔数据（集成程序化面孔生成器）
   */
  public getCitizenFace(citizenId: string): FaceFeatures | undefined {
    return this.faceCache.get(citizenId);
  }

  /**
   * 获取所有面孔数据
   */
  public getAllFaces(): Map<string, FaceFeatures> {
    return this.faceCache;
  }
}

// 单例导出
export const webGPURenderer = new WebGPURenderer();
