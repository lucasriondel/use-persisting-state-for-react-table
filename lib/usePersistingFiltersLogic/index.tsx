import { ColumnDef, RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { PersistingTableOptions, SharedBuckets } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialColumnFiltersState } from "./computeInitialColumnFiltersState";
import { createColumnFiltersChangeHandler } from "./createColumnFiltersChangeHandler";
import { persistInitialColumnFilters } from "./persistInitialColumnFilters";

// Only export utilities actually needed outside this module
export { flattenColumns } from "./flattenColumns";
export { isEmptyValue } from "./isEmptyValue";
export { sanitizeValue } from "./sanitizeValues";

export function usePersistingFiltersLogic<TData extends RowData>(
  options: PersistingTableOptions<TData>,
  sharedBuckets: SharedBuckets
) {
  const columns = options.columns as Array<ColumnDef<TData, unknown>>;

  const { urlBucket, urlBucketApi, localBucket, localBucketApi } = sharedBuckets;

  const handleColumnFiltersChange = useMemo(() => {
    return createColumnFiltersChangeHandler(
      columns ?? [],
      urlBucketApi,
      localBucketApi
    );
  }, [columns, urlBucketApi, localBucketApi]);

  // Track if initial state has been persisted to avoid duplicate persistence
  const initialStatePersisted = useRef(false);

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
  }, []);

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
  }, []);

  return {
    handleColumnFiltersChange,
    initialColumnFiltersState,
  };
}
