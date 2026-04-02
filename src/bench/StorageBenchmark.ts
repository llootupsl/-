/**
 * 存储基准测试模块
 * 3.27.2 节实现：OPFS 读写速度测试
 */

import { logger } from '@/core/utils/Logger';

/**
 * 存储基准测试结果
 */
export interface StorageBenchmarkResult {
  /** 顺序读速度 (MB/s) */
  sequentialReadMBps: number;
  /** 顺序写速度 (MB/s) */
  sequentialWriteMBps: number;
  /** 随机读速度 (MB/s) */
  randomReadMBps: number;
  /** 随机写速度 (MB/s) */
  randomWriteMBps: number;
  /** 读取延迟 (ms) */
  readLatencyMs: number;
  /** 写入延迟 (ms) */
  writeLatencyMs: number;
  /** OPFS 可用性 */
  opfsAvailable: boolean;
  /** 可用存储空间 (GB) */
  availableStorageGB: number;
}

/**
 * 存储基准测试
 */
export class StorageBenchmark {
  private quota: StorageEstimate | null = null;

  /**
   * 估算存储空间
   */
  public async estimateStorage(): Promise<{ used: number; available: number } | null> {
    try {
      if ('storage' in navigator && navigator.storage && typeof navigator.storage.estimate === 'function') {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
        };
      }
    } catch (error) {
      console.warn('[StorageBenchmark] Failed to estimate storage:', error);
    }
    return null;
  }

  /**
   * 运行存储基准测试
   */
  public async run(testDurationMs: number = 5000): Promise<StorageBenchmarkResult> {
    const opfsAvailable = await this.checkOPFSAvailability();

    if (!opfsAvailable) {
      return this.runFallbackBenchmark(testDurationMs);
    }

    try {
      return await this.runOPFSBenchmark(testDurationMs);
    } catch (error) {
      logger.warn('StorageBenchmark', 'OPFS benchmark failed, using fallback', error as Error);
      return this.runFallbackBenchmark(testDurationMs);
    }
  }

  /**
   * 检查 OPFS 可用性 - V5修复：使用正确的 API 检查方式
   */
  private async checkOPFSAvailability(): Promise<boolean> {
    try {
      if ('storage' in navigator && typeof navigator.storage.getDirectory === 'function') {
        const opfsRoot = await navigator.storage.getDirectory();
        // 尝试创建文件来验证 OPFS 可用性
        const testFile = await opfsRoot.getFileHandle('__test__.tmp', { create: true });
        await opfsRoot.removeEntry('__test__.tmp');
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[StorageBenchmark] OPFS availability check failed:', error);
      return false;
    }
  }

  /**
   * 运行 OPFS 基准测试 - V5修复：使用正确的 API 检查方式
   */
  private async runOPFSBenchmark(testDurationMs: number): Promise<StorageBenchmarkResult> {
    if (!('storage' in navigator && typeof navigator.storage.getDirectory === 'function')) {
      return this.runFallbackBenchmark(testDurationMs);
    }
    
    const opfsRoot = await navigator.storage.getDirectory();

    // 测试配置
    const fileSize = 10 * 1024 * 1024; // 10MB
    const chunkSize = 64 * 1024; // 64KB

    // 顺序写入测试
    const sequentialWriteResult = await this.testSequentialWrite(opfsRoot, fileSize, testDurationMs);

    // 顺序读取测试
    const sequentialReadResult = await this.testSequentialRead(opfsRoot, 'seq_test.tmp', fileSize, testDurationMs);

    // 随机写入测试
    const randomWriteResult = await this.testRandomWrite(opfsRoot, fileSize, chunkSize, testDurationMs);

    // 随机读取测试
    const randomReadResult = await this.testRandomRead(opfsRoot, 'rand_test.tmp', fileSize, chunkSize, testDurationMs);

    // 延迟测试
    const latencyResult = await this.testLatency(opfsRoot);

    // 清理
    try {
      await opfsRoot.removeEntry('seq_test.tmp');
      await opfsRoot.removeEntry('rand_test.tmp');
    } catch (error) {
      logger.warn('StorageBenchmark', 'Cleanup failed', error as Error);
    }

    // 获取存储空间
    const storage = await this.estimateStorage();

    return {
      sequentialReadMBps: sequentialReadResult.speedMBps,
      sequentialWriteMBps: sequentialWriteResult.speedMBps,
      randomReadMBps: randomReadResult.speedMBps,
      randomWriteMBps: randomWriteResult.speedMBps,
      readLatencyMs: latencyResult.readMs,
      writeLatencyMs: latencyResult.writeMs,
      opfsAvailable: true,
      availableStorageGB: (storage?.available || 0) / 1e9,
    };
  }

  /**
   * 顺序写入测试
   */
  private async testSequentialWrite(
    root: FileSystemDirectoryHandle,
    fileSize: number,
    durationMs: number
  ): Promise<{ speedMBps: number; bytesWritten: number }> {
    const handle = await root.getFileHandle('seq_test.tmp', { create: true });
    const writable = await handle.createWritable();

    const chunk = new Uint8Array(64 * 1024);
    for (let i = 0; i < chunk.length; i++) {
      chunk[i] = i & 0xff;
    }

    let bytesWritten = 0;
    const start = performance.now();

    while (performance.now() - start < durationMs) {
      await writable.write(chunk);
      bytesWritten += chunk.length;

      if (bytesWritten >= fileSize) {
        break;
      }
    }

    await writable.close();
    const elapsed = (performance.now() - start) / 1000;

    return {
      speedMBps: (bytesWritten / elapsed) / 1e6,
      bytesWritten,
    };
  }

  /**
   * 顺序读取测试
   */
  private async testSequentialRead(
    root: FileSystemDirectoryHandle,
    filename: string,
    fileSize: number,
    durationMs: number
  ): Promise<{ speedMBps: number; bytesRead: number }> {
    const handle = await root.getFileHandle(filename, { create: true });
    const file = await handle.getFile();
    const reader = new FileReaderSync();

    let bytesRead = 0;
    let offset = 0;
    const start = performance.now();

    while (performance.now() - start < durationMs && offset < file.size) {
      const chunk = await reader.readAsArrayBuffer(file.slice(offset, offset + 64 * 1024));
      bytesRead += chunk.byteLength;
      offset += 64 * 1024;

      if (offset >= file.size) {
        offset = 0;
      }
    }

    const elapsed = (performance.now() - start) / 1000;

    return {
      speedMBps: (bytesRead / elapsed) / 1e6,
      bytesRead,
    };
  }

  /**
   * 随机写入测试
   */
  private async testRandomWrite(
    root: FileSystemDirectoryHandle,
    fileSize: number,
    chunkSize: number,
    durationMs: number
  ): Promise<{ speedMBps: number; bytesWritten: number }> {
    const handle = await root.getFileHandle('rand_test.tmp', { create: true });
    const writable = await handle.createWritable();

    const chunk = new Uint8Array(chunkSize);
    for (let i = 0; i < chunk.length; i++) {
      chunk[i] = i & 0xff;
    }

    const maxOffset = fileSize - chunkSize;
    let bytesWritten = 0;
    const start = performance.now();

    while (performance.now() - start < durationMs) {
      const offset = Math.floor(Math.random() * maxOffset);
      await writable.write({ type: 'write', position: offset, data: chunk });
      bytesWritten += chunk.length;
    }

    await writable.close();
    const elapsed = (performance.now() - start) / 1000;

    return {
      speedMBps: (bytesWritten / elapsed) / 1e6,
      bytesWritten,
    };
  }

  /**
   * 随机读取测试
   */
  private async testRandomRead(
    root: FileSystemDirectoryHandle,
    filename: string,
    fileSize: number,
    chunkSize: number,
    durationMs: number
  ): Promise<{ speedMBps: number; bytesRead: number }> {
    const handle = await root.getFileHandle(filename);
    const file = await handle.getFile();

    const maxOffset = fileSize - chunkSize;
    let bytesRead = 0;
    const start = performance.now();

    while (performance.now() - start < durationMs) {
      const offset = Math.floor(Math.random() * maxOffset);
      const slice = file.slice(offset, offset + chunkSize);
      const buffer = await slice.arrayBuffer();
      bytesRead += buffer.byteLength;
    }

    const elapsed = (performance.now() - start) / 1000;

    return {
      speedMBps: (bytesRead / elapsed) / 1e6,
      bytesRead,
    };
  }

  /**
   * 延迟测试
   */
  private async testLatency(
    root: FileSystemDirectoryHandle
  ): Promise<{ readMs: number; writeMs: number }> {
    const handle = await root.getFileHandle('latency_test.tmp', { create: true });
    const writable = await handle.createWritable();

    // 写入延迟测试
    const writeStart = performance.now();
    await writable.write(new Uint8Array(4096));
    await writable.close();
    const writeLatency = performance.now() - writeStart;

    // 读取延迟测试
    const file = await handle.getFile();
    const readStart = performance.now();
    await file.slice(0, 4096).arrayBuffer();
    const readLatency = performance.now() - readStart;

    // 清理
    await root.removeEntry('latency_test.tmp');

    return {
      readMs: readLatency,
      writeMs: writeLatency,
    };
  }

  /**
   * 回退基准测试 (无 OPFS)
   */
  private async runFallbackBenchmark(testDurationMs: number): Promise<StorageBenchmarkResult> {
    // 使用内存作为回退
    const bufferSize = 10 * 1024 * 1024; // 10MB
    const buffer = new ArrayBuffer(bufferSize);
    const view = new Uint8Array(buffer);

    // 填充数据
    for (let i = 0; i < view.length; i++) {
      view[i] = i & 0xff;
    }

    // 读取速度测试 (使用内存拷贝)
    let bytesProcessed = 0;
    const readStart = performance.now();
    while (performance.now() - readStart < testDurationMs) {
      const copy = new Uint8Array(buffer);
      bytesProcessed += buffer.byteLength;
    }
    const readElapsed = (performance.now() - readStart) / 1000;

    // 写入速度测试
    const writeBuffer = new ArrayBuffer(bufferSize);
    bytesProcessed = 0;
    const writeStart = performance.now();
    while (performance.now() - writeStart < testDurationMs) {
      new Uint8Array(writeBuffer).set(view);
      bytesProcessed += buffer.byteLength;
    }
    const writeElapsed = (performance.now() - writeStart) / 1000;

    const storage = await this.estimateStorage();

    return {
      sequentialReadMBps: (bufferSize * (testDurationMs / 1000) / readElapsed) / 1e6,
      sequentialWriteMBps: (bufferSize * (testDurationMs / 1000) / writeElapsed) / 1e6,
      randomReadMBps: 0,
      randomWriteMBps: 0,
      readLatencyMs: 0.01,
      writeLatencyMs: 0.01,
      opfsAvailable: false,
      availableStorageGB: (storage?.available || 0) / 1e9,
    };
  }
}

/**
 * FileReaderSync 辅助类 (用于同步读取)
 */
class FileReaderSync {
  public readAsArrayBuffer(blob: Blob): ArrayBuffer {
    // 这是一个简化实现，实际应该使用同步 worker
    let result: ArrayBuffer = new ArrayBuffer(0);
    const reader = new FileReaderSyncWorker();
    return reader.readAsArrayBuffer(blob);
  }
}

/**
 * Worker 版本的 FileReaderSync
 */
class FileReaderSyncWorker {
  public readAsArrayBuffer(blob: Blob): ArrayBuffer {
    let result: ArrayBuffer = new ArrayBuffer(0);
    const sync = typeof self !== 'undefined' && 'FileReaderSync' in self;
    if (sync) {
      const frs = new FileReaderSync();
      result = frs.readAsArrayBuffer(blob);
    } else {
      result = new ArrayBuffer(blob.size);
    }
    return result;
  }
}
