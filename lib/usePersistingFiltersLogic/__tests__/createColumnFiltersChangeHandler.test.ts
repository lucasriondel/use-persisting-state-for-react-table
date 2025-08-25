import { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { UrlApiActions } from "../../useUrlState";
import { LocalStorageApiActions } from "../@lucasriondel/use-local-storage-reacthook";
import { createColumnFiltersChangeHandler } from "../createColumnFiltersChangeHandler";

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

describe("createColumnFiltersChangeHandler", () => {
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
    it("patches URL storage when filter value changes", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [{ id: "name", value: "john" }];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "john" });
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("patches localStorage when filter value changes", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [{ id: "age", value: 25 }];

      handler(nextState, prevState);

      expect(mockLocalApi.patch).toHaveBeenCalledWith({ age: 25 });
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("handles function updater", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const updater = vi.fn(() => [{ id: "name", value: "updated" }]);

      handler(updater, prevState);

      expect(updater).toHaveBeenCalledWith(prevState);
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "updated" });
    });

    it("does not patch when nothing changes", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const state: ColumnFiltersState = [{ id: "name", value: "john" }];

      handler(state, state);

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("value change detection", () => {
    it("detects when value changes", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [{ id: "name", value: "john" }];
      const nextState: ColumnFiltersState = [{ id: "name", value: "jane" }];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "jane" });
    });

    it("detects when filter is added", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [{ id: "name", value: "john" }];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "john" });
    });

    it("detects when filter is removed", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [{ id: "name", value: "john" }];
      const nextState: ColumnFiltersState = [];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: undefined });
    });

    it("handles complex value changes (arrays)", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [
        { id: "tags", value: ["tag1", "tag2"] },
      ];
      const nextState: ColumnFiltersState = [
        { id: "tags", value: ["tag1", "tag3"] },
      ];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ tags: ["tag1", "tag3"] });
    });

    it("handles object value changes", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [
        { id: "dateRange", value: { from: "2022-01-01", to: "2022-06-30" } },
      ];
      const nextState: ColumnFiltersState = [
        { id: "dateRange", value: { from: "2022-01-01", to: "2022-12-31" } },
      ];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        dateRange: { from: "2022-01-01", to: "2022-12-31" },
      });
    });
  });

  describe("empty value handling", () => {
    it("clears filter when value becomes empty string", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [{ id: "name", value: "john" }];
      const nextState: ColumnFiltersState = [{ id: "name", value: "" }];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: undefined });
    });

    it("clears filter when value becomes empty array", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [{ id: "tags", value: ["tag1"] }];
      const nextState: ColumnFiltersState = [{ id: "tags", value: [] }];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ tags: undefined });
    });

    it("clears filter when value becomes null", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [
        { id: "date", value: new Date("2022-01-01") },
      ];
      const nextState: ColumnFiltersState = [{ id: "date", value: null }];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ date: undefined });
    });

    it("keeps non-empty values like 0 and false", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [
        { id: "count", value: 0 },
        { id: "active", value: false },
      ];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ count: 0 });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ active: false });
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [{ id: "name", value: "alice" }];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ searchName: "alice" });
    });

    it("falls back to column identifier when no custom key", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          accessorKey: "name", // No explicit id
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [{ id: "name", value: "bob" }];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "bob" });
    });
  });

  describe("multiple filters", () => {
    it("patches both URL and localStorage in single call", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [
        { id: "name", value: "john" },
        { id: "age", value: 25 },
        { id: "status", value: "active" },
      ];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        name: "john",
        status: "active",
      });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        age: 25,
      });
    });

    it("only patches changed filters", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [
        { id: "name", value: "john" },
        { id: "age", value: 25 },
      ];
      const nextState: ColumnFiltersState = [
        { id: "name", value: "john" }, // No change
        { id: "age", value: 30 }, // Changed
      ];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        age: 30,
      });
    });

    it("handles mixed add/remove/update operations", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [
        { id: "name", value: "john" }, // Will be removed
        { id: "age", value: 25 }, // Will be updated
      ];
      const nextState: ColumnFiltersState = [
        { id: "age", value: 30 }, // Updated
        { id: "status", value: "active" }, // Added
      ];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        name: undefined, // Removed
        age: 30, // Updated
        status: "active", // Added
      });
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

      const handler = createColumnFiltersChangeHandler(
        groupedColumns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [
        { id: "name", value: "charlie" },
        { id: "age", value: 30 },
      ];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "charlie" });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ age: 30 });
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [
        { id: "name", value: "ignored" },
        { id: "age", value: 25 },
      ];

      handler(nextState, prevState);

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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [{ id: "name", value: "ignored" }];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [
        { id: "invalid", value: "ignored" },
      ];

      expect(() => handler(nextState, prevState)).toThrow(
        "Column must have either an 'id' or 'accessorKey' property defined"
      );
    });

    it("handles empty patch objects gracefully", () => {
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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const state: ColumnFiltersState = [{ id: "name", value: "unchanged" }];

      handler(state, state); // No changes

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

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const prevState: ColumnFiltersState = [];
      const nextState: ColumnFiltersState = [
        { id: "name", value: "john" },
        { id: "unknown", value: "ignored" }, // Not in columns
      ];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ name: "john" });
    });

    it("preserves reference equality for unchanged values", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "complexObject",
          accessorKey: "data",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
            },
          },
        },
      ];

      const handler = createColumnFiltersChangeHandler(
        columns,
        mockUrlApi,
        mockLocalApi
      );
      const sharedObject = { complex: "data", nested: { value: 42 } };
      const prevState: ColumnFiltersState = [
        { id: "complexObject", value: sharedObject },
      ];
      const nextState: ColumnFiltersState = [
        { id: "complexObject", value: sharedObject },
      ];

      handler(nextState, prevState);

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });
  });
});
