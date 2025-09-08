import { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { PersistingTableOptions, SharedBuckets } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialGlobalFilterState } from "./computeInitialGlobalFilterState";
import { createGlobalFilterChangeHandler } from "./createGlobalFilterChangeHandler";

// Internal utilities - not exported to reduce API surface

export function usePersistingGlobalFilterLogic<TData extends RowData>(
  options: PersistingTableOptions<TData>,
  sharedBuckets: SharedBuckets
) {
  const config = options.persistence?.globalFilter;
  const target = config?.persistenceStorage;
  const key = config?.key ?? "globalFilter";
  const shouldPersist = Boolean(target);

  const { urlBucket, urlBucketApi, localBucket, localBucketApi } = sharedBuckets;

  const handleGlobalFilterChange = useMemo(() => {
    return createGlobalFilterChangeHandler(
      key,
      target === "url" ? urlBucketApi : localBucketApi
    );
  }, [key, target, localBucketApi, urlBucketApi]);

  // Track if initial state has been persisted to avoid duplicate persistence
  const initialStatePersisted = useRef(false);

  const initialGlobalFilterState = useMemo(() => {
    return computeInitialGlobalFilterState({
      shouldPersist,
      target,
      key,
      urlBucket,
      localBucket,
      initialState: options.initialState?.globalFilter as string | undefined,
    });
  }, []);

  useEffect(() => {
    if (!initialStatePersisted.current) {
      // Only persist initial state if it's different from what's already persisted
      const currentPersistedState = shouldPersist
        ? target === "url"
          ? urlBucket[key]
          : localBucket[key]
        : undefined;

      const shouldPersistInitial =
        shouldPersist &&
        initialGlobalFilterState &&
        (currentPersistedState === undefined ||
          currentPersistedState !== initialGlobalFilterState);

      if (shouldPersistInitial) {
        handleGlobalFilterChange(initialGlobalFilterState);
      }

      initialStatePersisted.current = true;
    }
  }, [
    shouldPersist,
    target,
    key,
    urlBucket,
    localBucket,
    handleGlobalFilterChange,
    initialGlobalFilterState,
  ]);

  return { handleGlobalFilterChange, initialGlobalFilterState };
}
