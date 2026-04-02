/**
 * =============================================================================
 * 永夜熵纪 - SVO 光线追踪着色器
 * Sparse Voxel Octree Ray Tracing Shaders for WebGPU
 * =============================================================================
 */

/** SVO 遍历着色器（WGSL） */
export const svoTraversalShader = /* wgsl */`
struct SVONode {
  child_mask: u32,
  child_ptr: u32,
  voxel_index: u32,
  padding: u32,
}

struct Voxel {
  position: vec3<f32>,
  color: vec3<f32>,
  emission: f32,
  material: u32,
}

struct Ray {
  origin: vec3<f32>,
  direction: vec3<f32>,
  t_min: f32,
  t_max: f32,
}

struct HitInfo {
  hit: f32,
  t: f32,
  normal: vec3<f32>,
  color: vec3<f32>,
  emission: f32,
  material: u32,
}

// Uniforms - 使用统一缓冲区结构
struct Uniforms {
  camera_position: vec3<f32>,
  _pad1: f32,
  light_direction: vec3<f32>,
  _pad2: f32,
  light_color: vec3<f32>,
  _pad3: f32,
  ambient_color: vec3<f32>,
  _pad4: f32,
  max_depth: u32,
  _pad5: u32,
  resolution: vec2<u32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

// Storage buffers
@group(1) @binding(0) var<storage, read> svo_nodes: array<SVONode>;
@group(1) @binding(1) var<storage, read> voxels: array<Voxel>;

// Output
@group(2) @binding(0) var<storage, read_write> output_buffer: array<vec4<f32>>;

// Constants
const EPSILON: f32 = 0.0001;
const MAX_TRAVERSAL_STEPS: u32 = 1024u;

/// 从八分空间索引计算子节点相对位置
fn getOctantPosition(octant: u32) -> vec3<f32> {
  let x = f32(octant & 1u);
  let y = f32((octant >> 1u) & 1u);
  let z = f32((octant >> 2u) & 1u);
  return vec3<f32>(x, y, z);
}

/// 计算八分空间索引
fn getOctantIndex(point: vec3<f32>, center: vec3<f32>) -> u32 {
  var index: u32 = 0u;
  if (point.x >= center.x) { index = index | 1u; }
  if (point.y >= center.y) { index = index | 2u; }
  if (point.z >= center.z) { index = index | 4u; }
  return index;
}

/// 检查点是否在 AABB 内
fn pointInAABB(point: vec3<f32>, min_bound: vec3<f32>, max_bound: vec3<f32>) -> bool {
  return all(point >= min_bound) && all(point < max_bound);
}

/// 光线-AABB 相交测试
fn rayAABBIntersect(
  ray: Ray,
  box_min: vec3<f32>,
  box_max: vec3<f32>
) -> vec2<f32> {
  var t_min = ray.t_min;
  var t_max = ray.t_max;
  
  let inv_dir = 1.0 / ray.direction;
  
  let t1 = (box_min - ray.origin) * inv_dir;
  let t2 = (box_max - ray.origin) * inv_dir;
  
  let t_near = min(t1, t2);
  let t_far = max(t1, t2);
  
  t_min = max(t_min, max(t_near.x, max(t_near.y, t_near.z)));
  t_max = min(t_max, min(t_far.x, min(t_far.y, t_far.z)));
  
  if (t_min > t_max) {
    return vec2<f32>(-1.0, -1.0);
  }
  
  return vec2<f32>(t_min, t_max);
}

/// SVO 遍历 - 使用 DDA 算法
fn traverseSVO(ray: Ray) -> HitInfo {
  var hit: HitInfo;
  hit.hit = 0.0;
  hit.t = ray.t_max;
  hit.normal = vec3<f32>(0.0, 1.0, 0.0);
  hit.color = vec3<f32>(0.0);
  hit.emission = 0.0;
  hit.material = 0u;
  
  // 从根节点开始
  var node_index: u32 = 0u;
  var depth: u32 = 0u;
  var step_count: u32 = 0u;
  
  // 当前边界
  var current_min = vec3<f32>(-128.0, -128.0, -128.0);
  var current_max = vec3<f32>(128.0, 128.0, 128.0);
  
  // 检查光线是否进入场景
  let entry = rayAABBIntersect(ray, current_min, current_max);
  if (entry.x < 0.0) {
    return hit;
  }
  
  var t = entry.x;
  var current_pos = ray.origin + ray.direction * t;
  
  // DDA 遍历
  while (step_count < MAX_TRAVERSAL_STEPS && depth < uniforms.max_depth) {
    step_count++;
    
    // 获取当前节点
    let node = svo_nodes[node_index];
    
    // 检查是否是叶子节点
    if (node.child_mask == 0u) {
      if (node.voxel_index != 0xFFFFFFFFu) {
        let voxel = voxels[node.voxel_index];
        hit.hit = 1.0;
        hit.t = t;
        hit.color = voxel.color;
        hit.emission = voxel.emission;
        hit.material = voxel.material;
        
        // 计算法线（简化）
        hit.normal = normalize(voxel.position - current_pos);
        return hit;
      }
    }
    
    // 计算当前体素的中心
    let center = (current_min + current_max) * 0.5;
    let octant = getOctantIndex(current_pos, center);
    
    // 检查是否有子节点
    if ((node.child_mask & (1u << octant)) != 0u) {
      // 计算子节点索引
      let child_offset = countOneBits(node.child_mask & ((1u << octant) - 1u));
      node_index = node.child_ptr + child_offset;
      depth++;
      
      // 更新边界
      let octant_pos = getOctantPosition(octant);
      let half_size = (current_max - current_min) * 0.5;
      current_min = current_min + octant_pos * half_size;
      current_max = current_min + half_size;
    } else {
      // 空节点，跳过
      // 计算下一个体素边界
      let cell_size = (current_max.x - current_min.x);
      let next_boundary = current_min + cell_size;
      
      // 计算到下一个边界的距离
      let t_next = min(
        (next_boundary.x - current_pos.x) / ray.direction.x,
        min(
          (next_boundary.y - current_pos.y) / ray.direction.y,
          (next_boundary.z - current_pos.z) / ray.direction.z
        )
      );
      
      t += t_next + EPSILON;
      if (t > ray.t_max) {
        break;
      }
      current_pos = ray.origin + ray.direction * t;
      
      // 回到根节点重新开始
      node_index = 0u;
      depth = 0u;
      current_min = vec3<f32>(-128.0, -128.0, -128.0);
      current_max = vec3<f32>(128.0, 128.0, 128.0);
    }
  }
  
  return hit;
}

/// 计算位图中 1 的个数
fn countOneBits(n: u32) -> u32 {
  var count: u32 = 0u;
  var x = n;
  while (x != 0u) {
    count += x & 1u;
    x = x >> 1u;
  }
  return count;
}

/// 计算光照
fn computeLighting(
  hit: HitInfo,
  ray_dir: vec3<f32>
) -> vec3<f32> {
  if (hit.hit < 0.5) {
    return vec3<f32>(0.0);
  }
  
  // 发光
  var color = hit.color * hit.emission;
  
  // 漫反射
  let N = normalize(hit.normal);
  let L = normalize(uniforms.light_direction);
  let NdotL = max(dot(N, L), 0.0);
  color += hit.color * uniforms.light_color * NdotL;
  
  // 环境光
  color += hit.color * uniforms.ambient_color;
  
  return color;
}

/// V6修复：计算阴影
fn computeShadow(
  world_pos: vec3<f32>,
  normal: vec3<f32>
) -> f32 {
  // 从表面向光源发射阴影光线
  var shadow_ray: Ray;
  shadow_ray.origin = world_pos + normal * 0.01; // 偏移避免自阴影
  shadow_ray.direction = normalize(uniforms.light_direction);
  shadow_ray.t_min = 0.001;
  shadow_ray.t_max = 1000.0; // 光源距离
  
  // 遍历 SVO 检测遮挡
  let shadow_hit = traverseSVO(shadow_ray);
  
  // 如果有遮挡，返回阴影因子
  if (shadow_hit.hit > 0.5) {
    // 根据距离计算软阴影
    let shadow_distance = shadow_hit.t;
    let shadow_factor = smoothstep(0.0, 10.0, shadow_distance);
    return 1.0 - shadow_factor;
  }
  
  return 0.0; // 无阴影
}

/// V6修复：带阴影的光照计算
fn computeLightingWithShadow(
  hit: HitInfo,
  ray_dir: vec3<f32>,
  world_pos: vec3<f32>
) -> vec3<f32> {
  if (hit.hit < 0.5) {
    return vec3<f32>(0.0);
  }
  
  let N = normalize(hit.normal);
  let L = normalize(uniforms.light_direction);
  let NdotL = max(dot(N, L), 0.0);
  
  // 计算阴影
  let shadow = computeShadow(world_pos, N);
  
  // 发光（不受阴影影响）
  var color = hit.color * hit.emission;
  
  // 漫反射（受阴影影响）
  color += hit.color * uniforms.light_color * NdotL * (1.0 - shadow);
  
  // 环境光（不受阴影影响）
  color += hit.color * uniforms.ambient_color;
  
  // 高光（Blinn-Phong，受阴影影响）
  let V = normalize(-ray_dir);
  let H = normalize(L + V);
  let NdotH = max(dot(N, H), 0.0);
  let specular = pow(NdotH, 32.0) * (1.0 - shadow);
  color += uniforms.light_color * specular * 0.5;
  
  return color;
}

/// 生成相机光线
fn generateCameraRay(
  pixel_coord: vec2<u32>,
  resolution: vec2<u32>,
  fov: f32
) -> Ray {
  var ray: Ray;
  
  // 归一化设备坐标
  let ndc = (vec2<f32>(pixel_coord) + 0.5) / vec2<f32>(resolution);
  ndc = ndc * 2.0 - 1.0;
  
  // 计算光线方向
  let aspect = resolution.x / resolution.y;
  let tan_fov = tan(fov * 0.5);
  
  ray.direction = normalize(vec3<f32>(
    ndc.x * aspect * tan_fov,
    ndc.y * tan_fov,
    -1.0
  ));
  
  ray.origin = uniforms.camera_position;
  ray.t_min = EPSILON;
  ray.t_max = 1000.0;
  
  return ray;
}

/// 主计算着色器 - V6修复：使用带阴影的光照
@compute @workgroup_size(8, 8, 1)
fn main(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>
) {
  let pixel_coord = global_id.xy;
  let resolution = uniforms.resolution;
  
  // 边界检查
  if (pixel_coord.x >= resolution.x || pixel_coord.y >= resolution.y) {
    return;
  }
  
  // 生成光线
  let ray = generateCameraRay(pixel_coord, resolution, 1.047); // 60 degrees
  
  // 遍历 SVO
  let hit = traverseSVO(ray);
  
  // 计算世界位置
  let world_pos = ray.origin + ray.direction * hit.t;
  
  // V6修复：使用带阴影的光照计算
  let color = computeLightingWithShadow(hit, ray.direction, world_pos);
  
  // 输出
  let output_index = pixel_coord.y * resolution.x + pixel_coord.x;
  output_buffer[output_index] = vec4<f32>(color, 1.0);
}
`;

/** 全局光照计算着色器 */
export const globalIlluminationShader = /* wgsl */`
struct LightProbe {
  position: vec3<f32>,
  irradiance: vec3<f32>,
  distance: f32,
}

// 光探针缓冲
@group(0) @binding(0) var<storage, read_write> light_probes: array<LightProbe>;
@group(0) @binding(1) var<storage, read> svo_nodes: array<SVONode>;
@group(0) @binding(2) var<storage, read> voxels: array<Voxel>;

/// 计算半球积分（蒙特卡洛）
fn hemisphereIntegral(
  position: vec3<f32>,
  normal: vec3<f32>,
  sample_count: u32
) -> vec3<f32> {
  var irradiance = vec3<f32>(0.0);
  
  for (var i = 0u; i < sample_count; i++) {
    // 生成半球方向（余弦加权）
    let xi = vec2<f32>(
      f32(i) / f32(sample_count),
      fract(f32(i) * 0.618)
    );
    
    let phi = 2.0 * 3.14159 * xi.x;
    let cos_theta = sqrt(1.0 - xi.y);
    let sin_theta = sqrt(xi.y);
    
    let sample_dir = vec3<f32>(
      cos(phi) * sin_theta,
      sin(phi) * sin_theta,
      cos_theta
    );
    
    // 构建正交基（TBN矩阵）将切线空间旋转到世界空间
    // 使用 Frisvad 方法从法线构建切线和副切线
    var tangent: vec3<f32>;
    var bitangent: vec3<f32>;
    
    if (abs(normal.y) < 0.999) {
      tangent = normalize(cross(normal, vec3<f32>(0.0, 1.0, 0.0)));
      bitangent = cross(normal, tangent);
    } else {
      tangent = vec3<f32>(1.0, 0.0, 0.0);
      bitangent = vec3<f32>(0.0, 0.0, 1.0);
    }
    
    // 将采样方向从切线空间变换到世界空间
    let world_sample_dir = normalize(
      tangent * sample_dir.x + 
      bitangent * sample_dir.y + 
      normal * sample_dir.z
    );
    
    // 发射光线
    var ray: Ray;
    ray.origin = position;
    ray.direction = world_sample_dir;
    ray.t_min = 0.001;
    ray.t_max = 100.0;
    
    let hit = traverseSVO(ray);
    
    if (hit.hit > 0.5) {
      irradiance += hit.color * hit.emission;
    }
  }
  
  return irradiance / f32(sample_count);
}

/// 更新光探针
@compute @workgroup_size(16, 16, 1)
fn updateLightProbes(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let probe_index = global_id.x + global_id.y * 64u; // 64x64 probe grid
  
  let probe = light_probes[probe_index];
  
  // 计算辐照度
  probe.irradiance = hemisphereIntegral(probe.position, vec3<f32>(0.0, 1.0, 0.0), 32u);
  
  light_probes[probe_index] = probe;
}
`;

/** 降噪着色器（空间-时间降噪） */
export const denoiserShader = /* wgsl */`
@group(0) @binding(0) var current_frame: texture_2d<f32>;
@group(0) @binding(1) var previous_frame: texture_2d<f32>;
@group(0) @binding(2) var motion_vectors: texture_2d<f32>;
@group(0) @binding(3) var output_texture: texture_storage_2d<rgba16float, write>;

/// 空间降噪（双边滤波）
fn bilateralFilter(
  tex: texture_2d<f32>,
  uv: vec2<f32>,
  kernel_size: i32
) -> vec3<f32> {
  var color = vec3<f32>(0.0);
  var weight = 0.0;
  
  let center = textureLoad(tex, vec2<i32>(uv * vec2<f32>(textureDimensions(tex))), 0).rgb;
  
  for (var y = -kernel_size; y <= kernel_size; y++) {
    for (var x = -kernel_size; x <= kernel_size; x++) {
      let offset = vec2<i32>(x, y);
      let sample_coord = vec2<i32>(uv * vec2<f32>(textureDimensions(tex))) + offset;
      let sample_color = textureLoad(tex, sample_coord, 0).rgb;
      
      let spatial_weight = exp(-f32(x*x + y*y) / f32(kernel_size * kernel_size));
      let range_weight = exp(-length(sample_color - center) * length(sample_color - center) / 0.1);
      
      let w = spatial_weight * range_weight;
      color += sample_color * w;
      weight += w;
    }
  }
  
  return color / weight;
}

/// 时间累积
fn temporalAccumulation(
  current_color: vec3<f32>,
  previous_color: vec3<f32>,
  blend_factor: f32
) -> vec3<f32> {
  // 颜色裁剪（防止鬼影）
  let min_color = min(current_color, previous_color) * 1.2;
  let max_color = max(current_color, previous_color) * 1.2;
  let clipped_prev = clamp(previous_color, min_color, max_color);
  
  return mix(clipped_prev, current_color, blend_factor);
}

@compute @workgroup_size(8, 8, 1)
fn denoise(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let pixel_coord = vec2<i32>(global_id.xy);
  
  // 空间降噪
  let denoised = bilateralFilter(current_frame, vec2<f32>(pixel_coord) / vec2<f32>(textureDimensions(current_frame)), 3);
  
  // 时间累积
  let previous_color = textureLoad(previous_frame, pixel_coord, 0).rgb;
  let final_color = temporalAccumulation(denoised, previous_color, 0.1);
  
  textureStore(output_texture, pixel_coord, vec4<f32>(final_color, 1.0));
}
`;

export const raytracingShaders = {
  svoTraversal: svoTraversalShader,
  globalIllumination: globalIlluminationShader,
  denoiser: denoiserShader,
};

export default raytracingShaders;
