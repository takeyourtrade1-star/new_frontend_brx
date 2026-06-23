export function parseBlueprintId(raw: number | string | null | undefined): number | null {
  if (raw == null) return null;
  const n =
    typeof raw === 'number'
      ? raw
      : parseInt(String(raw).includes(':') ? String(raw).split(':')[0] : String(raw), 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}
