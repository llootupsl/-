/* @ts-self-types="./omnis_apien_wasm.d.ts" */

/**
 * 八字
 */
export class BaziEngine {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BaziEngineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_baziengine_free(ptr, 0);
    }
    /**
     * 获取日主强弱
     * @returns {string}
     */
    day_master_strength() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.baziengine_day_master_strength(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * 计算五行强弱
     * @returns {string}
     */
    element_strength() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.baziengine_element_strength(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * 创建八字排盘
     * @param {number} year
     * @param {number} month
     * @param {number} day
     * @param {number} hour
     */
    constructor(year, month, day, hour) {
        const ret = wasm.baziengine_new(year, month, day, hour);
        this.__wbg_ptr = ret >>> 0;
        BaziEngineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * 获取八字JSON表示
     * @returns {string}
     */
    to_json() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.baziengine_to_json(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * 获取八字字符串
     * @returns {string}
     */
    to_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.baziengine_to_string(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) BaziEngine.prototype[Symbol.dispose] = BaziEngine.prototype.free;

/**
 * A* 寻路器
 */
export class PathFinder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PathFinderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pathfinder_free(ptr, 0);
    }
    /**
     * @param {number} start_x
     * @param {number} start_y
     * @param {Int32Array} targets
     * @param {Uint8Array} obstacles
     * @returns {Int32Array}
     */
    find_nearest(start_x, start_y, targets, obstacles) {
        const ptr0 = passArray32ToWasm0(targets, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(obstacles, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.pathfinder_find_nearest(this.__wbg_ptr, start_x, start_y, ptr0, len0, ptr1, len1);
        var v3 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v3;
    }
    /**
     * @param {number} start_x
     * @param {number} start_y
     * @param {number} end_x
     * @param {number} end_y
     * @param {Uint8Array} obstacles
     * @param {boolean} diagonal
     * @returns {Int32Array}
     */
    find_path(start_x, start_y, end_x, end_y, obstacles, diagonal) {
        const ptr0 = passArray8ToWasm0(obstacles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.pathfinder_find_path(this.__wbg_ptr, start_x, start_y, end_x, end_y, ptr0, len0, diagonal);
        var v2 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        const ret = wasm.pathfinder_new(width, height);
        this.__wbg_ptr = ret >>> 0;
        PathFinderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Int32Array} path
     * @returns {number}
     */
    path_length(path) {
        const ptr0 = passArray32ToWasm0(path, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.pathfinder_path_length(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
}
if (Symbol.dispose) PathFinder.prototype[Symbol.dispose] = PathFinder.prototype.free;

/**
 * 量子模拟器
 */
export class QuantumSimulator {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QuantumSimulatorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_quantumsimulator_free(ptr, 0);
    }
    /**
     * 运行贝尔态测试
     * @returns {boolean}
     */
    bell_test() {
        const ret = wasm.quantumsimulator_bell_test(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * 应用 CNOT 门（控制-非门）
     * @param {number} control
     * @param {number} target
     */
    cnot(control, target) {
        wasm.quantumsimulator_cnot(this.__wbg_ptr, control, target);
    }
    /**
     * 计算量子电路的纠缠度
     * @returns {number}
     */
    entanglement() {
        const ret = wasm.quantumsimulator_entanglement(this.__wbg_ptr);
        return ret;
    }
    /**
     * 获取特定量子比特的概率幅
     * @param {number} qubit_idx
     * @returns {Float64Array}
     */
    get_amplitudes(qubit_idx) {
        const ret = wasm.quantumsimulator_get_amplitudes(this.__wbg_ptr, qubit_idx);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * 应用 Hadamard 门
     * @param {number} qubit_idx
     */
    hadamard(qubit_idx) {
        wasm.quantumsimulator_hadamard(this.__wbg_ptr, qubit_idx);
    }
    /**
     * 测量单个量子比特
     * @param {number} qubit_idx
     * @returns {number}
     */
    measure(qubit_idx) {
        const ret = wasm.quantumsimulator_measure(this.__wbg_ptr, qubit_idx);
        return ret;
    }
    /**
     * 测量所有量子比特
     * @returns {Uint8Array}
     */
    measure_all() {
        const ret = wasm.quantumsimulator_measure_all(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * 创建新的量子模拟器
     * @param {number} num_qubits
     */
    constructor(num_qubits) {
        const ret = wasm.quantumsimulator_new(num_qubits);
        this.__wbg_ptr = ret >>> 0;
        QuantumSimulatorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * 获取量子比特数量
     * @returns {number}
     */
    num_qubits() {
        const ret = wasm.quantumsimulator_num_qubits(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 应用 Pauli-X 门（量子非门）
     * @param {number} qubit_idx
     */
    pauli_x(qubit_idx) {
        wasm.quantumsimulator_pauli_x(this.__wbg_ptr, qubit_idx);
    }
    /**
     * 应用 Pauli-Y 门
     * @param {number} qubit_idx
     */
    pauli_y(qubit_idx) {
        wasm.quantumsimulator_pauli_y(this.__wbg_ptr, qubit_idx);
    }
    /**
     * 应用 Pauli-Z 门
     * @param {number} qubit_idx
     */
    pauli_z(qubit_idx) {
        wasm.quantumsimulator_pauli_z(this.__wbg_ptr, qubit_idx);
    }
    /**
     * 重置量子比特到 |0⟩ 态
     */
    reset() {
        wasm.quantumsimulator_reset(this.__wbg_ptr);
    }
    /**
     * 应用旋转门
     * @param {number} qubit_idx
     * @param {number} theta
     */
    rotate_x(qubit_idx, theta) {
        wasm.quantumsimulator_rotate_x(this.__wbg_ptr, qubit_idx, theta);
    }
    /**
     * 应用旋转门
     * @param {number} qubit_idx
     * @param {number} theta
     */
    rotate_y(qubit_idx, theta) {
        wasm.quantumsimulator_rotate_y(this.__wbg_ptr, qubit_idx, theta);
    }
    /**
     * 应用旋转门
     * @param {number} qubit_idx
     * @param {number} theta
     */
    rotate_z(qubit_idx, theta) {
        wasm.quantumsimulator_rotate_z(this.__wbg_ptr, qubit_idx, theta);
    }
}
if (Symbol.dispose) QuantumSimulator.prototype[Symbol.dispose] = QuantumSimulator.prototype.free;

/**
 * 脉冲神经网络
 */
export class SpikingNeuralNetwork {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SpikingNeuralNetworkFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_spikingneuralnetwork_free(ptr, 0);
    }
    /**
     * 添加噪声
     * @param {number} amplitude
     */
    add_noise(amplitude) {
        wasm.spikingneuralnetwork_add_noise(this.__wbg_ptr, amplitude);
    }
    /**
     * STDP 学习
     * @param {Float32Array} pre_spikes
     * @param {Float32Array} post_spikes
     * @param {number} num_inputs
     */
    apply_stdp(pre_spikes, post_spikes, num_inputs) {
        const ptr0 = passArrayF32ToWasm0(pre_spikes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(post_spikes, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.spikingneuralnetwork_apply_stdp(this.__wbg_ptr, ptr0, len0, ptr1, len1, num_inputs);
    }
    /**
     * 获取膜电位
     * @returns {Float32Array}
     */
    get_membrane_potentials() {
        const ret = wasm.spikingneuralnetwork_get_membrane_potentials(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 创建新的 SNN
     * @param {number} num_neurons
     * @param {number} num_inputs
     */
    constructor(num_neurons, num_inputs) {
        const ret = wasm.spikingneuralnetwork_new(num_neurons, num_inputs);
        this.__wbg_ptr = ret >>> 0;
        SpikingNeuralNetworkFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * 获取神经元数量
     * @returns {number}
     */
    num_neurons() {
        const ret = wasm.spikingneuralnetwork_num_neurons(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 重置网络状态
     */
    reset() {
        wasm.spikingneuralnetwork_reset(this.__wbg_ptr);
    }
    /**
     * 前向传播一步，返回脉冲数量
     * @param {Float32Array} inputs
     * @param {number} dt
     * @param {number} current_time
     * @param {number} threshold
     * @param {number} num_inputs
     * @returns {number}
     */
    step(inputs, dt, current_time, threshold, num_inputs) {
        const ptr0 = passArrayF32ToWasm0(inputs, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spikingneuralnetwork_step(this.__wbg_ptr, ptr0, len0, dt, current_time, threshold, num_inputs);
        return ret >>> 0;
    }
    /**
     * 获取总发放率
     * @param {number} time_window_ms
     * @param {number} current_time
     * @returns {number}
     */
    total_firing_rate(time_window_ms, current_time) {
        const ret = wasm.spikingneuralnetwork_total_firing_rate(this.__wbg_ptr, time_window_ms, current_time);
        return ret;
    }
}
if (Symbol.dispose) SpikingNeuralNetwork.prototype[Symbol.dispose] = SpikingNeuralNetwork.prototype.free;

/**
 * 性能测试：执行大量数学运算
 * @param {number} iterations
 * @returns {number}
 */
export function benchmark_math(iterations) {
    const ret = wasm.benchmark_math(iterations);
    return ret;
}

/**
 * 性能测试：矩阵乘法
 * @param {number} size
 * @returns {number}
 */
export function benchmark_matrix_multiply(size) {
    const ret = wasm.benchmark_matrix_multiply(size);
    return ret;
}

/**
 * 获取编译信息
 * @returns {string}
 */
export function get_build_info() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_build_info();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * 获取模块版本
 * @returns {string}
 */
export function get_version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

export function init() {
    wasm.init();
}

/**
 * 获取当前时间戳（毫秒）
 * @returns {number}
 */
export function timestamp_ms() {
    const ret = wasm.timestamp_ms();
    return ret;
}

/**
 * 获取高精度时间戳（纳秒）
 * @returns {bigint}
 */
export function timestamp_ns() {
    const ret = wasm.timestamp_ns();
    return BigInt.asUintN(64, ret);
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_is_function_3c846841762788c1: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_781bc9f159099513: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_7ef6b97b02428fae: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_52709e72fb9f179c: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_throw_6ddd609b62940d55: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_2d781c1f4d5c0ef8: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_crypto_38df2bab126b63dc: function(arg0) {
            const ret = arg0.crypto;
            return ret;
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getRandomValues_c44a50d8cfdaebeb: function() { return handleError(function (arg0, arg1) {
            arg0.getRandomValues(arg1);
        }, arguments); },
        __wbg_length_ea16607d7b61445b: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_msCrypto_bd5a034af96bcba6: function(arg0) {
            const ret = arg0.msCrypto;
            return ret;
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_with_length_825018a1616e9e55: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_node_84ea875411254db1: function(arg0) {
            const ret = arg0.node;
            return ret;
        },
        __wbg_now_16f0c993d5dd6c27: function() {
            const ret = Date.now();
            return ret;
        },
        __wbg_process_44c7a14e11e9f69e: function(arg0) {
            const ret = arg0.process;
            return ret;
        },
        __wbg_prototypesetcall_d62e5099504357e6: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_randomFillSync_6c25eac9869eb53c: function() { return handleError(function (arg0, arg1) {
            arg0.randomFillSync(arg1);
        }, arguments); },
        __wbg_require_b4edbdcf3e2a1ef0: function() { return handleError(function () {
            const ret = module.require;
            return ret;
        }, arguments); },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_8adb955bd33fac2f: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_ad356e0db91c7913: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_f207c857566db248: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_bb9f1ba69d61b386: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subarray_a068d24e39478a8a: function(arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_versions_276b2795b1c6a219: function(arg0) {
            const ret = arg0.versions;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./omnis_apien_wasm_bg.js": import0,
    };
}

const BaziEngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_baziengine_free(ptr >>> 0, 1));
const PathFinderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pathfinder_free(ptr >>> 0, 1));
const QuantumSimulatorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_quantumsimulator_free(ptr >>> 0, 1));
const SpikingNeuralNetworkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_spikingneuralnetwork_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayI32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

let cachedInt32ArrayMemory0 = null;
function getInt32ArrayMemory0() {
    if (cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.byteLength === 0) {
        cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedInt32ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('omnis_apien_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
