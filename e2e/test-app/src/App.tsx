import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ColumnFilter,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useMemo } from "react";
import { usePersistingStateForReactTable } from "../../../lib/index";
import { Person, PersonsRequest, fetchPersons } from "./api";

// TanStack Query options factory for fetching persons
const personsQueryOptions = (request: PersonsRequest) => ({
  queryKey: ["persons", request] as const,
  queryFn: () => fetchPersons(request),
  placeholderData: keepPreviousData,
});

const columnHelper = createColumnHelper<Person>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("firstName", {
    header: "First Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("lastName", {
    header: "Last Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("age", {
    header: "Age",
    cell: (info) => info.getValue(),
    filterFn: (row, columnId, filterValue) => {
      const age = row.getValue(columnId);
      return age === filterValue;
    },
    meta: {
      filter: {
        variant: "number" as const,
        persistenceStorage: "url" as const,
        key: "age-filter",
      },
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => info.getValue(),
    filterFn: (row, columnId, filterValue) => {
      const status = row.getValue(columnId);
      return status === filterValue;
    },
    meta: {
      filter: {
        variant: "select" as const,
        persistenceStorage: "url" as const,
        key: "status-filter",
        options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
      },
    },
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("birthdate", {
    header: "Birth Date",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    filterFn: (row, columnId, filterValue) => {
      const birthdate = new Date(row.getValue(columnId));
      const filterDate = new Date(filterValue);
      return birthdate.toDateString() === filterDate.toDateString();
    },
    meta: {
      filter: {
        variant: "date" as const,
        persistenceStorage: "url" as const,
        key: "birthdate-filter",
      },
    },
  }),
  columnHelper.accessor("hiringDate", {
    header: "Hiring Date",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    // filterFn: (row, columnId, filterValue) => {
    //   const hiringDate = new Date(row.getValue(columnId));

    //   // Handle both array format [from, to] and object format {from, to}
    //   let from: string | undefined;
    //   let to: string | undefined;

    //   if (Array.isArray(filterValue)) {
    //     [from, to] = filterValue;
    //     // Convert empty string placeholders back to undefined
    //     if (from === "") from = undefined;
    //     if (to === "") to = undefined;

    //     // Return true (no filtering) if both values are placeholders
    //     if (from === undefined && to === undefined) {
    //       return true;
    //     }
    //   } else if (filterValue && typeof filterValue === 'object') {
    //     const obj = filterValue as { from?: string; to?: string };
    //     from = obj.from;
    //     to = obj.to;
    //   }

    //   if (from && to) {
    //     const fromDate = new Date(from);
    //     const toDate = new Date(to);
    //     return hiringDate >= fromDate && hiringDate <= toDate;
    //   } else if (from) {
    //     const fromDate = new Date(from);
    //     return hiringDate >= fromDate;
    //   } else if (to) {
    //     const toDate = new Date(to);
    //     return hiringDate <= toDate;
    //   }
    //   return true;
    // },
    meta: {
      filter: {
        variant: "dateRange" as const,
        persistenceStorage: "url" as const,
        key: "hiring-date-filter",
      },
    },
  }),
  columnHelper.accessor("salary", {
    header: "Salary",
    cell: (info) => `$${info.getValue().toLocaleString()}`,
    filterFn: (row, columnId, filterValue) => {
      const salary = row.getValue(columnId) as number;

      // Handle both array format and object format
      let min: number | undefined;
      let max: number | undefined;

      if (Array.isArray(filterValue)) {
        // Always use [min, max] order
        min = filterValue[0];
        max = filterValue[1];
        
        // Convert -1 placeholders to undefined
        if (min === -1) min = undefined;
        if (max === -1) max = undefined;

        // Return true (no filtering) if no valid values
        if (min === undefined && max === undefined) {
          return true;
        }
      } else if (filterValue && typeof filterValue === "object") {
        const obj = filterValue as { min?: number; max?: number };
        min = obj.min;
        max = obj.max;
      }

      if (min !== undefined && max !== undefined) {
        return salary >= min && salary <= max;
      } else if (min !== undefined) {
        return salary >= min;
      } else if (max !== undefined) {
        return salary <= max;
      }
      return true;
    },
    meta: {
      filter: {
        variant: "numberRange" as const,
        persistenceStorage: "url" as const,
        key: "salary-filter",
      },
    },
  }),
  columnHelper.accessor("teams", {
    header: "Teams",
    cell: (info) => info.getValue().join(", "),
    filterFn: (row, columnId, filterValue) => {
      const teams = row.getValue(columnId) as string[];
      const selectedTeams = filterValue as string[];
      return selectedTeams.some((team) => teams.includes(team));
    },
    meta: {
      filter: {
        variant: "multiSelect" as const,
        persistenceStorage: "url" as const,
        key: "teams-filter",
        options: [
          { value: "finance", label: "Finance" },
          { value: "sales", label: "Sales" },
          { value: "hr", label: "HR" },
          { value: "dev", label: "Development" },
        ],
      },
    },
  }),
];

function App() {
  const {
    state,
    handlers,
    resetPagination,
    hasFinishedProcessingAsyncFilters,
  } = usePersistingStateForReactTable({
    columns,
    automaticPageReset: true,
    persistence: {
      urlNamespace: "test-table",
      localStorageKey: "e2e-test-table",
      pagination: {
        pageIndex: { persistenceStorage: "url", key: "page" },
        pageSize: { persistenceStorage: "localStorage", key: "size" },
      },
      sorting: {
        persistenceStorage: "url",
        sortingColumnKey: "sort-col",
        sortingDirectionKey: "sort-dir",
      },
      columnVisibility: {
        persistenceStorage: "localStorage",
        key: "visibility",
      },
      globalFilter: {
        persistenceStorage: "url",
        key: "search",
      },
      rowSelection: {
        persistenceStorage: "localStorage",
        key: "selection",
      },
      filters: {
        optimisticAsync: true,
      },
    },
  });

  // Build API request from current state
  const apiRequest: PersonsRequest = useMemo(() => {
    return {
      pagination: state.pagination,
      sorting: state.sorting,
      filters: state.columnFilters,
      globalFilter: state.globalFilter,
    };
  }, [state]);

  // Fetch data using React Query
  const {
    data: apiResponse,
    isLoading,
    isFetching,
  } = useQuery({
    ...personsQueryOptions(apiRequest),
    enabled: hasFinishedProcessingAsyncFilters,
  });

  const table = useReactTable({
    data: apiResponse?.data || [],
    columns,
    state,
    pageCount: apiResponse?.pageCount ?? 0,
    ...handlers,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    // Use actual person ID for row identification to ensure proper selection persistence across pages
    getRowId: (row) => row.id.toString(),
  });

  return (
    <div
      data-testid="app"
      style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}
    >
      <h1>E2E Test App - usePersistingStateForReactTable</h1>

      {/* Loading indicators */}
      {!hasFinishedProcessingAsyncFilters && (
        <div
          data-testid="loading-filters"
          style={{
            background: "#fff3cd",
            padding: "10px",
            marginBottom: "20px",
          }}
        >
          Processing async filters...
        </div>
      )}

      {(isLoading || isFetching) && (
        <div
          data-testid="loading-data"
          style={{
            background: "#d1ecf1",
            padding: "10px",
            marginBottom: "20px",
          }}
        >
          {isLoading ? "Loading data..." : "Refreshing data..."}
        </div>
      )}

      {/* Controls */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="global-filter">Global Search: </label>
          <input
            id="global-filter"
            data-testid="global-filter"
            value={state.globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder="Search..."
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="page-size">Page Size: </label>
          <select
            id="page-size"
            data-testid="page-size"
            value={state.pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <button
            data-testid="reset-pagination"
            onClick={resetPagination}
            style={{ padding: "5px 10px", marginRight: "10px" }}
          >
            Reset Pagination
          </button>

          <button
            data-testid="clear-selection"
            onClick={() => table.toggleAllRowsSelected(false)}
            style={{ padding: "5px 10px", marginRight: "10px" }}
          >
            Clear Selection
          </button>

          <button
            data-testid="toggle-email-column"
            onClick={() =>
              table.setColumnVisibility((prev) => ({
                ...prev,
                email: !(prev.email ?? true),
              }))
            }
            style={{ padding: "5px 10px" }}
          >
            Toggle Email Column
          </button>
        </div>

        <div
          data-testid="current-state"
          style={{
            fontSize: "12px",
            background: "#f8f9fa",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <strong>Current State:</strong>
          <br />
          Page: {state.pagination.pageIndex + 1} of {table.getPageCount()}
          <br />
          Page Size: {state.pagination.pageSize}
          <br />
          Total Rows: {apiResponse?.rowCount || 0}
          <br />
          Current Page Rows: {apiResponse?.data?.length || 0}
          <br />
          Selected Rows: {Object.keys(state.rowSelection).length}
          <br />
          Global Filter: {state.globalFilter || "None"}
          <br />
          Column Filters: {state.columnFilters.length}
          {state.columnFilters.length > 0 && (
            <>
              <br />
              Column Filters: {JSON.stringify(state.columnFilters, null, 2)}
            </>
          )}
          <br />
          Sorting:{" "}
          {state.sorting.length > 0
            ? `${state.sorting[0].id} (${
                state.sorting[0].desc ? "desc" : "asc"
              })`
            : "None"}
          <br />
          <strong>API Status:</strong>{" "}
          {isLoading ? "Loading" : isFetching ? "Refreshing" : "Ready"}
        </div>
      </div>

      {/* Column Filters */}
      <div style={{ marginBottom: "20px" }}>
        <strong>Column Filters:</strong>
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginTop: "10px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <label htmlFor="age-filter">Age: </label>
            <input
              id="age-filter"
              data-testid="age-filter"
              type="number"
              value={
                (state.columnFilters.find((f: ColumnFilter) => f.id === "age")
                  ?.value as number) || ""
              }
              onChange={(e) => {
                const value = e.target.value
                  ? Number(e.target.value)
                  : undefined;
                table.setColumnFilters((prev) =>
                  prev
                    .filter((f) => f.id !== "age")
                    .concat(value !== undefined ? [{ id: "age", value }] : [])
                );
              }}
              style={{ padding: "5px", width: "80px" }}
            />
          </div>

          <div>
            <label htmlFor="status-filter">Status: </label>
            <select
              id="status-filter"
              data-testid="status-filter"
              value={
                (state.columnFilters.find(
                  (f: ColumnFilter) => f.id === "status"
                )?.value as string) || ""
              }
              onChange={(e) => {
                const value = e.target.value || undefined;
                table.setColumnFilters((prev) =>
                  prev
                    .filter((f) => f.id !== "status")
                    .concat(value ? [{ id: "status", value }] : [])
                );
              }}
              style={{ padding: "5px" }}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label htmlFor="birthdate-filter">Birth Date: </label>
            <input
              id="birthdate-filter"
              data-testid="birthdate-filter"
              type="date"
              value={(() => {
                const filterValue = state.columnFilters.find(
                  (f: ColumnFilter) => f.id === "birthdate"
                )?.value;
                if (!filterValue) return "";

                // Convert to YYYY-MM-DD format for HTML date input
                const date = new Date(filterValue as string);
                if (isNaN(date.getTime())) return "";

                return date.toISOString().split("T")[0];
              })()}
              onChange={(e) => {
                const value = e.target.value || undefined;
                table.setColumnFilters((prev) =>
                  prev
                    .filter((f) => f.id !== "birthdate")
                    .concat(value ? [{ id: "birthdate", value }] : [])
                );
              }}
              style={{ padding: "5px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label>Hiring Date Range:</label>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                id="hiring-date-from-filter"
                data-testid="hiring-date-from-filter"
                type="date"
                placeholder="From"
                value={(() => {
                  const filterValue = state.columnFilters.find(
                    (f: ColumnFilter) => f.id === "hiringDate"
                  )?.value;

                  if (!filterValue) return "";

                  let fromValue: string | undefined;

                  // Handle both array format [from, to] and object format {from, to}
                  if (Array.isArray(filterValue)) {
                    fromValue = filterValue[0];
                  } else if (
                    typeof filterValue === "object" &&
                    filterValue !== null
                  ) {
                    fromValue = (filterValue as { from?: string; to?: string })
                      .from;
                  }

                  if (!fromValue || fromValue === "") return "";

                  // Convert to YYYY-MM-DD format for HTML date input
                  const date = new Date(fromValue);
                  if (isNaN(date.getTime())) return "";

                  return date.toISOString().split("T")[0];
                })()}
                onChange={(e) => {
                  const currentFilter = state.columnFilters.find(
                    (f: ColumnFilter) => f.id === "hiringDate"
                  )?.value;

                  // Get current values from both array and object formats
                  let currentFrom: string | undefined;
                  let currentTo: string | undefined;

                  if (Array.isArray(currentFilter)) {
                    [currentFrom, currentTo] = currentFilter;
                    // Convert empty string placeholders back to undefined
                    if (currentFrom === "") currentFrom = undefined;
                    if (currentTo === "") currentTo = undefined;
                  } else if (
                    currentFilter &&
                    typeof currentFilter === "object"
                  ) {
                    const obj = currentFilter as { from?: string; to?: string };
                    currentFrom = obj.from;
                    currentTo = obj.to;
                  }

                  const newFrom = e.target.value || undefined;

                  // Only apply filter if at least one value is provided
                  if (newFrom !== undefined || currentTo !== undefined) {
                    // Store values in array format, using empty string as placeholder for undefined
                    const fromVal = newFrom !== undefined ? newFrom : "";
                    const toVal = currentTo !== undefined ? currentTo : "";
                    table.setColumnFilters((prev) =>
                      prev
                        .filter((f) => f.id !== "hiringDate")
                        .concat([{ id: "hiringDate", value: [fromVal, toVal] }])
                    );
                  } else {
                    // Remove filter if both values are undefined
                    table.setColumnFilters((prev) =>
                      prev.filter((f) => f.id !== "hiringDate")
                    );
                  }
                }}
                style={{ padding: "5px", fontSize: "12px" }}
              />
              <input
                id="hiring-date-to-filter"
                data-testid="hiring-date-to-filter"
                type="date"
                placeholder="To"
                value={(() => {
                  const filterValue = state.columnFilters.find(
                    (f: ColumnFilter) => f.id === "hiringDate"
                  )?.value;

                  if (!filterValue) return "";

                  let toValue: string | undefined;

                  // Handle both array format [from, to] and object format {from, to}
                  if (Array.isArray(filterValue)) {
                    toValue = filterValue[1];
                  } else if (
                    typeof filterValue === "object" &&
                    filterValue !== null
                  ) {
                    toValue = (filterValue as { from?: string; to?: string })
                      .to;
                  }

                  if (!toValue || toValue === "") return "";

                  // Convert to YYYY-MM-DD format for HTML date input
                  const date = new Date(toValue);
                  if (isNaN(date.getTime())) return "";

                  return date.toISOString().split("T")[0];
                })()}
                onChange={(e) => {
                  const currentFilter = state.columnFilters.find(
                    (f: ColumnFilter) => f.id === "hiringDate"
                  )?.value;

                  // Get current values from both array and object formats
                  let currentFrom: string | undefined;
                  let currentTo: string | undefined;

                  if (Array.isArray(currentFilter)) {
                    [currentFrom, currentTo] = currentFilter;
                    // Convert empty string placeholders back to undefined
                    if (currentFrom === "") currentFrom = undefined;
                    if (currentTo === "") currentTo = undefined;
                  } else if (
                    currentFilter &&
                    typeof currentFilter === "object"
                  ) {
                    const obj = currentFilter as { from?: string; to?: string };
                    currentFrom = obj.from;
                    currentTo = obj.to;
                  }

                  const newTo = e.target.value || undefined;

                  // Only apply filter if at least one value is provided
                  if (currentFrom !== undefined || newTo !== undefined) {
                    // Store values in array format, using empty string as placeholder for undefined
                    const fromVal =
                      currentFrom !== undefined ? currentFrom : "";
                    const toVal = newTo !== undefined ? newTo : "";
                    table.setColumnFilters((prev) =>
                      prev
                        .filter((f) => f.id !== "hiringDate")
                        .concat([{ id: "hiringDate", value: [fromVal, toVal] }])
                    );
                  } else {
                    // Remove filter if both values are undefined
                    table.setColumnFilters((prev) =>
                      prev.filter((f) => f.id !== "hiringDate")
                    );
                  }
                }}
                style={{ padding: "5px", fontSize: "12px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label>Salary Range:</label>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                id="salary-min-filter"
                data-testid="salary-min-filter"
                type="number"
                placeholder="Min"
                value={(() => {
                  const filterValue = state.columnFilters.find(
                    (f: ColumnFilter) => f.id === "salary"
                  )?.value;

                  if (!filterValue) return "";

                  let minValue: number | undefined;

                  // Handle both array format and object format
                  if (Array.isArray(filterValue)) {
                    // Always use [min, max] order
                    minValue = filterValue[0];
                    // Convert -1 placeholders to undefined
                    if (minValue === -1) minValue = undefined;
                  } else if (
                    typeof filterValue === "object" &&
                    filterValue !== null
                  ) {
                    minValue = (filterValue as { min?: number; max?: number })
                      .min;
                  }

                  if (minValue === undefined || minValue === null || minValue === -1)
                    return "";

                  // Convert to string, handling both number and string types
                  return String(minValue);
                })()}
                onChange={(e) => {
                  const currentFilter = state.columnFilters.find(
                    (f: ColumnFilter) => f.id === "salary"
                  )?.value;

                  // Get current values from both array and object formats
                  let currentMin: number | undefined;
                  let currentMax: number | undefined;

                  if (Array.isArray(currentFilter)) {
                    // Always use [min, max] order
                    currentMin = currentFilter[0];
                    currentMax = currentFilter[1];
                    // Convert -1 placeholders to undefined
                    if (currentMin === -1) currentMin = undefined;
                    if (currentMax === -1) currentMax = undefined;
                  } else if (
                    currentFilter &&
                    typeof currentFilter === "object"
                  ) {
                    const obj = currentFilter as { min?: number; max?: number };
                    currentMin = obj.min;
                    currentMax = obj.max;
                  }

                  const newMin = e.target.value
                    ? Number(e.target.value)
                    : undefined;

                  // Always store as [min, max] order
                  if (newMin !== undefined || currentMax !== undefined) {
                    const minVal = newMin !== undefined ? newMin : -1;
                    const maxVal = currentMax !== undefined ? currentMax : -1;
                    table.setColumnFilters((prev) =>
                      prev
                        .filter((f) => f.id !== "salary")
                        .concat([{ id: "salary", value: [minVal, maxVal] }])
                    );
                  } else {
                    // Remove filter if both values are undefined
                    table.setColumnFilters((prev) =>
                      prev.filter((f) => f.id !== "salary")
                    );
                  }
                }}
                style={{ padding: "5px", width: "80px", fontSize: "12px" }}
              />
              <input
                id="salary-max-filter"
                data-testid="salary-max-filter"
                type="number"
                placeholder="Max"
                value={(() => {
                  const filterValue = state.columnFilters.find(
                    (f: ColumnFilter) => f.id === "salary"
                  )?.value;

                  if (!filterValue) return "";

                  let maxValue: number | undefined;

                  // Handle both array format and object format
                  if (Array.isArray(filterValue)) {
                    // Always use [min, max] order
                    maxValue = filterValue[1];
                    // Convert -1 placeholders to undefined
                    if (maxValue === -1) maxValue = undefined;
                  } else if (
                    typeof filterValue === "object" &&
                    filterValue !== null
                  ) {
                    maxValue = (filterValue as { min?: number; max?: number })
                      .max;
                  }

                  if (maxValue === undefined || maxValue === null || maxValue === -1)
                    return "";

                  // Convert to string, handling both number and string types
                  return String(maxValue);
                })()}
                onChange={(e) => {
                  const currentFilter = state.columnFilters.find(
                    (f: ColumnFilter) => f.id === "salary"
                  )?.value;

                  // Get current values from both array and object formats
                  let currentMin: number | undefined;
                  let currentMax: number | undefined;

                  if (Array.isArray(currentFilter)) {
                    // Always use [min, max] order
                    currentMin = currentFilter[0];
                    currentMax = currentFilter[1];
                    // Convert -1 placeholders to undefined
                    if (currentMin === -1) currentMin = undefined;
                    if (currentMax === -1) currentMax = undefined;
                  } else if (
                    currentFilter &&
                    typeof currentFilter === "object"
                  ) {
                    const obj = currentFilter as { min?: number; max?: number };
                    currentMin = obj.min;
                    currentMax = obj.max;
                  }

                  const newMax = e.target.value
                    ? Number(e.target.value)
                    : undefined;

                  // Always store as [min, max] order
                  if (currentMin !== undefined || newMax !== undefined) {
                    const minVal = currentMin !== undefined ? currentMin : -1;
                    const maxVal = newMax !== undefined ? newMax : -1;
                    table.setColumnFilters((prev) =>
                      prev
                        .filter((f) => f.id !== "salary")
                        .concat([{ id: "salary", value: [minVal, maxVal] }])
                    );
                  } else {
                    // Remove filter if both values are undefined
                    table.setColumnFilters((prev) =>
                      prev.filter((f) => f.id !== "salary")
                    );
                  }
                }}
                style={{ padding: "5px", width: "80px", fontSize: "12px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label>Teams:</label>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {["finance", "sales", "hr", "dev"].map((team) => {
                const currentTeams =
                  (state.columnFilters.find(
                    (f: ColumnFilter) => f.id === "teams"
                  )?.value as string[]) || [];
                const isChecked = currentTeams.includes(team);

                return (
                  <label
                    key={team}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: "12px",
                    }}
                  >
                    <input
                      type="checkbox"
                      data-testid={`teams-filter-${team}`}
                      checked={isChecked}
                      onChange={(e) => {
                        let newTeams: string[];
                        if (e.target.checked) {
                          newTeams = [...currentTeams, team];
                        } else {
                          newTeams = currentTeams.filter((t) => t !== team);
                        }

                        table.setColumnFilters((prev) =>
                          prev
                            .filter((f) => f.id !== "teams")
                            .concat(
                              newTeams.length > 0
                                ? [{ id: "teams", value: newTeams }]
                                : []
                            )
                        );
                      }}
                      style={{ marginRight: "3px" }}
                    />
                    {team.charAt(0).toUpperCase() + team.slice(1)}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table
        data-testid="data-table"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                <input
                  type="checkbox"
                  data-testid="select-all"
                  checked={table.getIsAllRowsSelected()}
                  onChange={table.getToggleAllRowsSelectedHandler()}
                />
              </th>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    cursor: header.column.getCanSort() ? "pointer" : "default",
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                  data-testid={`header-${header.id}`}
                >
                  {header.isPlaceholder ? null : (
                    <div>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                style={{ textAlign: "center", padding: "20px" }}
              >
                Loading data...
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                style={{ textAlign: "center", padding: "20px" }}
              >
                No data found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  <input
                    type="checkbox"
                    data-testid={`select-row-${row.id}`}
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                  />
                </td>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ border: "1px solid #ccc", padding: "8px" }}
                    data-testid={`cell-${cell.column.id}-${row.id}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        data-testid="pagination"
        style={{
          marginTop: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <button
          data-testid="first-page"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          style={{ padding: "5px 10px" }}
        >
          {"<<"}
        </button>
        <button
          data-testid="prev-page"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          style={{ padding: "5px 10px" }}
        >
          {"<"}
        </button>
        <span>
          Page{" "}
          <strong data-testid="page-info">
            {state.pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
          {apiResponse && (
            <span
              style={{ marginLeft: "10px", fontSize: "12px", color: "#666" }}
            >
              ({apiResponse.rowCount} total rows)
            </span>
          )}
        </span>
        <button
          data-testid="next-page"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          style={{ padding: "5px 10px" }}
        >
          {">"}
        </button>
        <button
          data-testid="last-page"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          style={{ padding: "5px 10px" }}
        >
          {">>"}
        </button>

        <span>| Go to page:</span>
        <input
          data-testid="goto-page"
          type="number"
          defaultValue={state.pagination.pageIndex + 1}
          onChange={(e) => {
            const page = e.target.value ? Number(e.target.value) - 1 : 0;
            table.setPageIndex(page);
          }}
          style={{ padding: "5px", width: "60px" }}
        />
      </div>
    </div>
  );
}

export default App;
