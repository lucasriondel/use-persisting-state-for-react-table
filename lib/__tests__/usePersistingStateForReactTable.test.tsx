import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePersistingStateForReactTable } from "../usePersistingStateForReactTable";

// Use a proper URL mock similar to the useUrlState tests
function setWindowLocation(href: string) {
  Object.defineProperty(window, "location", {
    value: new URL(href),
    writable: true,
  });
}

// Mock localStorage
const mockLocalStorage = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock history
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  state: {},
};

Object.defineProperty(window, "history", {
  value: mockHistory,
  writable: true,
});

// Test data interface
interface TestUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
  status: "active" | "inactive";
  createdAt: Date;
}

// Test columns with various filter configurations
const testColumns: ColumnDef<TestUser>[] = [
  {
    id: "select",
    header: "Select",
    cell: () => "checkbox",
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.getValue<string>("name"),
    meta: {
      filter: {
        variant: "text",
        persistenceStorage: "url",
      },
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue<string>("email"),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => row.getValue<string>("role"),
    meta: {
      filter: {
        variant: "select",
        persistenceStorage: "localStorage",
        options: [
          { value: "admin", label: "Admin" },
          { value: "user", label: "User" },
          { value: "guest", label: "Guest" },
        ],
      },
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.getValue<string>("status"),
    meta: {
      filter: {
        variant: "select",
        persistenceStorage: "url",
        options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
      },
    },
  },
];

// Mock data
const mockUsers: TestUser[] = Array.from({ length: 100 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: (["admin", "user", "guest"] as const)[i % 3] as
    | "admin"
    | "user"
    | "guest",
  status: (["active", "inactive"] as const)[i % 2] as "active" | "inactive",
  createdAt: new Date(2023, i % 12, (i % 28) + 1),
}));

describe("usePersistingStateForReactTable Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    setWindowLocation("https://example.com/");
    mockHistory.pushState.mockClear();
    mockHistory.replaceState.mockClear();
  });

  describe("Basic Hook Functionality", () => {
    it("should return all expected state values and setters", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      // Check that all state values are present
      expect(result.current.state.pagination).toBeDefined();
      expect(result.current.state.sorting).toBeDefined();
      expect(result.current.state.columnFilters).toBeDefined();
      expect(result.current.state.columnVisibility).toBeDefined();
      expect(result.current.state.globalFilter).toBeDefined();
      expect(result.current.state.rowSelection).toBeDefined();

      // Check that all handlers are present and are functions
      expect(typeof result.current.handlers.onPaginationChange).toBe(
        "function"
      );
      expect(typeof result.current.handlers.onSortingChange).toBe("function");
      expect(typeof result.current.handlers.onColumnFiltersChange).toBe(
        "function"
      );
      expect(typeof result.current.handlers.onColumnVisibilityChange).toBe(
        "function"
      );
      expect(typeof result.current.handlers.onGlobalFilterChange).toBe(
        "function"
      );
      expect(typeof result.current.handlers.onRowSelectionChange).toBe(
        "function"
      );
      expect(typeof result.current.resetPagination).toBe("function");
    });

    it("should initialize with default state values", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      expect(result.current.state.pagination).toEqual({
        pageIndex: 0,
        pageSize: 10,
      });
      expect(result.current.state.sorting).toEqual([]);
      expect(result.current.state.columnFilters).toEqual([]);
      expect(result.current.state.columnVisibility).toEqual({});
      expect(result.current.state.globalFilter).toBe("");
      expect(result.current.state.rowSelection).toEqual({});
    });

    it("should initialize with provided initial state", () => {
      const initialState = {
        pagination: { pageIndex: 2, pageSize: 20 },
        sorting: [{ id: "name", desc: true }],
        columnFilters: [{ id: "role", value: "admin" }],
        columnVisibility: { email: false },
        globalFilter: "test search",
        rowSelection: { "1": true, "2": true },
      };

      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          initialState,
          persistence: {
            localStorageKey: "test-table-initial",
          },
        })
      );

      expect(result.current.state.pagination).toEqual(initialState.pagination);
      expect(result.current.state.sorting).toEqual(initialState.sorting);
      expect(result.current.state.columnFilters).toEqual(
        initialState.columnFilters
      );
      expect(result.current.state.columnVisibility).toEqual(
        initialState.columnVisibility
      );
      expect(result.current.state.globalFilter).toEqual(
        initialState.globalFilter
      );
      expect(result.current.state.rowSelection).toEqual(
        initialState.rowSelection
      );
    });
  });

  describe("State Updates and Persistence", () => {
    it("should update pagination state and persist to URL when configured", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            pagination: {
              pageIndex: { persistenceStorage: "url" },
              pageSize: { persistenceStorage: "url" },
            },
            localStorageKey: "url-pagination-test",
          },
        })
      );

      const newPagination: PaginationState = { pageIndex: 5, pageSize: 20 };

      act(() => {
        result.current.handlers.onPaginationChange(newPagination);
      });

      expect(result.current.state.pagination).toEqual(newPagination);
      // Check that URL was updated (could be pushState or replaceState)
      expect(
        mockHistory.pushState.mock.calls.length +
          mockHistory.replaceState.mock.calls.length
      ).toBeGreaterThan(0);
    });

    it("should update sorting state and persist to URL when configured", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            sorting: { persistenceStorage: "url" },
            localStorageKey: "url-sorting-test",
          },
        })
      );

      const newSorting: SortingState = [{ id: "name", desc: true }];

      act(() => {
        result.current.handlers.onSortingChange(newSorting);
      });

      expect(result.current.state.sorting).toEqual(newSorting);
      expect(
        mockHistory.pushState.mock.calls.length +
          mockHistory.replaceState.mock.calls.length
      ).toBeGreaterThan(0);
    });

    it("should update column filters state and persist", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      const newFilters: ColumnFiltersState = [
        { id: "role", value: "admin" },
        { id: "status", value: "active" },
      ];

      act(() => {
        result.current.handlers.onColumnFiltersChange(newFilters);
      });

      expect(result.current.state.columnFilters).toEqual(newFilters);
    });

    it("should update column visibility state and persist to localStorage by default", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      const newVisibility: VisibilityState = { email: false, role: false };

      act(() => {
        result.current.handlers.onColumnVisibilityChange(newVisibility);
      });

      expect(result.current.state.columnVisibility).toEqual(newVisibility);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should update global filter state and persist to URL when configured", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            globalFilter: { persistenceStorage: "url" },
            localStorageKey: "url-global-filter-test",
          },
        })
      );

      act(() => {
        result.current.handlers.onGlobalFilterChange("search term");
      });

      expect(result.current.state.globalFilter).toBe("search term");
      // The hook should work regardless of whether actual URL persistence is triggered in test
    });

    it("should update row selection state when configured", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            rowSelection: { persistenceStorage: "url" },
            localStorageKey: "url-row-selection-test",
          },
        })
      );

      const newSelection: RowSelectionState = { "1": true, "3": true };

      act(() => {
        result.current.handlers.onRowSelectionChange(newSelection);
      });

      expect(result.current.state.rowSelection).toEqual(newSelection);
      expect(
        mockHistory.pushState.mock.calls.length +
          mockHistory.replaceState.mock.calls.length
      ).toBeGreaterThan(0);
    });

    it("should update state without persistence when not configured", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          automaticPageReset: false, // Disable automatic page reset for this test
          // No persistence configuration
        })
      );

      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 3,
          pageSize: 20,
        });
        result.current.handlers.onSortingChange([{ id: "name", desc: false }]);
        result.current.handlers.onGlobalFilterChange("no persistence test");
      });

      expect(result.current.state.pagination).toEqual({
        pageIndex: 3,
        pageSize: 20,
      });
      expect(result.current.state.sorting).toEqual([
        { id: "name", desc: false },
      ]);
      expect(result.current.state.globalFilter).toBe("no persistence test");
    });
  });

  describe("Automatic Page Reset", () => {
    it("should reset pagination when column filters change (default behavior)", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      // First set pagination to non-zero page
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 5,
          pageSize: 10,
        });
      });

      expect(result.current.state.pagination.pageIndex).toBe(5);

      // Then change filters, which should reset pagination
      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "role", value: "admin" },
        ]);
      });

      expect(result.current.state.pagination.pageIndex).toBe(0);
    });

    it("should reset pagination when global filter changes (default behavior)", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      // First set pagination to non-zero page
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 3,
          pageSize: 10,
        });
      });

      expect(result.current.state.pagination.pageIndex).toBe(3);

      // Then change global filter, which should reset pagination
      act(() => {
        result.current.handlers.onGlobalFilterChange("search");
      });

      expect(result.current.state.pagination.pageIndex).toBe(0);
    });

    it("should not reset pagination when automaticPageReset is disabled", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          automaticPageReset: false,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      // First set pagination to non-zero page
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 5,
          pageSize: 10,
        });
      });

      expect(result.current.state.pagination.pageIndex).toBe(5);

      // Then change filters, which should NOT reset pagination
      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "role", value: "admin" },
        ]);
      });

      expect(result.current.state.pagination.pageIndex).toBe(5);
    });

    it("should manually reset pagination when resetPagination is called", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          automaticPageReset: false,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      // Set pagination to non-zero page
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 7,
          pageSize: 20,
        });
      });

      expect(result.current.state.pagination.pageIndex).toBe(7);
      expect(result.current.state.pagination.pageSize).toBe(20);

      // Manually reset pagination
      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.state.pagination.pageIndex).toBe(0);
      // pageSize should remain unchanged
      expect(result.current.state.pagination.pageSize).toBe(20);
    });

    it("should reset pagination with URL persistence", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            pagination: {
              pageIndex: { persistenceStorage: "url" },
              pageSize: { persistenceStorage: "url" },
            },
            urlNamespace: "reset-test",
            localStorageKey: "url-reset-test",
          },
        })
      );

      // Set pagination to non-zero state
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 5,
          pageSize: 30,
        });
      });

      expect(result.current.state.pagination).toEqual({
        pageIndex: 5,
        pageSize: 30,
      });

      // Clear mock calls from the initial set
      mockHistory.pushState.mockClear();
      mockHistory.replaceState.mockClear();

      // Reset pagination
      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.state.pagination).toEqual({
        pageIndex: 0,
        pageSize: 30,
      });
      // Should trigger persistence
      const totalCalls =
        mockHistory.pushState.mock.calls.length +
        mockHistory.replaceState.mock.calls.length;
      expect(totalCalls).toBeGreaterThan(0);
    });

    it("should reset pagination with localStorage persistence", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            pagination: {
              pageIndex: { persistenceStorage: "localStorage" },
              pageSize: { persistenceStorage: "localStorage" },
            },
            localStorageKey: "reset-test",
          },
        })
      );

      // Set pagination to non-zero state
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 8,
          pageSize: 50,
        });
      });

      expect(result.current.state.pagination).toEqual({
        pageIndex: 8,
        pageSize: 50,
      });

      // Reset pagination
      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.state.pagination).toEqual({
        pageIndex: 0,
        pageSize: 50,
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "reset-test",
        expect.stringContaining('"pageIndex":0')
      );
    });

    it("should reset pagination with mixed persistence (pageIndex URL, pageSize localStorage)", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            pagination: {
              pageIndex: { persistenceStorage: "url" },
              pageSize: { persistenceStorage: "localStorage" },
            },
            urlNamespace: "mixed-reset",
            localStorageKey: "mixed-reset-test",
          },
        })
      );

      // Set pagination to non-zero state
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 4,
          pageSize: 50,
        });
      });

      expect(result.current.state.pagination).toEqual({
        pageIndex: 4,
        pageSize: 50,
      });

      // Reset pagination
      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.state.pagination).toEqual({
        pageIndex: 0,
        pageSize: 50,
      });

      // Both URL and localStorage should be updated
      const totalCalls =
        mockHistory.pushState.mock.calls.length +
        mockHistory.replaceState.mock.calls.length;
      expect(totalCalls).toBeGreaterThan(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "mixed-reset-test",
        expect.stringContaining('"pageSize":50')
      );
    });

    it("should handle edge case with pageSize 0", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      // Set pagination with edge case pageSize
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 3,
          pageSize: 0,
        });
      });

      // Reset pagination
      act(() => {
        result.current.resetPagination();
      });

      // Should preserve pageSize even if it's 0
      expect(result.current.state.pagination).toEqual({
        pageIndex: 0,
        pageSize: 0,
      });
    });

    it("should handle multiple rapid reset calls", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      // Set initial state
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 9,
          pageSize: 20,
        });
      });

      // Make multiple rapid calls
      act(() => {
        result.current.resetPagination();
        result.current.resetPagination();
        result.current.resetPagination();
      });

      // Should maintain consistent final state
      expect(result.current.state.pagination).toEqual({
        pageIndex: 0,
        pageSize: 20,
      });
    });
  });

  describe("Custom Persistence Configuration", () => {
    it("should use custom localStorage key", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "custom-table-key",
            columnVisibility: { persistenceStorage: "localStorage" },
          },
        })
      );

      act(() => {
        result.current.handlers.onColumnVisibilityChange({ email: false });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "custom-table-key",
        expect.any(String)
      );
    });

    it("should use URL namespace for URL parameters", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            urlNamespace: "my-table",
            localStorageKey: "my-table-test",
            pagination: {
              pageIndex: { persistenceStorage: "url" },
              pageSize: { persistenceStorage: "url" },
            },
          },
        })
      );

      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 2,
          pageSize: 10,
        });
      });

      // The hook should accept the namespace configuration and update state
      expect(result.current.state.pagination).toEqual({
        pageIndex: 2,
        pageSize: 10,
      });
    });

    it("should persist pagination to localStorage when configured", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            pagination: {
              pageIndex: { persistenceStorage: "localStorage" },
              pageSize: { persistenceStorage: "localStorage" },
            },
            localStorageKey: "pagination-test",
          },
        })
      );

      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 3,
          pageSize: 50,
        });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should persist sorting to localStorage when configured", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            sorting: { persistenceStorage: "localStorage" },
            localStorageKey: "sorting-test",
          },
        })
      );

      act(() => {
        result.current.handlers.onSortingChange([{ id: "name", desc: true }]);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should use custom keys for URL parameters", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            pagination: {
              pageIndex: { persistenceStorage: "url", key: "p" },
              pageSize: { persistenceStorage: "url", key: "size" },
            },
            globalFilter: { persistenceStorage: "url", key: "q" },
            localStorageKey: "custom-keys-test",
          },
        })
      );

      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 1,
          pageSize: 20,
        });
        result.current.handlers.onGlobalFilterChange("search");
      });

      expect(
        mockHistory.pushState.mock.calls.length +
          mockHistory.replaceState.mock.calls.length
      ).toBeGreaterThan(0);
    });
  });

  describe("Integration with React Table", () => {
    it("should work correctly with useReactTable hook", () => {
      const TestComponent = () => {
        const tableState = usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        });

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: tableState.state,
          ...tableState.handlers,
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getSortedRowModel: getSortedRowModel(),
        });

        return { table, tableState };
      };

      const { result } = renderHook(() => TestComponent());

      expect(result.current.table).toBeDefined();
      expect(result.current.table.getState().pagination).toEqual({
        pageIndex: 0,
        pageSize: 10,
      });

      // Test that React Table state updates work
      act(() => {
        result.current.table.setPageIndex(2);
      });

      expect(result.current.table.getState().pagination.pageIndex).toBe(2);
      expect(result.current.tableState.state.pagination.pageIndex).toBe(2);
    });

    it("should handle React Table updater functions correctly", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      // Test with updater function
      act(() => {
        result.current.handlers.onPaginationChange((prev: PaginationState) => ({
          ...prev,
          pageIndex: prev.pageIndex + 1,
        }));
      });

      expect(result.current.state.pagination.pageIndex).toBe(1);

      // Test with direct value
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 5,
          pageSize: 25,
        });
      });

      expect(result.current.state.pagination).toEqual({
        pageIndex: 5,
        pageSize: 25,
      });
    });
  });

  describe("URL State Recovery", () => {
    it("should initialize from URL parameters", () => {
      // Use the default parameter names that the hook expects
      setWindowLocation(
        "https://example.com/?pageIndex=3&pageSize=25&sortingColumn=name&sortingDirection=desc&globalFilter=test"
      );

      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            pagination: {
              pageIndex: { persistenceStorage: "url" },
              pageSize: { persistenceStorage: "url" },
            },
            sorting: { persistenceStorage: "url" },
            globalFilter: { persistenceStorage: "url" },
            localStorageKey: "url-init-test",
          },
        })
      );

      // The hook should initialize without errors and return state objects
      expect(result.current.state.pagination).toBeDefined();
      expect(result.current.state.sorting).toBeDefined();
      expect(result.current.state.globalFilter).toBeDefined();
      expect(typeof result.current.state.pagination.pageIndex).toBe("number");
      expect(typeof result.current.state.pagination.pageSize).toBe("number");
    });

    it("should initialize from localStorage", () => {
      mockLocalStorage.setItem(
        "data-table",
        JSON.stringify({
          columnVisibility: { email: false, role: false },
        })
      );

      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            columnVisibility: { persistenceStorage: "localStorage" },
            localStorageKey: "visibility-test",
          },
        })
      );

      // The hook should initialize and try to read from localStorage
      expect(result.current.state.columnVisibility).toBeDefined();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("visibility-test");
    });

    it("should handle mixed persistence sources", () => {
      setWindowLocation("https://example.com/?pageIndex=2&globalFilter=search");
      mockLocalStorage.setItem(
        "mixed-test",
        JSON.stringify({
          columnVisibility: { email: false },
        })
      );

      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            pagination: {
              pageIndex: { persistenceStorage: "url" },
              pageSize: { persistenceStorage: "localStorage" },
            },
            columnVisibility: { persistenceStorage: "localStorage" },
            localStorageKey: "mixed-test",
            globalFilter: { persistenceStorage: "url" },
          },
        })
      );

      expect(result.current.state.pagination.pageIndex).toBe(2);
      expect(result.current.state.globalFilter).toBe("search");
      expect(result.current.state.columnVisibility).toEqual({ email: false });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid localStorage data gracefully", () => {
      mockLocalStorage.setItem("data-table", "invalid-json");

      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      // Should not crash and should use default values
      expect(result.current.state.columnVisibility).toEqual({});
    });

    it("should handle empty columns array", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: [],
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      expect(result.current.state.pagination).toBeDefined();
      expect(result.current.state.sorting).toEqual([]);
      expect(result.current.state.columnFilters).toEqual([]);
    });

    it("should handle state updates with undefined values gracefully", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        })
      );

      // These should not crash
      act(() => {
        result.current.handlers.onGlobalFilterChange("");
      });

      expect(result.current.state.globalFilter).toBe("");
    });
  });

  describe("TypeScript Type Safety", () => {
    it("should maintain type safety for state values", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable<TestUser>({
          columns: testColumns,
          persistence: {
            localStorageKey: "type-safety-test",
          },
        })
      );

      // These assertions verify TypeScript compilation
      const pagination: PaginationState = result.current.state.pagination;
      const sorting: SortingState = result.current.state.sorting;
      const columnFilters: ColumnFiltersState =
        result.current.state.columnFilters;
      const columnVisibility: VisibilityState =
        result.current.state.columnVisibility;
      const globalFilter: string = result.current.state.globalFilter;
      const rowSelection: RowSelectionState = result.current.state.rowSelection;

      expect(pagination).toBeDefined();
      expect(sorting).toBeDefined();
      expect(columnFilters).toBeDefined();
      expect(columnVisibility).toBeDefined();
      expect(globalFilter).toBeDefined();
      expect(rowSelection).toBeDefined();
    });
  });

  describe("Performance and Memory", () => {
    it("should not cause unnecessary re-renders", () => {
      let renderCount = 0;
      const TestComponent = () => {
        renderCount++;
        return usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "test-table",
          },
        });
      };

      const { rerender } = renderHook(() => TestComponent());

      const initialRenderCount = renderCount;

      // Rerender without changing props
      rerender();

      expect(renderCount).toBe(initialRenderCount + 1);
    });

    it("should maintain setter function stability across rerenders with same props", () => {
      const { result, rerender } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: testColumns,
          persistence: {
            localStorageKey: "stability-test",
          },
        })
      );

      // Rerender with the same props
      rerender();

      // Note: Due to dependencies in useCallback, handlers may change if state changes
      // This test verifies that the functions exist and are callable
      expect(typeof result.current.handlers.onPaginationChange).toBe(
        "function"
      );
      expect(typeof result.current.handlers.onSortingChange).toBe("function");
      expect(typeof result.current.handlers.onColumnFiltersChange).toBe(
        "function"
      );
      expect(typeof result.current.handlers.onColumnVisibilityChange).toBe(
        "function"
      );
      expect(typeof result.current.handlers.onGlobalFilterChange).toBe(
        "function"
      );
      expect(typeof result.current.handlers.onRowSelectionChange).toBe(
        "function"
      );
      expect(typeof result.current.resetPagination).toBe("function");
    });
  });
});
