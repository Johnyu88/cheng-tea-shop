export type ImportError = {
  row: number;
  field: string;
  code: string;
  message: string;
};

export type ImportRecord = Record<string, unknown>;
export type ParsedImport = { records: ImportRecord[]; errors: ImportError[] };
export type ValidationResult = {
  ok: boolean;
  errors: ImportError[];
  warnings: ImportError[];
  acceptedCount: number;
  acceptedContentIds: string[];
  wouldWrite: false;
};
export type DryRunReport = {
  mode: "dry-run";
  input: string;
  wouldWrite: false;
  acceptedCount: number;
  acceptedContentIds: string[];
  errors: ImportError[];
  warnings: ImportError[];
};

export const CSV_HEADERS: string[];
export function parseCsv(input: string): ParsedImport;
export function parseJson(input: string): ParsedImport;
export function validateRecords(records: ImportRecord[], options?: { imageDirectory?: string }): ValidationResult;
export function buildDryRunReport(input: string, validation: ValidationResult): DryRunReport;
