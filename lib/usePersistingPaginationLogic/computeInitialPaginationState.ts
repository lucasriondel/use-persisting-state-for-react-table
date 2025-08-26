import { PaginationState } from "@tanstack/react-table";
import { PersistenceStorage } from "../types";
import { validatePageSize } from "./validatePageSize";

export function computeInitialPaginationState(
  shouldPersistPageIndex: boolean,
  shouldPersistPageSize: boolean,
  pageIndexTarget: PersistenceStorage | undefined,
  pageSizeTarget: PersistenceStorage | undefined,
  pageIndexKey: string,
  pageSizeKey: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  initialState?: PaginationState,
  allowedPageSizes?: number[]
): PaginationState {
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
      nextVal.pageIndex = raw;
      changed = true;
    }
  }
  if (shouldPersistPageSize) {
    const raw =
      pageSizeTarget === "url"
        ? urlBucket[pageSizeKey]
        : localBucket[pageSizeKey];
    
    if (typeof raw === "number") {
      // Only validate if allowedPageSizes is provided
      if (allowedPageSizes !== undefined) {
        const validatedPageSize = validatePageSize(raw, allowedPageSizes);
        nextVal.pageSize = validatedPageSize;
      } else {
        // No validation - use raw value for backward compatibility
        nextVal.pageSize = raw;
      }
      changed = true;
    }
  }
  return changed ? nextVal : base;
}
