import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";
import { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { useUrlState } from "use-url-state-reacthook";
import { PersistingTableOptions } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialSortingState } from "./computeInitialSortingState";
import { createSortingChangeHandler } from "./createSortingChangeHandler";

// Internal utilities - not exported to reduce API surface

export function usePersistingSortingLogic<TData extends RowData>(
  options: PersistingTableOptions<TData>
) {
  const sortingConfig = options.persistence?.sorting;
  const target = sortingConfig?.persistenceStorage;
  const columnKey = sortingConfig?.sortingColumnKey ?? "sortingColumn";
  const directionKey = sortingConfig?.sortingDirectionKey ?? "sortingDirection";

  const shouldPersist = Boolean(target);

  const [urlBucket, urlBucketApi] = useUrlState<Record<string, unknown>>(
    {},
    {
      ...(options.persistence?.urlNamespace && {
        namespace: options.persistence.urlNamespace,
      }),
      history: "replace",
      debounceMs: 0,
    }
  );

  const [localBucket, localBucketApi] = useLocalStorageState<
    Record<string, unknown>
  >(
    {},
    {
      key: options.persistence?.localStorageKey ?? "sorting",
    }
  );

  const handleSortingChange = useMemo(() => {
    if (!shouldPersist) return;

    return createSortingChangeHandler(
      target === "url" ? urlBucketApi : localBucketApi,
      columnKey,
      directionKey
    );
  }, [
    shouldPersist,
    target,
    columnKey,
    directionKey,
    urlBucketApi,
    localBucketApi,
  ]);

  // Track if initial state has been persisted to avoid duplicate persistence
  const initialStatePersisted = useRef(false);

  const initialSortingState = useMemo(() => {
    return computeInitialSortingState({
      shouldPersist,
      target,
      columnKey,
      directionKey,
      urlBucket,
      localBucket,
      initialState: options.initialState?.sorting,
    });
  }, []);

  useEffect(() => {
    if (!initialStatePersisted.current) {
      // Only persist initial state if it's different from what's already persisted
      const currentColumnValue = shouldPersist
        ? target === "url"
          ? urlBucket[columnKey]
          : localBucket[columnKey]
        : undefined;
      
      const currentDirectionValue = shouldPersist
        ? target === "url"
          ? urlBucket[directionKey]
          : localBucket[directionKey]
        : undefined;

      const shouldPersistInitial = 
        shouldPersist && 
        handleSortingChange &&
        initialSortingState.length > 0 &&
        (!currentColumnValue || !currentDirectionValue ||
         currentColumnValue !== initialSortingState[0]?.id ||
         currentDirectionValue !== (initialSortingState[0]?.desc ? "desc" : "asc"));

      if (shouldPersistInitial) {
        handleSortingChange(initialSortingState);
      }

      initialStatePersisted.current = true;
    }
  }, [
    shouldPersist,
    target,
    columnKey,
    directionKey,
    urlBucket,
    localBucket,
    handleSortingChange,
    initialSortingState,
  ]);

  return {
    handleSortingChange,
    initialSortingState,
  };
}
