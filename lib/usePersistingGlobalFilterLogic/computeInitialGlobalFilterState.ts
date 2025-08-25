export function computeInitialGlobalFilterState(
  shouldPersist: boolean,
  target: "url" | "localStorage" | undefined,
  key: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  initialState?: string
): string | undefined {
  if (!shouldPersist) return initialState;
  const raw = target === "url" ? urlBucket[key] : localBucket[key];
  return typeof raw === "string" ? (raw as string) : initialState;
}
