import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";
import { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import { useUrlState } from "use-url-state-reacthook";
import { PersistingTableOptions } from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialPaginationState } from "./computeInitialPaginationState";
import { createPaginationChangeHandler } from "./createPaginationChangeHandler";
import { persistInitialPagination } from "./persistInitialPagination";

// Internal utilities - not exported to reduce API surface

import { PersistenceStorage } from "../types";

/**
 * Hook for managing pagination state persistence with optional page size validation.
 *
 * @param options Configuration options including persistence settings
 * @param options.persistence.pagination.pageSize.allowedPageSizes Optional array of allowed page size values.
 *   When provided, persisted page sizes will be validated against this array.
 *   If a persisted page size is not in this array, it will fallback to the first value.
 *   When not provided, no validation is performed (backward compatible behavior).
 *
 * @example
 * ```tsx
 * // With validation
 * const { handlePaginationChange, initialPaginationState } = usePersistingPaginationLogic({
 *   columns: [],
 *   persistence: {
 *     pagination: {
 *       pageSize: {
 *         persistenceStorage: "url",
 *         allowedPageSizes: [10, 25, 50, 100]
 *       }
 *     }
 *   }
 * });
 *
 * // Without validation (backward compatible)
 * const { handlePaginationChange, initialPaginationState } = usePersistingPaginationLogic({
 *   columns: [],
 *   persistence: {
 *     pagination: {
 *       pageSize: {
 *         persistenceStorage: "url"
 *       }
 *     }
 *   }
 * });
 * ```
 */
export function usePersistingPaginationLogic<TData extends RowData>(
  options: PersistingTableOptions<TData> & {
    persistence?: {
      pagination?: {
        pageIndex?: {
          persistenceStorage: PersistenceStorage;
          key?: string;
        };
        pageSize?: {
          persistenceStorage: PersistenceStorage;
          key?: string;
          allowedPageSizes?: number[];
        };
      };
    };
  }
) {
  const paginationConfig = options.persistence?.pagination;

  const pageIndexTarget = paginationConfig?.pageIndex?.persistenceStorage;
  const pageIndexKey = paginationConfig?.pageIndex?.key ?? "pageIndex";

  const pageSizeTarget = paginationConfig?.pageSize?.persistenceStorage;
  const pageSizeKey = paginationConfig?.pageSize?.key ?? "pageSize";
  const allowedPageSizes = paginationConfig?.pageSize?.allowedPageSizes;

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
      options.initialState?.pagination,
      allowedPageSizes
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
    allowedPageSizes,
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
      localBucketApi,
      allowedPageSizes
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
    allowedPageSizes,
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
        options.initialState?.pagination,
        allowedPageSizes
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
    allowedPageSizes,
  ]);

  return {
    handlePaginationChange,
    initialPaginationState,
  };
}
