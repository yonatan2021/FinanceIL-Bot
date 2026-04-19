function safeStringify(data: Record<string, unknown>): string {
  return JSON.stringify(data, (_key, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

function log(level: 'info' | 'warn' | 'error', data: Record<string, unknown>): void {
  let entry: string;
  try {
    entry = safeStringify({ level, ts: new Date().toISOString(), ...data });
  } catch {
    entry = JSON.stringify({ level, ts: new Date().toISOString(), serializeError: true });
  }
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
