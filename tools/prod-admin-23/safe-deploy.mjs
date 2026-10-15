import net from "node:net";
import path from "node:path";

const FORMAL_DATA_ROOTS = [
  "C:\\data\\tea-staging\\private-accounting-v1-data",
  "C:\\data\\tea-staging\\public-visibility-live",
];

const SENSITIVE_NAME = /(secret|token|password|passwd|cookie|authorization|private.?key|api.?key)/i;

export function normalizeWindowsPath(value) {
  let normalized = String(value).replaceAll("/", "\\");
  const dockerDesktopPrefix = "\\run\\desktop\\mnt\\host\\";
  if (normalized.toLowerCase().startsWith(dockerDesktopPrefix)) {
    normalized = normalized.slice(dockerDesktopPrefix.length);
  }
  if (/^[a-z]\\/i.test(normalized)) {
    normalized = `${normalized[0].toLowerCase()}:${normalized.slice(1)}`;
  }
  return path.win32.normalize(normalized).replace(/[\\/]+$/, "").toLowerCase();
}

function isInside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}\\`);
}

export function isFormalDataPath(source) {
  const normalized = normalizeWindowsPath(source);
  return FORMAL_DATA_ROOTS.some((root) => isInside(normalizeWindowsPath(root), normalized));
}

export function validateIsolationMounts(mounts) {
  for (const mount of mounts) {
    if (!mount.Source || !mount.Destination) {
      throw new Error("Every isolation mount requires a source and destination");
    }
    if (isFormalDataPath(mount.Source)) {
      throw new Error(`Formal data mount rejected: ${mount.Destination}`);
    }
  }
  return true;
}

export function validateSourceAllowlist(sourceName, { mode, allowlistedSources }) {
  if (!allowlistedSources.includes(sourceName)) {
    throw new Error(`Source container is not in the explicit allowlist: ${sourceName}`);
  }
  if (mode === "isolation" && !sourceName.startsWith("tea-prod-admin-23-test-")) {
    throw new Error("Isolation mode rejects non-synthetic source containers");
  }
  if (mode === "dry-run" && sourceName.startsWith("tea-private-")) {
    throw new Error("Dry-run mode cannot inspect formal source containers");
  }
  return true;
}

function formatBind(mount) {
  return `${mount.Source}:${mount.Destination}:${mount.RW === false ? "ro" : "rw"}`;
}

export function buildCandidateSpec({ name, image, env, mounts, ports, networkMode = "bridge", restartPolicy = "no", command }) {
  validateIsolationMounts(mounts);
  const portBindings = {};
  const exposedPorts = {};
  for (const port of ports) {
    const containerPort = `${port.container}/tcp`;
    exposedPorts[containerPort] = {};
    portBindings[containerPort] = [{ HostIp: "127.0.0.1", HostPort: String(port.host) }];
  }
  const spec = {
    name,
    Image: image,
    Env: Object.entries(env).map(([key, value]) => `${key}=${value}`),
    ExposedPorts: exposedPorts,
    HostConfig: {
      Binds: mounts.map(formatBind),
      PortBindings: portBindings,
      NetworkMode: networkMode,
      RestartPolicy: { Name: restartPolicy },
    },
  };
  if (command) spec.Cmd = command;
  return spec;
}

export function createRedactedDiff(spec) {
  return {
    name: spec.name,
    image: spec.Image,
    envNames: [...new Set((spec.Env ?? []).map((entry) => entry.split("=", 1)[0]))].sort(),
    mounts: (spec.HostConfig?.Binds ?? []).map((bind) => {
      const destinationStart = bind.indexOf(":/");
      const source = destinationStart >= 0 ? bind.slice(0, destinationStart) : bind;
      const destinationAndAccess = destinationStart >= 0 ? bind.slice(destinationStart + 1) : "unknown:rw";
      const accessStart = destinationAndAccess.lastIndexOf(":");
      const destination = accessStart >= 0 ? destinationAndAccess.slice(0, accessStart) : destinationAndAccess;
      const access = accessStart >= 0 ? destinationAndAccess.slice(accessStart + 1) : "rw";
      return { sourceClass: path.win32.basename(source ?? "unknown"), destination, access };
    }),
    ports: Object.entries(spec.HostConfig?.PortBindings ?? {}).map(([container, bindings]) => ({
      container,
      host: bindings?.[0]?.HostPort ?? "dynamic",
    })),
    networkMode: spec.HostConfig?.NetworkMode,
    restartPolicy: spec.HostConfig?.RestartPolicy?.Name,
  };
}

function parseHttpResponse(buffer) {
  const separator = buffer.indexOf("\r\n\r\n");
  if (separator < 0) return null;
  const headerText = buffer.subarray(0, separator).toString("utf8");
  const lines = headerText.split("\r\n");
  const status = Number(lines[0]?.split(" ")[1]);
  const headers = new Map();
  for (const line of lines.slice(1)) {
    const index = line.indexOf(":");
    if (index > 0) headers.set(line.slice(0, index).toLowerCase(), line.slice(index + 1).trim());
  }
  let body = buffer.subarray(separator + 4);
  const contentLength = Number(headers.get("content-length"));
  if (Number.isFinite(contentLength) && body.length < contentLength) return null;
  if (headers.get("transfer-encoding")?.toLowerCase() === "chunked") body = decodeChunked(body);
  return { status, headers, body };
}

function decodeChunked(body) {
  const chunks = [];
  let offset = 0;
  while (offset < body.length) {
    const end = body.indexOf("\r\n", offset);
    if (end < 0) break;
    const size = Number.parseInt(body.subarray(offset, end).toString("ascii"), 16);
    if (size === 0) break;
    const start = end + 2;
    if (start + size + 2 > body.length) break;
    chunks.push(body.subarray(start, start + size));
    offset = start + size + 2;
  }
  return Buffer.concat(chunks);
}

export class DockerEngineClient {
  constructor({ socketPath = "\\\\.\\pipe\\docker_engine", apiVersion = "v1.45" } = {}) {
    this.socketPath = socketPath;
    this.apiVersion = apiVersion;
  }

  request(method, endpoint, body) {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(this.socketPath);
      const chunks = [];
      socket.on("connect", () => {
        const pathName = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        const headers = [
          `${method} /${this.apiVersion}${pathName} HTTP/1.1`,
          "Host: docker",
          "Connection: close",
        ];
        if (payload) headers.push("Content-Type: application/json", `Content-Length: ${payload.length}`);
        socket.write(`${headers.join("\r\n")}\r\n\r\n`);
        if (payload) socket.write(payload);
      });
      socket.on("data", (chunk) => chunks.push(chunk));
      socket.on("error", () => reject(new Error("Docker Engine API request failed")));
      socket.on("close", () => {
        const response = parseHttpResponse(Buffer.concat(chunks));
        if (!response) return reject(new Error("Docker Engine API returned an incomplete response"));
        const text = response.body.toString("utf8");
        let parsed;
        try { parsed = text ? JSON.parse(text) : undefined; } catch { parsed = undefined; }
        if (response.status < 200 || response.status >= 300) {
          return reject(new Error(`Docker Engine API returned HTTP ${response.status}`));
        }
        resolve(parsed);
      });
    });
  }

  inspectContainer(name) { return this.request("GET", `/containers/${encodeURIComponent(name)}/json`); }
  createContainer(name, spec) { return this.request("POST", `/containers/create?name=${encodeURIComponent(name)}`, spec); }
  startContainer(id) { return this.request("POST", `/containers/${encodeURIComponent(id)}/start`); }
  stopContainer(id) { return this.request("POST", `/containers/${encodeURIComponent(id)}/stop?t=20`); }
  removeContainer(id) { return this.request("DELETE", `/containers/${encodeURIComponent(id)}?v=false&force=false`); }
}

export function runtimeEnvFromInspect(inspect) {
  const env = {};
  for (const entry of inspect?.Config?.Env ?? []) {
    const index = entry.indexOf("=");
    if (index > 0) env[entry.slice(0, index)] = entry.slice(index + 1);
  }
  return env;
}

export function hasSensitiveOutput(text, secretValues) {
  return secretValues.some((secret) => secret.length > 0 && text.includes(secret));
}

export function sensitiveEnvNames(env) {
  return Object.keys(env).filter((name) => SENSITIVE_NAME.test(name));
}

export function buildCandidateFromInspect({
  inspect,
  sourceName,
  allowlistedSources,
  mode = "isolation",
  candidateName,
  image,
  isolationMounts,
  ports,
  syntheticEnv = {},
}) {
  validateSourceAllowlist(sourceName, { mode, allowlistedSources });
  const sourceEnv = runtimeEnvFromInspect(inspect);
  const mounts = mode === "isolation" ? isolationMounts : (inspect.Mounts ?? []);
  if (mode === "isolation") validateIsolationMounts(mounts);
  const env = mode === "isolation" ? { ...sourceEnv, ...syntheticEnv } : sourceEnv;
  return buildCandidateSpec({
    name: candidateName,
    image,
    env,
    mounts,
    ports,
    networkMode: inspect.HostConfig?.NetworkMode ?? "bridge",
    restartPolicy: "no",
    command: inspect.Config?.Cmd,
  });
}

export async function cleanupCandidate(engine, containerId) {
  try { await engine.stopContainer(containerId); } catch { /* already stopped */ }
  try { await engine.removeContainer(containerId); } catch { /* preserve the original failure */ }
}

export async function createAndHealthCheckCandidate({
  engine,
  spec,
  healthCheck,
}) {
  const created = await engine.createContainer(spec.name, spec);
  const containerId = created?.Id;
  if (!containerId) throw new Error("Docker Engine did not return a candidate container ID");
  try {
    await engine.startContainer(containerId);
    if (healthCheck) await healthCheck();
    return { containerId, spec: createRedactedDiff(spec) };
  } catch (error) {
    await cleanupCandidate(engine, containerId);
    throw error instanceof Error ? error : new Error("Candidate health check failed");
  }
}
