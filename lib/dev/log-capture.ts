export interface ConsoleLog {
  type: 'log' | 'error' | 'warn';
  message: string;
  timestamp: number;
}

const MAX_LOGS = 200;

const EXCLUDED_LOG_PATTERNS = [
  /Found pupils/i,
  /ðŸ‘ï¸/,
  /Mouse tracking effect mounted/i,
  /faceContainerRef is null/i,
  /cardRef is null/i,
  /Mousemove listener/i,
];

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
};

let capturedLogs: ConsoleLog[] = [];
let refCount = 0;

function shouldExcludeLog(message: string): boolean {
  return EXCLUDED_LOG_PATTERNS.some((pattern) => pattern.test(message));
}

function safeSerializeArg(arg: unknown): string {
  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }

  if (typeof arg === 'string') {
    return arg;
  }

  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg);
    } catch {
      return '[unserializable object]';
    }
  }

  return String(arg);
}

function serializeArgs(args: unknown[]): string {
  const message = args.map(safeSerializeArg).join(' ');
  return message.length > 1200 ? `${message.slice(0, 1200)}...[truncated]` : message;
}

function pushLog(type: ConsoleLog['type'], args: unknown[]) {
  const message = serializeArgs(args);
  if (shouldExcludeLog(message)) return;
  capturedLogs.push({ type, message, timestamp: Date.now() });
  if (capturedLogs.length > MAX_LOGS) capturedLogs.shift();
}

function patchConsole() {
  console.log = (...args: unknown[]) => {
    originalConsole.log(...args);
    pushLog('log', args);
  };
  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    pushLog('error', args);
  };
  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    pushLog('warn', args);
  };
}

function restoreConsole() {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
}

/** Avvia la capture con ref-counting; opzionale reset del buffer al primo avvio o esplicito. */
export function startConsoleCapture(options?: { reset?: boolean }) {
  if (refCount === 0 || options?.reset) {
    capturedLogs = [];
  }
  refCount += 1;
  if (refCount === 1) {
    patchConsole();
  }
}

/** Ferma la capture; ripristina console solo quando l'ultimo consumer smonta. */
export function stopConsoleCapture() {
  if (refCount <= 0) return;
  refCount -= 1;
  if (refCount === 0) {
    restoreConsole();
  }
}

export function getRecentLogs(seconds: number = 60): ConsoleLog[] {
  const cutoff = Date.now() - seconds * 1000;
  return capturedLogs.filter((log) => log.timestamp >= cutoff);
}

export function getCapturedLogs(): readonly ConsoleLog[] {
  return capturedLogs;
}
