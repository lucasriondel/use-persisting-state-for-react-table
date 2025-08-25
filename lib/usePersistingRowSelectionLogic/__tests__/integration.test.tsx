import {
  ColumnDef,
  getCoreRowModel,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePersistingRowSelectionLogic } from "../index";

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

// Test columns with selection support
const testColumns: ColumnDef<TestUser>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
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
];

// Mock data
const mockUsers: TestUser[] = Array.from({ length: 10 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: "user",
  status: "active",
}));

describe("usePersistingRowSelectionLogic Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    setWindowLocation("https://example.com/");
    mockHistory.pushState.mockClear();
    mockHistory.replaceState.mockClear();
  });

  describe("URL persistence", () => {
    it("persists row selection state to URL and retrieves it", () => {
      const { result: rowSelectionHook } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          persistence: {
            rowSelection: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [rowSelection, setRowSelection] =
          React.useState<RowSelectionState>(
            rowSelectionHook.current.initialRowSelectionState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { rowSelection },
          onRowSelectionChange: (updater) => {
            rowSelectionHook.current.handleRowSelectionChange?.(
              updater,
              rowSelection
            );
            setRowSelection(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          enableRowSelection: true,
        });

        return { table, rowSelection };
      });

      expect(tableHook.current.rowSelection).toEqual({});

      // Select first row
      act(() => {
        tableHook.current.table.getRow("0").toggleSelected(true);
      });

      expect(tableHook.current.rowSelection["0"]).toBe(true);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.rowSelection=")
      );

      // Select second row
      act(() => {
        tableHook.current.table.getRow("1").toggleSelected(true);
      });

      expect(tableHook.current.rowSelection["1"]).toBe(true);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.rowSelection=")
      );
    });

    it("reads initial state from URL parameters", () => {
      // Set up URL with row selection parameters
      const selectionState = { "0": true, "2": true };
      const encodedState = encodeURIComponent(JSON.stringify(selectionState));
      setWindowLocation(
        `https://example.com/?table.rowSelection=${encodedState}`
      );

      const { result } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          initialState: {
            rowSelection: {
              "1": true,
            },
          },
          persistence: {
            rowSelection: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      // Should read from URL instead of initial state
      expect(result.current.initialRowSelectionState).toEqual({
        "0": true,
        "2": true,
      });
    });

    it("uses custom key for URL parameters", () => {
      const { result: rowSelectionHook } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          persistence: {
            rowSelection: {
              persistenceStorage: "url",
              key: "selected",
            },
            urlNamespace: "custom",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [rowSelection, setRowSelection] =
          React.useState<RowSelectionState>(
            rowSelectionHook.current.initialRowSelectionState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { rowSelection },
          onRowSelectionChange: (updater) => {
            rowSelectionHook.current.handleRowSelectionChange?.(
              updater,
              rowSelection
            );
            setRowSelection(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          enableRowSelection: true,
        });

        return { table, rowSelection };
      });

      // Select third row
      act(() => {
        tableHook.current.table.getRow("2").toggleSelected(true);
      });

      expect(tableHook.current.rowSelection["2"]).toBe(true);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("custom.selected=")
      );
    });
  });

  describe("localStorage persistence", () => {
    it("persists row selection state to localStorage and retrieves it", () => {
      const { result: rowSelectionHook } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          persistence: {
            rowSelection: {
              persistenceStorage: "localStorage",
            },
            localStorageKey: "table-selection",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [rowSelection, setRowSelection] =
          React.useState<RowSelectionState>(
            rowSelectionHook.current.initialRowSelectionState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { rowSelection },
          onRowSelectionChange: (updater) => {
            rowSelectionHook.current.handleRowSelectionChange?.(
              updater,
              rowSelection
            );
            setRowSelection(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          enableRowSelection: true,
        });

        return { table, rowSelection };
      });

      // Select multiple rows
      act(() => {
        tableHook.current.table.getRow("0").toggleSelected(true);
        tableHook.current.table.getRow("3").toggleSelected(true);
        tableHook.current.table.getRow("5").toggleSelected(true);
      });

      expect(tableHook.current.rowSelection["0"]).toBe(true);
      expect(tableHook.current.rowSelection["3"]).toBe(true);
      expect(tableHook.current.rowSelection["5"]).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "table-selection",
        expect.stringContaining('"rowSelection"')
      );
    });

    it("reads initial state from localStorage", () => {
      const selectionState = { "1": true, "4": true };
      mockLocalStorage.setItem(
        "selection-store",
        JSON.stringify({ rowSelection: selectionState })
      );

      const { result } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          initialState: {
            rowSelection: {
              "2": true,
            },
          },
          persistence: {
            rowSelection: {
              persistenceStorage: "localStorage",
            },
            localStorageKey: "selection-store",
          },
        })
      );

      // Should read from localStorage instead of initial state
      expect(result.current.initialRowSelectionState).toEqual({
        "1": true,
        "4": true,
      });
    });
  });

  describe("row selection behaviors", () => {
    it("handles select all and deselect all operations", () => {
      const { result: rowSelectionHook } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          persistence: {
            rowSelection: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [rowSelection, setRowSelection] =
          React.useState<RowSelectionState>(
            rowSelectionHook.current.initialRowSelectionState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { rowSelection },
          onRowSelectionChange: (updater) => {
            rowSelectionHook.current.handleRowSelectionChange?.(
              updater,
              rowSelection
            );
            setRowSelection(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          enableRowSelection: true,
        });

        return { table, rowSelection };
      });

      // Select all rows
      act(() => {
        tableHook.current.table.toggleAllRowsSelected(true);
      });

      // Should have all rows selected
      expect(Object.keys(tableHook.current.rowSelection)).toHaveLength(10);
      Object.keys(tableHook.current.rowSelection).forEach((key) => {
        expect(tableHook.current.rowSelection[key]).toBe(true);
      });

      // Deselect all rows
      act(() => {
        tableHook.current.table.toggleAllRowsSelected(false);
      });

      // Should have no rows selected
      expect(tableHook.current.rowSelection).toEqual({});

      // When no rows are selected, the key should be removed from URL
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.not.stringContaining("table.rowSelection=")
      );
    });

    it("handles individual row toggle operations", () => {
      const { result: rowSelectionHook } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          persistence: {
            rowSelection: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [rowSelection, setRowSelection] =
          React.useState<RowSelectionState>(
            rowSelectionHook.current.initialRowSelectionState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { rowSelection },
          onRowSelectionChange: (updater) => {
            rowSelectionHook.current.handleRowSelectionChange?.(
              updater,
              rowSelection
            );
            setRowSelection(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          enableRowSelection: true,
        });

        return { table, rowSelection };
      });

      // Select row 0
      act(() => {
        tableHook.current.table.getRow("0").toggleSelected(true);
      });

      expect(tableHook.current.rowSelection["0"]).toBe(true);

      // Select row 1
      act(() => {
        tableHook.current.table.getRow("1").toggleSelected(true);
      });

      expect(tableHook.current.rowSelection["1"]).toBe(true);

      // Deselect row 0
      act(() => {
        tableHook.current.table.getRow("0").toggleSelected(false);
      });

      expect(tableHook.current.rowSelection["0"]).toBeUndefined();
      expect(tableHook.current.rowSelection["1"]).toBe(true);
    });
  });

  describe("function updaters", () => {
    it("handles function-based row selection updates", () => {
      const { result: rowSelectionHook } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          persistence: {
            rowSelection: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [rowSelection, setRowSelection] =
          React.useState<RowSelectionState>(
            rowSelectionHook.current.initialRowSelectionState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { rowSelection },
          onRowSelectionChange: (updater) => {
            rowSelectionHook.current.handleRowSelectionChange?.(
              updater,
              rowSelection
            );
            setRowSelection(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          enableRowSelection: true,
        });

        return { table, rowSelection };
      });

      // Use function updater to select specific rows
      act(() => {
        tableHook.current.table.setRowSelection((prev) => ({
          ...prev,
          "0": true,
          "2": true,
          "4": true,
        }));
      });

      expect(tableHook.current.rowSelection["0"]).toBe(true);
      expect(tableHook.current.rowSelection["2"]).toBe(true);
      expect(tableHook.current.rowSelection["4"]).toBe(true);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.rowSelection=")
      );
    });
  });

  describe("initial state persistence", () => {
    it("persists initial state when no existing persisted values", () => {
      const { result } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          initialState: {
            rowSelection: {
              "0": true,
              "2": true,
            },
          },
          persistence: {
            rowSelection: {
              persistenceStorage: "localStorage",
            },
          },
        })
      );

      // Should use initial state
      expect(result.current.initialRowSelectionState).toEqual({
        "0": true,
        "2": true,
      });

      // Should persist the initial state
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "rowSelection",
        expect.stringContaining('"0":true')
      );
    });

    it("does not persist initial state when persisted values already exist", () => {
      // Pre-existing values
      const existingSelection = { "1": true, "3": true };
      mockLocalStorage.setItem(
        "existing-selection",
        JSON.stringify({ rowSelection: existingSelection })
      );

      const { result } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          initialState: {
            rowSelection: {
              "0": true,
              "4": true,
            },
          },
          persistence: {
            rowSelection: {
              persistenceStorage: "localStorage",
            },
            localStorageKey: "existing-selection",
          },
        })
      );

      // Should use existing values instead of initial state
      expect(result.current.initialRowSelectionState).toEqual({
        "1": true,
        "3": true,
      });

      // Should not have excessive persistence calls for initial state
      const setItemCalls = mockLocalStorage.setItem.mock.calls.filter(
        ([key]) => key === "existing-selection"
      );
      expect(setItemCalls.length).toBeLessThanOrEqual(2);
    });
  });

  describe("error handling", () => {
    it("handles malformed URL parameters gracefully", () => {
      setWindowLocation("https://example.com/?table.rowSelection=invalidjson");

      const { result } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          initialState: {
            rowSelection: {
              "1": true,
            },
          },
          persistence: {
            rowSelection: {
              persistenceStorage: "url",
            },
            urlNamespace: "table",
          },
        })
      );

      // The hook returns the raw value as-is (current behavior)
      expect(result.current.initialRowSelectionState).toBe("invalidjson");
    });

    it("handles localStorage JSON parse errors gracefully", () => {
      mockLocalStorage.setItem("broken-selection", "invalid json");

      const { result } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          initialState: {
            rowSelection: {
              "2": true,
            },
          },
          persistence: {
            rowSelection: {
              persistenceStorage: "localStorage",
            },
            localStorageKey: "broken-selection",
          },
        })
      );

      // Should fall back to initial state when localStorage values are invalid
      expect(result.current.initialRowSelectionState).toEqual({
        "2": true,
      });
    });
  });

  describe("no persistence configuration", () => {
    it("returns undefined handler when persistence is not configured", () => {
      const { result } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          initialState: {
            rowSelection: {
              "1": true,
            },
          },
        })
      );

      expect(result.current.handleRowSelectionChange).toBeUndefined();
      expect(result.current.initialRowSelectionState).toEqual({
        "1": true,
      });
    });
  });

  describe("real-world row selection scenarios", () => {
    it("simulates user selecting rows in a data table with filtering behavior", () => {
      const { result: rowSelectionHook } = renderHook(() =>
        usePersistingRowSelectionLogic({
          columns: testColumns,
          initialState: {
            rowSelection: {},
          },
          persistence: {
            rowSelection: {
              persistenceStorage: "url",
            },
            urlNamespace: "users",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [rowSelection, setRowSelection] =
          React.useState<RowSelectionState>(
            rowSelectionHook.current.initialRowSelectionState || {}
          );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { rowSelection },
          onRowSelectionChange: (updater) => {
            rowSelectionHook.current.handleRowSelectionChange?.(
              updater,
              rowSelection
            );
            setRowSelection(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          enableRowSelection: true,
        });

        return { table, rowSelection };
      });

      expect(tableHook.current.rowSelection).toEqual({});
      expect(tableHook.current.table.getSelectedRowModel().rows).toHaveLength(
        0
      );

      // Select first three rows
      act(() => {
        tableHook.current.table.getRow("0").toggleSelected(true);
        tableHook.current.table.getRow("1").toggleSelected(true);
        tableHook.current.table.getRow("2").toggleSelected(true);
      });

      expect(tableHook.current.rowSelection).toEqual({
        "0": true,
        "1": true,
        "2": true,
      });
      expect(tableHook.current.table.getSelectedRowModel().rows).toHaveLength(
        3
      );
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.rowSelection=")
      );

      // Deselect middle row
      act(() => {
        tableHook.current.table.getRow("1").toggleSelected(false);
      });

      expect(tableHook.current.rowSelection).toEqual({
        "0": true,
        "2": true,
      });
      expect(tableHook.current.table.getSelectedRowModel().rows).toHaveLength(
        2
      );

      // Select all remaining rows
      act(() => {
        tableHook.current.table.toggleAllRowsSelected(true);
      });

      expect(Object.keys(tableHook.current.rowSelection)).toHaveLength(10);
      expect(tableHook.current.table.getSelectedRowModel().rows).toHaveLength(
        10
      );

      // Clear all selections
      act(() => {
        tableHook.current.table.setRowSelection({});
      });

      expect(tableHook.current.rowSelection).toEqual({});
      expect(tableHook.current.table.getSelectedRowModel().rows).toHaveLength(
        0
      );

      // The URL should not contain rowSelection parameter when empty
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.not.stringContaining("users.rowSelection=")
      );
    });
  });
});
