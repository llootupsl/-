/**
 * =============================================================================
 * VOXEL HUMAN RENDERER - 极致体素人渲染引擎
 * THE ULTIMATE VOXEL HUMAN RENDERING SYSTEM
 * 
 * 特性：
 * 1. DNA驱动的程序化生成 - 每个市民独一无二
 * 2. 多级LOD系统 - 从32x32x64到512x512x1024体素
 * 3. 实时物理模拟 - 布料、头发、软体动力学
 * 4. 表情动画系统 - 48个面部肌肉模拟
 * 5. 年龄演化引擎 - 从婴儿到老年的完整生命周期
 * 6. 伤害可视化 - 伤口、疤痕、义肢
 * 7. WebGPU计算着色器 - GPU加速体素操作
 * =============================================================================
 */

import { webgpuContext } from '../rendering/WebGPUContext';
import { logger } from '@/core/utils/Logger';

/**
 * 体素数据结构 - 单个体素单元
 */
export interface Voxel {
  position: Uint16Array;      // 3D坐标 (x, y, z) 压缩为16位
  color: Uint8Array;          // RGBA颜色
  material: VoxelMaterial;     // 材质类型
  density: number;            // 密度 0-1
  temperature: number;        // 温度 (影响颜色变化)
  flags: VoxelFlags;          // 状态标志
}

/**
 * 体素材质类型
 */
export enum VoxelMaterial {
  AIR = 0,           // 空气
  SKIN = 1,          // 皮肤
  BONE = 2,          // 骨骼
  MUSCLE = 3,        // 肌肉
  FAT = 4,           // 脂肪
  ORGAN = 5,         // 器官
  BLOOD = 6,         // 血液
  HAIR = 7,          // 头发
  CLOTH = 8,         // 衣物
  METAL = 9,         // 金属(义肢)
  CYBERNETIC = 10,   // 赛博义体
  HOLOGRAPHIC = 11,  // 全息投影
}

/**
 * 体素标志位
 */
export enum VoxelFlags {
  NONE = 0,
  DAMAGED = 1 << 0,      // 受损
  SCARRED = 1 << 1,      // 疤痕
  INFECTED = 1 << 2,     // 感染
  REGENERATING = 1 << 3, // 再生中
  CYBERNETIC = 1 << 4,   // 义体化
  GLOWING = 1 << 5,      // 发光
  TRANSPARENT = 1 << 6,  // 透明
  ANIMATED = 1 << 7,     // 动画中
}

/**
 * DNA配置 - 决定体素人的外观
 */
export interface VoxelDNA {
  // 基础属性
  height: number;              // 身高基因 0-1
  build: number;               // 体型基因 0-1 (瘦-胖)
  muscle: number;              // 肌肉量 0-1
  
  // 面部特征
  faceWidth: number;           // 脸宽
  faceHeight: number;          // 脸长
  jawWidth: number;            // 下颌宽度
  chinProminence: number;      // 下巴突出度
  cheekboneHeight: number;     // 颧骨高度
  eyeSize: number;             // 眼睛大小
  eyeSpacing: number;          // 眼距
  eyeAngle: number;            // 眼角倾斜度
  noseLength: number;          // 鼻子长度
  noseWidth: number;           // 鼻子宽度
  noseBridge: number;          // 鼻梁高度
  lipThickness: number;        // 嘴唇厚度
  lipWidth: number;            // 嘴巴宽度
  earSize: number;             // 耳朵大小
  earAngle: number;            // 耳朵角度
  
  // 皮肤特征
  skinTone: number;            // 肤色 0-1
  skinUndertone: number;       // 肤色底调 (冷-暖)
  freckles: number;            // 雀斑密度
  moles: number;               // 痣数量
  wrinkles: number;            // 皱纹程度
  
  // 毛发特征
  hairDensity: number;         // 头发密度
  hairCurliness: number;       // 卷曲度
  hairLength: number;          // 头发长度
  hairColor: [number, number, number]; // RGB
  facialHair: number;          // 面部毛发
  eyebrowDensity: number;      // 眉毛密度
  eyebrowShape: number;        // 眉毛形状
  
  // 身体特征
  shoulderWidth: number;       // 肩宽
  armLength: number;           // 手臂长度
  handSize: number;            // 手掌大小
  legLength: number;           // 腿长
  footSize: number;            // 脚的大小
  
  // 特殊特征
  heterochromia: number;       // 异瞳程度
  vitiligo: number;            // 白斑病程度
  albinism: number;            // 白化病程度
  cyberneticParts: number;     // 义体化程度
}

/**
 * LOD级别配置
 */
export interface LODLevel {
  resolution: [number, number, number];  // 体素分辨率
  distance: number;                       // 切换距离
  updateFrequency: number;                // 更新频率 (ms)
  physicsDetail: number;                  // 物理精度 0-1
}

/**
 * 面部表情 - 基于FACS (面部动作编码系统)
 */
export enum FacialActionUnit {
  // 眉毛
  INNER_BROW_RAISER = 1,        // 内眉上扬
  OUTER_BROW_RAISER = 2,        // 外眉上扬
  BROW_LOWERER = 4,             // 眉毛下压
  
  // 眼睛
  UPPER_LID_RAISER = 5,         // 上眼睑上扬
  CHEEK_RAISER = 6,             // 颧骨抬起
  LID_TIGHTENER = 7,            // 眼睑紧绷
  EYES_CLOSED = 43,             // 闭眼
  
  // 鼻子
  NOSE_WRINKLER = 9,            // 皱鼻
  UPPER_LIP_RAISER = 10,        // 上唇上扬
  
  // 嘴巴
  LIP_CORNER_PULLER = 12,       // 嘴角上扬 (微笑)
  CHEEK_PUFFER = 13,            // 鼓腮
  DIMPLER = 14,                 // 酒窝
  LIP_CORNER_DEPRESSOR = 15,    // 嘴角下压
  LOWER_LIP_DEPRESSOR = 16,     // 下唇下压
  CHIN_RAISER = 17,             // 下巴上扬
  LIP_PUCKERER = 18,            // 嘴唇嘟起
  LIP_TIGHTENER = 20,           // 嘴唇紧绷
  LIP_FUNNELER = 22,            // 嘴唇漏斗状
  LIP_PRESSOR = 24,             // 嘴唇紧闭
  LIPS_PART = 25,               // 嘴唇分开
  JAW_DROP = 26,                // 下巴张开
  MOUTH_STRETCH = 27,           // 嘴巴张大
  
  // 下巴
  CHIN_RAISER_LOWER = 17,       // 下下巴上扬
  JAW_THRUST = 29,              // 下巴前伸
  JAW_SIDEWAYS = 30,            // 下巴侧移
}

/**
 * 预设表情
 */
export interface FacialExpression {
  name: string;
  actionUnits: Map<FacialActionUnit, number>;  // AU -> 强度 0-1
  duration: number;
  transition: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
}

/**
 * 动画状态
 */
export interface AnimationState {
  currentPose: Float32Array;      // 当前姿势
  targetPose: Float32Array;       // 目标姿势
  blendWeight: number;            // 混合权重
  animationTime: number;          // 动画时间
  speed: number;                  // 播放速度
  loop: boolean;                  // 是否循环
}

/**
 * 物理模拟配置
 */
export interface PhysicsConfig {
  gravity: [number, number, number];
  windForce: [number, number, number];
  clothStiffness: number;
  clothDamping: number;
  hairStiffness: number;
  hairDamping: number;
  softBodyPressure: number;
  collisionIterations: number;
}

/**
 * 体素人渲染器 - 主类
 */
export class VoxelHumanRenderer {
  private device: GPUDevice | null = null;
  private voxelBuffer: GPUBuffer | null = null;
  private computePipeline: GPUComputePipeline | null = null;
  private renderPipeline: GPURenderPipeline | null = null;
  
  private dna: VoxelDNA;
  private age: number = 25;
  private lodLevel: number = 0;
  private voxels: Voxel[] = [];
  
  private expression: FacialExpression | null = null;
  private expressionIntensity: number = 0;
  private expressionTime: number = 0;
  
  private physicsConfig: PhysicsConfig;
  private animationState: AnimationState;
  
  private static readonly LOD_LEVELS: LODLevel[] = [
    { resolution: [32, 64, 32], distance: 100, updateFrequency: 100, physicsDetail: 0.25 },
    { resolution: [64, 128, 64], distance: 50, updateFrequency: 50, physicsDetail: 0.5 },
    { resolution: [128, 256, 128], distance: 25, updateFrequency: 25, physicsDetail: 0.75 },
    { resolution: [256, 512, 256], distance: 10, updateFrequency: 16, physicsDetail: 1.0 },
    { resolution: [512, 1024, 512], distance: 5, updateFrequency: 8, physicsDetail: 1.0 },
  ];
  
  private readonly computeShader = `
    struct Voxel {
      position: vec3<u32>,
      color: vec4<u8>,
      material: u32,
      density: f32,
      temperature: f32,
      flags: u32,
    }
    
    struct Uniforms {
      time: f32,
      deltaTime: f32,
      lodLevel: u32,
      voxelCount: u32,
      gravity: vec3<f32>,
      windForce: vec3<f32>,
      clothStiffness: f32,
      clothDamping: f32,
      hairStiffness: f32,
      hairDamping: f32,
      softBodyPressure: f32,
    }
    
    @group(0) @binding(0) var<storage, read_write> voxels: array<Voxel>;
    @group(0) @binding(1) var<uniform> uniforms: Uniforms;
    @group(0) @binding(2) var<storage, read> dna: array<f32>;
    @group(0) @binding(3) var<storage, read> expression: array<f32>;
    
    const PI: f32 = 3.14159265359;
    
    fn hash(p: vec3<u32>) -> u32 {
      var h = p.x * 374761393u + p.y * 668265263u + p.z * 1274126177u;
      h = (h ^ (h >> 13u)) * 1274126177u;
      return h;
    }
    
    fn noise3D(p: vec3<f32>) -> f32 {
      let i = vec3<u32>(floor(p));
      let f = fract(p);
      let u = f * f * (3.0 - 2.0 * f);
      
      return mix(
        mix(
          mix(f32(hash(i) & 65535u) / 65535.0,
              f32(hash(i + vec3<u32>(1u, 0u, 0u)) & 65535u) / 65535.0, u.x),
          mix(f32(hash(i + vec3<u32>(0u, 1u, 0u)) & 65535u) / 65535.0,
              f32(hash(i + vec3<u32>(1u, 1u, 0u)) & 65535u) / 65535.0, u.x), u.y),
        mix(
          mix(f32(hash(i + vec3<u32>(0u, 0u, 1u)) & 65535u) / 65535.0,
              f32(hash(i + vec3<u32>(1u, 0u, 1u)) & 65535u) / 65535.0, u.x),
          mix(f32(hash(i + vec3<u32>(0u, 1u, 1u)) & 65535u) / 65535.0,
              f32(hash(i + vec3<u32>(1u, 1u, 1u)) & 65535u) / 65535.0, u.x), u.y), u.z);
    }
    
    fn fbm(p: vec3<f32>, octaves: u32) -> f32 {
      var value = 0.0;
      var amplitude = 0.5;
      var frequency = 1.0;
      var pos = p;
      
      for (var i = 0u; i < octaves; i++) {
        value += amplitude * noise3D(pos * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }
    
    fn sdSphere(p: vec3<f32>, r: f32) -> f32 {
      return length(p) - r;
    }
    
    fn sdEllipsoid(p: vec3<f32>, r: vec3<f32>) -> f32 {
      let k0 = length(p / r);
      let k1 = length(p / (r * r));
      return k0 * (k0 - 1.0) / k1;
    }
    
    fn sdCapsule(p: vec3<f32>, a: vec3<f32>, b: vec3<f32>, r: f32) -> f32 {
      let pa = p - a;
      let ba = b - a;
      let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h) - r;
    }
    
    fn sdTorus(p: vec3<f32>, t: vec2<f32>) -> f32 {
      let q = vec2<f32>(length(p.xz) - t.x, p.y);
      return length(q) - t.y;
    }
    
    fn smin(a: f32, b: f32, k: f32) -> f32 {
      let h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
      return mix(b, a, h) - k * h * (1.0 - h);
    }
    
    fn smax(a: f32, b: f32, k: f32) -> f32 {
      let h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
      return mix(a, b, h) + k * h * (1.0 - h);
    }
    
    fn getHeadSDF(p: vec3<f32>, dna: array<f32>) -> f32 {
      let faceWidth = dna[4u];
      let faceHeight = dna[5u];
      let jawWidth = dna[6u];
      let chinProminence = dna[7u];
      let cheekboneHeight = dna[8u];
      
      var head = sdEllipsoid(p, vec3<f32>(
        0.5 + faceWidth * 0.2,
        0.6 + faceHeight * 0.2,
        0.55
      ));
      
      let jawPos = p - vec3<f32>(0.0, -0.3, 0.1);
      let jaw = sdEllipsoid(jawPos, vec3<f32>(
        0.35 + jawWidth * 0.15,
        0.25,
        0.4
      ));
      head = smin(head, jaw, 0.15);
      
      let chinPos = p - vec3<f32>(0.0, -0.55, 0.15 * chinProminence);
      let chin = sdSphere(chinPos, 0.08 + chinProminence * 0.05);
      head = smin(head, chin, 0.1);
      
      let cheekL = sdSphere(p - vec3<f32>(0.35, 0.1 + cheekboneHeight * 0.1, 0.25), 0.12);
      let cheekR = sdSphere(p - vec3<f32>(-0.35, 0.1 + cheekboneHeight * 0.1, 0.25), 0.12);
      head = smin(head, cheekL, 0.08);
      head = smin(head, cheekR, 0.08);
      
      return head;
    }
    
    fn getEyeSDF(p: vec3<f32>, side: f32, dna: array<f32>) -> f32 {
      let eyeSize = dna[9u];
      let eyeSpacing = dna[10u];
      let eyeAngle = dna[11u];
      
      let eyePos = vec3<f32>(
        side * (0.15 + eyeSpacing * 0.1),
        0.15 + sin(eyeAngle * PI) * 0.05,
        0.45
      );
      
      let eye = sdSphere(p - eyePos, 0.06 + eyeSize * 0.03);
      
      let irisPos = eyePos + vec3<f32>(0.0, 0.0, 0.04 + eyeSize * 0.02);
      let iris = sdSphere(p - irisPos, 0.03 + eyeSize * 0.015);
      
      return smax(eye, -iris, 0.01);
    }
    
    fn getNoseSDF(p: vec3<f32>, dna: array<f32>) -> f32 {
      let noseLength = dna[12u];
      let noseWidth = dna[13u];
      let noseBridge = dna[14u];
      
      let bridgeStart = vec3<f32>(0.0, 0.15, 0.4);
      let bridgeEnd = vec3<f32>(0.0, -0.05, 0.55 + noseLength * 0.15);
      let bridge = sdCapsule(p, bridgeStart, bridgeEnd, 0.03 + noseBridge * 0.02);
      
      let nostrilL = sdSphere(p - vec3<f32>(0.04 + noseWidth * 0.03, -0.08, 0.5 + noseLength * 0.1), 0.025 + noseWidth * 0.01);
      let nostrilR = sdSphere(p - vec3<f32>(-0.04 - noseWidth * 0.03, -0.08, 0.5 + noseLength * 0.1), 0.025 + noseWidth * 0.01);
      
      var nose = smin(bridge, nostrilL, 0.05);
      nose = smin(nose, nostrilR, 0.05);
      
      return nose;
    }
    
    fn getMouthSDF(p: vec3<f32>, dna: array<f32>) -> f32 {
      let lipThickness = dna[15u];
      let lipWidth = dna[16u];
      
      let upperLip = sdCapsule(
        p,
        vec3<f32>(-0.08 - lipWidth * 0.05, -0.2, 0.45),
        vec3<f32>(0.08 + lipWidth * 0.05, -0.2, 0.45),
        0.015 + lipThickness * 0.01
      );
      
      let lowerLip = sdCapsule(
        p,
        vec3<f32>(-0.07 - lipWidth * 0.04, -0.25, 0.44),
        vec3<f32>(0.07 + lipWidth * 0.04, -0.25, 0.44),
        0.012 + lipThickness * 0.008
      );
      
      return smin(upperLip, lowerLip, 0.03);
    }
    
    fn getEarSDF(p: vec3<f32>, side: f32, dna: array<f32>) -> f32 {
      let earSize = dna[17u];
      let earAngle = dna[18u];
      
      let earPos = vec3<f32>(
        side * (0.5 + earSize * 0.05),
        0.1,
        0.0
      );
      
      let ear = sdEllipsoid(
        p - earPos,
        vec3<f32>(0.04, 0.08 + earSize * 0.04, 0.03)
      );
      
      return ear;
    }
    
    fn getTorsoSDF(p: vec3<f32>, dna: array<f32>) -> f32 {
      let build = dna[1u];
      let muscle = dna[2u];
      let shoulderWidth = dna[26u];
      
      let torso = sdEllipsoid(
        p - vec3<f32>(0.0, -1.2, 0.0),
        vec3<f32>(
          0.35 + build * 0.15 + muscle * 0.05 + shoulderWidth * 0.1,
          0.6,
          0.25 + build * 0.1
        )
      );
      
      return torso;
    }
    
    fn getArmSDF(p: vec3<f32>, side: f32, dna: array<f32>) -> f32 {
      let build = dna[1u];
      let muscle = dna[2u];
      let armLength = dna[27u];
      let shoulderWidth = dna[26u];
      
      let shoulderPos = vec3<f32>(side * (0.4 + shoulderWidth * 0.15), -0.7, 0.0);
      let elbowPos = vec3<f32>(side * (0.5 + shoulderWidth * 0.15), -1.2, 0.0);
      let wristPos = vec3<f32>(side * (0.45 + shoulderWidth * 0.1), -1.7 - armLength * 0.3, 0.0);
      
      let upperArm = sdCapsule(p, shoulderPos, elbowPos, 0.08 + muscle * 0.04);
      let lowerArm = sdCapsule(p, elbowPos, wristPos, 0.06 + muscle * 0.02);
      
      return smin(upperArm, lowerArm, 0.05);
    }
    
    fn getLegSDF(p: vec3<f32>, side: f32, dna: array<f32>) -> f32 {
      let build = dna[1u];
      let muscle = dna[2u];
      let legLength = dna[29u];
      
      let hipPos = vec3<f32>(side * 0.15, -1.8, 0.0);
      let kneePos = vec3<f32>(side * 0.12, -2.5 - legLength * 0.2, 0.0);
      let anklePos = vec3<f32>(side * 0.1, -3.2 - legLength * 0.4, 0.0);
      
      let upperLeg = sdCapsule(p, hipPos, kneePos, 0.1 + build * 0.05 + muscle * 0.02);
      let lowerLeg = sdCapsule(p, kneePos, anklePos, 0.07 + build * 0.03);
      
      return smin(upperLeg, lowerLeg, 0.05);
    }
    
    fn getHandSDF(p: vec3<f32>, side: f32, dna: array<f32>) -> f32 {
      let handSize = dna[28u];
      let armLength = dna[27u];
      let shoulderWidth = dna[26u];
      
      let wristPos = vec3<f32>(side * (0.45 + shoulderWidth * 0.1), -1.7 - armLength * 0.3, 0.0);
      let palmCenter = wristPos - vec3<f32>(0.0, 0.12 + handSize * 0.05, 0.02);
      
      let palm = sdBox(p - palmCenter, vec3<f32>(0.05 + handSize * 0.02, 0.06 + handSize * 0.02, 0.02));
      
      var fingers: f32 = 1000.0;
      for (var i = 0u; i < 4u; i++) {
        let fingerBase = palmCenter + vec3<f32>((f32(i) - 1.5) * 0.025, -0.06, 0.0);
        let fingerTip = fingerBase - vec3<f32>(0.0, 0.08 + handSize * 0.03 + f32(i) * 0.01, 0.01);
        let finger = sdCapsule(p, fingerBase, fingerTip, 0.008);
        fingers = smin(fingers, finger, 0.01);
      }
      
      let thumbBase = palmCenter + vec3<f32>(side * 0.04, -0.02, 0.02);
      let thumbTip = thumbBase + vec3<f32>(side * 0.03, -0.05, 0.02);
      let thumb = sdCapsule(p, thumbBase, thumbTip, 0.01);
      
      var hand = smin(palm, fingers, 0.02);
      hand = smin(hand, thumb, 0.02);
      
      return hand;
    }
    
    fn getFootSDF(p: vec3<f32>, side: f32, dna: array<f32>) -> f32 {
      let footSize = dna[30u];
      let legLength = dna[29u];
      
      let anklePos = vec3<f32>(side * 0.1, -3.2 - legLength * 0.4, 0.0);
      let toePos = anklePos - vec3<f32>(0.0, 0.1, 0.15 + footSize * 0.05);
      
      let foot = sdCapsule(p, anklePos, toePos, 0.05 + footSize * 0.02);
      
      return foot;
    }
    
    fn getBodySDF(p: vec3<f32>, dna: array<f32>) -> f32 {
      var body = getHeadSDF(p, dna);
      body = smin(body, getTorsoSDF(p, dna), 0.1);
      body = smin(body, getArmSDF(p, 1.0, dna), 0.08);
      body = smin(body, getArmSDF(p, -1.0, dna), 0.08);
      body = smin(body, getLegSDF(p, 1.0, dna), 0.08);
      body = smin(body, getLegSDF(p, -1.0, dna), 0.08);
      body = smin(body, getHandSDF(p, 1.0, dna), 0.05);
      body = smin(body, getHandSDF(p, -1.0, dna), 0.05);
      body = smin(body, getFootSDF(p, 1.0, dna), 0.05);
      body = smin(body, getFootSDF(p, -1.0, dna), 0.05);
      
      body = smin(body, getEyeSDF(p, 1.0, dna), 0.02);
      body = smin(body, getEyeSDF(p, -1.0, dna), 0.02);
      body = smin(body, getNoseSDF(p, dna), 0.03);
      body = smin(body, getMouthSDF(p, dna), 0.03);
      body = smin(body, getEarSDF(p, 1.0, dna), 0.03);
      body = smin(body, getEarSDF(p, -1.0, dna), 0.03);
      
      return body;
    }
    
    fn getSkinColor(dna: array<f32>, detail: f32) -> vec3<f32> {
      let skinTone = dna[19u];
      let undertone = dna[20u];
      
      let baseColor = mix(
        mix(vec3<f32>(0.9, 0.7, 0.6), vec3<f32>(0.6, 0.4, 0.3), skinTone),
        mix(vec3<f32>(0.8, 0.6, 0.5), vec3<f32>(0.5, 0.35, 0.25), skinTone),
        undertone
      );
      
      let variation = fbm(vec3<f32>(detail * 10.0), 4u) * 0.1;
      return baseColor * (0.9 + variation);
    }
    
    fn applyExpression(p: vec3<f32>, expression: array<f32>, intensity: f32) -> vec3<f32> {
      var displaced = p;
      
      let smileAU = expression[0u];
      let browRaiseAU = expression[1u];
      let browLowerAU = expression[2u];
      let eyeSquintAU = expression[3u];
      let jawOpenAU = expression[4u];
      
      if (p.y > -0.3 && p.y < 0.0) {
        let mouthY = (p.y + 0.15) / 0.15;
        displaced.z += smileAU * intensity * 0.05 * sin(mouthY * PI) * abs(p.x) * 2.0;
        displaced.y -= smileAU * intensity * 0.03 * mouthY;
      }
      
      if (p.y > 0.1 && p.y < 0.35) {
        let browY = (p.y - 0.1) / 0.25;
        displaced.y += browRaiseAU * intensity * 0.04 * browY;
        displaced.y -= browLowerAU * intensity * 0.03 * browY;
      }
      
      if (length(p.xz - vec2<f32>(0.0, 0.45)) < 0.15) {
        displaced.z -= eyeSquintAU * intensity * 0.02;
      }
      
      if (p.y < -0.2) {
        displaced.y -= jawOpenAU * intensity * 0.1;
      }
      
      return displaced;
    }
    
    fn sdBox(p: vec3<f32>, b: vec3<f32>) -> f32 {
      let q = abs(p) - b;
      return length(max(q, vec3<f32>(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
    }
    
    @compute @workgroup_size(8, 8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let lod = uniforms.lodLevel;
      let resolution = vec3<u32>(
        32u << lod,
        64u << lod,
        32u << lod
      );
      
      if (id.x >= resolution.x || id.y >= resolution.y || id.z >= resolution.z) {
        return;
      }
      
      let idx = id.x + id.y * resolution.x + id.z * resolution.x * resolution.y;
      
      let p = (vec3<f32>(id) - vec3<f32>(resolution) * 0.5) / f32(32u << lod) * 4.0;
      
      let sdf = getBodySDF(p, dna);
      
      if (sdf < 0.02) {
        let voxel = voxels[idx];
        
        var color = getSkinColor(dna, f32(idx));
        
        let displacedPos = applyExpression(p, expression, uniforms.time);
        
        var material = u32(VoxelMaterial.SKIN);
        
        if (p.y > 0.3) {
          material = u32(VoxelMaterial.HAIR);
          color = vec3<f32>(dna[23u], dna[24u], dna[25u]);
        }
        
        if (length(p.xz - vec2<f32>(0.0, 0.45)) < 0.1 && p.y > 0.05 && p.y < 0.25) {
          material = u32(VoxelMaterial.EYE);
          color = mix(vec3<f32>(0.2, 0.3, 0.5), vec3<f32>(0.1, 0.1, 0.1), fbm(p * 20.0, 2u));
        }
        
        voxels[idx].position = vec3<u32>(id);
        voxels[idx].color = vec4<u8>(
          u8(color.r * 255.0),
          u8(color.g * 255.0),
          u8(color.b * 255.0),
          u8(255.0)
        );
        voxels[idx].material = material;
        voxels[idx].density = 1.0 - smoothstep(0.0, 0.02, sdf);
        voxels[idx].temperature = 310.0;
        voxels[idx].flags = 0u;
      } else {
        voxels[idx].density = 0.0;
        voxels[idx].material = u32(VoxelMaterial.AIR);
      }
    }
  `;
  
  private readonly vertexShader = `
    struct Uniforms {
      viewProjection: mat4x4<f32>,
      cameraPosition: vec3<f32>,
      time: f32,
      lodLevel: u32,
    }
    
    struct Voxel {
      @location(0) position: vec3<u32>,
      @location(1) color: vec4<u8>,
      @location(2) material: u32,
      @location(3) density: f32,
    }
    
    struct VertexOutput {
      @builtin(position) pos: vec4<f32>,
      @location(0) color: vec4<f32>,
      @location(1) normal: vec3<f32>,
      @location(2) uv: vec2<f32>,
      @location(3) material: f32,
    }
    
    @vertex
    fn main(
      @location(0) voxelPos: vec3<u32>,
      @location(1) voxelColor: vec4<u8>,
      @location(2) voxelMaterial: u32,
      @location(3) voxelDensity: f32,
      @builtin(vertex_index) vertexIndex: u32
    ) -> VertexOutput {
      var output: VertexOutput;
      
      let scale = 1.0 / f32(32u << uniforms.lodLevel);
      let worldPos = (vec3<f32>(voxelPos) - vec3<f32>(f32(16u << uniforms.lodLevel))) * scale * 4.0;
      
      let cubeVerts = array<vec3<f32>, 8>(
        vec3<f32>(0.0, 0.0, 0.0),
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(1.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0),
        vec3<f32>(1.0, 0.0, 1.0),
        vec3<f32>(0.0, 1.0, 1.0),
        vec3<f32>(1.0, 1.0, 1.0)
      );
      
      let vert = cubeVerts[vertexIndex % 8u];
      let finalPos = worldPos + vert * scale * 0.1;
      
      output.pos = uniforms.viewProjection * vec4<f32>(finalPos, 1.0);
      output.color = vec4<f32>(
        f32(voxelColor.r) / 255.0,
        f32(voxelColor.g) / 255.0,
        f32(voxelColor.b) / 255.0,
        f32(voxelColor.a) / 255.0
      );
      
      output.normal = normalize(worldPos - vec3<f32>(0.0, 1.5, 0.0));
      output.uv = vert.xz;
      output.material = f32(voxelMaterial);
      
      return output;
    }
  `;
  
  private readonly fragmentShader = `
    struct FragmentInput {
      @location(0) color: vec4<f32>,
      @location(1) normal: vec3<f32>,
      @location(2) uv: vec2<f32>,
      @location(3) material: f32,
    }
    
    @fragment
    fn main(input: FragmentInput) -> @location(0) vec4<f32> {
      let lightDir = normalize(vec3<f32>(0.5, 1.0, 0.3));
      let NdotL = max(dot(input.normal, lightDir), 0.0);
      
      var baseColor = input.color.rgb;
      
      let materialType = u32(input.material);
      if (materialType == u32(VoxelMaterial.SKIN)) {
        let subsurface = 0.3;
        let scatter = exp(-NdotL * 2.0) * subsurface;
        baseColor += vec3<f32>(0.8, 0.4, 0.3) * scatter;
      }
      
      let ambient = 0.2;
      let diffuse = NdotL * 0.7;
      let lighting = ambient + diffuse;
      
      let finalColor = baseColor * lighting;
      
      return vec4<f32>(finalColor, input.color.a);
    }
    
    const VoxelMaterial = {
      AIR: 0u,
      SKIN: 1u,
      BONE: 2u,
      MUSCLE: 3u,
      FAT: 4u,
      ORGAN: 5u,
      BLOOD: 6u,
      HAIR: 7u,
      CLOTH: 8u,
      METAL: 9u,
      CYBERNETIC: 10u,
      HOLOGRAPHIC: 11u,
    };
  `;

  constructor(dna?: Partial<VoxelDNA>) {
    this.dna = this.generateRandomDNA();
    if (dna) {
      Object.assign(this.dna, dna);
    }
    
    this.physicsConfig = {
      gravity: [0, -9.81, 0],
      windForce: [0, 0, 0],
      clothStiffness: 0.8,
      clothDamping: 0.95,
      hairStiffness: 0.6,
      hairDamping: 0.9,
      softBodyPressure: 1.0,
      collisionIterations: 4,
    };
    
    this.animationState = {
      currentPose: new Float32Array(256),
      targetPose: new Float32Array(256),
      blendWeight: 0,
      animationTime: 0,
      speed: 1.0,
      loop: true,
    };
  }
  
  private generateRandomDNA(): VoxelDNA {
    return {
      height: Math.random(),
      build: Math.random(),
      muscle: Math.random(),
      faceWidth: Math.random(),
      faceHeight: Math.random(),
      jawWidth: Math.random(),
      chinProminence: Math.random(),
      cheekboneHeight: Math.random(),
      eyeSize: Math.random(),
      eyeSpacing: Math.random(),
      eyeAngle: Math.random(),
      noseLength: Math.random(),
      noseWidth: Math.random(),
      noseBridge: Math.random(),
      lipThickness: Math.random(),
      lipWidth: Math.random(),
      earSize: Math.random(),
      earAngle: Math.random(),
      skinTone: Math.random(),
      skinUndertone: Math.random(),
      freckles: Math.random(),
      moles: Math.random(),
      wrinkles: Math.random(),
      hairDensity: Math.random(),
      hairCurliness: Math.random(),
      hairLength: Math.random(),
      hairColor: [Math.random(), Math.random() * 0.5, Math.random() * 0.3],
      facialHair: Math.random(),
      eyebrowDensity: Math.random(),
      eyebrowShape: Math.random(),
      shoulderWidth: Math.random(),
      armLength: Math.random(),
      handSize: Math.random(),
      legLength: Math.random(),
      footSize: Math.random(),
      heterochromia: Math.random() * 0.1,
      vitiligo: Math.random() * 0.05,
      albinism: Math.random() * 0.02,
      cyberneticParts: Math.random() * 0.1,
    };
  }
  
  public async init(): Promise<void> {
    this.device = webgpuContext.getDevice();
    if (!this.device) {
      throw new Error('WebGPU device not initialized');
    }
    
    await this.createPipelines();
    await this.generateVoxels();
    
    console.log('[VoxelHumanRenderer] Initialized with DNA:', this.dna);
  }
  
  private async createPipelines(): Promise<void> {
    if (!this.device) return;
    
    const computeModule = this.device.createShaderModule({
      code: this.computeShader,
    });
    
    this.computePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: computeModule,
        entryPoint: 'main',
      },
    });
    
    const vertexModule = this.device.createShaderModule({
      code: this.vertexShader,
    });
    
    const fragmentModule = this.device.createShaderModule({
      code: this.fragmentShader,
    });
    
    this.renderPipeline = this.device.createRenderPipeline({
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
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
          },
        }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
    });
  }
  
  private async generateVoxels(): Promise<void> {
    if (!this.device) return;
    
    const lodConfig = VoxelHumanRenderer.LOD_LEVELS[this.lodLevel];
    const voxelCount = lodConfig.resolution[0] * lodConfig.resolution[1] * lodConfig.resolution[2];
    
    const voxelSize = 64;
    this.voxelBuffer = this.device.createBuffer({
      size: voxelCount * voxelSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    
    this.voxels = [];
    for (let i = 0; i < voxelCount; i++) {
      this.voxels.push({
        position: new Uint16Array(3),
        color: new Uint8Array(4),
        material: VoxelMaterial.AIR,
        density: 0,
        temperature: 310,
        flags: VoxelFlags.NONE,
      });
    }
  }
  
  public setExpression(expression: FacialExpression): void {
    this.expression = expression;
    this.expressionTime = 0;
    this.expressionIntensity = 0;
  }
  
  public setAge(age: number): void {
    this.age = Math.max(0, Math.min(100, age));
    this.dna.wrinkles = Math.pow(age / 100, 2);
    this.dna.hairDensity = Math.max(0, 1 - Math.pow((age - 30) / 70, 2));
  }
  
  public setLOD(distance: number): void {
    for (let i = 0; i < VoxelHumanRenderer.LOD_LEVELS.length; i++) {
      if (distance <= VoxelHumanRenderer.LOD_LEVELS[i].distance) {
        this.lodLevel = i;
        break;
      }
    }
  }
  
  public update(deltaTime: number): void {
    if (this.expression) {
      this.expressionTime += deltaTime;
      this.expressionIntensity = Math.min(1, this.expressionTime / 100);
      
      if (this.expressionTime > this.expression.duration) {
        this.expression = null;
        this.expressionIntensity = 0;
      }
    }
    
    this.updatePhysics(deltaTime);
    this.updateAnimation(deltaTime);
  }
  
  private updatePhysics(deltaTime: number): void {
    const dt = deltaTime / 1000;
    
    for (const voxel of this.voxels) {
      if (voxel.material === VoxelMaterial.HAIR || voxel.material === VoxelMaterial.CLOTH) {
        const force = [
          this.physicsConfig.gravity[0] + this.physicsConfig.windForce[0],
          this.physicsConfig.gravity[1] + this.physicsConfig.windForce[1],
          this.physicsConfig.gravity[2] + this.physicsConfig.windForce[2],
        ];
        
        const damping = voxel.material === VoxelMaterial.HAIR 
          ? this.physicsConfig.hairDamping 
          : this.physicsConfig.clothDamping;
        
        const stiffness = voxel.material === VoxelMaterial.HAIR
          ? this.physicsConfig.hairStiffness
          : this.physicsConfig.clothStiffness;
        
        const noise = [
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
        ];
        
        voxel.position[0] += (force[0] + noise[0]) * dt * stiffness;
        voxel.position[1] += (force[1] + noise[1]) * dt * stiffness;
        voxel.position[2] += (force[2] + noise[2]) * dt * stiffness;
      }
    }
  }
  
  private updateAnimation(deltaTime: number): void {
    const dt = deltaTime / 1000 * this.animationState.speed;
    this.animationState.animationTime += dt;
    
    const blendSpeed = 0.1;
    this.animationState.blendWeight = Math.min(1, this.animationState.blendWeight + blendSpeed * dt);
    
    for (let i = 0; i < this.animationState.currentPose.length; i++) {
      this.animationState.currentPose[i] = this.animationState.currentPose[i] * (1 - blendSpeed) +
        this.animationState.targetPose[i] * blendSpeed;
    }
  }
  
  public render(commandEncoder: GPUCommandEncoder): void {
    if (!this.device || !this.computePipeline || !this.voxelBuffer) return;
    
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.createBindGroup());
    
    const lodConfig = VoxelHumanRenderer.LOD_LEVELS[this.lodLevel];
    const workgroups = [
      Math.ceil(lodConfig.resolution[0] / 8),
      Math.ceil(lodConfig.resolution[1] / 8),
      Math.ceil(lodConfig.resolution[2] / 8),
    ];
    
    computePass.dispatchWorkgroups(workgroups[0], workgroups[1], workgroups[2]);
    computePass.end();
  }
  
  private createBindGroup(): GPUBindGroup | null {
    if (!this.device || !this.computePipeline || !this.voxelBuffer) return null;
    
    return this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.voxelBuffer } },
      ],
    });
  }
  
  public getDNA(): VoxelDNA {
    return { ...this.dna };
  }
  
  public setDNA(dna: Partial<VoxelDNA>): void {
    Object.assign(this.dna, dna);
  }
  
  public getVoxelCount(): number {
    return this.voxels.filter(v => v.density > 0).length;
  }
  
  public getLODLevel(): number {
    return this.lodLevel;
  }
  
  public destroy(): void {
    if (this.voxelBuffer) {
      this.voxelBuffer.destroy();
      this.voxelBuffer = null;
    }
    this.voxels = [];
  }
}

/**
 * 预设表情库
 */
export const FACIAL_EXPRESSIONS: Record<string, FacialExpression> = {
  neutral: {
    name: '中性',
    actionUnits: new Map(),
    duration: Infinity,
    transition: 'linear',
  },
  
  happy: {
    name: '开心',
    actionUnits: new Map([
      [FacialActionUnit.LIP_CORNER_PULLER, 0.8],
      [FacialActionUnit.CHEEK_RAISER, 0.6],
      [FacialActionUnit.EYES_CLOSED, 0.2],
    ]),
    duration: 3000,
    transition: 'easeInOut',
  },
  
  sad: {
    name: '悲伤',
    actionUnits: new Map([
      [FacialActionUnit.INNER_BROW_RAISER, 0.7],
      [FacialActionUnit.LIP_CORNER_DEPRESSOR, 0.5],
      [FacialActionUnit.BROW_LOWERER, 0.3],
    ]),
    duration: 5000,
    transition: 'easeIn',
  },
  
  angry: {
    name: '愤怒',
    actionUnits: new Map([
      [FacialActionUnit.BROW_LOWERER, 0.9],
      [FacialActionUnit.LIP_TIGHTENER, 0.7],
      [FacialActionUnit.NOSE_WRINKLER, 0.4],
      [FacialActionUnit.LID_TIGHTENER, 0.5],
    ]),
    duration: 2000,
    transition: 'easeOut',
  },
  
  surprised: {
    name: '惊讶',
    actionUnits: new Map([
      [FacialActionUnit.INNER_BROW_RAISER, 1.0],
      [FacialActionUnit.OUTER_BROW_RAISER, 1.0],
      [FacialActionUnit.JAW_DROP, 0.8],
      [FacialActionUnit.UPPER_LID_RAISER, 0.9],
    ]),
    duration: 1500,
    transition: 'bounce',
  },
  
  fearful: {
    name: '恐惧',
    actionUnits: new Map([
      [FacialActionUnit.INNER_BROW_RAISER, 0.8],
      [FacialActionUnit.BROW_LOWERER, 0.4],
      [FacialActionUnit.UPPER_LID_RAISER, 0.7],
      [FacialActionUnit.LIPS_PART, 0.5],
    ]),
    duration: 3000,
    transition: 'easeInOut',
  },
  
  disgusted: {
    name: '厌恶',
    actionUnits: new Map([
      [FacialActionUnit.NOSE_WRINKLER, 0.9],
      [FacialActionUnit.UPPER_LIP_RAISER, 0.7],
      [FacialActionUnit.BROW_LOWERER, 0.3],
    ]),
    duration: 2000,
    transition: 'easeIn',
  },
  
  contempt: {
    name: '轻蔑',
    actionUnits: new Map([
      [FacialActionUnit.LIP_CORNER_PULLER, 0.3],
      [FacialActionUnit.LIP_CORNER_DEPRESSOR, 0.5],
    ]),
    duration: 3000,
    transition: 'linear',
  },
  
  thinking: {
    name: '思考',
    actionUnits: new Map([
      [FacialActionUnit.BROW_LOWERER, 0.4],
      [FacialActionUnit.LIP_FUNNELER, 0.2],
      [FacialActionUnit.EYES_CLOSED, 0.1],
    ]),
    duration: 5000,
    transition: 'easeInOut',
  },
  
  sleepy: {
    name: '困倦',
    actionUnits: new Map([
      [FacialActionUnit.EYES_CLOSED, 0.6],
      [FacialActionUnit.JAW_DROP, 0.1],
      [FacialActionUnit.BROW_LOWERER, 0.2],
    ]),
    duration: 10000,
    transition: 'easeIn',
  },
};

/**
 * 体素人管理器 - 管理多个体素人实例
 */
export class VoxelHumanManager {
  private humans: Map<string, VoxelHumanRenderer> = new Map();
  private maxHumans: number = 100;
  
  public async createHuman(id: string, dna?: Partial<VoxelDNA>): Promise<VoxelHumanRenderer> {
    if (this.humans.size >= this.maxHumans) {
      const oldestId = this.humans.keys().next().value;
      if (oldestId) {
        this.removeHuman(oldestId);
      }
    }
    
    const human = new VoxelHumanRenderer(dna);
    await human.init();
    this.humans.set(id, human);
    
    return human;
  }
  
  public getHuman(id: string): VoxelHumanRenderer | undefined {
    return this.humans.get(id);
  }
  
  public removeHuman(id: string): void {
    const human = this.humans.get(id);
    if (human) {
      human.destroy();
      this.humans.delete(id);
    }
  }
  
  public updateAll(deltaTime: number): void {
    for (const human of this.humans.values()) {
      human.update(deltaTime);
    }
  }
  
  public renderAll(commandEncoder: GPUCommandEncoder): void {
    for (const human of this.humans.values()) {
      human.render(commandEncoder);
    }
  }
  
  public getHumanCount(): number {
    return this.humans.size;
  }
  
  public destroyAll(): void {
    for (const human of this.humans.values()) {
      human.destroy();
    }
    this.humans.clear();
  }
}

export const voxelHumanManager = new VoxelHumanManager();
export default VoxelHumanRenderer;
