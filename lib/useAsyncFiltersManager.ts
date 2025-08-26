import { ColumnDef, ColumnFiltersState, RowData } from "@tanstack/react-table";
import { useEffect } from "react";
import { getColumnIdentifier } from "./getColumnIdentifier";
import { MultiSelectMeta, SelectMeta } from "./types";
import { flattenColumns } from "./usePersistingFiltersLogic/flattenColumns";
import { sanitizeValue } from "./usePersistingFiltersLogic/sanitizeValues";
import { useFilterBuckets } from "./usePersistingFiltersLogic/useFilterBuckets";

interface UseAsyncFiltersManagerProps<TData extends RowData> {
  columns: ColumnDef<TData>[];
  urlNamespace: string | undefined;
  localStorageKey: string | undefined;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
}

export function useAsyncFiltersManager<TData extends RowData>({
  columns,
  urlNamespace,
  localStorageKey,
}: //   setColumnFilters,
UseAsyncFiltersManagerProps<TData>) {
  const { urlBucket, urlBucketApi, localBucket, localBucketApi } =
    useFilterBuckets({
      columns,
      urlNamespace: urlNamespace,
      localStorageKey: localStorageKey,
    });

  useEffect(() => {
    if (!columns || columns.length === 0) return;

    const flat = flattenColumns(columns);
    const urlPatch: Record<string, unknown> = {};
    const localPatch: Record<string, unknown> = {};
    let hasAnyPatch = false;

    for (const col of flat) {
      const filterMeta = col.meta?.filter;

      if (!filterMeta?.persistenceStorage) continue;

      if (
        (filterMeta.variant === "select" ||
          filterMeta.variant === "multiSelect") &&
        (filterMeta as SelectMeta | MultiSelectMeta).isLoading === false
      ) {
        const key = filterMeta.key ?? getColumnIdentifier(col);
        if (!key) continue;

        const raw =
          filterMeta.persistenceStorage === "url"
            ? urlBucket[key]
            : localBucket[key];
        const sanitized = sanitizeValue(filterMeta, raw);
        const targetPatch =
          filterMeta.persistenceStorage === "url" ? urlPatch : localPatch;
        const equal = JSON.stringify(sanitized) === JSON.stringify(raw);

        if (!equal) {
          targetPatch[key] = sanitized === undefined ? undefined : sanitized;
          hasAnyPatch = true;
        }
      }
    }

    console.log({ urlPatch, localPatch });

    if (!hasAnyPatch) return;

    if (Object.keys(urlPatch).length > 0) urlBucketApi.patch(urlPatch);
    if (Object.keys(localPatch).length > 0) localBucketApi.patch(localPatch);
  }, [columns, urlBucket, localBucket, urlBucketApi, localBucketApi]);
}
