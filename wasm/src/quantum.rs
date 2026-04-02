//! 量子模拟模块
//!
//! 实现简化的量子电路模拟器

use wasm_bindgen::prelude::*;

/// 量子比特
#[derive(Clone, Debug)]
struct Qubit {
    /// 0态振幅
    alpha: Complex,
    /// 1态振幅
    beta: Complex,
}

impl Qubit {
    fn new() -> Self {
        Qubit {
            alpha: Complex { re: 1.0, im: 0.0 },
            beta: Complex { re: 0.0, im: 0.0 },
        }
    }

    fn apply_gate(&mut self, gate: &[[f64; 2]; 2]) {
        let a = self.alpha;
        let b = self.beta;
        let new_alpha = gate[0][0] * a + gate[0][1] * b;
        let new_beta = gate[1][0] * a + gate[1][1] * b;
        self.alpha = new_alpha;
        self.beta = new_beta;
    }

    fn measure(&self) -> u8 {
        let prob_zero = self.alpha.norm_sqr();
        if rand::random::<f64>() < prob_zero {
            0
        } else {
            1
        }
    }
}

/// 复数
#[derive(Clone, Debug, Copy)]
struct Complex {
    re: f64,
    im: f64,
}

impl Complex {
    fn norm_sqr(&self) -> f64 {
        self.re * self.re + self.im * self.im
    }
}

impl std::ops::Mul<Complex> for f64 {
    type Output = Complex;
    
    fn mul(self, c: Complex) -> Complex {
        Complex {
            re: self * c.re,
            im: self * c.im,
        }
    }
}

impl std::ops::Add for Complex {
    type Output = Complex;
    
    fn add(self, other: Complex) -> Complex {
        Complex {
            re: self.re + other.re,
            im: self.im + other.im,
        }
    }
}

/// 量子模拟器
#[wasm_bindgen]
pub struct QuantumSimulator {
    qubits: Vec<Qubit>,
    num_qubits: usize,
}

#[wasm_bindgen]
impl QuantumSimulator {
    /// 创建新的量子模拟器
    #[wasm_bindgen(constructor)]
    pub fn new(num_qubits: usize) -> Self {
        let mut qubits = Vec::with_capacity(num_qubits);
        for _ in 0..num_qubits {
            qubits.push(Qubit::new());
        }

        QuantumSimulator {
            qubits,
            num_qubits,
        }
    }

    /// 应用 Hadamard 门
    pub fn hadamard(&mut self, qubit_idx: usize) {
        if qubit_idx >= self.num_qubits {
            return;
        }

        let h = [
            [1.0 / 2.0_f64.sqrt(), 1.0 / 2.0_f64.sqrt()],
            [1.0 / 2.0_f64.sqrt(), -1.0 / 2.0_f64.sqrt()],
        ];

        self.qubits[qubit_idx].apply_gate(&h);
    }

    /// 应用 Pauli-X 门（量子非门）
    pub fn pauli_x(&mut self, qubit_idx: usize) {
        if qubit_idx >= self.num_qubits {
            return;
        }

        let x = [
            [0.0, 1.0],
            [1.0, 0.0],
        ];

        self.qubits[qubit_idx].apply_gate(&x);
    }

    /// 应用 Pauli-Y 门
    pub fn pauli_y(&mut self, qubit_idx: usize) {
        if qubit_idx >= self.num_qubits {
            return;
        }

        // Y = [[0, -i], [i, 0]]
        let y_gate = [
            [0.0, -1.0],
            [1.0, 0.0],
        ];

        self.qubits[qubit_idx].apply_gate(&y_gate);
    }

    /// 应用 Pauli-Z 门
    pub fn pauli_z(&mut self, qubit_idx: usize) {
        if qubit_idx >= self.num_qubits {
            return;
        }

        let z = [
            [1.0, 0.0],
            [0.0, -1.0],
        ];

        self.qubits[qubit_idx].apply_gate(&z);
    }

    /// 应用 CNOT 门（控制-非门）
    pub fn cnot(&mut self, control: usize, target: usize) {
        if control >= self.num_qubits || target >= self.num_qubits {
            return;
        }

        // 如果控制比特为1，则翻转目标比特
        if self.qubits[control].measure() == 1 {
            self.pauli_x(target);
        }
    }

    /// 应用旋转门
    pub fn rotate_x(&mut self, qubit_idx: usize, theta: f64) {
        if qubit_idx >= self.num_qubits {
            return;
        }

        let cos = theta.cos() / 2.0;
        let sin = theta.sin() / 2.0;

        let rx = [
            [cos, -sin],
            [sin, cos],
        ];

        self.qubits[qubit_idx].apply_gate(&rx);
    }

    /// 应用旋转门
    pub fn rotate_y(&mut self, qubit_idx: usize, theta: f64) {
        if qubit_idx >= self.num_qubits {
            return;
        }

        let cos = theta.cos() / 2.0;
        let sin = theta.sin() / 2.0;

        let ry = [
            [cos, -sin],
            [sin, cos],
        ];

        self.qubits[qubit_idx].apply_gate(&ry);
    }

    /// 应用旋转门
    pub fn rotate_z(&mut self, qubit_idx: usize, theta: f64) {
        if qubit_idx >= self.num_qubits {
            return;
        }

        let half_theta = theta / 2.0;

        let e_neg_re = (-half_theta).cos();
        let e_neg_im = (-half_theta).sin();
        let e_pos_re = half_theta.cos();
        let e_pos_im = half_theta.sin();

        let rz = [
            [e_neg_re, e_neg_im],
            [e_pos_im, e_pos_re],
        ];

        self.qubits[qubit_idx].apply_gate(&rz);
    }

    /// 测量所有量子比特
    pub fn measure_all(&self) -> Vec<u8> {
        self.qubits.iter().map(|q| q.measure()).collect()
    }

    /// 测量单个量子比特
    pub fn measure(&self, qubit_idx: usize) -> u8 {
        if qubit_idx >= self.num_qubits {
            return 0;
        }
        self.qubits[qubit_idx].measure()
    }

    /// 重置量子比特到 |0⟩ 态
    pub fn reset(&mut self) {
        for qubit in &mut self.qubits {
            qubit.alpha = Complex { re: 1.0, im: 0.0 };
            qubit.beta = Complex { re: 0.0, im: 0.0 };
        }
    }

    /// 获取量子比特数量
    pub fn num_qubits(&self) -> usize {
        self.num_qubits
    }

    /// 获取特定量子比特的概率幅
    pub fn get_amplitudes(&self, qubit_idx: usize) -> Vec<f64> {
        if qubit_idx >= self.num_qubits {
            return vec![0.0, 0.0];
        }

        let qubit = &self.qubits[qubit_idx];
        vec![
            qubit.alpha.norm_sqr(),
            qubit.beta.norm_sqr(),
        ]
    }

    /// 计算量子电路的纠缠度
    pub fn entanglement(&self) -> f64 {
        // 简化的纠缠度计算
        let mut entropy = 0.0;

        for qubit in &self.qubits {
            let p0 = qubit.alpha.norm_sqr();
            let p1 = qubit.beta.norm_sqr();

            if p0 > 0.0 && p1 > 0.0 {
                entropy -= p0 * p0.log2() + p1 * p1.log2();
            }
        }

        entropy
    }

    /// 运行贝尔态测试
    pub fn bell_test(&mut self) -> bool {
        // 创建贝尔态 |Φ+⟩ = (|00⟩ + |11⟩) / √2
        self.reset();
        self.hadamard(0);
        self.cnot(0, 1);

        // 测量
        let results = self.measure_all();

        // 检查结果是否相关（00 或 11）
        results[0] == results[1]
    }
}
