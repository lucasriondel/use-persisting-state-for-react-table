import { ColumnDef, RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { PersistingTableOptions } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialColumnFiltersState } from "./computeInitialColumnFiltersState";
import { createColumnFiltersChangeHandler } from "./createColumnFiltersChangeHandler";
import { persistInitialColumnFilters } from "./persistInitialColumnFilters";

// Import React Table filter meta types from main types file
import { useFilterBuckets } from "./useFilterBuckets";

// Only export utilities actually needed outside this module
export { flattenColumns } from "./flattenColumns";
export { isEmptyValue } from "./isEmptyValue";
export { sanitizeValue } from "./sanitizeValues";

export function usePersistingFiltersLogic<TData extends RowData>(
  options: PersistingTableOptions<TData>
) {
  const columns = options.columns as Array<ColumnDef<TData, unknown>>;

  const { urlBucket, urlBucketApi, localBucket, localBucketApi } =
    useFilterBuckets({
      columns,
      urlNamespace: options.persistence?.urlNamespace,
      localStorageKey: options.persistence?.localStorageKey,
    });

  const optimisticAsync =
    options.persistence?.filters?.optimisticAsync ?? false;
  const initialColumnFiltersState = useMemo(() => {
    const result = computeInitialColumnFiltersState({
      columns: columns ?? [],
      urlBucket,
      localBucket,
      optimisticAsync,
      initialStateFilters: options.initialState?.columnFilters,
    });

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
