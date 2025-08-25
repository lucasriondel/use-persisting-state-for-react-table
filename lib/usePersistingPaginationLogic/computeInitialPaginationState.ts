import { PaginationState } from "@tanstack/react-table";

export function computeInitialPaginationState(
  shouldPersistPageIndex: boolean,
  shouldPersistPageSize: boolean,
  pageIndexTarget: "url" | "localStorage" | undefined,
  pageSizeTarget: "url" | "localStorage" | undefined,
  pageIndexKey: string,
  pageSizeKey: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  initialState?: PaginationState
): PaginationState | undefined {
  const base: PaginationState = initialState ?? {
    pageIndex: 0,
    pageSize: 10,
  };
  let changed = false;
  const nextVal: PaginationState = { ...base };
  if (shouldPersistPageIndex) {
    const raw =
      pageIndexTarget === "url"
        ? urlBucket[pageIndexKey]
        : localBucket[pageIndexKey];
    if (typeof raw === "number") {
      nextVal.pageIndex = raw as number;
      changed = true;
    }
  }
  if (shouldPersistPageSize) {
    const raw =
      pageSizeTarget === "url"
        ? urlBucket[pageSizeKey]
        : localBucket[pageSizeKey];
    if (typeof raw === "number") {
      nextVal.pageSize = raw as number;
      changed = true;
    }
  }
  return changed ? nextVal : base;
}