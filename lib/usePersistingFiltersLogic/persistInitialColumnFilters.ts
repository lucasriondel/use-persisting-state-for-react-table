import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { ColumnDef, ColumnFiltersState, RowData } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";
import { getColumnIdentifier } from "../getColumnIdentifier";
import { flattenColumns } from "./flattenColumns";
import { isEmptyValue } from "./isEmptyValue";

export function persistInitialColumnFilters<TData extends RowData>(
  columns: Array<ColumnDef<TData, unknown>>,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  urlBucketApi: UrlApiActions<Record<string, unknown>>,
  localBucketApi: LocalStorageApiActions<Record<string, unknown>>,
  initialFilters?: ColumnFiltersState
): void {
  if (!initialFilters) return;

  const flat = flattenColumns(columns);

  const hasAnyPersistedValue = flat.some((col) => {
    const filterMeta = col.meta?.filter;
    if (!filterMeta?.persistenceStorage) return false;

    const key = getColumnIdentifier(col);
    if (!key) return false;

    const raw =
      filterMeta.persistenceStorage === "url"
        ? urlBucket[key]
        : localBucket[key];
    const isEmpty = isEmptyValue(raw);

    return !isEmpty;
  });

  if (!hasAnyPersistedValue) {
    const urlPatch: Record<string, unknown> = {};
    const localPatch: Record<string, unknown> = {};

    for (const filter of initialFilters) {
      const col = flat.find((c) => {
        const columnId = getColumnIdentifier(c);
        return columnId === filter.id;
      });

      if (col) {
        const filterMeta = col.meta?.filter;
        if (filterMeta?.persistenceStorage && !isEmptyValue(filter.value)) {
          const key = getColumnIdentifier(col);
          if (!key) return;

          const patch =
            filterMeta.persistenceStorage === "url" ? urlPatch : localPatch;
          patch[key] = filter.value;
        }
      }
    }

    if (Object.keys(urlPatch).length > 0) {
      urlBucketApi.patch(urlPatch);
    }
    if (Object.keys(localPatch).length > 0) {
      localBucketApi.patch(localPatch);
    }
  }
}
