/**
 * 基准测试面板 UI 组件
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/core/utils/Logger';
import { CPUBenchmark } from './CPUBenchmark';
import { GPUBenchmark } from './GPUBenchmark';
import { StorageBenchmark } from './StorageBenchmark';
import { MemoryBenchmark } from './MemoryBenchmark';
import type { BenchmarkConfig, DeviceInfo } from './BenchmarkSuite';
import { getDeviceInfo } from './BenchmarkSuite';

interface BenchmarkPanelProps {
  /** 类名 */
  className?: string;
  /** 初始配置 */
  initialConfig?: Partial<BenchmarkConfig>;
  /** 测试完成回调 */
  onComplete?: (results: BenchmarkReport) => void;
  /** 进度更新回调 */
  onProgress?: (progress: number, stage: string) => void;
}

/**
 * 单个测试结果
 */
interface TestResult {
  name: string;
  value: number;
  unit: string;
  score: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

/**
 * 基准测试报告
 */
interface BenchmarkReport {
  overallScore: number;
  tests: TestResult[];
  device: DeviceInfo;
  timestamp: number;
  config: BenchmarkConfig;
}

/**
 * 基准测试面板组件
 */
export const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({
  className,
  initialConfig,
  onComplete,
  onProgress,
}) => {
  // 状态
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [config, setConfig] = useState<BenchmarkConfig>({
    duration: initialConfig?.duration ?? 30,
    loadLevel: initialConfig?.loadLevel ?? 'standard',
    warmupSeconds: initialConfig?.warmupSeconds ?? 5,
  });

  // Refs
  const cpuBenchmark = useRef(new CPUBenchmark());
  const gpuBenchmark = useRef(new GPUBenchmark());
  const storageBenchmark = useRef(new StorageBenchmark());
  const memoryBenchmark = useRef(new MemoryBenchmark());

  // 获取设备信息
  useEffect(() => {
    const info = getDeviceInfo();
    setDeviceInfo(info);
  }, []);

  // 更新进度
  const updateProgress = useCallback((stage: string, prog: number) => {
    setCurrentStage(stage);
    setProgress(prog);
    onProgress?.(prog, stage);
  }, [onProgress]);

  // 添加测试结果
  const addResult = useCallback((name: string, value: number, unit: string, score: number) => {
    setResults(prev => [
      ...prev.filter(r => r.name !== name),
      { name, value, unit, score, status: 'completed' as const },
    ]);
  }, []);

  // 运行基准测试
  const runBenchmark = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setCurrentStage('初始化...');

    try {
      // 1. CPU 基准测试
      updateProgress('CPU 基准测试', 10);
      setResults(prev => [...prev, { name: 'CPU 单核', value: 0, unit: 'MIPS', score: 0, status: 'running' }]);
      setResults(prev => [...prev, { name: 'CPU 多核', value: 0, unit: 'MIPS', score: 0, status: 'running' }]);
      setResults(prev => [...prev, { name: 'CPU 加速比', value: 0, unit: 'x', score: 0, status: 'running' }]);

      const cpuResult = await cpuBenchmark.current.run(config.duration * 1000);
      addResult('CPU 单核', cpuResult.singleCoreMIPS, 'MIPS', Math.min(100, cpuResult.singleCoreMIPS / 100));
      addResult('CPU 多核', cpuResult.multiCoreMIPS, 'MIPS', Math.min(100, cpuResult.multiCoreMIPS / 100));
      addResult('CPU 加速比', cpuResult.speedupRatio, 'x', Math.min(100, cpuResult.speedupRatio * 20));

      updateProgress('GPU 基准测试', 40);
      setResults(prev => [...prev, { name: 'GPU FPS', value: 0, unit: 'FPS', score: 0, status: 'running' }]);
      setResults(prev => [...prev, { name: 'GPU GFLOPS', value: 0, unit: 'GFLOPS', score: 0, status: 'running' }]);

      const gpuResult = await gpuBenchmark.current.run(config.duration * 1000);
      addResult('GPU FPS', gpuResult.renderFPS, 'FPS', Math.min(100, gpuResult.renderFPS / 6));
      addResult('GPU GFLOPS', gpuResult.computeGflops, 'GFLOPS', Math.min(100, gpuResult.computeGflops / 10));

      updateProgress('存储基准测试', 60);
      setResults(prev => [...prev, { name: '存储读取', value: 0, unit: 'MB/s', score: 0, status: 'running' }]);
      setResults(prev => [...prev, { name: '存储写入', value: 0, unit: 'MB/s', score: 0, status: 'running' }]);

      const storageResult = await storageBenchmark.current.run(config.duration * 1000);
      addResult('存储读取', storageResult.sequentialReadMBps, 'MB/s', Math.min(100, storageResult.sequentialReadMBps / 100));
      addResult('存储写入', storageResult.sequentialWriteMBps, 'MB/s', Math.min(100, storageResult.sequentialWriteMBps / 50));

      updateProgress('内存基准测试', 80);
      setResults(prev => [...prev, { name: '内存分配', value: 0, unit: 'MB/s', score: 0, status: 'running' }]);
      setResults(prev => [...prev, { name: '内存带宽', value: 0, unit: 'GB/s', score: 0, status: 'running' }]);

      const memoryResult = await memoryBenchmark.current.run(config.duration * 1000);
      addResult('内存分配', memoryResult.allocationMBps, 'MB/s', Math.min(100, memoryResult.allocationMBps / 1000));
      addResult('内存带宽', memoryResult.sequentialBandwidthGBps, 'GB/s', Math.min(100, memoryResult.sequentialBandwidthGBps * 10));

      updateProgress('计算总分', 95);

      // 计算总分
      const overallScore = results
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.score, 0) / results.length;

      const report: BenchmarkReport = {
        overallScore,
        tests: results,
        device: deviceInfo!,
        timestamp: Date.now(),
        config,
      };

      updateProgress('完成', 100);
      onComplete?.(report);

    } catch (error) {
      logger.error('Benchmark', 'Benchmark failed', error as Error);
      setCurrentStage('测试失败');
    } finally {
      setIsRunning(false);
    }
  }, [config, deviceInfo, results, addResult, updateProgress, onComplete]);

  // 清理
  useEffect(() => {
    return () => {
      cpuBenchmark.current.dispose();
      memoryBenchmark.current.dispose();
    };
  }, []);

  return (
    <div className={`benchmark-panel ${className || ''}`} style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>性能基准测试</h2>
        {deviceInfo && (
          <div style={styles.deviceInfo}>
            <span>{deviceInfo.browser} {deviceInfo.browserVersion}</span>
            <span>{deviceInfo.os}</span>
            <span>{deviceInfo.cpuCores} 核</span>
            <span>{deviceInfo.gpu || 'Unknown GPU'}</span>
          </div>
        )}
      </div>

      {/* 配置 */}
      <div style={styles.config}>
        <label style={styles.configLabel}>
          测试时长:
          <select
            value={config.duration}
            onChange={e => setConfig({ ...config, duration: Number(e.target.value) as BenchmarkConfig['duration'] })}
            disabled={isRunning}
            style={styles.select}
          >
            <option value={10}>10秒</option>
            <option value={30}>30秒</option>
            <option value={60}>60秒</option>
            <option value={120}>120秒</option>
          </select>
        </label>

        <label style={styles.configLabel}>
          负载等级:
          <select
            value={config.loadLevel}
            onChange={e => setConfig({ ...config, loadLevel: e.target.value as BenchmarkConfig['loadLevel'] })}
            disabled={isRunning}
            style={styles.select}
          >
            <option value="light">轻量</option>
            <option value="standard">标准</option>
            <option value="extreme">极限</option>
          </select>
        </label>

        <button
          onClick={runBenchmark}
          disabled={isRunning}
          style={{
            ...styles.button,
            ...(isRunning ? styles.buttonDisabled : {}),
          }}
        >
          {isRunning ? '测试中...' : '开始测试'}
        </button>
      </div>

      {/* 进度条 */}
      {isRunning && (
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <div style={styles.progressText}>
            {currentStage} ({progress.toFixed(0)}%)
          </div>
        </div>
      )}

      {/* 结果列表 */}
      <div style={styles.results}>
        <h3 style={styles.resultsTitle}>测试结果</h3>
        {results.length === 0 && (
          <div style={styles.noResults}>点击"开始测试"运行基准测试</div>
        )}
        {results.map((result, index) => (
          <ResultRow key={index} result={result} />
        ))}
      </div>

      {/* 综合评分 */}
      {results.filter(r => r.status === 'completed').length > 0 && (
        <ScoreCard results={results} />
      )}
    </div>
  );
};

/**
 * 结果行组件
 */
const ResultRow: React.FC<{ result: TestResult }> = ({ result }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--color-bench-success)';
      case 'running': return 'var(--color-bench-running)';
      case 'failed': return 'var(--color-bench-failed)';
      default: return 'var(--color-bench-neutral)';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-bench-success)';
    if (score >= 60) return 'var(--color-bench-running)';
    if (score >= 40) return 'var(--color-bench-grade-d)';
    return 'var(--color-bench-failed)';
  };

  return (
    <div style={styles.resultRow}>
      <div style={styles.resultName}>{result.name}</div>
      <div style={styles.resultValue}>
        {result.value > 0 ? result.value.toFixed(2) : '--'} {result.unit}
      </div>
      <div style={styles.resultScore}>
        <div style={styles.scoreBar}>
          <div
            style={{
              ...styles.scoreFill,
              width: `${result.score}%`,
              backgroundColor: getScoreColor(result.score),
            }}
          />
        </div>
        <span style={{ color: getScoreColor(result.score) }}>
          {result.score.toFixed(0)}
        </span>
      </div>
      <div style={{ ...styles.resultStatus, color: getStatusColor(result.status) }}>
        {result.status === 'completed' && '✓'}
        {result.status === 'running' && '⟳'}
        {result.status === 'failed' && '✗'}
        {result.status === 'pending' && '○'}
      </div>
    </div>
  );
};

/**
 * 评分卡片组件
 */
const ScoreCard: React.FC<{ results: TestResult[] }> = ({ results }) => {
  const completedResults = results.filter(r => r.status === 'completed');
  const overallScore = completedResults.length > 0
    ? completedResults.reduce((sum, r) => sum + r.score, 0) / completedResults.length
    : 0;

  const getGrade = (score: number) => {
    if (score >= 90) return { letter: 'A+', color: 'var(--color-bench-grade-a)' };
    if (score >= 80) return { letter: 'A', color: 'var(--color-bench-grade-a)' };
    if (score >= 70) return { letter: 'B', color: 'var(--color-bench-grade-b)' };
    if (score >= 60) return { letter: 'C', color: 'var(--color-bench-grade-c)' };
    if (score >= 50) return { letter: 'D', color: 'var(--color-bench-grade-d)' };
    return { letter: 'F', color: 'var(--color-bench-grade-f)' };
  };

  const grade = getGrade(overallScore);

  return (
    <div style={styles.scoreCard}>
      <div style={styles.scoreCardTitle}>综合评分</div>
      <div style={{ ...styles.scoreCardValue, color: grade.color }}>
        {grade.letter} ({overallScore.toFixed(1)})
      </div>
      <div style={styles.scoreCardSubtitle}>
        基于 {completedResults.length} 项测试
      </div>
    </div>
  );
};

/**
 * 样式
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'var(--color-bg-overlay)',
    borderRadius: 12,
    padding: 20,
    color: 'var(--color-rarity-transcendent)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
  },
  deviceInfo: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
    fontSize: 12,
    color: 'var(--color-bench-neutral)',
    flexWrap: 'wrap',
  },
  config: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  configLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
  },
  select: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid var(--color-bg-overlay)',
    backgroundColor: 'var(--color-bg-elevated)',
    color: 'var(--color-rarity-transcendent)',
    fontSize: 14,
  },
  button: {
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: 'var(--color-quantum)',
    color: 'var(--color-rarity-transcendent)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: 'var(--color-bg-overlay)',
    cursor: 'not-allowed',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'var(--color-bg-elevated)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--color-quantum)',
    transition: 'width 0.3s ease',
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: 'var(--color-bench-neutral)',
    textAlign: 'center' as const,
  },
  results: {
    marginBottom: 20,
  },
  resultsTitle: {
    margin: '0 0 12px 0',
    fontSize: 16,
    fontWeight: 600,
  },
  noResults: {
    color: 'var(--color-bench-neutral)',
    fontSize: 14,
    textAlign: 'center' as const,
    padding: 20,
  },
  resultRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 120px 150px 40px',
    gap: 12,
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid var(--color-bg-elevated)',
  },
  resultName: {
    fontSize: 14,
  },
  resultValue: {
    fontSize: 14,
    color: 'var(--color-text-secondary)',
  },
  resultScore: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'var(--color-bg-elevated)',
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    transition: 'width 0.5s ease',
  },
  resultStatus: {
    fontSize: 16,
    textAlign: 'center' as const,
  },
  scoreCard: {
    backgroundColor: 'var(--color-bg-elevated)',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center' as const,
  },
  scoreCardTitle: {
    fontSize: 14,
    color: 'var(--color-bench-neutral)',
    marginBottom: 8,
  },
  scoreCardValue: {
    fontSize: 48,
    fontWeight: 700,
  },
  scoreCardSubtitle: {
    fontSize: 12,
    color: 'var(--color-bench-neutral)',
    marginTop: 8,
  },
};

export default BenchmarkPanel;
