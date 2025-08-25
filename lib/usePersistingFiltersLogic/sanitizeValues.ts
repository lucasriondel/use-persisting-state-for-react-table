import type {
  DateMeta,
  DateRangeMeta,
  FiltersMeta,
  MultiSelectMeta,
  NumberRangeMeta,
  SelectMeta,
} from "@tanstack/react-table";

export function sanitizeMultiSelectValue(
  cfg: MultiSelectMeta,
  value: unknown
): string[] | undefined {
  const allowed = new Set(cfg.options?.map((o) => String(o.value)) ?? []);
  if (Array.isArray(value)) {
    const filtered = (value as unknown[])
      .map((v) => String(v))
      .filter((v) => (allowed.size === 0 ? true : allowed.has(v)));
    return filtered.length > 0 ? filtered : undefined;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    const v = String(value);
    if (allowed.size === 0 || allowed.has(v)) return [v];
  }
  return undefined;
}

export function sanitizeSelectValue(
  cfg: SelectMeta,
  value: unknown
): string | undefined {
  const allowed = new Set(cfg.options?.map((o) => String(o.value)) ?? []);
  if (Array.isArray(value)) return undefined;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    const v = String(value);
    if (allowed.size === 0 || allowed.has(v)) return v;
  }
  return undefined;
}

export function sanitizeTextValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return undefined;
}

export function sanitizeNumberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function sanitizeDateValue(
  cfg: DateMeta,
  value: unknown
): Date | null | undefined {
  if (value === null) return null;
  const toDate = (v: unknown): Date | undefined => {
    if (v instanceof Date && !isNaN(v.getTime())) return v;
    if (typeof v === "string" || typeof v === "number") {
      const d = new Date(v);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  };
  const d = toDate(value);
  if (!d) return undefined;
  const min = cfg.fromDate;
  const max = cfg.toDate;
  if (min && d < min) return min;
  if (max && d > max) return max;
  return d;
}

export function sanitizeDateRangeValue(
  cfg: DateRangeMeta,
  value: unknown
): [Date | null, Date | null] | undefined {
  const toDate = (v: unknown): Date | null => {
    if (v === null) return null;
    if (v instanceof Date && !isNaN(v.getTime())) return v;
    if (typeof v === "string" || typeof v === "number") {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  let startValue: unknown, endValue: unknown;

  // Handle both array format [start, end] and object format {from, to}
  if (Array.isArray(value) && value.length === 2) {
    [startValue, endValue] = value;
  } else if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    startValue = obj.from;
    endValue = obj.to;
  } else {
    return undefined;
  }

  let [start, end] = [toDate(startValue), toDate(endValue)];
  if (start === null && end === null) return undefined;

  const min = cfg.fromDate;
  const max = cfg.toDate;
  if (start && min && start < min) start = min;
  if (end && max && end > max) end = max;
  // Ensure start <= end if both present
  if (start && end && start > end) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  return [start, end];
}

export function sanitizeNumberRangeValue(
  cfg: NumberRangeMeta,
  value: unknown
): [number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined;
  const [a, b] = value;
  const toNum = (v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };
  let n1 = toNum(a);
  let n2 = toNum(b);
  if (n1 === undefined || n2 === undefined) return undefined;
  if (n1 > n2) {
    const tmp = n1;
    n1 = n2;
    n2 = tmp;
  }
  const min = cfg.min;
  const max = cfg.max;
  if (min !== undefined) {
    n1 = Math.max(min, n1);
    n2 = Math.max(min, n2);
  }
  if (max !== undefined) {
    n1 = Math.min(max, n1);
    n2 = Math.min(max, n2);
  }
  return [n1, n2];
}

export function sanitizeValue(
  filterMeta: FiltersMeta,
  value: unknown
): unknown | undefined {
  switch (filterMeta.variant) {
    case "multiSelect":
      return sanitizeMultiSelectValue(filterMeta, value);
    case "select":
      return sanitizeSelectValue(filterMeta, value);
    case "text":
      return sanitizeTextValue(value);
    case "number":
      return sanitizeNumberValue(value);
    case "date":
      return sanitizeDateValue(filterMeta, value);
    case "dateRange":
      return sanitizeDateRangeValue(filterMeta, value);
    case "numberRange":
      return sanitizeNumberRangeValue(filterMeta, value);
    default:
      return value;
  }
}
