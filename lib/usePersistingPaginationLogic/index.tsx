import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";
import { PaginationState, RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { useUrlState } from "use-url-state-reacthook";
import { PersistingTableOptions } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialPaginationState } from "./computeInitialPaginationState";
import { createPaginationChangeHandler } from "./createPaginationChangeHandler";
import { persistInitialPagination } from "./persistInitialPagination";

// Internal utilities - not exported to reduce API surface

import { PersistenceStorage } from "../types";

export function usePersistingPaginationLogic<TData extends RowData>(
  options: PersistingTableOptions<TData> & {
    persistence?: {
      pagination?: {
        pageIndex?: {
          persistenceStorage: PersistenceStorage;
          key?: string;
        };
        pageSize?: { persistenceStorage: PersistenceStorage; key?: string };
      };
    };
  }
) {
  const paginationConfig = options.persistence?.pagination;

  const pageIndexTarget = paginationConfig?.pageIndex?.persistenceStorage;
  const pageIndexKey = paginationConfig?.pageIndex?.key ?? "pageIndex";

  const pageSizeTarget = paginationConfig?.pageSize?.persistenceStorage;
  const pageSizeKey = paginationConfig?.pageSize?.key ?? "pageSize";

  const shouldPersistPageIndex = Boolean(pageIndexTarget);
  const shouldPersistPageSize = Boolean(pageSizeTarget);

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
      key: options.persistence?.localStorageKey ?? "pagination",
    }
  );

  const initialPaginationState = useMemo(() => {
    return computeInitialPaginationState(
      shouldPersistPageIndex,
      shouldPersistPageSize,
      pageIndexTarget,
      pageSizeTarget,
      pageIndexKey,
      pageSizeKey,
      urlBucket,
      localBucket,
      options.initialState?.pagination
    );
  }, [
    shouldPersistPageIndex,
    shouldPersistPageSize,
    pageIndexTarget,
    pageSizeTarget,
    pageIndexKey,
    pageSizeKey,
    urlBucket,
    localBucket,
    options.initialState?.pagination,
  ]);

  const handlePaginationChange = useMemo(() => {
    return createPaginationChangeHandler(
      shouldPersistPageIndex,
      shouldPersistPageSize,
      pageIndexTarget ?? "url",
      pageIndexKey,
      pageSizeTarget ?? "url",
      pageSizeKey,
      urlBucketApi,
      localBucketApi
    );
  }, [
    shouldPersistPageIndex,
    shouldPersistPageSize,
    pageIndexTarget,
    pageSizeTarget,
    pageIndexKey,
    pageSizeKey,
    urlBucketApi,
    localBucketApi,
  ]);

  // Track if initial state has been persisted to avoid duplicate persistence
  const initialStatePersisted = useRef(false);

  useEffect(() => {
    if (!initialStatePersisted.current) {
      persistInitialPagination(
        shouldPersistPageIndex,
        shouldPersistPageSize,
        pageIndexTarget ?? "url",
        pageSizeTarget ?? "url",
        pageIndexKey,
        pageSizeKey,
        urlBucket,
        localBucket,
        urlBucketApi,
        localBucketApi,
        options.initialState?.pagination
      );
      initialStatePersisted.current = true;
    }
  }, [
    shouldPersistPageIndex,
    shouldPersistPageSize,
    pageIndexTarget,
    pageSizeTarget,
    pageIndexKey,
    pageSizeKey,
    urlBucket,
    localBucket,
    urlBucketApi,
    localBucketApi,
    options.initialState?.pagination,
  ]);

  const resetPagination = (
    pagination: PaginationState,
    setPagination: (pagination: PaginationState) => void
  ) => {
    const paginationDefault = {
      pageIndex: 0,
      pageSize: pagination.pageSize,
    };
    handlePaginationChange(paginationDefault, pagination);
    setPagination(paginationDefault);
  };

  return {
    handlePaginationChange,
    initialPaginationState,
    resetPagination,
  };
}
