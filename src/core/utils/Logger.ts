type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#6B7280',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
};

class Logger {
  private static instance: Logger;
  private isProduction: boolean;
  private minLevel: LogLevel;

  private constructor() {
    this.isProduction = import.meta.env?.PROD ?? false;
    this.minLevel = this.isProduction ? 'warn' : 'debug';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(module: string, message: string, ...args: unknown[]): void {
    this.log('debug', module, message, ...args);
  }

  info(module: string, message: string, ...args: unknown[]): void {
    this.log('info', module, message, ...args);
  }

  warn(module: string, message: string, ...args: unknown[]): void {
    this.log('warn', module, message, ...args);
  }

  error(module: string, message: string, error?: Error): void {
    const errorInfo = error
      ? `\n  Error: ${error.message}\n  Stack: ${error.stack}`
      : '';
    this.log('error', module, `${message}${errorInfo}`);
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private log(level: LogLevel, module: string, message: string, ...args: unknown[]): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) {
      return;
    }

    const timestamp = this.getTimestamp();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;

    if (this.isProduction) {
      console.log(prefix, message, ...args);
    } else {
      const style = `color: ${LOG_COLORS[level]}; font-weight: bold;`;
      console.log(`%c${prefix}`, style, message, ...args);
    }
  }

  private getTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }
}

const logger = Logger.getInstance();

export { Logger, logger };
export type { LogLevel };
export default logger;
