type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  [key: string]: unknown;
}

function log(level: LogLevel, fields: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  // Write all log output to stderr to keep stdout clean for grammy
  process.stderr.write(JSON.stringify(entry) + '\n');
}

export const logger = {
  info: (fields: Record<string, unknown>): void => log('info', fields),
  warn: (fields: Record<string, unknown>): void => log('warn', fields),
  error: (fields: Record<string, unknown>): void => log('error', fields),
};
