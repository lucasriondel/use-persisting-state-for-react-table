import { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MultiSelectMeta, SelectMeta } from "../types";
import { useAsyncFiltersManager } from "../useAsyncFiltersManager";

// Mock the dependencies
vi.mock("../usePersistingFiltersLogic/useFilterBuckets");

vi.mock("../usePersistingFiltersLogic/sanitizeValues");
vi.mock("../getColumnIdentifier");

// Import the mocked modules for type support
import { getColumnIdentifier } from "../getColumnIdentifier";

import { sanitizeValue } from "../usePersistingFiltersLogic/sanitizeValues";
import { useFilterBuckets } from "../usePersistingFiltersLogic/useFilterBuckets";

// Type the mocked functions
const mockUseFilterBuckets = vi.mocked(useFilterBuckets);

const mockSanitizeValue = vi.mocked(sanitizeValue);
const mockGetColumnIdentifier = vi.mocked(getColumnIdentifier);

// Test data interface
interface TestUser {
  id: string;
  name: string;
  role: string;
  department: string;
}

describe("useAsyncFiltersManager", () => {
  // Mock bucket APIs
  const mockUrlBucketApi = {
    patch: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    setState: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  };

  const mockLocalBucketApi = {
    patch: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    setState: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  };

  // Mock setColumnFilters function
  const mockSetColumnFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for useFilterBuckets
    mockUseFilterBuckets.mockReturnValue({
      urlBucket: {},
      urlBucketApi: mockUrlBucketApi,
      localBucket: {},
      localBucketApi: mockLocalBucketApi,
    });

    // Default mock implementation for sanitizeValue (returns unchanged value)
    mockSanitizeValue.mockImplementation((_, value) => value);

    // Default mock implementation for getColumnIdentifier
    mockGetColumnIdentifier.mockImplementation((col) => {
      if (col.id) return col.id;
      if ("accessorKey" in col && col.accessorKey)
        return String((col as any).accessorKey);
      throw new Error(
        "Column must have either an 'id' or 'accessorKey' property defined"
      );
    });
  });

  describe("Basic functionality", () => {
    it("should not run validation when columns are empty", () => {
      renderHook(() =>
        useAsyncFiltersManager({
          columns: [],
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
      expect(mockLocalBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });

    it("should not run validation when columns are undefined", () => {
      renderHook(() =>
        useAsyncFiltersManager({
          columns: undefined as any,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
      expect(mockLocalBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });

    it("should skip columns without filter metadata", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "name",
          header: "Name",
        },
        {
          accessorKey: "id",
          header: "ID",
        },
      ];

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
      expect(mockLocalBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });

    it("should skip columns without persistence storage", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: false,
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        },
      ];

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
      expect(mockLocalBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });

    it("should skip columns that are still loading", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: true,
              persistenceStorage: "url",
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        },
      ];

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
      expect(mockLocalBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });

    it("should skip non-select filter variants", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "name",
          header: "Name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
      expect(mockLocalBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });
  });

  describe("Select filter validation", () => {
    it("should validate and update select filter when values are invalid", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: false,
              persistenceStorage: "url",
              options: [
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ],
            } as SelectMeta,
          },
        },
      ];

      const urlBucket = { role: "invalidRole" };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue(undefined); // Invalid value gets sanitized to undefined
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockSanitizeValue).toHaveBeenCalledWith(
        columns[0].meta?.filter,
        "invalidRole"
      );
      expect(mockUrlBucketApi.patch).toHaveBeenCalledWith({ role: undefined });
      expect(mockSetColumnFilters).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should not update when select filter values are valid", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: false,
              persistenceStorage: "url",
              options: [
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ],
            } as SelectMeta,
          },
        },
      ];

      const urlBucket = { role: "admin" };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue("admin"); // Valid value remains the same
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [{ id: "role", value: "admin" }], // State already matches bucket
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockSanitizeValue).toHaveBeenCalledWith(
        columns[0].meta?.filter,
        "admin"
      );
      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
      expect(mockLocalBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });

    it("should use filter key when available", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              key: "customRoleKey",
              isLoading: false,
              persistenceStorage: "url",
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        },
      ];

      const urlBucket = { customRoleKey: "invalidRole" };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue(undefined);

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockGetColumnIdentifier).not.toHaveBeenCalled(); // Should use filter key instead
      expect(mockSanitizeValue).toHaveBeenCalledWith(
        columns[0].meta?.filter,
        "invalidRole"
      );
      expect(mockUrlBucketApi.patch).toHaveBeenCalledWith({
        customRoleKey: undefined,
      });
    });
  });

  describe("MultiSelect filter validation", () => {
    it("should validate and update multiSelect filter when values are invalid", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "multiSelect",
              isLoading: false,
              persistenceStorage: "url",
              options: [
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ],
            } as MultiSelectMeta,
          },
        },
      ];

      const urlBucket = { role: ["admin", "invalidRole", "user"] };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue(["admin", "user"]); // Invalid option removed
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockSanitizeValue).toHaveBeenCalledWith(columns[0].meta?.filter, [
        "admin",
        "invalidRole",
        "user",
      ]);
      expect(mockUrlBucketApi.patch).toHaveBeenCalledWith({
        role: ["admin", "user"],
      });
      expect(mockSetColumnFilters).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should remove multiSelect filter when all values are invalid", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "multiSelect",
              isLoading: false,
              persistenceStorage: "url",
              options: [
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ],
            } as MultiSelectMeta,
          },
        },
      ];

      const urlBucket = { role: ["invalidRole1", "invalidRole2"] };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue(undefined); // All values invalid
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockUrlBucketApi.patch).toHaveBeenCalledWith({ role: undefined });
      expect(mockSetColumnFilters).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("Storage type handling", () => {
    it("should handle localStorage persistence", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: false,
              persistenceStorage: "localStorage",
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        },
      ];

      const localBucket = { role: "invalidRole" };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket: {},
        urlBucketApi: mockUrlBucketApi,
        localBucket,
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue(undefined);
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          localStorageKey: "test-filters",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockLocalBucketApi.patch).toHaveBeenCalledWith({
        role: undefined,
      });
      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
    });

    it("should handle both URL and localStorage filters in the same hook", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: false,
              persistenceStorage: "url",
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        },
        {
          accessorKey: "department",
          header: "Department",
          meta: {
            filter: {
              variant: "multiSelect",
              isLoading: false,
              persistenceStorage: "localStorage",
              options: [{ value: "engineering", label: "Engineering" }],
            } as MultiSelectMeta,
          },
        },
      ];

      const urlBucket = { role: "invalidRole" };
      const localBucket = { department: ["invalidDept"] };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket,
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue(undefined);
      mockGetColumnIdentifier.mockImplementation((col) =>
        String((col as any).accessorKey)
      );

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          localStorageKey: "test-filters",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockUrlBucketApi.patch).toHaveBeenCalledWith({ role: undefined });
      expect(mockLocalBucketApi.patch).toHaveBeenCalledWith({
        department: undefined,
      });
    });
  });

  describe("setColumnFilters behavior", () => {
    it("should update column filters state correctly when removing invalid filters", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: false,
              persistenceStorage: "url",
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        },
      ];

      const urlBucket = { role: "invalidRole" };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue(undefined);
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockSetColumnFilters).toHaveBeenCalledWith(expect.any(Function));

      // Test the function passed to setColumnFilters
      const setterFunction = mockSetColumnFilters.mock.calls[0][0];

      // Test with undefined previous filters
      const result1 = setterFunction(undefined);
      expect(result1).toEqual([]);

      // Test with existing filters that should be preserved
      const existingFilters: ColumnFiltersState = [
        { id: "name", value: "test" },
        { id: "role", value: "oldValue" }, // This should be removed
      ];
      const result2 = setterFunction(existingFilters);
      expect(result2).toEqual([{ id: "name", value: "test" }]);
    });

    it("should update column filters state correctly when adding valid sanitized filters", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "multiSelect",
              isLoading: false,
              persistenceStorage: "url",
              options: [
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ],
            } as MultiSelectMeta,
          },
        },
      ];

      const urlBucket = { role: ["admin", "invalidRole", "user"] };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue(["admin", "user"]); // Invalid option removed
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      // Test the function passed to setColumnFilters
      const setterFunction = mockSetColumnFilters.mock.calls[0][0];

      const existingFilters: ColumnFiltersState = [
        { id: "name", value: "test" },
      ];
      const result = setterFunction(existingFilters);
      expect(result).toEqual([
        { id: "name", value: "test" },
        { id: "role", value: ["admin", "user"] },
      ]);
    });
  });

  describe("State synchronization", () => {
    it("should sync bucket values to state when state is empty but bucket has valid values", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: false,
              persistenceStorage: "url",
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        },
      ];

      const urlBucket = { role: "admin" };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue("admin"); // Valid value remains the same
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [], // Empty state but bucket has value
          setColumnFilters: mockSetColumnFilters,
        })
      );

      // Should sync the value from bucket to state even though raw === sanitized
      expect(mockUrlBucketApi.patch).toHaveBeenCalledWith({ role: "admin" });
      expect(mockSetColumnFilters).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should not sync when state already matches bucket values", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: false,
              persistenceStorage: "url",
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        },
      ];

      const urlBucket = { role: "admin" };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue("admin");
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [{ id: "role", value: "admin" }], // State already matches
          setColumnFilters: mockSetColumnFilters,
        })
      );

      // Should not update anything since state already matches
      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });

    it("should sync when state has different values than sanitized bucket values", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "multiSelect",
              isLoading: false,
              persistenceStorage: "url",
              options: [
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ],
            } as MultiSelectMeta,
          },
        },
      ];

      const urlBucket = { role: ["admin", "invalidRole"] };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue(["admin"]); // Invalid option removed
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [
            { id: "role", value: ["admin", "invalidRole"] },
          ], // State has different value
          setColumnFilters: mockSetColumnFilters,
        })
      );

      // Should sync both bucket and state
      expect(mockUrlBucketApi.patch).toHaveBeenCalledWith({ role: ["admin"] });
      expect(mockSetColumnFilters).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("Edge cases", () => {
    it("should handle columns without id or accessorKey gracefully", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          header: "Custom Column",
          meta: {
            filter: {
              variant: "select",
              isLoading: false,
              persistenceStorage: "url",
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        } as ColumnDef<TestUser>,
      ];

      mockGetColumnIdentifier.mockImplementation(() => {
        throw new Error(
          "Column must have either an 'id' or 'accessorKey' property defined"
        );
      });

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
      expect(mockLocalBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });

    it("should handle empty buckets gracefully", () => {
      const columns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: false,
              persistenceStorage: "url",
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        },
      ];

      const urlBucket = {}; // No stored value for role

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });
      mockSanitizeValue.mockReturnValue(undefined);
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersManager({
          columns,
          urlNamespace: "test",
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      // Should not update anything since undefined === undefined
      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });

    it("should react to changes in dependencies", () => {
      const initialColumns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: true, // Initially loading
              persistenceStorage: "url",
              options: [],
            } as SelectMeta,
          },
        },
      ];

      const urlBucket = { role: "admin" };

      mockUseFilterBuckets.mockReturnValue({
        urlBucket,
        urlBucketApi: mockUrlBucketApi,
        localBucket: {},
        localBucketApi: mockLocalBucketApi,
      });

      const { rerender } = renderHook(
        ({ columns }) =>
          useAsyncFiltersManager({
            columns,
            urlNamespace: "test",
            currentColumnFilters: [],
            setColumnFilters: mockSetColumnFilters,
          }),
        { initialProps: { columns: initialColumns } }
      );

      // Initially should not validate (isLoading: true)
      expect(mockUrlBucketApi.patch).not.toHaveBeenCalled();

      // Update columns to finish loading
      const updatedColumns: ColumnDef<TestUser>[] = [
        {
          accessorKey: "role",
          header: "Role",
          meta: {
            filter: {
              variant: "select",
              isLoading: false, // Finished loading
              persistenceStorage: "url",
              options: [{ value: "admin", label: "Admin" }],
            } as SelectMeta,
          },
        },
      ];

      mockSanitizeValue.mockReturnValue("admin");
      mockGetColumnIdentifier.mockReturnValue("role");

      act(() => {
        rerender({ columns: updatedColumns });
      });

      // Now should validate (but no change needed since "admin" is valid)
      expect(mockSanitizeValue).toHaveBeenCalled();
    });
  });
});
