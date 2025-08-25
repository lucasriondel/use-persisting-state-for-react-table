import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";
import { ColumnDef, RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { useUrlState } from "use-url-state-reacthook";
import { getColumnIdentifier } from "../getColumnIdentifier";
import { PersistingTableOptions } from "../usePersistingStateForReactTable";

// Import utility functions
import { buildUrlCodecs } from "./buildUrlCodecs";
import { computeInitialColumnFiltersState } from "./computeInitialColumnFiltersState";
import { createColumnFiltersChangeHandler } from "./createColumnFiltersChangeHandler";
import { flattenColumns } from "./flattenColumns";
import { persistInitialColumnFilters } from "./persistInitialColumnFilters";
import { sanitizeValue } from "./sanitizeValues";

// Import React Table filter meta types from main types file
import type { MultiSelectMeta, SelectMeta } from "@tanstack/react-table";

// Only export utilities actually needed outside this module
export { flattenColumns } from "./flattenColumns";
export { isEmptyValue } from "./isEmptyValue";
export { sanitizeValue } from "./sanitizeValues";

export function usePersistingFiltersLogic<TData extends RowData>(
  options: PersistingTableOptions<TData>
) {
  const columns = options.columns as Array<ColumnDef<TData, unknown>>;

  const urlCodecs = useMemo(() => buildUrlCodecs(columns ?? []), [columns]);

  // Set up URL and LocalStorage state buckets
  const [urlBucket, urlBucketApi] = useUrlState<Record<string, unknown>>(
    {},
    {
      codecs: urlCodecs,
      namespace: options.persistence?.urlNamespace,
      history: "replace",
      debounceMs: 0,
    }
  );

  const [localBucket, localBucketApi] = useLocalStorageState<
    Record<string, unknown>
  >(
    {},
    {
      key: options.persistence?.localStorageKey ?? "filters",
    }
  );

  const optimisticAsync =
    options.persistence?.filters?.optimisticAsync ?? false;
  const initialColumnFiltersState = useMemo(() => {
    const result = computeInitialColumnFiltersState(
      columns ?? [],
      urlBucket,
      localBucket,
      optimisticAsync,
      options.initialState?.columnFilters
    );

    return result;
  }, [
    columns,
    urlBucket,
    localBucket,
    optimisticAsync,
    options.initialState?.columnFilters,
  ]);

  const handleColumnFiltersChange = useMemo(() => {
    return createColumnFiltersChangeHandler(
      columns ?? [],
      urlBucketApi,
      localBucketApi
    );
  }, [columns, urlBucketApi, localBucketApi]);

  // After options finish loading, validate persisted select-like values and clean them
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

    if (!hasAnyPatch) return;

    if (Object.keys(urlPatch).length > 0) urlBucketApi.patch(urlPatch);
    if (Object.keys(localPatch).length > 0) localBucketApi.patch(localPatch);
  }, [columns, urlBucket, localBucket, urlBucketApi, localBucketApi]);

  // Track if initial state has been persisted to avoid duplicate persistence
  const initialStatePersisted = useRef(false);
  useEffect(() => {
    if (!initialStatePersisted.current) {
      persistInitialColumnFilters(
        columns ?? [],
        urlBucket,
        localBucket,
        urlBucketApi,
        localBucketApi,
        options.initialState?.columnFilters
      );
      initialStatePersisted.current = true;
    }
  }, [
    columns,
    urlBucket,
    localBucket,
    urlBucketApi,
    localBucketApi,
    options.initialState?.columnFilters,
  ]);

  return {
    handleColumnFiltersChange,
    initialColumnFiltersState,
  };
}
