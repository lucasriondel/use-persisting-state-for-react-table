import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";
import { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { useUrlState } from "use-url-state-reacthook";
import { PersistingTableOptions } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialRowSelectionState } from "./computeInitialRowSelectionState";
import { createRowSelectionChangeHandler } from "./createRowSelectionChangeHandler";
import { persistInitialRowSelection } from "./persistInitialRowSelection";

// Internal utilities - not exported to reduce API surface

export function usePersistingRowSelectionLogic<TData extends RowData>(
  options: PersistingTableOptions<TData>
) {
  const config = options.persistence?.rowSelection;
  const target = config?.persistenceStorage;
  const key = config?.key ?? "rowSelection";
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
      key: options.persistence?.localStorageKey ?? "rowSelection",
    }
  );

  const initialRowSelectionState = useMemo(() => {
    return computeInitialRowSelectionState(
      shouldPersist,
      target,
      key,
      urlBucket,
      localBucket,
      options.initialState?.rowSelection
    );
  }, [
    shouldPersist,
    target,
    key,
    urlBucket,
    localBucket,
    options.initialState?.rowSelection,
  ]);

  const handleRowSelectionChange = useMemo(() => {
    if (!shouldPersist) return;

    return createRowSelectionChangeHandler(
      key,
      target === "url" ? urlBucketApi : localBucketApi
    );
  }, [shouldPersist, key, target, urlBucketApi, localBucketApi]);

  // Track if initial state has been persisted to avoid duplicate persistence
  const initialStatePersisted = useRef(false);

  useEffect(() => {
    if (!initialStatePersisted.current) {
      persistInitialRowSelection(
        shouldPersist,
        target,
        key,
        urlBucket,
        localBucket,
        urlBucketApi,
        localBucketApi,
        options.initialState?.rowSelection
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
    options.initialState?.rowSelection,
  ]);

  return { handleRowSelectionChange, initialRowSelectionState };
}
