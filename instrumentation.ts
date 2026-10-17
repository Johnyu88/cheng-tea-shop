import type { Instrumentation } from "next";

// Uncaught server errors (pages, route handlers, server actions) go to the structured log.
// Request headers are deliberately not logged: they carry cookies.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logger, safeLog } = await import("@/lib/server/logger");
  const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : undefined;
  safeLog(() => logger.error({
    scope: "unhandled-request-error",
    err: error,
    digest,
    method: request.method,
    path: request.path.split("?")[0],
    routePath: context.routePath,
    routeType: context.routeType,
  }, "Unhandled server error"));
};
