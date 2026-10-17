/**
 * The server attaches a short error code to every API failure and writes the same code to the log.
 * Showing it next to the message lets the shop send a screenshot that maintainers can look up.
 */
const errorCodePattern = /^[2-9A-Z]{6}$/;

export function withErrorCode(message: string, payload: unknown): string {
  const code = payload && typeof payload === "object" && "errorCode" in payload ? (payload as { errorCode?: unknown }).errorCode : undefined;
  return typeof code === "string" && errorCodePattern.test(code) ? `${message}（錯誤代碼：${code}）` : message;
}
