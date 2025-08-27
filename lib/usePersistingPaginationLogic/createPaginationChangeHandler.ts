import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { PaginationState, Updater } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";
import { PersistenceStorage } from "../types";
import { validatePageSize } from "./validatePageSize";

export function createPaginationChangeHandler(
  shouldPersistPageIndex: boolean,
  shouldPersistPageSize: boolean,
  pageIndexTarget: PersistenceStorage,
  pageIndexKey: string,
  pageSizeTarget: PersistenceStorage,
  pageSizeKey: string,
  urlBucketApi: UrlApiActions<Record<string, unknown>>,
  localBucketApi: LocalStorageApiActions<Record<string, unknown>>,
  allowedPageSizes: number[] | undefined
) {
  return (
    updater: Updater<PaginationState>,
    currentTableState: PaginationState
  ) => {
    const prev = currentTableState;
    const next = typeof updater === "function" ? updater(prev) : updater;

    if (shouldPersistPageIndex && next.pageIndex !== undefined) {
      if (pageIndexTarget === "url") {
        urlBucketApi.patch({ [pageIndexKey]: next.pageIndex });
      } else {
        localBucketApi.patch({ [pageIndexKey]: next.pageIndex });
      }
    }

    if (shouldPersistPageSize && next.pageSize !== undefined) {
      let pageSizeToStore = next.pageSize;

      // Validate if allowedPageSizes is provided (either from config or test)
      if (allowedPageSizes) {
        pageSizeToStore = validatePageSize(next.pageSize, allowedPageSizes);
      }

      if (pageSizeTarget === "url") {
        urlBucketApi.patch({ [pageSizeKey]: pageSizeToStore });
      } else {
        localBucketApi.patch({ [pageSizeKey]: pageSizeToStore });
      }
    }
  };
}
