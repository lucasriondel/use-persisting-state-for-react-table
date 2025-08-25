import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { UrlApiActions } from "use-url-state-reacthook";
import { PersistenceStorage } from "../types";

export function persistInitialGlobalFilter(
  shouldPersist: boolean,
  target: PersistenceStorage | undefined,
  key: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  urlBucketApi: UrlApiActions<Record<string, unknown>>,
  localBucketApi: LocalStorageApiActions<Record<string, unknown>>,
  initialGlobalFilter?: string
): void {
  if (shouldPersist && initialGlobalFilter) {
    const raw = target === "url" ? urlBucket[key] : localBucket[key];
    if (!raw) {
      const patch = { [key]: initialGlobalFilter };
      if (target === "url") {
        urlBucketApi.patch(patch);
      } else {
        localBucketApi.patch(patch);
      }
    }
  }
}
