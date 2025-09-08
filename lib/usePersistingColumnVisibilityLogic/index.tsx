import { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { PersistingTableOptions, SharedBuckets } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialColumnVisibilityState } from "./computeInitialColumnVisibilityState";
import { createColumnVisibilityChangeHandler } from "./createColumnVisibilityChangeHandler";

export function usePersistingColumnVisibilityLogic<TData extends RowData>(
  options: PersistingTableOptions<TData>,
  sharedBuckets: SharedBuckets
) {
  const config = options.persistence?.columnVisibility;
  const target = config?.persistenceStorage;
  const key = config?.key ?? "columnVisibility";
  const shouldPersist = Boolean(target);

  const { urlBucket, urlBucketApi, localBucket, localBucketApi } = sharedBuckets;

  const handleColumnVisibilityChange = useMemo(() => {
    if (!shouldPersist) return;

    return createColumnVisibilityChangeHandler(
      target === "url" ? urlBucketApi : localBucketApi,
      key
    );
  }, [shouldPersist, target, key, urlBucketApi, localBucketApi]);

  // Track if initial state has been persisted to avoid duplicate persistence
  const initialStatePersisted = useRef(false);

  const initialColumnVisibilityState = useMemo(() => {
    return computeInitialColumnVisibilityState({
      shouldPersist,
      target,
      key,
      urlBucket,
      localBucket,
      initialState: options.initialState?.columnVisibility,
    });
  }, []);

  useEffect(() => {
    if (!initialStatePersisted.current && handleColumnVisibilityChange) {
      // Only persist initial state if it's different from what's already persisted
      const currentPersistedState = target === "url" ? urlBucket[key] : localBucket[key];
      
      const shouldPersistInitialState = 
        shouldPersist && 
        (currentPersistedState === undefined || 
         JSON.stringify(currentPersistedState) !== JSON.stringify(initialColumnVisibilityState));

      if (shouldPersistInitialState && initialColumnVisibilityState !== undefined) {
        handleColumnVisibilityChange(initialColumnVisibilityState, initialColumnVisibilityState);
      }

      initialStatePersisted.current = true;
    }
  }, [
    shouldPersist,
    target,
    key,
    urlBucket,
    localBucket,
    handleColumnVisibilityChange,
    initialColumnVisibilityState,
  ]);

  return { handleColumnVisibilityChange, initialColumnVisibilityState };
}