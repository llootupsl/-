/* tslint:disable */
/* eslint-disable */

/**
 * 八字
 */
export class BaziEngine {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * 获取日主强弱
     */
    day_master_strength(): string;
    /**
     * 计算五行强弱
     */
    element_strength(): string;
    /**
     * 创建八字排盘
     */
    constructor(year: number, month: number, day: number, hour: number);
    /**
     * 获取八字JSON表示
     */
    to_json(): string;
    /**
     * 获取八字字符串
     */
    to_string(): string;
}

/**
 * A* 寻路器
 */
export class PathFinder {
    free(): void;
    [Symbol.dispose](): void;
    find_nearest(start_x: number, start_y: number, targets: Int32Array, obstacles: Uint8Array): Int32Array;
    find_path(start_x: number, start_y: number, end_x: number, end_y: number, obstacles: Uint8Array, diagonal: boolean): Int32Array;
    constructor(width: number, height: number);
    path_length(path: Int32Array): number;
}

/**
 * 量子模拟器
 */
export class QuantumSimulator {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * 运行贝尔态测试
     */
    bell_test(): boolean;
    /**
     * 应用 CNOT 门（控制-非门）
     */
    cnot(control: number, target: number): void;
    /**
     * 计算量子电路的纠缠度
     */
    entanglement(): number;
    /**
     * 获取特定量子比特的概率幅
     */
    get_amplitudes(qubit_idx: number): Float64Array;
    /**
     * 应用 Hadamard 门
     */
    hadamard(qubit_idx: number): void;
    /**
     * 测量单个量子比特
     */
    measure(qubit_idx: number): number;
    /**
     * 测量所有量子比特
     */
    measure_all(): Uint8Array;
    /**
     * 创建新的量子模拟器
     */
    constructor(num_qubits: number);
    /**
     * 获取量子比特数量
     */
    num_qubits(): number;
    /**
     * 应用 Pauli-X 门（量子非门）
     */
    pauli_x(qubit_idx: number): void;
    /**
     * 应用 Pauli-Y 门
     */
    pauli_y(qubit_idx: number): void;
    /**
     * 应用 Pauli-Z 门
     */
    pauli_z(qubit_idx: number): void;
    /**
     * 重置量子比特到 |0⟩ 态
     */
    reset(): void;
    /**
     * 应用旋转门
     */
    rotate_x(qubit_idx: number, theta: number): void;
    /**
     * 应用旋转门
     */
    rotate_y(qubit_idx: number, theta: number): void;
    /**
     * 应用旋转门
     */
    rotate_z(qubit_idx: number, theta: number): void;
}

/**
 * 脉冲神经网络
 */
export class SpikingNeuralNetwork {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * 添加噪声
     */
    add_noise(amplitude: number): void;
    /**
     * STDP 学习
     */
    apply_stdp(pre_spikes: Float32Array, post_spikes: Float32Array, num_inputs: number): void;
    /**
     * 获取膜电位
     */
    get_membrane_potentials(): Float32Array;
    /**
     * 创建新的 SNN
     */
    constructor(num_neurons: number, num_inputs: number);
    /**
     * 获取神经元数量
     */
    num_neurons(): number;
    /**
     * 重置网络状态
     */
    reset(): void;
    /**
     * 前向传播一步，返回脉冲数量
     */
    step(inputs: Float32Array, dt: number, current_time: number, threshold: number, num_inputs: number): number;
    /**
     * 获取总发放率
     */
    total_firing_rate(time_window_ms: number, current_time: number): number;
}

/**
 * 性能测试：执行大量数学运算
 */
export function benchmark_math(iterations: number): number;

/**
 * 性能测试：矩阵乘法
 */
export function benchmark_matrix_multiply(size: number): number;

/**
 * 获取编译信息
 */
export function get_build_info(): string;

/**
 * 获取模块版本
 */
export function get_version(): string;

export function init(): void;

/**
 * 获取当前时间戳（毫秒）
 */
export function timestamp_ms(): number;

/**
 * 获取高精度时间戳（纳秒）
 */
export function timestamp_ns(): bigint;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_baziengine_free: (a: number, b: number) => void;
    readonly __wbg_pathfinder_free: (a: number, b: number) => void;
    readonly __wbg_quantumsimulator_free: (a: number, b: number) => void;
    readonly __wbg_spikingneuralnetwork_free: (a: number, b: number) => void;
    readonly baziengine_day_master_strength: (a: number) => [number, number];
    readonly baziengine_element_strength: (a: number) => [number, number];
    readonly baziengine_new: (a: number, b: number, c: number, d: number) => number;
    readonly baziengine_to_json: (a: number) => [number, number];
    readonly baziengine_to_string: (a: number) => [number, number];
    readonly benchmark_matrix_multiply: (a: number) => number;
    readonly get_build_info: () => [number, number];
    readonly get_version: () => [number, number];
    readonly pathfinder_find_nearest: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly pathfinder_find_path: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly pathfinder_path_length: (a: number, b: number, c: number) => number;
    readonly quantumsimulator_bell_test: (a: number) => number;
    readonly quantumsimulator_cnot: (a: number, b: number, c: number) => void;
    readonly quantumsimulator_entanglement: (a: number) => number;
    readonly quantumsimulator_get_amplitudes: (a: number, b: number) => [number, number];
    readonly quantumsimulator_hadamard: (a: number, b: number) => void;
    readonly quantumsimulator_measure: (a: number, b: number) => number;
    readonly quantumsimulator_measure_all: (a: number) => [number, number];
    readonly quantumsimulator_new: (a: number) => number;
    readonly quantumsimulator_num_qubits: (a: number) => number;
    readonly quantumsimulator_pauli_x: (a: number, b: number) => void;
    readonly quantumsimulator_pauli_y: (a: number, b: number) => void;
    readonly quantumsimulator_pauli_z: (a: number, b: number) => void;
    readonly quantumsimulator_reset: (a: number) => void;
    readonly quantumsimulator_rotate_x: (a: number, b: number, c: number) => void;
    readonly quantumsimulator_rotate_y: (a: number, b: number, c: number) => void;
    readonly quantumsimulator_rotate_z: (a: number, b: number, c: number) => void;
    readonly spikingneuralnetwork_add_noise: (a: number, b: number) => void;
    readonly spikingneuralnetwork_apply_stdp: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly spikingneuralnetwork_get_membrane_potentials: (a: number) => [number, number];
    readonly spikingneuralnetwork_new: (a: number, b: number) => number;
    readonly spikingneuralnetwork_num_neurons: (a: number) => number;
    readonly spikingneuralnetwork_reset: (a: number) => void;
    readonly spikingneuralnetwork_step: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
    readonly spikingneuralnetwork_total_firing_rate: (a: number, b: number, c: number) => number;
    readonly timestamp_ns: () => bigint;
    readonly init: () => void;
    readonly timestamp_ms: () => number;
    readonly benchmark_math: (a: number) => number;
    readonly pathfinder_new: (a: number, b: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
