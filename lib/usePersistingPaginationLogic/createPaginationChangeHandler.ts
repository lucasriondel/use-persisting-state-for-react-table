import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { PaginationState, Updater } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";
import { PersistenceStorage } from "../types";
import { validatePageSize } from "./validatePageSize";

export interface CreatePaginationChangeHandlerParams {
  shouldPersistPageIndex: boolean;
  shouldPersistPageSize: boolean;
  pageIndexTarget: PersistenceStorage;
  pageIndexKey: string;
  pageSizeTarget: PersistenceStorage;
  pageSizeKey: string;
  urlBucketApi: UrlApiActions<Record<string, unknown>>;
  localBucketApi: LocalStorageApiActions<Record<string, unknown>>;
  allowedPageSizes: number[] | undefined;
}

export function createPaginationChangeHandler({
  shouldPersistPageIndex,
  shouldPersistPageSize,
  pageIndexTarget,
  pageIndexKey,
  pageSizeTarget,
  pageSizeKey,
  urlBucketApi,
  localBucketApi,
  allowedPageSizes,
}: CreatePaginationChangeHandlerParams) {
  return (
    updater: Updater<PaginationState>,
    currentTableState?: PaginationState
  ) => {
    const prev = currentTableState;

    if (!prev && typeof updater === "function") {
      throw new Error(
        "Cannot use updater function when currentTableState is undefined"
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const next = typeof updater === "function" ? updater(prev!) : updater;

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
