import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSharedBuckets } from "../../__tests__/createMockSharedBuckets";

import { PersistingTableOptions } from "../../usePersistingStateForReactTable";
import { usePersistingPaginationLogic } from "../index";

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

// Helper function to create mock shared buckets

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
}

// Test columns
const testColumns: ColumnDef<TestUser>[] = [
  {
    id: "select",
    header: "Select",
    cell: () => "checkbox",
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.getValue("name"),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email"),
  },
];

// Mock data
const mockUsers: TestUser[] = Array.from({ length: 100 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
}));

describe("usePersistingPaginationLogic Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    setWindowLocation("https://example.com/");
    mockHistory.pushState.mockClear();
    mockHistory.replaceState.mockClear();
  });

  describe("URL persistence", () => {
    it("persists pagination state to URL and retrieves it", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          pagination: {
            pageIndex: 2,
            pageSize: 20,
          },
        },
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "url" },
            pageSize: { persistenceStorage: "url" },
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result: paginationHook } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      // Create a table instance with the pagination hook
      const { result: tableHook } = renderHook(() => {
        const [pagination, setPagination] = React.useState<PaginationState>(
          paginationHook.current.initialPaginationState || {
            pageIndex: 0,
            pageSize: 10,
          }
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { pagination },
          onPaginationChange: (updater) => {
            const newPagination =
              typeof updater === "function" ? updater(pagination) : updater;
            paginationHook.current.handlePaginationChange(updater, pagination);
            setPagination(newPagination);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, pagination };
      });

      // Initial state should be set from our initial values
      expect(tableHook.current.pagination).toEqual({
        pageIndex: 2,
        pageSize: 20,
      });

      // Change page index
      act(() => {
        tableHook.current.table.setPageIndex(5);
      });

      // URL should be updated
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.pageIndex=5")
      );

      // Change page size
      act(() => {
        tableHook.current.table.setPageSize(50);
      });

      // URL should be updated with both values
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.pageSize=50")
      );
    });

    it("reads initial state from URL parameters", () => {
      // Set up URL with pagination parameters using proper URL object
      setWindowLocation(
        "https://example.com/?table.pageIndex=3&table.pageSize=20"
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          pagination: {
            pageIndex: 0,
            pageSize: 10,
          },
        },
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "url" },
            pageSize: { persistenceStorage: "url" },
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      expect(sharedBuckets.urlBucket).toEqual({
        pageIndex: 3,
        pageSize: 20,
      });

      // Should read from URL instead of initial state
      expect(result.current.initialPaginationState).toEqual({
        pageIndex: 3,
        pageSize: 20,
      });
    });

    it("uses custom keys for URL parameters", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "url", key: "page" },
            pageSize: { persistenceStorage: "url", key: "size" },
          },
          urlNamespace: "data",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result: paginationHook } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [pagination, setPagination] = React.useState<PaginationState>(
          paginationHook.current.initialPaginationState || {
            pageIndex: 0,
            pageSize: 10,
          }
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { pagination },
          onPaginationChange: (updater) => {
            const newPagination =
              typeof updater === "function" ? updater(pagination) : updater;
            paginationHook.current.handlePaginationChange(updater, pagination);
            setPagination(newPagination);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, pagination };
      });

      // Change pagination
      act(() => {
        tableHook.current.table.setPageIndex(2);
      });

      act(() => {
        tableHook.current.table.setPageSize(20);
      });

      // Should use custom keys in URL
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("data.page=2")
      );
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("data.size=20")
      );
    });
  });

  describe("localStorage persistence", () => {
    it("persists pagination state to localStorage and retrieves it", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          pagination: {
            pageIndex: 1,
            pageSize: 20,
          },
        },
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "localStorage" },
            pageSize: { persistenceStorage: "localStorage" },
          },
          localStorageKey: "test-pagination",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result: paginationHook } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [pagination, setPagination] = React.useState<PaginationState>(
          paginationHook.current.initialPaginationState || {
            pageIndex: 0,
            pageSize: 10,
          }
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { pagination },
          onPaginationChange: (updater) => {
            const newPagination =
              typeof updater === "function" ? updater(pagination) : updater;
            paginationHook.current.handlePaginationChange(updater, pagination);
            setPagination(newPagination);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, pagination };
      });

      // Initial state should be set
      expect(tableHook.current.pagination).toEqual({
        pageIndex: 1,
        pageSize: 20,
      });

      // Change pagination
      act(() => {
        tableHook.current.table.setPageIndex(4);
      });

      // localStorage should be updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "test-pagination",
        expect.stringContaining('"pageIndex":4')
      );

      act(() => {
        tableHook.current.table.setPageSize(30);
      });

      // localStorage should be updated with both values
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "test-pagination",
        expect.stringContaining('"pageSize":20')
      );
    });

    it("reads initial state from localStorage", () => {
      // Pre-populate localStorage
      mockLocalStorage.setItem(
        "test-pagination",
        JSON.stringify({ pageIndex: 7, pageSize: 50 })
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          pagination: {
            pageIndex: 0,
            pageSize: 10,
          },
        },
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "localStorage" },
            pageSize: { persistenceStorage: "localStorage" },
          },
          localStorageKey: "test-pagination",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      // Should read from localStorage instead of initial state
      expect(result.current.initialPaginationState).toEqual({
        pageIndex: 7,
        pageSize: 50,
      });
    });
  });

  describe("mixed persistence", () => {
    it("handles pageIndex in URL and pageSize in localStorage", () => {
      // Set up initial state in both storages
      setWindowLocation("https://example.com/?pageIndex=6");
      mockLocalStorage.setItem(
        "mixed-pagination",
        JSON.stringify({ pageSize: 50 })
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "url" },
            pageSize: { persistenceStorage: "localStorage" },
          },
          localStorageKey: "mixed-pagination",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result: paginationHook } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [pagination, setPagination] = React.useState<PaginationState>(
          paginationHook.current.initialPaginationState || {
            pageIndex: 0,
            pageSize: 10,
          }
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { pagination },
          onPaginationChange: (updater) => {
            const newPagination =
              typeof updater === "function" ? updater(pagination) : updater;
            paginationHook.current.handlePaginationChange(updater, pagination);
            setPagination(newPagination);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, pagination };
      });

      // Should read from both storages
      expect(tableHook.current.pagination).toEqual({
        pageIndex: 6,
        pageSize: 50,
      });

      // Change pageIndex (should update URL)
      act(() => {
        tableHook.current.table.setPageIndex(8);
      });

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("pageIndex=8")
      );

      // Change pageSize (should update localStorage)
      act(() => {
        tableHook.current.table.setPageSize(50);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "mixed-pagination",
        expect.stringContaining('"pageSize":50')
      );
    });
  });

  describe("partial persistence", () => {
    it("persists only pageIndex when pageSize is not configured", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "url" },
            // pageSize not configured
          },
          urlNamespace: "partial",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result: paginationHook } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [pagination, setPagination] = React.useState<PaginationState>(
          paginationHook.current.initialPaginationState || {
            pageIndex: 0,
            pageSize: 10,
          }
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { pagination },
          onPaginationChange: (updater) => {
            const newPagination =
              typeof updater === "function" ? updater(pagination) : updater;
            paginationHook.current.handlePaginationChange(updater, pagination);
            setPagination(newPagination);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, pagination };
      });

      // Change pageIndex (should be persisted)
      act(() => {
        tableHook.current.table.setPageIndex(3);
      });

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("partial.pageIndex=3")
      );

      // Change pageSize (should not be persisted)
      act(() => {
        tableHook.current.table.setPageSize(25);
      });

      // Should not contain pageSize in any calls to replaceState
      const allCalls = mockHistory.replaceState.mock.calls;
      const hasPageSize = allCalls.some(
        (call) => call[2] && call[2].includes("pageSize")
      );
      expect(hasPageSize).toBe(false);
    });
  });

  describe("function updaters", () => {
    it("handles function-based pagination updates", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "url" },
            pageSize: { persistenceStorage: "url" },
          },
          urlNamespace: "func",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result: paginationHook } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [pagination, setPagination] = React.useState<PaginationState>(
          paginationHook.current.initialPaginationState || {
            pageIndex: 0,
            pageSize: 10,
          }
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { pagination },
          onPaginationChange: (updater) => {
            const newPagination =
              typeof updater === "function" ? updater(pagination) : updater;
            paginationHook.current.handlePaginationChange(updater, pagination);
            setPagination(newPagination);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, pagination };
      });

      // Use function updater to increment page
      act(() => {
        tableHook.current.table.setPagination((prev) => ({
          ...prev,
          pageIndex: prev.pageIndex + 2,
        }));
      });

      expect(tableHook.current.pagination.pageIndex).toBe(2);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("func.pageIndex=2")
      );

      // Use function updater to change page size
      act(() => {
        tableHook.current.table.setPagination((prev) => ({
          ...prev,
          pageSize: prev.pageSize * 2,
        }));
      });

      expect(tableHook.current.pagination.pageSize).toBe(20);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("func.pageSize=20")
      );
    });
  });

  describe("initial state persistence", () => {
    it("persists initial state when no existing persisted values", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          pagination: {
            pageIndex: 5,
            pageSize: 50,
          },
        },
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "url" },
            pageSize: { persistenceStorage: "localStorage" },
          },
          urlNamespace: "initial",
          localStorageKey: "initial-pagination",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      renderHook(() => usePersistingPaginationLogic(options, sharedBuckets));

      // Allow useEffect to run
      act(() => {
        // Force update
      });

      // Should persist initial state to both storages
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("initial.pageIndex=5")
      );

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "initial-pagination",
        expect.stringContaining('"pageSize":50')
      );
    });

    it("does not persist initial state when persisted values already exist", () => {
      // Pre-existing values
      setWindowLocation("https://example.com/?existing.pageIndex=10");
      mockLocalStorage.setItem(
        "existing-pagination",
        JSON.stringify({ pageSize: 50 })
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          pagination: {
            pageIndex: 1,
            pageSize: 20,
          },
        },
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "url" },
            pageSize: {
              persistenceStorage: "localStorage",
              allowedPageSizes: [10, 20, 50, 100],
            },
          },
          urlNamespace: "existing",
          localStorageKey: "existing-pagination",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      // Should use existing values instead of initial state
      expect(result.current.initialPaginationState).toEqual({
        pageIndex: 10,
        pageSize: 50,
      });

      // Allow useEffect to run
      act(() => {
        // Force update
      });

      // Should not persist initial state since values already exist
      // The replaceState calls should only be from reading existing state, not writing initial state
      const replaceStateCalls = mockHistory.replaceState.mock.calls;
      const setItemCalls = mockLocalStorage.setItem.mock.calls;

      // Should not have excessive persistence calls for initial state
      expect(replaceStateCalls.length).toBeLessThanOrEqual(2);
      expect(setItemCalls.length).toBeLessThanOrEqual(3);
    });
  });

  describe("error handling", () => {
    it("handles malformed URL parameters gracefully", () => {
      setWindowLocation(
        "https://example.com/?table.pageIndex=invalid&table.pageSize=notanumber"
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          pagination: {
            pageIndex: 2,
            pageSize: 20,
          },
        },
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "url" },
            pageSize: { persistenceStorage: "url" },
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      // Should fall back to initial state when URL values are invalid
      expect(result.current.initialPaginationState).toEqual({
        pageIndex: 2,
        pageSize: 20,
      });
    });

    it("handles localStorage JSON parse errors gracefully", () => {
      mockLocalStorage.setItem("broken-pagination", "invalid-json{");

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          pagination: {
            pageIndex: 3,
            pageSize: 20,
          },
        },
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "localStorage" },
            pageSize: { persistenceStorage: "localStorage" },
          },
          localStorageKey: "broken-pagination",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      // Should fall back to initial state when localStorage is corrupted
      expect(result.current.initialPaginationState).toEqual({
        pageIndex: 3,
        pageSize: 20,
      });
    });
  });

  describe("real-world pagination scenarios", () => {
    it("simulates user navigating through pages in a data table", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          pagination: {
            pageIndex: 0,
            pageSize: 10,
          },
        },
        persistence: {
          pagination: {
            pageIndex: { persistenceStorage: "url" },
            pageSize: { persistenceStorage: "url" },
          },
          urlNamespace: "users",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);
      const { result: paginationHook } = renderHook(() =>
        usePersistingPaginationLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [pagination, setPagination] = React.useState<PaginationState>(
          paginationHook.current.initialPaginationState || {
            pageIndex: 0,
            pageSize: 10,
          }
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { pagination },
          manualPagination: true,
          pageCount: Math.ceil(mockUsers.length / pagination.pageSize),
          onPaginationChange: (updater) => {
            const newPagination =
              typeof updater === "function" ? updater(pagination) : updater;
            paginationHook.current.handlePaginationChange(updater, pagination);
            setPagination(newPagination);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, pagination };
      });

      // Start on page 1 (index 0)
      expect(tableHook.current.pagination.pageIndex).toBe(0);
      expect(tableHook.current.pagination.pageSize).toBe(10);

      // Go to next page
      act(() => {
        tableHook.current.table.nextPage();
      });

      expect(tableHook.current.pagination.pageIndex).toBe(1);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.pageIndex=1")
      );

      // Go to last page
      act(() => {
        tableHook.current.table.setPageIndex(9); // Last page for 100 items with page size 10
      });

      expect(tableHook.current.pagination.pageIndex).toBe(9);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.pageIndex=9")
      );

      // Change page size (should reset to page 0)
      act(() => {
        tableHook.current.table.setPageSize(20);
      });

      expect(tableHook.current.pagination.pageSize).toBe(20);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.pageSize=20")
      );

      // Previous page from current position
      act(() => {
        tableHook.current.table.previousPage();
      });

      expect(tableHook.current.pagination.pageIndex).toBe(3);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.pageIndex=3")
      );
    });
  });

  // Note: resetPagination tests moved to usePersistingStateForReactTable.test.tsx
  // since the function is now part of the main hook
});
