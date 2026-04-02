/**
 * =============================================================================
 * 永夜熵纪 - 增强版程序化面孔系统
 * Enhanced Procedural Face Generation System
 * 基于基因组的面孔生成，具有高辨识度特征
 * =============================================================================
 */

import { Genome, GeneType } from '@/citizen/GenomeSystem';
import { logger } from '@/core/utils/Logger';

/** 肤色类型 */
export type SkinToneType = 
  | 'pale' | 'fair' | 'light' | 'medium' | 'tan' | 'brown' | 'dark';

/** 发型类型 */
export type HairStyleType = 
  | 'bald' | 'short' | 'medium' | 'long' | 'curly' | 'wavy' | 'ponytail' 
  | 'braid' | 'mohawk' | 'afro' | 'bun' | 'spiky';

/** 发色类型 */
export type HairColorType = 
  | 'black' | 'brown' | 'darkBrown' | 'auburn' | 'red' | 'blonde' 
  | 'platinum' | 'gray' | 'white' | 'blue' | 'purple' | 'green';

/** 眼睛颜色 */
export type EyeColorType = 
  | 'brown' | 'darkBrown' | 'hazel' | 'amber' | 'green' | 'blue' 
  | 'gray' | 'violet' | 'heterochromia';

/** 眉毛形状 */
export type EyebrowShapeType = 
  | 'straight' | 'arched' | 'angled' | 'curved' | 'thick' | 'thin';

/** 耳朵形状 */
export type EarShapeType = 
  | 'normal' | 'small' | 'large' | 'pointed' | 'rounded';

/** 面孔特征 - 扩展版 */
export interface FaceFeatures {
  faceId: string;
  seed: number;
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong';
  faceWidth: number;
  faceHeight: number;
  foreheadHeight: number;
  cheekboneWidth: number;
  jawlineWidth: number;
  skinTone: SkinToneType;
  skinUndertone: 'warm' | 'cool' | 'neutral';
  skinTexture: number;
  age: number;
  ageSigns: AgeSigns;
  genderFeature: number;
  eyeSize: number;
  eyeSpacing: number;
  eyeShape: 'round' | 'almond' | 'hooded' | 'upturned' | 'downturned' | 'wide';
  eyeColor: EyeColorType;
  eyeSlant: number;
  eyelidType: 'single' | 'double' | 'hooded';
  eyebrowShape: EyebrowShapeType;
  eyebrowThickness: number;
  eyebrowAngle: number;
  eyebrowSpacing: number;
  noseSize: number;
  noseWidth: number;
  noseShape: 'small' | 'medium' | 'large' | 'wide' | 'narrow' | 'button' | 'aquiline' | 'flat';
  noseBridge: 'low' | 'medium' | 'high';
  nostrilVisibility: number;
  mouthSize: number;
  mouthWidth: number;
  lipThickness: 'thin' | 'medium' | 'full' | 'plump';
  lipShape: 'flat' | 'heart' | 'bow' | 'round';
  cupidBow: number;
  chinShape: 'pointed' | 'rounded' | 'square' | 'cleft' | 'dimpled';
  chinSize: number;
  chinProjection: number;
  jawline: 'soft' | 'angular' | 'square' | 'round';
  earShape: EarShapeType;
  earSize: number;
  earAngle: number;
  hairStyle: HairStyleType;
  hairColor: HairColorType;
  hairDensity: number;
  hairline: 'low' | 'medium' | 'high' | 'widowsPeak' | 'receding';
  facialHair: FacialHair;
  uniqueMarks: UniqueMark[];
  distinguishingFeatures: DistinguishingFeature[];
  geneticHash: string;
}

/** 年龄痕迹 */
export interface AgeSigns {
  wrinkles: number;
  crowFeet: number;
  foreheadLines: number;
  nasolabialFolds: number;
  ageSpots: number;
  sagging: number;
}

/** 面部毛发 */
export interface FacialHair {
  hasFacialHair: boolean;
  style: 'none' | 'stubble' | 'mustache' | 'goatee' | 'beard' | 'fullBeard' | 'soulPatch';
  density: number;
  color: HairColorType;
}

/** 独特标记 */
export interface UniqueMark {
  type: 'scar' | 'mole' | 'freckle' | 'birthmark' | 'beautyMark' | 'dimple' | 'wrinkle';
  position: { x: number; y: number };
  size: number;
  intensity: number;
  shape: 'circle' | 'oval' | 'irregular' | 'line';
}

/** 辨识特征 */
export interface DistinguishingFeature {
  type: 'heterochromia' | 'vitiligo' | 'freckles' | 'dimples' | 'cleftChin' | 
        'scar' | 'tattoo' | 'piercing' | 'birthmark' | 'asymmetry';
  location: string;
  prominence: number;
}

/** 面孔实例数据 */
export interface FaceInstance {
  id: string;
  features: FaceFeatures;
  modelMatrix: Float32Array;
  expression: ExpressionParams;
  blendShapeWeights: Float32Array;
  canvasDataUrl?: string;
}

/** 表情参数 */
export interface ExpressionParams {
  browRaise: number;
  eyeBlink: number;
  mouthOpen: number;
  smile: number;
  frown: number;
  surprise: number;
  leftEyeBlink?: number;
  rightEyeBlink?: number;
  leftBrowRaise?: number;
  rightBrowRaise?: number;
  leftSmile?: number;
  rightSmile?: number;
}

/** SDF材质 */
export interface SDFMaterial {
  baseColor: [number, number, number, number];
  roughness: number;
  metalness: number;
  emissive?: [number, number, number];
  normalStrength: number;
}

/** 缓存条目 */
interface CacheEntry {
  features: FaceFeatures;
  canvasDataUrl: string;
  timestamp: number;
  accessCount: number;
}

/** 肤色RGB映射 */
const SKIN_TONE_COLORS: Record<SkinToneType, [number, number, number]> = {
  pale: [255, 228, 216],
  fair: [250, 218, 195],
  light: [240, 200, 170],
  medium: [220, 175, 140],
  tan: [200, 150, 110],
  brown: [160, 110, 70],
  dark: [100, 70, 45],
};

/** 发色RGB映射 */
const HAIR_COLOR_MAP: Record<HairColorType, [number, number, number]> = {
  black: [20, 20, 20],
  brown: [90, 60, 40],
  darkBrown: [60, 40, 25],
  auburn: [140, 60, 40],
  red: [180, 70, 40],
  blonde: [230, 195, 130],
  platinum: [240, 230, 210],
  gray: [160, 160, 160],
  white: [250, 250, 250],
  blue: [60, 100, 180],
  purple: [120, 60, 140],
  green: [60, 130, 80],
};

/** 眼睛颜色RGB映射 */
const EYE_COLOR_MAP: Record<EyeColorType, [number, number, number]> = {
  brown: [100, 70, 40],
  darkBrown: [60, 40, 25],
  hazel: [160, 130, 70],
  amber: [190, 140, 50],
  green: [80, 140, 90],
  blue: [70, 130, 180],
  gray: [140, 150, 160],
  violet: [140, 100, 170],
  heterochromia: [100, 140, 180],
};

/** 特征组合规则 - 确保辨识度 */
interface FeatureCombinationRule {
  features: string[];
  compatible: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'veryRare';
}

const FEATURE_COMBINATION_RULES: FeatureCombinationRule[] = [
  { features: ['heterochromia', 'albino'], compatible: false, rarity: 'veryRare' },
  { features: ['cleftChin', 'dimpled'], compatible: true, rarity: 'uncommon' },
  { features: ['widowsPeak', 'receding'], compatible: false, rarity: 'common' },
  { features: ['pointed_ear', 'hooded_eye'], compatible: true, rarity: 'rare' },
];

/** 增强版程序化面孔生成器 */
export class ProceduralFaceGenerator {
  private device: GPUDevice | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;
  private pipeline: GPUComputePipeline | null = null;
  private shaderModule: GPUShaderModule | null = null;
  
  private faceCache: Map<string, CacheEntry> = new Map();
  private maxCacheSize: number = 1000;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  
  private canvasPool: HTMLCanvasElement[] = [];
  private maxPoolSize: number = 10;

  public async init(device: GPUDevice): Promise<void> {
    this.device = device;
    await this.createShaderModule();
    await this.createPipeline();
  }

  private async createShaderModule(): Promise<void> {
    if (!this.device) return;
    const shaderCode = this.buildShaderCode();
    this.shaderModule = this.device.createShaderModule({ code: shaderCode });
  }

  private buildShaderCode(): string {
    return `
      struct FaceFeatures {
        eyeSize: f32, eyeSpacing: f32, eyeShape: u32,
        noseSize: f32, noseShape: u32, mouthSize: f32,
        mouthShape: u32, chinShape: u32, faceShape: u32,
        age: f32, genderFeature: f32,
      };
      struct ExpressionParams {
        browRaise: f32, eyeBlink: f32, mouthOpen: f32,
        smile: f32, frown: f32, surprise: f32,
      };
      @group(0) @binding(0) var<storage, read> features: FaceFeatures;
      @group(0) @binding(1) var<storage, read> expression: ExpressionParams;
      @group(0) @binding(2) var<storage, read_write> output: array<f32>;
      
      fn sdSphere(p: vec3<f32>, r: f32) -> f32 { return length(p) - r; }
      fn sdEllipsoid(p: vec3<f32>, r: vec3<f32>) -> f32 {
        let k0 = length(p / r);
        let k1 = length(p / (r * r));
        return k0 * (k0 - 1.0) / k1;
      }
      fn sdCapsule(p: vec3<f32>, a: vec3<f32>, b: vec3<f32>, r: f32) -> f32 {
        let pa = p - a; let ba = b - a;
        let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h) - r;
      }
      fn sdTorus(p: vec3<f32>, t: vec2<f32>) -> f32 {
        let q = vec2<f32>(length(p.xz) - t.x, p.y);
        return length(q) - t.y;
      }
      fn opSmoothUnion(d1: f32, d2: f32, k: f32) -> f32 {
        let h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
        return mix(d2, d1, h) - k * h * (1.0 - h);
      }
      fn opSmoothSubtraction(d1: f32, d2: f32, k: f32) -> f32 {
        let h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
        return mix(d2, -d1, h) + k * h * (1.0 - h);
      }
      
      fn getFaceSDF(p: vec3<f32>) -> f32 {
        var d = 1000.0;
        let faceScale = vec3<f32>(1.0 + features.genderFeature * 0.1, 1.0 - features.genderFeature * 0.05, 1.0);
        let face = sdEllipsoid(p, vec3<f32>(0.4, 0.5, 0.3) * faceScale);
        d = face;
        let eyeY = 0.1; let eyeZ = 0.25;
        let eyeOffset = features.eyeSpacing * 0.15;
        let eyeSize = features.eyeSize * 0.06;
        let blinkScale = 1.0 - expression.eyeBlink * 0.9;
        let leftEye = sdEllipsoid(p - vec3<f32>(-eyeOffset, eyeY, eyeZ), vec3<f32>(eyeSize, eyeSize * 0.6 * blinkScale, eyeSize * 0.5));
        let rightEye = sdEllipsoid(p - vec3<f32>(eyeOffset, eyeY, eyeZ), vec3<f32>(eyeSize, eyeSize * 0.6 * blinkScale, eyeSize * 0.5));
        d = opSmoothSubtraction(leftEye, d, 0.02);
        d = opSmoothSubtraction(rightEye, d, 0.02);
        let noseY = -0.05; let noseZ = 0.35;
        let noseSize = features.noseSize * 0.08;
        let nose = sdCapsule(p - vec3<f32>(0.0, noseY, noseZ), vec3<f32>(0.0, -noseSize, 0.0), vec3<f32>(0.0, noseSize, noseSize), noseSize * 0.3);
        d = opSmoothUnion(d, nose, 0.05);
        let noseTip = sdSphere(p - vec3<f32>(0.0, noseY - 0.02, noseZ + 0.02), noseSize * 0.4);
        d = opSmoothUnion(d, noseTip, 0.03);
        let mouthY = -0.2; let mouthZ = 0.3;
        let mouthWidth = features.mouthSize * 0.15;
        let mouthOpen = expression.mouthOpen * 0.05;
        let mouth = sdTorus(p - vec3<f32>(0.0, mouthY, mouthZ), vec2<f32>(mouthWidth, 0.02 + mouthOpen));
        d = opSmoothSubtraction(mouth, d, 0.02);
        if (expression.smile > 0.0) { d += (p.x * p.x) * expression.smile * 2.0; }
        let browY = 0.22; let browZ = 0.28;
        let browRaise = expression.browRaise * 0.03;
        let leftBrow = sdCapsule(p - vec3<f32>(-eyeOffset, browY + browRaise, browZ), vec3<f32>(-eyeSize, 0, 0), vec3<f32>(eyeSize, browRaise * 2.0, 0), 0.015);
        let rightBrow = sdCapsule(p - vec3<f32>(eyeOffset, browY + browRaise, browZ), vec3<f32>(-eyeSize, browRaise * 2.0, 0), vec3<f32>(eyeSize, 0, 0), 0.015);
        d = opSmoothUnion(d, leftBrow, 0.01);
        d = opSmoothUnion(d, rightBrow, 0.01);
        let chinY = -0.35; let chinZ = 0.15;
        let chinSize = 0.1 + features.age * 0.002;
        var chin = sdSphere(p - vec3<f32>(0.0, chinY, chinZ), chinSize);
        if (features.chinShape == 1u) { chin = sdSphere(p - vec3<f32>(0.0, chinY, chinZ), chinSize * 0.8); }
        d = opSmoothUnion(d, chin, 0.05);
        let earY = 0.0; let earZ = 0.2;
        let earSize = 0.08 + features.genderFeature * 0.02;
        let leftEar = sdSphere(p - vec3<f32>(-0.4, earY, earZ), earSize);
        let rightEar = sdSphere(p - vec3<f32>(0.4, earY, earZ), earSize);
        d = opSmoothUnion(d, leftEar, 0.05);
        d = opSmoothUnion(d, rightEar, 0.05);
        return d;
      }
      
      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let idx = global_id.x;
        if (idx >= 1024u) { return; }
        let gridSize = 32.0;
        let x = f32(idx % u32(gridSize)) / gridSize - 0.5;
        let y = f32((idx / u32(gridSize)) % u32(gridSize)) / gridSize - 0.5;
        let z = f32(idx / u32(gridSize * gridSize)) / gridSize - 0.5;
        let p = vec3<f32>(x * 2.0, y * 2.0, z * 2.0);
        output[idx] = getFaceSDF(p);
      }
    `;
  }

  private async createPipeline(): Promise<void> {
    if (!this.device || !this.shaderModule) return;
    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      ],
    });
    this.pipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.bindGroupLayout] }),
      compute: { module: this.shaderModule, entryPoint: 'main' },
    });
  }

  public generateFace(features: FaceFeatures, expression: ExpressionParams): FaceInstance {
    const id = features.faceId || crypto.randomUUID();
    const modelMatrix = new Float32Array(16);
    modelMatrix.fill(0);
    modelMatrix[0] = 1; modelMatrix[5] = 1; modelMatrix[10] = 1; modelMatrix[15] = 1;
    const blendShapeWeights = new Float32Array(20);
    blendShapeWeights[0] = expression.smile;
    blendShapeWeights[1] = expression.eyeBlink;
    blendShapeWeights[2] = expression.browRaise;
    blendShapeWeights[3] = expression.frown;
    return { id, features, modelMatrix, expression, blendShapeWeights };
  }

  public generateRandomFace(): FaceFeatures {
    const seed = Math.random() * 2147483647;
    const rng = this.createSeededRandom(seed);
    const genderFeature = rng() * 2 - 1;
    const age = Math.floor(rng() * 60) + 18;
    const faceShapes: FaceFeatures['faceShape'][] = ['oval', 'round', 'square', 'heart', 'diamond', 'oblong'];
    const eyeShapes: FaceFeatures['eyeShape'][] = ['round', 'almond', 'hooded', 'upturned', 'downturned', 'wide'];
    const noseShapes: FaceFeatures['noseShape'][] = ['small', 'medium', 'large', 'wide', 'narrow', 'button', 'aquiline', 'flat'];
    const lipThicknesses: FaceFeatures['lipThickness'][] = ['thin', 'medium', 'full', 'plump'];
    const chinShapes: FaceFeatures['chinShape'][] = ['pointed', 'rounded', 'square', 'cleft', 'dimpled'];
    const hairStyles: HairStyleType[] = ['bald', 'short', 'medium', 'long', 'curly', 'wavy', 'ponytail', 'braid', 'mohawk', 'afro', 'bun', 'spiky'];
    const skinTones: SkinToneType[] = ['pale', 'fair', 'light', 'medium', 'tan', 'brown', 'dark'];
    const hairColors: HairColorType[] = ['black', 'brown', 'darkBrown', 'auburn', 'red', 'blonde', 'platinum', 'gray', 'white'];
    const eyeColors: EyeColorType[] = ['brown', 'darkBrown', 'hazel', 'amber', 'green', 'blue', 'gray'];
    const earShapes: EarShapeType[] = ['normal', 'small', 'large', 'pointed', 'rounded'];
    const eyebrowShapes: EyebrowShapeType[] = ['straight', 'arched', 'angled', 'curved', 'thick', 'thin'];
    return {
      faceId: crypto.randomUUID(),
      seed,
      faceShape: faceShapes[Math.floor(rng() * faceShapes.length)],
      faceWidth: 0.8 + rng() * 0.4,
      faceHeight: 1.0 + rng() * 0.3,
      foreheadHeight: 0.8 + rng() * 0.4,
      cheekboneWidth: 0.7 + rng() * 0.6,
      jawlineWidth: 0.6 + rng() * 0.8,
      skinTone: skinTones[Math.floor(rng() * skinTones.length)],
      skinUndertone: ['warm', 'cool', 'neutral'][Math.floor(rng() * 3)] as 'warm' | 'cool' | 'neutral',
      skinTexture: rng(),
      age,
      ageSigns: {
        wrinkles: age > 40 ? (age - 40) / 60 : 0,
        crowFeet: age > 35 ? (age - 35) / 65 * rng() : 0,
        foreheadLines: age > 30 ? (age - 30) / 70 * rng() : 0,
        nasolabialFolds: age > 45 ? (age - 45) / 55 * rng() : 0,
        ageSpots: age > 50 ? (age - 50) / 50 * rng() : 0,
        sagging: age > 55 ? (age - 55) / 45 * rng() : 0,
      },
      genderFeature,
      eyeSize: 0.5 + rng() * 0.5,
      eyeSpacing: 0.6 + rng() * 0.4,
      eyeShape: eyeShapes[Math.floor(rng() * eyeShapes.length)],
      eyeColor: eyeColors[Math.floor(rng() * eyeColors.length)],
      eyeSlant: rng() * 0.4 - 0.2,
      eyelidType: ['single', 'double', 'hooded'][Math.floor(rng() * 3)] as 'single' | 'double' | 'hooded',
      eyebrowShape: eyebrowShapes[Math.floor(rng() * eyebrowShapes.length)],
      eyebrowThickness: 0.3 + rng() * 0.7,
      eyebrowAngle: rng() * 0.6 - 0.3,
      eyebrowSpacing: 0.8 + rng() * 0.4,
      noseSize: 0.5 + rng() * 0.5,
      noseWidth: 0.6 + rng() * 0.8,
      noseShape: noseShapes[Math.floor(rng() * noseShapes.length)],
      noseBridge: ['low', 'medium', 'high'][Math.floor(rng() * 3)] as 'low' | 'medium' | 'high',
      nostrilVisibility: rng() * 0.5,
      mouthSize: 0.5 + rng() * 0.5,
      mouthWidth: 0.6 + rng() * 0.8,
      lipThickness: lipThicknesses[Math.floor(rng() * lipThicknesses.length)],
      lipShape: ['flat', 'heart', 'bow', 'round'][Math.floor(rng() * 4)] as 'flat' | 'heart' | 'bow' | 'round',
      cupidBow: rng() * 0.6,
      chinShape: chinShapes[Math.floor(rng() * chinShapes.length)],
      chinSize: 0.7 + rng() * 0.6,
      chinProjection: rng() * 0.4,
      jawline: ['soft', 'angular', 'square', 'round'][Math.floor(rng() * 4)] as 'soft' | 'angular' | 'square' | 'round',
      earShape: earShapes[Math.floor(rng() * earShapes.length)],
      earSize: 0.8 + rng() * 0.4,
      earAngle: rng() * 20 - 10,
      hairStyle: hairStyles[Math.floor(rng() * hairStyles.length)],
      hairColor: hairColors[Math.floor(rng() * hairColors.length)],
      hairDensity: 0.5 + rng() * 0.5,
      hairline: ['low', 'medium', 'high', 'widowsPeak', 'receding'][Math.floor(rng() * 5)] as 'low' | 'medium' | 'high' | 'widowsPeak' | 'receding',
      facialHair: {
        hasFacialHair: genderFeature > 0.2 && rng() > 0.4,
        style: 'none',
        density: rng(),
        color: hairColors[Math.floor(rng() * hairColors.length)],
      },
      uniqueMarks: this.generateUniqueMarks(rng),
      distinguishingFeatures: this.generateDistinguishingFeatures(rng),
      geneticHash: this.generateGeneticHash(seed),
    };
  }

  public generateFaceFromGenome(genome: Genome): FaceFeatures {
    const genes = this.extractGeneValues(genome);
    const seed = this.calculateSeedFromGenes(genes);
    const rng = this.createSeededRandom(seed);
    const physicalGene = this.getGeneTypeValue(genome, GeneType.PHYSICAL);
    const genderFeature = (genes[0] / 255) * 2 - 1;
    const age = Math.floor(18 + (genes[1] / 255) * 62);
    const faceShapes: FaceFeatures['faceShape'][] = ['oval', 'round', 'square', 'heart', 'diamond', 'oblong'];
    const faceShapeIndex = Math.floor((genes[2] / 255) * faceShapes.length);
    const eyeShapes: FaceFeatures['eyeShape'][] = ['round', 'almond', 'hooded', 'upturned', 'downturned', 'wide'];
    const eyeShapeIndex = Math.floor((genes[3] / 255) * eyeShapes.length);
    const noseShapes: FaceFeatures['noseShape'][] = ['small', 'medium', 'large', 'wide', 'narrow', 'button', 'aquiline', 'flat'];
    const noseShapeIndex = Math.floor((genes[4] / 255) * noseShapes.length);
    const skinTones: SkinToneType[] = ['pale', 'fair', 'light', 'medium', 'tan', 'brown', 'dark'];
    const skinToneIndex = Math.min(Math.floor((genes[5] / 255) * skinTones.length), skinTones.length - 1);
    const hairColors: HairColorType[] = ['black', 'brown', 'darkBrown', 'auburn', 'red', 'blonde', 'platinum', 'gray', 'white'];
    const hairColorIndex = Math.floor((genes[6] / 255) * hairColors.length);
    const eyeColors: EyeColorType[] = ['brown', 'darkBrown', 'hazel', 'amber', 'green', 'blue', 'gray', 'violet'];
    const eyeColorIndex = Math.floor((genes[7] / 255) * eyeColors.length);
    const hairStyles: HairStyleType[] = ['bald', 'short', 'medium', 'long', 'curly', 'wavy', 'ponytail', 'braid', 'afro', 'bun'];
    const hairStyleIndex = Math.floor((genes[8] / 255) * hairStyles.length);
    const chinShapes: FaceFeatures['chinShape'][] = ['pointed', 'rounded', 'square', 'cleft', 'dimpled'];
    const chinShapeIndex = Math.floor((genes[9] / 255) * chinShapes.length);
    const lipThicknesses: FaceFeatures['lipThickness'][] = ['thin', 'medium', 'full', 'plump'];
    const lipThicknessIndex = Math.floor((genes[10] / 255) * lipThicknesses.length);
    const earShapes: EarShapeType[] = ['normal', 'small', 'large', 'pointed', 'rounded'];
    const earShapeIndex = Math.floor((genes[11] / 255) * earShapes.length);
    return {
      faceId: crypto.randomUUID(),
      seed,
      faceShape: faceShapes[faceShapeIndex],
      faceWidth: 0.7 + (genes[12] / 255) * 0.6,
      faceHeight: 0.9 + (genes[13] / 255) * 0.4,
      foreheadHeight: 0.7 + (genes[14] / 255) * 0.6,
      cheekboneWidth: 0.6 + (genes[15] / 255) * 0.8,
      jawlineWidth: 0.5 + (genes[16] / 255) * 0.8,
      skinTone: skinTones[skinToneIndex],
      skinUndertone: genes[17] > 170 ? 'warm' : genes[17] < 85 ? 'cool' : 'neutral',
      skinTexture: (genes[18] / 255),
      age,
      ageSigns: {
        wrinkles: age > 40 ? (age - 40) / 60 * (genes[19] / 255) : 0,
        crowFeet: age > 35 ? (age - 35) / 65 * (genes[20] / 255) : 0,
        foreheadLines: age > 30 ? (age - 30) / 70 * (genes[21] / 255) : 0,
        nasolabialFolds: age > 45 ? (age - 45) / 55 * (genes[22] / 255) : 0,
        ageSpots: age > 50 ? (age - 50) / 50 * (genes[23] / 255) : 0,
        sagging: age > 55 ? (age - 55) / 45 * (genes[24] / 255) : 0,
      },
      genderFeature,
      eyeSize: 0.4 + (genes[25] / 255) * 0.6,
      eyeSpacing: 0.5 + (genes[26] / 255) * 0.5,
      eyeShape: eyeShapes[eyeShapeIndex],
      eyeColor: eyeColors[eyeColorIndex],
      eyeSlant: (genes[27] / 255) * 0.4 - 0.2,
      eyelidType: genes[28] > 170 ? 'double' : genes[28] < 85 ? 'hooded' : 'single',
      eyebrowShape: ['straight', 'arched', 'angled', 'curved', 'thick', 'thin'][Math.floor((genes[29] / 255) * 6)] as EyebrowShapeType,
      eyebrowThickness: 0.2 + (genes[30] / 255) * 0.8,
      eyebrowAngle: (genes[31] / 255) * 0.6 - 0.3,
      eyebrowSpacing: 0.7 + (genes[32] / 255) * 0.6,
      noseSize: 0.4 + (genes[33] / 255) * 0.6,
      noseWidth: 0.5 + (genes[34] / 255) * 0.8,
      noseShape: noseShapes[noseShapeIndex],
      noseBridge: genes[35] > 170 ? 'high' : genes[35] < 85 ? 'low' : 'medium',
      nostrilVisibility: (genes[36] / 255) * 0.5,
      mouthSize: 0.4 + (genes[37] / 255) * 0.6,
      mouthWidth: 0.5 + (genes[38] / 255) * 0.8,
      lipThickness: lipThicknesses[lipThicknessIndex],
      lipShape: ['flat', 'heart', 'bow', 'round'][Math.floor((genes[39] / 255) * 4)] as 'flat' | 'heart' | 'bow' | 'round',
      cupidBow: (genes[40] / 255) * 0.6,
      chinShape: chinShapes[chinShapeIndex],
      chinSize: 0.6 + (genes[41] / 255) * 0.8,
      chinProjection: (genes[42] / 255) * 0.4,
      jawline: ['soft', 'angular', 'square', 'round'][Math.floor((genes[43] / 255) * 4)] as 'soft' | 'angular' | 'square' | 'round',
      earShape: earShapes[earShapeIndex],
      earSize: 0.7 + (genes[44] / 255) * 0.6,
      earAngle: (genes[45] / 255) * 20 - 10,
      hairStyle: hairStyles[hairStyleIndex],
      hairColor: hairColors[hairColorIndex],
      hairDensity: 0.4 + (genes[46] / 255) * 0.6,
      hairline: ['low', 'medium', 'high', 'widowsPeak', 'receding'][Math.floor((genes[47] / 255) * 5)] as 'low' | 'medium' | 'high' | 'widowsPeak' | 'receding',
      facialHair: {
        hasFacialHair: genderFeature > 0.2 && genes[48] > 128,
        style: genderFeature > 0.2 ? ['none', 'stubble', 'mustache', 'goatee', 'beard', 'fullBeard'][Math.floor((genes[49] / 255) * 6)] as FacialHair['style'] : 'none',
        density: (genes[50] / 255),
        color: hairColors[hairColorIndex],
      },
      uniqueMarks: this.generateUniqueMarksFromGenes(genes),
      distinguishingFeatures: this.generateDistinguishingFeaturesFromGenes(genes),
      geneticHash: this.generateGeneticHash(seed),
    };
  }

  private extractGeneValues(genome: Genome): number[] {
    if (genome.genes && typeof genome.genes === 'string') {
      try {
        return Array.from(Uint8Array.from(atob(genome.genes), c => c.charCodeAt(0)));
      } catch (error) {
        logger.warn('ProceduralFaceGenerator', 'Extract gene values failed', error);
        return Array(64).fill(128);
      }
    }
    if (Array.isArray(genome.genes)) {
      return (genome.genes as Array<{value?: number}>).map(g => Math.floor((g.value || 0.5) * 255));
    }
    return Array(64).fill(128);
  }

  private getGeneTypeValue(genome: Genome, type: GeneType): number {
    if (!Array.isArray(genome.genes) || genome.genes.length === 0) return 0.5;
    const genes = genome.genes as Array<{type?: GeneType; value?: number}>;
    const typedGenes = genes.filter(g => g.type === type);
    if (typedGenes.length === 0) return 0.5;
    return typedGenes.reduce((sum, g) => sum + (g.value || 0.5), 0) / typedGenes.length;
  }

  private calculateSeedFromGenes(genes: number[]): number {
    let hash = 0;
    for (let i = 0; i < Math.min(genes.length, 32); i++) {
      hash = ((hash << 5) - hash + genes[i]) | 0;
    }
    return Math.abs(hash);
  }

  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  private generateUniqueMarks(rng: () => number): UniqueMark[] {
    const marks: UniqueMark[] = [];
    if (rng() < 0.25) {
      marks.push({
        type: 'mole',
        position: { x: rng() * 0.3 - 0.15, y: rng() * 0.4 - 0.2 },
        size: 0.01 + rng() * 0.025,
        intensity: 0.4 + rng() * 0.6,
        shape: 'circle',
      });
    }
    if (rng() < 0.15) {
      marks.push({
        type: 'scar',
        position: { x: rng() * 0.4 - 0.2, y: rng() * 0.3 - 0.15 },
        size: 0.02 + rng() * 0.04,
        intensity: 0.3 + rng() * 0.5,
        shape: 'line',
      });
    }
    if (rng() < 0.2) {
      const freckleCount = Math.floor(rng() * 8) + 3;
      for (let i = 0; i < freckleCount; i++) {
        marks.push({
          type: 'freckle',
          position: { x: rng() * 0.25 - 0.125, y: 0.05 + rng() * 0.15 },
          size: 0.005 + rng() * 0.01,
          intensity: 0.2 + rng() * 0.4,
          shape: 'circle',
        });
      }
    }
    if (rng() < 0.1) {
      marks.push({
        type: 'birthmark',
        position: { x: rng() * 0.3 - 0.15, y: rng() * 0.5 - 0.25 },
        size: 0.03 + rng() * 0.05,
        intensity: 0.3 + rng() * 0.4,
        shape: 'irregular',
      });
    }
    return marks;
  }

  private generateUniqueMarksFromGenes(genes: number[]): UniqueMark[] {
    const marks: UniqueMark[] = [];
    if (genes[51] > 192) {
      marks.push({
        type: 'mole',
        position: { x: ((genes[52] / 255) * 0.3 - 0.15), y: ((genes[53] / 255) * 0.4 - 0.2) },
        size: 0.01 + (genes[54] / 255) * 0.025,
        intensity: 0.4 + (genes[55] / 255) * 0.6,
        shape: 'circle',
      });
    }
    if (genes[56] > 220) {
      marks.push({
        type: 'scar',
        position: { x: ((genes[57] / 255) * 0.4 - 0.2), y: ((genes[58] / 255) * 0.3 - 0.15) },
        size: 0.02 + (genes[59] / 255) * 0.04,
        intensity: 0.3 + (genes[60] / 255) * 0.5,
        shape: 'line',
      });
    }
    if (genes[61] > 200) {
      const freckleCount = Math.floor((genes[62] / 255) * 8) + 3;
      for (let i = 0; i < freckleCount; i++) {
        const geneIdx = (63 + i) % genes.length;
        marks.push({
          type: 'freckle',
          position: { x: ((genes[geneIdx] / 255) * 0.25 - 0.125), y: 0.05 + ((genes[(geneIdx + 1) % genes.length] / 255) * 0.15) },
          size: 0.005 + (genes[geneIdx] / 255) * 0.01,
          intensity: 0.2 + (genes[geneIdx] / 255) * 0.4,
          shape: 'circle',
        });
      }
    }
    return marks;
  }

  private generateDistinguishingFeatures(rng: () => number): DistinguishingFeature[] {
    const features: DistinguishingFeature[] = [];
    if (rng() < 0.05) {
      features.push({ type: 'heterochromia', location: 'eyes', prominence: rng() * 0.5 + 0.5 });
    }
    if (rng() < 0.08) {
      features.push({ type: 'dimples', location: 'cheeks', prominence: rng() * 0.6 + 0.4 });
    }
    if (rng() < 0.06) {
      features.push({ type: 'cleftChin', location: 'chin', prominence: rng() * 0.5 + 0.5 });
    }
    if (rng() < 0.03) {
      features.push({ type: 'vitiligo', location: 'face', prominence: rng() * 0.4 + 0.3 });
    }
    return features;
  }

  private generateDistinguishingFeaturesFromGenes(genes: number[]): DistinguishingFeature[] {
    const features: DistinguishingFeature[] = [];
    if (genes[20] > 250) {
      features.push({ type: 'heterochromia', location: 'eyes', prominence: (genes[21] / 255) * 0.5 + 0.5 });
    }
    if (genes[22] > 240) {
      features.push({ type: 'dimples', location: 'cheeks', prominence: (genes[23] / 255) * 0.6 + 0.4 });
    }
    if (genes[24] > 245) {
      features.push({ type: 'cleftChin', location: 'chin', prominence: (genes[25] / 255) * 0.5 + 0.5 });
    }
    return features;
  }

  private generateGeneticHash(seed: number): string {
    return seed.toString(16).padStart(8, '0') + '-' + Date.now().toString(36);
  }

  public getOrCreateCachedFace(geneticHash: string): FaceFeatures | null {
    const entry = this.faceCache.get(geneticHash);
    if (entry) {
      entry.accessCount++;
      entry.timestamp = Date.now();
      this.cacheHits++;
      return entry.features;
    }
    this.cacheMisses++;
    return null;
  }

  public cacheFace(features: FaceFeatures, canvasDataUrl?: string): void {
    if (this.faceCache.size >= this.maxCacheSize) {
      this.evictOldestEntries(Math.floor(this.maxCacheSize * 0.2));
    }
    this.faceCache.set(features.geneticHash, {
      features,
      canvasDataUrl: canvasDataUrl || '',
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.faceCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < count && i < entries.length; i++) {
      this.faceCache.delete(entries[i][0]);
    }
  }

  public getCacheStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.cacheHits + this.cacheMisses;
    return {
      size: this.faceCache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
    };
  }

  public clearCache(): void {
    this.faceCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  private getCanvas(): HTMLCanvasElement {
    if (this.canvasPool.length > 0) {
      return this.canvasPool.pop()!;
    }
    return document.createElement('canvas');
  }

  private returnCanvas(canvas: HTMLCanvasElement): void {
    if (this.canvasPool.length < this.maxPoolSize) {
      this.canvasPool.push(canvas);
    }
  }

  public renderFaceToCanvas(features: FaceFeatures, size: number = 128): string {
    const cached = this.getOrCreateCachedFace(features.geneticHash);
    if (cached) {
      const entry = this.faceCache.get(features.geneticHash);
      if (entry?.canvasDataUrl) {
        return entry.canvasDataUrl;
      }
    }
    const canvas = this.getCanvas();
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    this.drawFace(ctx, features, size);
    const dataUrl = canvas.toDataURL('image/png');
    this.cacheFace(features, dataUrl);
    this.returnCanvas(canvas);
    return dataUrl;
  }

  private drawFace(ctx: CanvasRenderingContext2D, features: FaceFeatures, size: number): void {
    const cx = size / 2;
    const cy = size / 2;
    const scale = size / 100;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);
    this.drawFaceShape(ctx, features, cx, cy, scale);
    this.drawEars(ctx, features, cx, cy, scale);
    this.drawHair(ctx, features, cx, cy, scale);
    this.drawEyebrows(ctx, features, cx, cy, scale);
    this.drawEyes(ctx, features, cx, cy, scale);
    this.drawNose(ctx, features, cx, cy, scale);
    this.drawMouth(ctx, features, cx, cy, scale);
    this.drawUniqueMarks(ctx, features, cx, cy, scale);
    this.drawAgeSigns(ctx, features, cx, cy, scale);
  }

  private drawFaceShape(ctx: CanvasRenderingContext2D, features: FaceFeatures, cx: number, cy: number, scale: number): void {
    const skinColor = SKIN_TONE_COLORS[features.skinTone];
    const undertone = features.skinUndertone === 'warm' ? 15 : features.skinUndertone === 'cool' ? -10 : 0;
    const r = Math.min(255, Math.max(0, skinColor[0] + undertone));
    const g = Math.min(255, Math.max(0, skinColor[1] + undertone * 0.5));
    const b = Math.min(255, Math.max(0, skinColor[2] - undertone * 0.3));
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    const faceW = 35 * features.faceWidth * scale;
    const faceH = 40 * features.faceHeight * scale;
    switch (features.faceShape) {
      case 'oval':
        ctx.ellipse(cx, cy, faceW, faceH, 0, 0, Math.PI * 2);
        break;
      case 'round':
        ctx.arc(cx, cy, Math.min(faceW, faceH), 0, Math.PI * 2);
        break;
      case 'square':
        const halfW = faceW * 0.9;
        const halfH = faceH * 0.9;
        ctx.moveTo(cx - halfW, cy - halfH);
        ctx.lineTo(cx + halfW, cy - halfH);
        ctx.lineTo(cx + halfW, cy + halfH);
        ctx.lineTo(cx - halfW, cy + halfH);
        ctx.closePath();
        break;
      case 'heart':
        ctx.moveTo(cx, cy + faceH);
        ctx.bezierCurveTo(cx - faceW, cy + faceH * 0.3, cx - faceW, cy - faceH * 0.5, cx, cy - faceH);
        ctx.bezierCurveTo(cx + faceW, cy - faceH * 0.5, cx + faceW, cy + faceH * 0.3, cx, cy + faceH);
        break;
      case 'diamond':
        ctx.moveTo(cx, cy - faceH);
        ctx.lineTo(cx + faceW * 0.8, cy);
        ctx.lineTo(cx, cy + faceH);
        ctx.lineTo(cx - faceW * 0.8, cy);
        ctx.closePath();
        break;
      case 'oblong':
        ctx.ellipse(cx, cy, faceW * 0.85, faceH * 1.1, 0, 0, Math.PI * 2);
        break;
    }
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawEars(ctx: CanvasRenderingContext2D, features: FaceFeatures, cx: number, cy: number, scale: number): void {
    const earSize = 8 * features.earSize * scale;
    const earY = cy - 2 * scale;
    const skinColor = SKIN_TONE_COLORS[features.skinTone];
    ctx.fillStyle = `rgb(${skinColor[0] - 10}, ${skinColor[1] - 10}, ${skinColor[2] - 10})`;
    ctx.beginPath();
    if (features.earShape === 'pointed') {
      ctx.moveTo(cx - 38 * scale, earY - earSize);
      ctx.lineTo(cx - 42 * scale, earY - earSize * 1.5);
      ctx.lineTo(cx - 38 * scale, earY + earSize);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 38 * scale, earY - earSize);
      ctx.lineTo(cx + 42 * scale, earY - earSize * 1.5);
      ctx.lineTo(cx + 38 * scale, earY + earSize);
    } else {
      ctx.ellipse(cx - 38 * scale, earY, earSize * 0.6, earSize, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 38 * scale, earY, earSize * 0.6, earSize, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  private drawHair(ctx: CanvasRenderingContext2D, features: FaceFeatures, cx: number, cy: number, scale: number): void {
    if (features.hairStyle === 'bald') return;
    const hairColor = HAIR_COLOR_MAP[features.hairColor];
    const hairR = hairColor[0];
    const hairG = hairColor[1];
    const hairB = hairColor[2];
    ctx.fillStyle = `rgb(${hairR}, ${hairG}, ${hairB})`;
    ctx.beginPath();
    const hairTop = cy - 38 * scale * features.faceHeight;
    switch (features.hairStyle) {
      case 'short':
        ctx.moveTo(cx - 35 * scale, hairTop + 5 * scale);
        ctx.quadraticCurveTo(cx - 38 * scale, hairTop - 10 * scale, cx, hairTop - 15 * scale);
        ctx.quadraticCurveTo(cx + 38 * scale, hairTop - 10 * scale, cx + 35 * scale, hairTop + 5 * scale);
        ctx.quadraticCurveTo(cx, hairTop, cx - 35 * scale, hairTop + 5 * scale);
        break;
      case 'medium':
      case 'long':
        ctx.moveTo(cx - 40 * scale, cy + 20 * scale);
        ctx.quadraticCurveTo(cx - 45 * scale, hairTop - 5 * scale, cx, hairTop - 20 * scale);
        ctx.quadraticCurveTo(cx + 45 * scale, hairTop - 5 * scale, cx + 40 * scale, cy + 20 * scale);
        ctx.quadraticCurveTo(cx + 35 * scale, cy, cx, cy + 5 * scale);
        ctx.quadraticCurveTo(cx - 35 * scale, cy, cx - 40 * scale, cy + 20 * scale);
        break;
      case 'curly':
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(cx + i * 12 * scale, hairTop + Math.abs(i) * 3 * scale, 10 * scale * features.hairDensity, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      case 'wavy':
        ctx.moveTo(cx - 38 * scale, cy + 15 * scale);
        for (let i = 0; i < 8; i++) {
          const x = cx - 38 * scale + i * 10 * scale;
          const y = hairTop + (i % 2 === 0 ? -5 : 5) * scale;
          ctx.quadraticCurveTo(x + 5 * scale, y, x + 10 * scale, hairTop);
        }
        ctx.quadraticCurveTo(cx + 40 * scale, cy, cx + 38 * scale, cy + 15 * scale);
        break;
      case 'ponytail':
        ctx.moveTo(cx - 35 * scale, hairTop + 5 * scale);
        ctx.quadraticCurveTo(cx, hairTop - 15 * scale, cx + 35 * scale, hairTop + 5 * scale);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx, hairTop - 10 * scale);
        ctx.quadraticCurveTo(cx + 5 * scale, hairTop + 30 * scale, cx, hairTop + 50 * scale);
        ctx.quadraticCurveTo(cx - 5 * scale, hairTop + 30 * scale, cx, hairTop - 10 * scale);
        break;
      case 'mohawk':
        ctx.moveTo(cx - 5 * scale, hairTop + 10 * scale);
        ctx.lineTo(cx, hairTop - 25 * scale);
        ctx.lineTo(cx + 5 * scale, hairTop + 10 * scale);
        break;
      case 'afro':
        ctx.arc(cx, hairTop + 10 * scale, 30 * scale * features.hairDensity, 0, Math.PI * 2);
        break;
      case 'bun':
        ctx.moveTo(cx - 35 * scale, hairTop + 5 * scale);
        ctx.quadraticCurveTo(cx, hairTop - 10 * scale, cx + 35 * scale, hairTop + 5 * scale);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, hairTop - 5 * scale, 12 * scale, 0, Math.PI * 2);
        break;
      case 'spiky':
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * 8 * scale, hairTop + 5 * scale);
          ctx.lineTo(cx + i * 8 * scale - 3 * scale, hairTop - 15 * scale);
          ctx.lineTo(cx + i * 8 * scale + 3 * scale, hairTop + 5 * scale);
          ctx.fill();
        }
        return;
      default:
        ctx.moveTo(cx - 35 * scale, hairTop + 5 * scale);
        ctx.quadraticCurveTo(cx, hairTop - 15 * scale, cx + 35 * scale, hairTop + 5 * scale);
    }
    ctx.fill();
  }

  private drawEyebrows(ctx: CanvasRenderingContext2D, features: FaceFeatures, cx: number, cy: number, scale: number): void {
    const hairColor = HAIR_COLOR_MAP[features.hairColor];
    ctx.strokeStyle = `rgb(${Math.max(0, hairColor[0] - 20)}, ${Math.max(0, hairColor[1] - 20)}, ${Math.max(0, hairColor[2] - 20)})`;
    ctx.lineWidth = 2 * features.eyebrowThickness * scale;
    ctx.lineCap = 'round';
    const browY = cy - 15 * scale;
    const browSpacing = features.eyebrowSpacing * 15 * scale;
    const browAngle = features.eyebrowAngle * 20;
    ctx.beginPath();
    switch (features.eyebrowShape) {
      case 'straight':
        ctx.moveTo(cx - browSpacing - 10 * scale, browY);
        ctx.lineTo(cx - browSpacing + 10 * scale, browY);
        ctx.moveTo(cx + browSpacing - 10 * scale, browY);
        ctx.lineTo(cx + browSpacing + 10 * scale, browY);
        break;
      case 'arched':
        ctx.moveTo(cx - browSpacing - 10 * scale, browY + 2 * scale);
        ctx.quadraticCurveTo(cx - browSpacing, browY - 5 * scale, cx - browSpacing + 10 * scale, browY + 2 * scale);
        ctx.moveTo(cx + browSpacing - 10 * scale, browY + 2 * scale);
        ctx.quadraticCurveTo(cx + browSpacing, browY - 5 * scale, cx + browSpacing + 10 * scale, browY + 2 * scale);
        break;
      case 'angled':
        ctx.moveTo(cx - browSpacing - 10 * scale, browY + 3 * scale);
        ctx.lineTo(cx - browSpacing - 2 * scale, browY - 4 * scale);
        ctx.lineTo(cx - browSpacing + 10 * scale, browY - 2 * scale);
        ctx.moveTo(cx + browSpacing - 10 * scale, browY - 2 * scale);
        ctx.lineTo(cx + browSpacing + 2 * scale, browY - 4 * scale);
        ctx.lineTo(cx + browSpacing + 10 * scale, browY + 3 * scale);
        break;
      default:
        ctx.moveTo(cx - browSpacing - 10 * scale, browY);
        ctx.quadraticCurveTo(cx - browSpacing, browY - 3 * scale, cx - browSpacing + 10 * scale, browY + 2 * scale);
        ctx.moveTo(cx + browSpacing - 10 * scale, browY + 2 * scale);
        ctx.quadraticCurveTo(cx + browSpacing, browY - 3 * scale, cx + browSpacing + 10 * scale, browY);
    }
    ctx.stroke();
  }

  private drawEyes(ctx: CanvasRenderingContext2D, features: FaceFeatures, cx: number, cy: number, scale: number): void {
    const eyeY = cy - 5 * scale;
    const eyeSpacing = features.eyeSpacing * 15 * scale;
    const eyeSize = 6 * features.eyeSize * scale;
    const eyeColor = EYE_COLOR_MAP[features.eyeColor];
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - eyeSpacing, eyeY, eyeSize, eyeSize * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + eyeSpacing, eyeY, eyeSize, eyeSize * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgb(${eyeColor[0]}, ${eyeColor[1]}, ${eyeColor[2]})`;
    ctx.beginPath();
    ctx.arc(cx - eyeSpacing, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeSpacing, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - eyeSpacing, eyeY, eyeSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeSpacing, eyeY, eyeSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - eyeSpacing - eyeSize * 0.15, eyeY - eyeSize * 0.15, eyeSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeSpacing - eyeSize * 0.15, eyeY - eyeSize * 0.15, eyeSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawNose(ctx: CanvasRenderingContext2D, features: FaceFeatures, cx: number, cy: number, scale: number): void {
    const skinColor = SKIN_TONE_COLORS[features.skinTone];
    const noseY = cy + 5 * scale;
    const noseH = 15 * features.noseSize * scale;
    const noseW = 8 * features.noseWidth * scale;
    ctx.strokeStyle = `rgba(${Math.max(0, skinColor[0] - 40)}, ${Math.max(0, skinColor[1] - 40)}, ${Math.max(0, skinColor[2] - 40)}, 0.5)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    switch (features.noseShape) {
      case 'button':
        ctx.moveTo(cx, noseY - noseH * 0.5);
        ctx.quadraticCurveTo(cx + noseW * 0.3, noseY, cx, noseY + noseH * 0.2);
        ctx.quadraticCurveTo(cx - noseW * 0.3, noseY, cx, noseY - noseH * 0.5);
        break;
      case 'aquiline':
        ctx.moveTo(cx, noseY - noseH * 0.6);
        ctx.quadraticCurveTo(cx + noseW * 0.5, noseY - noseH * 0.2, cx + noseW * 0.3, noseY);
        ctx.quadraticCurveTo(cx, noseY + noseH * 0.3, cx - noseW * 0.3, noseY);
        ctx.quadraticCurveTo(cx - noseW * 0.5, noseY - noseH * 0.2, cx, noseY - noseH * 0.6);
        break;
      default:
        ctx.moveTo(cx, noseY - noseH * 0.5);
        ctx.lineTo(cx, noseY);
        ctx.moveTo(cx - noseW * 0.4, noseY + noseH * 0.2);
        ctx.quadraticCurveTo(cx, noseY + noseH * 0.3, cx + noseW * 0.4, noseY + noseH * 0.2);
    }
    ctx.stroke();
  }

  private drawMouth(ctx: CanvasRenderingContext2D, features: FaceFeatures, cx: number, cy: number, scale: number): void {
    const mouthY = cy + 20 * scale;
    const mouthW = 12 * features.mouthWidth * scale;
    const lipH = features.lipThickness === 'thin' ? 2 : features.lipThickness === 'full' ? 5 : features.lipThickness === 'plump' ? 7 : 3;
    const lipHeight = lipH * scale;
    ctx.fillStyle = `rgb(180, 100, 100)`;
    ctx.beginPath();
    switch (features.lipShape) {
      case 'heart':
        ctx.moveTo(cx - mouthW, mouthY);
        ctx.quadraticCurveTo(cx - mouthW * 0.5, mouthY - lipHeight, cx, mouthY - lipHeight * 0.5);
        ctx.quadraticCurveTo(cx + mouthW * 0.5, mouthY - lipHeight, cx + mouthW, mouthY);
        ctx.quadraticCurveTo(cx, mouthY + lipHeight, cx - mouthW, mouthY);
        break;
      case 'bow':
        ctx.moveTo(cx - mouthW, mouthY);
        ctx.quadraticCurveTo(cx - mouthW * 0.3, mouthY - lipHeight * 1.2, cx, mouthY - lipHeight * 0.3);
        ctx.quadraticCurveTo(cx + mouthW * 0.3, mouthY - lipHeight * 1.2, cx + mouthW, mouthY);
        ctx.quadraticCurveTo(cx, mouthY + lipHeight * 0.8, cx - mouthW, mouthY);
        break;
      default:
        ctx.ellipse(cx, mouthY, mouthW, lipHeight, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = `rgba(150, 80, 80, 0.5)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - mouthW, mouthY);
    ctx.quadraticCurveTo(cx, mouthY - lipHeight * 0.3, cx + mouthW, mouthY);
    ctx.stroke();
  }

  private drawUniqueMarks(ctx: CanvasRenderingContext2D, features: FaceFeatures, cx: number, cy: number, scale: number): void {
    for (const mark of features.uniqueMarks) {
      const x = cx + mark.position.x * scale * 50;
      const y = cy + mark.position.y * scale * 50;
      const size = mark.size * scale * 100;
      ctx.fillStyle = `rgba(80, 50, 30, ${mark.intensity})`;
      ctx.beginPath();
      switch (mark.shape) {
        case 'circle':
          ctx.arc(x, y, size, 0, Math.PI * 2);
          break;
        case 'oval':
          ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
          break;
        case 'line':
          ctx.moveTo(x - size, y - size * 0.3);
          ctx.lineTo(x + size, y + size * 0.3);
          ctx.strokeStyle = `rgba(100, 70, 50, ${mark.intensity})`;
          ctx.lineWidth = size * 0.3;
          ctx.stroke();
          continue;
        case 'irregular':
          ctx.moveTo(x, y - size);
          ctx.bezierCurveTo(x + size, y - size * 0.5, x + size * 0.8, y + size * 0.5, x, y + size);
          ctx.bezierCurveTo(x - size * 0.8, y + size * 0.5, x - size, y - size * 0.5, x, y - size);
          break;
      }
      ctx.fill();
    }
    for (const feature of features.distinguishingFeatures) {
      if (feature.type === 'dimples') {
        ctx.fillStyle = `rgba(200, 150, 130, ${feature.prominence * 0.3})`;
        ctx.beginPath();
        ctx.arc(cx - 25 * scale, cy + 15 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 25 * scale, cy + 15 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawAgeSigns(ctx: CanvasRenderingContext2D, features: FaceFeatures, cx: number, cy: number, scale: number): void {
    const ageSigns = features.ageSigns;
    if (ageSigns.crowFeet > 0) {
      ctx.strokeStyle = `rgba(100, 80, 70, ${ageSigns.crowFeet * 0.3})`;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 20 * scale - i * 3 * scale, cy - 5 * scale);
        ctx.lineTo(cx - 25 * scale - i * 3 * scale, cy - 8 * scale + i * 2 * scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 20 * scale + i * 3 * scale, cy - 5 * scale);
        ctx.lineTo(cx + 25 * scale + i * 3 * scale, cy - 8 * scale + i * 2 * scale);
        ctx.stroke();
      }
    }
    if (ageSigns.foreheadLines > 0) {
      ctx.strokeStyle = `rgba(100, 80, 70, ${ageSigns.foreheadLines * 0.25})`;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 15 * scale, cy - 28 * scale + i * 4 * scale);
        ctx.lineTo(cx + 15 * scale, cy - 28 * scale + i * 4 * scale);
        ctx.stroke();
      }
    }
  }

  public static getNeutralExpression(): ExpressionParams {
    return { browRaise: 0, eyeBlink: 0, mouthOpen: 0, smile: 0, frown: 0, surprise: 0 };
  }

  public static getHappyExpression(): ExpressionParams {
    return { browRaise: 0.2, eyeBlink: 0, mouthOpen: 0.1, smile: 0.8, frown: 0, surprise: 0 };
  }

  public static getSadExpression(): ExpressionParams {
    return { browRaise: -0.3, eyeBlink: 0.2, mouthOpen: 0, smile: 0, frown: 0.6, surprise: 0 };
  }

  public static getAngryExpression(): ExpressionParams {
    return { browRaise: -0.2, eyeBlink: 0, mouthOpen: 0, smile: 0, frown: 0.7, surprise: 0 };
  }

  public static getSurprisedExpression(): ExpressionParams {
    return { browRaise: 0.5, eyeBlink: 0, mouthOpen: 0.6, smile: 0, frown: 0, surprise: 1.0 };
  }

  public static lerpExpression(from: ExpressionParams, to: ExpressionParams, t: number): ExpressionParams {
    return {
      browRaise: from.browRaise + (to.browRaise - from.browRaise) * t,
      eyeBlink: from.eyeBlink + (to.eyeBlink - from.eyeBlink) * t,
      mouthOpen: from.mouthOpen + (to.mouthOpen - from.mouthOpen) * t,
      smile: from.smile + (to.smile - from.smile) * t,
      frown: from.frown + (to.frown - from.frown) * t,
      surprise: from.surprise + (to.surprise - from.surprise) * t,
    };
  }

  public static getDefaultMaterial(): SDFMaterial {
    return { baseColor: [0.95, 0.85, 0.75, 1.0], roughness: 0.7, metalness: 0.0, normalStrength: 1.0 };
  }

  public validateFeatureCombination(features: FaceFeatures): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    for (const rule of FEATURE_COMBINATION_RULES) {
      const hasAllFeatures = rule.features.every(f => {
        if (f === 'heterochromia') return features.eyeColor === 'heterochromia';
        if (f === 'cleftChin') return features.chinShape === 'cleft';
        if (f === 'dimpled') return features.chinShape === 'dimpled';
        if (f === 'widowsPeak') return features.hairline === 'widowsPeak';
        if (f === 'receding') return features.hairline === 'receding';
        if (f === 'pointed_ear') return features.earShape === 'pointed';
        if (f === 'hooded_eye') return features.eyeShape === 'hooded';
        if (f === 'albino') return features.skinTone === 'pale' && features.hairColor === 'platinum';
        return false;
      });
      if (hasAllFeatures && !rule.compatible) {
        issues.push(`特征组合不兼容: ${rule.features.join(' + ')}`);
      }
    }
    return { valid: issues.length === 0, issues };
  }

  public calculateDistinctiveness(features: FaceFeatures): number {
    let score = 0;
    const rareEyeColors = ['violet', 'heterochromia', 'gray'];
    if (rareEyeColors.includes(features.eyeColor)) score += 0.2;
    const rareHairColors = ['red', 'platinum', 'blue', 'purple', 'green'];
    if (rareHairColors.includes(features.hairColor)) score += 0.15;
    if (features.earShape === 'pointed') score += 0.1;
    if (features.chinShape === 'cleft' || features.chinShape === 'dimpled') score += 0.1;
    score += features.uniqueMarks.length * 0.05;
    score += features.distinguishingFeatures.length * 0.1;
    if (features.eyeColor === 'heterochromia') score += 0.2;
    return Math.min(1, score);
  }
}

export const faceGenerator = new ProceduralFaceGenerator();
export default faceGenerator;
