export type QueryValueRule = RegExp | ((value: string) => boolean);
export type QueryRules = Readonly<Record<string, QueryValueRule>>;

export interface QueryPolicyOptions {
  maxBytes?: number;
  maxParams?: number;
  maxValueBytes?: number;
}

const encoder = new TextEncoder();

/** Append a small, unambiguous allowlisted query or reject it atomically. */
export function appendQueryWithPolicy(
  target: URL,
  source: URL,
  rules: QueryRules,
  options: QueryPolicyOptions = {},
): boolean {
  const maxBytes = options.maxBytes ?? 2_048;
  const maxParams = options.maxParams ?? 12;
  const maxValueBytes = options.maxValueBytes ?? 1_024;
  if (encoder.encode(source.search).byteLength > maxBytes) return false;

  const entries = Array.from(source.searchParams.entries());
  if (entries.length > maxParams) return false;
  const seen = new Set<string>();
  for (const [key, value] of entries) {
    if (seen.has(key) || !/^[a-z][a-z0-9_]{0,63}$/.test(key)) return false;
    seen.add(key);
    const rule = rules[key];
    if (!rule || encoder.encode(value).byteLength > maxValueBytes) return false;
    if (rule instanceof RegExp ? !rule.test(value) : !rule(value)) return false;
  }
  for (const [key, value] of entries) target.searchParams.set(key, value);
  return true;
}

export const QUERY_INTEGER = /^(?:0|[1-9]\d{0,8})$/;
export const QUERY_POSITIVE_INTEGER = /^[1-9]\d{0,8}$/;
export const QUERY_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
