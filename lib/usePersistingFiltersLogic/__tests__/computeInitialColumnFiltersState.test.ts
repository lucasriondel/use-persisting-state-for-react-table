import { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import { computeInitialColumnFiltersState } from "../computeInitialColumnFiltersState";

interface TestData {
  id: string;
  name: string;
  age: number;
  status: string;
  tags: string[];
}

describe("computeInitialColumnFiltersState", () => {
  describe("basic functionality", () => {
    it("returns undefined for empty columns", () => {
      const result = computeInitialColumnFiltersState<TestData>({
        columns: [],
        urlBucket: {},
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toBeUndefined();
    });

    it("returns initialStateFilters when no persisted filters", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        { id: "name", accessorKey: "name" },
      ];
      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "initial" },
      ];
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: {},
        localBucket: {},
        optimisticAsync: false,
        initialStateFilters: initialFilters,
      });
      expect(result).toBe(initialFilters);
    });

    it("builds filters from URL bucket", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlBucket = { name: "john" };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toEqual([{ id: "name", value: "john" }]);
    });

    it("builds filters from localStorage bucket", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "age",
          accessorKey: "age",
          meta: {
            filter: {
              variant: "number",
              persistenceStorage: "localStorage",
            },
          },
        },
      ];
      const localBucket = { age: 25 };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: {},
        localBucket: localBucket,
        optimisticAsync: false,
      });
      expect(result).toEqual([{ id: "age", value: 25 }]);
    });
  });

  describe("empty value filtering", () => {
    it("filters out empty values", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
        {
          id: "status",
          accessorKey: "status",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlBucket = { name: "", status: "active" };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toEqual([{ id: "status", value: "active" }]);
    });
  });

  describe("select and multiSelect handling", () => {
    describe("when options are loaded (isLoading: false)", () => {
      it("sanitizes select values with allowed options", () => {
        const columns: ColumnDef<TestData, unknown>[] = [
          {
            id: "status",
            accessorKey: "status",
            meta: {
              filter: {
                variant: "select",
                persistenceStorage: "url",
                isLoading: false,
                options: [
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ],
              },
            },
          },
        ];
        const urlBucket = { status: "active" };
        const result = computeInitialColumnFiltersState({
          columns: columns,
          urlBucket: urlBucket,
          localBucket: {},
          optimisticAsync: false,
        });
        expect(result).toEqual([{ id: "status", value: "active" }]);
      });

      it("filters out invalid select values", () => {
        const columns: ColumnDef<TestData, unknown>[] = [
          {
            id: "status",
            accessorKey: "status",
            meta: {
              filter: {
                variant: "select",
                persistenceStorage: "url",
                isLoading: false,
                options: [{ label: "Active", value: "active" }],
              },
            },
          },
        ];
        const urlBucket = { status: "invalid" };
        const result = computeInitialColumnFiltersState({
          columns: columns,
          urlBucket: urlBucket,
          localBucket: {},
          optimisticAsync: false,
        });
        expect(result).toBeUndefined();
      });

      it("sanitizes multiSelect values with allowed options", () => {
        const columns: ColumnDef<TestData, unknown>[] = [
          {
            id: "tags",
            accessorKey: "tags",
            meta: {
              filter: {
                variant: "multiSelect",
                persistenceStorage: "url",
                isLoading: false,
                options: [
                  { label: "Tag 1", value: "tag1" },
                  { label: "Tag 2", value: "tag2" },
                  { label: "Tag 3", value: "tag3" },
                ],
              },
            },
          },
        ];
        const urlBucket = { tags: ["tag1", "tag3", "invalid"] };
        const result = computeInitialColumnFiltersState({
          columns: columns,
          urlBucket: urlBucket,
          localBucket: {},
          optimisticAsync: false,
        });
        expect(result).toEqual([{ id: "tags", value: ["tag1", "tag3"] }]);
      });

      it("filters out completely invalid multiSelect values", () => {
        const columns: ColumnDef<TestData, unknown>[] = [
          {
            id: "tags",
            accessorKey: "tags",
            meta: {
              filter: {
                variant: "multiSelect",
                persistenceStorage: "url",
                isLoading: false,
                options: [{ label: "Tag 1", value: "tag1" }],
              },
            },
          },
        ];
        const urlBucket = { tags: ["invalid1", "invalid2"] };
        const result = computeInitialColumnFiltersState({
          columns: columns,
          urlBucket: urlBucket,
          localBucket: {},
          optimisticAsync: false,
        });
        expect(result).toBeUndefined();
      });

      it("handles select/multiSelect with no options", () => {
        const columns: ColumnDef<TestData, unknown>[] = [
          {
            id: "status",
            accessorKey: "status",
            meta: {
              filter: {
                variant: "select",
                persistenceStorage: "url",
                isLoading: false,
                options: [],
              },
            },
          },
        ];
        const urlBucket = { status: "any-value" };
        const result = computeInitialColumnFiltersState({
          columns: columns,
          urlBucket: urlBucket,
          localBucket: {},
          optimisticAsync: false,
        });
        expect(result).toEqual([{ id: "status", value: "any-value" }]);
      });

      it("handles select/multiSelect with undefined options", () => {
        const columns: ColumnDef<TestData, unknown>[] = [
          {
            id: "status",
            accessorKey: "status",
            meta: {
              filter: {
                variant: "select",
                persistenceStorage: "url",
                isLoading: false,
                // @ts-expect-error - this is normal, we're testing the type coercion
                options: undefined,
              },
            },
          },
        ];
        const urlBucket = { status: "any-value" };
        const result = computeInitialColumnFiltersState({
          columns: columns,
          urlBucket: urlBucket,
          localBucket: {},
          optimisticAsync: false,
        });
        expect(result).toEqual([{ id: "status", value: "any-value" }]);
      });
    });

    describe("when options are loading (isLoading: true)", () => {
      it("includes raw value when optimisticAsync is true", () => {
        const columns: ColumnDef<TestData, unknown>[] = [
          {
            id: "status",
            accessorKey: "status",
            meta: {
              filter: {
                variant: "select",
                persistenceStorage: "url",
                isLoading: true,
                options: [],
              },
            },
          },
        ];
        const urlBucket = { status: "pending-value" };
        const result = computeInitialColumnFiltersState({
          columns: columns,
          urlBucket: urlBucket,
          localBucket: {},
          optimisticAsync: true,
        });
        expect(result).toEqual([{ id: "status", value: "pending-value" }]);
      });

      it("skips value when optimisticAsync is false", () => {
        const columns: ColumnDef<TestData, unknown>[] = [
          {
            id: "status",
            accessorKey: "status",
            meta: {
              filter: {
                variant: "select",
                persistenceStorage: "url",
                isLoading: true,
                options: [],
              },
            },
          },
        ];
        const urlBucket = { status: "pending-value" };
        const result = computeInitialColumnFiltersState({
          columns: columns,
          urlBucket: urlBucket,
          localBucket: {},
          optimisticAsync: false,
        });
        expect(result).toBeUndefined();
      });
    });

    describe("when isLoading is undefined", () => {
      it("includes raw value for select/multiSelect", () => {
        const columns: ColumnDef<TestData, unknown>[] = [
          {
            id: "status",
            accessorKey: "status",
            meta: {
              filter: {
                variant: "select",
                persistenceStorage: "url",
                // isLoading is undefined
                options: [],
              },
            },
          },
        ];
        const urlBucket = { status: "any-value" };
        const result = computeInitialColumnFiltersState({
          columns: columns,
          urlBucket: urlBucket,
          localBucket: {},
          optimisticAsync: false,
        });
        expect(result).toEqual([{ id: "status", value: "any-value" }]);
      });
    });
  });

  describe("non-select variants", () => {
    it("sanitizes text values immediately", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlBucket = { name: 42 }; // Number should be converted to string
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toEqual([{ id: "name", value: "42" }]);
    });

    it("sanitizes number values immediately", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "age",
          accessorKey: "age",
          meta: {
            filter: {
              variant: "number",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlBucket = { age: "25" }; // String should be converted to number
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toEqual([{ id: "age", value: 25 }]);
    });

    it("filters out invalid sanitized values", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "age",
          accessorKey: "age",
          meta: {
            filter: {
              variant: "number",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlBucket = { age: "invalid-number" };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toBeUndefined();
    });

    it("handles date values", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "createdAt",
          accessorKey: "createdAt",
          meta: {
            filter: {
              variant: "date",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlBucket = { createdAt: "2022-01-01" };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toEqual([
        { id: "createdAt", value: new Date("2022-01-01") },
      ]);
    });

    it("handles dateRange values", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "dateRange",
          accessorKey: "dateRange",
          meta: {
            filter: {
              variant: "dateRange",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlBucket = { dateRange: ["2022-01-01", "2022-12-31"] };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toEqual([
        {
          id: "dateRange",
          value: [new Date("2022-01-01"), new Date("2022-12-31")],
        },
      ]);
    });

    it("handles numberRange values", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "priceRange",
          accessorKey: "priceRange",
          meta: {
            filter: {
              variant: "numberRange",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlBucket = { priceRange: [100, 500] };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toEqual([{ id: "priceRange", value: [100, 500] }]);
    });
  });

  describe("mixed scenarios", () => {
    it("handles mixed column types and storage locations", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
        {
          id: "age",
          accessorKey: "age",
          meta: {
            filter: {
              variant: "number",
              persistenceStorage: "localStorage",
            },
          },
        },
        {
          id: "status",
          accessorKey: "status",
          meta: {
            filter: {
              variant: "select",
              persistenceStorage: "url",
              isLoading: false,
              options: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
            },
          },
        },
      ];

      const urlBucket = { name: "john", status: "active" };
      const localBucket = { age: 25 };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: localBucket,
        optimisticAsync: false,
      });
      expect(result).toEqual([
        { id: "name", value: "john" },
        { id: "age", value: 25 },
        { id: "status", value: "active" },
      ]);
    });

    it("filters out some values while keeping others", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
        {
          id: "status",
          accessorKey: "status",
          meta: {
            filter: {
              variant: "select",
              persistenceStorage: "url",
              isLoading: false,
              options: [{ label: "Active", value: "active" }],
            },
          },
        },
      ];

      const urlBucket = { name: "", status: "invalid" }; // Both should be filtered out
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("skips columns without filter meta", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        { id: "name", accessorKey: "name" }, // No filter meta
      ];
      const urlBucket = { name: "ignored" };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toBeUndefined();
    });

    it("skips columns without persistenceStorage", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              // No persistenceStorage
            },
          },
        },
      ];
      const urlBucket = { name: "ignored" };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toBeUndefined();
    });

    it("throws error for columns without valid identifier", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          // No id or accessorKey
          header: "Invalid Column",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlBucket = { anything: "ignored" };

      expect(() =>
        computeInitialColumnFiltersState({
          columns: columns,
          urlBucket: urlBucket,
          localBucket: {},
          optimisticAsync: false,
        })
      ).toThrow(
        "Column must have either an 'id' or 'accessorKey' property defined"
      );
    });

    it("maintains column order in result", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "z_last",
          accessorKey: "z",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
        {
          id: "a_first",
          accessorKey: "a",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];

      const urlBucket = { z_last: "z-value", a_first: "a-value" };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
      });
      expect(result).toEqual([
        { id: "z_last", value: "z-value" },
        { id: "a_first", value: "a-value" },
      ]);
    });

    it("returns initialStateFilters when result would be empty", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const initialFilters: ColumnFiltersState = [
        { id: "other", value: "fallback" },
      ];
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: {},
        localBucket: {},
        optimisticAsync: false,
        initialStateFilters: initialFilters,
      });
      expect(result).toBe(initialFilters);
    });

    it("returns result even when initialStateFilters provided but filters found", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const initialFilters: ColumnFiltersState = [
        { id: "other", value: "fallback" },
      ];
      const urlBucket = { name: "persisted" };
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
        initialStateFilters: initialFilters,
      });
      expect(result).toEqual([{ id: "name", value: "persisted" }]);
    });
  });

  describe("loading state precedence over initial state", () => {
    it("returns empty array when loading filter conflicts with initial state (optimisticAsync: false)", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "role",
          accessorKey: "role",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "url",
              isLoading: true,
              options: [], // Empty options while loading
            },
          },
        },
      ];
      const urlBucket = { role: ["manager", "WRONG-ROLE"] };
      const initialFilters: ColumnFiltersState = [
        { id: "role", value: ["admin"] },
      ];
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
        initialStateFilters: initialFilters,
      });

      // Should return empty array to let URL data take precedence when loading completes
      expect(result).toEqual([]);
    });

    it("includes raw value when loading filter conflicts with initial state (optimisticAsync: true)", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "role",
          accessorKey: "role",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "url",
              isLoading: true,
              options: [], // Empty options while loading
            },
          },
        },
      ];
      const urlBucket = { role: ["manager", "WRONG-ROLE"] };
      const initialFilters: ColumnFiltersState = [
        { id: "role", value: ["admin"] },
      ];
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: true,
        initialStateFilters: initialFilters,
      });

      // Should return raw URL value optimistically
      expect(result).toEqual([
        { id: "role", value: ["manager", "WRONG-ROLE"] },
      ]);
    });

    it("returns initial state when loading filter does not conflict", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "status",
          accessorKey: "status",
          meta: {
            filter: {
              variant: "select",
              persistenceStorage: "url",
              isLoading: true,
              options: [],
            },
          },
        },
      ];
      const urlBucket = { status: "pending" };
      const initialFilters: ColumnFiltersState = [
        { id: "role", value: ["admin"] },
      ]; // Different column
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
        initialStateFilters: initialFilters,
      });

      // Should return initial state since loading filter doesn't conflict
      expect(result).toEqual([{ id: "role", value: ["admin"] }]);
    });

    it("handles multiple loading filters with mixed conflicts", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "role",
          accessorKey: "role",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "url",
              isLoading: true,
              options: [],
            },
          },
        },
        {
          id: "department",
          accessorKey: "department",
          meta: {
            filter: {
              variant: "select",
              persistenceStorage: "url",
              isLoading: true,
              options: [],
            },
          },
        },
      ];
      const urlBucket = { role: ["manager"], department: "engineering" };
      const initialFilters: ColumnFiltersState = [
        { id: "role", value: ["admin"] }, // Conflicts with loading filter
        { id: "other", value: "no-conflict" }, // No conflict
      ];
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
        initialStateFilters: initialFilters,
      });

      // Should return empty array because at least one loading filter conflicts
      expect(result).toEqual([]);
    });

    it("handles loading filter with localStorage storage", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "preferences",
          accessorKey: "preferences",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "localStorage",
              isLoading: true,
              options: [],
            },
          },
        },
      ];
      const localBucket = { preferences: ["dark-mode", "compact-view"] };
      const initialFilters: ColumnFiltersState = [
        { id: "preferences", value: ["light-mode"] },
      ];
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: {},
        localBucket: localBucket,
        optimisticAsync: false,
        initialStateFilters: initialFilters,
      });

      // Should return empty array for localStorage loading conflict too
      expect(result).toEqual([]);
    });

    it("returns initial state when bucket data is completely invalid (not loading)", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "role",
          accessorKey: "role",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "url",
              isLoading: false, // Not loading, options are available
              options: [
                { label: "Admin", value: "admin" },
                { label: "User", value: "user" },
              ],
            },
          },
        },
      ];
      const urlBucket = { role: ["completely-invalid-role"] };
      const initialFilters: ColumnFiltersState = [
        { id: "role", value: ["admin"] },
      ];
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
        initialStateFilters: initialFilters,
      });

      // Should fall back to initial state because bucket data is invalid (not loading)
      expect(result).toEqual([{ id: "role", value: ["admin"] }]);
    });

    it("handles mixed loading and non-loading filters", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "role",
          accessorKey: "role",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "url",
              isLoading: true, // Loading
              options: [],
            },
          },
        },
        {
          id: "status",
          accessorKey: "status",
          meta: {
            filter: {
              variant: "select",
              persistenceStorage: "url",
              isLoading: false, // Not loading
              options: [{ label: "Active", value: "active" }],
            },
          },
        },
      ];
      const urlBucket = { role: ["manager"], status: "active" };
      const initialFilters: ColumnFiltersState = [
        { id: "role", value: ["admin"] },
      ];
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
        initialStateFilters: initialFilters,
      });

      // Should return the processed non-loading filter, since conflicts only affect fallback to initial state
      expect(result).toEqual([{ id: "status", value: "active" }]);
    });

    it("returns processed results when no loading conflicts exist", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "status",
          accessorKey: "status",
          meta: {
            filter: {
              variant: "select",
              persistenceStorage: "url",
              isLoading: false,
              options: [{ label: "Active", value: "active" }],
            },
          },
        },
        {
          id: "department",
          accessorKey: "department",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlBucket = { status: "active", department: "engineering" };
      const initialFilters: ColumnFiltersState = [
        { id: "role", value: ["admin"] },
      ]; // Different column
      const result = computeInitialColumnFiltersState({
        columns: columns,
        urlBucket: urlBucket,
        localBucket: {},
        optimisticAsync: false,
        initialStateFilters: initialFilters,
      });

      // Should return processed results since no loading conflicts
      expect(result).toEqual([
        { id: "status", value: "active" },
        { id: "department", value: "engineering" },
      ]);
    });
  });
});
