import { createColumnHelper } from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePersistingStateForReactTable } from "../usePersistingStateForReactTable";

// Mock URL manipulation
const mockPushState = vi.fn();
const mockReplaceState = vi.fn();

Object.defineProperty(window, "history", {
  value: {
    pushState: mockPushState,
    replaceState: mockReplaceState,
  },
});

Object.defineProperty(window, "location", {
  value: {
    search: "",
    href: "http://localhost:3000/",
  },
  writable: true,
});

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Test data type
type TestData = {
  id: number;
  name: string;
  status: "active" | "inactive";
  age: number;
};

const columnHelper = createColumnHelper<TestData>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("status", {
    header: "Status",
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
  columnHelper.accessor("age", {
    header: "Age",
    meta: {
      filter: {
        variant: "number" as const,
        persistenceStorage: "url" as const,
        key: "age-filter",
      },
    },
  }),
];

describe("urlNamespace filter behavior bug investigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    window.location.search = "";
    window.location.href = "http://localhost:3000/";
  });

  describe("WITHOUT urlNamespace", () => {
    it("should handle column filters correctly without urlNamespace", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns,
          persistence: {
            localStorageKey: "test-table",
            // NO urlNamespace set
            globalFilter: {
              persistenceStorage: "url",
              key: "search",
            },
          },
        })
      );

      // Initial state should be empty
      expect(result.current.state.columnFilters).toEqual([]);

      // Apply a status filter
      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "status", value: "active" },
        ]);
      });

      // Filter should be applied
      expect(result.current.state.columnFilters).toEqual([
        { id: "status", value: "active" },
      ]);

      // Check URL updates - should work normally
      expect(mockReplaceState).toHaveBeenCalled();
      const lastCall =
        mockReplaceState.mock.calls[mockReplaceState.mock.calls.length - 1];
      expect(lastCall[2]).toContain("status-filter=active");
    });

    it("should handle multiple column filters without urlNamespace", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns,
          persistence: {
            localStorageKey: "test-table",
            // NO urlNamespace set
            globalFilter: {
              persistenceStorage: "url",
              key: "search",
            },
          },
        })
      );

      // Apply multiple filters
      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "status", value: "active" },
          { id: "age", value: 25 },
        ]);
      });

      // Both filters should be applied
      expect(result.current.state.columnFilters).toEqual([
        { id: "status", value: "active" },
        { id: "age", value: 25 },
      ]);

      // Check URL contains both filters
      expect(mockReplaceState).toHaveBeenCalled();
      const lastCall =
        mockReplaceState.mock.calls[mockReplaceState.mock.calls.length - 1];
      expect(lastCall[2]).toContain("status-filter=active");
      expect(lastCall[2]).toContain("age-filter=25");
    });
  });

  describe("WITH urlNamespace", () => {
    it("should handle column filters correctly WITH urlNamespace", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns,
          persistence: {
            urlNamespace: "test-table", // urlNamespace IS set
            localStorageKey: "test-table",
            globalFilter: {
              persistenceStorage: "url",
              key: "search",
            },
          },
        })
      );

      // Initial state should be empty
      expect(result.current.state.columnFilters).toEqual([]);

      // Apply a status filter
      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "status", value: "active" },
        ]);
      });

      // Filter should be applied
      expect(result.current.state.columnFilters).toEqual([
        { id: "status", value: "active" },
      ]);

      // Check URL updates - should use namespaced keys
      expect(mockReplaceState).toHaveBeenCalled();
      const lastCall =
        mockReplaceState.mock.calls[mockReplaceState.mock.calls.length - 1];
      expect(lastCall[2]).toContain("test-table.status-filter=active");
    });

    it("should handle multiple column filters WITH urlNamespace", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns,
          persistence: {
            urlNamespace: "test-table", // urlNamespace IS set
            localStorageKey: "test-table",
            globalFilter: {
              persistenceStorage: "url",
              key: "search",
            },
          },
        })
      );

      // Apply multiple filters
      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "status", value: "active" },
          { id: "age", value: 25 },
        ]);
      });

      // Both filters should be applied
      expect(result.current.state.columnFilters).toEqual([
        { id: "status", value: "active" },
        { id: "age", value: 25 },
      ]);

      // Check URL contains both namespaced filters
      expect(mockReplaceState).toHaveBeenCalled();
      const lastCall =
        mockReplaceState.mock.calls[mockReplaceState.mock.calls.length - 1];
      expect(lastCall[2]).toContain("test-table.status-filter=active");
      expect(lastCall[2]).toContain("test-table.age-filter=25");
    });

    it("should load initial state from URL with urlNamespace", () => {
      // Set initial URL with namespaced filters
      window.location.search =
        "?test-table.status-filter=inactive&test-table.age-filter=30";
      window.location.href =
        "http://localhost:3000/?test-table.status-filter=inactive&test-table.age-filter=30";

      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns,
          persistence: {
            urlNamespace: "test-table",
            localStorageKey: "test-table",
          },
        })
      );

      // Should load filters from URL
      expect(result.current.state.columnFilters).toEqual([
        { id: "status", value: "inactive" },
        { id: "age", value: 30 },
      ]);
    });

    it("should handle filter clearing WITH urlNamespace", () => {
      // Start with filters in URL
      window.location.search =
        "?test-table.status-filter=active&test-table.age-filter=25";
      window.location.href =
        "http://localhost:3000/?test-table.status-filter=active&test-table.age-filter=25";

      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns,
          persistence: {
            urlNamespace: "test-table",
            localStorageKey: "test-table",
          },
        })
      );

      // Should load initial filters
      expect(result.current.state.columnFilters).toEqual([
        { id: "status", value: "active" },
        { id: "age", value: 25 },
      ]);

      // Clear one filter
      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "age", value: 25 }, // Remove status filter, keep age filter
        ]);
      });

      // Should update state
      expect(result.current.state.columnFilters).toEqual([
        { id: "age", value: 25 },
      ]);

      // URL should be updated to remove status filter
      expect(mockReplaceState).toHaveBeenCalled();
      const lastCall =
        mockReplaceState.mock.calls[mockReplaceState.mock.calls.length - 1];
      expect(lastCall[2]).not.toContain("status-filter");
      expect(lastCall[2]).toContain("test-table.age-filter=25");
    });

    it("should handle mixed persistence storages WITH urlNamespace", () => {
      const mixedColumns = [
        columnHelper.accessor("status", {
          header: "Status",
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
        columnHelper.accessor("age", {
          header: "Age",
          meta: {
            filter: {
              variant: "number" as const,
              persistenceStorage: "localStorage" as const,
              key: "age-filter",
            },
          },
        }),
      ];

      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns: mixedColumns,
          persistence: {
            urlNamespace: "test-table",
            localStorageKey: "test-table",
          },
        })
      );

      // Apply filters with mixed storage
      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "status", value: "active" },
          { id: "age", value: 25 },
        ]);
      });

      // Both filters should be applied to state
      expect(result.current.state.columnFilters).toEqual([
        { id: "status", value: "active" },
        { id: "age", value: 25 },
      ]);

      // URL should have namespaced status filter
      expect(mockReplaceState).toHaveBeenCalled();
      const lastCall =
        mockReplaceState.mock.calls[mockReplaceState.mock.calls.length - 1];
      expect(lastCall[2]).toContain("test-table.status-filter=active");
      expect(lastCall[2]).not.toContain("age-filter"); // age is in localStorage

      // localStorage should have age filter
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "test-table",
        expect.stringContaining('"age-filter":25')
      );
    });
  });

  describe("Comparison between WITH and WITHOUT urlNamespace", () => {
    it("should behave consistently regardless of urlNamespace presence", () => {
      // Test without urlNamespace
      const { result: withoutNamespace } = renderHook(() =>
        usePersistingStateForReactTable({
          columns,
          persistence: {
            localStorageKey: "test-table-without",
          },
        })
      );

      // Test with urlNamespace
      const { result: withNamespace } = renderHook(() =>
        usePersistingStateForReactTable({
          columns,
          persistence: {
            urlNamespace: "test-table",
            localStorageKey: "test-table-with",
          },
        })
      );

      // Both should start with empty filters
      expect(withoutNamespace.current.state.columnFilters).toEqual([]);
      expect(withNamespace.current.state.columnFilters).toEqual([]);

      // Apply same filter to both
      const testFilter = [{ id: "status", value: "active" }];

      act(() => {
        withoutNamespace.current.handlers.onColumnFiltersChange(testFilter);
      });

      act(() => {
        withNamespace.current.handlers.onColumnFiltersChange(testFilter);
      });

      // Both should have the same state
      expect(withoutNamespace.current.state.columnFilters).toEqual(testFilter);
      expect(withNamespace.current.state.columnFilters).toEqual(testFilter);

      // Both should have called URL updates
      expect(mockReplaceState).toHaveBeenCalled();
    });
  });

  describe("Edge cases that might reveal the bug", () => {
    it("should handle rapid filter changes with urlNamespace", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns,
          persistence: {
            urlNamespace: "test-table",
            localStorageKey: "test-table",
          },
        })
      );

      // Apply multiple rapid changes
      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "status", value: "active" },
        ]);
      });

      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "status", value: "active" },
          { id: "age", value: 25 },
        ]);
      });

      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "age", value: 30 },
        ]);
      });

      act(() => {
        result.current.handlers.onColumnFiltersChange([]);
      });

      // Final state should be empty
      expect(result.current.state.columnFilters).toEqual([]);

      // URL should be cleared
      const lastCall =
        mockReplaceState.mock.calls[mockReplaceState.mock.calls.length - 1];
      expect(lastCall[2]).not.toContain("status-filter");
      expect(lastCall[2]).not.toContain("age-filter");
    });

    it("should handle filter updates that trigger other state changes", () => {
      const { result } = renderHook(() =>
        usePersistingStateForReactTable({
          columns,
          automaticPageReset: true, // This might cause issues
          persistence: {
            urlNamespace: "test-table",
            localStorageKey: "test-table",
            pagination: {
              pageIndex: { persistenceStorage: "url", key: "page" },
            },
          },
        })
      );

      // Set initial pagination
      act(() => {
        result.current.handlers.onPaginationChange({
          pageIndex: 2,
          pageSize: 10,
        });
      });

      expect(result.current.state.pagination.pageIndex).toBe(2);

      // Apply filter (should reset pagination due to automaticPageReset)
      act(() => {
        result.current.handlers.onColumnFiltersChange([
          { id: "status", value: "active" },
        ]);
      });

      // Filter should be applied
      expect(result.current.state.columnFilters).toEqual([
        { id: "status", value: "active" },
      ]);

      // Pagination should be reset
      expect(result.current.state.pagination.pageIndex).toBe(0);

      // URL should contain both filter and reset pagination
      const lastCall =
        mockReplaceState.mock.calls[mockReplaceState.mock.calls.length - 1];
      expect(lastCall[2]).toContain("test-table.status-filter=active");
      expect(lastCall[2]).toContain("test-table.page=0");
    });
  });
});
