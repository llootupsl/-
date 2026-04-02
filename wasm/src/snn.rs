//! 脉冲神经网络 (SNN) 模块
//!
//! 实现简化的 Leaky Integrate-and-Fire (LIF) 神经元模型

use wasm_bindgen::prelude::*;
use rand::Rng;

/// 脉冲神经网络
#[wasm_bindgen]
pub struct SpikingNeuralNetwork {
    /// 神经元数量
    num_neurons: usize,
    /// 当前膜电位
    membrane_potentials: Vec<f32>,
    /// 突触权重
    weights: Vec<f32>,
    /// 最后一次发放脉冲的时间
    last_spike_times: Vec<f32>,
}

#[wasm_bindgen]
impl SpikingNeuralNetwork {
    /// 创建新的 SNN
    #[wasm_bindgen(constructor)]
    pub fn new(num_neurons: usize, num_inputs: usize) -> Self {
        let mut rng = rand::thread_rng();
        
        let weights: Vec<f32> = (0..num_neurons * num_inputs)
            .map(|_| rng.gen_range(-1.0..1.0))
            .collect();
        
        let membrane_potentials = vec![0.0f32; num_neurons];
        let last_spike_times = vec![-1000.0f32; num_neurons];

        SpikingNeuralNetwork {
            num_neurons,
            membrane_potentials,
            weights,
            last_spike_times,
        }
    }

    /// 前向传播一步，返回脉冲数量
    pub fn step(&mut self, inputs: &[f32], dt: f32, current_time: f32, threshold: f32, num_inputs: usize) -> usize {
        let mut spike_count = 0;
        let tau = 20.0f32;

        // 计算每个神经元的输入
        for i in 0..self.num_neurons {
            let mut input_current = 0.0f32;

            // 计算加权和输入
            for j in 0..num_inputs.min(inputs.len()) {
                let weight_idx = i * num_inputs + j;
                if weight_idx < self.weights.len() {
                    input_current += self.weights[weight_idx] * inputs[j];
                }
            }

            // Leaky Integrate-and-Fire 动力学
            let v = self.membrane_potentials[i];
            let dv = (-v / tau + input_current) * dt;
            self.membrane_potentials[i] = v + dv;

            // 检查是否发放脉冲
            if self.membrane_potentials[i] >= threshold {
                self.membrane_potentials[i] = 0.0; // 重置膜电位
                self.last_spike_times[i] = current_time;
                spike_count += 1;
            }
        }

        spike_count
    }

    /// STDP 学习
    pub fn apply_stdp(&mut self, pre_spikes: &[f32], post_spikes: &[f32], num_inputs: usize) {
        let a_plus = 0.01f32;
        let a_minus = 0.01f32;

        for i in 0..self.num_neurons {
            for j in 0..num_inputs.min(pre_spikes.len()) {
                let weight_idx = i * num_inputs + j;
                if weight_idx >= self.weights.len() { break; }
                
                let weight = self.weights[weight_idx];
                let pre = pre_spikes[j] > 0.5;
                let post = i < post_spikes.len() && post_spikes[i] > 0.5;

                let delta_w = if pre && !post {
                    a_plus * (-weight).exp()
                } else if !pre && post {
                    -a_minus * weight.exp()
                } else {
                    0.0
                };
                
                self.weights[weight_idx] = (weight + delta_w).clamp(-1.0, 1.0);
            }
        }
    }

    /// 获取膜电位
    pub fn get_membrane_potentials(&self) -> Vec<f32> {
        self.membrane_potentials.clone()
    }

    /// 获取总发放率
    pub fn total_firing_rate(&self, time_window_ms: f32, current_time: f32) -> f32 {
        let mut total = 0.0f32;
        for i in 0..self.num_neurons {
            let last_time = self.last_spike_times[i];
            if current_time - last_time < time_window_ms {
                total += 1.0;
            }
        }
        total / self.num_neurons as f32 * 1000.0 / time_window_ms
    }

    /// 重置网络状态
    pub fn reset(&mut self) {
        for v in &mut self.membrane_potentials {
            *v = 0.0;
        }
        for t in &mut self.last_spike_times {
            *t = -1000.0;
        }
    }

    /// 获取神经元数量
    pub fn num_neurons(&self) -> usize {
        self.num_neurons
    }

    /// 添加噪声
    pub fn add_noise(&mut self, amplitude: f32) {
        let mut rng = rand::thread_rng();
        for v in &mut self.membrane_potentials {
            *v += rng.gen_range(-amplitude..amplitude);
        }
    }
}
