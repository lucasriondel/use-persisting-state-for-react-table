import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSharedBuckets } from "../../__tests__/createMockSharedBuckets";
import { PersistingTableOptions } from "../../usePersistingStateForReactTable";
import { usePersistingGlobalFilterLogic } from "../index";

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
  role: string;
  status: string;
  department: string;
}

// Test columns
const testColumns: ColumnDef<TestUser>[] = [
  {
    id: "select",
    header: "Select",
    cell: () => "checkbox",
    enableGlobalFilter: false,
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
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => row.getValue("role"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.getValue("status"),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => row.getValue("department"),
  },
];

// Mock data with searchable content
const mockUsers: TestUser[] = [
  {
    id: "1",
    name: "Alice Smith",
    email: "alice@example.com",
    role: "admin",
    status: "active",
    department: "Engineering",
  },
  {
    id: "2",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "user",
    status: "inactive",
    department: "Marketing",
  },
  {
    id: "3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    role: "manager",
    status: "active",
    department: "Engineering",
  },
  {
    id: "4",
    name: "Diana Prince",
    email: "diana@example.com",
    role: "user",
    status: "active",
    department: "Sales",
  },
  {
    id: "5",
    name: "Eve Wilson",
    email: "eve@example.com",
    role: "admin",
    status: "inactive",
    department: "HR",
  },
  {
    id: "6",
    name: "Frank Miller",
    email: "frank@example.com",
    role: "user",
    status: "active",
    department: "Engineering",
  },
  {
    id: "7",
    name: "Grace Lee",
    email: "grace@example.com",
    role: "manager",
    status: "active",
    department: "Marketing",
  },
  {
    id: "8",
    name: "Henry Davis",
    email: "henry@example.com",
    role: "user",
    status: "inactive",
    department: "Sales",
  },
];

describe("usePersistingGlobalFilterLogic Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    setWindowLocation("https://example.com/");
    mockHistory.pushState.mockClear();
    mockHistory.replaceState.mockClear();
  });

  describe("URL persistence", () => {
    it("persists global filter state to URL and retrieves it", async () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          globalFilter: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: globalFilterHook } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [globalFilter, setGlobalFilter] = React.useState<string>(
          globalFilterHook.current.initialGlobalFilterState || ""
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { globalFilter },
          onGlobalFilterChange: (updater) => {
            globalFilterHook.current.handleGlobalFilterChange(
              updater,
              globalFilter
            );
            setGlobalFilter(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableGlobalFilter: true,
        });

        return { table, globalFilter };
      });

      expect(tableHook.current.globalFilter).toBe("");
      expect(tableHook.current.table.getFilteredRowModel().rows).toHaveLength(
        8
      );

      // Set global filter
      act(() => {
        tableHook.current.table.setGlobalFilter("Engineering");
      });

      expect(tableHook.current.globalFilter).toBe("Engineering");

      // Should filter to only Engineering department rows
      const filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(3);
      filteredRows.forEach((row) => {
        expect(row.original.department).toBe("Engineering");
      });

      // Wait for debounce and check URL persistence
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.globalFilter=Engineering")
      );
    });

    it("reads initial state from URL parameters", () => {
      // Set up URL with global filter parameter
      setWindowLocation("https://example.com/?table.globalFilter=admin");

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          globalFilter: "user",
        },
        persistence: {
          globalFilter: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      // Should read from URL instead of initial state
      expect(result.current.initialGlobalFilterState).toBe("admin");
    });

    it("uses custom key for URL parameters", async () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          globalFilter: {
            persistenceStorage: "url",
            key: "search",
          },
          urlNamespace: "custom",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: globalFilterHook } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [globalFilter, setGlobalFilter] = React.useState<string>(
          globalFilterHook.current.initialGlobalFilterState || ""
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { globalFilter },
          onGlobalFilterChange: (updater) => {
            globalFilterHook.current.handleGlobalFilterChange(
              updater,
              globalFilter
            );
            setGlobalFilter(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableGlobalFilter: true,
        });

        return { table, globalFilter };
      });

      // Set global filter
      act(() => {
        tableHook.current.table.setGlobalFilter("Marketing");
      });

      expect(tableHook.current.globalFilter).toBe("Marketing");

      // Wait for debounce and check URL persistence
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("custom.search=Marketing")
      );
    });
  });

  describe("localStorage persistence", () => {
    it("persists global filter state to localStorage and retrieves it", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          globalFilter: {
            persistenceStorage: "localStorage",
          },
          localStorageKey: "table-filter",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: globalFilterHook } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [globalFilter, setGlobalFilter] = React.useState<string>(
          globalFilterHook.current.initialGlobalFilterState || ""
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { globalFilter },
          onGlobalFilterChange: (updater) => {
            globalFilterHook.current.handleGlobalFilterChange(
              updater,
              globalFilter
            );
            setGlobalFilter(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableGlobalFilter: true,
        });

        return { table, globalFilter };
      });

      // Set global filter to something unique - use "Smith" which only Alice has
      act(() => {
        tableHook.current.table.setGlobalFilter("Smith");
      });

      expect(tableHook.current.globalFilter).toBe("Smith");

      // Should filter to only Alice Smith
      const filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(1);
      expect(filteredRows[0].original.name).toBe("Alice Smith");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "table-filter",
        expect.stringContaining('"globalFilter":"Smith"')
      );
    });

    it("reads initial state from localStorage", () => {
      mockLocalStorage.setItem(
        "filter-store",
        JSON.stringify({ globalFilter: "manager" })
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          globalFilter: "admin",
        },
        persistence: {
          globalFilter: {
            persistenceStorage: "localStorage",
          },
          localStorageKey: "filter-store",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      // Should read from localStorage instead of initial state
      expect(result.current.initialGlobalFilterState).toBe("manager");
    });
  });

  describe("global filter behaviors", () => {
    it("filters data across all columns correctly", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          globalFilter: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: globalFilterHook } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [globalFilter, setGlobalFilter] = React.useState<string>(
          globalFilterHook.current.initialGlobalFilterState || ""
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { globalFilter },
          onGlobalFilterChange: (updater) => {
            globalFilterHook.current.handleGlobalFilterChange(
              updater,
              globalFilter
            );
            setGlobalFilter(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableGlobalFilter: true,
        });

        return { table, globalFilter };
      });

      // Filter by name
      act(() => {
        tableHook.current.table.setGlobalFilter("Alice");
      });

      let filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(1);
      expect(filteredRows[0].original.name).toBe("Alice Smith");

      // Filter by email domain
      act(() => {
        tableHook.current.table.setGlobalFilter("@example.com");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(8); // All users have @example.com

      // Filter by role
      act(() => {
        tableHook.current.table.setGlobalFilter("manager");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(2);
      filteredRows.forEach((row) => {
        expect(row.original.role).toBe("manager");
      });

      // Clear filter
      act(() => {
        tableHook.current.table.setGlobalFilter("");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(8); // All rows visible
    });

    it("handles case-insensitive filtering", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          globalFilter: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: globalFilterHook } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [globalFilter, setGlobalFilter] = React.useState<string>(
          globalFilterHook.current.initialGlobalFilterState || ""
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { globalFilter },
          onGlobalFilterChange: (updater) => {
            globalFilterHook.current.handleGlobalFilterChange(
              updater,
              globalFilter
            );
            setGlobalFilter(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableGlobalFilter: true,
        });

        return { table, globalFilter };
      });

      // Test uppercase
      act(() => {
        tableHook.current.table.setGlobalFilter("ENGINEERING");
      });

      let filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(3);

      // Test lowercase
      act(() => {
        tableHook.current.table.setGlobalFilter("engineering");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(3);

      // Test mixed case
      act(() => {
        tableHook.current.table.setGlobalFilter("eNgInEeRiNg");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(3);
    });
  });

  describe("function updaters", () => {
    it("handles function-based global filter updates", async () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          globalFilter: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: globalFilterHook } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [globalFilter, setGlobalFilter] = React.useState<string>(
          globalFilterHook.current.initialGlobalFilterState || ""
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { globalFilter },
          onGlobalFilterChange: (updater) => {
            globalFilterHook.current.handleGlobalFilterChange(
              updater,
              globalFilter
            );
            setGlobalFilter(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableGlobalFilter: true,
        });

        return { table, globalFilter };
      });

      // Use function updater
      act(() => {
        tableHook.current.table.setGlobalFilter((prev) => prev + "Sales");
      });

      expect(tableHook.current.globalFilter).toBe("Sales");

      const filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(2);
      filteredRows.forEach((row) => {
        expect(row.original.department).toBe("Sales");
      });

      // Wait for debounce and check URL persistence
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.globalFilter=Sales")
      );
    });
  });

  describe("initial state persistence", () => {
    it("persists initial state when no existing persisted values", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          globalFilter: "admin",
        },
        persistence: {
          globalFilter: {
            persistenceStorage: "localStorage",
          },
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      // Should use initial state
      expect(result.current.initialGlobalFilterState).toBe("admin");

      // Should persist the initial state
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "data-table",
        expect.stringContaining('"globalFilter":"admin"')
      );
    });

    it("does not persist initial state when persisted values already exist", () => {
      // Pre-existing values
      mockLocalStorage.setItem(
        "existing-filter",
        JSON.stringify({ globalFilter: "Marketing" })
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          globalFilter: "Engineering",
        },
        persistence: {
          globalFilter: {
            persistenceStorage: "localStorage",
          },
          localStorageKey: "existing-filter",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      // Should use existing values instead of initial state
      expect(result.current.initialGlobalFilterState).toBe("Marketing");

      // Should not have excessive persistence calls for initial state
      const setItemCalls = mockLocalStorage.setItem.mock.calls.filter(
        ([key]) => key === "existing-filter"
      );
      expect(setItemCalls.length).toBeLessThanOrEqual(2);
    });
  });

  describe("error handling", () => {
    it("handles non-string URL parameters gracefully", () => {
      // Set up URL with non-string global filter parameter
      const encodedObject = encodeURIComponent(
        JSON.stringify({ search: "test" })
      );
      setWindowLocation(
        `https://example.com/?table.globalFilter=${encodedObject}`
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          globalFilter: "fallback",
        },
        persistence: {
          globalFilter: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      // Should fall back to initial state when URL value is not a string
      expect(result.current.initialGlobalFilterState).toBe("fallback");
    });

    it("handles localStorage with non-string values gracefully", () => {
      mockLocalStorage.setItem(
        "filter-store",
        JSON.stringify({ globalFilter: { search: "object" } })
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          globalFilter: "fallback",
        },
        persistence: {
          globalFilter: {
            persistenceStorage: "localStorage",
          },
          localStorageKey: "filter-store",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      // Should fall back to initial state when localStorage value is not a string
      expect(result.current.initialGlobalFilterState).toBe("fallback");
    });

    it("handles localStorage JSON parse errors gracefully", () => {
      mockLocalStorage.setItem("broken-filter", "invalid json");

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          globalFilter: "fallback",
        },
        persistence: {
          globalFilter: {
            persistenceStorage: "localStorage",
          },
          localStorageKey: "broken-filter",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      // Should fall back to initial state when localStorage values are invalid
      expect(result.current.initialGlobalFilterState).toBe("fallback");
    });
  });

  describe("no persistence configuration", () => {
    it("returns handler even when persistence is not configured", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          globalFilter: "test",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      // Unlike other hooks, global filter always returns a handler
      expect(result.current.handleGlobalFilterChange).toBeDefined();
      expect(result.current.initialGlobalFilterState).toBe("test");
    });
  });

  describe("real-world global filter scenarios", () => {
    it("simulates user searching and filtering data in a complex workflow", async () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          globalFilter: "",
        },
        persistence: {
          globalFilter: {
            persistenceStorage: "url",
            key: "search",
          },
          urlNamespace: "users",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: globalFilterHook } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [globalFilter, setGlobalFilter] = React.useState<string>(
          globalFilterHook.current.initialGlobalFilterState || ""
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { globalFilter },
          onGlobalFilterChange: (updater) => {
            globalFilterHook.current.handleGlobalFilterChange(
              updater,
              globalFilter
            );
            setGlobalFilter(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableGlobalFilter: true,
        });

        return { table, globalFilter };
      });

      expect(tableHook.current.globalFilter).toBe("");
      expect(tableHook.current.table.getFilteredRowModel().rows).toHaveLength(
        8
      );

      // Search for users in Engineering
      act(() => {
        tableHook.current.table.setGlobalFilter("Engineering");
      });

      expect(tableHook.current.globalFilter).toBe("Engineering");
      let filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(3);
      expect(filteredRows.map((r) => r.original.name)).toEqual([
        "Alice Smith",
        "Charlie Brown",
        "Frank Miller",
      ]);

      // Wait for debounce and check URL persistence
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.search=Engineering")
      );

      // Refine search to Marketing department
      act(() => {
        tableHook.current.table.setGlobalFilter("Marketing");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(2); // Bob and Grace are in Marketing

      // Search for specific user by name
      act(() => {
        tableHook.current.table.setGlobalFilter("Alice");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(1);
      expect(filteredRows[0].original.name).toBe("Alice Smith");

      // Search by partial email
      act(() => {
        tableHook.current.table.setGlobalFilter("bob@");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(1);
      expect(filteredRows[0].original.email).toBe("bob@example.com");

      // Clear search
      act(() => {
        tableHook.current.table.setGlobalFilter("");
      });

      expect(tableHook.current.globalFilter).toBe("");
      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(8); // All users visible again

      // Should update URL to remove search parameter
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.search=")
      );
    });

    it("handles complex search patterns and special characters", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          globalFilter: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: globalFilterHook } = renderHook(() =>
        usePersistingGlobalFilterLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [globalFilter, setGlobalFilter] = React.useState<string>(
          globalFilterHook.current.initialGlobalFilterState || ""
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { globalFilter },
          onGlobalFilterChange: (updater) => {
            globalFilterHook.current.handleGlobalFilterChange(
              updater,
              globalFilter
            );
            setGlobalFilter(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableGlobalFilter: true,
        });

        return { table, globalFilter };
      });

      // Search with spaces
      act(() => {
        tableHook.current.table.setGlobalFilter("Alice Smith");
      });

      let filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(1);
      expect(filteredRows[0].original.name).toBe("Alice Smith");

      // Search with special characters
      act(() => {
        tableHook.current.table.setGlobalFilter("@example.com");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(8); // All emails contain @example.com

      // Test with partial matches
      act(() => {
        tableHook.current.table.setGlobalFilter("e");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows.length).toBeGreaterThan(0); // Many fields contain 'e'
    });
  });
});
