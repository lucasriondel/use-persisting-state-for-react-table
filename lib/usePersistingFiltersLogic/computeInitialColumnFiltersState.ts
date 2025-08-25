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

  for (const col of flat) {
    const filterMeta = col.meta?.filter;
    if (!filterMeta?.persistenceStorage) continue;

    const columnId = getColumnIdentifier(col);
    if (!columnId) continue;

    const key = filterMeta.key ?? String(columnId);
    const raw =
      filterMeta.persistenceStorage === "url"
        ? urlBucket[key]
        : localBucket[key];

    if (isEmptyValue(raw)) continue;

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

  return out.length > 0 ? out : initialStateFilters;
}
