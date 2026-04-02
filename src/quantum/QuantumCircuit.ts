/**
 * 量子电路 - 量子比特和门操作
 */

import type { EntityId } from '@/core/types';

/**
 * 门类型枚举
 */
export type GateType =
  | 'I'   // 恒等门
  | 'X'   // 泡利-X (NOT)
  | 'Y'   // 泡利-Y
  | 'Z'   // 泡利-Z
  | 'H'   // 哈达玛门
  | 'S'   // 相位门
  | 'T'   // T 门
  | 'CNOT' // 受控非门
  | 'CZ'  // 受控Z门
  | 'SWAP' // 交换门
  | 'TOFFOLI' // Toffoli 门 (CCNOT)
  | 'RX'  // X 旋转
  | 'RY'  // Y 旋转
  | 'RZ'  // Z 旋转
  | 'CPHASE' // 受控相位门
  | 'MCZ' // 多控制Z门
  | 'MEASURE'; // 测量

/**
 * 单比特量子门矩阵 (行优先)
 * 形式: |0> -> [a, b]^T, |1> -> [c, d]^T
 * 矩阵为 [[a, b], [c, d]]
 */
export const GATE_MATRICES: Record<Exclude<GateType, 'CNOT' | 'CZ' | 'SWAP' | 'TOFFOLI' | 'RX' | 'RY' | 'RZ' | 'MEASURE' | 'CPHASE' | 'MCZ'>, Complex[]> = {
  // 恒等门
  I: [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }],
  // 泡利-X (NOT 门)
  X: [{ re: 0, im: 0 }, { re: 1, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }],
  // 泡利-Y
  Y: [{ re: 0, im: 0 }, { re: 0, im: -1 }, { re: 0, im: 1 }, { re: 0, im: 0 }],
  // 泡利-Z
  Z: [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: -1, im: 0 }],
  // 哈达玛门
  H: [
    { re: 1 / Math.SQRT2, im: 0 }, { re: 1 / Math.SQRT2, im: 0 },
    { re: 1 / Math.SQRT2, im: 0 }, { re: -1 / Math.SQRT2, im: 0 }
  ],
  // S 门 (相位门)
  S: [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 1 }],
  // T 门
  T: [
    { re: 1, im: 0 },
    { re: 0, im: 0 },
    { re: 0, im: 0 },
    { re: Math.cos(Math.PI / 4), im: Math.sin(Math.PI / 4) }
  ],
};

/**
 * 复数类型
 */
export interface Complex {
  re: number;
  im: number;
}

/**
 * 量子门
 */
export interface QuantumGate {
  /** 门类型 */
  type: GateType;
  /** 目标量子比特索引 */
  target: number;
  /** 控制量子比特索引 (用于双比特门) */
  control?: number;
  /** 旋转角度 (用于 RX/RY/RZ) */
  angle?: number;
  /** 门的参数 */
  params?: Record<string, number>;
}

/**
 * 量子比特状态
 */
export interface QubitState {
  /** 量子比特索引 */
  index: number;
  /** 是否被测量 */
  measured: boolean;
  /** 测量结果 (如果是已测量) */
  measurementResult?: 0 | 1;
  /**  Bloch 球角度 */
  theta?: number;
  phi?: number;
}

/**
 * 测量结果
 */
export interface MeasurementResult {
  /** 量子比特索引 */
  qubit: number;
  /** 测量结果 */
  result: 0 | 1;
  /** 结果概率 */
  probability: number;
  /** 测量后的状态 (坍缩后) */
  collapsedState: Complex[];
}

/**
 * 电路配置
 */
export interface CircuitConfig {
  /** 量子比特数量 */
  numQubits: number;
  /** 经典比特数量 (默认等于量子比特数) */
  numClassicalBits?: number;
  /** 电路名称 */
  name?: string;
}

/**
 * 量子电路类
 */
export class QuantumCircuit {
  private numQubits: number;
  private numClassicalBits: number;
  private gates: QuantumGate[] = [];
  private measuredQubits: Set<number> = new Set();
  private measurementResults: Map<number, number> = new Map();
  private name: string;

  constructor(config: CircuitConfig) {
    this.numQubits = config.numQubits;
    this.numClassicalBits = config.numClassicalBits ?? config.numQubits;
    this.name = config.name ?? `Circuit-${Date.now()}`;
  }

  /**
   * 获取量子比特数量
   */
  public getNumQubits(): number {
    return this.numQubits;
  }

  /**
   * 获取经典比特数量
   */
  public getNumClassicalBits(): number {
    return this.numClassicalBits;
  }

  /**
   * 获取电路名称
   */
  public getName(): string {
    return this.name;
  }

  /**
   * 添加单比特门
   */
  public addGate(type: Exclude<GateType, 'CNOT' | 'CZ' | 'SWAP' | 'TOFFOLI' | 'CPHASE' | 'MCZ' | 'MEASURE'>, target: number, angle?: number): this;
  public addGate(type: 'CPHASE' | 'MCZ', control: number, target: number, angle: number): this;
  public addGate(type: GateType, targetOrControl: number, targetOrAngle?: number, angle?: number): this {
    if (type === 'CPHASE' || type === 'MCZ') {
      const control = targetOrControl;
      const target = targetOrAngle!;
      const gateAngle = angle!;
      if (control < 0 || control >= this.numQubits || target < 0 || target >= this.numQubits) {
        throw new Error(`Invalid qubit indices`);
      }
      if (this.measuredQubits.has(control) || this.measuredQubits.has(target)) {
        throw new Error('Cannot apply gate to measured qubit');
      }
      this.gates.push({ type, control, target, angle: gateAngle });
    } else {
      const target = targetOrControl;
      const gateAngle = targetOrAngle;
      if (target < 0 || target >= this.numQubits) {
        throw new Error(`Invalid qubit index: ${target}`);
      }
      if (this.measuredQubits.has(target)) {
        throw new Error(`Qubit ${target} has already been measured`);
      }
      const gate: QuantumGate = { type, target };
      if (gateAngle !== undefined) {
        gate.angle = gateAngle;
      }
      this.gates.push(gate);
    }
    return this;
  }

  /**
   * 添加 CNOT 门 (控制-目标)
   */
  public cnot(control: number, target: number): this {
    if (control < 0 || control >= this.numQubits) {
      throw new Error(`Invalid control qubit: ${control}`);
    }
    if (target < 0 || target >= this.numQubits) {
      throw new Error(`Invalid target qubit: ${target}`);
    }
    if (this.measuredQubits.has(control) || this.measuredQubits.has(target)) {
      throw new Error('Cannot apply gate to measured qubit');
    }

    this.gates.push({ type: 'CNOT', control, target });
    return this;
  }

  /**
   * 添加 CZ 门
   */
  public cz(control: number, target: number): this {
    if (control < 0 || control >= this.numQubits) {
      throw new Error(`Invalid control qubit: ${control}`);
    }
    if (target < 0 || target >= this.numQubits) {
      throw new Error(`Invalid target qubit: ${target}`);
    }
    if (this.measuredQubits.has(control) || this.measuredQubits.has(target)) {
      throw new Error('Cannot apply gate to measured qubit');
    }

    this.gates.push({ type: 'CZ', control, target });
    return this;
  }

  /**
   * 添加 SWAP 门
   */
  public swap(qubit1: number, qubit2: number): this {
    if (qubit1 < 0 || qubit1 >= this.numQubits || qubit2 < 0 || qubit2 >= this.numQubits) {
      throw new Error(`Invalid qubit indices: ${qubit1}, ${qubit2}`);
    }
    if (this.measuredQubits.has(qubit1) || this.measuredQubits.has(qubit2)) {
      throw new Error('Cannot apply gate to measured qubit');
    }

    this.gates.push({ type: 'SWAP', control: qubit1, target: qubit2 });
    return this;
  }

  /**
   * 添加 Toffoli 门 (CCNOT)
   */
  public toffoli(control1: number, control2: number, target: number): this {
    if (control1 < 0 || control1 >= this.numQubits ||
        control2 < 0 || control2 >= this.numQubits ||
        target < 0 || target >= this.numQubits) {
      throw new Error(`Invalid qubit indices`);
    }
    if (this.measuredQubits.has(control1) || this.measuredQubits.has(control2) || this.measuredQubits.has(target)) {
      throw new Error('Cannot apply gate to measured qubit');
    }

    this.gates.push({ type: 'TOFFOLI', control: control1, target, params: { control2 } });
    return this;
  }

  /**
   * 添加旋转门
   */
  public rx(target: number, angle: number): this {
    return this.addGate('RX', target, angle);
  }

  public ry(target: number, angle: number): this {
    return this.addGate('RY', target, angle);
  }

  public rz(target: number, angle: number): this {
    return this.addGate('RZ', target, angle);
  }

  /**
   * 测量指定量子比特
   */
  public measure(target: number): this {
    if (target < 0 || target >= this.numQubits) {
      throw new Error(`Invalid qubit index: ${target}`);
    }
    if (this.measuredQubits.has(target)) {
      throw new Error(`Qubit ${target} already measured`);
    }

    this.measuredQubits.add(target);
    this.gates.push({ type: 'MEASURE', target });
    return this;
  }

  /**
   * 测量所有量子比特
   */
  public measureAll(): this {
    for (let i = 0; i < this.numQubits; i++) {
      if (!this.measuredQubits.has(i)) {
        this.measure(i);
      }
    }
    return this;
  }

  /**
   * 获取所有门
   */
  public getGates(): QuantumGate[] {
    return [...this.gates];
  }

  /**
   * 获取已测量的量子比特
   */
  public getMeasuredQubits(): number[] {
    return Array.from(this.measuredQubits);
  }

  /**
   * 获取测量结果
   */
  public getMeasurementResult(qubit: number): number | undefined {
    return this.measurementResults.get(qubit);
  }

  /**
   * 获取所有测量结果
   */
  public getAllMeasurementResults(): Map<number, number> {
    return new Map(this.measurementResults);
  }

  /**
   * 设置测量结果 (用于模拟器)
   */
  public setMeasurementResult(qubit: number, result: number): void {
    this.measurementResults.set(qubit, result);
  }

  /**
   * 获取电路深度 (最大门数路径)
   */
  public getDepth(): number {
    // 简化实现：返回总门数
    return this.gates.length;
  }

  /**
   * 获取门数量
   */
  public getGateCount(): { single: number; double: number; measure: number } {
    let single = 0, double = 0, measure = 0;
    for (const gate of this.gates) {
      if (gate.type === 'MEASURE') measure++;
      else if (gate.control !== undefined) double++;
      else single++;
    }
    return { single, double, measure };
  }

  /**
   * 创建 Bell 态电路
   */
  public static createBellState(qubit0: number = 0, qubit1: number = 1): QuantumCircuit {
    const circuit = new QuantumCircuit({ numQubits: Math.max(qubit0, qubit1) + 1, name: 'BellState' });
    circuit.h(qubit0);
    circuit.cnot(qubit0, qubit1);
    return circuit;
  }

  /**
   * 创建 GHZ 态电路
   */
  public static createGHZState(numQubits: number): QuantumCircuit {
    const circuit = new QuantumCircuit({ numQubits, name: 'GHZState' });
    circuit.h(0);
    for (let i = 0; i < numQubits - 1; i++) {
      circuit.cnot(i, i + 1);
    }
    return circuit;
  }

  /**
   * 创建量子傅里叶变换 (QFT) 电路
   */
  public static createQFT(numQubits: number): QuantumCircuit {
    const circuit = new QuantumCircuit({ numQubits, name: 'QFT' });
    for (let i = 0; i < numQubits; i++) {
      circuit.h(i);
      for (let j = i + 1; j < numQubits; j++) {
        const angle = Math.PI / Math.pow(2, j - i);
        circuit.addGate('CPHASE', j, i, angle);
      }
    }
    // 交换比特 (QFT 结束时需要)
    for (let i = 0; i < Math.floor(numQubits / 2); i++) {
      circuit.swap(i, numQubits - 1 - i);
    }
    return circuit;
  }

  /**
   * 创建 Grover 搜索迭代电路
   */
  public static createGroverIteration(numQubits: number, targetState: number): QuantumCircuit {
    const circuit = new QuantumCircuit({ numQubits, name: 'GroverIter' });

    // Oracle: 翻转目标状态的相位
    let binary = targetState.toString(2).padStart(numQubits, '0');
    for (let i = 0; i < numQubits; i++) {
      if (binary[i] === '0') {
        circuit.x(i);
      }
    }
    // 多控制 Z 门
    if (numQubits > 1) {
      circuit.addGate('MCZ', numQubits - 1, 0, numQubits - 1);
    } else {
      circuit.z(0);
    }
    for (let i = 0; i < numQubits; i++) {
      if (binary[i] === '0') {
        circuit.x(i);
      }
    }

    // 扩散算子
    for (let i = 0; i < numQubits; i++) {
      circuit.h(i);
      circuit.x(i);
    }
    circuit.addGate('MCZ', numQubits - 1, 0, numQubits - 1);
    for (let i = 0; i < numQubits; i++) {
      circuit.x(i);
      circuit.h(i);
    }

    return circuit;
  }

  /**
   * 快捷方法
   */
  public x(target: number): this { return this.addGate('X', target); }
  public y(target: number): this { return this.addGate('Y', target); }
  public z(target: number): this { return this.addGate('Z', target); }
  public h(target: number): this { return this.addGate('H', target); }
  public s(target: number): this { return this.addGate('S', target); }
  public t(target: number): this { return this.addGate('T', target); }

  /**
   * 清除电路
   */
  public clear(): void {
    this.gates = [];
    this.measuredQubits.clear();
    this.measurementResults.clear();
  }

  /**
   * 克隆电路
   */
  public clone(): QuantumCircuit {
    const cloned = new QuantumCircuit({
      numQubits: this.numQubits,
      numClassicalBits: this.numClassicalBits,
      name: this.name,
    });
    cloned.gates = [...this.gates];
    cloned.measuredQubits = new Set(this.measuredQubits);
    cloned.measurementResults = new Map(this.measurementResults);
    return cloned;
  }

  /**
   * 序列化
   */
  public serialize(): {
    numQubits: number;
    numClassicalBits: number;
    name: string;
    gates: QuantumGate[];
  } {
    return {
      numQubits: this.numQubits,
      numClassicalBits: this.numClassicalBits,
      name: this.name,
      gates: this.gates,
    };
  }

  /**
   * 反序列化
   */
  public static deserialize(data: ReturnType<QuantumCircuit['serialize']>): QuantumCircuit {
    const circuit = new QuantumCircuit({
      numQubits: data.numQubits,
      numClassicalBits: data.numClassicalBits,
      name: data.name,
    });
    circuit.gates = data.gates;
    circuit.measuredQubits = new Set(
      data.gates.filter(g => g.type === 'MEASURE').map(g => g.target)
    );
    return circuit;
  }
}

/**
 * 辅助函数：复数乘法
 */
export function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/**
 * 辅助函数：复数加法
 */
export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

/**
 * 辅助函数：复数共轭
 */
export function complexConj(c: Complex): Complex {
  return { re: c.re, im: -c.im };
}

/**
 * 辅助函数：复数模
 */
export function complexMag(c: Complex): number {
  return Math.sqrt(c.re * c.re + c.im * c.im);
}

/**
 * 辅助函数：复数幂 (用于旋转门)
 */
export function complexExp(im: number): Complex {
  return {
    re: Math.cos(im),
    im: Math.sin(im),
  };
}
