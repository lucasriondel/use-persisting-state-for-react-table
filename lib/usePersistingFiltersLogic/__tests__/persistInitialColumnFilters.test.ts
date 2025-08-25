import { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UrlApiActions } from "../../useUrlState";
import { LocalStorageApiActions } from "../@lucasriondel/use-local-storage-reacthook";
import { persistInitialColumnFilters } from "../persistInitialColumnFilters";

interface TestData {
  id: string;
  name: string;
  age: number;
  status: string;
  tags: string[];
}

type ColumnDefMaybeGroup<TData> = ColumnDef<TData, unknown> & {
  columns?: Array<ColumnDef<TData, unknown>>;
};

describe("persistInitialColumnFilters", () => {
  const mockUrlApi: UrlApiActions<Record<string, unknown>> = {
    setState: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    patch: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  };

  const mockLocalApi: LocalStorageApiActions<Record<string, unknown>> = {
    setState: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    patch: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("does nothing when initialFilters is undefined", () => {
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

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        undefined
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does nothing when initialFilters is empty", () => {
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

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        []
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist when persisted values already exist", () => {
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

      const urlBucket = { name: "existing-value" };
      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "initial-value" },
      ];

      persistInitialColumnFilters(
        columns,
        urlBucket,
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists to URL when no existing values", () => {
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
        { id: "name", value: "initial-value" },
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "initial-value" });
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists to localStorage when no existing values", () => {
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

      const initialFilters: ColumnFiltersState = [{ id: "age", value: 25 }];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({ age: 25 });
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("empty value detection", () => {
    it("detects empty string as empty", () => {
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

      const urlBucket = { name: "" }; // Empty string
      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "initial" },
      ];

      persistInitialColumnFilters(
        columns,
        urlBucket,
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "initial" });
    });

    it("detects null as empty", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "date",
          accessorKey: "date",
          meta: {
            filter: {
              variant: "date",
              persistenceStorage: "url",
            },
          },
        },
      ];

      const urlBucket = { date: null };
      const initialFilters: ColumnFiltersState = [
        { id: "date", value: new Date("2022-01-01") },
      ];

      persistInitialColumnFilters(
        columns,
        urlBucket,
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        date: new Date("2022-01-01"),
      });
    });

    it("detects undefined as empty", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "status",
          accessorKey: "status",
          meta: {
            filter: {
              variant: "select",
              persistenceStorage: "localStorage",
            },
          },
        },
      ];

      const localBucket = { status: undefined };
      const initialFilters: ColumnFiltersState = [
        { id: "status", value: "active" },
      ];

      persistInitialColumnFilters(
        columns,
        {},
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({ status: "active" });
    });

    it("detects empty array as empty", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "tags",
          accessorKey: "tags",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "url",
            },
          },
        },
      ];

      const urlBucket = { tags: [] };
      const initialFilters: ColumnFiltersState = [
        { id: "tags", value: ["tag1", "tag2"] },
      ];

      persistInitialColumnFilters(
        columns,
        urlBucket,
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ tags: ["tag1", "tag2"] });
    });

    it("recognizes non-empty values like 0 and false", () => {
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
        {
          id: "active",
          accessorKey: "active",
          meta: {
            filter: {
              variant: "select",
              persistenceStorage: "localStorage",
            },
          },
        },
      ];

      const urlBucket = { count: 0 }; // 0 is not empty
      const localBucket = { active: false }; // false is not empty
      const initialFilters: ColumnFiltersState = [
        { id: "count", value: 10 },
        { id: "active", value: true },
      ];

      persistInitialColumnFilters(
        columns,
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      // Should not persist because existing values are not empty
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
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

      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "alice" },
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ searchName: "alice" });
    });

    it("falls back to column ID when no custom key", () => {
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

      const initialFilters: ColumnFiltersState = [{ id: "name", value: "bob" }];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "bob" });
    });
  });

  describe("multiple filters", () => {
    it("persists to both URL and localStorage in separate calls", () => {
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
            },
          },
        },
      ];

      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "john" },
        { id: "age", value: 25 },
        { id: "status", value: "active" },
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        name: "john",
        status: "active",
      });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        age: 25,
      });
    });

    it("only persists when no existing values for any filter", () => {
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

      const urlBucket = { name: "existing" }; // One filter has existing value
      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "initial-name" },
        { id: "age", value: 25 },
      ];

      persistInitialColumnFilters(
        columns,
        urlBucket,
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists partial filters when some have no matching columns", () => {
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
        { id: "name", value: "john" },
        { id: "unknown", value: "ignored" }, // No matching column
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "john" });
    });
  });

  describe("empty value filtering in initial filters", () => {
    it("skips empty values in initial filters", () => {
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
              persistenceStorage: "url",
            },
          },
        },
      ];

      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "" }, // Empty value
        { id: "age", value: 25 }, // Valid value
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ age: 25 });
    });

    it("does not persist when all initial values are empty", () => {
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
          id: "tags",
          accessorKey: "tags",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "url",
            },
          },
        },
      ];

      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "" },
        { id: "tags", value: [] },
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
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

      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "charlie" },
        { id: "age", value: 30 },
      ];

      persistInitialColumnFilters(
        groupedColumns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "charlie" });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ age: 30 });
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

      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "nested-value" },
      ];

      persistInitialColumnFilters(
        nestedColumns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "nested-value" });
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

      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "ignored" },
        { id: "age", value: 25 },
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ age: 25 });
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

      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "ignored" },
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("handles filters not found in columns", () => {
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
        { id: "name", value: "john" },
        { id: "unknown", value: "ignored" }, // Not in columns
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "john" });
    });

    it("handles complex filter values", () => {
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
        {
          id: "tags",
          accessorKey: "tags",
          meta: {
            filter: {
              variant: "multiSelect",
              persistenceStorage: "localStorage",
            },
          },
        },
      ];

      const initialFilters: ColumnFiltersState = [
        {
          id: "dateRange",
          value: [new Date("2022-01-01"), new Date("2022-12-31")],
        },
        { id: "tags", value: ["tag1", "tag2", "tag3"] },
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        dateRange: [new Date("2022-01-01"), new Date("2022-12-31")],
      });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        tags: ["tag1", "tag2", "tag3"],
      });
    });

    it("handles mixed existing values across storage types", () => {
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

      const urlBucket = { name: "existing-url" };
      const localBucket = {}; // Empty localStorage
      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "initial-name" },
        { id: "age", value: 25 },
      ];

      // Should not persist because URL has existing value
      persistInitialColumnFilters(
        columns,
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not create patches when no filters match persistence columns", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        { id: "name", accessorKey: "name" }, // No persistence
      ];

      const initialFilters: ColumnFiltersState = [
        { id: "name", value: "john" },
      ];

      persistInitialColumnFilters(
        columns,
        {},
        {},
        mockUrlApi,
        mockLocalApi,
        initialFilters
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });
});
