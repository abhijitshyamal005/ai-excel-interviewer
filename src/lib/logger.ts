// Logging utilities

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    let message = `[${timestamp}] ${level}: ${entry.message}`;

    if (entry.context) {
      message += ` | Context: ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      message += ` | Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\nStack: ${entry.error.stack}`;
      }
    }

    return message;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Interview-specific logging methods
  interviewStarted(sessionId: string, candidateId: string): void {
    this.info('Interview started', { sessionId, candidateId });
  }

  interviewCompleted(sessionId: string, duration: number, score: number): void {
    this.info('Interview completed', { sessionId, duration, score });
  }

  evaluationPerformed(questionId: string, score: number, confidence: number): void {
    this.debug('Response evaluated', { questionId, score, confidence });
  }

  aiServiceCall(provider: string, model: string, tokens?: number): void {
    this.debug('AI service called', { provider, model, tokens });
  }

  errorRecovery(sessionId: string, error: string, action: string): void {
    this.warn('Error recovery performed', { sessionId, error, action });
  }
}

export const logger = new Logger();

// Performance monitoring
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static start(operation: string): void {
    this.timers.set(operation, Date.now());
  }

  static end(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      logger.warn('Performance timer not found', { operation });
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(operation);
    
    logger.debug('Operation completed', { operation, duration });
    return duration;
  }

  static measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.start(operation);
      try {
        const result = await fn();
        this.end(operation);
        resolve(result);
      } catch (error) {
        this.end(operation);
        reject(error);
      }
    });
  }
}