import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CSV_HEADERS = [
  "content_id", "product_name", "tea_type", "origin", "harvest_year", "weight_g", "price_twd",
  "aroma", "taste", "aftertaste", "brewing.water_temperature_c", "brewing.tea_weight_g",
  "brewing.water_ml", "brewing.steep_seconds", "brewing.instructions", "inventory_status",
  "product_image.file_name", "product_image.alt_text", "product_image.source",
  "product_image.license_or_permission", "product_image.sha256", "sort_order", "publication_status",
  "evidence.facts_source", "evidence.photo_permission_source", "evidence.reviewer", "evidence.reviewed_at",
];

const TEA_TYPES = new Set(["white", "green", "oolong", "black", "dark", "other"]);
const INVENTORY_STATUS = new Set(["available", "sold-out"]);
const PUBLICATION_STATUS = new Set(["draft", "unpublished", "published"]);
const IMAGE_VIEWS = new Set(["front", "package", "detail", "hero", "story"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const REQUIRED_FIELDS = ["content_id", "product_name", "tea_type", "weight_g", "price_twd", "inventory_status", "sort_order", "publication_status"];

const error = (row, field, code, message) => ({ row, field, code, message });
const warning = (row, field, code, message) => ({ row, field, code, message });
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const emptyToNull = (value) => value === undefined || value === "" ? null : value;

const setNested = (record, path, value) => {
  const [root, child] = path.split(".");
  if (child === undefined) return { ...record, [path]: value };
  return { ...record, [root]: { ...(record[root] ?? {}), [child]: value } };
};

const parseCsvRows = (input) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value !== "")) rows.push(row);
  }
  return rows;
};

export const parseCsv = (input) => {
  const rows = parseCsvRows(input);
  if (rows.length === 0) return { records: [], errors: [error(0, "header", "csv-empty", "CSV 沒有標題列或資料。")] };
  const headers = rows[0];
  const headerMatches = headers.length === CSV_HEADERS.length && headers.every((value, index) => value === CSV_HEADERS[index]);
  if (!headerMatches) return { records: [], errors: [error(1, "header", "csv-header-mismatch", "CSV 標題必須完全符合匯入規格。"), ...headers.map((value, index) => error(1, String(index + 1), "unexpected-header", `未預期的 CSV 欄位：${value}`))] };

  const records = rows.slice(1).map((values) => headers.reduce((record, header, index) => setNested(record, header, emptyToNull(values[index])), {}));
  return { records, errors: [] };
};

export const parseJson = (input) => {
  try {
    const value = JSON.parse(input);
    return Array.isArray(value)
      ? { records: value, errors: [] }
      : { records: [], errors: [error(0, "root", "json-root-not-array", "JSON 根節點必須是商品陣列。")] };
  } catch (parseError) {
    return { records: [], errors: [error(0, "root", "json-invalid", `JSON 無法解析：${parseError instanceof Error ? parseError.message : "未知錯誤"}`)] };
  }
};

const valueAt = (record, path) => path.split(".").reduce((value, key) => value?.[key], record);
const integerValue = (value) => {
  if (typeof value === "number") return Number.isInteger(value) ? value : null;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
};
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const containsSecret = (value) => typeof value === "string" && /(sk_live|sk_test|api[_-]?key|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY)/i.test(value);

const validateImage = (record, row, errors, warnings) => {
  const image = record.product_image;
  if (!isObject(image) || image.file_name === null || image.file_name === undefined) {
    if (record.publication_status === "published") errors.push(error(row, "product_image.file_name", "image-required-for-published", "published 商品必須有已驗證的商品圖。"));
    else warnings.push(warning(row, "product_image.file_name", "placeholder-required", "缺少商品圖，將維持 branded placeholder。"));
    return;
  }
  if (!nonEmpty(image.file_name) || image.file_name.includes("/") || image.file_name.includes("\\")) {
    errors.push(error(row, "product_image.file_name", "image-filename-invalid", "圖片檔名不可包含路徑或空白值。"));
    return;
  }
  const match = /^(.+)__(front|package|detail|hero|story)__v(\d{2})\.([a-z0-9]+)$/i.exec(image.file_name);
  const extension = image.file_name.split(".").pop()?.toLowerCase();
  if (!match || !IMAGE_VIEWS.has(match[2]) || !IMAGE_EXTENSIONS.has(extension ?? "")) {
    errors.push(error(row, "product_image.file_name", "image-filename-invalid", "圖片檔名必須符合 <content-id>__<view>__vNN.jpg/png/webp。"));
  } else if (match[1] !== record.content_id) {
    errors.push(error(row, "product_image.file_name", "image-content-id-mismatch", "圖片檔名前綴必須與 content_id 完全一致。"));
  }
  for (const field of ["alt_text", "source", "license_or_permission", "sha256"]) {
    if (!nonEmpty(image[field])) errors.push(error(row, `product_image.${field}`, "image-metadata-missing", `圖片缺少 ${field}。`));
  }
  if (image.sha256 && !/^[a-f0-9]{64}$/i.test(image.sha256)) errors.push(error(row, "product_image.sha256", "image-hash-invalid", "圖片 SHA-256 必須是 64 位十六進位字串。"));
};

export const validateRecords = (records, options = {}) => {
  const errors = [];
  const warnings = [];
  const seenIds = new Map();
  const seenSort = new Map();
  records.forEach((record, index) => {
    const row = index + 1;
    if (!isObject(record)) {
      errors.push(error(row, "record", "record-not-object", "每筆商品必須是 object。"));
      return;
    }
    for (const field of REQUIRED_FIELDS) if (valueAt(record, field) === null || valueAt(record, field) === undefined || valueAt(record, field) === "") errors.push(error(row, field, "required-field-missing", `缺少必要欄位：${field}。`));
    if (containsSecret(JSON.stringify(record))) errors.push(error(row, "record", "secret-like-value", "資料包含疑似密鑰或憑證字串。"));
    if (typeof record.content_id === "string") {
      if (seenIds.has(record.content_id)) errors.push(error(row, "content_id", "duplicate-content-id", `content_id 與第 ${seenIds.get(record.content_id)} 列重複。`));
      else seenIds.set(record.content_id, row);
      if (!/^tea-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.content_id)) errors.push(error(row, "content_id", "content-id-invalid", "content_id 必須是小寫 ASCII 的 tea- slug。"));
    }
    if (record.tea_type !== null && !TEA_TYPES.has(record.tea_type)) errors.push(error(row, "tea_type", "tea-type-invalid", "tea_type 不在允許的茶類 enum。"));
    const weight = integerValue(record.weight_g);
    if (weight === null || weight <= 0) errors.push(error(row, "weight_g", "invalid-weight", "重量必須是正整數公克。"));
    const price = integerValue(record.price_twd);
    if (price === null || price < 0) errors.push(error(row, "price_twd", "invalid-price", "價格必須是非負整數 TWD。"));
    if (record.inventory_status !== null && !INVENTORY_STATUS.has(record.inventory_status)) errors.push(error(row, "inventory_status", "inventory-status-invalid", "inventory_status 不在允許的 enum。"));
    if (record.publication_status !== null && !PUBLICATION_STATUS.has(record.publication_status)) errors.push(error(row, "publication_status", "publication-status-invalid", "publication_status 不在允許的 enum。"));
    const sort = integerValue(record.sort_order);
    if (sort === null || sort < 0) errors.push(error(row, "sort_order", "sort-order-invalid", "sort_order 必須是非負整數。"));
    else if (seenSort.has(sort)) errors.push(error(row, "sort_order", "duplicate-sort-order", `sort_order 與第 ${seenSort.get(sort)} 列重複。`));
    else seenSort.set(sort, row);
    if (record.publication_status === "published") {
      const evidence = record.evidence;
      for (const field of ["facts_source", "photo_permission_source", "reviewer", "reviewed_at"]) if (!nonEmpty(evidence?.[field])) errors.push(error(row, `evidence.${field}`, "publication-evidence-missing", `published 商品缺少 ${field}。`));
    }
    validateImage(record, row, errors, warnings);
    if (options.imageDirectory && record.product_image?.file_name && !existsSync(resolve(options.imageDirectory, basename(record.product_image.file_name)))) errors.push(error(row, "product_image.file_name", "image-not-found", "指定圖片檔案不存在於 image directory。"));
  });
  return { ok: errors.length === 0, errors, warnings, acceptedCount: errors.length === 0 ? records.length : 0, acceptedContentIds: errors.length === 0 ? records.map((record) => record.content_id).filter(Boolean) : [], wouldWrite: false };
};

export const buildDryRunReport = (input, validation) => ({
  mode: "dry-run",
  input,
  wouldWrite: false,
  acceptedCount: validation.acceptedCount,
  acceptedContentIds: validation.acceptedContentIds,
  errors: validation.errors,
  warnings: validation.warnings,
});

const cli = () => {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf("--input");
  const formatIndex = args.indexOf("--format");
  const reportIndex = args.indexOf("--report");
  const inputPath = inputIndex >= 0 ? args[inputIndex + 1] : undefined;
  const format = formatIndex >= 0 ? args[formatIndex + 1] : undefined;
  const reportPath = reportIndex >= 0 ? args[reportIndex + 1] : undefined;
  if (args.includes("--apply")) {
    console.error("ERROR apply-not-supported: Phase 9-A tool is dry-run only and never overwrites existing data.");
    process.exitCode = 2;
    return;
  }
  if (!inputPath || !format || !["csv", "json"].includes(format)) {
    console.error("Usage: node scripts/phase-9a-product-import.mjs --input <file> --format csv|json [--image-dir <dir>] [--report <file>]");
    process.exitCode = 2;
    return;
  }
  const imageDirIndex = args.indexOf("--image-dir");
  const imageDirectory = imageDirIndex >= 0 ? args[imageDirIndex + 1] : undefined;
  const source = readFileSync(resolve(inputPath), "utf8");
  const parsed = format === "csv" ? parseCsv(source) : parseJson(source);
  const validation = parsed.errors.length > 0 ? { ok: false, errors: parsed.errors, warnings: [], acceptedCount: 0, acceptedContentIds: [], wouldWrite: false } : validateRecords(parsed.records, { imageDirectory });
  const report = buildDryRunReport(inputPath, validation);
  console.log(JSON.stringify(report, null, 2));
  if (reportPath) writeFileSync(resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.exitCode = validation.ok ? 0 : 1;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli();
