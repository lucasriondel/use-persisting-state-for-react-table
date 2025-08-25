import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";
import { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { useUrlState } from "use-url-state-reacthook";
import { PersistingTableOptions } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialGlobalFilterState } from "./computeInitialGlobalFilterState";
import { createGlobalFilterChangeHandler } from "./createGlobalFilterChangeHandler";
import { persistInitialGlobalFilter } from "./persistInitialGlobalFilter";

// Internal utilities - not exported to reduce API surface

export function usePersistingGlobalFilterLogic<TData extends RowData>(
  options: PersistingTableOptions<TData>
) {
  const config = options.persistence?.globalFilter;
  const target = config?.persistenceStorage;
  const key = config?.key ?? "globalFilter";
  const shouldPersist = Boolean(target);

  const [urlBucket, urlBucketApi] = useUrlState<Record<string, unknown>>(
    {},
    {
      namespace: options.persistence?.urlNamespace,
      history: "replace",
      debounceMs: 200,
    }
  );

  const [localBucket, localBucketApi] = useLocalStorageState<
    Record<string, unknown>
  >(
    {},
    {
      key: options.persistence?.localStorageKey ?? "globalFilter",
    }
  );

  const initialGlobalFilterState = useMemo(() => {
    return computeInitialGlobalFilterState(
      shouldPersist,
      target,
      key,
      urlBucket,
      localBucket,
      options.initialState?.globalFilter
    );
  }, [
    shouldPersist,
    target,
    key,
    urlBucket,
    localBucket,
    options.initialState?.globalFilter,
  ]);

  const handleGlobalFilterChange = useMemo(() => {
    return createGlobalFilterChangeHandler(
      key,
      target === "url" ? urlBucketApi : localBucketApi
    );
  }, [key, target, localBucketApi, urlBucketApi]);

  // Track if initial state has been persisted to avoid duplicate persistence
  const initialStatePersisted = useRef(false);

  useEffect(() => {
    if (!initialStatePersisted.current) {
      persistInitialGlobalFilter(
        shouldPersist,
        target,
        key,
        urlBucket,
        localBucket,
        urlBucketApi,
        localBucketApi,
        options.initialState?.globalFilter
      );
      initialStatePersisted.current = true;
    }
  }, [
    shouldPersist,
    target,
    key,
    urlBucket,
    localBucket,
    urlBucketApi,
    localBucketApi,
    options.initialState?.globalFilter,
  ]);

  return { handleGlobalFilterChange, initialGlobalFilterState };
}
