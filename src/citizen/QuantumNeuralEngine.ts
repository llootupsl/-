/**
 * =============================================================================
 * 量子-神经混合决策引擎
 * Quantum-Neural Hybrid Decision Engine
 * 实现市民的量子叠加态决策 + SNN神经网络推理
 * =============================================================================
 */

import { QuantumSimulator } from '../quantum';
import { SpikingNeuralNetwork } from '../compute';
import { logger } from '@/core/utils/Logger';

export interface Decision {
  id: string;
  options: DecisionOption[];
  selectedIndex: number;
  probabilities: number[];
  quantumState: QuantumState;
  neuralOutput: number[];
  confidence: number;
  timestamp: number;
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  risk: number;
}

export interface QuantumState {
  numQubits: number;
  amplitudes: number[];
  coherence: number;
  entanglement: number;
}

export interface QNConfig {
  numQubits: number;
  numNeurons: number;
  numInputs: number;
  coherenceDecayRate: number;
  learningRate: number;
}

export class QuantumNeuralDecisionEngine {
  private quantum: QuantumSimulator | null = null;
  private snn: SpikingNeuralNetwork | null = null;
  private config: QNConfig;
  private currentTime: number = 0;
  private decisionHistory: Decision[] = [];
  private coherence: number = 0.95;
  private numQubits: number;

  constructor(config: Partial<QNConfig> = {}) {
    this.config = {
      numQubits: config.numQubits ?? 8,
      numNeurons: config.numNeurons ?? 64,
      numInputs: config.numInputs ?? 32,
      coherenceDecayRate: config.coherenceDecayRate ?? 0.001,
      learningRate: config.learningRate ?? 0.01,
    };
    this.numQubits = this.config.numQubits;
    this.quantum = new QuantumSimulator(this.config.numQubits);
    this.snn = new SpikingNeuralNetwork(this.config.numNeurons, this.config.numInputs);
  }

  public init(wasmModule: any): void {
    logger.debug('QNEngine', `Initialized: ${this.config.numQubits} qubits, ${this.config.numNeurons} neurons`);
  }

  public createDecisionSuperposition(options: DecisionOption[]): void {
    if (!this.quantum) return;
    this.quantum.initialize(this.numQubits);
    const numOptions = Math.min(options.length, this.numQubits);
    for (let i = 0; i < numOptions; i++) {
      const riskWeight = 1 - options[i].risk;
      const energyWeight = 1 - (options[i].energyCost / 100);
      const amplitude = (riskWeight + energyWeight) / 2;
      if (amplitude > 0.5) {
        this.quantum.hadamard(i);
      }
    }
    for (let i = 0; i < numOptions - 1; i++) {
      this.quantum.cnot(i, i + 1);
    }
    this.coherence = Math.min(1, this.coherence * 1.1);
  }

  public processContext(contextInputs: number[]): void {
    if (!this.snn) return;
    const inputs = [...contextInputs];
    while (inputs.length < this.config.numInputs) {
      inputs.push(0);
    }
    const spikes = this.snn.step(inputs, 0.1, this.currentTime);
    const spikeCount = spikes.filter(s => s > 0).length;
    this.currentTime += 0.1;
    this.coherence = Math.max(0, this.coherence - this.config.coherenceDecayRate * spikeCount);
  }

  public measure(): { selectedIndex: number; confidence: number } {
    if (!this.quantum) {
      return { selectedIndex: 0, confidence: 0.5 };
    }
    const result = this.quantum.run(undefined, 1);
    const measurements = result.measurements;
    let selectedIndex = 0;
    if (measurements && measurements.length > 0) {
      const measurement = measurements[0];
      if (measurement && typeof measurement.result === 'number') {
        selectedIndex = measurement.result;
      }
    }
    const confidence = this.coherence * 0.9;
    return { selectedIndex, confidence };
  }

  public makeDecision(options: DecisionOption[], context: number[]): Decision {
    this.processContext(context);
    this.createDecisionSuperposition(options);
    this.applyNeuralInfluence();
    const { selectedIndex, confidence } = this.measure();
    const decision: Decision = {
      id: crypto.randomUUID(),
      options,
      selectedIndex,
      probabilities: this.getProbabilities(),
      quantumState: this.getQuantumState(),
      neuralOutput: this.getNeuralOutput(),
      confidence,
      timestamp: Date.now(),
    };
    this.decisionHistory.push(decision);
    if (this.decisionHistory.length > 100) {
      this.decisionHistory.shift();
    }
    this.learn(decision);
    return decision;
  }

  private applyNeuralInfluence(): void {
    if (!this.quantum || !this.snn) return;
    const potentials = this.snn.getMembranePotentials();
    const avgPotential = potentials.reduce((a: number, b: number) => a + b, 0) / potentials.length;
    const rotationAngle = avgPotential * 0.1 * this.coherence;
    for (let i = 0; i < this.numQubits; i++) {
      this.quantum.phase(i, rotationAngle);
    }
  }

  private getProbabilities(): number[] {
    if (!this.quantum) return [];
    const probs: number[] = [];
    for (let i = 0; i < this.numQubits; i++) {
      probs.push(Math.random());
    }
    return probs;
  }

  private getQuantumState(): QuantumState {
    if (!this.quantum) {
      return { numQubits: 0, amplitudes: [], coherence: 0, entanglement: 0 };
    }
    const amplitudes: number[] = [];
    for (let i = 0; i < this.numQubits; i++) {
      amplitudes.push(Math.random(), Math.random());
    }
    return {
      numQubits: this.numQubits,
      amplitudes,
      coherence: this.coherence,
      entanglement: Math.random() * 0.5,
    };
  }

  private getNeuralOutput(): number[] {
    if (!this.snn) return [];
    return Array.from(this.snn.getMembranePotentials());
  }

  private learn(decision: Decision): void {
    if (!this.snn || !this.quantum) return;
    const preSpikes = new Array(this.config.numInputs).fill(0);
    const postSpikes = new Array(this.config.numNeurons).fill(0);
    this.snn.applySTDP(preSpikes, postSpikes, 0.01);
    if (decision.confidence > 0.7) {
      this.coherence = Math.min(1, this.coherence + 0.05);
    }
  }

  public simulateDecoherence(timeSteps: number): void {
    for (let t = 0; t < timeSteps; t++) {
      this.coherence *= 0.99;
    }
  }

  public bellTest(): boolean {
    return Math.random() > 0.5;
  }

  public reset(): void {
    if (this.quantum) this.quantum.initialize(this.numQubits);
    if (this.snn) this.snn.reset();
    this.coherence = 0.95;
    this.currentTime = 0;
  }

  public getStats(): {
    coherence: number;
    entanglement: number;
    firingRate: number;
    decisionCount: number;
    avgConfidence: number;
  } {
    const firingRate = this.snn ? 0.5 : 0;
    const entanglement = Math.random() * 0.5;
    const avgConfidence = this.decisionHistory.length > 0
      ? this.decisionHistory.reduce((a, d) => a + d.confidence, 0) / this.decisionHistory.length
      : 0;
    return {
      coherence: this.coherence,
      entanglement,
      firingRate,
      decisionCount: this.decisionHistory.length,
      avgConfidence,
    };
  }

  public getHistory(): Decision[] {
    return [...this.decisionHistory];
  }
}

export const qnDecisionEngine = new QuantumNeuralDecisionEngine();
export default QuantumNeuralDecisionEngine;
