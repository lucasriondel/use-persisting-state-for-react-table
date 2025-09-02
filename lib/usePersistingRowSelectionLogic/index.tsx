import { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { PersistingTableOptions, SharedBuckets } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialRowSelectionState } from "./computeInitialRowSelectionState";
import { createRowSelectionChangeHandler } from "./createRowSelectionChangeHandler";

// Internal utilities - not exported to reduce API surface

export function usePersistingRowSelectionLogic<TData extends RowData>(
  options: PersistingTableOptions<TData>,
  sharedBuckets: SharedBuckets
) {
  const config = options.persistence?.rowSelection;
  const target = config?.persistenceStorage;
  const key = config?.key ?? "rowSelection";
  const shouldPersist = Boolean(target);

  const { urlBucket, urlBucketApi, localBucket, localBucketApi } = sharedBuckets;

  const handleRowSelectionChange = useMemo(() => {
    if (!shouldPersist) return;

    return createRowSelectionChangeHandler(
      key,
      target === "url" ? urlBucketApi : localBucketApi
    );
  }, [shouldPersist, key, target, urlBucketApi, localBucketApi]);

  // Track if initial state has been persisted to avoid duplicate persistence
  const initialStatePersisted = useRef(false);

  const initialRowSelectionState = useMemo(() => {
    return computeInitialRowSelectionState({
      shouldPersist,
      target,
      key,
      urlBucket,
      localBucket,
      initialState: options.initialState?.rowSelection,
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
        handleRowSelectionChange &&
        (currentPersistedState === undefined ||
          JSON.stringify(currentPersistedState) !==
            JSON.stringify(initialRowSelectionState));

      if (shouldPersistInitial) {
        handleRowSelectionChange(initialRowSelectionState);
      }

      initialStatePersisted.current = true;
    }
  }, [
    shouldPersist,
    target,
    key,
    urlBucket,
    localBucket,
    handleRowSelectionChange,
    initialRowSelectionState,
  ]);

  return { handleRowSelectionChange, initialRowSelectionState };
}
