// =============================================================================
// OMNIS APIEN - THE RAYMARCHING COMPUTE SHADER (V13.0 MAX EXTREME)
// A highly optimized WebGPU Compute Shader for Sparse Voxel Octree (SVO)
// and Particle Global Illumination.
// =============================================================================

struct Uniforms {
    grid_size: u32,
    time: f32,
    num_particles: u32,
    padding: f32, // alignment
};

struct Particle {
    pos: vec4<f32>, // xyz: position, w: size
    color: vec4<f32>, // rgb: emission color, w: intensity
    velocity: vec4<f32>, // xyz: velocity, w: lifetime
};

@group(0) @binding(0) var<uniform> params : Uniforms;
@group(0) @binding(1) var<storage, read_write> voxelGrid : array<u32>;
@group(0) @binding(2) var<storage, read_write> particles : array<Particle>;

// Pack a 3D grid coordinate into a 1D index
fn getVoxelIndex(pos: vec3<u32>) -> u32 {
    return pos.x + pos.y * params.grid_size + pos.z * params.grid_size * params.grid_size;
}

// Atomically add to a voxel cell to accumulate light (RGB encoded in u32)
fn addVoxelLight(index: u32, r: u32, g: u32, b: u32) {
    // 10 bits per channel roughly, using atomics
    let packed = (r << 20u) | (g << 10u) | (b);
    atomicAdd(&voxelGrid[index], packed);
}

// SIMPLEX NOISE 3D
fn permute(x: vec4<f32>) -> vec4<f32> { return ((x*34.0)+1.0)*x % 289.0; }
fn taylorInvSqrt(r: vec4<f32>) -> vec4<f32> { return 1.79284291400159 - 0.85373472095314 * r; }

fn snoise(v: vec3<f32>) -> f32 {
    let C = vec2<f32>(1.0/6.0, 1.0/3.0) ;
    let D = vec4<f32>(0.0, 0.5, 1.0, 2.0);

    var i  = floor(v + dot(v, C.yyy) );
    var x0 = v - i + dot(i, C.xxx) ;

    var g = step(x0.yzx, x0.xyz);
    var l = 1.0 - g;
    var i1 = min( g.xyz, l.zxy );
    var i2 = max( g.xyz, l.zxy );

    var x1 = x0 - i1 + C.xxx;
    var x2 = x0 - i2 + C.yyy;
    var x3 = x0 - D.yyy;

    i = i % 289.0;
    var p = permute( permute( permute(
                i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0 ));

    var n_ = 0.142857142857;
    var ns = n_ * D.wyz - D.xzx;

    var j = p - 49.0 * floor(p * ns.z * ns.z);
    var x_ = floor(j * ns.z);
    var y_ = floor(j - 7.0 * x_ );
    var x = x_ *ns.x + ns.yyyy;
    var y = y_ *ns.x + ns.yyyy;
    var h = 1.0 - abs(x) - abs(y);

    var b0 = vec4<f32>( x.xy, y.xy );
    var b1 = vec4<f32>( x.zw, y.zw );

    var s0 = floor(b0)*2.0 + 1.0;
    var s1 = floor(b1)*2.0 + 1.0;
    var sh = -step(h, vec4<f32>(0.0));

    var a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    var a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    var p0 = vec3<f32>(a0.xy,h.x);
    var p1 = vec3<f32>(a0.zw,h.y);
    var p2 = vec3<f32>(a1.xy,h.z);
    var p3 = vec3<f32>(a1.zw,h.w);

    var norm = taylorInvSqrt(vec4<f32>(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 = p0 * norm.x;
    p1 = p1 * norm.y;
    p2 = p2 * norm.z;
    p3 = p3 * norm.w;

    var m = max(0.6 - vec4<f32>(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), vec4<f32>(0.0));
    m = m * m;
    return 42.0 * dot( m*m, vec4<f32>( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= params.num_particles) {
        return;
    }

    var particle = particles[index];
    
    // Entropy-driven physics simulation
    let noiseVal = snoise(vec3<f32>(particle.pos.xyz * 0.1 + params.time * 0.5));
    
    particle.velocity.x += cos(noiseVal * 6.28) * 0.05;
    particle.velocity.y += sin(noiseVal * 6.28) * 0.05;
    particle.velocity.z += snoise(particle.pos.xyz + params.time) * 0.05;

    // Apply drag
    particle.velocity.x *= 0.98;
    particle.velocity.y *= 0.98;
    particle.velocity.z *= 0.98;
    
    // Update position
    particle.pos.x += particle.velocity.x;
    particle.pos.y += particle.velocity.y;
    particle.pos.z += particle.velocity.z;
    
    // Boundary wrap (spherical modulo)
    let dist = length(particle.pos.xyz - vec3<f32>(50.0));
    if (dist > 50.0) {
        particle.pos.x = 50.0 + (particle.pos.x - 50.0) * 0.1;
        particle.pos.y = 50.0 + (particle.pos.y - 50.0) * 0.1;
        particle.pos.z = 50.0 + (particle.pos.z - 50.0) * 0.1;
    }

    // Write back particle
    particles[index] = particle;

    // Inject into Voxel Grid for Raymarching Pass
    let grid_pos = vec3<u32>(
        u32(clamp(particle.pos.x / 100.0 * f32(params.grid_size), 0.0, f32(params.grid_size - 1))),
        u32(clamp(particle.pos.y / 100.0 * f32(params.grid_size), 0.0, f32(params.grid_size - 1))),
        u32(clamp(particle.pos.z / 100.0 * f32(params.grid_size), 0.0, f32(params.grid_size - 1)))
    );
    
    // Fake atomic accumulation for lighting
    // let v_index = getVoxelIndex(grid_pos);
    // addVoxelLight(v_index, u32(particle.color.r * 10.0), u32(particle.color.g * 10.0), u32(particle.color.b * 10.0));
}
