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
        persistenceStorage: PersistenceStorage;
        key?: string;
      };
      pageSize: {
        persistenceStorage: PersistenceStorage;
        key?: string;
      };
    };
    sorting?: {
      persistenceStorage: PersistenceStorage;
      sortingColumnKey?: string; // default "sortingColumn"
      sortingDirectionKey?: string; // default "sortingDirection"
    };
    columnVisibility?: {
      persistenceStorage: PersistenceStorage; // default is localStorage
      key?: string;
    };
    globalFilter?: {
      persistenceStorage: PersistenceStorage;
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
 * @param options.initialState.columnVisibility - Initial visibility state for columns
 * @param options.initialState.columnFilters - Initial column filter values
 * @param options.initialState.globalFilter - Initial global filter value
 * @param options.initialState.rowSelection - Initial row selection state
 * @param options.initialState.sorting - Initial sorting configuration
 * @param options.initialState.pagination - Initial pagination state
 * @param options.persistence - Configuration for state persistence behavior
 * @param options.persistence.urlNamespace - Namespace for URL parameters to avoid conflicts
 * @param options.persistence.localStorageKey - Key for localStorage persistence (defaults to "data-table")
 * @param options.persistence.pagination - Pagination persistence configuration
 * @param options.persistence.pagination.pageIndex - Page index persistence settings
 * @param options.persistence.pagination.pageSize - Page size persistence settings
 * @param options.persistence.sorting - Sorting state persistence configuration
 * @param options.persistence.columnVisibility - Column visibility persistence configuration
 * @param options.persistence.globalFilter - Global filter persistence configuration
 * @param options.persistence.rowSelection - Row selection persistence configuration
 * @param options.persistence.filters - Column filters persistence configuration
 * @param options.persistence.filters.optimisticAsync - Enable optimistic updates for async filters
 *
 * @returns An object containing current state values, their setters, and utility functions
 * @returns returns.pagination - Current pagination state
 * @returns returns.setPagination - Setter function for pagination state with automatic persistence
 * @returns returns.sorting - Current sorting state
 * @returns returns.setSorting - Setter function for sorting state with automatic persistence
 * @returns returns.columnFilters - Current column filters state
 * @returns returns.setColumnFilters - Setter function for column filters state with automatic persistence and optional page reset
 * @returns returns.columnVisibility - Current column visibility state
 * @returns returns.setColumnVisibility - Setter function for column visibility state with automatic persistence
 * @returns returns.globalFilter - Current global filter state
 * @returns returns.setGlobalFilter - Setter function for global filter state with automatic persistence and optional page reset
 * @returns returns.rowSelection - Current row selection state
 * @returns returns.setRowSelection - Setter function for row selection state with automatic persistence
 * @returns returns.resetPagination - Function to reset pagination to initial state
 *
 * @example
 * ```tsx
 * // Basic usage with URL persistence for most features
 * const {
 *   pagination,
 *   setPagination,
 *   sorting,
 *   setSorting,
 *   columnFilters,
 *   setColumnFilters,
 *   columnVisibility,
 *   setColumnVisibility,
 *   globalFilter,
 *   setGlobalFilter,
 *   rowSelection,
 *   setRowSelection,
 *   resetPagination
 * } = usePersistingStateForReactTable({
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
 *   state: {
 *     pagination,
 *     sorting,
 *     columnFilters,
 *     columnVisibility,
 *     globalFilter,
 *     rowSelection,
 *   },
 *   onPaginationChange: setPagination,
 *   onSortingChange: setSorting,
 *   onColumnFiltersChange: setColumnFilters,
 *   onColumnVisibilityChange: setColumnVisibility,
 *   onGlobalFilterChange: setGlobalFilter,
 *   onRowSelectionChange: setRowSelection,
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
 * const tableState = usePersistingStateForReactTable({
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
 * // Use tableState.pagination, tableState.setPagination, etc.
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
 * const {
 *   columnFilters,
 *   setColumnFilters,
 *   resetPagination
 * } = usePersistingStateForReactTable({
 *   columns,
 *   persistence: {
 *     localStorageKey: 'users-table-config'
 *   }
 * });
 *
 * // Manually trigger page reset when needed
 * const handleFilterChange = (filters: ColumnFiltersState) => {
 *   setColumnFilters(filters);
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

  const {
    handlePaginationChange,
    initialPaginationState,
    resetPagination: resetPaginationLogic,
  } = usePersistingPaginationLogic(validOptions);

  const { handleSortingChange, initialSortingState } =
    usePersistingSortingLogic(validOptions);

  const { handleColumnVisibilityChange, initialColumnVisibilityState } =
    usePersistingColumnVisibilityLogic(validOptions);

  const { handleGlobalFilterChange, initialGlobalFilterState } =
    usePersistingGlobalFilterLogic(validOptions);

  const { handleRowSelectionChange, initialRowSelectionState } =
    usePersistingRowSelectionLogic(validOptions);

  const [pagination, setPaginationState] = useState(initialPaginationState);
  const [sorting, setSortingState] = useState(
    initialSortingState || validOptions.initialState?.sorting || []
  );
  const [columnFilters, setColumnFiltersState] = useState(
    initialColumnFiltersState || validOptions.initialState?.columnFilters || []
  );
  const [columnVisibility, setColumnVisibilityState] = useState(
    initialColumnVisibilityState ||
      validOptions.initialState?.columnVisibility ||
      {}
  );
  const [globalFilter, setGlobalFilterState] = useState(
    initialGlobalFilterState
  );
  const [rowSelection, setRowSelectionState] = useState(
    initialRowSelectionState || validOptions.initialState?.rowSelection || {}
  );

  const resetPagination = useCallback(() => {
    resetPaginationLogic(pagination, setPaginationState);
  }, [pagination, setPaginationState]);

  const setPagination = useCallback(
    (updater: Updater<PaginationState>) => {
      handlePaginationChange?.(updater, pagination);
      setPaginationState(updater);
    },
    [pagination, handlePaginationChange]
  );

  const setSorting = useCallback(
    (updater: Updater<SortingState>) => {
      handleSortingChange?.(updater, sorting);
      setSortingState(updater);
    },
    [sorting, handleSortingChange]
  );

  const setColumnFilters = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      handleColumnFiltersChange?.(updater, columnFilters);
      setColumnFiltersState(updater);
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
      setColumnVisibilityState(updater);
    },
    []
  );

  const setGlobalFilter = useCallback(
    (updater: string) => {
      handleGlobalFilterChange?.(updater, globalFilter);
      setGlobalFilterState(updater);
      if (automaticPageReset) {
        resetPagination();
      }
    },
    [automaticPageReset, resetPagination]
  );

  const setRowSelection = useCallback((updater: Updater<RowSelectionState>) => {
    handleRowSelectionChange?.(updater, rowSelection);
    setRowSelectionState(updater);
  }, []);

  useAsyncFiltersManager({
    columns: validOptions.columns,
    urlNamespace: validOptions.persistence?.urlNamespace,
    localStorageKey: validOptions.persistence?.localStorageKey,
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
