//! 永夜熵纪 - OMNIS APIEN WASM 核心模块
//!
//! 提供高性能计算功能：
//! - 量子模拟
//! - 脉冲神经网络 (SNN)
//! - A* 路径寻路
//! - 八字命理计算
//! - 音频合成 (Audio Synthesis)

mod quantum;
mod snn;
mod pathfinding;
mod bazi;
mod audio_synth;

use wasm_bindgen::prelude::*;

// 启用 panic hook 用于调试
#[cfg(feature = "console_error_panic_hook")]
extern crate console_error_panic_hook;

#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// 获取模块版本
#[wasm_bindgen]
pub fn get_version() -> String {
    "1.0.0".to_string()
}

/// 获取编译信息
#[wasm_bindgen]
pub fn get_build_info() -> String {
    format!(
        "OMNIS APIEN WASM v{}",
        get_version()
    )
}

/// 性能测试：执行大量数学运算
#[wasm_bindgen]
pub fn benchmark_math(iterations: u32) -> f64 {
    let start = js_sys::Date::now();
    let mut result = 0.0f64;

    for i in 0..iterations {
        let x = i as f64 / 1000.0;
        result += (x.sin() * x.cos() + x.tan()).sqrt();
    }

    let elapsed = js_sys::Date::now() - start;
    elapsed
}

/// 性能测试：矩阵乘法
#[wasm_bindgen]
pub fn benchmark_matrix_multiply(size: u32) -> f64 {
    let start = js_sys::Date::now();

    // 创建两个随机矩阵
    let mut a = vec![0.0f32; (size * size) as usize];
    let mut b = vec![0.0f32; (size * size) as usize];
    let mut c = vec![0.0f32; (size * size) as usize];

    // 填充随机值
    for i in 0..(size * size) {
        a[i as usize] = rand::random::<f32>();
        b[i as usize] = rand::random::<f32>();
    }

    // 矩阵乘法
    for i in 0..size {
        for j in 0..size {
            let mut sum = 0.0f32;
            for k in 0..size {
                sum += a[(i * size + k) as usize] * b[(k * size + j) as usize];
            }
            c[(i * size + j) as usize] = sum;
        }
    }

    let elapsed = js_sys::Date::now() - start;
    elapsed
}

/// 获取当前时间戳（毫秒）
#[wasm_bindgen]
pub fn timestamp_ms() -> f64 {
    js_sys::Date::now()
}

/// 获取高精度时间戳（纳秒）
#[wasm_bindgen]
pub fn timestamp_ns() -> u64 {
    // 使用 performance.now() * 1_000_000 作为纳秒精度时间
    let now = js_sys::Date::now();
    (now * 1_000_000.0) as u64
}

// Re-export submodules
pub use quantum::QuantumSimulator;
pub use snn::SpikingNeuralNetwork;
pub use pathfinding::PathFinder;
pub use bazi::BaziEngine;
pub use audio_synth::{AudioSynth, PresetSynth, Waveform, EffectType};
