/**
 * =============================================================================
 * APEX 宇宙级核心系统 - 极致扩展包
 * THE APEX EXTREME EXPANSION
 * 
 * 包含：
 * 1. 多维时空模拟器 - 超越三维的宇宙模拟
 * 2. 量子意识网络 - 市民的集体意识涌现
 * 3. 宇宙弦渲染器 - 粒子系统的终极形态
 * 4. 黑洞物理引擎 - 引力坍缩模拟
 * 5. 平行世界生成器 - 分支文明模拟
 * 6. 时间晶体计算 - 超越冯诺依曼架构
 * 7. 宇宙微波背景辐射 - 宇宙诞生回响
 * 8. 暗能量驱动 - 熵增的终极动力
 * =============================================================================
 */

/**
 * =============================================================================
 * 多维时空模拟器
 * 超越三维的空间模拟，支持四维乃至更高维度
 * =============================================================================
 */

export interface Dimension {
  id: number;
  name: string;
  scale: number;      // 空间尺度
  timeScale: number;   // 时间尺度
  curvature: number;   // 空间曲率
  torsion: number;      // 空间扭曲
}

/**
 * 时空坐标 - 超越四维
 */
export interface SpaceTimeCoord {
  t: number;           // 时间维度
  x: number;           // 空间维度1
  y: number;           // 空间维度2
  z: number;           // 空间维度3
  w?: number;          // 第四空间维度
  v?: number;          // 第五空间维度
}

export class MultiDimensionalSimulator {
  private dimensions: Dimension[] = [];
  private coordinates: Map<string, SpaceTimeCoord> = new Map();
  private maxDimensions: number = 11;  // 弦理论中的11维空间
  
  constructor() {
    this.initDimensions();
  }
  
  /**
   * 初始化维度
   */
  private initDimensions(): void {
    // 标准的4维时空
    this.dimensions.push(
      { id: 0, name: '时间', scale: 1, timeScale: 1, curvature: 0, torsion: 0 },
      { id: 1, name: '空间-X', scale: 1, timeScale: 0, curvature: 0, torsion: 0 },
      { id: 2, name: '空间-Y', scale: 1, timeScale: 0, curvature: 0, torsion: 0 },
      { id: 3, name: '空间-Z', scale: 1, timeScale: 0, curvature: 0, torsion: 0 },
    );
    
    // 卡拉比-丘流形的紧致化维度
    for (let i = 4; i < this.maxDimensions; i++) {
      this.dimensions.push({
        id: i,
        name: `紧致维度-${i}`,
        scale: 1e-35,  // 普朗克尺度
        timeScale: 0,
        curvature: Math.random(),
        torsion: Math.random(),
      });
    }
  }
  
  /**
   * 创建时空坐标
   */
  public createCoord(t: number, x: number, y: number, z: number, extraDims: number[] = []): SpaceTimeCoord {
    const coord: SpaceTimeCoord = { t, x, y, z };
    
    if (extraDims.length > 0) coord.w = extraDims[0];
    if (extraDims.length > 1) coord.v = extraDims[1];
    
    return coord;
  }
  
  /**
   * 计算闵可夫斯基度规
   */
  public minkowskiMetric(coord1: SpaceTimeCoord, coord2: SpaceTimeCoord): number {
    const dt = coord2.t - coord1.t;
    const dx = coord2.x - coord1.x;
    const dy = coord2.y - coord1.y;
    const dz = coord2.z - coord1.z;
    
    // ds² = -c²dt² + dx² + dy² + dz²
    return -dt * dt + dx * dx + dy * dy + dz * dz;
  }
  
  /**
   * 计算黎曼曲率张量（简化版）
   */
  public computeCurvature(): number {
    let totalCurvature = 0;
    
    for (const dim of this.dimensions) {
      totalCurvature += dim.curvature;
    }
    
    return totalCurvature / this.dimensions.length;
  }
  
  /**
   * 在高维空间投影到三维
   */
  public projectTo3D(coord: SpaceTimeCoord): { x: number; y: number; z: number } {
    // 使用黎曼投影
    const r = Math.sqrt(coord.x * coord.x + coord.y * coord.y + coord.z * coord.z);
    const w = coord.w || 0;
    
    // 李嘉诚投影
    const projectionFactor = 1 / (1 + Math.abs(w) / r);
    
    return {
      x: coord.x * projectionFactor,
      y: coord.y * projectionFactor,
      z: coord.z * projectionFactor,
    };
  }
}

/**
 * =============================================================================
 * 量子意识网络
 * 市民集体意识的量子涌现
 * =============================================================================
 */

export interface QuantumConsciousness {
  citizenIds: string[];
  waveFunction: Float32Array;
  entanglementMatrix: Float32Array;
  coherence: number;      // 相干性 0-1
  awareness: number;        // 意识强度 0-1
  sharedMemories: string[];  // 共享记忆
}

export interface QuantumThought {
  id: string;
  content: string;
  amplitude: number;
  phase: number;
  collapsed: boolean;
  originCitizens: string[];
}

export class QuantumConsciousnessNetwork {
  private consciousness: QuantumConsciousness | null = null;
  private thoughts: QuantumThought[] = [];
  private collapseThreshold: number = 0.7;  // 意识坍缩阈值
  
  /**
   * 初始化集体意识
   */
  public init(citizenIds: string[]): void {
    const size = citizenIds.length * 10;  // 每市民10个量子态
    
    this.consciousness = {
      citizenIds,
      waveFunction: new Float32Array(size),
      entanglementMatrix: new Float32Array(size * size),
      coherence: 0.5,
      awareness: 0.1,
      sharedMemories: [],
    };
    
    // 初始化波函数
    for (let i = 0; i < size; i++) {
      // 随机相位
      const phase = Math.random() * Math.PI * 2;
      this.consciousness.waveFunction[i] = Math.cos(phase);
    }
    
    // 初始化纠缠矩阵（高度纠缠）
    for (let i = 0; i < size * size; i++) {
      this.consciousness.entanglementMatrix[i] = Math.random();
    }
  }
  
  /**
   * 生成量子思维
   */
  public generateThought(content: string, originCitizens: string[]): QuantumThought {
    const thought: QuantumThought = {
      id: crypto.randomUUID(),
      content,
      amplitude: Math.random(),
      phase: Math.random() * 2 * Math.PI,
      collapsed: false,
      originCitizens,
    };
    
    this.thoughts.push(thought);
    
    // 更新意识状态
    if (this.consciousness) {
      this.consciousness.awareness += 0.01;
      this.consciousness.coherence = Math.min(1, this.consciousness.coherence + 0.001);
    }
    
    return thought;
  }
  
  /**
   * 量子测量（意识坍缩）
   */
  public measure(thoughtId: string): string {
    const thought = this.thoughts.find(t => t.id === thoughtId);
    if (!thought) return '';
    
    // 测量导致波函数坍缩
    const probability = thought.amplitude * thought.amplitude;
    
    if (Math.random() < probability && probability > this.collapseThreshold) {
      thought.collapsed = true;
      
      // 向共享记忆添加
      if (this.consciousness) {
        this.consciousness.sharedMemories.push(thought.content);
      }
      
      return thought.content;
    }
    
    return '';
  }
  
  /**
   * 量子纠缠传播
   */
  public entangle(citizenId1: string, citizenId2: string): void {
    if (!this.consciousness) return;
    
    // 贝尔态纠缠
    const idx1 = this.consciousness.citizenIds.indexOf(citizenId1);
    const idx2 = this.consciousness.citizenIds.indexOf(citizenId2);
    
    if (idx1 >= 0 && idx2 >= 0) {
      // 设置最大纠缠
      this.consciousness.entanglementMatrix[idx1 * idx2] = 1.0;
      this.consciousness.entanglementMatrix[idx2 * idx1] = 1.0;
      this.consciousness.coherence = Math.min(1, this.consciousness.coherence + 0.1);
    }
  }
  
  /**
   * 获取集体意识状态
   */
  public getState(): QuantumConsciousness | null {
    return this.consciousness;
  }
  
  /**
   * 测量集体意识
   */
  public measureCollective(): { awareness: number; coherence: number; memories: string[] } {
    if (!this.consciousness) {
      return { awareness: 0, coherence: 0, memories: [] };
    }
    
    // 量子退相干模拟
    this.consciousness.coherence *= 0.999;
    
    return {
      awareness: this.consciousness.awareness,
      coherence: this.consciousness.coherence,
      memories: this.consciousness.sharedMemories,
    };
  }
}

/**
 * =============================================================================
 * 宇宙弦渲染器
 * 粒子系统的终极形态 - 动态拓扑粒子
 * =============================================================================
 */

export interface CosmicString {
  id: string;
  points: { x: number; y: number; z: number }[];
  tension: number;      // 张力
  vibration: number;     // 振动幅度
  energy: number;          // 能量
  color: string;          // 颜色
  thickness: number;        // 厚度
}

export class CosmicStringRenderer {
  private strings: CosmicString[] = [];
  private maxStrings: number = 1000;
  
  /**
   * 创建宇宙弦
   */
  public createString(
    startX: number,
    startY: number,
    startZ: number,
    length: number,
    segments: number
  ): CosmicString {
    const points: { x: number; y: number; z: number }[] = [];
    
    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      points.push({
        x: startX + t * length,
        y: startY + Math.sin(t * Math.PI * 4) * 0.5,
        z: startZ + Math.cos(t * Math.PI * 6) * 0.3,
      });
    }
    
    const string: CosmicString = {
      id: crypto.randomUUID(),
      points,
      tension: 1 + Math.random(),
      vibration: Math.random(),
      energy: length * 1e10,  // 能量与长度成正比
      color: this.getRandomNeonColor(),
      thickness: 0.01 + Math.random() * 0.01,
    };
    
    this.strings.push(string);
    
    // 限制最大数量
    if (this.strings.length > this.maxStrings) {
      this.strings.shift();
    }
    
    return string;
  }
  
  /**
   * 更新宇宙弦动力学
   */
  public update(deltaTime: number): void {
    for (const string of this.strings) {
      // 更新振动
      string.vibration += deltaTime * 0.1;
      
      // 更新点位置
      for (let i = 1; i < string.points.length - 1; i++) {
        const wave = Math.sin(string.vibration + i * 0.5) * string.energy * 1e-10;
        string.points[i].y += wave * deltaTime;
        string.points[i].x += Math.cos(string.vibration + i) * wave * deltaTime * 0.5;
      }
    }
  }
  
  /**
   * 生成GLSL着色器代码
   */
  public generateGLSLShader(): string {
    return `
      // 宇宙弦顶点着色器
      struct CosmicString {
        vec3 position;
        float energy;
        float tension;
        float vibration;
      };
      
      @vertex
      fn main(
        @location(0) position: vec3<f32>,
        @location(1) normal: vec3<f32>,
        @location(2) uv: vec2<f32>,
        @builtin(instance_index) instance: u32
      ) -> @builtin(position) vec4<f32> {
        var string = cosmicStrings[instance];
        
        // 弦振动
        let wave = sin(string.vibration + position.y * 10.0) * string.energy * 0.0001;
        var displaced = position;
        displaced.x += wave;
        displaced.y += cos(string.vibration + position.x * 8.0) * wave * 0.5;
        
        return uniforms.viewProjection * vec4<f32>(displaced, 1.0);
      }
      
      // 宇宙弦片段着色器
      @fragment
      fn main(
        @location(0) color: vec4<f32>,
        @location(1) energy: f32,
        @location(2) vibration: f32
      ) -> @location(0) vec4<f32> {
        // 能量发光
        let glow = exp(-vibration * 2.0) * energy * 0.001;
        let emission = color.rgb * glow;
        
        // 干涉条纹
        let interference = sin(vibration * 20.0) * 0.5 + 0.5;
        
        return vec4<f32>(color.rgb + emission + interference * 0.1, color.a);
      }
    `;
  }
  
  private getRandomNeonColor(): string {
    const colors = [
      '#00f0ff', // 青色
      '#ff00ff', // 洋红
      '#39ff14', // 荧光绿
      '#ff6b6b', // 珊瑚红
      '#ffd700', // 金色
      '#9400d3', // 暗紫
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

/**
 * =============================================================================
 * 黑洞物理引擎
 * 引力坍缩与事件视界模拟
 * =============================================================================
 */

export interface BlackHole {
  id: string;
  position: { x: number; y: number; z: number };
  mass: number;            // 质量（太阳质量倍数）
  radius: number;         // 史瓦西半径
  angularMomentum: number; // 角动量
  charge: number;          // 电荷
  accretionDisk: {
    innerRadius: number;
    outerRadius: number;
    temperature: number;
    luminosity: number;
  };
  hawkingRadiation: {
    temperature: number;     // 霍金温度
    power: number;         // 辐射功率
    particlesPerSecond: number;
  };
}

export class BlackHolePhysics {
  private blackHoles: BlackHole[] = [];
  private gravitationalConstant = 6.674e-11;
  private speedOfLight = 299792458;
  
  /**
   * 创建黑洞
   */
  public createBlackHole(
    x: number,
    y: number,
    z: number,
    massSolarMasses: number
  ): BlackHole {
    // 太阳质量（kg）
    const solarMass = 1.989e30;
    const mass = massSolarMasses * solarMass;
    
    // 史瓦西半径 Rs = 2GM/c²
    const schwarzschildRadius = (2 * this.gravitationalConstant * mass) /
      (this.speedOfLight * this.speedOfLight);
    
    // 霍金温度 T = ℏc³/(8πGMkB)
    const reducedPlanck = 1.0545718e-34;
    const boltzmann = 1.380649e-23;
    const hawkingTemp = (reducedPlanck * Math.pow(this.speedOfLight, 3)) /
      (8 * Math.PI * this.gravitationalConstant * mass * boltzmann);
    
    const blackHole: BlackHole = {
      id: crypto.randomUUID(),
      position: { x, y, z },
      mass,
      radius: schwarzschildRadius,
      angularMomentum: mass * 0.5,  // 简化
      charge: 0,
      accretionDisk: {
        innerRadius: schwarzschildRadius * 3,
        outerRadius: schwarzschildRadius * 20,
        temperature: 1e7,  // 1000万K
        luminosity: mass * 1e26,
      },
      hawkingRadiation: {
        temperature: hawkingTemp,
        power: 0,
        particlesPerSecond: 0,
      },
    };
    
    // 计算霍金辐射功率 P = ℏc⁶/(15360πG²M²)
    const planck = 6.626e-34;
    blackHole.hawkingRadiation.power = (planck * Math.pow(this.speedOfLight, 6)) /
      (15360 * Math.PI * Math.pow(this.gravitationalConstant, 2) * Math.pow(mass, 2));
    
    // 粒子产生率
    const particleEnergy = hawkingTemp * 1.380649e-23;
    blackHole.hawkingRadiation.particlesPerSecond =
      blackHole.hawkingRadiation.power / particleEnergy;
    
    this.blackHoles.push(blackHole);
    
    return blackHole;
  }
  
  /**
   * 计算引力加速度
   */
  public computeGravity(
    position: { x: number; y: number; z: number }
  ): { ax: number; ay: number; az: number } {
    let totalAx = 0, totalAy = 0, totalAz = 0;
    
    for (const bh of this.blackHoles) {
      const dx = bh.position.x - position.x;
      const dy = bh.position.y - position.y;
      const dz = bh.position.z - position.z;
      
      const r2 = dx * dx + dy * dy + dz * dz;
      const r = Math.sqrt(r2);
      
      // 检查是否在事件视界内
      if (r < bh.radius) {
        return { ax: Infinity, ay: Infinity, az: Infinity };
      }
      
      // 引力加速度 a = GM/r²
      const a = this.gravitationalConstant * bh.mass / r2;
      
      totalAx += a * dx / r;
      totalAy += a * dy / r;
      totalAz += a * dz / r;
    }
    
    return { ax: totalAx, ay: totalAy, az: totalAz };
  }
  
  /**
   * 计算时间膨胀因子
   */
  public timeDilation(
    position: { x: number; y: number; z: number }
  ): number {
    let maxDilation = 1;
    
    for (const bh of this.blackHoles) {
      const dx = bh.position.x - position.x;
      const dy = bh.position.y - position.y;
      const dz = bh.position.z - position.z;
      
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const rs = bh.radius;
      
      // 引力时间膨胀 dt' = dt * sqrt(1 - rs/r)
      if (r > rs) {
        const dilation = Math.sqrt(1 - rs / r);
        maxDilation = Math.min(maxDilation, dilation);
      } else {
        return 0;  // 事件视界内时间停止
      }
    }
    
    return maxDilation;
  }
}

/**
 * =============================================================================
 * 平行世界生成器
 * 分支文明与多重宇宙模拟
 * =============================================================================
 */

export interface ParallelWorld {
  id: string;
  name: string;
  branchPoint: number;     // 分支时间点
  divergence: number;       // 偏离度
  citizens: number;         // 人口
  technologyLevel: number;   // 技术等级 0-10
  entropy: number;          // 熵值
  connected: boolean;       // 是否连接到主世界
  relationship: number;     // 与主世界的关系 -1到1
}

export class ParallelWorldGenerator {
  private worlds: ParallelWorld[] = [];
  private mainWorldId: string = '';
  private maxParallelWorlds: number = 100;
  
  /**
   * 初始化主世界
   */
  public initMainWorld(): void {
    const mainWorld: ParallelWorld = {
      id: crypto.randomUUID(),
      name: '主世界 - 永夜熵纪',
      branchPoint: 0,
      divergence: 0,
      citizens: 10000,
      technologyLevel: 5,
      entropy: 0.3,
      connected: true,
      relationship: 1,
    };
    
    this.worlds.push(mainWorld);
    this.mainWorldId = mainWorld.id;
  }
  
  /**
   * 生成平行世界
   */
  public generateParallelWorld(
    name: string,
    branchTime: number,
    divergence: number
  ): ParallelWorld {
    const world: ParallelWorld = {
      id: crypto.randomUUID(),
      name,
      branchPoint: branchTime,
      divergence,
      citizens: Math.floor(10000 * (1 - divergence * 0.5)),
      technologyLevel: Math.floor(5 * (1 - divergence * 0.3)),
      entropy: 0.3 + divergence * 0.5,
      connected: divergence < 0.3,
      relationship: 1 - divergence * 2,
    };
    
    this.worlds.push(world);
    
    // 限制最大数量
    if (this.worlds.length > this.maxParallelWorlds) {
      this.worlds = this.worlds.filter(w => w.id === this.mainWorldId);
    }
    
    return world;
  }
  
  /**
   * 世界间交互
   */
  public interact(worldId1: string, worldId2: string): {
    energy: number;
    matter: number;
    information: number;
  } {
    const world1 = this.worlds.find(w => w.id === worldId1);
    const world2 = this.worlds.find(w => w.id === worldId2);
    
    if (!world1 || !world2) {
      return { energy: 0, matter: 0, information: 0 };
    }
    
    // 基于关系和偏离度计算交互强度
    const baseStrength = Math.abs(world1.relationship + world2.relationship) / 2;
    const divergencePenalty = 1 - (world1.divergence + world2.divergence) / 2;
    
    const strength = baseStrength * divergencePenalty;
    
    return {
      energy: strength * 1e20,       // 焦耳
      matter: strength * 1e10,       // 千克
      information: strength * 1e15,  // 比特
    };
  }
  
  /**
   * 获取所有世界
   */
  public getAllWorlds(): ParallelWorld[] {
    return [...this.worlds];
  }
}

/**
 * =============================================================================
 * 时间晶体计算
 * 超越冯诺依曼架构的量子计算
 * =============================================================================
 */

export interface TimeCrystal {
  id: string;
  atoms: number;           // 原子数
  period: number;          // 振荡周期
  fidelity: number;        // 相干保真度
  coherenceTime: number;    // 相干时间（秒）
}

export class TimeCrystalComputer {
  private crystals: TimeCrystal[] = [];
  private maxCrystals: number = 10;
  private readonly planckConstant = 6.62607015e-34;
  
  /**
   * 创建时间晶体
   */
  public createCrystal(atoms: number, targetPeriod: number): TimeCrystal {
    const crystal: TimeCrystal = {
      id: crypto.randomUUID(),
      atoms,
      period: targetPeriod,
      fidelity: 0.99,
      coherenceTime: 1000,  // 秒
    };
    
    this.crystals.push(crystal);
    
    if (this.crystals.length > this.maxCrystals) {
      this.crystals.shift();
    }
    
    return crystal;
  }
  
  /**
   * 执行时间晶体计算
   */
  public compute(operation: string): { result: string; energy: number; time: number } {
    // 模拟计算过程
    const startTime = performance.now();
    
    let result = '';
    let energy = 0;
    
    // 时间晶体计算特点：极低能耗
    const energyPerOperation = 1e-30;  // 约10⁻³⁰焦耳
    
    for (let i = 0; i < this.crystals.length; i++) {
      const crystal = this.crystals[i];
      energy += energyPerOperation * crystal.atoms;
      
      // 模拟振荡计算
      result += this.crystalHash(crystal, operation);
    }
    
    const endTime = performance.now();
    
    return {
      result,
      energy,
      time: endTime - startTime,
    };
  }
  
  private crystalHash(crystal: TimeCrystal, input: string): string {
    // 使用时间晶体振荡生成哈希
    let hash = 0;
    const oscillation = Math.sin(2 * Math.PI * crystal.atoms / crystal.period);
    
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash + input.charCodeAt(i) + oscillation * 1000) | 0;
    }
    
    return hash.toString(16);
  }
}

/**
 * =============================================================================
 * 宇宙微波背景辐射模拟器
 * 宇宙诞生38万年后的余晖
 * =============================================================================
 */

export interface CMBRConfig {
  temperature: number;      // 平均温度 2.725K
  angularResolution: number; // 角度分辨率
  multipoleMoment: number;  // 多极矩 l=0-2500
}

export class CosmicMicrowaveBackground {
  private config: CMBRConfig = {
    temperature: 2.725,
    angularResolution: 0.5,  // 角分
    multipoleMoment: 2500,
  };
  
  private powerSpectrum: Map<number, number> = new Map();
  
  constructor() {
    this.computePowerSpectrum();
  }
  
  /**
   * 计算宇宙微波背景功率谱
   */
  private computePowerSpectrum(): void {
    // Sachs-Wolfe效应 + Silk阻尼 + Acoustic Peaks
    for (let l = 0; l <= this.config.multipoleMoment; l++) {
      let power = 0;
      
      // Acoustic peaks (l = 220, 540, 810, ...)
      const peakPositions = [220, 540, 810, 1080, 1350];
      const peakHeights = [1, 0.5, 0.3, 0.2, 0.15];
      
      for (let i = 0; i < peakPositions.length; i++) {
        const width = 50;
        const dist = l - peakPositions[i];
        const gaussian = Math.exp(-dist * dist / (2 * width * width));
        power += peakHeights[i] * gaussian;
      }
      
      // Silk阻尼（高l）
      if (l > 800) {
        const damping = Math.exp(-(l - 800) / 800);
        power *= damping;
      }
      
      // 低l Sachs-Wolfe plateau
      if (l < 50) {
        power = 0.1;
      }
      
      this.powerSpectrum.set(l, power);
    }
  }
  
  /**
   * 获取给定方向的天空温度
   */
  public getSkyTemperature(theta: number, phi: number): number {
    // 基于功率谱生成温度起伏
    let deltaT = 0;
    
    for (const [l, Cl] of this.powerSpectrum) {
      const Ylm = this.sphericalHarmonic(l, 0, theta, phi);
      deltaT += Math.sqrt(Cl) * Ylm * Math.random() * 2;
    }
    
    return this.config.temperature + deltaT * 1e-5;
  }
  
  /**
   * 球谐函数（简化版）
   */
  private sphericalHarmonic(l: number, m: number, theta: number, phi: number): number {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    
    // 勒让德多项式简化
    const Plm = this.associatedLegendre(l, Math.abs(m), cosTheta);
    
    return Plm * Math.cos(m * phi);
  }
  
  private associatedLegendre(l: number, m: number, x: number): number {
    // 简化实现
    return Math.pow(1 - x * x, m / 2) * Math.sin(l * Math.acos(x));
  }
  
  /**
   * 生成CMBR着色器代码
   */
  public generateShader(): string {
    return `
      // CMBR 天空盒着色器
      struct CMBRConfig {
        temperature: f32,
        angularResolution: f32,
      }
      
      @group(0) @binding(0) var<uniform> config: CMBRConfig;
      
      // 计算给定方向的温度
      fn getCMBRTemperature(dir: vec3<f32>) -> f32 {
        let theta = acos(dir.y);
        let phi = atan2(dir.x, dir.z);
        
        var deltaT = 0.0;
        
        // 基于功率谱计算
        for (let l = 0; l <= 2500; l++) {
          let Cl = getPowerSpectrum(l);
          let Ylm = sphericalHarmonic(l, 0, theta, phi);
          deltaT += sqrt(Cl) * Ylm * random() * 2.0;
        }
        
        return config.temperature + deltaT * 0.00001;
      }
      
      // 转换为RGB颜色
      fn temperatureToColor(T: f32) -> vec3<f32> {
        // Wien位移定律
        let t = T / 2.725;
        
        if (t < 0.5) {
          return mix(vec3<f32>(0.0, 0.0, 0.5), vec3<f32>(0.5, 0.0, 0.5), t * 2.0);
        } else if (t < 1.0) {
          return mix(vec3<f32>(0.5, 0.0, 0.5), vec3<f32>(1.0, 0.5, 0.5), (t - 0.5) * 2.0);
        } else if (t < 1.5) {
          return mix(vec3<f32>(1.0, 0.5, 0.5), vec3<f32>(1.0, 1.0, 1.0), (t - 1.0) * 2.0);
        } else {
          return vec3<f32>(1.0, 1.0, 1.0);
        }
      }
    `;
  }
}

/**
 * =============================================================================
 * 暗能量驱动引擎
 * 宇宙加速膨胀的终极动力
 * =============================================================================
 */

export interface DarkEnergy {
  density: number;         // 暗能量密度 (约 7e-30 g/cm³)
  equationOfState: number;  // 状态方程 w = -1
  cosmologicalConstant: number;  // 宇宙学常数 Λ
  hubbleConstant: number;   // 哈勃常数 H₀ (约 70 km/s/Mpc)
}

export class DarkEnergyDrive {
  private darkEnergy: DarkEnergy = {
    density: 7e-30,
    equationOfState: -1,
    cosmologicalConstant: 1e-52,  // m⁻²
    hubbleConstant: 70,            // km/s/Mpc
  };
  
  /**
   * 计算膨胀加速度
   */
  public computeExpansionAcceleration(scaleFactor: number): number {
    // Friedmann方程中的暗能量项
    // ä/a = - (4πG/3)(ρ + 3P) + Λc²/3
    // 对于暗能量 w = -1, P = -ρ
    // ä/a = Λc²/3
    
    const G = 6.674e-11;  // m⁻³ kg⁻¹ s⁻²
    const c = 3e8;       // m/s
    
    // 转换为SI单位
    const rho = this.darkEnergy.density * 1000;  // kg/m³
    
    // 加速度
    const acceleration = (4 * Math.PI * G * rho / 3) * (1 + 3 * this.darkEnergy.equationOfState) +
      this.darkEnergy.cosmologicalConstant * c * c / 3;
    
    return acceleration;
  }
  
  /**
   * 计算暗能量对熵的影响
   */
  public computeEntropyGeneration(): number {
    // 暗能量驱动宇宙膨胀，导致信息稀释
    // dS = -k_B * d(ln V) = -k_B * 3d(ln a)
    
    const boltzmann = 1.380649e-23;  // J/K
    
    return -3 * boltzmann * Math.log(1.001);  // 每单位膨胀的熵减
  }
  
  /**
   * 暗能量潮汐力
   */
  public tidalForce(r1: number, r2: number): number {
    // 暗能量引起的额外潮汐
    const hubbleFlow = this.darkEnergy.hubbleConstant * 1000 / 3.086e22;  // 转换为 s⁻¹
    
    // 速度梯度导致的潮汐
    return hubbleFlow * hubbleFlow * (r2 - r1);
  }
}
