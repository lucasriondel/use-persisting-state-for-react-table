import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { SortingState } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";
import { PersistenceStorage } from "../types";

export function persistInitialSorting(
  shouldPersist: boolean,
  target: PersistenceStorage | undefined,
  columnKey: string,
  directionKey: string,
  urlBucket: Record<string, unknown>,
  localBucket: Record<string, unknown>,
  urlBucketApi: UrlApiActions<Record<string, unknown>>,
  localBucketApi: LocalStorageApiActions<Record<string, unknown>>,
  initialSorting?: SortingState
): void {
  if (shouldPersist && initialSorting && initialSorting.length > 0) {
    const col = (
      target === "url" ? urlBucket[columnKey] : localBucket[columnKey]
    ) as string | undefined;
    const dir = (
      target === "url" ? urlBucket[directionKey] : localBucket[directionKey]
    ) as string | undefined;

    if (!col || !dir) {
      const firstSort = initialSorting[0];
      if (firstSort) {
        const patch = {
          [columnKey]: firstSort.id,
          [directionKey]: firstSort.desc ? "desc" : "asc",
        };
        if (target === "url") {
          urlBucketApi.patch(patch);
        } else {
          localBucketApi.patch(patch);
        }
      }
    }
  }
}
