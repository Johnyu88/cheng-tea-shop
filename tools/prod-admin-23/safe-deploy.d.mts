export interface IsolationMount {
  Source: string;
  Destination: string;
  RW?: boolean;
}
export interface CandidateSpec {
  name: string;
  Image: string;
  Env: string[];
  ExposedPorts: Record<string, Record<string, never>>;
  HostConfig: {
    Binds: string[];
    PortBindings: Record<string, Array<{ HostIp: string; HostPort: string }>>;
    NetworkMode: string;
    RestartPolicy: { Name: string };
  };
  Cmd?: string[];
}
export interface InspectContainer {
  Config?: { Env?: string[]; Cmd?: string[] };
  Mounts?: IsolationMount[];
  HostConfig?: { NetworkMode?: string };
}
export interface EngineLike {
  stopContainer(containerId: string): Promise<unknown>;
  removeContainer(containerId: string): Promise<unknown>;
}
export function normalizeWindowsPath(value: string): string;
export function isFormalDataPath(source: string): boolean;
export function validateIsolationMounts(mounts: IsolationMount[]): true;
export function validateSourceAllowlist(sourceName: string, options: { mode: string; allowlistedSources: string[] }): true;
export function buildCandidateSpec(options: { name: string; image: string; env: Record<string, string>; mounts: IsolationMount[]; ports: Array<{ container: number; host: number }>; networkMode?: string; restartPolicy?: string; command?: string[] }): CandidateSpec;
export function createRedactedDiff(spec: CandidateSpec): Record<string, unknown>;
export function runtimeEnvFromInspect(inspect: InspectContainer): Record<string, string>;
export function hasSensitiveOutput(text: string, secretValues: string[]): boolean;
export function sensitiveEnvNames(env: Record<string, string>): string[];
export function buildCandidateFromInspect(options: { inspect: InspectContainer; sourceName: string; allowlistedSources: string[]; mode?: string; candidateName: string; image: string; isolationMounts: IsolationMount[]; ports: Array<{ container: number; host: number }>; syntheticEnv?: Record<string, string> }): CandidateSpec;
export function cleanupCandidate(engine: EngineLike, containerId: string): Promise<void>;
export function createAndHealthCheckCandidate(options: { engine: EngineLike & { createContainer(name: string, spec: CandidateSpec): Promise<{ Id: string }>; startContainer(containerId: string): Promise<unknown> }; spec: CandidateSpec; healthCheck?: () => Promise<void> }): Promise<{ containerId: string; spec: Record<string, unknown> }>;
export class DockerEngineClient {
  constructor(options?: { socketPath?: string; apiVersion?: string });
  inspectContainer(name: string): Promise<InspectContainer>;
  createContainer(name: string, spec: CandidateSpec): Promise<{ Id: string }>;
  startContainer(id: string): Promise<unknown>;
  stopContainer(id: string): Promise<unknown>;
  removeContainer(id: string): Promise<unknown>;
}
