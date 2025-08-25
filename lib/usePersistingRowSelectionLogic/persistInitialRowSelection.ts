import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { RowSelectionState } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";

export function persistInitialRowSelection(
  shouldPersist: boolean,
  target: "url" | "localStorage" | undefined,
  key: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  urlBucketApi: UrlApiActions<Record<string, unknown>>,
  localBucketApi: LocalStorageApiActions<Record<string, unknown>>,
  initialRowSelection?: RowSelectionState
): void {
  if (shouldPersist && initialRowSelection) {
    const raw = target === "url" ? urlBucket[key] : localBucket[key];
    if (!raw) {
      const patch = { [key]: initialRowSelection };
      if (target === "url") {
        urlBucketApi.patch(patch);
      } else {
        localBucketApi.patch(patch);
      }
    }
  }
}
