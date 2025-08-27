import { VisibilityState } from "@tanstack/react-table";
import { PersistenceStorage } from "../types";

interface ComputeInitialColumnVisibilityStateParams {
  shouldPersist: boolean;
  target: PersistenceStorage | undefined;
  key: string;
  urlBucket: Record<string, unknown>;
  localBucket: Record<string, unknown>;
  initialState?: VisibilityState | undefined;
}

export function computeInitialColumnVisibilityState(
  params: ComputeInitialColumnVisibilityStateParams
): VisibilityState | undefined {
  const {
    shouldPersist,
    target,
    key,
    urlBucket,
    localBucket,
    initialState,
  } = params;

  // If not persisting, return initial state
  if (!shouldPersist) return initialState;

  // 1. Get values from the bucket if they exist
  const raw = target === "url" ? urlBucket[key] : localBucket[key];

  // 2. Validate them - for VisibilityState, it should be an object with boolean values or empty object
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const values = Object.values(raw);
    // Allow empty objects or objects with only boolean values
    const isValidVisibilityState = values.length === 0 || values.every(
      (value) => typeof value === "boolean"
    );
    
    if (isValidVisibilityState) {
      return raw as VisibilityState;
    }
  }

  // 3. If not valid, fallback to provided initial state
  return initialState;
}