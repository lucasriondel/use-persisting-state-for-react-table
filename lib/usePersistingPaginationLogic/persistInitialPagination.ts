import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { PaginationState } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";
import { PersistenceStorage } from "../types";

/**
 * Persists the clean initial pagination state to storage.
 * This function assumes the pagination state has already been validated and cleaned
 * by computeInitialPaginationState, so no additional validation is needed.
 */
export function persistInitialPagination(
  shouldPersistPageIndex: boolean,
  shouldPersistPageSize: boolean,
  pageIndexTarget: PersistenceStorage | undefined,
  pageSizeTarget: PersistenceStorage | undefined,
  pageIndexKey: string,
  pageSizeKey: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  urlBucketApi: UrlApiActions<Record<string, unknown>>,
  localBucketApi: LocalStorageApiActions<Record<string, unknown>>,
  cleanPaginationState: PaginationState
): void {
  // Guard against invalid pagination state
  if (!cleanPaginationState) {
    return;
  }
  const urlPatch: Record<string, unknown> = {};
  const localPatch: Record<string, unknown> = {};

  // Persist pageIndex if needed and not already present
  if (shouldPersistPageIndex) {
    const currentValue =
      pageIndexTarget === "url"
        ? urlBucket[pageIndexKey]
        : localBucket[pageIndexKey];

    // Only persist if no valid value exists in storage
    if (typeof currentValue !== "number") {
      const patch = pageIndexTarget === "url" ? urlPatch : localPatch;
      patch[pageIndexKey] = cleanPaginationState.pageIndex;
    }
  }

  // Persist pageSize if needed and not already present
  if (shouldPersistPageSize) {
    const currentValue =
      pageSizeTarget === "url"
        ? urlBucket[pageSizeKey]
        : localBucket[pageSizeKey];

    // Only persist if no valid value exists in storage
    if (typeof currentValue !== "number") {
      const patch = pageSizeTarget === "url" ? urlPatch : localPatch;
      patch[pageSizeKey] = cleanPaginationState.pageSize;
    }
  }

  // Apply patches to storage
  if (Object.keys(urlPatch).length > 0) {
    urlBucketApi.patch(urlPatch);
  }
  if (Object.keys(localPatch).length > 0) {
    localBucketApi.patch(localPatch);
  }
}
