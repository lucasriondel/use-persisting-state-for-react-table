import { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import { Updater } from "@tanstack/react-table";
import { UrlApiActions } from "use-url-state-reacthook";

export function createGlobalFilterChangeHandler(
  key: string,
  bucketApi:
    | LocalStorageApiActions<Record<string, unknown>>
    | UrlApiActions<Record<string, unknown>>
) {
  return (updater: Updater<string>, currentTableState?: string) => {
    const prev = currentTableState;

    if (
      (prev === null || prev === undefined) &&
      typeof updater === "function"
    ) {
      throw new Error(
        "Cannot use updater function when currentTableState is undefined"
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const next = typeof updater === "function" ? updater(prev!) : updater;

    // If the value is empty, remove the key from the bucket
    // If the value has content, update the bucket
    if (!next) {
      bucketApi.remove(key);
    } else {
      bucketApi.patch({ [key]: next });
    }
  };
}
