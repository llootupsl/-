//! A* 路径寻路模块
//!
//! 实现高效的 A* 算法用于市民导航

use wasm_bindgen::prelude::*;
use std::collections::BinaryHeap;
use std::cmp::Ordering;

/// 网格节点
#[derive(Clone, Debug)]
struct Node {
    x: i32,
    y: i32,
    g: f32,
    h: f32,
    f: f32,
    parent: Option<(i32, i32)>,
}

impl Node {
    fn new(x: i32, y: i32, g: f32, h: f32, parent: Option<(i32, i32)>) -> Self {
        Node { x, y, g, h, f: g + h, parent }
    }
}

impl Ord for Node {
    fn cmp(&self, other: &Self) -> Ordering {
        // Reverse ordering for max heap
        other.f.partial_cmp(&self.f).unwrap_or(Ordering::Equal)
    }
}

impl PartialOrd for Node {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Eq for Node {}

impl PartialEq for Node {
    fn eq(&self, other: &Self) -> bool {
        self.x == other.x && self.y == other.y
    }
}

/// A* 寻路器
#[wasm_bindgen]
pub struct PathFinder {
    width: i32,
    height: i32,
}

#[wasm_bindgen]
impl PathFinder {
    #[wasm_bindgen(constructor)]
    pub fn new(width: i32, height: i32) -> Self {
        PathFinder { width, height }
    }

    pub fn find_path(
        &self,
        start_x: i32,
        start_y: i32,
        end_x: i32,
        end_y: i32,
        obstacles: &[u8],
        diagonal: bool,
    ) -> Vec<i32> {
        if !self.is_valid(start_x, start_y) || !self.is_valid(end_x, end_y) {
            return vec![];
        }

        let start_idx = (start_y * self.width + start_x) as usize;
        let end_idx = (end_y * self.width + end_x) as usize;

        if obstacles.len() <= start_idx || obstacles.len() <= end_idx {
            return vec![];
        }

        if obstacles[start_idx] == 1 || obstacles[end_idx] == 1 {
            return vec![];
        }

        if start_x == end_x && start_y == end_y {
            return vec![start_x, start_y];
        }

        let mut open_set: BinaryHeap<Node> = BinaryHeap::new();
        let mut closed_set = std::collections::HashSet::new();
        let mut g_scores = std::collections::HashMap::new();

        let start_node = Node::new(start_x, start_y, 0.0, self.heuristic(start_x, start_y, end_x, end_y), None);
        open_set.push(start_node);
        g_scores.insert((start_x, start_y), 0.0);

        let directions: Vec<(i32, i32)> = if diagonal {
            vec![(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        } else {
            vec![(-1, 0), (1, 0), (0, -1), (0, 1)]
        };

        let max_iterations = self.width * self.height;
        let mut iterations = 0;

        while let Some(current) = open_set.pop() {
            iterations += 1;
            if iterations > max_iterations {
                break;
            }

            if current.x == end_x && current.y == end_y {
                return self.reconstruct_path(current);
            }

            let current_pos = (current.x, current.y);
            if closed_set.contains(&current_pos) {
                continue;
            }
            closed_set.insert(current_pos);

            for &(dx, dy) in &directions {
                let nx = current.x + dx;
                let ny = current.y + dy;

                if !self.is_valid(nx, ny) {
                    continue;
                }

                let neighbor_idx = (ny * self.width + nx) as usize;
                if obstacles.len() <= neighbor_idx || obstacles[neighbor_idx] == 1 {
                    continue;
                }

                if diagonal && dx != 0 && dy != 0 {
                    let idx1 = (current.y * self.width + nx) as usize;
                    let idx2 = (ny * self.width + current.x) as usize;
                    if obstacles.len() > idx1 && obstacles.len() > idx2 {
                        if obstacles[idx1] == 1 || obstacles[idx2] == 1 {
                            continue;
                        }
                    }
                }

                let neighbor_pos = (nx, ny);
                if closed_set.contains(&neighbor_pos) {
                    continue;
                }

                let move_cost = if dx != 0 && dy != 0 { 1.414 } else { 1.0 };
                let tentative_g = current.g + move_cost;

                let current_best_g = g_scores.get(&neighbor_pos).copied().unwrap_or(f32::MAX);

                if tentative_g < current_best_g {
                    g_scores.insert(neighbor_pos, tentative_g);
                    let h = self.heuristic(nx, ny, end_x, end_y);
                    let neighbor_node = Node::new(nx, ny, tentative_g, h, Some(current_pos));
                    open_set.push(neighbor_node);
                }
            }
        }

        vec![]
    }

    fn is_valid(&self, x: i32, y: i32) -> bool {
        x >= 0 && x < self.width && y >= 0 && y < self.height
    }

    fn heuristic(&self, x1: i32, y1: i32, x2: i32, y2: i32) -> f32 {
        let dx = (x1 - x2).abs() as f32;
        let dy = (y1 - y2).abs() as f32;
        let diag = dx.min(dy);
        let straight = dx + dy - 2.0 * diag;
        straight + 1.414 * diag
    }

    fn reconstruct_path(&self, mut node: Node) -> Vec<i32> {
        let mut path = vec![];
        loop {
            path.push(node.x);
            path.push(node.y);
            match node.parent {
                Some(parent) => {
                    node = Node::new(parent.0, parent.1, 0.0, 0.0, None);
                }
                None => break,
            }
        }
        path.reverse();
        path
    }

    pub fn path_length(&self, path: &[i32]) -> f32 {
        if path.len() < 4 {
            return 0.0;
        }
        let mut length = 0.0f32;
        let mut i = 0;
        while i + 3 < path.len() {
            let dx = path[i + 2] - path[i];
            let dy = path[i + 3] - path[i + 1];
            length += ((dx * dx + dy * dy) as f32).sqrt();
            i += 2;
        }
        length
    }

    pub fn find_nearest(
        &self,
        start_x: i32,
        start_y: i32,
        targets: &[i32],
        obstacles: &[u8],
    ) -> Vec<i32> {
        if targets.len() < 2 || targets.len() % 2 != 0 {
            return vec![];
        }
        let mut best_path = vec![];
        let mut best_length = f32::MAX;
        for i in (0..targets.len()).step_by(2) {
            let tx = targets[i];
            let ty = targets[i + 1];
            let path = self.find_path(start_x, start_y, tx, ty, obstacles, true);
            if !path.is_empty() {
                let length = self.path_length(&path);
                if length < best_length {
                    best_length = length;
                    best_path = path;
                }
            }
        }
        best_path
    }
}
