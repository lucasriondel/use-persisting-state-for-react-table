import { ColumnDef, RowData } from "@tanstack/react-table";
import { Codec } from "use-url-state-reacthook";

// Column definition type for grouped columns
export type ColumnDefMaybeGroup<TData extends RowData> = ColumnDef<
  TData,
  unknown
> & {
  columns?: Array<ColumnDef<TData, unknown>>;
};

// Filter variant types
export type FilterVariant =
  | "select"
  | "multiSelect"
  | "text"
  | "date"
  | "number"
  | "dateRange"
  | "numberRange"
  | "boolean"
  | "custom";

// Persistence storage type
export type PersistenceStorage = "url" | "localStorage";

// Base filter meta interface
export interface BaseFilterMeta {
  isLoading?: boolean;
  persistenceStorage?: PersistenceStorage;
  variant: FilterVariant;
}

// Specific filter meta types

export type CustomFilterMeta = BaseFilterMeta & {
  variant: "custom";
  codec?: Codec<unknown>;
};

export type BooleanFilterMeta = BaseFilterMeta & {
  variant: "boolean";
  codec?: Codec<boolean>;
};

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

// Union type for all filter meta types
export type FiltersMeta =
  | CustomFilterMeta
  | BooleanFilterMeta
  | SelectMeta
  | MultiSelectMeta
  | TextMeta
  | DateMeta
  | NumberMeta
  | DateRangeMeta
  | NumberRangeMeta;

// Persistence configuration types
export interface PersistenceConfig {
  urlNamespace?: string;
  localStorageKey?: string;
  pagination?: {
    automaticPageReset?: boolean;
    pageIndex?: {
      persistenceStorage: PersistenceStorage; // default is url
      key?: string;
    };
    pageSize?: {
      persistenceStorage: PersistenceStorage; // default is url
      key?: string;
      /**
       * Array of allowed page size values for validation.
       * If a persisted value is not in this array, it will fallback to the first value.
       * @default [10, 20, 50]
       */
      allowedPageSizes?: number[];
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
}

// Table state type
export type TableState = {
  columnVisibility: Record<string, boolean>;
  columnFilters: Array<{ id: string; value: unknown }>;
  globalFilter: string;
  rowSelection: Record<string, boolean>;
  sorting: Array<{ id: string; desc: boolean }>;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
};

// Handlers type
export interface TableHandlers {
  onColumnFiltersChange: (updater: unknown) => void;
  onPaginationChange: (updater: unknown) => void;
  onSortingChange: (updater: unknown) => void;
  onColumnVisibilityChange: (updater: unknown) => void;
  onGlobalFilterChange: (value: string) => void;
  onRowSelectionChange: (updater: unknown) => void;
}

// Return type for the main hook
export interface UsePersistingStateReturn {
  initialState: TableState;
  handlers: TableHandlers;
  resetPagination: () => void;
}

// Export a utility type that can be used to extend ColumnMeta
export interface PersistingTableColumnMeta {
  filter?: BaseFilterMeta & FiltersMeta;
}

// Utility type for consumers to extend ColumnMeta while preserving existing extensions
export type ExtendColumnMeta<T = Record<string, unknown>> =
  PersistingTableColumnMeta & T;

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
  interface ColumnMeta<TData extends RowData, TValue>
    extends PersistingTableColumnMeta {
    // The filter property is defined in PersistingTableColumnMeta
    // Additional properties can be added by consumers using additional declare module statements
    [key: string]: unknown;
  }
}
