import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { RowSelectionState, Updater } from "@tanstack/react-table";

export function createRowSelectionChangeHandler(
  key: string,
  bucketApi: LocalStorageApiActions<Record<string, unknown>>
) {
  return (
    updater: Updater<RowSelectionState>,
    currentTableState?: RowSelectionState
  ) => {
    // Use the current table state for comparison and updater execution
    const prev = currentTableState;

    if (!prev && typeof updater === "function") {
      throw new Error(
        "Cannot use updater function when currentTableState is undefined"
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const next = typeof updater === "function" ? updater(prev!) : updater;

    // Filter out false values to only keep selected rows
    const selectedOnly = Object.fromEntries(
      Object.entries(next).filter(([, isSelected]) => isSelected === true)
    );

    // For now, just use a simple approach - you can enhance this later
    if (Object.keys(selectedOnly).length > 0) {
      bucketApi.patch({ [key]: selectedOnly });
    } else {
      bucketApi.remove(key);
    }
  };
}
