import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { usePersistingFiltersLogic } from "../index";

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
  department: string;
  birthDate: string;
  salary: number;
  projects: number;
}

// Test columns with different filter variants
const testColumns: ColumnDef<TestUser>[] = [
  {
    id: "select",
    header: "Select",
    cell: () => "checkbox",
    enableColumnFilter: false,
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
    meta: {
      title: "Role",
      filter: {
        isLoading: false,
        variant: "multiSelect",
        options: [
          { value: "admin", label: "Admin", disabled: false },
          { value: "user", label: "User", disabled: false },
          { value: "manager", label: "Manager", disabled: false },
        ],
        codec: {
          parse: (value: string) => value.split(","),
          format: (value: string[]) => value.join(","),
        },
        persistenceStorage: "url",
      },
    },
    filterFn: (row, id, value) => {
      if (!value || value.length === 0) return true;
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.getValue("status"),
    meta: {
      title: "Status",
      filter: {
        isLoading: false,
        variant: "multiSelect",
        options: [
          { value: "active", label: "Active", disabled: false },
          { value: "inactive", label: "Inactive", disabled: false },
          { value: "pending", label: "Pending", disabled: false },
        ],
        codec: {
          parse: (value: string) => JSON.parse(value) as string[],
          format: (value: string[]) => JSON.stringify(value),
        },
        persistenceStorage: "url",
      },
    },
    filterFn: (row, id, value) => {
      if (!value || value.length === 0) return true;
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => row.getValue("department"),
    meta: {
      title: "Department",
      filter: {
        isLoading: false,
        variant: "select",
        options: [
          { value: "Engineering", label: "Engineering", disabled: false },
          { value: "Marketing", label: "Marketing", disabled: false },
          { value: "Sales", label: "Sales", disabled: false },
          { value: "HR", label: "HR", disabled: false },
        ],
        persistenceStorage: "localStorage",
      },
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: "birthDate",
    header: "Birth Date",
    cell: ({ row }) => row.getValue("birthDate"),
    meta: {
      title: "Birth Date",
      filter: {
        isLoading: false,
        variant: "dateRange",
        codec: {
          parse: (value: string) => JSON.parse(value) as [Date | null, Date | null],
          format: (value: [Date | null, Date | null]) => JSON.stringify(value),
        },
        persistenceStorage: "url",
      },
    },
    filterFn: (row, id, value) => {
      if (!value || value.length !== 2) return true;
      const [start, end] = value;
      if (!start && !end) return true;
      
      const rowDate = new Date(row.getValue(id) as string);
      if (start && rowDate < new Date(start)) return false;
      if (end && rowDate > new Date(end)) return false;
      return true;
    },
  },
  {
    accessorKey: "salary",
    header: "Salary",
    cell: ({ row }) => row.getValue("salary"),
    meta: {
      title: "Salary",
      filter: {
        isLoading: false,
        variant: "numberRange",
        min: 30000,
        max: 120000,
        step: 5000,
        codec: {
          parse: (value: string) => JSON.parse(value) as [number, number],
          format: (value: [number, number]) => JSON.stringify(value),
        },
        persistenceStorage: "url",
      },
    },
    filterFn: (row, id, value) => {
      if (!value || value.length !== 2) return true;
      const [min, max] = value;
      const rowValue = row.getValue(id) as number;
      
      if (min !== undefined && rowValue < min) return false;
      if (max !== undefined && rowValue > max) return false;
      return true;
    },
  },
  {
    accessorKey: "projects",
    header: "Projects",
    cell: ({ row }) => row.getValue("projects"),
    // No filter meta - should not be filterable
  },
];

// Mock data with filterable values
const mockUsers: TestUser[] = [
  { id: "1", name: "Alice Smith", email: "alice@example.com", role: "admin", status: "active", department: "Engineering", birthDate: "1990-01-15", salary: 75000, projects: 5 },
  { id: "2", name: "Bob Johnson", email: "bob@example.com", role: "user", status: "inactive", department: "Marketing", birthDate: "1988-06-20", salary: 55000, projects: 3 },
  { id: "3", name: "Charlie Brown", email: "charlie@example.com", role: "manager", status: "active", department: "Engineering", birthDate: "1985-03-10", salary: 85000, projects: 8 },
  { id: "4", name: "Diana Prince", email: "diana@example.com", role: "user", status: "active", department: "Sales", birthDate: "1992-11-05", salary: 60000, projects: 4 },
  { id: "5", name: "Eve Wilson", email: "eve@example.com", role: "admin", status: "inactive", department: "HR", birthDate: "1987-08-30", salary: 70000, projects: 6 },
  { id: "6", name: "Frank Miller", email: "frank@example.com", role: "user", status: "active", department: "Engineering", birthDate: "1991-12-25", salary: 65000, projects: 7 },
  { id: "7", name: "Grace Lee", email: "grace@example.com", role: "manager", status: "active", department: "Marketing", birthDate: "1989-04-18", salary: 80000, projects: 5 },
  { id: "8", name: "Henry Davis", email: "henry@example.com", role: "user", status: "pending", department: "Sales", birthDate: "1993-09-12", salary: 50000, projects: 2 },
];

describe("usePersistingFiltersLogic Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    setWindowLocation("https://example.com/");
    mockHistory.pushState.mockClear();
    mockHistory.replaceState.mockClear();
  });

  describe("URL persistence", () => {
    it("persists multiSelect filters to URL and retrieves them", () => {
      const { result: filtersHook } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          persistence: {
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
          filtersHook.current.initialColumnFiltersState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnFilters },
          onColumnFiltersChange: (updater) => {
            filtersHook.current.handleColumnFiltersChange(updater, columnFilters);
            setColumnFilters(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableColumnFilters: true,
        });

        return { table, columnFilters };
      });

      expect(tableHook.current.columnFilters).toEqual([]);
      expect(tableHook.current.table.getFilteredRowModel().rows).toHaveLength(8);

      // Set role filter to admin and user
      act(() => {
        tableHook.current.table.getColumn("role")?.setFilterValue(["admin", "user"]);
      });

      expect(tableHook.current.columnFilters).toEqual([
        { id: "role", value: ["admin", "user"] }
      ]);

      // Should filter to only admin and user roles
      const filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(6); // Alice, Bob, Diana, Eve, Frank, Henry
      filteredRows.forEach(row => {
        expect(["admin", "user"]).toContain(row.original.role);
      });

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.role=admin%2Cuser")
      );
    });

    it("reads initial state from URL parameters", () => {
      // Set up URL with multiSelect filter parameter  
      setWindowLocation("https://example.com/?table.role=manager&table.status=%5B%22active%22%5D");

      const { result } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          initialState: {
            columnFilters: [{ id: "role", value: ["admin"] }],
          },
          persistence: {
            urlNamespace: "table",
          },
        })
      );

      // Should read from URL instead of initial state
      expect(result.current.initialColumnFiltersState).toEqual([
        { id: "role", value: ["manager"] },
        { id: "status", value: ["active"] },
      ]);
    });

    it("handles dateRange filters", () => {
      const { result: filtersHook } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          persistence: {
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
          filtersHook.current.initialColumnFiltersState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnFilters },
          onColumnFiltersChange: (updater) => {
            filtersHook.current.handleColumnFiltersChange(updater, columnFilters);
            setColumnFilters(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableColumnFilters: true,
        });

        return { table, columnFilters };
      });

      // Set birthDate filter range
      const startDate = new Date("1990-01-01");
      const endDate = new Date("1992-12-31");
      
      act(() => {
        tableHook.current.table.getColumn("birthDate")?.setFilterValue([startDate, endDate]);
      });

      expect(tableHook.current.columnFilters).toEqual([
        { id: "birthDate", value: [startDate, endDate] }
      ]);

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.birthDate=")
      );
    });

    it("handles numberRange filters", () => {
      const { result: filtersHook } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          persistence: {
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
          filtersHook.current.initialColumnFiltersState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnFilters },
          onColumnFiltersChange: (updater) => {
            filtersHook.current.handleColumnFiltersChange(updater, columnFilters);
            setColumnFilters(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableColumnFilters: true,
        });

        return { table, columnFilters };
      });

      // Set salary filter range
      act(() => {
        tableHook.current.table.getColumn("salary")?.setFilterValue([60000, 80000]);
      });

      expect(tableHook.current.columnFilters).toEqual([
        { id: "salary", value: [60000, 80000] }
      ]);

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.salary=")
      );
    });
  });

  describe("localStorage persistence", () => {
    it("persists select filters to localStorage and retrieves them", () => {
      const { result: filtersHook } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          persistence: {
            localStorageKey: "table-filters",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
          filtersHook.current.initialColumnFiltersState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnFilters },
          onColumnFiltersChange: (updater) => {
            filtersHook.current.handleColumnFiltersChange(updater, columnFilters);
            setColumnFilters(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableColumnFilters: true,
        });

        return { table, columnFilters };
      });

      // Set department filter
      act(() => {
        tableHook.current.table.getColumn("department")?.setFilterValue("Engineering");
      });

      expect(tableHook.current.columnFilters).toEqual([
        { id: "department", value: "Engineering" }
      ]);

      // Should filter to only Engineering department
      const filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(3); // Alice, Charlie, Frank
      filteredRows.forEach(row => {
        expect(row.original.department).toBe("Engineering");
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "table-filters",
        expect.stringContaining('"department":"Engineering"')
      );
    });

    it("reads initial state from localStorage", () => {
      mockLocalStorage.setItem("filter-store", JSON.stringify({ department: "Marketing" }));

      const { result } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          initialState: {
            columnFilters: [{ id: "department", value: "Engineering" }],
          },
          persistence: {
            localStorageKey: "filter-store",
          },
        })
      );

      // Should read from localStorage instead of initial state
      expect(result.current.initialColumnFiltersState).toEqual([
        { id: "department", value: "Marketing" },
      ]);
    });
  });

  describe("mixed persistence", () => {
    it("handles URL and localStorage filters simultaneously", () => {
      // Pre-populate localStorage with department filter
      mockLocalStorage.setItem("mixed-filters", JSON.stringify({ department: "Engineering" }));
      
      // Set up URL with role filter
      setWindowLocation("https://example.com/?table.role=admin%2Cmanager");

      const { result: filtersHook } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          persistence: {
            urlNamespace: "table",
            localStorageKey: "mixed-filters",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
          filtersHook.current.initialColumnFiltersState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnFilters },
          onColumnFiltersChange: (updater) => {
            filtersHook.current.handleColumnFiltersChange(updater, columnFilters);
            setColumnFilters(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableColumnFilters: true,
        });

        return { table, columnFilters };
      });

      // Should load both URL and localStorage filters
      expect(tableHook.current.columnFilters).toEqual(
        expect.arrayContaining([
          { id: "role", value: ["admin", "manager"] },
          { id: "department", value: "Engineering" },
        ])
      );

      // Should filter to admin/manager roles in Engineering
      const filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(2); // Alice (admin), Charlie (manager)
      filteredRows.forEach(row => {
        expect(["admin", "manager"]).toContain(row.original.role);
        expect(row.original.department).toBe("Engineering");
      });
    });
  });

  describe("function updaters", () => {
    it("handles function-based column filter updates", () => {
      const { result: filtersHook } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          persistence: {
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
          filtersHook.current.initialColumnFiltersState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnFilters },
          onColumnFiltersChange: (updater) => {
            filtersHook.current.handleColumnFiltersChange(updater, columnFilters);
            setColumnFilters(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableColumnFilters: true,
        });

        return { table, columnFilters };
      });

      // Use function updater to set multiple filters
      act(() => {
        tableHook.current.table.setColumnFilters([
          { id: "role", value: ["admin"] },
          { id: "status", value: ["active"] }
        ]);
      });

      expect(tableHook.current.columnFilters).toEqual([
        { id: "role", value: ["admin"] },
        { id: "status", value: ["active"] }
      ]);

      const filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(1); // Only Alice is admin and active
      expect(filteredRows[0].original.name).toBe("Alice Smith");

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.role=admin")
      );
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.status=")
      );
    });
  });

  describe("initial state persistence", () => {
    it("persists initial state when no existing persisted values", () => {
      const { result } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          initialState: {
            columnFilters: [
              { id: "role", value: ["admin", "manager"] },
              { id: "department", value: "Engineering" }
            ],
          },
          persistence: {
            urlNamespace: "table",
            localStorageKey: "initial-filters",
          },
        })
      );

      // Should use initial state
      expect(result.current.initialColumnFiltersState).toEqual([
        { id: "role", value: ["admin", "manager"] },
        { id: "department", value: "Engineering" }
      ]);

      // Should persist URL filters
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.role=admin%2Cmanager")
      );

      // Should persist localStorage filters  
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "initial-filters",
        expect.stringContaining('"department":"Engineering"')
      );
    });

    it("does not persist initial state when persisted values already exist", () => {
      // Pre-existing values
      setWindowLocation("https://example.com/?table.role=user");
      mockLocalStorage.setItem("existing-filters", JSON.stringify({ department: "Sales" }));

      const { result } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          initialState: {
            columnFilters: [{ id: "role", value: ["admin"] }],
          },
          persistence: {
            urlNamespace: "table",
            localStorageKey: "existing-filters",
          },
        })
      );

      // Should use existing values instead of initial state
      expect(result.current.initialColumnFiltersState).toEqual(
        expect.arrayContaining([
          { id: "role", value: ["user"] },
          { id: "department", value: "Sales" },
        ])
      );
    });
  });

  describe("filter sanitization and validation", () => {
    it("sanitizes invalid multiSelect options", async () => {
      // Create columns with loaded options
      const columnsWithOptions = [...testColumns];
      const roleColumn = columnsWithOptions.find(col => col.accessorKey === "role");
      if (roleColumn?.meta?.filter) {
        roleColumn.meta.filter.isLoading = false; // Ensure options are loaded
      }

      // Set up URL with invalid option values
      setWindowLocation("https://example.com/?table.role=admin%2Cinvalid%2Cuser");

      const { result: filtersHook } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: columnsWithOptions,
          persistence: {
            urlNamespace: "table",
          },
        })
      );

      // Should sanitize out invalid options
      expect(filtersHook.current.initialColumnFiltersState).toEqual([
        { id: "role", value: ["admin", "user"] }, // "invalid" should be filtered out
      ]);

      // Wait for sanitization effect to update URL
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should update URL to remove invalid values
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("table.role=admin%2Cuser")
      );
    });

    it("handles empty filter values correctly", () => {
      const { result: filtersHook } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          persistence: {
            urlNamespace: "table",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
          filtersHook.current.initialColumnFiltersState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnFilters },
          onColumnFiltersChange: (updater) => {
            filtersHook.current.handleColumnFiltersChange(updater, columnFilters);
            setColumnFilters(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableColumnFilters: true,
        });

        return { table, columnFilters };
      });

      // Set empty filter value
      act(() => {
        tableHook.current.table.getColumn("role")?.setFilterValue([]);
      });

      expect(tableHook.current.columnFilters).toEqual([
        { id: "role", value: [] }
      ]);

      // Should show all rows when filter is empty
      const filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(8);
    });
  });

  describe("error handling", () => {
    it("handles malformed URL parameters gracefully", () => {
      setWindowLocation("https://example.com/?table.role=invalidjson");

      const { result } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          initialState: {
            columnFilters: [{ id: "role", value: ["admin"] }],
          },
          persistence: {
            urlNamespace: "table",
          },
        })
      );

      // Should fall back to initial state when URL values are invalid
      expect(result.current.initialColumnFiltersState).toEqual([
        { id: "role", value: ["admin"] },
      ]);
    });

    it("handles localStorage JSON parse errors gracefully", () => {
      mockLocalStorage.setItem("broken-filters", "invalid json");

      const { result } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          initialState: {
            columnFilters: [{ id: "department", value: "Engineering" }],
          },
          persistence: {
            localStorageKey: "broken-filters",
          },
        })
      );

      // Should fall back to initial state when localStorage values are invalid
      expect(result.current.initialColumnFiltersState).toEqual([
        { id: "department", value: "Engineering" },
      ]);
    });
  });

  describe("no persistence configuration", () => {
    it("returns handler even when persistence is not configured", () => {
      const { result } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          initialState: {
            columnFilters: [{ id: "role", value: ["admin"] }],
          },
        })
      );

      expect(result.current.handleColumnFiltersChange).toBeDefined();
      expect(result.current.initialColumnFiltersState).toEqual([
        { id: "role", value: ["admin"] },
      ]);
    });
  });

  describe("real-world filtering scenarios", () => {
    it("simulates user applying and modifying multiple filters", () => {
      const { result: filtersHook } = renderHook(() =>
        usePersistingFiltersLogic({
          columns: testColumns,
          initialState: {
            columnFilters: [],
          },
          persistence: {
            urlNamespace: "users",
            localStorageKey: "user-filters",
          },
        })
      );

      const { result: tableHook } = renderHook(() => {
        const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
          filtersHook.current.initialColumnFiltersState || []
        );

        const table = useReactTable({
          data: mockUsers,
          columns: testColumns,
          state: { columnFilters },
          onColumnFiltersChange: (updater) => {
            filtersHook.current.handleColumnFiltersChange(updater, columnFilters);
            setColumnFilters(updater);
          },
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          enableColumnFilters: true,
        });

        return { table, columnFilters };
      });

      expect(tableHook.current.columnFilters).toEqual([]);
      expect(tableHook.current.table.getFilteredRowModel().rows).toHaveLength(8);

      // Apply role filter
      act(() => {
        tableHook.current.table.getColumn("role")?.setFilterValue(["admin", "manager"]);
      });

      let filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(4); // Alice, Charlie, Eve, Grace
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.any(Object),
        "",
        expect.stringContaining("users.role=admin%2Cmanager")
      );

      // Add status filter
      act(() => {
        tableHook.current.table.getColumn("status")?.setFilterValue(["active"]);
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(3); // Alice, Charlie, Grace
      filteredRows.forEach(row => {
        expect(["admin", "manager"]).toContain(row.original.role);
        expect(row.original.status).toBe("active");
      });

      // Add department filter (localStorage)
      act(() => {
        tableHook.current.table.getColumn("department")?.setFilterValue("Engineering");
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(2); // Alice, Charlie
      filteredRows.forEach(row => {
        expect(["admin", "manager"]).toContain(row.original.role);
        expect(row.original.status).toBe("active");
        expect(row.original.department).toBe("Engineering");
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "user-filters",
        expect.stringContaining('"department":"Engineering"')
      );

      // Clear role filter
      act(() => {
        tableHook.current.table.getColumn("role")?.setFilterValue([]);
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(3); // Alice, Charlie, Frank (all active Engineering)

      // Clear all filters
      act(() => {
        tableHook.current.table.resetColumnFilters();
      });

      filteredRows = tableHook.current.table.getFilteredRowModel().rows;
      expect(filteredRows).toHaveLength(8); // All users visible
      expect(tableHook.current.columnFilters).toEqual([]);
    });
  });
});