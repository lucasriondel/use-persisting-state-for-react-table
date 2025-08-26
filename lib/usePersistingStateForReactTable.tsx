import {
  ColumnFiltersState,
  PaginationState,
  RowData,
  RowSelectionState,
  SortingState,
  TableOptions,
  VisibilityState,
} from "@tanstack/react-table";
import { useCallback, useState } from "react";
import { PersistenceStorage } from "./types";
import { useAsyncFiltersManager } from "./useAsyncFiltersManager";
import { useLocalStorageKeyValidation } from "./useLocalStorageKeyValidation";
import { usePersistingColumnVisibilityLogic } from "./usePersistingColumnVisibilityLogic";
import { usePersistingFiltersLogic } from "./usePersistingFiltersLogic";
import { usePersistingGlobalFilterLogic } from "./usePersistingGlobalFilterLogic";
import { usePersistingPaginationLogic } from "./usePersistingPaginationLogic";
import { usePersistingRowSelectionLogic } from "./usePersistingRowSelectionLogic";
import { usePersistingSortingLogic } from "./usePersistingSortingLogic";

export interface PersistingTableOptions<TData extends RowData>
  extends Pick<TableOptions<TData>, "columns"> {
  initialState?: TableOptions<TData>["state"];
  automaticPageReset?: boolean; // default is true
  persistence?: {
    urlNamespace?: string;
    localStorageKey?: string;
    pagination?: {
      pageIndex: {
        persistenceStorage: PersistenceStorage; // default is url
        key?: string;
      };
      pageSize: {
        persistenceStorage: PersistenceStorage; // default is url
        key?: string;
      };
    };
    sorting?: {
      persistenceStorage: PersistenceStorage; // default is url
      sortingColumnKey?: string; // default "sortingColumn"
      sortingDirectionKey?: string; // default "sortingDirection"
    };
    columnVisibility?: {
      persistenceStorage: PersistenceStorage; // default is localStorage
      key?: string;
    };
    globalFilter?: {
      persistenceStorage: PersistenceStorage; // default is url
      key?: string;
    };
    rowSelection?: {
      persistenceStorage: PersistenceStorage; // off by default
      key?: string;
    };
    filters?: {
      optimisticAsync?: boolean;
    };
  };
}

/**
 * A comprehensive React hook for managing persisted state in React Table applications.
 *
 * This hook provides automatic persistence of table state across page reloads and navigation,
 * supporting both URL parameters and localStorage for different state aspects. It handles
 * column filters, pagination, sorting, column visibility, global filtering, and row selection
 * with configurable persistence strategies.
 *
 * @template TData - The type of data that will be displayed in the table rows
 *
 * @param unvalidatedOptions - Configuration object for the persisting table behavior
 * @param unvalidatedOptions.columns - Array of column definitions for the table
 * @param unvalidatedOptions.initialState - Optional initial state values for various table features
 * @param unvalidatedOptions.initialState.columnVisibility - Initial visibility state for columns
 * @param unvalidatedOptions.initialState.columnFilters - Initial column filter values
 * @param unvalidatedOptions.initialState.globalFilter - Initial global filter value
 * @param unvalidatedOptions.initialState.rowSelection - Initial row selection state
 * @param unvalidatedOptions.initialState.sorting - Initial sorting configuration
 * @param unvalidatedOptions.initialState.pagination - Initial pagination state
 * @param unvalidatedOptions.persistence - Configuration for state persistence behavior
 * @param unvalidatedOptions.persistence.urlNamespace - Namespace for URL parameters to avoid conflicts
 * @param unvalidatedOptions.persistence.localStorageKey - Key for localStorage persistence (defaults to "data-table")
 * @param unvalidatedOptions.persistence.pagination - Pagination persistence configuration
 * @param unvalidatedOptions.persistence.pagination.pageIndex - Page index persistence settings
 * @param unvalidatedOptions.persistence.pagination.pageSize - Page size persistence settings
 * @param unvalidatedOptions.persistence.sorting - Sorting state persistence configuration
 * @param unvalidatedOptions.persistence.columnVisibility - Column visibility persistence configuration
 * @param unvalidatedOptions.persistence.globalFilter - Global filter persistence configuration
 * @param unvalidatedOptions.persistence.rowSelection - Row selection persistence configuration
 * @param unvalidatedOptions.persistence.filters - Column filters persistence configuration
 * @param unvalidatedOptions.persistence.filters.optimisticAsync - Enable optimistic updates for async filters
 *
 * @returns An object containing the initial state, event handlers, and utility functions
 * @returns returns.initialState - Complete initial state object for React Table
 * @returns returns.initialState.columnVisibility - Initial column visibility state
 * @returns returns.initialState.columnFilters - Initial column filters state
 * @returns returns.initialState.globalFilter - Initial global filter value
 * @returns returns.initialState.rowSelection - Initial row selection state
 * @returns returns.initialState.sorting - Initial sorting state
 * @returns returns.initialState.pagination - Initial pagination state
 * @returns returns.handlers - Event handlers for table state changes
 * @returns returns.handlers.onColumnFiltersChange - Handler for column filter changes
 * @returns returns.handlers.onPaginationChange - Handler for pagination changes
 * @returns returns.handlers.onSortingChange - Handler for sorting changes
 * @returns returns.handlers.onColumnVisibilityChange - Handler for column visibility changes
 * @returns returns.handlers.onGlobalFilterChange - Handler for global filter changes
 * @returns returns.handlers.onRowSelectionChange - Handler for row selection changes
 * @returns returns.resetPagination - Function to reset pagination to initial state
 *
 * @example
 * ```tsx
 * // Basic usage with URL persistence for most features
 * const tableConfig = usePersistingStateForReactTable({
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
 *   columns: tableConfig.columns,
 *   state: tableConfig.initialState,
 *   onColumnFiltersChange: tableConfig.handlers.onColumnFiltersChange,
 *   onPaginationChange: tableConfig.handlers.onPaginationChange,
 *   onSortingChange: tableConfig.handlers.onSortingChange,
 *   onColumnVisibilityChange: tableConfig.handlers.onColumnVisibilityChange,
 *   onGlobalFilterChange: tableConfig.handlers.onGlobalFilterChange,
 *   onRowSelectionChange: tableConfig.handlers.onRowSelectionChange,
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
 * const tableConfig = usePersistingStateForReactTable({
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
 * const tableConfig = usePersistingStateForReactTable({
 *   columns,
 *   persistence: {
 *     localStorageKey: 'users-table-config'
 *   }
 * });
 * ```
 *
 * @since 1.0.0
 *
 * @see {@link https://tanstack.com/table/latest} React Table Documentation
 * @see {@link PersistingTableOptions} for detailed option descriptions
 * @see {@link FilterVariant} for available filter types
 */
export function usePersistingStateForReactTable<TData extends RowData>(
  unvalidatedOptions: PersistingTableOptions<TData>
) {
  const options = useLocalStorageKeyValidation(unvalidatedOptions);
  const { handleColumnFiltersChange, initialColumnFiltersState } =
    usePersistingFiltersLogic(options);

  const {
    handlePaginationChange,
    initialPaginationState,
    resetPagination: resetPaginationLogic,
  } = usePersistingPaginationLogic(options);

  const { handleSortingChange, initialSortingState } =
    usePersistingSortingLogic(options);

  const { handleColumnVisibilityChange, initialColumnVisibilityState } =
    usePersistingColumnVisibilityLogic(options);

  const { handleGlobalFilterChange, initialGlobalFilterState } =
    usePersistingGlobalFilterLogic(options);

  const { handleRowSelectionChange, initialRowSelectionState } =
    usePersistingRowSelectionLogic(options);

  const [pagination, setPaginationState] = useState(initialPaginationState);
  const [sorting, setSortingState] = useState(
    initialSortingState || options.initialState?.sorting || []
  );
  const [columnFilters, setColumnFiltersState] = useState(
    initialColumnFiltersState || options.initialState?.columnFilters || []
  );
  const [columnVisibility, setColumnVisibilityState] = useState(
    initialColumnVisibilityState || options.initialState?.columnVisibility || {}
  );
  const [globalFilter, setGlobalFilterState] = useState(
    initialGlobalFilterState
  );
  const [rowSelection, setRowSelectionState] = useState(
    initialRowSelectionState || options.initialState?.rowSelection || {}
  );

  const resetPagination = useCallback(() => {
    resetPaginationLogic(pagination, setPaginationState);
  }, [pagination, setPaginationState]);

  const setPagination = useCallback((updater: PaginationState) => {
    handlePaginationChange?.(updater, pagination);
    setPaginationState(updater);
  }, []);

  const setSorting = useCallback((updater: SortingState) => {
    handleSortingChange?.(updater, sorting);
    setSortingState(updater);
  }, []);

  const setColumnFilters = useCallback(
    (updater: ColumnFiltersState) => {
      handleColumnFiltersChange?.(updater, columnFilters);
      setColumnFiltersState(updater);
      if (options.automaticPageReset) {
        resetPagination();
      }
    },
    [options.automaticPageReset, resetPagination]
  );

  const setColumnVisibility = useCallback((updater: VisibilityState) => {
    handleColumnVisibilityChange?.(updater, columnVisibility);
    setColumnVisibilityState(updater);
  }, []);

  const setGlobalFilter = useCallback(
    (updater: string) => {
      handleGlobalFilterChange?.(updater, globalFilter);
      setGlobalFilterState(updater);
      if (options.automaticPageReset) {
        resetPagination();
      }
    },
    [options.automaticPageReset, resetPagination]
  );

  const setRowSelection = useCallback((updater: RowSelectionState) => {
    handleRowSelectionChange?.(updater, rowSelection);
    setRowSelectionState(updater);
  }, []);

  useAsyncFiltersManager({
    columns: options.columns,
    urlNamespace: options.persistence?.urlNamespace,
    localStorageKey: options.persistence?.localStorageKey,
    setColumnFilters: setColumnFiltersState,
  });

  return {
    pagination,
    setPagination,

    sorting,
    setSorting,

    columnFilters,
    setColumnFilters,

    columnVisibility,
    setColumnVisibility,

    globalFilter,
    setGlobalFilter,

    rowSelection,
    setRowSelection,

    resetPagination,
  };
}
