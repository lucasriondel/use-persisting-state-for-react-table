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
        <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
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
