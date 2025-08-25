import { describe, expect, it } from "vitest";
import { ColumnDef } from "@tanstack/react-table";
import { flattenColumns } from "../flattenColumns";

type ColumnDefMaybeGroup<TData> = ColumnDef<TData, unknown> & {
  columns?: Array<ColumnDef<TData, unknown>>;
};

interface TestData {
  id: string;
  name: string;
  age: number;
  email: string;
}

describe("flattenColumns", () => {
  describe("basic functionality", () => {
    it("returns empty array for empty input", () => {
      const result = flattenColumns<TestData>([]);
      expect(result).toEqual([]);
    });

    it("returns single column as-is", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        { id: "name", accessorKey: "name" }
      ];
      const result = flattenColumns(columns);
      expect(result).toEqual(columns);
    });

    it("returns multiple columns as-is when no groups", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        { id: "name", accessorKey: "name" },
        { id: "age", accessorKey: "age" },
        { id: "email", accessorKey: "email" }
      ];
      const result = flattenColumns(columns);
      expect(result).toEqual(columns);
    });
  });

  describe("column groups", () => {
    it("flattens single level groups", () => {
      const groupColumn: ColumnDefMaybeGroup<TestData> = {
        id: "personal",
        header: "Personal Info",
        columns: [
          { id: "name", accessorKey: "name" },
          { id: "age", accessorKey: "age" }
        ]
      };
      const columns = [groupColumn];
      const result = flattenColumns(columns);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(groupColumn);
      expect(result[1]).toEqual({ id: "name", accessorKey: "name" });
      expect(result[2]).toEqual({ id: "age", accessorKey: "age" });
    });

    it("flattens multiple groups", () => {
      const personalGroup: ColumnDefMaybeGroup<TestData> = {
        id: "personal",
        header: "Personal",
        columns: [
          { id: "name", accessorKey: "name" },
          { id: "age", accessorKey: "age" }
        ]
      };
      const contactGroup: ColumnDefMaybeGroup<TestData> = {
        id: "contact",
        header: "Contact",
        columns: [
          { id: "email", accessorKey: "email" }
        ]
      };
      const columns = [personalGroup, contactGroup];
      const result = flattenColumns(columns);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual(personalGroup);
      expect(result[1]).toEqual({ id: "name", accessorKey: "name" });
      expect(result[2]).toEqual({ id: "age", accessorKey: "age" });
      expect(result[3]).toEqual(contactGroup);
      expect(result[4]).toEqual({ id: "email", accessorKey: "email" });
    });

    it("flattens nested groups", () => {
      const nestedGroup: ColumnDefMaybeGroup<TestData> = {
        id: "nested",
        header: "Nested",
        columns: [
          {
            id: "subgroup",
            header: "Subgroup",
            columns: [
              { id: "name", accessorKey: "name" },
              { id: "age", accessorKey: "age" }
            ]
          } as ColumnDefMaybeGroup<TestData>
        ]
      };
      const columns = [nestedGroup];
      const result = flattenColumns(columns);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(nestedGroup);
      expect(result[1]).toEqual({
        id: "subgroup",
        header: "Subgroup",
        columns: [
          { id: "name", accessorKey: "name" },
          { id: "age", accessorKey: "age" }
        ]
      });
      expect(result[2]).toEqual({ id: "name", accessorKey: "name" });
      expect(result[3]).toEqual({ id: "age", accessorKey: "age" });
    });

    it("handles mixed columns and groups", () => {
      const standaloneColumn: ColumnDef<TestData, unknown> = { id: "id", accessorKey: "id" };
      const group: ColumnDefMaybeGroup<TestData> = {
        id: "info",
        header: "Info",
        columns: [
          { id: "name", accessorKey: "name" },
          { id: "email", accessorKey: "email" }
        ]
      };
      const columns = [standaloneColumn, group];
      const result = flattenColumns(columns);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(standaloneColumn);
      expect(result[1]).toEqual(group);
      expect(result[2]).toEqual({ id: "name", accessorKey: "name" });
      expect(result[3]).toEqual({ id: "email", accessorKey: "email" });
    });
  });

  describe("edge cases", () => {
    it("handles groups with empty columns array", () => {
      const emptyGroup: ColumnDefMaybeGroup<TestData> = {
        id: "empty",
        header: "Empty Group",
        columns: []
      };
      const columns = [emptyGroup];
      const result = flattenColumns(columns);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(emptyGroup);
    });

    it("handles groups with undefined columns", () => {
      const undefinedGroup: ColumnDefMaybeGroup<TestData> = {
        id: "undefined",
        header: "Undefined Group",
        columns: undefined
      };
      const columns = [undefinedGroup];
      const result = flattenColumns(columns);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(undefinedGroup);
    });

    it("preserves column order in complex nested structure", () => {
      const complexStructure: ColumnDefMaybeGroup<TestData>[] = [
        { id: "col1", accessorKey: "id" },
        {
          id: "group1",
          header: "Group 1",
          columns: [
            { id: "col2", accessorKey: "name" },
            {
              id: "subgroup1",
              header: "Subgroup 1",
              columns: [
                { id: "col3", accessorKey: "age" }
              ]
            } as ColumnDefMaybeGroup<TestData>
          ]
        },
        { id: "col4", accessorKey: "email" }
      ];
      
      const result = flattenColumns(complexStructure);
      const ids = result.map(col => col.id);
      
      expect(ids).toEqual(["col1", "group1", "col2", "subgroup1", "col3", "col4"]);
    });

    it("handles deeply nested groups", () => {
      const deeplyNested: ColumnDefMaybeGroup<TestData> = {
        id: "level1",
        header: "Level 1",
        columns: [
          {
            id: "level2",
            header: "Level 2", 
            columns: [
              {
                id: "level3",
                header: "Level 3",
                columns: [
                  { id: "deepCol", accessorKey: "name" }
                ]
              } as ColumnDefMaybeGroup<TestData>
            ]
          } as ColumnDefMaybeGroup<TestData>
        ]
      };
      
      const result = flattenColumns([deeplyNested]);
      
      expect(result).toHaveLength(4);
      expect(result.map(col => col.id)).toEqual(["level1", "level2", "level3", "deepCol"]);
    });

    it("maintains reference equality for columns", () => {
      const originalColumn = { id: "test", accessorKey: "test" };
      const group: ColumnDefMaybeGroup<TestData> = {
        id: "group",
        header: "Group",
        columns: [originalColumn]
      };
      
      const result = flattenColumns([group]);
      
      expect(result[1]).toBe(originalColumn); // Same reference
    });
  });

  describe("type safety", () => {
    it("works with different data types", () => {
      interface CustomData {
        customField: string;
      }
      
      const customColumns: ColumnDef<CustomData, unknown>[] = [
        { id: "custom", accessorKey: "customField" }
      ];
      
      const result = flattenColumns(customColumns);
      expect(result).toEqual(customColumns);
    });
  });
});