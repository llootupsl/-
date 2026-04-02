/**
 * 基准测试 Worker
 * 用于在后台线程执行 CPU 密集计算
 */

self.onmessage = async (e: MessageEvent) => {
  const { type, durationMs } = e.data;

  if (type === 'compute') {
    const mips = await runComputation(durationMs);
    self.postMessage({ type: 'result', mips });
  }
};

/**
 * 运行计算
 */
async function runComputation(durationMs: number): Promise<number> {
  const start = performance.now();
  let iterations = 0;
  let result = 0;

  while (performance.now() - start < durationMs) {
    for (let i = 0; i < 10000; i++) {
      result += Math.sin(i) * Math.cos(i) * Math.tan(i);
    }
    iterations++;
  }

  const elapsed = performance.now() - start;
  return (iterations * 10000) / elapsed / 1e6; // MIPS
}

// 导出为空
export {};
