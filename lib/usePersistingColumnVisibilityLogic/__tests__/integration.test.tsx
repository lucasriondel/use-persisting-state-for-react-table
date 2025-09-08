import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSharedBuckets } from "../../__tests__/createMockSharedBuckets";
import { PersistingTableOptions } from "../../usePersistingStateForReactTable";
import { usePersistingColumnVisibilityLogic } from "../index";

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
}

// Test columns
const testColumns: ColumnDef<TestUser>[] = [
  {
    id: "select",
    header: "Select",
    cell: () => "checkbox",
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.getValue<string>("name"),
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
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.getValue<string>("status"),
  },
];

// Mock data
const mockUsers: TestUser[] = Array.from({ length: 10 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: "user",
  status: "active",
}));

describe("usePersistingColumnVisibilityLogic Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    setWindowLocation("https://example.com/");
    mockHistory.pushState.mockClear();
    mockHistory.replaceState.mockClear();
  });

  describe("URL persistence", () => {
    it("persists column visibility state to URL and retrieves it", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          columnVisibility: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: visibilityHook } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [columnVisibility, setColumnVisibility] =
          React.useState<VisibilityState>(
            visibilityHook.current.initialColumnVisibilityState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnVisibility },
          onColumnVisibilityChange: (updater) => {
            visibilityHook.current.handleColumnVisibilityChange?.(
              updater,
              columnVisibility
            );
            setColumnVisibility(updater);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, columnVisibility };
      });

      // Hide email column
      act(() => {
        tableHook.current.table.getColumn("email")?.toggleVisibility(false);
      });

      expect(tableHook.current.columnVisibility.email).toBe(false);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.columnVisibility=")
      );
    });

    it("reads initial state from URL parameters", () => {
      // Set up URL with column visibility parameters
      const visibilityState = { email: false, role: false };
      const encodedState = encodeURIComponent(JSON.stringify(visibilityState));
      setWindowLocation(
        `https://example.com/?table.columnVisibility=${encodedState}`
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          columnVisibility: {
            name: false,
          },
        },
        persistence: {
          columnVisibility: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      // Should read from URL instead of initial state
      expect(result.current.initialColumnVisibilityState).toEqual({
        email: false,
        role: false,
      });
    });

    it("uses custom key for URL parameters", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          columnVisibility: {
            persistenceStorage: "url",
            key: "cols",
          },
          urlNamespace: "custom",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: visibilityHook } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [columnVisibility, setColumnVisibility] =
          React.useState<VisibilityState>(
            visibilityHook.current.initialColumnVisibilityState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnVisibility },
          onColumnVisibilityChange: (updater) => {
            visibilityHook.current.handleColumnVisibilityChange?.(
              updater,
              columnVisibility
            );
            setColumnVisibility(updater);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, columnVisibility };
      });

      // Hide status column
      act(() => {
        tableHook.current.table.getColumn("status")?.toggleVisibility(false);
      });

      expect(tableHook.current.columnVisibility.status).toBe(false);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("custom.cols=")
      );
    });
  });

  describe("localStorage persistence", () => {
    it("persists column visibility state to localStorage and retrieves it", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          columnVisibility: {
            persistenceStorage: "localStorage",
          },
          localStorageKey: "table-visibility",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: visibilityHook } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [columnVisibility, setColumnVisibility] =
          React.useState<VisibilityState>(
            visibilityHook.current.initialColumnVisibilityState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnVisibility },
          onColumnVisibilityChange: (updater) => {
            visibilityHook.current.handleColumnVisibilityChange?.(
              updater,
              columnVisibility
            );
            setColumnVisibility(updater);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, columnVisibility };
      });

      // Hide name and email columns
      act(() => {
        tableHook.current.table.getColumn("name")?.toggleVisibility(false);
        tableHook.current.table.getColumn("email")?.toggleVisibility(false);
      });

      expect(tableHook.current.columnVisibility.name).toBe(false);
      expect(tableHook.current.columnVisibility.email).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "table-visibility",
        expect.stringContaining('"columnVisibility"')
      );
    });

    it("reads initial state from localStorage", () => {
      const visibilityState = { name: false, status: false };
      mockLocalStorage.setItem(
        "visibility-store",
        JSON.stringify({ columnVisibility: visibilityState })
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          columnVisibility: {
            email: false,
          },
        },
        persistence: {
          columnVisibility: {
            persistenceStorage: "localStorage",
          },
          localStorageKey: "visibility-store",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      // Should read from localStorage instead of initial state
      expect(result.current.initialColumnVisibilityState).toEqual({
        name: false,
        status: false,
      });
    });
  });

  describe("function updaters", () => {
    it("handles function-based column visibility updates", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        persistence: {
          columnVisibility: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: visibilityHook } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [columnVisibility, setColumnVisibility] =
          React.useState<VisibilityState>(
            visibilityHook.current.initialColumnVisibilityState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnVisibility },
          onColumnVisibilityChange: (updater) => {
            visibilityHook.current.handleColumnVisibilityChange?.(
              updater,
              columnVisibility
            );
            setColumnVisibility(updater);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, columnVisibility };
      });

      // Use function updater to hide multiple columns
      act(() => {
        tableHook.current.table.setColumnVisibility((prev) => ({
          ...prev,
          email: false,
          role: false,
        }));
      });

      expect(tableHook.current.columnVisibility.email).toBe(false);
      expect(tableHook.current.columnVisibility.role).toBe(false);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.columnVisibility=")
      );
    });
  });

  describe("initial state persistence", () => {
    it("persists initial state when no existing persisted values", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          columnVisibility: {
            email: false,
            status: false,
          },
        },
        persistence: {
          columnVisibility: {
            persistenceStorage: "localStorage",
          },
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      // Should use initial state
      expect(result.current.initialColumnVisibilityState).toEqual({
        email: false,
        status: false,
      });

      // Should persist the initial state
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "data-table",
        expect.stringContaining('"email":false')
      );
    });

    it("does not persist initial state when persisted values already exist", () => {
      // Pre-existing values
      const existingVisibility = { name: false, role: false };
      mockLocalStorage.setItem(
        "existing-visibility",
        JSON.stringify({ columnVisibility: existingVisibility })
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          columnVisibility: {
            email: false,
            status: false,
          },
        },
        persistence: {
          columnVisibility: {
            persistenceStorage: "localStorage",
          },
          localStorageKey: "existing-visibility",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      // Should use existing values instead of initial state
      expect(result.current.initialColumnVisibilityState).toEqual({
        name: false,
        role: false,
      });

      // Should not have excessive persistence calls for initial state
      const setItemCalls = mockLocalStorage.setItem.mock.calls.filter(
        ([key]) => key === "existing-visibility"
      );
      expect(setItemCalls.length).toBeLessThanOrEqual(2);
    });
  });

  describe("error handling", () => {
    it("handles malformed URL parameters gracefully", () => {
      setWindowLocation(
        "https://example.com/?table.columnVisibility=invalidjson"
      );

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          columnVisibility: {
            email: false,
          },
        },
        persistence: {
          columnVisibility: {
            persistenceStorage: "url",
          },
          urlNamespace: "table",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      // Should fall back to initial state when URL values are invalid
      expect(result.current.initialColumnVisibilityState).toEqual({
        email: false,
      });
    });

    it("handles localStorage JSON parse errors gracefully", () => {
      mockLocalStorage.setItem("broken-visibility", "invalid json");

      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          columnVisibility: {
            role: false,
          },
        },
        persistence: {
          columnVisibility: {
            persistenceStorage: "localStorage",
          },
          localStorageKey: "broken-visibility",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      // Should fall back to initial state when localStorage values are invalid
      expect(result.current.initialColumnVisibilityState).toEqual({
        role: false,
      });
    });
  });

  describe("no persistence configuration", () => {
    it("returns undefined handler when persistence is not configured", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          columnVisibility: {
            email: false,
          },
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      expect(result.current.handleColumnVisibilityChange).toBeUndefined();
      expect(result.current.initialColumnVisibilityState).toEqual({
        email: false,
      });
    });
  });

  describe("real-world column visibility scenarios", () => {
    it("simulates user toggling columns in a data table", () => {
      const options: PersistingTableOptions<TestUser> = {
        columns: testColumns,
        initialState: {
          columnVisibility: {
            email: true,
            role: true,
            status: true,
          },
        },
        persistence: {
          columnVisibility: {
            persistenceStorage: "url",
          },
          urlNamespace: "users",
        },
      };

      const sharedBuckets = createMockSharedBuckets(options);

      const { result: visibilityHook } = renderHook(() =>
        usePersistingColumnVisibilityLogic(options, sharedBuckets)
      );

      const { result: tableHook } = renderHook(() => {
        const [columnVisibility, setColumnVisibility] =
          React.useState<VisibilityState>(
            visibilityHook.current.initialColumnVisibilityState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnVisibility },
          onColumnVisibilityChange: (updater) => {
            visibilityHook.current.handleColumnVisibilityChange?.(
              updater,
              columnVisibility
            );
            setColumnVisibility(updater);
          },
          getCoreRowModel: getCoreRowModel(),
        });

        return { table, columnVisibility };
      });

      expect(tableHook.current.columnVisibility.email).toBe(true);
      expect(tableHook.current.columnVisibility.role).toBe(true);

      // Hide email column
      act(() => {
        tableHook.current.table.getColumn("email")?.toggleVisibility(false);
      });

      expect(tableHook.current.columnVisibility.email).toBe(false);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.columnVisibility=")
      );

      // Hide role column
      act(() => {
        tableHook.current.table.getColumn("role")?.toggleVisibility(false);
      });

      expect(tableHook.current.columnVisibility.role).toBe(false);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.columnVisibility=")
      );

      // Show email column again
      act(() => {
        tableHook.current.table.getColumn("email")?.toggleVisibility(true);
      });

      expect(tableHook.current.columnVisibility.email).toBe(true);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.columnVisibility=")
      );

      // Reset all columns to visible using function updater
      act(() => {
        tableHook.current.table.setColumnVisibility({});
      });

      expect(tableHook.current.columnVisibility).toEqual({});
    });
  });
});
