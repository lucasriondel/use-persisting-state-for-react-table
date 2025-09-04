import { RowData } from "@tanstack/react-table";
import { useEffect, useMemo, useRef } from "react";
import {
  PersistingTableOptions,
  SharedBuckets,
} from "../usePersistingStateForReactTable";

// Import utility functions
import { computeInitialPaginationState } from "./computeInitialPaginationState";
import { createPaginationChangeHandler } from "./createPaginationChangeHandler";

// Internal utilities - not exported to reduce API surface

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
  options: PersistingTableOptions<TData>,
  sharedBuckets: SharedBuckets
) {
  const paginationConfig = options.persistence?.pagination;

  const pageIndexTarget = paginationConfig?.pageIndex?.persistenceStorage;
  const pageIndexKey = paginationConfig?.pageIndex?.key ?? "pageIndex";

  const pageSizeTarget = paginationConfig?.pageSize?.persistenceStorage;
  const pageSizeKey = paginationConfig?.pageSize?.key ?? "pageSize";
  const allowedPageSizes = paginationConfig?.pageSize?.allowedPageSizes ?? [
    10, 20, 50,
  ];

  const shouldPersistPageIndex = Boolean(pageIndexTarget);
  const shouldPersistPageSize = Boolean(pageSizeTarget);

  const { urlBucket, urlBucketApi, localBucket, localBucketApi } =
    sharedBuckets;

  const handlePaginationChange = useMemo(() => {
    return createPaginationChangeHandler({
      shouldPersistPageIndex,
      shouldPersistPageSize,
      pageIndexTarget: pageIndexTarget ?? "url",
      pageIndexKey,
      pageSizeTarget: pageSizeTarget ?? "url",
      pageSizeKey,
      urlBucketApi,
      localBucketApi,
      allowedPageSizes,
    });
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

  const initialPaginationState = useMemo(() => {
    return computeInitialPaginationState({
      shouldPersistPageIndex,
      shouldPersistPageSize,
      pageIndexPersistenceStorage: pageIndexTarget,
      pageSizePersistenceStorage: pageSizeTarget,
      pageIndexKey,
      pageSizeKey,
      urlBucket,
      localBucket,
      allowedPageSizes,
      initialState: options.initialState?.pagination,
    });
  }, []);

  useEffect(() => {
    if (!initialStatePersisted.current) {
      // Only persist initial state if it's different from what's already persisted
      const currentPersistedState = {
        pageIndex: shouldPersistPageIndex
          ? pageIndexTarget === "url"
            ? urlBucket[pageIndexKey]
            : localBucket[pageIndexKey]
          : undefined,
        pageSize: shouldPersistPageSize
          ? pageSizeTarget === "url"
            ? urlBucket[pageSizeKey]
            : localBucket[pageSizeKey]
          : undefined,
      };

      const shouldPersist =
        (shouldPersistPageIndex &&
          (currentPersistedState.pageIndex === undefined ||
            currentPersistedState.pageIndex !==
              initialPaginationState.pageIndex)) ||
        (shouldPersistPageSize &&
          (currentPersistedState.pageSize === undefined ||
            currentPersistedState.pageSize !==
              initialPaginationState.pageSize));

      if (shouldPersist) {
        handlePaginationChange(initialPaginationState);
      }

      initialStatePersisted.current = true;
    }
  }, [
    shouldPersistPageIndex,
    shouldPersistPageSize,
    pageIndexTarget,
    pageSizeTarget,
    pageIndexKey,
    pageSizeKey,
    urlBucketApi,
    localBucketApi,
    initialPaginationState,
    urlBucket,
    localBucket,
  ]);

  return {
    handlePaginationChange,
    initialPaginationState,
  };
}
