/**
 * =============================================================================
 * A* 寻路算法 - A* Pathfinding Algorithm
 * 使用二叉堆优化的优先队列
 * =============================================================================
 */

export interface Point {
  x: number;
  y: number;
}

export interface PathResult {
  path: Point[];
  length: number;
  explored: number;
  found: boolean;
}

class MinHeap<T> {
  private heap: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }
      if (rightChild < length && this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export class PathFinder {
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * 曼哈顿距离启发函数
   */
  private manhattanDistance(a: Point, b: Point): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * 对角线距离启发函数
   */
  private diagonalDistance(a: Point, b: Point): number {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.max(dx, dy);
  }

  /**
   * 检查坐标是否有效
   */
  private isValid(x: number, y: number, obstacles: Uint8Array): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    return obstacles[y * this.width + x] === 0;
  }

  /**
   * 查找最短路径
   * @param startX 起点X
   * @param startY 起点Y
   * @param endX 终点X
   * @param endY 终点Y
   * @param obstacles 障碍物数组（0=可通行，1=障碍）
   * @param diagonal 是否允许斜向移动
   */
  public findPath(
    startX: number, startY: number,
    endX: number, endY: number,
    obstacles: Uint8Array,
    diagonal: boolean = false
  ): PathResult {
    const start = { x: startX, y: startY };
    const end = { x: endX, y: endY };

    // 检查起点终点是否有效
    if (!this.isValid(startX, startY, obstacles) || !this.isValid(endX, endY, obstacles)) {
      return { path: [], length: -1, explored: 0, found: false };
    }

    // 起点就是终点
    if (startX === endX && startY === endY) {
      return { path: [start], length: 0, explored: 1, found: true };
    }

    const openSet = new MinHeap<Node>((a, b) => a.f - b.f);
    const closedSet = new Set<string>();
    const nodeMap = new Map<string, Node>();
    let explored = 0;

    const startNode: Node = {
      x: startX,
      y: startY,
      g: 0,
      h: this.diagonalDistance(start, end),
      f: this.diagonalDistance(start, end),
      parent: null,
    };

    openSet.push(startNode);
    nodeMap.set(`${startX},${startY}`, startNode);

    // 8方向或4方向移动
    const directions = diagonal
      ? [
          { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
          { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
        ]
      : [
          { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
        ];

    while (!openSet.isEmpty()) {
      const current = openSet.pop()!;
      explored++;

      // 找到终点
      if (current.x === endX && current.y === endY) {
        const path: Point[] = [];
        let node: Node | null = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        return { path, length: current.g, explored, found: true };
      }

      closedSet.add(`${current.x},${current.y}`);

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const key = `${nx},${ny}`;

        if (!this.isValid(nx, ny, obstacles) || closedSet.has(key)) {
          continue;
        }

        // 斜向移动时检查角落障碍
        if (diagonal && dir.dx !== 0 && dir.dy !== 0) {
          if (!this.isValid(current.x + dir.dx, current.y, obstacles) ||
              !this.isValid(current.x, current.y + dir.dy, obstacles)) {
            continue;
          }
        }

        const moveCost = diagonal && dir.dx !== 0 && dir.dy !== 0 ? Math.SQRT2 : 1;
        const tentativeG = current.g + moveCost;

        let neighbor = nodeMap.get(key);
        if (!neighbor) {
          neighbor = {
            x: nx,
            y: ny,
            g: Infinity,
            h: this.diagonalDistance({ x: nx, y: ny }, end),
            f: Infinity,
            parent: null,
          };
          nodeMap.set(key, neighbor);
        }

        if (tentativeG < neighbor.g) {
          neighbor.parent = current;
          neighbor.g = tentativeG;
          neighbor.f = tentativeG + neighbor.h;
          openSet.push(neighbor);
        }
      }
    }

    // 未找到路径
    return { path: [], length: -1, explored, found: false };
  }

  /**
   * 批量寻路（用于多市民）
   */
  public findPaths(
    starts: Point[],
    ends: Point[],
    obstacles: Uint8Array
  ): PathResult[] {
    return starts.map((start, i) =>
      this.findPath(start.x, start.y, ends[i].x, ends[i].y, obstacles, true)
    );
  }

  /**
   * 生成随机障碍地图
   */
  public generateRandomMap(density: number = 0.3): Uint8Array {
    const map = new Uint8Array(this.width * this.height);
    for (let i = 0; i < map.length; i++) {
      if (Math.random() < density) {
        map[i] = 1;
      }
    }
    return map;
  }
}
