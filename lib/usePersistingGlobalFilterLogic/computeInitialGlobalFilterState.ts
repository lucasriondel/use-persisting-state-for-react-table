import { PersistenceStorage } from "../types";

export function computeInitialGlobalFilterState(
  shouldPersist: boolean,
  target: PersistenceStorage | undefined,
  key: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  initialState?: string
): string {
  if (!shouldPersist) return initialState ?? "";
  const raw = target === "url" ? urlBucket[key] : localBucket[key];
  return typeof raw === "string" ? raw : initialState ?? "";
}
