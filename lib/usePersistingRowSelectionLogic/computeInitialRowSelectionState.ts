import { RowSelectionState } from "@tanstack/react-table";
import { PersistenceStorage } from "../types";

interface ComputeInitialRowSelectionStateParams {
  shouldPersist: boolean;
  target: PersistenceStorage | undefined;
  key: string;
  urlBucket: Record<string, unknown>;
  localBucket: Record<string, unknown>;
  initialState?: RowSelectionState | undefined;
}

function isValidRowSelectionState(value: unknown): value is RowSelectionState {
  // RowSelectionState is Record<string, boolean>, so validate it's an object with boolean values
  if (!value || typeof value !== "object") return false;

  const obj = value as Record<string, unknown>;
  return Object.values(obj).every((v) => typeof v === "boolean");
}

export function computeInitialRowSelectionState(
  params: ComputeInitialRowSelectionStateParams
): RowSelectionState {
  const { shouldPersist, target, key, urlBucket, localBucket, initialState } =
    params;

  // Start with provided initial state or safe defaults
  const base: RowSelectionState = initialState ?? {};

  // If persistence is disabled, return the base state
  if (!shouldPersist) {
    return base;
  }

  // Get the persisted value from the appropriate bucket
  const raw = target === "url" ? urlBucket[key] : localBucket[key];

  // Validate and use persisted value if valid
  if (isValidRowSelectionState(raw)) {
    // Return same reference if nothing changed (optimization)
    const persistedState = raw;
    if (
      Object.keys(base).length === 0 &&
      Object.keys(persistedState).length === 0
    ) {
      return base;
    }

    // Check if states are equivalent
    const baseKeys = Object.keys(base);
    const persistedKeys = Object.keys(persistedState);

    if (
      baseKeys.length === persistedKeys.length &&
      baseKeys.every((k) => base[k] === persistedState[k])
    ) {
      return base;
    }

    return persistedState;
  }

  // If persisted value is invalid, fall back to initial state
  return base;
}
