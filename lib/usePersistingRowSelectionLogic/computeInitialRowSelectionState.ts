import { RowSelectionState } from "@tanstack/react-table";
import { PersistenceStorage } from "../types";

export function computeInitialRowSelectionState(
  shouldPersist: boolean,
  target: PersistenceStorage | undefined,
  key: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  initialState?: RowSelectionState
): RowSelectionState | undefined {
  if (!shouldPersist) return initialState;
  const raw = target === "url" ? urlBucket[key] : localBucket[key];
  return (raw as RowSelectionState) || initialState || undefined;
}
