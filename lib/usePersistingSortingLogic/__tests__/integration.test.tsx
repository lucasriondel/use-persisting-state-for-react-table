import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { usePersistingSortingLogic } from "../index";

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
  role: string;
  status: string;
  age: number;
}

// Test columns with sortable support
const testColumns: ColumnDef<TestUser>[] = [
  {
    id: "select",
    header: "Select",
    cell: () => "checkbox",
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.getValue("name"),
    enableSorting: true,
  },
  {
    accessorKey: "email", 
    header: "Email",
    cell: ({ row }) => row.getValue("email"),
    enableSorting: true,
  },
  {
    accessorKey: "role",
    header: "Role", 
    cell: ({ row }) => row.getValue("role"),
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.getValue("status"),
    enableSorting: true,
  },
  {
    accessorKey: "age",
    header: "Age",
    cell: ({ row }) => row.getValue("age"),
    enableSorting: true,
  },
];

// Mock data with varying values for sorting
const mockUsers: TestUser[] = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", age: 25 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "user", status: "inactive", age: 30 },
  { id: "3", name: "Charlie", email: "charlie@example.com", role: "manager", status: "active", age: 35 },
  { id: "4", name: "Diana", email: "diana@example.com", role: "user", status: "active", age: 28 },
  { id: "5", name: "Eve", email: "eve@example.com", role: "admin", status: "inactive", age: 22 },
];

describe("usePersistingSortingLogic Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    setWindowLocation("https://example.com/");
    mockHistory.pushState.mockClear();
    mockHistory.replaceState.mockClear();
  });

  describe("URL persistence", () => {
    it("persists sorting state to URL and retrieves it", () => {
      const { result: sortingHook } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          persistence: {
            sorting: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [sorting, setSorting] = React.useState<SortingState>(
          sortingHook.current.initialSortingState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { sorting },
          onSortingChange: (updater) => {
            sortingHook.current.handleSortingChange?.(updater, sorting);
            setSorting(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getSortedRowModel: getSortedRowModel(),
          enableSorting: true,
        });

        return { table, sorting };
      });

      expect(tableHook.current.sorting).toEqual([]);

      // Sort by name column ascending
      act(() => {
        tableHook.current.table.getColumn("name")?.toggleSorting(false);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "name", desc: false }]);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.sortingColumn=name")
      );
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.sortingDirection=asc")
      );

      // Sort by name column descending
      act(() => {
        tableHook.current.table.getColumn("name")?.toggleSorting(true);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "name", desc: true }]);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.sortingDirection=desc")
      );
    });

    it("reads initial state from URL parameters", () => {
      // Set up URL with sorting parameters
      setWindowLocation("https://example.com/?table.sortingColumn=email&table.sortingDirection=desc");

      const { result } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          initialState: {
            sorting: [{ id: "name", desc: false }],
          },
          persistence: {
            sorting: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      // Should read from URL instead of initial state
      expect(result.current.initialSortingState).toEqual([
        { id: "email", desc: true },
      ]);
    });

    it("uses custom keys for URL parameters", () => {
      const { result: sortingHook } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          persistence: {
            sorting: {
              persistenceStorage: "url",
              sortingColumnKey: "col",
              sortingDirectionKey: "dir",
            },
            urlNamespace: "custom",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [sorting, setSorting] = React.useState<SortingState>(
          sortingHook.current.initialSortingState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { sorting },
          onSortingChange: (updater) => {
            sortingHook.current.handleSortingChange?.(updater, sorting);
            setSorting(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getSortedRowModel: getSortedRowModel(),
          enableSorting: true,
        });

        return { table, sorting };
      });

      // Sort by role column
      act(() => {
        tableHook.current.table.getColumn("role")?.toggleSorting(false);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "role", desc: false }]);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("custom.col=role")
      );
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("custom.dir=asc")
      );
    });
  });

  describe("localStorage persistence", () => {
    it("persists sorting state to localStorage and retrieves it", () => {
      const { result: sortingHook } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          persistence: {
            sorting: {
              persistenceStorage: "localStorage",
            },
            localStorageKey: "table-sorting",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [sorting, setSorting] = React.useState<SortingState>(
          sortingHook.current.initialSortingState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { sorting },
          onSortingChange: (updater) => {
            sortingHook.current.handleSortingChange?.(updater, sorting);
            setSorting(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getSortedRowModel: getSortedRowModel(),
          enableSorting: true,
        });

        return { table, sorting };
      });

      // Sort by age column descending
      act(() => {
        tableHook.current.table.getColumn("age")?.toggleSorting(true);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "age", desc: true }]);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "table-sorting",
        expect.stringContaining('"sortingColumn":"age"')
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "table-sorting", 
        expect.stringContaining('"sortingDirection":"desc"')
      );
    });

    it("reads initial state from localStorage", () => {
      mockLocalStorage.setItem("sorting-store", JSON.stringify({ 
        sortingColumn: "status", 
        sortingDirection: "asc" 
      }));

      const { result } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          initialState: {
            sorting: [{ id: "name", desc: false }],
          },
          persistence: {
            sorting: {
              persistenceStorage: "localStorage",
            },
            localStorageKey: "sorting-store",
          },
        })
      );

      // Should read from localStorage instead of initial state
      expect(result.current.initialSortingState).toEqual([
        { id: "status", desc: false },
      ]);
    });
  });

  describe("sorting behaviors", () => {
    it("handles single column sorting with direction changes", () => {
      const { result: sortingHook } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          persistence: {
            sorting: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [sorting, setSorting] = React.useState<SortingState>(
          sortingHook.current.initialSortingState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { sorting },
          onSortingChange: (updater) => {
            sortingHook.current.handleSortingChange?.(updater, sorting);
            setSorting(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getSortedRowModel: getSortedRowModel(),
          enableSorting: true,
          enableMultiSort: false, // Single column sorting only
        });

        return { table, sorting };
      });

      // Initial state - no sorting
      expect(tableHook.current.sorting).toEqual([]);

      // Sort by name ascending
      act(() => {
        tableHook.current.table.getColumn("name")?.toggleSorting(false);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "name", desc: false }]);
      
      // Verify data is sorted correctly
      const sortedRows = tableHook.current.table.getSortedRowModel().rows;
      expect(sortedRows[0].original.name).toBe("Alice"); // First alphabetically
      
      // Toggle to descending
      act(() => {
        tableHook.current.table.getColumn("name")?.toggleSorting();
      });

      expect(tableHook.current.sorting).toEqual([{ id: "name", desc: true }]);
      
      // Verify data is sorted descending
      const sortedRowsDesc = tableHook.current.table.getSortedRowModel().rows;
      expect(sortedRowsDesc[0].original.name).toBe("Eve"); // Last alphabetically

      // Clear sorting
      act(() => {
        tableHook.current.table.resetSorting();
      });

      expect(tableHook.current.sorting).toEqual([]);
    });

    it("handles switching between different columns", () => {
      const { result: sortingHook } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          persistence: {
            sorting: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [sorting, setSorting] = React.useState<SortingState>(
          sortingHook.current.initialSortingState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { sorting },
          onSortingChange: (updater) => {
            sortingHook.current.handleSortingChange?.(updater, sorting);
            setSorting(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getSortedRowModel: getSortedRowModel(),
          enableSorting: true,
          enableMultiSort: false,
        });

        return { table, sorting };
      });

      // Sort by name
      act(() => {
        tableHook.current.table.getColumn("name")?.toggleSorting(false);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "name", desc: false }]);

      // Switch to sorting by age
      act(() => {
        tableHook.current.table.getColumn("age")?.toggleSorting(false);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "age", desc: false }]);

      // Verify age sorting
      const sortedByAge = tableHook.current.table.getSortedRowModel().rows;
      expect(sortedByAge[0].original.age).toBe(22); // Youngest first
      expect(sortedByAge[sortedByAge.length - 1].original.age).toBe(35); // Oldest last
    });
  });

  describe("function updaters", () => {
    it("handles function-based sorting updates", () => {
      const { result: sortingHook } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          persistence: {
            sorting: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [sorting, setSorting] = React.useState<SortingState>(
          sortingHook.current.initialSortingState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { sorting },
          onSortingChange: (updater) => {
            sortingHook.current.handleSortingChange?.(updater, sorting);
            setSorting(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getSortedRowModel: getSortedRowModel(),
          enableSorting: true,
        });

        return { table, sorting };
      });

      // Use function updater to set sorting
      act(() => {
        tableHook.current.table.setSorting([{ id: "email", desc: true }]);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "email", desc: true }]);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.sortingColumn=email")
      );
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.sortingDirection=desc")
      );
    });
  });

  describe("initial state persistence", () => {
    it("persists initial state when no existing persisted values", () => {
      const { result } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          initialState: {
            sorting: [{ id: "name", desc: true }],
          },
          persistence: {
            sorting: {
              persistenceStorage: "localStorage",
            },
          },
        })
      );

      // Should use initial state
      expect(result.current.initialSortingState).toEqual([
        { id: "name", desc: true },
      ]);

      // Should persist the initial state
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "sorting",
        expect.stringContaining('"sortingColumn":"name"')
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "sorting",
        expect.stringContaining('"sortingDirection":"desc"')
      );
    });

    it("does not persist initial state when persisted values already exist", () => {
      // Pre-existing values
      mockLocalStorage.setItem("existing-sorting", JSON.stringify({ 
        sortingColumn: "age", 
        sortingDirection: "asc" 
      }));

      const { result } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          initialState: {
            sorting: [{ id: "name", desc: false }],
          },
          persistence: {
            sorting: {
              persistenceStorage: "localStorage",
            },
            localStorageKey: "existing-sorting",
          },
        })
      );

      // Should use existing values instead of initial state
      expect(result.current.initialSortingState).toEqual([
        { id: "age", desc: false },
      ]);

      // Should not have excessive persistence calls for initial state
      const setItemCalls = mockLocalStorage.setItem.mock.calls.filter(
        ([key]) => key === "existing-sorting"
      );
      expect(setItemCalls.length).toBeLessThanOrEqual(2);
    });
  });

  describe("error handling", () => {
    it("handles malformed URL parameters gracefully", () => {
      setWindowLocation("https://example.com/?table.sortingColumn=name&table.sortingDirection=invaliddir");

      const { result } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          initialState: {
            sorting: [{ id: "email", desc: false }],
          },
          persistence: {
            sorting: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      // Should fall back to initial state when direction is invalid
      expect(result.current.initialSortingState).toEqual([
        { id: "email", desc: false }, // Falls back to initial state since "invaliddir" is not a valid direction
      ]);
    });

    it("handles partial URL parameters gracefully", () => {
      // Only column, no direction
      setWindowLocation("https://example.com/?table.sortingColumn=name");

      const { result } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          initialState: {
            sorting: [{ id: "email", desc: false }],
          },
          persistence: {
            sorting: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      // Should fall back to initial state when incomplete
      expect(result.current.initialSortingState).toEqual([
        { id: "email", desc: false },
      ]);
    });

    it("handles localStorage JSON parse errors gracefully", () => {
      mockLocalStorage.setItem("broken-sorting", "invalid json");

      const { result } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          initialState: {
            sorting: [{ id: "role", desc: true }],
          },
          persistence: {
            sorting: {
              persistenceStorage: "localStorage",
            },
            localStorageKey: "broken-sorting",
          },
        })
      );

      // Should fall back to initial state when localStorage values are invalid
      expect(result.current.initialSortingState).toEqual([
        { id: "role", desc: true },
      ]);
    });
  });

  describe("no persistence configuration", () => {
    it("returns undefined handler when persistence is not configured", () => {
      const { result } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          initialState: {
            sorting: [{ id: "name", desc: false }],
          },
        })
      );

      expect(result.current.handleSortingChange).toBeUndefined();
      expect(result.current.initialSortingState).toEqual([
        { id: "name", desc: false },
      ]);
    });
  });

  describe("real-world sorting scenarios", () => {
    it("simulates user sorting data in a complex table workflow", () => {
      const { result: sortingHook } = renderHook(() =>
        usePersistingSortingLogic({
          columns: testColumns,
          initialState: {
            sorting: [],
          },
          persistence: {
            sorting: {
              persistenceStorage: "url",
            },
            urlNamespace: "users",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [sorting, setSorting] = React.useState<SortingState>(
          sortingHook.current.initialSortingState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { sorting },
          onSortingChange: (updater) => {
            sortingHook.current.handleSortingChange?.(updater, sorting);
            setSorting(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getSortedRowModel: getSortedRowModel(),
          enableSorting: true,
          enableMultiSort: false,
        });

        return { table, sorting };
      });

      expect(tableHook.current.sorting).toEqual([]);
      
      // Initial unsorted data
      const unsortedRows = tableHook.current.table.getCoreRowModel().rows;
      expect(unsortedRows[0].original.name).toBe("Alice");

      // Sort by name ascending
      act(() => {
        tableHook.current.table.getColumn("name")?.toggleSorting(false);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "name", desc: false }]);
      
      let sortedRows = tableHook.current.table.getSortedRowModel().rows;
      expect(sortedRows[0].original.name).toBe("Alice");
      expect(sortedRows[4].original.name).toBe("Eve");

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.sortingColumn=name")
      );

      // Change to descending
      act(() => {
        tableHook.current.table.getColumn("name")?.toggleSorting(true);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "name", desc: true }]);
      
      sortedRows = tableHook.current.table.getSortedRowModel().rows;
      expect(sortedRows[0].original.name).toBe("Eve");
      expect(sortedRows[4].original.name).toBe("Alice");

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.sortingDirection=desc")
      );

      // Switch to age column
      act(() => {
        tableHook.current.table.getColumn("age")?.toggleSorting(false);
      });

      expect(tableHook.current.sorting).toEqual([{ id: "age", desc: false }]);
      
      sortedRows = tableHook.current.table.getSortedRowModel().rows;
      expect(sortedRows[0].original.age).toBe(22); // Eve - youngest
      expect(sortedRows[4].original.age).toBe(35); // Charlie - oldest

      // Clear all sorting
      act(() => {
        tableHook.current.table.resetSorting();
      });

      expect(tableHook.current.sorting).toEqual([]);
      
      // Should remove URL parameters when no sorting
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.not.stringContaining("users.sortingColumn=")
      );
    });
  });
});