import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { SortingState, Updater } from "@tanstack/react-table";

export function createSortingChangeHandler(
  bucketApi: LocalStorageApiActions<Record<string, unknown>>,
  columnKey: string,
  directionKey: string
) {
  return (
    updater: Updater<SortingState>,
    currentTableState: SortingState
  ) => {
    // Use the current table state for comparison and updater execution
    const prev = currentTableState;
    const next =
      typeof updater === "function"
        ? updater(prev)
        : updater;

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
