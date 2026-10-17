export function normalizeTaiwanMobile(value: string): string | null {
  if (!/^[\d\s-]+$/.test(value)) return null;
  const phone = value.replace(/[\s-]/g, "");
  return /^09\d{8}$/.test(phone) ? phone : null;
}
