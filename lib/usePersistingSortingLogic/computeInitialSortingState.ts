import { SortingState } from "@tanstack/react-table";
import { PersistenceStorage } from "../types";

interface ComputeInitialSortingStateParams {
  shouldPersist: boolean;
  target: PersistenceStorage | undefined;
  columnKey: string;
  directionKey: string;
  urlBucket: Record<string, unknown>;
  localBucket: Record<string, unknown>;
  initialState?: SortingState | undefined;
}

function isValidSortingDirection(value: unknown): value is "asc" | "desc" {
  return typeof value === "string" && (value === "asc" || value === "desc");
}

function isValidColumnId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function computeInitialSortingState(
  params: ComputeInitialSortingStateParams
): SortingState {
  const {
    shouldPersist,
    target,
    columnKey,
    directionKey,
    urlBucket,
    localBucket,
    initialState,
  } = params;

  // Start with provided initial state or safe defaults
  const base: SortingState = initialState ?? [];

  // If persistence is disabled, return the base state
  if (!shouldPersist) {
    return base;
  }

  // Get the persisted values from the appropriate bucket
  const col = target === "url" ? urlBucket[columnKey] : localBucket[columnKey];
  const dir =
    target === "url" ? urlBucket[directionKey] : localBucket[directionKey];

  // Validate and use persisted values if both are valid
  if (isValidColumnId(col) && isValidSortingDirection(dir)) {
    const persistedState: SortingState = [{ id: col, desc: dir === "desc" }];

    // Return same reference if nothing changed (optimization)
    if (
      base.length === 1 &&
      base[0]?.id === col &&
      base[0]?.desc === (dir === "desc")
    ) {
      return base;
    }

    return persistedState;
  }

  // If persisted values are invalid or incomplete, fall back to initial state
  return base;
}
