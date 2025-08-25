import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { RowSelectionState, Updater } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";

export function createRowSelectionChangeHandler(
  key: string,
  bucketApi:
    | LocalStorageApiActions<Record<string, unknown>>
    | UrlApiActions<Record<string, unknown>>
) {
  return (
    updater: Updater<RowSelectionState>,
    currentTableState: RowSelectionState
  ) => {
    // Use the current table state for comparison and updater execution
    const prev = currentTableState;
    const next =
      typeof updater === "function"
        ? (updater as (old: RowSelectionState) => RowSelectionState)(prev)
        : (updater as RowSelectionState);

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
