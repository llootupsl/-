/**
 * =============================================================================
 * 脉冲神经网络 - Spiking Neural Network (SNN)
 * Leaky Integrate-and-Fire (LIF) 神经元模型 + STDP学习规则
 * =============================================================================
 */

export interface NeuronParams {
  weights: Float32Array;
  threshold: number;
  tau: number;
  resetPotential: number;
}

export class SpikingNeuralNetwork {
  private numNeurons: number;
  private inputSize: number;
  private neurons: NeuronParams[];
  private membranePotentials: Float32Array;
  private lastSpikeTimes: Float32Array;
  private spiked: Uint8Array;
  private fireHistory: number[][];

  constructor(numNeurons: number, inputSize: number) {
    this.numNeurons = numNeurons;
    this.inputSize = inputSize;
    this.neurons = [];
    this.membranePotentials = new Float32Array(numNeurons);
    this.lastSpikeTimes = new Float32Array(numNeurons);
    this.spiked = new Uint8Array(numNeurons);
    this.fireHistory = [];

    this.initializeNeurons();
  }

  private initializeNeurons(): void {
    const scale = Math.sqrt(2.0 / this.inputSize);
    for (let i = 0; i < this.numNeurons; i++) {
      const weights = new Float32Array(this.inputSize);
      for (let j = 0; j < this.inputSize; j++) {
        weights[j] = (Math.random() * 2 - 1) * scale;
      }
      this.neurons.push({
        weights,
        threshold: 1.0,
        tau: 20.0,
        resetPotential: 0.0,
      });
    }
  }

  /**
   * 前向传播一步
   * @param inputs 输入信号
   * @param dt 时间步长
   * @param currentTime 当前时间
   */
  public step(inputs: number[], dt: number, currentTime: number): number[] {
    this.spiked.fill(0);

    for (let i = 0; i < this.numNeurons; i++) {
      const neuron = this.neurons[i];
      let inputCurrent = 0;

      for (let j = 0; j < Math.min(inputs.length, this.inputSize); j++) {
        inputCurrent += neuron.weights[j] * inputs[j];
      }

      const v = this.membranePotentials[i];
      const dv = (-v / neuron.tau + inputCurrent) * dt;
      this.membranePotentials[i] = v + dv;

      if (this.membranePotentials[i] >= neuron.threshold) {
        this.membranePotentials[i] = neuron.resetPotential;
        this.lastSpikeTimes[i] = currentTime;
        this.spiked[i] = 1;
      }
    }

    return Array.from(this.spiked);
  }

  /**
   * STDP (Spike-Timing Dependent Plasticity) 学习
   */
  public applySTDP(preSpikes: number[], postSpikes: number[], dt: number): void {
    const aPlus = 0.01;
    const aMinus = 0.01;
    const tauPlus = 20.0;
    const tauMinus = 20.0;

    for (let i = 0; i < this.numNeurons; i++) {
      const neuron = this.neurons[i];
      for (let j = 0; j < Math.min(preSpikes.length, this.inputSize); j++) {
        const pre = preSpikes[j] > 0.5;
        const post = postSpikes[i] > 0.5;

        if (pre && !post) {
          const deltaW = aPlus * Math.exp(-Math.abs(neuron.weights[j])) * dt;
          neuron.weights[j] = Math.max(-1, Math.min(1, neuron.weights[j] + deltaW));
        } else if (!pre && post) {
          const deltaW = -aMinus * Math.exp(Math.abs(neuron.weights[j])) * dt;
          neuron.weights[j] = Math.max(-1, Math.min(1, neuron.weights[j] + deltaW));
        }
      }
    }
  }

  /** 获取发放率 */
  public getFiringRate(windowMs: number = 100): number {
    const now = performance.now();
    let spikes = 0;
    for (let i = 0; i < this.numNeurons; i++) {
      if (now - this.lastSpikeTimes[i] < windowMs) {
        spikes++;
      }
    }
    return spikes / (this.numNeurons * (windowMs / 1000));
  }

  /** 获取膜电位 */
  public getMembranePotentials(): Float32Array {
    return this.membranePotentials;
  }

  /** 重置所有神经元状态 */
  public reset(): void {
    this.membranePotentials.fill(0);
    this.spiked.fill(0);
    this.lastSpikeTimes.fill(0);
  }

  /** 获取神经元数量 */
  public getNeuronCount(): number {
    return this.numNeurons;
  }
}
