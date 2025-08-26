import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { PaginationState } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";
import { PersistenceStorage } from "../types";
import { validatePageSize } from "./validatePageSize";

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
  initialPagination?: PaginationState,
  allowedPageSizes?: number[]
): void {
  if (initialPagination) {
    let needsUpdate = false;
    const urlPatch: Record<string, unknown> = {};
    const localPatch: Record<string, unknown> = {};

    if (shouldPersistPageIndex) {
      const raw =
        pageIndexTarget === "url"
          ? urlBucket[pageIndexKey]
          : localBucket[pageIndexKey];
      if (typeof raw !== "number") {
        const patch = pageIndexTarget === "url" ? urlPatch : localPatch;
        patch[pageIndexKey] = initialPagination.pageIndex;
        needsUpdate = true;
      }
    }

    if (shouldPersistPageSize) {
      const raw =
        pageSizeTarget === "url"
          ? urlBucket[pageSizeKey]
          : localBucket[pageSizeKey];
      if (typeof raw !== "number") {
        const patch = pageSizeTarget === "url" ? urlPatch : localPatch;
        
        let pageSizeToStore = initialPagination.pageSize;
        // Only validate if allowedPageSizes is provided
        if (allowedPageSizes !== undefined) {
          pageSizeToStore = validatePageSize(initialPagination.pageSize, allowedPageSizes);
        }
        
        patch[pageSizeKey] = pageSizeToStore;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      if (Object.keys(urlPatch).length > 0) urlBucketApi.patch(urlPatch);
      if (Object.keys(localPatch).length > 0) localBucketApi.patch(localPatch);
    }
  }
}
