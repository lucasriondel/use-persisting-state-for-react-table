import { SortingState } from "@tanstack/react-table";
import { PersistenceStorage } from "../types";

export function computeInitialSortingState(
  shouldPersist: boolean,
  target: PersistenceStorage | undefined,
  columnKey: string,
  directionKey: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  initialState?: SortingState
): SortingState | undefined {
  if (!shouldPersist) return initialState;
  const col = (
    target === "url" ? urlBucket[columnKey] : localBucket[columnKey]
  ) as string | undefined;
  const dir = (
    target === "url" ? urlBucket[directionKey] : localBucket[directionKey]
  ) as string | undefined;
  return col && dir ? [{ id: col, desc: dir === "desc" }] : initialState;
}
