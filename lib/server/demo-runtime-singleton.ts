import { assertDemoEnabled } from "./demo-cloud";
import { resolve } from "node:path";
import { createLocalDemoRuntime } from "./demo-runtime";
import { confirmedTeaFixture } from "../domain/mock/confirmed-tea-fixture";

type Runtime = ReturnType<typeof createLocalDemoRuntime>;
const globalRuntime = globalThis as typeof globalThis & { __chengTeaDemoRuntime?: Runtime };

export function getLocalDemoRuntime(): Runtime {
  assertDemoEnabled();
  const directory = resolve(process.env.DEMO_DATA_DIR || ".demo-data/local");
  globalRuntime.__chengTeaDemoRuntime ??= createLocalDemoRuntime({ directory, catalogSeed: confirmedTeaFixture });
  return globalRuntime.__chengTeaDemoRuntime;
}
