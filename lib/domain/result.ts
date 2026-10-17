import type { DomainError } from "./errors";
import type { Page } from "./types";

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DomainError };

export type { Page };
