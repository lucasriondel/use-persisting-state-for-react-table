import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { Updater, VisibilityState } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";

export function createColumnVisibilityChangeHandler(
  bucketApi:
    | LocalStorageApiActions<Record<string, unknown>>
    | UrlApiActions<Record<string, unknown>>,
  key: string
) {
  return (
    updater: Updater<VisibilityState>,
    currentTableState: VisibilityState
  ) => {
    // Use the current table state for comparison and updater execution
    const prev = currentTableState;
    const next =
      typeof updater === "function"
        ? (updater as (old: VisibilityState) => VisibilityState)(prev)
        : updater;

    // For now, just use a simple approach - you can enhance this later
    bucketApi.patch({ [key]: next });
  };
}
