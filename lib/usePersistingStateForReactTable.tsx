import { RowData, TableOptions } from "@tanstack/react-table";
import { Codec } from "use-url-state-reacthook";
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
    isLoading: boolean;
    persistenceStorage?: "url" | "localStorage";
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
        persistenceStorage: "url" | "localStorage"; // default is url
        key?: string;
      };
      pageSize: {
        persistenceStorage: "url" | "localStorage"; // default is url
        key?: string;
      };
    };
    sorting?: {
      persistenceStorage: "url" | "localStorage"; // default is url
      sortingColumnKey?: string; // default "sortingColumn"
      sortingDirectionKey?: string; // default "sortingDirection"
    };
    columnVisibility?: {
      persistenceStorage: "url" | "localStorage"; // default is localStorage
      key?: string;
    };
    globalFilter?: {
      persistenceStorage: "url" | "localStorage"; // default is url
      key?: string;
    };
    rowSelection?: {
      persistenceStorage: "url" | "localStorage"; // off by default
      key?: string;
    };
    filters?: {
      optimisticAsync?: boolean;
    };
  };
}

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
