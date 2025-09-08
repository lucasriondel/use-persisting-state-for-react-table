import {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table";

// State interface for the reducer
export interface TableState {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  globalFilter: string;
  rowSelection: RowSelectionState;
}

// Action types
export type TableAction =
  | { type: "SET_PAGINATION"; updater: Updater<PaginationState> }
  | { type: "SET_SORTING"; updater: Updater<SortingState> }
  | { type: "SET_COLUMN_FILTERS"; updater: Updater<ColumnFiltersState> }
  | { type: "SET_COLUMN_VISIBILITY"; updater: Updater<VisibilityState> }
  | { type: "SET_GLOBAL_FILTER"; updater: string }
  | { type: "SET_ROW_SELECTION"; updater: Updater<RowSelectionState> }
  | { type: "RESET_PAGINATION" };

// Helper function to apply updater (handles both direct values and functions)
function applyUpdater<T>(updater: Updater<T>, currentValue: T): T {
  return typeof updater === "function"
    ? (updater as (old: T) => T)(currentValue)
    : updater;
}

// Reducer function
export function tableStateReducer(
  state: TableState,
  action: TableAction
): TableState {
  switch (action.type) {
    case "SET_PAGINATION":
      return {
        ...state,
        pagination: applyUpdater(action.updater, state.pagination),
      };

    case "SET_SORTING":
      return {
        ...state,
        sorting: applyUpdater(action.updater, state.sorting),
      };

    case "SET_COLUMN_FILTERS":
      return {
        ...state,
        columnFilters: applyUpdater(action.updater, state.columnFilters),
      };

    case "SET_COLUMN_VISIBILITY":
      return {
        ...state,
        columnVisibility: applyUpdater(action.updater, state.columnVisibility),
      };

    case "SET_GLOBAL_FILTER":
      return {
        ...state,
        globalFilter: action.updater,
      };

    case "SET_ROW_SELECTION":
      return {
        ...state,
        rowSelection: applyUpdater(action.updater, state.rowSelection),
      };

    case "RESET_PAGINATION":
      return {
        ...state,
        pagination: {
          ...state.pagination, // Keep current pagination settings (like pageSize)
          pageIndex: 0, // Reset only pageIndex to first page
        },
      };

    default:
      return state;
  }
}
