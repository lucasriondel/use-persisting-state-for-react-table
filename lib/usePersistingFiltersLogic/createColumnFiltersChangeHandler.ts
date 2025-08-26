import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  Updater,
} from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";
import { getColumnIdentifier } from "../getColumnIdentifier";
import { flattenColumns } from "./flattenColumns";
import { isEmptyValue } from "./isEmptyValue";

/**
 * Compares two values for equality, handling arrays with order-independent comparison
 */
function areValuesEqual(prevValue: unknown, nextValue: unknown): boolean {
  // If both are arrays, compare them order-independently
  if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
    if (prevValue.length !== nextValue.length) return false;

    // Create sorted copies to avoid mutating the original arrays
    const sortedPrev = [...(prevValue as unknown[])].sort();
    const sortedNext = [...(nextValue as unknown[])].sort();

    return JSON.stringify(sortedPrev) === JSON.stringify(sortedNext);
  }

  // For non-arrays, use JSON.stringify comparison
  return JSON.stringify(prevValue) === JSON.stringify(nextValue);
}

export function createColumnFiltersChangeHandler<TData extends RowData>(
  columns: Array<ColumnDef<TData, unknown>>,
  urlBucketApi: UrlApiActions<Record<string, unknown>>,
  localBucketApi: LocalStorageApiActions<Record<string, unknown>>
) {
  return (
    updater: Updater<ColumnFiltersState>,
    currentTableState: ColumnFiltersState
  ) => {
    // Use the current table state for comparison and updater execution
    const prev = currentTableState;
    const next =
      typeof updater === "function"
        ? (updater as (old: ColumnFiltersState) => ColumnFiltersState)(prev)
        : updater;

    // Build patches only for filters that actually changed
    const urlPatch: Record<string, unknown> = {};
    const localPatch: Record<string, unknown> = {};

    // Only patch filters that changed
    const flat = flattenColumns(columns);

    for (const col of flat) {
      const filterMeta = col.meta?.filter;
      if (!filterMeta?.persistenceStorage) continue;

      const columnId = getColumnIdentifier(col);
      if (!columnId) continue;

      const key = filterMeta.key ?? String(columnId);
      const prevFilter = prev.find((f) => f.id === columnId);
      const nextFilter = next.find((f) => f.id === columnId);

      const prevValue = prevFilter?.value;
      const nextValue = nextFilter?.value;
      const prevHasValue = prevFilter && !isEmptyValue(prevValue);
      const nextHasValue = nextFilter && !isEmptyValue(nextValue);

      // Only patch if something actually changed
      const valueChanged = !areValuesEqual(prevValue, nextValue);
      const existenceChanged = prevHasValue !== nextHasValue;

      if (valueChanged || existenceChanged) {
        const patch =
          filterMeta.persistenceStorage === "url" ? urlPatch : localPatch;

        if (nextHasValue) {
          // Filter has a value - set it
          patch[key] = nextValue;
        } else {
          // Filter was removed or became empty - clear it
          patch[key] = undefined;
        }
      }
    }

    // Only patch if there are actual changes
    if (Object.keys(urlPatch).length > 0) {
      urlBucketApi.patch(urlPatch);
    }
    if (Object.keys(localPatch).length > 0) {
      localBucketApi.patch(localPatch);
    }
  };
}
