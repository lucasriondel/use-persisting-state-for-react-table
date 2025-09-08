import { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, MockContext, vi } from "vitest";
import { MultiSelectMeta, SelectMeta } from "../../types";
import { useAsyncFiltersPersistencePostLoading } from "../useAsyncFiltersPersistencePostLoading";

// Mock the dependencies
vi.mock("../sanitizeValues");
vi.mock("../../getColumnIdentifier");

// Import the mocked modules for type support
import { createMockSharedBuckets } from "../../__tests__/createMockSharedBuckets";
import { getColumnIdentifier } from "../../getColumnIdentifier";
import { sanitizeValue } from "../sanitizeValues";

// Type the mocked functions
const mockSanitizeValue = vi.mocked(sanitizeValue);
const mockGetColumnIdentifier = vi.mocked(getColumnIdentifier);

// Test data interface
interface TestUser {
  id: string;
  name: string;
  role: string;
  department: string;
}

describe("useAsyncFiltersPersistencePostLoading", () => {
  // Mock setColumnFilters function
  const mockSetColumnFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for sanitizeValue (returns unchanged value)
    mockSanitizeValue.mockImplementation((_, value) => value);

    // Default mock implementation for getColumnIdentifier
    mockGetColumnIdentifier.mockImplementation((col) => {
      if (col.id) return col.id;
      if ("accessorKey" in col && col.accessorKey)
        return String(col.accessorKey);
      throw new Error(
        "Column must have either an 'id' or 'accessorKey' property defined"
      );
    });
  });

  describe("Basic functionality", () => {
    it("should not run validation when columns are empty", () => {
      const sharedBuckets = createMockSharedBuckets();

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: [],
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
      expect(sharedBuckets.localBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
    });

    it("should not run validation when columns are undefined", () => {
      const sharedBuckets = createMockSharedBuckets();

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          // @ts-expect-error - this is normal, we're testing the type coercion
          columns: undefined,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
      expect(sharedBuckets.localBucketApi.patch).not.toHaveBeenCalled();
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

      const sharedBuckets = createMockSharedBuckets();

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
      expect(sharedBuckets.localBucketApi.patch).not.toHaveBeenCalled();
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

      const sharedBuckets = createMockSharedBuckets();

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
      expect(sharedBuckets.localBucketApi.patch).not.toHaveBeenCalled();
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

      const sharedBuckets = createMockSharedBuckets();

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
      expect(sharedBuckets.localBucketApi.patch).not.toHaveBeenCalled();
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

      const sharedBuckets = createMockSharedBuckets();

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
      expect(sharedBuckets.localBucketApi.patch).not.toHaveBeenCalled();
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the URL bucket
      sharedBuckets.urlBucket.role = "invalidRole";

      mockSanitizeValue.mockReturnValue(undefined); // Invalid value gets sanitized to undefined
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockSanitizeValue).toHaveBeenCalledWith(
        columns[0]?.meta?.filter,
        "invalidRole"
      );
      expect(sharedBuckets.urlBucketApi.patch).toHaveBeenCalledWith({
        role: undefined,
      });
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the URL bucket
      sharedBuckets.urlBucket.role = "admin";

      mockSanitizeValue.mockReturnValue("admin"); // Valid value remains the same
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [{ id: "role", value: "admin" }], // State already matches bucket
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockSanitizeValue).toHaveBeenCalledWith(
        columns[0]?.meta?.filter,
        "admin"
      );
      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
      expect(sharedBuckets.localBucketApi.patch).not.toHaveBeenCalled();
      expect(mockSetColumnFilters).not.toHaveBeenCalled();
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the URL bucket
      sharedBuckets.urlBucket.role = ["admin", "invalidRole", "user"];

      mockSanitizeValue.mockReturnValue(["admin", "user"]); // Invalid option removed
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockSanitizeValue).toHaveBeenCalledWith(columns[0]?.meta?.filter, [
        "admin",
        "invalidRole",
        "user",
      ]);
      expect(sharedBuckets.urlBucketApi.patch).toHaveBeenCalledWith({
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the URL bucket
      sharedBuckets.urlBucket.role = ["invalidRole1", "invalidRole2"];

      mockSanitizeValue.mockReturnValue(undefined); // All values invalid
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(sharedBuckets.urlBucketApi.patch).toHaveBeenCalledWith({
        role: undefined,
      });
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the local bucket
      sharedBuckets.localBucket.role = "invalidRole";

      mockSanitizeValue.mockReturnValue(undefined);
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(sharedBuckets.localBucketApi.patch).toHaveBeenCalledWith({
        role: undefined,
      });
      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in both buckets
      sharedBuckets.urlBucket.role = "invalidRole";
      sharedBuckets.localBucket.department = ["invalidDept"];

      mockSanitizeValue.mockReturnValue(undefined);
      mockGetColumnIdentifier.mockImplementation((col) =>
        // @ts-expect-error - TODO need to fix this
        String(col.accessorKey)
      );

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(sharedBuckets.urlBucketApi.patch).toHaveBeenCalledWith({
        role: undefined,
      });
      expect(sharedBuckets.localBucketApi.patch).toHaveBeenCalledWith({
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the URL bucket
      sharedBuckets.urlBucket.role = "invalidRole";

      mockSanitizeValue.mockReturnValue(undefined);
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      expect(mockSetColumnFilters).toHaveBeenCalledWith(expect.any(Function));
      // Test the function passed to setColumnFilters
      expect(mockSetColumnFilters).toHaveBeenCalledTimes(1);

      if (!mockSetColumnFilters.mock.calls) {
        throw new Error("mockSetColumnFilters.mock.calls is not defined");
      }
      if (!Array.isArray(mockSetColumnFilters.mock.calls)) {
        throw new Error("mockSetColumnFilters.mock.calls is not an array");
      }
      if (mockSetColumnFilters.mock.calls.length < 1) {
        throw new Error("mockSetColumnFilters.mock.calls has no values");
      }

      const firstCall = mockSetColumnFilters.mock.calls[0] as Array<
        MockContext<unknown, unknown>["calls"][number]
      >;
      if (!firstCall) {
        throw new Error("first call is not defined");
      }
      if (!Array.isArray(firstCall)) {
        throw new Error("first call is not an array");
      }
      if (firstCall.length < 1) {
        throw new Error("first call has no values");
      }

      const setterFunction = firstCall[0];
      if (!setterFunction) {
        throw new Error("setterFunction is not defined");
      }
      if (typeof setterFunction !== "function") {
        throw new Error("setterFunction is not a function");
      }

      // Test with undefined previous filters
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const result1 = setterFunction(undefined);
      if (!Array.isArray(result1)) {
        throw new Error("result1 is not an array");
      }
      expect(result1).toEqual([]);

      // Test with existing filters that should be preserved
      const existingFilters: ColumnFiltersState = [
        { id: "name", value: "test" },
        { id: "role", value: "oldValue" }, // This should be removed
      ];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the URL bucket
      sharedBuckets.urlBucket.role = ["admin", "invalidRole", "user"];

      mockSanitizeValue.mockReturnValue(["admin", "user"]); // Invalid option removed
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      // Test the function passed to setColumnFilters
      const firstCall = mockSetColumnFilters.mock.calls[0] as Array<
        MockContext<unknown, unknown>["calls"][number]
      >;
      if (!firstCall) {
        throw new Error("first call is not defined");
      }
      if (!Array.isArray(firstCall)) {
        throw new Error("first call is not an array");
      }
      if (firstCall.length < 1) {
        throw new Error("first call has no values");
      }

      const setterFunction = firstCall[0];
      if (!setterFunction) {
        throw new Error("setterFunction is not defined");
      }
      if (typeof setterFunction !== "function") {
        throw new Error("setterFunction is not a function");
      }

      const existingFilters: ColumnFiltersState = [
        { id: "name", value: "test" },
      ];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the URL bucket
      sharedBuckets.urlBucket.role = "admin";

      mockSanitizeValue.mockReturnValue("admin"); // Valid value remains the same
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [], // Empty state but bucket has value
          setColumnFilters: mockSetColumnFilters,
        })
      );

      // Should sync the value from bucket to state even though raw === sanitized
      expect(sharedBuckets.urlBucketApi.patch).toHaveBeenCalledWith({
        role: "admin",
      });
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the URL bucket
      sharedBuckets.urlBucket.role = "admin";

      mockSanitizeValue.mockReturnValue("admin");
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [{ id: "role", value: "admin" }], // State already matches
          setColumnFilters: mockSetColumnFilters,
        })
      );

      // Should not update anything since state already matches
      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the URL bucket
      sharedBuckets.urlBucket.role = ["admin", "invalidRole"];

      mockSanitizeValue.mockReturnValue(["admin"]); // Invalid option removed
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [
            { id: "role", value: ["admin", "invalidRole"] },
          ], // State has different value
          setColumnFilters: mockSetColumnFilters,
        })
      );

      // Should sync both bucket and state
      expect(sharedBuckets.urlBucketApi.patch).toHaveBeenCalledWith({
        role: ["admin"],
      });
      expect(mockSetColumnFilters).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("Edge cases", () => {
    it("should handle columns without id or accessorKey with error throwing", () => {
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

      const sharedBuckets = createMockSharedBuckets();

      expect(() => {
        renderHook(() =>
          useAsyncFiltersPersistencePostLoading({
            columns: columns,
            sharedBuckets,
            currentColumnFilters: [],
            setColumnFilters: mockSetColumnFilters,
          })
        );
      }).toThrow(
        "Column must have either an 'id' or 'accessorKey' property defined"
      );

      expect(mockGetColumnIdentifier).toHaveBeenCalledWith(columns[0]);
      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
      expect(sharedBuckets.localBucketApi.patch).not.toHaveBeenCalled();
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

      const sharedBuckets = createMockSharedBuckets();
      // Ensure the bucket is actually empty for this specific key
      delete sharedBuckets.urlBucket.role;

      // Reset the mock to ensure clean state
      mockSanitizeValue.mockReset();
      mockSanitizeValue.mockReturnValue(undefined);
      mockGetColumnIdentifier.mockReturnValue("role");

      renderHook(() =>
        useAsyncFiltersPersistencePostLoading({
          columns: columns,
          sharedBuckets,
          currentColumnFilters: [],
          setColumnFilters: mockSetColumnFilters,
        })
      );

      // Debug: Check what sanitizeValue was called with
      expect(mockSanitizeValue).toHaveBeenCalledWith(
        columns[0]?.meta?.filter,
        undefined
      );

      // Should not update anything since undefined === undefined and state is consistent
      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();
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

      const sharedBuckets = createMockSharedBuckets();
      // Set up the test data in the URL bucket
      sharedBuckets.urlBucket.role = "admin";

      const { rerender } = renderHook(
        ({ columns }) =>
          useAsyncFiltersPersistencePostLoading({
            columns: columns,
            sharedBuckets,
            currentColumnFilters: [],
            setColumnFilters: mockSetColumnFilters,
          }),
        { initialProps: { columns: initialColumns } }
      );

      // Initially should not validate (isLoading: true)
      expect(sharedBuckets.urlBucketApi.patch).not.toHaveBeenCalled();

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
