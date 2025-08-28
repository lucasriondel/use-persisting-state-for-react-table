import type { MultiSelectMeta, SelectMeta } from "@tanstack/react-table";
import { ColumnDef, ColumnFiltersState, RowData } from "@tanstack/react-table";
import { getColumnIdentifier } from "../getColumnIdentifier";
import { flattenColumns } from "./flattenColumns";
import { isEmptyValue } from "./isEmptyValue";
import { sanitizeValue } from "./sanitizeValues";

export function computeInitialColumnFiltersState<TData extends RowData>(
  columns: Array<ColumnDef<TData, unknown>>,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  optimisticAsync: boolean,
  initialStateFilters?: ColumnFiltersState
): ColumnFiltersState | undefined {
  const flat = flattenColumns(columns);

  const out: ColumnFiltersState = [];
  const bucketColumnIds = new Set<string>(); // Track columns with bucket data
  const loadingColumnIds = new Set<string>(); // Track columns that are loading

  for (const col of flat) {
    const filterMeta = col.meta?.filter;
    if (!filterMeta?.persistenceStorage) continue;

    const columnId = getColumnIdentifier(col);
    if (!columnId) continue;

    const key = filterMeta.key ?? String(columnId);
    let raw =
      filterMeta.persistenceStorage === "url"
        ? urlBucket[key]
        : localBucket[key];

    if (isEmptyValue(raw)) continue;

    // Apply codec parsing if the value appears to be a raw string that needs parsing
    // This handles cases where useUrlState hasn't applied codecs yet due to timing issues
    if (filterMeta.codec && typeof raw === "string") {
      try {
        const parsed = filterMeta.codec.parse(raw);
        if (!isEmptyValue(parsed)) {
          raw = parsed;
        }
      } catch {
        // If parsing fails, continue with raw value
      }
    }

    bucketColumnIds.add(columnId);

    if (
      filterMeta.variant === "select" ||
      filterMeta.variant === "multiSelect"
    ) {
      const selectableMeta = filterMeta as SelectMeta | MultiSelectMeta;
      const hasAllowed =
        selectableMeta.options && selectableMeta.options.length > 0;

      if (selectableMeta.isLoading === false && hasAllowed) {
        const sanitized = sanitizeValue(filterMeta, raw);

        if (!isEmptyValue(sanitized))
          out.push({ id: columnId, value: sanitized });
        continue;
      }
      if (selectableMeta.isLoading === true) {
        loadingColumnIds.add(columnId);
        if (optimisticAsync) out.push({ id: columnId, value: raw });
        continue;
      }
      out.push({ id: columnId, value: raw });
      continue;
    }

    // For non-select variants, sanitize immediately
    const sanitized = sanitizeValue(filterMeta, raw);
    if (!isEmptyValue(sanitized)) out.push({ id: columnId, value: sanitized });
  }

  // Always return processed filters if we have any, even if some loading filters were skipped
  // This ensures non-loading filters are applied immediately
  if (out.length > 0) return out;

  // If no results, check if we should return empty array vs initialStateFilters
  if (bucketColumnIds.size > 0) {
    // We found bucket data but couldn't process it - this could be due to:
    // 1. Loading state (isLoading: true) with optimisticAsync: false -> should return [] to override initial state
    // 2. Invalid data that got filtered out completely -> should return initialStateFilters for backward compatibility

    // If there are any loading columns with bucket data, prioritize waiting for loading over initial state
    if (loadingColumnIds.size > 0 && initialStateFilters) {
      for (const filter of initialStateFilters) {
        if (loadingColumnIds.has(filter.id)) {
          // This initial state filter conflicts with a loading bucket filter
          // Return empty array to let the loading filter take precedence when it completes
          return [];
        }
      }
    }

    // For other cases (invalid data that got completely filtered out), fall back to initial state
    return initialStateFilters;
  }

  // No bucket data found, fall back to initial state
  return initialStateFilters;
}
