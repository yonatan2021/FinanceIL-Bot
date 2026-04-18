function log(level: 'info' | 'warn' | 'error', data: Record<string, unknown>): void {
  const entry = JSON.stringify({ level, ts: new Date().toISOString(), ...data });
  if (level === 'error') {
    process.stderr.write(entry + '\n');
  } else {
    process.stdout.write(entry + '\n');
  }
}

export const logger = {
  info: (data: Record<string, unknown>) => log('info', data),
  warn: (data: Record<string, unknown>) => log('warn', data),
  error: (data: Record<string, unknown>) => log('error', data),
};
