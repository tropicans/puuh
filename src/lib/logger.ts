type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
    debug(msg: string, meta?: Record<string, unknown>) {
        if (shouldLog('debug')) console.debug(formatMessage('debug', msg, meta));
    },
    info(msg: string, meta?: Record<string, unknown>) {
        if (shouldLog('info')) console.info(formatMessage('info', msg, meta));
    },
    warn(msg: string, meta?: Record<string, unknown>) {
        if (shouldLog('warn')) console.warn(formatMessage('warn', msg, meta));
    },
    error(msg: string, error?: unknown, meta?: Record<string, unknown>) {
        if (shouldLog('error')) {
            const errObj = error instanceof Error
                ? { name: error.name, message: error.message, stack: error.stack }
                : error;
            console.error(formatMessage('error', msg, { error: errObj, ...meta }));
        }
    }
};
