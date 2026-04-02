/**
 * 应用入口
 * 永夜熵纪 - OMNIS APIEN
 * 包含全局错误处理和错误边界
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { errorReporter } from './utils/ErrorReporter';

window.addEventListener('error', (event) => {
  errorReporter.report(event.error || event.message, 'unknown', {
    type: 'critical',
    title: '全局JavaScript错误',
    additionalData: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    },
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason));
  
  errorReporter.report(error, 'unknown', {
    type: 'error',
    title: '未处理的Promise拒绝',
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary category="initialization">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
