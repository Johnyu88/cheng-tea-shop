type AdminProductsDiagnosticBridge = {
  recordApi: (name: "session" | "catalog", detail: { status: number; contentType: string; durationMs: number }) => void;
  recordApiError: (name: "session" | "catalog", detail: { errorType: string; durationMs: number }) => void;
  recordReactMounted: () => void;
};

function bridge(): AdminProductsDiagnosticBridge | undefined {
  const candidate = (globalThis as typeof globalThis & { __teaAdminDiagnostics?: unknown }).__teaAdminDiagnostics;
  if (!candidate || typeof candidate !== "object") return undefined;
  return candidate as AdminProductsDiagnosticBridge;
}

export function reportAdminProductsApi(name: "session" | "catalog", detail: { status: number; contentType: string; durationMs: number }) {
  bridge()?.recordApi(name, detail);
}

export function reportAdminProductsApiError(name: "session" | "catalog", detail: { errorType: string; durationMs: number }) {
  bridge()?.recordApiError(name, detail);
}

export function reportAdminProductsReactMounted() {
  bridge()?.recordReactMounted();
}
