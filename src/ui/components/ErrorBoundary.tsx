/**
 * =============================================================================
 * ErrorBoundary - 错误边界组件
 * 捕获子组件的JavaScript错误，显示友好的用户界面
 * 集成Toast通知和ErrorModal
 * =============================================================================
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorModal, ErrorSeverity, ErrorRecovery } from './ErrorModal';
import { errorReporter, ErrorCategory } from '@/utils/ErrorReporter';
import { toast } from '@/stores/toastStore';
import { logger } from '@/core/utils/Logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  category?: ErrorCategory;
  showBoundary?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { category = 'unknown' } = this.props;
    
    const report = errorReporter.reportWithComponentStack(
      error,
      errorInfo.componentStack || '',
      category,
      { type: 'error', title: `组件错误: ${error.message.slice(0, 50)}` }
    );

    this.setState({ 
      errorInfo, 
      errorId: report.id,
    });

    toast.error('发生错误', error.message.slice(0, 100));

    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleDismiss = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
    });
  };

  private getErrorSeverity(): ErrorSeverity {
    const { error } = this.state;
    if (!error) return 'error';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('chunk') || message.includes('loading') || message.includes('network')) {
      return 'warning';
    }
    
    if (message.includes('out of memory') || message.includes('stack overflow')) {
      return 'critical';
    }
    
    return 'error';
  }

  private getErrorRecoveries(): ErrorRecovery[] {
    const { error } = this.state;
    if (!error) return [];
    
    const message = error.message.toLowerCase();
    
    if (message.includes('chunk') || message.includes('loading')) {
      return [
        { label: '刷新页面', action: 'reload' },
        { label: '忽略并继续', action: 'dismiss' },
      ];
    }
    
    if (message.includes('webgpu') || message.includes('gpu')) {
      return [
        { label: '重试', action: 'retry' },
        { label: '刷新页面', action: 'reload' },
      ];
    }
    
    return [
      { label: '重试', action: 'retry' },
      { label: '刷新页面', action: 'reload' },
    ];
  }

  private getFriendlyMessage(): string {
    const { error } = this.state;
    if (!error) return '应用遇到了一个意外错误。';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('chunk') || message.includes('loading')) {
      return '页面资源加载失败，可能是网络问题或资源已更新。';
    }
    
    if (message.includes('webgpu') || message.includes('gpu')) {
      return '图形渲染初始化失败，您的设备可能不支持WebGPU。';
    }
    
    if (message.includes('out of memory')) {
      return '内存不足，请关闭其他应用后重试。';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return '网络连接失败，请检查您的网络设置。';
    }
    
    return '应用遇到了一个意外错误，请尝试刷新页面或返回主菜单。';
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.showBoundary === false) {
        return null;
      }

      const severity = this.getErrorSeverity();
      const recoveries = this.getErrorRecoveries();
      const friendlyMessage = this.getFriendlyMessage();
      const errorDetails = this.state.error?.stack || undefined;

      return (
        <ErrorModal
          isOpen={true}
          title={severity === 'critical' ? '严重错误' : '出现了一些问题'}
          message={friendlyMessage}
          severity={severity}
          details={errorDetails}
          recoveries={recoveries}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          onDismiss={this.handleDismiss}
          showReportButton={true}
          onReport={(info) => {
            logger.info('ErrorBoundary', `Error reported: ${JSON.stringify(info)}`);
            toast.success('错误已上报', '感谢您的反馈');
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
