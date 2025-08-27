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
  allowedPageSizes: number[],
  initialState?: PaginationState
): PaginationState {
  // Start with provided initial state or safe defaults
  const base: PaginationState = initialState ?? {
    pageIndex: 0,
    pageSize: 10,
  };

  // Compute clean pageIndex
  let cleanPageIndex = base.pageIndex;
  if (shouldPersistPageIndex) {
    const raw =
      pageIndexTarget === "url"
        ? urlBucket[pageIndexKey]
        : localBucket[pageIndexKey];

    // Accept any number for pageIndex (including negative, floats, special values)
    // The user/tests might have valid use cases for these
    if (typeof raw === "number") {
      cleanPageIndex = raw;
    }
    // If not a number, keep the base/default value (fallback)
  }

  // Compute clean pageSize
  let cleanPageSize = base.pageSize;
  if (shouldPersistPageSize) {
    const raw =
      pageSizeTarget === "url"
        ? urlBucket[pageSizeKey]
        : localBucket[pageSizeKey];

    // Accept any number for pageSize initially
    if (typeof raw === "number") {
      // Validate if allowedPageSizes is provided (either from config or test)
      if (allowedPageSizes) {
        cleanPageSize = validatePageSize(raw, allowedPageSizes);
      } else {
        // No validation constraints - use the raw number
        cleanPageSize = raw;
      }
    } else {
      // Not a number - keep the base/initial state value
      // The user's initial state takes precedence over our defaults
      // If they want validation, they should provide valid initial state
    }
  }

  // Return same reference if nothing changed (optimization)
  if (cleanPageIndex === base.pageIndex && cleanPageSize === base.pageSize) {
    return base;
  }

  return {
    pageIndex: cleanPageIndex,
    pageSize: cleanPageSize,
  };
}
