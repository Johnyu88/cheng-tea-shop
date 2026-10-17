import { randomInt } from "node:crypto";
import pino from "pino";

// One JSON line per event on stdout. On the VM the Ops Agent ships these lines to
// Cloud Logging; `severity` and `message` are the field names Cloud Logging reads.
// See docs/operations/logging.md for how maintainers and agents query them.
const severity: Record<string, string> = { trace: "DEBUG", debug: "DEBUG", info: "INFO", warn: "WARNING", error: "ERROR", fatal: "CRITICAL" };

// Never log credentials or customer contact data, even by accident.
const redactPaths = [
  "password", "credential", "phone", "cookie", "authorization", "token", "secret", "accessSecret", "imageDataUrl",
  "*.password", "*.credential", "*.phone", "*.cookie", "*.authorization", "*.token", "*.secret", "*.accessSecret", "*.imageDataUrl",
  "headers.cookie", "headers.authorization", "headers[\"set-cookie\"]",
];

// JSON parse errors quote the request body (which may hold a password), so their text is dropped.
function withoutQuotedInput(error: unknown, depth = 0): unknown {
  if (!(error instanceof Error) || depth > 5) return error;
  const quotesInput = error instanceof SyntaxError;
  const copy = new Error(quotesInput ? "Invalid JSON input (content not logged)" : error.message, error.cause === undefined ? undefined : { cause: withoutQuotedInput(error.cause, depth + 1) });
  copy.name = error.name;
  copy.stack = quotesInput ? `${error.name}: ${copy.message}` : error.stack ?? copy.message;
  return copy;
}

const service = process.env.LOG_SERVICE || (process.env.PUBLIC_STOREFRONT_SERVER === "enabled" ? "tea-front" : "tea-app");

export function createLogger(options: { level?: string; destination?: pino.DestinationStream } = {}) {
  return pino({
    level: options.level ?? (process.env.LOG_LEVEL || (process.env.NODE_ENV === "test" ? "silent" : "info")),
    messageKey: "message",
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ severity: severity[label] ?? "DEFAULT" }) },
    serializers: { err: (error: unknown) => pino.stdSerializers.err(withoutQuotedInput(error) as Error) },
    redact: { paths: redactPaths, censor: "[REDACTED]" },
  }, options.destination);
}

export const logger = createLogger();

// Short and unambiguous so a non-technical user can read it out or screenshot it.
const errorCodeAlphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function newErrorCode(): string {
  let code = "";
  for (let index = 0; index < 6; index++) code += errorCodeAlphabet[randomInt(errorCodeAlphabet.length)];
  return code;
}

// Logging must never change request behavior.
export function safeLog(write: () => void): void {
  try { write(); } catch { /* Diagnostics must not change request behavior. */ }
}
