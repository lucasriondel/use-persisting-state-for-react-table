import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { VisibilityState } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";

export function persistInitialColumnVisibility(
  shouldPersist: boolean,
  target: "url" | "localStorage" | undefined,
  key: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  urlBucketApi: UrlApiActions<Record<string, unknown>>,
  localBucketApi: LocalStorageApiActions<Record<string, unknown>>,
  initialColumnVisibility?: VisibilityState
): void {
  if (shouldPersist && initialColumnVisibility) {
    const raw = target === "url" ? urlBucket[key] : localBucket[key];
    if (!raw) {
      const patch = { [key]: initialColumnVisibility };
      if (target === "url") {
        urlBucketApi.patch(patch);
      } else {
        localBucketApi.patch(patch);
      }
    }
  }
}
