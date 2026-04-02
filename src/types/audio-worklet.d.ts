/**
 * AudioWorklet Type Declarations
 * Web Audio API AudioWorklet 全局类型声明
 */

declare global {
  // AudioWorklet 全局作用域变量
  declare const sampleRate: number;
  declare const currentTime: number;
  declare const currentFrame: number;
  
  // AudioWorkletProcessor 基类
  class AudioWorkletProcessor {
    readonly port: MessagePort;
    constructor(options?: AudioWorkletNodeOptions);
  }
  
  // 注册处理器
  function registerProcessor(
    name: string,
    processorCtor: typeof AudioWorkletProcessor
  ): void;
  
  // AudioWorkletNode 选项
  interface AudioWorkletNodeOptions {
    numberOfInputs?: number;
    numberOfOutputs?: number;
    outputChannelCount?: number[];
    parameterData?: Record<string, number>;
    processorOptions?: unknown;
  }
  
  // AudioParamDescriptor
  interface AudioParamDescriptor {
    name: string;
    automationRate?: 'a-rate' | 'k-rate';
    minValue?: number;
    maxValue?: number;
    defaultValue: number;
  }
}

export {};
