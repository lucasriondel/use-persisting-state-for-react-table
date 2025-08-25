import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { PaginationState, Updater } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";

export function createPaginationChangeHandler(
  shouldPersistPageIndex: boolean,
  shouldPersistPageSize: boolean,
  pageIndexTarget: "url" | "localStorage",
  pageIndexKey: string,
  pageSizeTarget: "url" | "localStorage",
  pageSizeKey: string,
  urlBucketApi: UrlApiActions<Record<string, unknown>>,
  localBucketApi: LocalStorageApiActions<Record<string, unknown>>
) {
  return (
    updater: Updater<PaginationState>,
    currentTableState: PaginationState
  ) => {
    const prev = currentTableState;
    const next =
      typeof updater === "function"
        ? (updater as (old: PaginationState) => PaginationState)(prev)
        : (updater as PaginationState);

    if (shouldPersistPageIndex && next.pageIndex !== undefined) {
      if (pageIndexTarget === "url") {
        urlBucketApi.patch({ [pageIndexKey]: next.pageIndex });
      } else {
        localBucketApi.patch({ [pageIndexKey]: next.pageIndex });
      }
    }

    if (shouldPersistPageSize && next.pageSize !== undefined) {
      if (pageSizeTarget === "url") {
        urlBucketApi.patch({ [pageSizeKey]: next.pageSize });
      } else {
        localBucketApi.patch({ [pageSizeKey]: next.pageSize });
      }
    }
  };
}
