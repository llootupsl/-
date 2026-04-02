/**
 * 预热 Worker
 * 用于在后台线程执行 CPU 密集计算，触发 CPU 升频
 */

self.onmessage = async (e: MessageEvent) => {
  const { type, durationMs, hasSharedArrayBuffer, workerIndex } = e.data;

  if (type === 'compute') {
    await runCompute(durationMs, hasSharedArrayBuffer, workerIndex);
  }
};

/**
 * 执行计算任务
 */
async function runCompute(
  durationMs: number,
  hasSharedArrayBuffer: boolean,
  workerIndex: number
): Promise<void> {
  const end = performance.now() + durationMs;
  let result = 0;
  let iteration = 0;

  // 如果支持 SharedArrayBuffer，执行原子操作
  if (hasSharedArrayBuffer) {
    try {
      // 创建一个 SharedArrayBuffer 用于原子操作
      const buffer = new SharedArrayBuffer(1024);
      const view = new Int32Array(buffer);

      while (performance.now() < end) {
        // 执行原子操作
        for (let i = 0; i < 64; i++) {
          Atomics.store(view, i, iteration++);
          Atomics.add(view, i, 1);
          result += Math.sin(Atomics.load(view, i));
        }
      }
    } catch (error) {
      console.warn('[warmup.worker] SharedArrayBuffer operations failed, falling back to regular computation:', error);
      while (performance.now() < end) {
        for (let i = 0; i < 100; i++) {
          result += Math.sin(i) * Math.cos(i) * Math.tan(i);
        }
        iteration++;
      }
    }
  } else {
    // 不支持 SharedArrayBuffer，执行普通计算
    while (performance.now() < end) {
      for (let i = 0; i < 100; i++) {
        result += Math.sin(i) * Math.cos(i) * Math.tan(i);
      }
      iteration++;
    }
  }

  // 发送完成消息
  self.postMessage({
    type: 'compute-done',
    workerIndex,
    iterations: iteration,
    lastResult: result,
  });
}

// 导出为空（Worker 模块）
export {};
