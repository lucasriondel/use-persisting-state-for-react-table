import { ColumnFiltersState, RowData } from "@tanstack/react-table";
import { useEffect } from "react";
import { getColumnIdentifier } from "./getColumnIdentifier";
import { MultiSelectMeta, PersistingTableOptions, SelectMeta } from "./types";
import { flattenColumns } from "./usePersistingFiltersLogic/flattenColumns";
import { sanitizeValue } from "./usePersistingFiltersLogic/sanitizeValues";
import { useFilterBuckets } from "./usePersistingFiltersLogic/useFilterBuckets";

interface UseAsyncFiltersManagerProps<TData extends RowData>
  extends PersistingTableOptions<TData> {
  setColumnFilters: React.Dispatch<
    React.SetStateAction<ColumnFiltersState | undefined>
  >;
}

export function useAsyncFiltersManager<TData extends RowData>({
  columns,
  persistence,
  setColumnFilters,
}: UseAsyncFiltersManagerProps<TData>) {
  const { urlBucket, urlBucketApi, localBucket, localBucketApi } =
    useFilterBuckets({
      columns,
      urlNamespace: persistence?.urlNamespace,
      localStorageKey: persistence?.localStorageKey,
    });

  useEffect(() => {
    if (!columns || columns.length === 0) return;

    const flat = flattenColumns(columns);
    const urlPatch: Record<string, unknown> = {};
    const localPatch: Record<string, unknown> = {};
    let hasAnyPatch = false;

    for (const col of flat) {
      const filterMeta = col.meta?.filter;

      if (!filterMeta?.persistenceStorage) continue;

      if (
        (filterMeta.variant === "select" ||
          filterMeta.variant === "multiSelect") &&
        (filterMeta as SelectMeta | MultiSelectMeta).isLoading === false
      ) {
        // Use the filter key if available, otherwise try to get column identifier
        let key: string | undefined = filterMeta.key;

        if (!key) {
          try {
            key = getColumnIdentifier(col);
          } catch {
            continue;
          }
        }

        if (!key) continue;

        const raw =
          filterMeta.persistenceStorage === "url"
            ? urlBucket[key]
            : localBucket[key];
        const sanitized = sanitizeValue(filterMeta, raw);
        const targetPatch =
          filterMeta.persistenceStorage === "url" ? urlPatch : localPatch;
        const equal = JSON.stringify(sanitized) === JSON.stringify(raw);

        if (!equal) {
          targetPatch[key] = sanitized === undefined ? undefined : sanitized;
          hasAnyPatch = true;
        }
      }
    }

    if (!hasAnyPatch) return;

    // Update the state with the new filter values
    const stateUpdates: ColumnFiltersState = [];

    // Process URL patches
    if (Object.keys(urlPatch).length > 0) {
      urlBucketApi.patch(urlPatch);

      // Convert URL patches to ColumnFiltersState format
      for (const [key, value] of Object.entries(urlPatch)) {
        if (value !== undefined) {
          stateUpdates.push({ id: key, value });
        } else {
          // undefined means remove this filter from state
          stateUpdates.push({ id: key, value: undefined });
        }
      }
    }

    // Process local storage patches
    if (Object.keys(localPatch).length > 0) {
      localBucketApi.patch(localPatch);

      // Convert local storage patches to ColumnFiltersState format
      for (const [key, value] of Object.entries(localPatch)) {
        if (value !== undefined) {
          stateUpdates.push({ id: key, value });
        } else {
          // undefined means remove this filter from state
          stateUpdates.push({ id: key, value: undefined });
        }
      }
    }

    // Update the column filters state if we have any updates
    if (stateUpdates.length > 0) {
      setColumnFilters((prevFilters) => {
        // Handle case where prevFilters might be undefined
        const currentFilters = prevFilters || [];
        // Remove existing filters that are being updated
        const filtered = currentFilters.filter(
          (filter) => !stateUpdates.some((update) => update.id === filter.id)
        );
        // Add the new filter values, filtering out undefined values (removals)
        const newFilters = stateUpdates.filter(
          (update) => update.value !== undefined
        );
        return [...filtered, ...newFilters];
      });
    }
  }, [columns, urlBucket, localBucket, urlBucketApi, localBucketApi]);
}
