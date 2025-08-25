import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";
import { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { useUrlState } from "use-url-state-reacthook";
import { PersistingTableOptions } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialSortingState } from "./computeInitialSortingState";
import { createSortingChangeHandler } from "./createSortingChangeHandler";
import { persistInitialSorting } from "./persistInitialSorting";

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
      key: options.persistence?.localStorageKey ?? "sorting",
    }
  );

  const initialSortingState = useMemo(() => {
    return computeInitialSortingState(
      shouldPersist,
      target,
      columnKey,
      directionKey,
      urlBucket,
      localBucket,
      options.initialState?.sorting
    );
  }, [
    shouldPersist,
    target,
    columnKey,
    directionKey,
    urlBucket,
    localBucket,
    options.initialState?.sorting,
  ]);

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

  useEffect(() => {
    if (!initialStatePersisted.current) {
      persistInitialSorting(
        shouldPersist,
        target,
        columnKey,
        directionKey,
        urlBucket,
        localBucket,
        urlBucketApi,
        localBucketApi,
        options.initialState?.sorting
      );
      initialStatePersisted.current = true;
    }
  }, [
    shouldPersist,
    target,
    columnKey,
    directionKey,
    urlBucket,
    localBucket,
    urlBucketApi,
    localBucketApi,
    options.initialState?.sorting,
  ]);

  return {
    handleSortingChange,
    initialSortingState,
  };
}
