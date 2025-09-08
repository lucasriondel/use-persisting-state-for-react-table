import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { SortingState, Updater } from "@tanstack/react-table";

export function createSortingChangeHandler(
  bucketApi: LocalStorageApiActions<Record<string, unknown>>,
  columnKey: string,
  directionKey: string
) {
  return (updater: Updater<SortingState>, currentTableState?: SortingState) => {
    const prev = currentTableState;

    if (!prev && typeof updater === "function") {
      throw new Error(
        "Cannot use updater function when currentTableState is undefined"
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const next = typeof updater === "function" ? updater(prev!) : updater;

    const first = next[0];
    if (first) {
      bucketApi.patch({
        [columnKey]: first.id,
        [directionKey]: first.desc ? "desc" : "asc",
      });
    } else {
      bucketApi.remove(columnKey, directionKey);
    }
  };
}
