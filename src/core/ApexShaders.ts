/**
 * =============================================================================
 * 极致着色器库 - THE APEX SHADER LIBRARY
 * 超越物理极限的着色器集合
 * =============================================================================
 */

/**
 * 全息投影着色器
 */
export const HolographicShader = `
/**
 * 全息投影着色器
 * 用于显示悬浮的全息信息
 */
struct HolographicUniforms {
  time: f32,
  intensity: f32,
  scanlineIntensity: f32,
  chromaticAberration: f32,
  glitchIntensity: f32,
  colorPrimary: vec3<f32>,
  colorSecondary: vec3<f32>,
  colorAccent: vec3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: HolographicUniforms;

fn holographicEffect(uv: vec2<f32>, color: vec4<f32>) -> vec4<f32> {
  var result = color;
  
  // 扫描线效果
  let scanline = sin(uv.y * 800.0 + uniforms.time * 10.0) * 0.5 + 0.5;
  result.rgb *= mix(1.0, scanline, uniforms.scanlineIntensity * 0.3);
  
  // 色差效果
  let offset = uniforms.chromaticAberration * 0.005;
  let r = textureSample(tex, samp, uv + vec2<f32>(offset, 0.0)).r;
  let g = textureSample(tex, samp, uv).g;
  let b = textureSample(tex, samp, uv - vec2<f32>(offset, 0.0)).b;
  result.rgb = mix(result.rgb, vec3<f32>(r, g, b), uniforms.chromaticAberration);
  
  // 故障艺术效果
  if (uniforms.glitchIntensity > 0.0) {
    let glitchOffset = step(0.9, fract(sin(uv.y * 100.0 + uniforms.time * 50.0)));
    result.rgb += vec3<f32>(glitchOffset * uniforms.glitchIntensity * 0.5);
  }
  
  // 辉光效果
  let glow = exp(-length(uv - 0.5) * 2.0);
  result.rgb += uniforms.colorAccent * glow * uniforms.intensity * 0.3;
  
  // 透明度波动
  result.a *= 0.8 + sin(uv.y * 200.0 + uniforms.time * 5.0) * 0.2;
  
  return result;
}
`;

/**
 * 量子波动着色器
 */
export const QuantumFluctuationShader = `
/**
 * 量子波动着色器
 * 模拟量子真空涨落效果
 */
struct QuantumUniforms {
  time: f32,
  energyLevel: f32,
  superposition: f32,
  entanglement: f32,
  decoherence: f32,
  resolution: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: QuantumUniforms;

fn quantumNoise(uv: vec2<f32>) -> f32 {
  let t = uniforms.time * 0.5;
  let x = uv.x * 100.0 + t;
  let y = uv.y * 100.0 + t * 0.7;
  
  // 分形布朗运动
  var noise = 0.0;
  var amplitude = 1.0;
  var frequency = 1.0;
  
  for (var i = 0; i < 6; i++) {
    noise += abs(sin(x * frequency) + sin(y * frequency)) * amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return noise * 0.1;
}

fn waveFunction(uv: vec2<f32>) -> vec2<f32> {
  let t = uniforms.time;
  let x = uv.x * 10.0 - t * 2.0;
  let y = uv.y * 10.0 - t * 1.5;
  
  // 薛定谔方程的数值解
  let real = sin(x) * cos(y) * exp(-t * uniforms.decoherence);
  let imag = cos(x) * sin(y) * exp(-t * uniforms.decoherence);
  
  return vec2<f32>(real, imag);
}

fn probabilityCloud(uv: vec2<f32>) -> f32 {
  let wave = waveFunction(uv);
  let probability = wave.x * wave.x + wave.y * wave.y;
  return probability * uniforms.superposition;
}

fn quantumFluctuation(uv: vec2<f32>) -> vec3<f32> {
  let noise = quantumNoise(uv);
  let prob = probabilityCloud(uv);
  
  // 量子隧穿效果
  let tunneling = step(0.7 - noise, uniforms.energyLevel);
  
  // 纠缠效果
  let entanglement = sin(uv.x * 50.0 + uniforms.time * 10.0) * 
                     sin(uv.y * 50.0 - uniforms.time * 10.0) * 
                     uniforms.entanglement;
  
  return vec3<f32>(prob, tunneling, entanglement);
}
`;

/**
 * 熵增降解着色器
 */
export const EntropyDecayShader = `
/**
 * 熵增降解着色器
 * 模拟宇宙热寂过程
 */
struct EntropyUniforms {
  time: f32,
  entropy: f32,
  decayRate: f32,
  chaosLevel: f32,
  temperature: f32,
  colorHot: vec3<f32>,
  colorCold: vec3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: EntropyUniforms;

fn entropyNoise(uv: vec2<f32>, t: f32) -> f32 {
  // 衰减的噪声
  var noise = 0.0;
  
  for (var i = 0; i < 5; i++) {
    let scale = pow(2.0, f32(i));
    let speed = pow(0.5, f32(i));
    noise += sin(uv.x * scale + t * speed) * cos(uv.y * scale - t * speed * 0.7);
  }
  
  return noise * 0.2;
}

fn thermalRadiation(uv: vec2<f32>) -> vec3<f32> {
  // 维恩位移定律
  let wavelength = 2.898e-3 / uniforms.temperature; // m
  let freq = 1.0 / wavelength;
  
  // 普朗克黑体辐射
  let h = 6.626e-34;  // 普朗克常数
  let k = 1.381e-23;  // 玻尔兹曼常数
  let c = 3e8;        // 光速
  
  let x = h * freq / (k * uniforms.temperature);
  let planck = x * x * x / (exp(x) - 1.0);
  
  return uniforms.colorHot * planck * uniforms.entropy;
}

fn chaosEffect(uv: vec2<f32>) -> vec3<f32> {
  // 洛伦兹吸引子
  let sigma = 10.0;
  let rho = 28.0;
  let beta = 8.0 / 3.0;
  let dt = 0.01;
  
  var x = uv.x * 30.0 - 15.0;
  var y = uv.y * 30.0 - 15.0;
  var z = 0.0;
  
  for (var i = 0; i < 10; i++) {
    let dx = sigma * (y - x) * dt;
    let dy = (x * (rho - z) - y) * dt;
    let dz = (x * y - beta * z) * dt;
    x += dx;
    y += dy;
    z += dz;
  }
  
  return vec3<f32>(
    abs(sin(x * uniforms.chaosLevel)),
    abs(sin(y * uniforms.chaosLevel)),
    abs(sin(z * uniforms.chaosLevel))
  );
}

fn entropyDecay(uv: vec2<f32>) -> vec4<f32> {
  let noise = entropyNoise(uv, uniforms.time);
  let thermal = thermalRadiation(uv);
  let chaos = chaosEffect(uv);
  
  // 熵增导致的颜色冷却
  let temp = uniforms.temperature * (1.0 - uniforms.entropy * 0.5);
  let color = mix(uniforms.colorHot, uniforms.colorCold, temp / 10000.0);
  
  // 混沌度影响
  color = mix(color, vec3<f32>(0.1, 0.1, 0.15), uniforms.chaosLevel * 0.5);
  
  // 噪声干扰
  color += noise * uniforms.decayRate;
  
  // 霍金辐射效果
  let hawking = exp(-uniforms.entropy * 10.0) * sin(uv.y * 100.0 + uniforms.time * 20.0);
  color += vec3<f32>(0.5, 0.3, 0.1) * hawking * 0.3;
  
  return vec4<f32>(color, 1.0);
}
`;

/**
 * 神经网络可视化着色器
 */
export const NeuralVisualizationShader = `
/**
 * 神经网络可视化着色器
 * 展示神经活动与信号传播
 */
struct NeuralUniforms {
  time: f32,
  activationLevel: f32,
  signalSpeed: f32,
  plasticity: f32,
  layerCount: i32,
  neuronDensity: f32,
  weightScale: f32,
};

@group(0) @binding(0) var<uniform> uniforms: NeuralUniforms;

struct Neuron {
  position: vec2<f32>,
  activation: f32,
  threshold: f32,
  bias: f32,
};

struct Synapse {
  from: vec2<f32>,
  to: vec2<f32>,
  weight: f32,
  active: bool,
};

fn sigmoid(x: f32) -> f32 {
  return 1.0 / (1.0 + exp(-x));
}

fn relu(x: f32) -> f32 {
  return max(0.0, x);
}

fn neuronActivation(neuron: Neuron, inputs: array<f32, 10>) -> f32 {
  var sum = neuron.bias;
  for (var i = 0; i < arrayLength(&inputs); i++) {
    sum += inputs[i];
  }
  return sigmoid(sum);
}

fn signalPropagation(uv: vec2<f32>) -> f32 {
  var signal = 0.0;
  
  for (var layer = 0; layer < uniforms.layerCount; layer++) {
    let layerY = f32(layer) / f32(uniforms.layerCount);
    let layerOffset = fract(uniforms.time * uniforms.signalSpeed * 0.1 + f32(layer) * 0.1);
    
    // 神经元位置
    let neuronX = fract(uv.x * uniforms.neuronDensity);
    let neuronY = abs(uv.y - layerY);
    
    // 激活信号
    let activation = sin(neuronX * 10.0 + layerOffset * 20.0);
    let weight = sigmoid(neuronX * neuronY * 100.0);
    
    signal += activation * weight * uniforms.activationLevel;
  }
  
  return signal;
}

fn synapticPlasticity(uv: vec2<f32>) -> f32 {
  // STDP (Spike-Timing Dependent Plasticity)
  let deltaT = fract(uv.x * 50.0 - uniforms.time * uniforms.plasticity);
  
  let longTermPotentiation = exp(-abs(deltaT) * 20.0);      // LTP
  let longTermDepression = exp(abs(deltaT) * 20.0) * 0.5; // LTD
  
  return (longTermPotentiation - longTermDepression) * uniforms.activationLevel;
}

fn neuralVisualization(uv: vec2<f32>) -> vec4<f32> {
  let signal = signalPropagation(uv);
  let plasticity = synapticPlasticity(uv);
  
  // 颜色映射
  var color = vec3<f32>(0.0);
  
  // 基底颜色
  color += vec3<f32>(0.1, 0.2, 0.4);
  
  // 信号颜色
  color += vec3<f32>(0.0, 1.0, 1.0) * signal * 0.8;
  
  // 突触可塑性
  color += vec3<f32>(1.0, 0.5, 0.0) * plasticity * 0.5;
  
  // 神经同步振荡
  let sync = sin(uv.y * 50.0 + uniforms.time * 5.0) * 0.5 + 0.5;
  color += vec3<f32>(0.5, 0.0, 1.0) * sync * uniforms.activationLevel * 0.3;
  
  // 抑制效果
  let inhibition = cos(uv.x * 30.0 + uniforms.time * 3.0) * 0.5 + 0.5;
  color *= mix(1.0, inhibition, 0.3);
  
  return vec4<f32>(color, 1.0);
}
`;

/**
 * 流体动力学着色器
 */
export const FluidDynamicsShader = `
/**
 * 流体动力学着色器
 * 纳维-斯托克斯方程求解
 */
struct FluidUniforms {
  time: f32,
  viscosity: f32,
  diffusion: f32,
  velocityScale: f32,
  densityScale: f32,
  gravity: vec2<f32>,
  resolution: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: FluidUniforms;

// Navier-Stokes 方程求解
fn velocityField(uv: vec2<f32>, t: f32) -> vec2<f32> {
  var velocity = vec2<f32>(0.0);
  
  // 速度源
  let source1 = vec2<f32>(0.3, 0.5);
  let source2 = vec2<f32>(0.7, 0.5);
  
  let dist1 = length(uv - source1);
  let dist2 = length(uv - source2);
  
  // 偶极子流场
  velocity.x = (uv.x - source1.x) / (dist1 * dist1) - (uv.x - source2.x) / (dist2 * dist2);
  velocity.y = (uv.y - source1.y) / (dist1 * dist1) - (uv.y - source2.y) / (dist2 * dist2);
  
  // 添加湍流
  let turbX = sin(uv.y * 20.0 + t * 5.0) * 0.1;
  let turbY = sin(uv.x * 20.0 - t * 5.0) * 0.1;
  velocity += vec2<f32>(turbX, turbY);
  
  return velocity * uniforms.velocityScale;
}

fn vorticityConfinement(velocity: vec2<f32>, uv: vec2<f32>) -> vec2<f32> {
  let eps = 0.01;
  
  let omega_z = (velocity.y - velocity.x) / eps;
  
  let omega_x = 0.0;
  let omega_y = 0.0;
  
  let N = normalize(vec2<f32>(omega_x, omega_y));
  
  let eta = 0.1;
  
  return eta * vec2<f32>(
    abs(omega_z) * N.y,
    -abs(omega_z) * N.x
  );
}

fn pressureProjection(velocity: vec2<f32>, uv: vec2<f32>) -> vec2<f32> {
  // 简化的压力投影
  var pressure = 0.0;
  
  for (var i = 0; i < 10; i++) {
    let offset = vec2<f32>(
      sin(f32(i) * 12.9898),
      sin(f32(i) * 78.233)
    ) * 0.01;
    
    let v = velocityField(uv + offset, uniforms.time);
    pressure += (v.x + v.y) * 0.1;
  }
  
  return velocity - vec2<f32>(pressure, pressure);
}

fn fluidSimulation(uv: vec2<f32>) -> vec4<f32> {
  let velocity = velocityField(uv, uniforms.time);
  
  // 添加涡度限制
  let vorticity = vorticityConfinement(velocity, uv);
  
  // 压力投影
  let projected = pressureProjection(velocity + vorticity, uv);
  
  // 密度输运
  var density = 0.0;
  for (var i = 0; i < 5; i++) {
    let trail = uv - projected * f32(i) * 0.1;
    density += sin(trail.x * 30.0) * cos(trail.y * 30.0) * exp(-f32(i) * 0.5);
  }
  
  density *= uniforms.densityScale;
  
  // 颜色映射
  var color = vec3<f32>(0.0);
  
  // 速度可视化
  let speed = length(velocity);
  color = mix(vec3<f32>(0.0, 0.2, 0.5), vec3<f32>(0.0, 1.0, 1.0), speed * 2.0);
  
  // 密度可视化
  color = mix(color, vec3<f32>(1.0, 0.5, 0.0), abs(density) * 0.5);
  
  // 湍流区域高亮
  let turbulence = length(vorticity);
  color += vec3<f32>(1.0, 0.0, 0.5) * turbulence * 2.0;
  
  return vec4<f32>(color, 0.8);
}
`;

/**
 * 电磁场着色器
 */
export const ElectromagneticFieldShader = `
/**
 * 电磁场着色器
 * 麦克斯韦方程可视化
 */
struct EMFieldUniforms {
  time: f32,
  charge1Pos: vec2<f32>,
  charge2Pos: vec2<f32>,
  charge1Polarity: f32,   // +1 or -1
  charge2Polarity: f32,
  fieldStrength: f32,
  wavelength: f32,
  phase: f32,
};

@group(0) @binding(0) var<uniform> uniforms: EMFieldUniforms;

fn electricField(uv: vec2<f32>) -> vec2<f32> {
  var field = vec2<f32>(0.0, 0.0);
  
  // 点电荷电场 E = kq/r²
  let r1 = uv - uniforms.charge1Pos;
  let r2 = uv - uniforms.charge2Pos;
  
  let dist1 = length(r1);
  let dist2 = length(r2);
  
  let epsilon = 0.01;
  let e1 = uniforms.charge1Polarity / (dist1 * dist1 + epsilon) * normalize(r1);
  let e2 = uniforms.charge2Polarity / (dist2 * dist2 + epsilon) * normalize(r2);
  
  field = e1 + e2;
  
  return field * uniforms.fieldStrength;
}

fn magneticField(uv: vec2<f32>, velocity: vec2<f32>) -> vec3<f32> {
  // 洛伦兹力 B = q(v × E)
  let e = electricField(uv);
  let cross = vec3<f32>(
    velocity.y * e.x - velocity.y * e.y,
    velocity.x * e.y - velocity.x * e.x,
    velocity.x * e.y - velocity.y * e.x
  );
  
  return cross;
}

fn electromagneticWave(uv: vec2<f32>, t: f32) -> vec3<f32> {
  let wave = sin(uv.x * uniforms.wavelength - t * 10.0 + uniforms.phase);
  let waveY = sin(uv.y * uniforms.wavelength - t * 10.0 + uniforms.phase);
  
  return vec3<f32>(
    wave * 0.5 + 0.5,
    waveY * 0.5 + 0.5,
    (wave + waveY) * 0.25 + 0.5
  );
}

fn fieldLineTracing(uv: vec2<f32>) -> f32 {
  var density = 0.0;
  
  // 简化场线追踪
  for (var i = 0; i < 20; i++) {
    let t = f32(i) / 20.0;
    let pos = uv + vec2<f32>(t, 0.0) * 0.1;
    let field = electricField(pos);
    let fieldMag = length(field);
    
    density += exp(-fieldMag * 10.0) * 0.1;
  }
  
  return density;
}

fn electromagneticVisualization(uv: vec2<f32>) -> vec4<f32> {
  let eField = electricField(uv);
  let eMag = length(eField);
  
  // 场线
  let lines = fieldLineTracing(uv);
  
  // 电磁波
  let wave = electromagneticWave(uv, uniforms.time);
  
  // 颜色
  var color = vec3<f32>(0.0);
  
  // 电场强度映射
  color = mix(vec3<f32>(0.1, 0.1, 0.3), vec3<f32>(0.0, 1.0, 0.5), eMag * 2.0);
  
  // 场线
  color = mix(color, vec3<f32>(1.0, 1.0, 0.0), lines * 2.0);
  
  // 电磁波
  color += wave * 0.3;
  
  // 偶极子方向
  let direction = uniforms.charge1Pos - uniforms.charge2Pos;
  let dirAngle = atan2(direction.y, direction.x);
  let polarization = sin(uv.x * 20.0 * cos(dirAngle) + uv.y * 20.0 * sin(dirAngle) + uniforms.time * 5.0);
  color += vec3<f32>(1.0, 0.0, 1.0) * polarization * 0.2;
  
  return vec4<f32>(color, 0.9);
}
`;

/**
 * 分形宇宙着色器
 */
export const FractalUniverseShader = `
/**
 * 分形宇宙着色器
 * 曼德尔布罗特集合与茱莉亚集合的宇宙尺度模拟
 */
struct FractalUniforms {
  time: f32,
  zoom: f32,
  center: vec2<f32>,
  iterations: i32,
  power: f32,
  juliaC: vec2<f32>,
  blendFactor: f32,
  colorScheme: i32,
};

@group(0) @binding(0) var<uniform> uniforms: FractalUniforms;

fn mandelbrot(c: vec2<f32>, maxIter: i32) -> i32 {
  var z = vec2<f32>(0.0, 0.0);
  var iter = 0;
  
  for (var i = 0; i < maxIter; i++) {
    // z = z² + c
    let zr = z.x * z.x - z.y * z.y + c.x;
    let zi = 2.0 * z.x * z.y + c.y;
    z = vec2<f32>(zr, zi);
    
    if (dot(z, z) > 4.0) {
      iter = i;
      break;
    }
    iter = i;
  }
  
  return iter;
}

fn julia(z: vec2<f32>, c: vec2<f32>, maxIter: i32, power: f32) -> i32 {
  var iter = 0;
  
  for (var i = 0; i < maxIter; i++) {
    // z = z^power + c
    let r = length(z);
    let theta = atan2(z.y, z.x);
    
    let newR = pow(r, power);
    let newTheta = theta * power;
    
    z = vec2<f32>(
      newR * cos(newTheta) + c.x,
      newR * sin(newTheta) + c.y
    );
    
    if (dot(z, z) > 4.0) {
      iter = i;
      break;
    }
    iter = i;
  }
  
  return iter;
}

fn burningShip(c: vec2<f32>, maxIter: i32) -> i32 {
  var z = vec2<f32>(0.0, 0.0);
  var iter = 0;
  
  for (var i = 0; i < maxIter; i++) {
    let zr = abs(z.x);
    let zi = abs(z.y);
    z = vec2<f32>(zr * zr - zi * zi + c.x, 2.0 * zr * zi + c.y);
    
    if (dot(z, z) > 4.0) {
      iter = i;
      break;
    }
    iter = i;
  }
  
  return iter;
}

fn smoothIteration(count: i32, z: vec2<f32>) -> f32 {
  if (count == uniforms.iterations) return 0.0;
  
  let log_zn = log(dot(z, z)) / 2.0;
  let nu = log(log_zn / log(2.0)) / log(2.0);
  
  return f32(count) + 1.0 - nu;
}

fn galaxyColor(t: f32) -> vec3<f32> {
  let r = 0.5 + 0.5 * cos(6.28318 * (t + 0.0));
  let g = 0.5 + 0.5 * cos(6.28318 * (t + 0.333));
  let b = 0.5 + 0.5 * cos(6.28318 * (t + 0.667));
  return vec3<f32>(r, g, b);
}

fn fractalVisualization(uv: vec2<f32>) -> vec4<f32> {
  // 坐标变换
  let c = (uv - uniforms.center) / uniforms.zoom;
  
  // 计算分形
  let mIter = mandelbrot(c, uniforms.iterations);
  let jIter = julia(c, uniforms.juliaC, uniforms.iterations, uniforms.power);
  
  // 混合
  let finalIter = f32(mIter) * (1.0 - uniforms.blendFactor) + f32(jIter) * uniforms.blendFactor;
  
  // 平滑着色
  let smooth = smoothIteration(i32(finalIter), c);
  let t = smooth / f32(uniforms.iterations);
  
  // 颜色
  var color = vec3<f32>(0.0);
  
  if (uniforms.colorScheme == 0) {
    // 星系配色
    color = galaxyColor(t * 5.0);
  } else if (uniforms.colorScheme == 1) {
    // 火焰配色
    color = vec3<f32>(
      t * t,
      t * t * t,
      t * t * t * t * t
    );
  } else {
    // 量子配色
    color = vec3<f32>(
      sin(t * 10.0) * 0.5 + 0.5,
      sin(t * 10.0 + 2.094) * 0.5 + 0.5,
      sin(t * 10.0 + 4.188) * 0.5 + 0.5
    );
  }
  
  // 外部区域黑暗
  if (mIter == uniforms.iterations && jIter == uniforms.iterations) {
    color = vec3<f32>(0.02, 0.02, 0.05);
  }
  
  // 动画脉动
  let pulse = sin(uniforms.time * 3.0) * 0.1 + 0.9;
  color *= pulse;
  
  return vec4<f32>(color, 1.0);
}
`;

/**
 * 导出所有着色器
 */
export const AllShaders = {
  holographic: HolographicShader,
  quantum: QuantumFluctuationShader,
  entropy: EntropyDecayShader,
  neural: NeuralVisualizationShader,
  fluid: FluidDynamicsShader,
  electromagnetic: ElectromagneticFieldShader,
  fractal: FractalUniverseShader,
};

export type ShaderName = keyof typeof AllShaders;

export function getShader(name: ShaderName): string {
  return AllShaders[name];
}
