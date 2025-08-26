import { RowData, TableOptions } from "@tanstack/react-table";
import { Codec } from "use-url-state-reacthook";
import { PersistenceStorage } from "./types";
import { useAsyncFiltersManager } from "./useAsyncFiltersManager";
import { useLocalStorageKeyValidation } from "./useLocalStorageKeyValidation";
import { usePersistingColumnVisibilityLogic } from "./usePersistingColumnVisibilityLogic";
import { usePersistingFiltersLogic } from "./usePersistingFiltersLogic";
import { usePersistingGlobalFilterLogic } from "./usePersistingGlobalFilterLogic";
import { usePersistingPaginationLogic } from "./usePersistingPaginationLogic";
import { usePersistingRowSelectionLogic } from "./usePersistingRowSelectionLogic";
import { usePersistingSortingLogic } from "./usePersistingSortingLogic";

export type FilterVariant =
  | "select"
  | "multiSelect"
  | "text"
  | "date"
  | "number"
  | "dateRange"
  | "numberRange";

declare module "@tanstack/react-table" {
  interface BaseFilterMeta {
    key?: string;
    isLoading?: boolean;
    persistenceStorage?: PersistenceStorage;
    variant: FilterVariant;
  }

  type FiltersMeta =
    | SelectMeta
    | MultiSelectMeta
    | TextMeta
    | DateMeta
    | NumberMeta
    | DateRangeMeta
    | NumberRangeMeta;

  export type SelectMeta = BaseFilterMeta & {
    variant: "select";
    codec?: Codec<string>;
    options: {
      value: string;
      label: string;
      disabled?: boolean;
      count?: number;
    }[];
  };
  export type MultiSelectMeta = BaseFilterMeta & {
    variant: "multiSelect";
    codec?: Codec<string[]>;
    options: {
      value: string;
      label: string;
      disabled?: boolean;
      count?: number;
    }[];
  };
  export type TextMeta = BaseFilterMeta & {
    variant: "text";
    codec?: Codec<string>;
  };
  export type DateMeta = BaseFilterMeta & {
    variant: "date";
    codec?: Codec<Date | null>;
    // DayPicker navigation/selection constraints
    defaultMonth?: Date; // initial visible month
    startMonth?: Date; // earliest navigable month
    endMonth?: Date; // latest navigable month
    fromDate?: Date; // earliest selectable date
    toDate?: Date; // latest selectable date
    disabled?: unknown; // DayPicker matcher type - can be customized when needed
    captionLayout?: "label" | "dropdown";
  };
  export type DateRangeMeta = BaseFilterMeta & {
    variant: "dateRange";
    codec?: Codec<[Date | null, Date | null]>;
    // DayPicker navigation/selection constraints
    defaultMonth?: Date; // initial visible month
    startMonth?: Date; // earliest navigable month
    endMonth?: Date; // latest navigable month
    fromDate?: Date; // earliest selectable date
    toDate?: Date; // latest selectable date
    disabled?: unknown; // DayPicker matcher type - can be customized when needed
    // Range length constraints in days; mapped to DayPicker's min/max when mode="range"
    rangeMinDays?: number;
    rangeMaxDays?: number;
    captionLayout?: "label" | "dropdown";
  };
  export type NumberMeta = BaseFilterMeta & {
    variant: "number";
    codec?: Codec<number>;
  };
  export type NumberRangeMeta = BaseFilterMeta & {
    variant: "numberRange";
    min?: number;
    max?: number;
    step?: number;
    orientation?: "horizontal" | "vertical";
    minStepsBetweenThumbs?: number;
    disabled?: boolean;
    codec?: Codec<[number, number]>;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filter?: BaseFilterMeta & FiltersMeta;
  }
}

export interface PersistingTableOptions<TData extends RowData>
  extends Pick<TableOptions<TData>, "columns"> {
  initialState?: TableOptions<TData>["state"];
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

  const { handlePaginationChange, initialPaginationState, resetPagination } =
    usePersistingPaginationLogic(options);

  const { handleSortingChange, initialSortingState } =
    usePersistingSortingLogic(options);

  const { handleColumnVisibilityChange, initialColumnVisibilityState } =
    usePersistingColumnVisibilityLogic(options);

  const { handleGlobalFilterChange, initialGlobalFilterState } =
    usePersistingGlobalFilterLogic(options);

  const { handleRowSelectionChange, initialRowSelectionState } =
    usePersistingRowSelectionLogic(options);

  type TableState = NonNullable<TableOptions<TData>["state"]>;
  const initialState: TableState = {
    columnVisibility:
      initialColumnVisibilityState ||
      options.initialState?.columnVisibility ||
      {},
    columnFilters:
      initialColumnFiltersState || options.initialState?.columnFilters || [],
    globalFilter: initialGlobalFilterState,
    rowSelection:
      initialRowSelectionState || options.initialState?.rowSelection || {},
    sorting: initialSortingState || options.initialState?.sorting || [],
    pagination: initialPaginationState,
  };

  useAsyncFiltersManager({
    columns: options.columns,
    urlNamespace: options.persistence?.urlNamespace,
    localStorageKey: options.persistence?.localStorageKey,
    setColumnFilters: () => {},
  });

  return {
    initialState,
    handlers: {
      onColumnFiltersChange: handleColumnFiltersChange,
      onPaginationChange: handlePaginationChange,
      onSortingChange: handleSortingChange,
      onColumnVisibilityChange: handleColumnVisibilityChange,
      onGlobalFilterChange: handleGlobalFilterChange,
      onRowSelectionChange: handleRowSelectionChange,
    },
    resetPagination,
  };
}
