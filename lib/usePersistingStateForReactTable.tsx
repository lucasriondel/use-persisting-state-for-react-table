import {
  ColumnFiltersState,
  PaginationState,
  RowData,
  RowSelectionState,
  SortingState,
  TableOptions,
  Updater,
  VisibilityState,
} from "@tanstack/react-table";
import { useCallback, useReducer } from "react";
import { TableState, tableStateReducer } from "./tableStateReducer";
import { PersistenceConfig } from "./types";
import { useAsyncFiltersManager } from "./useAsyncFiltersManager";
import { useLocalStorageKeyValidation } from "./useLocalStorageKeyValidation";
import { usePersistingColumnVisibilityLogic } from "./usePersistingColumnVisibilityLogic";
import { usePersistingFiltersLogic } from "./usePersistingFiltersLogic";
import { usePersistingGlobalFilterLogic } from "./usePersistingGlobalFilterLogic";
import { usePersistingPaginationLogic } from "./usePersistingPaginationLogic";
import { usePersistingRowSelectionLogic } from "./usePersistingRowSelectionLogic";
import { usePersistingSortingLogic } from "./usePersistingSortingLogic";

export type PersistingTableOptions<TData extends RowData> = Pick<
  TableOptions<TData>,
  "columns"
> & {
  initialState?: TableOptions<TData>["state"];
  automaticPageReset?: boolean; // default is true
  persistence?: PersistenceConfig;
};

/**
 * A comprehensive React hook for managing persisted state in React Table applications.
 *
 * This hook provides automatic persistence of table state across page reloads and navigation,
 * supporting both URL parameters and localStorage for different state aspects. It manages
 * column filters, pagination, sorting, column visibility, global filtering, and row selection
 * with configurable persistence strategies, directly handling state internally and providing
 * both current state values and their corresponding setter functions.
 *
 * @template TData - The type of data that will be displayed in the table rows
 *
 * @param options - Configuration object for the persisting table behavior
 * @param options.columns - Array of column definitions for the table
 * @param options.automaticPageReset - Whether to automatically reset pagination when filters change (defaults to true)
 * @param options.initialState - Optional initial state values for various table features
 * @param options.initialState.columnVisibility - Initial visibility state for columns as Record<string, boolean>
 * @param options.initialState.columnFilters - Initial column filter values as Array<{id: string, value: unknown}>
 * @param options.initialState.globalFilter - Initial global filter value as string
 * @param options.initialState.rowSelection - Initial row selection state as Record<string, boolean>
 * @param options.initialState.sorting - Initial sorting configuration as Array<{id: string, desc: boolean}>
 * @param options.initialState.pagination - Initial pagination state as {pageIndex: number, pageSize: number}
 * @param options.persistence - Configuration for state persistence behavior
 * @param options.persistence.urlNamespace - Namespace prefix for URL parameters to avoid conflicts with other hooks
 * @param options.persistence.localStorageKey - Key for localStorage persistence (defaults to "data-table")
 * @param options.persistence.pagination - Pagination persistence configuration
 * @param options.persistence.pagination.pageIndex - Page index persistence settings
 * @param options.persistence.pagination.pageIndex.persistenceStorage - Where to persist page index ("url" | "localStorage")
 * @param options.persistence.pagination.pageIndex.key - Key name for page index persistence (defaults to "pageIndex")
 * @param options.persistence.pagination.pageSize - Page size persistence settings
 * @param options.persistence.pagination.pageSize.persistenceStorage - Where to persist page size ("url" | "localStorage")
 * @param options.persistence.pagination.pageSize.key - Key name for page size persistence (defaults to "pageSize")
 * @param options.persistence.sorting - Sorting state persistence configuration
 * @param options.persistence.sorting.persistenceStorage - Where to persist sorting state ("url" | "localStorage")
 * @param options.persistence.sorting.sortingColumnKey - Key name for sorted column ID (defaults to "sortingColumn")
 * @param options.persistence.sorting.sortingDirectionKey - Key name for sort direction (defaults to "sortingDirection")
 * @param options.persistence.columnVisibility - Column visibility persistence configuration
 * @param options.persistence.columnVisibility.persistenceStorage - Where to persist column visibility ("url" | "localStorage")
 * @param options.persistence.columnVisibility.key - Key name for column visibility (defaults to "columnVisibility")
 * @param options.persistence.globalFilter - Global filter persistence configuration
 * @param options.persistence.globalFilter.persistenceStorage - Where to persist global filter ("url" | "localStorage")
 * @param options.persistence.globalFilter.key - Key name for global filter (defaults to "globalFilter")
 * @param options.persistence.rowSelection - Row selection persistence configuration
 * @param options.persistence.rowSelection.persistenceStorage - Where to persist row selection ("url" | "localStorage")
 * @param options.persistence.rowSelection.key - Key name for row selection (defaults to "rowSelection")
 * @param options.persistence.filters - Column filters persistence configuration
 * @param options.persistence.filters.optimisticAsync - Enable optimistic updates for async filter validation (defaults to false)
 *
 * @returns An object containing the table state, handlers for React Table integration, and utility functions
 * @returns returns.state - Object containing all current table state values
 * @returns returns.state.pagination - Current pagination state
 * @returns returns.state.sorting - Current sorting state
 * @returns returns.state.columnFilters - Current column filters state
 * @returns returns.state.columnVisibility - Current column visibility state
 * @returns returns.state.globalFilter - Current global filter state
 * @returns returns.state.rowSelection - Current row selection state
 * @returns returns.handlers - Object containing handler functions for React Table integration
 * @returns returns.handlers.onPaginationChange - Handler for pagination changes with automatic persistence
 * @returns returns.handlers.onSortingChange - Handler for sorting changes with automatic persistence
 * @returns returns.handlers.onColumnFiltersChange - Handler for column filter changes with automatic persistence and optional page reset
 * @returns returns.handlers.onColumnVisibilityChange - Handler for column visibility changes with automatic persistence
 * @returns returns.handlers.onGlobalFilterChange - Handler for global filter changes with automatic persistence and optional page reset
 * @returns returns.handlers.onRowSelectionChange - Handler for row selection changes with automatic persistence
 * @returns returns.resetPagination - Function to reset pagination to first page while preserving page size
 *
 * @example
 * ```tsx
 * // Basic usage with URL persistence for most features
 * const { state, handlers, resetPagination } = usePersistingStateForReactTable({
 *   columns: columnDefinitions,
 *   persistence: {
 *     urlNamespace: 'users-table',
 *     pagination: {
 *       pageIndex: { persistenceStorage: 'url', key: 'page' },
 *       pageSize: { persistenceStorage: 'url', key: 'size' }
 *     },
 *     sorting: { persistenceStorage: 'url' },
 *     globalFilter: { persistenceStorage: 'url', key: 'search' }
 *   }
 * });
 *
 * const table = useReactTable({
 *   data,
 *   columns: columnDefinitions,
 *   state,
 *   ...handlers,
 *   getCoreRowModel: getCoreRowModel(),
 *   getFilteredRowModel: getFilteredRowModel(),
 *   getPaginationRowModel: getPaginationRowModel(),
 *   getSortedRowModel: getSortedRowModel(),
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Mixed persistence - some in localStorage, some in URL
 * const { state, handlers, resetPagination } = usePersistingStateForReactTable({
 *   columns: columnDefinitions,
 *   persistence: {
 *     localStorageKey: 'my-app-table-settings',
 *     columnVisibility: { persistenceStorage: 'localStorage' },
 *     pagination: {
 *       pageIndex: { persistenceStorage: 'url' },
 *       pageSize: { persistenceStorage: 'localStorage' }
 *     },
 *     sorting: { persistenceStorage: 'url' },
 *     globalFilter: { persistenceStorage: 'url' }
 *   }
 * });
 *
 * // Access state: state.pagination, state.sorting, etc.
 * // Access handlers: handlers.onPaginationChange, handlers.onSortingChange, etc.
 * ```
 *
 * @example
 * ```tsx
 * // With custom column filters that have persistence settings
 * const columns: ColumnDef<User>[] = [
 *   {
 *     id: 'status',
 *     accessorKey: 'status',
 *     meta: {
 *       filter: {
 *         variant: 'select',
 *         persistenceStorage: 'localStorage',
 *         key: 'user-status',
 *         options: [
 *           { value: 'active', label: 'Active' },
 *           { value: 'inactive', label: 'Inactive' }
 *         ]
 *       }
 *     }
 *   }
 * ];
 *
 * const { state, handlers, resetPagination } = usePersistingStateForReactTable({
 *   columns,
 *   persistence: {
 *     localStorageKey: 'users-table-config'
 *   }
 * });
 *
 * // Manually trigger page reset when needed
 * const handleFilterChange = (filters: ColumnFiltersState) => {
 *   handlers.onColumnFiltersChange(filters);
 *   // Page reset happens automatically if automaticPageReset is true (default)
 * };
 * ```
 *
 * @since 1.0.0
 *
 * @see {@link https://tanstack.com/table/latest} React Table Documentation
 * @see {@link PersistingTableOptions} for detailed option descriptions
 * @see {@link FilterVariant} for available filter types
 */
export function usePersistingStateForReactTable<TData extends RowData>(
  options: PersistingTableOptions<TData>
) {
  const validOptions = useLocalStorageKeyValidation(options);

  const automaticPageReset = validOptions.automaticPageReset ?? true;

  const { handleColumnFiltersChange, initialColumnFiltersState } =
    usePersistingFiltersLogic(validOptions);

  const { handlePaginationChange, initialPaginationState } =
    usePersistingPaginationLogic(validOptions);

  const { handleSortingChange, initialSortingState } =
    usePersistingSortingLogic(validOptions);

  const { handleColumnVisibilityChange, initialColumnVisibilityState } =
    usePersistingColumnVisibilityLogic(validOptions);

  const { handleGlobalFilterChange, initialGlobalFilterState } =
    usePersistingGlobalFilterLogic(validOptions);

  const { handleRowSelectionChange, initialRowSelectionState } =
    usePersistingRowSelectionLogic(validOptions);

  // Initialize the state for the reducer
  const initialState: TableState = {
    pagination: initialPaginationState,
    sorting: initialSortingState || validOptions.initialState?.sorting || [],
    columnFilters:
      initialColumnFiltersState ||
      validOptions.initialState?.columnFilters ||
      [],
    columnVisibility:
      initialColumnVisibilityState ||
      validOptions.initialState?.columnVisibility ||
      {},
    globalFilter: initialGlobalFilterState,
    rowSelection:
      initialRowSelectionState || validOptions.initialState?.rowSelection || {},
  };

  const [state, dispatch] = useReducer(tableStateReducer, initialState);

  const {
    pagination,
    sorting,
    columnFilters,
    columnVisibility,
    globalFilter,
    rowSelection,
  } = state;

  const resetPagination = useCallback(() => {
    dispatch({ type: "RESET_PAGINATION" });
    const resetPaginationState = {
      pageIndex: 0,
      pageSize: pagination.pageSize,
    };
    handlePaginationChange?.(resetPaginationState, pagination);
  }, [pagination, handlePaginationChange]);

  const setPagination = useCallback(
    (updater: Updater<PaginationState>) => {
      handlePaginationChange?.(updater, pagination);
      dispatch({ type: "SET_PAGINATION", updater });
    },
    [pagination, handlePaginationChange]
  );

  const setSorting = useCallback(
    (updater: Updater<SortingState>) => {
      handleSortingChange?.(updater, sorting);
      dispatch({ type: "SET_SORTING", updater });
    },
    [sorting, handleSortingChange]
  );

  const setColumnFilters = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      handleColumnFiltersChange?.(updater, columnFilters);
      dispatch({ type: "SET_COLUMN_FILTERS", updater });
      if (automaticPageReset) {
        resetPagination();
      }
    },
    [
      columnFilters,
      handleColumnFiltersChange,
      automaticPageReset,
      resetPagination,
    ]
  );

  const setColumnVisibility = useCallback(
    (updater: Updater<VisibilityState>) => {
      handleColumnVisibilityChange?.(updater, columnVisibility);
      dispatch({ type: "SET_COLUMN_VISIBILITY", updater });
    },
    [columnVisibility, handleColumnVisibilityChange]
  );

  const setGlobalFilter = useCallback(
    (updater: string) => {
      handleGlobalFilterChange?.(updater, globalFilter);
      dispatch({ type: "SET_GLOBAL_FILTER", updater });
      if (automaticPageReset) {
        resetPagination();
      }
    },
    [
      globalFilter,
      handleGlobalFilterChange,
      automaticPageReset,
      resetPagination,
    ]
  );

  const setRowSelection = useCallback(
    (updater: Updater<RowSelectionState>) => {
      handleRowSelectionChange?.(updater, rowSelection);
      dispatch({ type: "SET_ROW_SELECTION", updater });
    },
    [rowSelection, handleRowSelectionChange]
  );

  useAsyncFiltersManager({
    columns: validOptions.columns,
    urlNamespace: validOptions.persistence?.urlNamespace,
    localStorageKey: validOptions.persistence?.localStorageKey,
    setColumnFilters: (updater) =>
      dispatch({ type: "SET_COLUMN_FILTERS", updater }),
  });

  return {
    state,
    handlers: {
      onPaginationChange: setPagination,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onGlobalFilterChange: setGlobalFilter,
      onRowSelectionChange: setRowSelection,
    },
    resetPagination,
  };
}
