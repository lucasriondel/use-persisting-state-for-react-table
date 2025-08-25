import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";
import { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { useUrlState } from "use-url-state-reacthook";
import { PersistingTableOptions } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialColumnVisibilityState } from "./computeInitialColumnVisibilityState";
import { createColumnVisibilityChangeHandler } from "./createColumnVisibilityChangeHandler";
import { persistInitialColumnVisibility } from "./persistInitialColumnVisibility";

export function usePersistingColumnVisibilityLogic<TData extends RowData>(
  options: PersistingTableOptions<TData>
) {
  const config = options.persistence?.columnVisibility;
  const target = config?.persistenceStorage;
  const key = config?.key ?? "columnVisibility";
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
      key: options.persistence?.localStorageKey ?? "columnVisibility",
    }
  );

  const initialColumnVisibilityState = useMemo(() => {
    return computeInitialColumnVisibilityState(
      shouldPersist,
      target,
      key,
      urlBucket,
      localBucket,
      options.initialState?.columnVisibility
    );
  }, [
    shouldPersist,
    target,
    key,
    urlBucket,
    localBucket,
    options.initialState?.columnVisibility,
  ]);

  const handleColumnVisibilityChange = useMemo(() => {
    if (!shouldPersist) return;

    return createColumnVisibilityChangeHandler(
      target === "url" ? urlBucketApi : localBucketApi,
      key
    );
  }, [shouldPersist, target, key, urlBucketApi, localBucketApi]);

  // Track if initial state has been persisted to avoid duplicate persistence
  const initialStatePersisted = useRef(false);

  useEffect(() => {
    if (!initialStatePersisted.current) {
      persistInitialColumnVisibility(
        shouldPersist,
        target,
        key,
        urlBucket,
        localBucket,
        urlBucketApi,
        localBucketApi,
        options.initialState?.columnVisibility
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
    options.initialState?.columnVisibility,
  ]);

  return { handleColumnVisibilityChange, initialColumnVisibilityState };
}
