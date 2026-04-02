//! 音频合成模块 - Audio Synthesis Module
//!
//! 提供高性能音频合成功能：
//! - 振荡器银行 (Oscillator Bank)
//! - 滤波器银行 (Filter Bank)
//! - 包络生成器 (Envelope Generator)
//! - 效果处理器 (Effects Processor)

use wasm_bindgen::prelude::*;
use std::collections::VecDeque;

/// 波形类型
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Waveform {
    Sine = 0,
    Square = 1,
    Sawtooth = 2,
    Triangle = 3,
    Noise = 4,
}

/// 单个振荡器
#[derive(Clone, Debug)]
struct Oscillator {
    frequency: f32,
    phase: f32,
    amplitude: f32,
    waveform: Waveform,
    phase_increment: f32,
}

impl Oscillator {
    fn new(frequency: f32, amplitude: f32, waveform: Waveform, sample_rate: f32) -> Self {
        Self {
            frequency,
            phase: 0.0,
            amplitude,
            waveform,
            phase_increment: frequency / sample_rate,
        }
    }

    fn generate_sample(&mut self) -> f32 {
        let sample = match self.waveform {
            Waveform::Sine => (self.phase * 2.0 * std::f32::consts::PI).sin(),
            Waveform::Square => {
                if self.phase < 0.5 { 1.0 } else { -1.0 }
            }
            Waveform::Sawtooth => 2.0 * self.phase - 1.0,
            Waveform::Triangle => 4.0 * (self.phase - 0.5).abs() - 1.0,
            Waveform::Noise => {
                // 简单的白噪声
                (rand::random::<f32>() * 2.0 - 1.0)
            }
        };

        self.phase += self.phase_increment;
        if self.phase >= 1.0 {
            self.phase -= 1.0;
        }

        sample * self.amplitude
    }

    fn set_frequency(&mut self, frequency: f32, sample_rate: f32) {
        self.frequency = frequency;
        self.phase_increment = frequency / sample_rate;
    }
}

/// 滤波器类型
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum FilterType {
    LowPass,
    HighPass,
    BandPass,
    Notch,
}

/// 双二阶滤波器 (Biquad Filter)
#[derive(Clone, Debug)]
struct BiquadFilter {
    filter_type: FilterType,
    frequency: f32,
    q: f32,
    sample_rate: f32,
    // 系数
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    // 状态
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
}

impl BiquadFilter {
    fn new(filter_type: FilterType, frequency: f32, q: f32, sample_rate: f32) -> Self {
        let mut filter = Self {
            filter_type,
            frequency,
            q,
            sample_rate,
            b0: 0.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
        };
        filter.calculate_coefficients();
        filter
    }

    fn calculate_coefficients(&mut self) {
        let omega = 2.0 * std::f32::consts::PI * self.frequency / self.sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * self.q);

        match self.filter_type {
            FilterType::LowPass => {
                self.b0 = (1.0 - cos_omega) / 2.0;
                self.b1 = 1.0 - cos_omega;
                self.b2 = (1.0 - cos_omega) / 2.0;
                self.a1 = -2.0 * cos_omega;
                self.a2 = 1.0 - alpha;
            }
            FilterType::HighPass => {
                self.b0 = (1.0 + cos_omega) / 2.0;
                self.b1 = -(1.0 + cos_omega);
                self.b2 = (1.0 + cos_omega) / 2.0;
                self.a1 = -2.0 * cos_omega;
                self.a2 = 1.0 - alpha;
            }
            FilterType::BandPass => {
                self.b0 = alpha;
                self.b1 = 0.0;
                self.b2 = -alpha;
                self.a1 = -2.0 * cos_omega;
                self.a2 = 1.0 - alpha;
            }
            FilterType::Notch => {
                self.b0 = 1.0;
                self.b1 = -2.0 * cos_omega;
                self.b2 = 1.0;
                self.a1 = -2.0 * cos_omega;
                self.a2 = 1.0 - alpha;
            }
        }

        let a0 = 1.0 + alpha;
        self.b0 /= a0;
        self.b1 /= a0;
        self.b2 /= a0;
        self.a1 /= a0;
        self.a2 /= a0;
    }

    fn process(&mut self, input: f32) -> f32 {
        let output = self.b0 * input 
                   + self.b1 * self.x1 
                   + self.b2 * self.x2 
                   - self.a1 * self.y1 
                   - self.a2 * self.y2;

        self.x2 = self.x1;
        self.x1 = input;
        self.y2 = self.y1;
        self.y1 = output;

        output
    }

    fn set_frequency(&mut self, frequency: f32) {
        self.frequency = frequency;
        self.calculate_coefficients();
    }
}

/// ADSR 包络
#[derive(Clone, Debug)]
struct ADSREnvelope {
    attack: f32,    // 攻击时间（秒）
    decay: f32,     // 衰减时间（秒）
    sustain: f32,   // 保持电平 (0-1)
    release: f32,   // 释放时间（秒）
    state: EnvelopeState,
    current_level: f32,
    sample_rate: f32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum EnvelopeState {
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
}

impl ADSREnvelope {
    fn new(attack: f32, decay: f32, sustain: f32, release: f32, sample_rate: f32) -> Self {
        Self {
            attack,
            decay,
            sustain,
            release,
            state: EnvelopeState::Idle,
            current_level: 0.0,
            sample_rate,
        }
    }

    fn trigger(&mut self) {
        self.state = EnvelopeState::Attack;
    }

    fn release(&mut self) {
        self.state = EnvelopeState::Release;
    }

    fn generate(&mut self) -> f32 {
        match self.state {
            EnvelopeState::Idle => {
                self.current_level = 0.0;
            }
            EnvelopeState::Attack => {
                let increment = 1.0 / (self.attack * self.sample_rate);
                self.current_level += increment;
                if self.current_level >= 1.0 {
                    self.current_level = 1.0;
                    self.state = EnvelopeState::Decay;
                }
            }
            EnvelopeState::Decay => {
                let decrement = (1.0 - self.sustain) / (self.decay * self.sample_rate);
                self.current_level -= decrement;
                if self.current_level <= self.sustain {
                    self.current_level = self.sustain;
                    self.state = EnvelopeState::Sustain;
                }
            }
            EnvelopeState::Sustain => {
                self.current_level = self.sustain;
            }
            EnvelopeState::Release => {
                let decrement = self.sustain / (self.release * self.sample_rate);
                self.current_level -= decrement;
                if self.current_level <= 0.0 {
                    self.current_level = 0.0;
                    self.state = EnvelopeState::Idle;
                }
            }
        }
        self.current_level
    }
}

/// 效果类型
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum EffectType {
    Reverb = 0,
    Delay = 1,
    Distortion = 2,
    Chorus = 3,
}

/// 延迟效果
struct DelayEffect {
    buffer: VecDeque<f32>,
    delay_time: f32,
    feedback: f32,
    mix: f32,
    sample_rate: f32,
}

impl DelayEffect {
    fn new(delay_time: f32, feedback: f32, mix: f32, sample_rate: f32) -> Self {
        let buffer_size = (delay_time * sample_rate) as usize;
        let mut buffer = VecDeque::with_capacity(buffer_size);
        for _ in 0..buffer_size {
            buffer.push_back(0.0);
        }
        Self {
            buffer,
            delay_time,
            feedback,
            mix,
            sample_rate,
        }
    }

    fn process(&mut self, input: f32) -> f32 {
        let delayed = *self.buffer.front().unwrap_or(&0.0);
        self.buffer.pop_front();
        
        let output = input + delayed * self.mix;
        self.buffer.push_back(input + delayed * self.feedback);
        
        output
    }
}

/// 音频合成器主类
#[wasm_bindgen]
pub struct AudioSynth {
    sample_rate: f32,
    oscillators: Vec<Oscillator>,
    filters: Vec<BiquadFilter>,
    envelope: ADSREnvelope,
    delay: Option<DelayEffect>,
    master_volume: f32,
}

#[wasm_bindgen]
impl AudioSynth {
    /// 创建新的音频合成器
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            oscillators: Vec::new(),
            filters: Vec::new(),
            envelope: ADSREnvelope::new(0.01, 0.1, 0.7, 0.3, sample_rate),
            delay: None,
            master_volume: 0.5,
        }
    }

    /// 添加振荡器
    pub fn add_oscillator(&mut self, freq: f32, amp: f32, wave_type: u8) {
        let waveform = match wave_type {
            0 => Waveform::Sine,
            1 => Waveform::Square,
            2 => Waveform::Sawtooth,
            3 => Waveform::Triangle,
            _ => Waveform::Noise,
        };
        self.oscillators.push(Oscillator::new(freq, amp, waveform, self.sample_rate));
    }

    /// 移除所有振荡器
    pub fn clear_oscillators(&mut self) {
        self.oscillators.clear();
    }

    /// 设置振荡器频率
    pub fn set_oscillator_frequency(&mut self, index: usize, frequency: f32) {
        if let Some(osc) = self.oscillators.get_mut(index) {
            osc.set_frequency(frequency, self.sample_rate);
        }
    }

    /// 添加低通滤波器
    pub fn add_lowpass_filter(&mut self, frequency: f32, q: f32) {
        self.filters.push(BiquadFilter::new(
            FilterType::LowPass,
            frequency,
            q,
            self.sample_rate,
        ));
    }

    /// 添加高通滤波器
    pub fn add_highpass_filter(&mut self, frequency: f32, q: f32) {
        self.filters.push(BiquadFilter::new(
            FilterType::HighPass,
            frequency,
            q,
            self.sample_rate,
        ));
    }

    /// 清除所有滤波器
    pub fn clear_filters(&mut self) {
        self.filters.clear();
    }

    /// 设置 ADSR 包络
    pub fn set_envelope(&mut self, attack: f32, decay: f32, sustain: f32, release: f32) {
        self.envelope = ADSREnvelope::new(attack, decay, sustain, release, self.sample_rate);
    }

    /// 触发音符
    pub fn note_on(&mut self) {
        self.envelope.trigger();
    }

    /// 释放音符
    pub fn note_off(&mut self) {
        self.envelope.release();
    }

    /// 添加延迟效果
    pub fn add_delay(&mut self, delay_time: f32, feedback: f32, mix: f32) {
        self.delay = Some(DelayEffect::new(delay_time, feedback, mix, self.sample_rate));
    }

    /// 设置主音量
    pub fn set_master_volume(&mut self, volume: f32) {
        self.master_volume = volume.clamp(0.0, 1.0);
    }

    /// 生成音频样本块
    pub fn generate_samples(&mut self, count: usize) -> Vec<f32> {
        let mut output = Vec::with_capacity(count);

        for _ in 0..count {
            let mut sample = 0.0f32;

            // 生成振荡器输出
            for osc in &mut self.oscillators {
                sample += osc.generate_sample();
            }

            // 应用包络
            let envelope_value = self.envelope.generate();
            sample *= envelope_value;

            // 应用滤波器
            for filter in &mut self.filters {
                sample = filter.process(sample);
            }

            // 应用延迟效果
            if let Some(delay) = &mut self.delay {
                sample = delay.process(sample);
            }

            // 应用主音量和软限幅
            sample *= self.master_volume;
            sample = sample.tanh(); // 软限幅防止削波

            output.push(sample);
        }

        output
    }

    /// 直接写入输出缓冲区（用于 AudioWorklet）
    pub fn generate_to_buffer(&mut self, output: &mut [f32]) {
        for sample in output.iter_mut() {
            let mut s = 0.0f32;

            for osc in &mut self.oscillators {
                s += osc.generate_sample();
            }

            let envelope_value = self.envelope.generate();
            s *= envelope_value;

            for filter in &mut self.filters {
                s = filter.process(s);
            }

            if let Some(delay) = &mut self.delay {
                s = delay.process(s);
            }

            s *= self.master_volume;
            *sample = s.tanh();
        }
    }

    /// 获取采样率
    pub fn get_sample_rate(&self) -> f32 {
        self.sample_rate
    }

    /// 获取振荡器数量
    pub fn get_oscillator_count(&self) -> usize {
        self.oscillators.len()
    }

    /// 获取滤波器数量
    pub fn get_filter_count(&self) -> usize {
        self.filters.len()
    }
}

/// 预设音色生成器
#[wasm_bindgen]
pub struct PresetSynth {
    synth: AudioSynth,
}

#[wasm_bindgen]
impl PresetSynth {
    /// 创建预设合成器
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        Self {
            synth: AudioSynth::new(sample_rate),
        }
    }

    /// 创建赛博朋克音色
    pub fn create_cyber_sound(&mut self, base_freq: f32) {
        self.synth.clear_oscillators();
        self.synth.clear_filters();

        // 基频 + 泛音
        self.synth.add_oscillator(base_freq, 0.4, 0);      // Sine
        self.synth.add_oscillator(base_freq * 2.0, 0.3, 1); // Square
        self.synth.add_oscillator(base_freq * 4.0, 0.2, 2); // Sawtooth
        self.synth.add_oscillator(base_freq * 0.5, 0.1, 0); // Sub bass

        // 滤波器
        self.synth.add_lowpass_filter(2000.0, 1.5);
        
        // 包络
        self.synth.set_envelope(0.01, 0.1, 0.6, 0.2);
        
        // 延迟
        self.synth.add_delay(0.3, 0.4, 0.3);
    }

    /// 创建通知音色
    pub fn create_notification_sound(&mut self) {
        self.synth.clear_oscillators();
        self.synth.clear_filters();

        self.synth.add_oscillator(880.0, 0.3, 0);   // A5
        self.synth.add_oscillator(1100.0, 0.2, 0);  // C#6
        self.synth.add_oscillator(1320.0, 0.15, 0); // E6

        self.synth.set_envelope(0.005, 0.1, 0.3, 0.3);
    }

    /// 创建警告音色
    pub fn create_warning_sound(&mut self) {
        self.synth.clear_oscillators();
        self.synth.clear_filters();

        self.synth.add_oscillator(440.0, 0.4, 1);
        self.synth.add_oscillator(880.0, 0.3, 1);

        self.synth.set_envelope(0.001, 0.05, 0.5, 0.1);
    }

    /// 创建 BGM 基础音色
    pub fn create_bgm_pad(&mut self, chord: &[f32]) {
        self.synth.clear_oscillators();
        self.synth.clear_filters();

        for &freq in chord {
            self.synth.add_oscillator(freq, 0.15, 0);      // Sine
            self.synth.add_oscillator(freq * 2.0, 0.1, 3); // Triangle
        }

        self.synth.add_lowpass_filter(1500.0, 2.0);
        self.synth.set_envelope(0.5, 0.3, 0.7, 1.0);
    }

    /// 触发音符
    pub fn note_on(&mut self) {
        self.synth.note_on();
    }

    /// 释放音符
    pub fn note_off(&mut self) {
        self.synth.note_off();
    }

    /// 生成样本
    pub fn generate_samples(&mut self, count: usize) -> Vec<f32> {
        self.synth.generate_samples(count)
    }

    /// 设置主音量
    pub fn set_volume(&mut self, volume: f32) {
        self.synth.set_master_volume(volume);
    }
}

/// 独立函数：生成简单的正弦波
#[wasm_bindgen]
pub fn generate_sine_wave(frequency: f32, duration: f32, sample_rate: f32) -> Vec<f32> {
    let samples = (duration * sample_rate) as usize;
    let mut output = Vec::with_capacity(samples);

    for i in 0..samples {
        let t = i as f32 / sample_rate;
        let sample = (2.0 * std::f32::consts::PI * frequency * t).sin();
        output.push(sample);
    }

    output
}

/// 独立函数：生成和弦
#[wasm_bindgen]
pub fn generate_chord(frequencies: &[f32], duration: f32, sample_rate: f32) -> Vec<f32> {
    let samples = (duration * sample_rate) as usize;
    let mut output = vec![0.0f32; samples];

    for &freq in frequencies {
        for i in 0..samples {
            let t = i as f32 / sample_rate;
            output[i] += (2.0 * std::f32::consts::PI * freq * t).sin();
        }
    }

    // 归一化
    let amp = 1.0 / frequencies.len() as f32;
    for sample in &mut output {
        *sample *= amp;
    }

    output
}

/// 独立函数：应用 ADSR 包络
#[wasm_bindgen]
pub fn apply_adsr(
    samples: &mut [f32],
    sample_rate: f32,
    attack: f32,
    decay: f32,
    sustain: f32,
    release: f32,
) {
    let total_samples = samples.len();
    let attack_samples = (attack * sample_rate) as usize;
    let decay_samples = (decay * sample_rate) as usize;
    let release_samples = (release * sample_rate) as usize;
    let release_start = total_samples.saturating_sub(release_samples);

    for (i, sample) in samples.iter_mut().enumerate() {
        let envelope = if i < attack_samples {
            i as f32 / attack_samples as f32
        } else if i < attack_samples + decay_samples {
            let decay_progress = (i - attack_samples) as f32 / decay_samples as f32;
            1.0 - (1.0 - sustain) * decay_progress
        } else if i < release_start {
            sustain
        } else {
            let release_progress = (i - release_start) as f32 / release_samples as f32;
            sustain * (1.0 - release_progress)
        };

        *sample *= envelope;
    }
}

/// 独立函数：混音多个音轨
#[wasm_bindgen]
pub fn mix_tracks(tracks: &[Vec<f32>], volumes: &[f32]) -> Vec<f32> {
    if tracks.is_empty() {
        return Vec::new();
    }

    let max_len = tracks.iter().map(|t| t.len()).max().unwrap_or(0);
    let mut output = vec![0.0f32; max_len];

    for (track, &volume) in tracks.iter().zip(volumes.iter()) {
        for (i, sample) in track.iter().enumerate() {
            if i < output.len() {
                output[i] += sample * volume;
            }
        }
    }

    // 软限幅
    for sample in &mut output {
        *sample = sample.tanh();
    }

    output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_oscillator_sine() {
        let mut osc = Oscillator::new(440.0, 1.0, Waveform::Sine, 44100.0);
        let sample = osc.generate_sample();
        assert!(sample >= -1.0 && sample <= 1.0);
    }

    #[test]
    fn test_audio_synth() {
        let mut synth = AudioSynth::new(44100.0);
        synth.add_oscillator(440.0, 0.5, 0);
        synth.note_on();
        
        let samples = synth.generate_samples(1024);
        assert_eq!(samples.len(), 1024);
    }

    #[test]
    fn test_biquad_filter() {
        let mut filter = BiquadFilter::new(FilterType::LowPass, 1000.0, 1.0, 44100.0);
        let input = 0.5;
        let output = filter.process(input);
        assert!(output.is_finite());
    }

    #[test]
    fn test_adsr_envelope() {
        let mut env = ADSREnvelope::new(0.1, 0.1, 0.7, 0.1, 44100.0);
        env.trigger();
        
        // 攻击阶段应该增加
        let initial = env.generate();
        let after = env.generate();
        assert!(after > initial);
    }
}
