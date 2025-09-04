import { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import { buildColumnFiltersFromBuckets } from "../buildColumnFiltersFromBuckets";

interface TestData {
  id: string;
  name: string;
  age: number;
  status: string;
  active: boolean;
}

type ColumnDefMaybeGroup<TData> = ColumnDef<TData, unknown> & {
  columns?: Array<ColumnDef<TData, unknown>>;
};

describe("buildColumnFiltersFromBuckets", () => {
  describe("basic functionality", () => {
    it("returns null for empty columns", () => {
      const result = buildColumnFiltersFromBuckets<TestData>([], {}, {});
      expect(result).toBeNull();
    });

    it("returns null when no columns have filter persistence", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        { id: "name", accessorKey: "name" },
        { id: "age", accessorKey: "age" },
      ];
      const result = buildColumnFiltersFromBuckets(columns, {}, {});
      expect(result).toBeNull();
    });

    it("returns null when no persisted values exist", () => {
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
      const result = buildColumnFiltersFromBuckets(columns, {}, {});
      expect(result).toBeNull();
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
      const urlState = { name: "john" };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
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
      const localState = { age: 25 };
      const result = buildColumnFiltersFromBuckets(columns, {}, localState);
      expect(result).toEqual([{ id: "age", value: 25 }]);
    });

    it("builds filters from both buckets", () => {
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
      ];
      const urlState = { name: "john" };
      const localState = { age: 25 };
      const result = buildColumnFiltersFromBuckets(
        columns,
        urlState,
        localState
      );
      expect(result).toEqual([
        { id: "name", value: "john" },
        { id: "age", value: 25 },
      ]);
    });
  });

  describe("custom keys", () => {
    it("uses custom key when provided", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
              key: "searchName",
            },
          },
        },
      ];
      const urlState = { searchName: "alice" };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      expect(result).toEqual([{ id: "name", value: "alice" }]);
    });

    it("falls back to column identifier when no custom key", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          accessorKey: "name", // No explicit id, will use accessorKey
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlState = { name: "bob" };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      expect(result).toEqual([{ id: "name", value: "bob" }]);
    });
  });

  describe("empty value filtering", () => {
    it("filters out empty string values", () => {
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
      const urlState = { name: "" };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      expect(result).toBeNull();
    });

    it("filters out null values", () => {
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
      const localState = { age: null };
      const result = buildColumnFiltersFromBuckets(columns, {}, localState);
      expect(result).toBeNull();
    });

    it("filters out undefined values", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "status",
          accessorKey: "status",
          meta: {
            filter: {
              variant: "select",
              persistenceStorage: "url",
              // @ts-expect-error - this is normal, we're testing the type coercion
              options: undefined,
            },
          },
        },
      ];
      const urlState = { status: undefined };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      expect(result).toBeNull();
    });

    it("filters out empty arrays", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "tags",
          accessorKey: "tags",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "url",
              options: [],
            },
          },
        },
      ];
      const urlState = { tags: [] };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      expect(result).toBeNull();
    });

    it("keeps non-empty values", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "count",
          accessorKey: "count",
          meta: {
            filter: {
              variant: "number",
              persistenceStorage: "url",
            },
          },
        },
      ];
      const urlState = { count: 0 }; // 0 is not empty
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      expect(result).toEqual([{ id: "count", value: 0 }]);
    });

    it("keeps boolean false values", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "active",
          accessorKey: "active",
          meta: {
            filter: {
              variant: "select",
              persistenceStorage: "localStorage",
              options: [
                {
                  // @ts-expect-error - this is normal, we're testing the type coercion
                  value: false,
                  label: "false",
                },
              ],
            },
          },
        },
      ];
      const localState = { active: false }; // false is not empty
      const result = buildColumnFiltersFromBuckets(columns, {}, localState);
      expect(result).toEqual([{ id: "active", value: false }]);
    });
  });

  describe("grouped columns", () => {
    it("processes filters from grouped columns", () => {
      const groupedColumns: ColumnDefMaybeGroup<TestData>[] = [
        {
          id: "personalGroup",
          header: "Personal Info",
          columns: [
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
          ],
        },
      ];

      const urlState = { name: "charlie" };
      const localState = { age: 30 };
      const result = buildColumnFiltersFromBuckets(
        groupedColumns,
        urlState,
        localState
      );
      expect(result).toEqual([
        { id: "name", value: "charlie" },
        { id: "age", value: 30 },
      ]);
    });

    it("processes filters from nested grouped columns", () => {
      const nestedColumns: ColumnDefMaybeGroup<TestData>[] = [
        {
          id: "outerGroup",
          header: "Outer Group",
          columns: [
            {
              id: "innerGroup",
              header: "Inner Group",
              columns: [
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
              ],
            } as ColumnDefMaybeGroup<TestData>,
          ],
        },
      ];

      const urlState = { name: "nested-value" };
      const result = buildColumnFiltersFromBuckets(nestedColumns, urlState, {});
      expect(result).toEqual([{ id: "name", value: "nested-value" }]);
    });

    it("handles mixed regular and grouped columns", () => {
      const mixedColumns: ColumnDefMaybeGroup<TestData>[] = [
        {
          id: "id",
          accessorKey: "id",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
        {
          id: "group",
          header: "Group",
          columns: [
            {
              id: "name",
              accessorKey: "name",
              meta: {
                filter: {
                  variant: "text",
                  persistenceStorage: "localStorage",
                },
              },
            },
          ],
        },
      ];

      const urlState = { id: "123" };
      const localState = { name: "grouped-name" };
      const result = buildColumnFiltersFromBuckets(
        mixedColumns,
        urlState,
        localState
      );
      expect(result).toEqual([
        { id: "id", value: "123" },
        { id: "name", value: "grouped-name" },
      ]);
    });
  });

  describe("edge cases", () => {
    it("skips columns without filter meta", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        { id: "name", accessorKey: "name" }, // No filter meta
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
      const urlState = { name: "should-be-ignored", age: 25 };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      expect(result).toEqual([{ id: "age", value: 25 }]);
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
      const urlState = { name: "should-be-ignored" };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      expect(result).toBeNull();
    });

    it("throws error for columns without valid column identifier", () => {
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
      const urlState = { anything: "value" };

      expect(() =>
        buildColumnFiltersFromBuckets(columns, urlState, {})
      ).toThrow(
        "Column must have either an 'id' or 'accessorKey' property defined"
      );
    });

    it("handles complex filter values", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "range",
          accessorKey: "age",
          meta: {
            filter: {
              variant: "numberRange",
              persistenceStorage: "url",
            },
          },
        },
        {
          id: "multiSelect",
          accessorKey: "tags",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "localStorage",
              options: [
                {
                  value: "tag1",
                  label: "tag1",
                },
                {
                  value: "tag2",
                  label: "tag2",
                },
                {
                  value: "tag3",
                  label: "tag3",
                },
              ],
            },
          },
        },
      ];

      const urlState = { range: [18, 65] };
      const localState = { multiSelect: ["tag1", "tag2", "tag3"] };
      const result = buildColumnFiltersFromBuckets(
        columns,
        urlState,
        localState
      );
      expect(result).toEqual([
        { id: "range", value: [18, 65] },
        { id: "multiSelect", value: ["tag1", "tag2", "tag3"] },
      ]);
    });

    it("maintains filter order based on column order", () => {
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

      const urlState = { z_last: "z-value", a_first: "a-value" };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      // Should maintain column order, not alphabetical
      expect(result).toEqual([
        { id: "z_last", value: "z-value" },
        { id: "a_first", value: "a-value" },
      ]);
    });

    it("handles undefined meta", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: undefined,
        },
      ];
      const urlState = { name: "ignored" };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      expect(result).toBeNull();
    });

    it("handles empty meta", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {},
        },
      ];
      const urlState = { name: "ignored" };
      const result = buildColumnFiltersFromBuckets(columns, urlState, {});
      expect(result).toBeNull();
    });

    it("returns empty array as null", () => {
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
      // Empty state
      const result = buildColumnFiltersFromBuckets(columns, {}, {});
      expect(result).toBeNull();
    });

    it("prefers URL bucket when both have the same key", () => {
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
      const urlState = { name: "url-value" };
      const localState = { name: "local-value" }; // Should be ignored
      const result = buildColumnFiltersFromBuckets(
        columns,
        urlState,
        localState
      );
      expect(result).toEqual([{ id: "name", value: "url-value" }]);
    });
  });

  describe("type safety", () => {
    it("works with different data types", () => {
      interface CustomData {
        customField: string;
        numericField: number;
      }

      const customColumns: ColumnDef<CustomData, unknown>[] = [
        {
          id: "custom",
          accessorKey: "customField",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];

      const urlState = { custom: "custom-value" };
      const result = buildColumnFiltersFromBuckets(customColumns, urlState, {});
      expect(result).toEqual([{ id: "custom", value: "custom-value" }]);
    });
  });
});
