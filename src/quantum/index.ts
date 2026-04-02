/**
 * 量子电路模拟系统
 * 实现量子比特、门操作和状态向量模拟
 */

// QuantumCircuit - 量子比特和门操作
export { QuantumCircuit } from './QuantumCircuit';
export type {
  QuantumGate,
  GateType,
  MeasurementResult,
  CircuitConfig,
  QubitState,
} from './QuantumCircuit';

// QuantumSimulator - 状态向量模拟
export { QuantumSimulator, createSimulator } from './QuantumSimulator';
export type {
  SimulationConfig,
  SimulationResult,
  StateVector,
  StateSnapshot,
} from './QuantumSimulator';

// QuantumGateRenderer - 电路可视化
export { QuantumGateRenderer } from './QuantumGateRenderer';
export type {
  GateRenderConfig,
  GateColors,
  CircuitVisualization,
  GatePosition,
  QubitRow,
} from './QuantumGateRenderer';
