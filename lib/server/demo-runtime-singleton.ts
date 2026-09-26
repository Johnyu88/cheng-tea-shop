import { resolve } from "node:path";
import { createLocalDemoRuntime } from "./demo-runtime";
import { confirmedTeaFixture } from "../domain/mock/confirmed-tea-fixture";

type Runtime = ReturnType<typeof createLocalDemoRuntime>;
const globalRuntime = globalThis as typeof globalThis & { __chengTeaDemoRuntime?: Runtime };

export function getLocalDemoRuntime(): Runtime {
  if (process.env.DEMO_COMMERCE_LOCAL !== "enabled" || process.env.NODE_ENV === "production") {
    throw new Error("Local demo runtime is disabled");
  }
  const directory = resolve(process.env.DEMO_DATA_DIR || ".demo-data/local");
  globalRuntime.__chengTeaDemoRuntime ??= createLocalDemoRuntime({ directory, catalogSeed: confirmedTeaFixture });
  return globalRuntime.__chengTeaDemoRuntime;
}
