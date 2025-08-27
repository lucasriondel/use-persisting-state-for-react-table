import { PersistenceStorage } from "../types";

interface ComputeInitialGlobalFilterStateParams {
  shouldPersist: boolean;
  target: PersistenceStorage | undefined;
  key: string;
  urlBucket: Record<string, unknown>;
  localBucket: Record<string, unknown>;
  initialState?: string | undefined;
}

function isValidGlobalFilter(value: unknown): value is string {
  return typeof value === "string";
}

export function computeInitialGlobalFilterState(
  params: ComputeInitialGlobalFilterStateParams
): string {
  const { shouldPersist, target, key, urlBucket, localBucket, initialState } =
    params;

  // Start with provided initial state or safe defaults
  const base: string = initialState ?? "";

  // If persistence is disabled, return the base state
  if (!shouldPersist) {
    return base;
  }

  // Get the persisted value from the appropriate bucket
  const raw = target === "url" ? urlBucket[key] : localBucket[key];

  // Validate and use persisted value if valid
  if (isValidGlobalFilter(raw)) {
    // Return same reference if nothing changed (optimization)
    if (raw === base) {
      return base;
    }

    return raw;
  }

  // If persisted value is invalid, fall back to initial state
  return base;
}
