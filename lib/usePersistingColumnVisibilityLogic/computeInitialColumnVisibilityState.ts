import { VisibilityState } from "@tanstack/react-table";

export function computeInitialColumnVisibilityState(
  shouldPersist: boolean,
  target: "url" | "localStorage" | undefined,
  key: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  initialState?: VisibilityState
): VisibilityState | undefined {
  if (!shouldPersist) return initialState;
  const raw = target === "url" ? urlBucket[key] : localBucket[key];
  return (raw as VisibilityState) || initialState || undefined;
}