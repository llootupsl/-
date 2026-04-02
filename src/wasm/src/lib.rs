use wasm_bindgen::prelude::*;
use js_sys::Float32Array;
use std::f32::consts::PI;

#[wasm_bindgen]
pub struct UniversePhysics {
    particles: Vec<f32>,
    pub num_particles: usize,
}

#[wasm_bindgen]
impl UniversePhysics {
    #[wasm_bindgen(constructor)]
    pub fn new(num_particles: usize) -> UniversePhysics {
        let mut particles = Vec::with_capacity(num_particles * 6); // x, y, z, vx, vy, vz
        for i in 0..num_particles {
            particles.push((i as f32) % 100.0); // x
            particles.push(((i / 100) as f32) % 100.0); // y
            particles.push(((i / 10000) as f32) % 100.0); // z
            particles.push(0.0); // vx
            particles.push(0.0); // vy
            particles.push(0.0); // vz
        }
        UniversePhysics {
            particles,
            num_particles,
        }
    }

    /// 执行万有引力与多体物理学的核心 Tick
    /// 这是完全利用 Rust 端 WebAssembly 原生速度的运算流
    pub fn tick(&mut self, dt: f32, global_entropy: f32) {
        let num = self.num_particles;
        let p = &mut self.particles;

        // Extremely simplified n-body gravity & entropy simulation for performance
        // In reality, this would use a spatial grid or tree
        for i in 0..num {
            let base = i * 6;
            let px = p[base + 0];
            let py = p[base + 1];
            let pz = p[base + 2];
            
            let mut vx = p[base + 3];
            let mut vy = p[base + 4];
            let mut vz = p[base + 5];

            // Attract towards center
            let dx = 50.0 - px;
            let dy = 50.0 - py;
            let dz = 50.0 - pz;
            let dist_sq = dx * dx + dy * dy + dz * dz + 1.0;
            
            let force = 10.0 / dist_sq;
            
            vx += dx * force * dt;
            vy += dy * force * dt;
            vz += dz * force * dt;

            // Apply entropy noise (brownian motion)
            // Just a basic chaotic perturbation derived from global_entropy
            let chaos = global_entropy * 5.0;
            vx += ((px * 13.0).sin() * chaos) * dt;
            vy += ((py * 17.0).cos() * chaos) * dt;
            vz += ((pz * 19.0).sin() * chaos) * dt;
            
            // Drag
            vx *= 0.99;
            vy *= 0.99;
            vz *= 0.99;

            p[base + 3] = vx;
            p[base + 4] = vy;
            p[base + 5] = vz;

            p[base + 0] += vx * dt;
            p[base + 1] += vy * dt;
            p[base + 2] += vz * dt;
        }
    }

    /// 提供内存指针给前端，实现零拷贝数据拉取
    pub fn get_particles_ptr(&self) -> *const f32 {
        self.particles.as_ptr()
    }
}
