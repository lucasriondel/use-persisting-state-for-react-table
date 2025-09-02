import { ColumnDef, ColumnFiltersState, RowData } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { getColumnIdentifier } from "./getColumnIdentifier";
import { MultiSelectMeta, SelectMeta } from "./types";
import { flattenColumns } from "./usePersistingFiltersLogic/flattenColumns";
import { sanitizeValue } from "./usePersistingFiltersLogic/sanitizeValues";
import { SharedBuckets } from "./usePersistingStateForReactTable";

/**
 * Props for the useAsyncFiltersManager hook.
 *
 * @template TData - The type of data in your table rows
 */
interface UseAsyncFiltersManagerProps<TData extends RowData> {
  columns: ColumnDef<TData, unknown>[];
  sharedBuckets: SharedBuckets;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  currentColumnFilters: ColumnFiltersState;
}

/**
 * A React hook that manages async filter validation and cleanup for persisted table state.
 *
 * This hook automatically validates persisted filter values against their current valid options
 * when async data loading completes. It removes invalid filter values from both the persisted
 * state (URL/localStorage) and the table's column filters state.
 *
 * **Use Case:** When you have select/multiSelect filters that load their options asynchronously,
 * and users might have bookmarked URLs or have localStorage entries with filter values that
 * are no longer valid (e.g., a role filter with `role=admin` but the API no longer returns
 * "admin" as a valid option).
 *
 * **How it works:**
 * 1. Monitors select/multiSelect filters with `isLoading: false`
 * 2. Compares persisted values against current valid options
 * 3. Sanitizes invalid values (removes non-existent options)
 * 4. Updates both persisted storage and table state when differences are found
 *
 * @template TData - The type of data in your table rows
 *
 * @param options - Configuration options extending PersistingTableOptions
 * @param options.columns - Column definitions with filter metadata
 * @param options.persistence - Persistence configuration (URL namespace, localStorage key)
 * @param options.currentColumnFilters - Current column filters state for comparison
 * @param options.setColumnFilters - React state setter for updating column filters
 *
 * @example
 * ```tsx
 * // In your table component
 * const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
 *
 * // Use the async filters manager
 * useAsyncFiltersManager({
 *   columns,
 *   persistence: {
 *     urlNamespace: 'table',
 *     localStorageKey: 'user-table-filters'
 *   },
 *   setColumnFilters
 * });
 *
 * // Column definition with async filter
 * const columns: ColumnDef<User>[] = [
 *   {
 *     id: 'role',
 *     accessorKey: 'role',
 *     meta: {
 *       filter: {
 *         variant: 'multiSelect',
 *         persistenceStorage: 'url',
 *         key: 'role',
 *         isLoading: false, // Set to false when options are loaded
 *         options: [
 *           { value: 'user', label: 'User' },
 *           { value: 'moderator', label: 'Moderator' }
 *           // Note: 'admin' option removed - will be cleaned up automatically
 *         ]
 *       }
 *     }
 *   }
 * ];
 * ```
 *
 * @example
 * ```tsx
 * // Handling async option loading
 * const [roleOptions, setRoleOptions] = useState([]);
 * const [isLoadingRoles, setIsLoadingRoles] = useState(true);
 *
 * useEffect(() => {
 *   fetchRoles().then(roles => {
 *     setRoleOptions(roles);
 *     setIsLoadingRoles(false); // This triggers validation
 *   });
 * }, []);
 *
 * const columns: ColumnDef<User>[] = [
 *   {
 *     meta: {
 *       filter: {
 *         variant: 'select',
 *         persistenceStorage: 'url',
 *         isLoading: isLoadingRoles, // Important: hook only runs when false
 *         options: roleOptions
 *       }
 *     }
 *   }
 * ];
 * ```
 *
 * @see {@link PersistingTableOptions} for persistence configuration options
 * @see {@link SelectMeta} and {@link MultiSelectMeta} for filter metadata types
 */
export function useAsyncFiltersManager<TData extends RowData>({
  columns,
  sharedBuckets,
  setColumnFilters,
  currentColumnFilters,
}: UseAsyncFiltersManagerProps<TData>) {
  const { urlBucket, urlBucketApi, localBucket, localBucketApi } = sharedBuckets;

  const hasColumnsFinishedLoading =
    columns?.every((col) => (col.meta?.filter?.isLoading ?? false) === false) ??
    true;

  const [
    hasFinishedProcessingAsyncFilters,
    setHasFinishedProcessingAsyncFilters,
  ] = useState(false);

  useEffect(() => {
    if (!columns || columns.length === 0) return;
    if (!hasColumnsFinishedLoading) return;

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

        // Check if values need to be synced from buckets to state
        const currentStateFilter = currentColumnFilters.find(
          (f) => f.id === key
        );
        const stateValue = currentStateFilter?.value;
        const stateValueStr = JSON.stringify(stateValue);
        const sanitizedStr = JSON.stringify(sanitized);

        const needsStateSync =
          !equal || (sanitized !== undefined && stateValueStr !== sanitizedStr);

        if (needsStateSync) {
          targetPatch[key] = sanitized === undefined ? undefined : sanitized;
          hasAnyPatch = true;
        }
      }
    }

    if (!hasAnyPatch) {
      setHasFinishedProcessingAsyncFilters(true);
      return;
    }

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
    setHasFinishedProcessingAsyncFilters(true);
  }, [hasColumnsFinishedLoading]);

  return hasFinishedProcessingAsyncFilters;
}
