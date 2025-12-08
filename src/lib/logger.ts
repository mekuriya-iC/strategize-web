/**
 * Centralized logging utility for the application.
 * - Logs are only shown in development mode by default
 * - Provides consistent log formatting
 * - Easy to extend with external logging services (Sentry, LogRocket, etc.)
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDevelopment = process.env.NODE_ENV === "development";

const defaultConfig: LoggerConfig = {
  enabled: isDevelopment,
  minLevel: isDevelopment ? "debug" : "error",
  prefix: "[Strategize]",
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    return `${
      this.config.prefix
    } [${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Debug level - for detailed debugging information
   * Only shown in development
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message), ...args);
    }
  }

  /**
   * Info level - for general information
   * Only shown in development
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message), ...args);
    }
  }

  /**
   * Warn level - for warnings that don't break functionality
   * Shown in development, optionally in production
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message), ...args);
    }
  }

  /**
   * Error level - for errors that need attention
   * Always shown (including production)
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message), ...args);
    }
    // TODO: In production, you could send errors to an external service here
    // Example: Sentry.captureException(new Error(message), { extra: args[0] });
  }

  /**
   * Group related logs together (development only)
   */
  group(label: string, fn: () => void): void {
    if (this.shouldLog("debug")) {
      console.group(this.formatMessage("debug", label));
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }

  /**
   * Log a table of data (development only)
   */
  table(data: unknown): void {
    if (this.shouldLog("debug")) {
      console.table(data);
    }
  }

  /**
   * Create a child logger with a custom prefix
   */
  createChild(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix} [${prefix}]`,
    });
  }
}

// Default logger instance
const logger = new Logger();

// Named loggers for different parts of the app
export const appLogger = logger.createChild("App");
export const authLogger = logger.createChild("Auth");
export const kpiLogger = logger.createChild("KPI");
export const objectiveLogger = logger.createChild("Objective");
export const submissionLogger = logger.createChild("Submission");
export const apolloLogger = logger.createChild("Apollo");
export const assignmentLogger = logger.createChild("Assignment");

export default logger;
