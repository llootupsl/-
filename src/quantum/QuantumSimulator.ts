/**
 * 量子模拟器 - 状态向量模拟
 * 实现优化的矩阵运算和门操作模拟
 */

import { QuantumCircuit, type QuantumGate, type GateType, type Complex, type MeasurementResult, complexMul, complexAdd, complexConj, complexMag, complexExp } from './QuantumCircuit';

/**
 * 模拟配置
 */
export interface SimulationConfig {
  /** 精度 (小数位数) */
  precision?: number;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 最大内存限制 (MB) */
  maxMemoryMB?: number;
  /** 是否使用批量处理 */
  batchProcessing?: boolean;
}

/**
 * 模拟结果
 */
export interface SimulationResult {
  /** 最终状态向量 */
  stateVector: StateVector;
  /** 测量结果 */
  measurements: MeasurementResult[];
  /** 执行时间 (ms) */
  executionTime: number;
  /** 门操作数 */
  gateCount: number;
  /** 状态向量范数 (应为1) */
  norm: number;
  /** 电路快照 */
  snapshots: StateSnapshot[];
}

/**
 * 状态向量
 */
export interface StateVector {
  /** 振幅数组 */
  amplitudes: Complex[];
  /** 维度 (量子比特数) */
  numQubits: number;
  /** 状态数 (2^n) */
  dimension: number;
}

/**
 * 状态快照
 */
export interface StateSnapshot {
  /** 时间戳 */
  step: number;
  /** 门类型 */
  gateType: GateType;
  /** 状态向量 (简化表示) */
  probabilities: number[];
  /** 纠缠熵 (可选) */
  entanglementEntropy?: number;
}

/**
 * 量子模拟器
 */
export class QuantumSimulator {
  private config: Required<SimulationConfig>;
  private circuit: QuantumCircuit | null = null;
  private stateVector: Complex[] = [];
  private snapshots: StateSnapshot[] = [];
  private gateCache: Map<string, Complex[]> = new Map();

  constructor(configOrQubits?: SimulationConfig | number) {
    if (typeof configOrQubits === 'number') {
      this.config = {
        precision: 10,
        enableCache: true,
        maxMemoryMB: 512,
        batchProcessing: true,
      };
      this.initialize(configOrQubits);
    } else {
      this.config = {
        precision: configOrQubits?.precision ?? 10,
        enableCache: configOrQubits?.enableCache ?? true,
        maxMemoryMB: configOrQubits?.maxMemoryMB ?? 512,
        batchProcessing: configOrQubits?.batchProcessing ?? true,
      };
    }
  }

  /**
   * 初始化状态向量 |00...0>
   */
  public initialize(numQubits: number): void {
    const dimension = Math.pow(2, numQubits);
    this.stateVector = new Array(dimension).fill(null).map(() => ({ re: 0, im: 0 }));
    this.stateVector[0] = { re: 1, im: 0 }; // |00...0>
    this.snapshots = [];
    this.gateCache.clear();
  }

  /**
   * 加载电路
   */
  public loadCircuit(circuit: QuantumCircuit): void {
    this.circuit = circuit;
    this.initialize(circuit.getNumQubits());
  }

  /**
   * 执行模拟
   */
  public run(circuit?: QuantumCircuit, shots: number = 1): SimulationResult {
    const startTime = performance.now();

    if (circuit) {
      this.loadCircuit(circuit);
    }

    if (!this.circuit) {
      throw new Error('No circuit loaded');
    }

    const gates = this.circuit.getGates();
    let step = 0;

    for (const gate of gates) {
      this.applyGate(gate);
      step++;

      // 每10步保存一次快照
      if (step % 10 === 0) {
        this.saveSnapshot(gate.type, step);
      }

      // 如果是测量门，记录测量
      if (gate.type === 'MEASURE') {
        this.performMeasurement(gate.target);
      }
    }

    // 最终快照
    this.saveSnapshot('I', step);

    const executionTime = performance.now() - startTime;
    const measurements = this.getMeasurements();

    return {
      stateVector: this.getStateVector(),
      measurements,
      executionTime,
      gateCount: gates.length,
      norm: this.calculateNorm(),
      snapshots: [...this.snapshots],
    };
  }

  /**
   * 应用单个门
   */
  public applyGate(gate: QuantumGate): void {
    switch (gate.type) {
      case 'I':
      case 'X':
      case 'Y':
      case 'Z':
      case 'H':
      case 'S':
      case 'T':
        this.applySingleQubitGate(gate.type, gate.target);
        break;
      case 'CNOT':
        this.applyCNOT(gate.control!, gate.target);
        break;
      case 'CZ':
        this.applyCZ(gate.control!, gate.target);
        break;
      case 'SWAP':
        this.applySWAP(gate.control!, gate.target);
        break;
      case 'TOFFOLI':
        this.applyToffoli(gate.control!, gate.params?.control2!, gate.target);
        break;
      case 'RX':
      case 'RY':
      case 'RZ':
        this.applyRotationGate(gate.type, gate.target, gate.angle!);
        break;
      case 'MEASURE':
        break;
      case 'CPHASE':
      case 'MCZ':
        this.applyControlledPhase(gate.control!, gate.target, gate.angle!);
        break;
    }
  }

  /**
   * 应用单比特门
   */
  private applySingleQubitGate(type: Exclude<GateType, 'CNOT' | 'CZ' | 'SWAP' | 'TOFFOLI' | 'RX' | 'RY' | 'RZ' | 'MEASURE' | 'CPHASE' | 'MCZ'>, qubit: number): void {
    const matrix = this.getGateMatrix(type, qubit);
    const newState = new Array(this.stateVector.length).fill(null).map(() => ({ re: 0, im: 0 }));

    // 对每个基态应用门
    for (let i = 0; i < this.stateVector.length; i++) {
      if (complexMag(this.stateVector[i]) < 1e-10) continue;

      // 计算目标索引
      const bit = (i >> qubit) & 1;
      const prefixMask = i & ((1 << qubit) - 1);
      const suffixMask = i & ~((1 << (qubit + 1)) - 1);

      // |0> -> matrix[0][0]*|0> + matrix[0][1]*|1>
      // |1> -> matrix[1][0]*|0> + matrix[1][1]*|1>
      const idx0 = prefixMask | (0 << qubit) | suffixMask;
      const idx1 = prefixMask | (1 << qubit) | suffixMask;

      const amp = this.stateVector[i];

      // newState[idx0] += matrix[0][0] * amp
      const m00 = matrix[bit * 2];
      const m01 = matrix[bit * 2 + 1];

      newState[idx0] = complexAdd(newState[idx0], complexMul(m00, amp));
      newState[idx1] = complexAdd(newState[idx1], complexMul(m01, amp));
    }

    this.stateVector = newState;
  }

  /**
   * 获取门矩阵 (带缓存)
   */
  private getGateMatrix(type: GateType, qubit: number): Complex[] {
    const cacheKey = `${type}_${qubit}`;

    if (this.config.enableCache && this.gateCache.has(cacheKey)) {
      return this.gateCache.get(cacheKey)!;
    }

    let matrix: Complex[];

    switch (type) {
      case 'I':
        matrix = [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }];
        break;
      case 'X':
        matrix = [{ re: 0, im: 0 }, { re: 1, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }];
        break;
      case 'Y':
        matrix = [{ re: 0, im: 0 }, { re: 0, im: -1 }, { re: 0, im: 1 }, { re: 0, im: 0 }];
        break;
      case 'Z':
        matrix = [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: -1, im: 0 }];
        break;
      case 'H':
        matrix = [
          { re: 1 / Math.SQRT2, im: 0 }, { re: 1 / Math.SQRT2, im: 0 },
          { re: 1 / Math.SQRT2, im: 0 }, { re: -1 / Math.SQRT2, im: 0 }
        ];
        break;
      case 'S':
        matrix = [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 1 }];
        break;
      case 'T':
        matrix = [
          { re: 1, im: 0 },
          { re: 0, im: 0 },
          { re: 0, im: 0 },
          { re: Math.cos(Math.PI / 4), im: Math.sin(Math.PI / 4) }
        ];
        break;
      default:
        throw new Error(`Unknown gate type: ${type}`);
    }

    if (this.config.enableCache) {
      this.gateCache.set(cacheKey, matrix);
    }

    return matrix;
  }

  /**
   * 应用 CNOT 门
   */
  private applyCNOT(control: number, target: number): void {
    const newState = new Array(this.stateVector.length).fill(null).map(() => ({ re: 0, im: 0 }));

    for (let i = 0; i < this.stateVector.length; i++) {
      if (complexMag(this.stateVector[i]) < 1e-10) continue;

      const controlBit = (i >> control) & 1;
      const targetBit = (i >> target) & 1;

      // 如果控制位为1，翻转目标位
      let newIdx = i;
      if (controlBit === 1) {
        newIdx = i ^ (1 << target);
      }

      newState[newIdx] = complexAdd(newState[newIdx], this.stateVector[i]);
    }

    this.stateVector = newState;
  }

  /**
   * 应用 CZ 门
   */
  private applyCZ(control: number, target: number): void {
    for (let i = 0; i < this.stateVector.length; i++) {
      const controlBit = (i >> control) & 1;
      const targetBit = (i >> target) & 1;

      // 如果两个位都是1，应用相位
      if (controlBit === 1 && targetBit === 1) {
        this.stateVector[i] = {
          re: -this.stateVector[i].re,
          im: -this.stateVector[i].im,
        };
      }
    }
  }

  /**
   * 应用 SWAP 门
   */
  private applySWAP(qubit1: number, qubit2: number): void {
    const newState = new Array(this.stateVector.length).fill(null).map(() => ({ re: 0, im: 0 }));

    for (let i = 0; i < this.stateVector.length; i++) {
      if (complexMag(this.stateVector[i]) < 1e-10) continue;

      // 交换两个量子比特
      const bit1 = (i >> qubit1) & 1;
      const bit2 = (i >> qubit2) & 1;

      let newIdx = i;
      newIdx = (newIdx & ~(1 << qubit1)) | (bit2 << qubit1);
      newIdx = (newIdx & ~(1 << qubit2)) | (bit1 << qubit2);

      newState[newIdx] = complexAdd(newState[newIdx], this.stateVector[i]);
    }

    this.stateVector = newState;
  }

  /**
   * 应用 Toffoli 门 (CCNOT)
   */
  private applyToffoli(control1: number, control2: number, target: number): void {
    const newState = new Array(this.stateVector.length).fill(null).map(() => ({ re: 0, im: 0 }));

    for (let i = 0; i < this.stateVector.length; i++) {
      if (complexMag(this.stateVector[i]) < 1e-10) continue;

      const c1 = (i >> control1) & 1;
      const c2 = (i >> control2) & 1;

      // 如果两个控制位都是1，翻转目标位
      let newIdx = i;
      if (c1 === 1 && c2 === 1) {
        newIdx = i ^ (1 << target);
      }

      newState[newIdx] = complexAdd(newState[newIdx], this.stateVector[i]);
    }

    this.stateVector = newState;
  }

  /**
   * 应用旋转门
   */
  private applyRotationGate(type: 'RX' | 'RY' | 'RZ', qubit: number, angle: number): void {
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    let matrix: Complex[];

    switch (type) {
      case 'RX':
        matrix = [
          { re: cos, im: 0 }, { re: 0, im: -sin },
          { re: 0, im: -sin }, { re: cos, im: 0 }
        ];
        break;
      case 'RY':
        matrix = [
          { re: cos, im: 0 }, { re: -sin, im: 0 },
          { re: sin, im: 0 }, { re: cos, im: 0 }
        ];
        break;
      case 'RZ':
        matrix = [
          { re: complexExp(-angle / 2).re, im: complexExp(-angle / 2).im },
          { re: 0, im: 0 },
          { re: 0, im: 0 },
          { re: complexExp(angle / 2).re, im: complexExp(angle / 2).im }
        ];
        break;
    }

    const newState = new Array(this.stateVector.length).fill(null).map(() => ({ re: 0, im: 0 }));

    for (let i = 0; i < this.stateVector.length; i++) {
      if (complexMag(this.stateVector[i]) < 1e-10) continue;

      const bit = (i >> qubit) & 1;
      const prefixMask = i & ((1 << qubit) - 1);
      const suffixMask = i & ~((1 << (qubit + 1)) - 1);

      const idx0 = prefixMask | (0 << qubit) | suffixMask;
      const idx1 = prefixMask | (1 << qubit) | suffixMask;

      const amp = this.stateVector[i];
      const m00 = matrix[bit * 2];
      const m01 = matrix[bit * 2 + 1];

      newState[idx0] = complexAdd(newState[idx0], complexMul(m00, amp));
      newState[idx1] = complexAdd(newState[idx1], complexMul(m01, amp));
    }

    this.stateVector = newState;
  }

  /**
   * 应用受控相位门
   */
  private applyControlledPhase(control: number, target: number, angle: number): void {
    for (let i = 0; i < this.stateVector.length; i++) {
      const cBit = (i >> control) & 1;
      const tBit = (i >> target) & 1;

      if (cBit === 1 && tBit === 1) {
        const phase = complexExp(angle);
        this.stateVector[i] = complexMul(this.stateVector[i], phase);
      }
    }
  }

  /**
   * 执行测量
   */
  private performMeasurement(qubit: number): MeasurementResult {
    // 计算 |0> 和 |1> 的概率
    let prob0 = 0;
    let prob1 = 0;

    for (let i = 0; i < this.stateVector.length; i++) {
      const bit = (i >> qubit) & 1;
      const mag = complexMag(this.stateVector[i]);

      if (bit === 0) {
        prob0 += mag * mag;
      } else {
        prob1 += mag * mag;
      }
    }

    // 归一化
    const total = prob0 + prob1;
    prob0 /= total;
    prob1 /= total;

    // 随机测量
    const rand = Math.random();
    const result: 0 | 1 = rand < prob0 ? 0 : 1;
    const probability = result === 0 ? prob0 : prob1;

    // 坍缩状态向量
    const collapsedState = new Array(this.stateVector.length).fill(null).map(() => ({ re: 0, im: 0 }));
    const factor = result === 0 ? 1 / Math.sqrt(prob0) : 1 / Math.sqrt(prob1);

    for (let i = 0; i < this.stateVector.length; i++) {
      const bit = (i >> qubit) & 1;
      if (bit === result) {
        collapsedState[i] = {
          re: this.stateVector[i].re * factor,
          im: this.stateVector[i].im * factor,
        };
      }
    }

    // 归一化
    this.stateVector = collapsedState;
    this.normalize();

    // 更新电路的测量结果
    if (this.circuit) {
      this.circuit.setMeasurementResult(qubit, result);
    }

    return {
      qubit,
      result,
      probability,
      collapsedState: this.stateVector,
    };
  }

  /**
   * 获取测量结果
   */
  private getMeasurements(): MeasurementResult[] {
    if (!this.circuit) return [];

    const results: MeasurementResult[] = [];
    const measuredQubits = this.circuit.getMeasuredQubits();

    for (const qubit of measuredQubits) {
      const result = this.circuit.getMeasurementResult(qubit);
      if (result !== undefined) {
        results.push({
          qubit,
          result: result as 0 | 1,
          probability: 1, // 简化
          collapsedState: this.stateVector,
        });
      }
    }

    return results;
  }

  /**
   * 保存快照
   */
  private saveSnapshot(gateType: GateType, step: number): void {
    const probabilities: number[] = [];
    for (let i = 0; i < this.stateVector.length; i++) {
      probabilities.push(complexMag(this.stateVector[i]) ** 2);
    }

    this.snapshots.push({
      step,
      gateType,
      probabilities,
      entanglementEntropy: this.calculateEntanglementEntropy(),
    });
  }

  /**
   * 计算纠缠熵 (用于追踪)
   */
  private calculateEntanglementEntropy(): number {
    // 简化实现：使用冯诺依曼熵的近似
    let entropy = 0;
    for (const amp of this.stateVector) {
      const prob = complexMag(amp) ** 2;
      if (prob > 1e-10) {
        entropy -= prob * Math.log2(prob);
      }
    }
    return entropy;
  }

  /**
   * 归一化状态向量
   */
  private normalize(): void {
    const norm = this.calculateNorm();
    if (norm > 1e-10) {
      const factor = 1 / norm;
      for (let i = 0; i < this.stateVector.length; i++) {
        this.stateVector[i] = {
          re: this.stateVector[i].re * factor,
          im: this.stateVector[i].im * factor,
        };
      }
    }
  }

  /**
   * 计算范数
   */
  public calculateNorm(): number {
    let sum = 0;
    for (const amp of this.stateVector) {
      sum += complexMag(amp) ** 2;
    }
    return Math.sqrt(sum);
  }

  /**
   * 获取当前状态向量
   */
  public getStateVector(): StateVector {
    return {
      amplitudes: [...this.stateVector],
      numQubits: Math.log2(this.stateVector.length),
      dimension: this.stateVector.length,
    };
  }

  /**
   * 获取特定基态的概率
   */
  public getProbability(state: number): number {
    if (state < 0 || state >= this.stateVector.length) {
      throw new Error(`Invalid state index: ${state}`);
    }
    return complexMag(this.stateVector[state]) ** 2;
  }

  /**
   * 获取所有概率分布
   */
  public getProbabilityDistribution(): number[] {
    return this.stateVector.map(amp => complexMag(amp) ** 2);
  }

  /**
   * 运行多次模拟 (蒙特卡洛)
   */
  public runMultiple(circuit: QuantumCircuit, shots: number): { counts: Record<string, number>; probabilities: Record<string, number> } {
    const counts: Record<string, number> = {};
    const numQubits = circuit.getNumQubits();

    for (let i = 0; i < shots; i++) {
      this.run(circuit, 1);
      const result = this.getMeasurements();

      // 生成二进制字符串
      const bits = new Array(numQubits).fill('0');
      for (const m of result) {
        bits[m.qubit] = m.result.toString();
      }
      const stateStr = bits.reverse().join('');

      counts[stateStr] = (counts[stateStr] || 0) + 1;
    }

    // 计算概率
    const probabilities: Record<string, number> = {};
    for (const state in counts) {
      probabilities[state] = counts[state] / shots;
    }

    return { counts, probabilities };
  }

  /**
   * 计算 Bloch 球坐标
   */
  public getBlochCoordinates(qubit: number): { theta: number; phi: number } {
    if (qubit < 0 || qubit >= Math.log2(this.stateVector.length)) {
      throw new Error(`Invalid qubit index: ${qubit}`);
    }

    // 计算 |0> 和 |1> 的边际概率
    let alpha0Mag = 0, alpha0Phase = 0;
    let alpha1Mag = 0, alpha1Phase = 0;

    for (let i = 0; i < this.stateVector.length; i++) {
      const bit = (i >> qubit) & 1;
      const amp = this.stateVector[i];
      const mag = complexMag(amp);
      const phase = Math.atan2(amp.im, amp.re);

      if (bit === 0) {
        alpha0Mag += mag * mag;
      } else {
        alpha1Mag += mag * mag;
        alpha1Phase = phase;
      }
    }

    const theta = Math.acos(2 * alpha0Mag - 1);
    const phi = alpha1Phase;

    return { theta, phi };
  }

  /**
   * 克隆模拟器状态
   */
  public clone(): QuantumSimulator {
    const cloned = new QuantumSimulator(this.config);
    if (this.circuit) {
      cloned.loadCircuit(this.circuit.clone());
    }
    cloned.stateVector = this.stateVector.map(a => ({ ...a }));
    cloned.snapshots = [...this.snapshots];
    return cloned;
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.circuit = null;
    this.stateVector = [];
    this.snapshots = [];
    this.gateCache.clear();
  }

  /**
   * 应用 Hadamard 门
   */
  public hadamard(qubit: number): void {
    this.applySingleQubitGate('H', qubit);
  }

  /**
   * 应用 CNOT 门
   */
  public cnot(control: number, target: number): void {
    this.applyCNOT(control, target);
  }

  /**
   * 应用相位门
   */
  public phase(qubit: number, angle: number): void {
    this.applyRotationGate('RZ', qubit, angle);
  }

  /**
   * 执行测量并返回结果
   */
  public measure(): { measurements: number[]; confidence: number; coherence: number } {
    const measurements: number[] = [];
    const numQubits = Math.log2(this.stateVector.length);
    
    for (let q = 0; q < numQubits; q++) {
      let prob0 = 0;
      let prob1 = 0;
      
      for (let i = 0; i < this.stateVector.length; i++) {
        const bit = (i >> q) & 1;
        const mag = complexMag(this.stateVector[i]);
        if (bit === 0) {
          prob0 += mag * mag;
        } else {
          prob1 += mag * mag;
        }
      }
      
      const result = Math.random() < prob0 ? 0 : 1;
      measurements.push(result);
    }
    
    const confidence = 1 - Math.abs(measurements.reduce((a, b) => a + b, 0) / measurements.length - 0.5);
    const coherence = this.calculateNorm();
    
    return { measurements, confidence, coherence };
  }
}

/**
 * 创建模拟器工厂
 */
export function createSimulator(config?: SimulationConfig): QuantumSimulator {
  return new QuantumSimulator(config);
}
