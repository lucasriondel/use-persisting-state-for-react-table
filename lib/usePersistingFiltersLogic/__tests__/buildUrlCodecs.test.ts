import { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import { buildUrlCodecs } from "../buildUrlCodecs";

interface TestData {
  id: string;
  name: string;
  age: number;
  active: boolean;
}

type ColumnDefMaybeGroup<TData> = ColumnDef<TData, unknown> & {
  columns?: Array<ColumnDef<TData, unknown>>;
};

describe("buildUrlCodecs", () => {
  describe("basic functionality", () => {
    it("returns empty object for empty columns", () => {
      const result = buildUrlCodecs<TestData>([]);
      expect(result).toEqual({});
    });

    it("returns empty object when no URL persistence columns", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
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
      ];
      const result = buildUrlCodecs(columns);
      expect(result).toEqual({});
    });

    it("returns empty object when no filter meta", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        { id: "name", accessorKey: "name" },
      ];
      const result = buildUrlCodecs(columns);
      expect(result).toEqual({});
    });
  });

  describe("codec extraction", () => {
    it("extracts codec for URL persistence column", () => {
      const testCodec = {
        parse: (s: string) => JSON.parse(s) as string,
        format: (v: string) => JSON.stringify(v),
      };

      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
              codec: testCodec,
            },
          },
        },
      ];

      const result = buildUrlCodecs(columns);
      expect(result).toEqual({ name: testCodec });
    });

    it("extracts multiple codecs", () => {
      const nameCodec = {
        parse: (s: string) => s,
        format: (v: unknown) => String(v),
      };

      const ageCodec = {
        parse: (s: string) => Number(s),
        format: (v: unknown) => String(v),
      };

      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
              codec: nameCodec,
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
              codec: ageCodec,
            },
          },
        },
      ];

      const result = buildUrlCodecs(columns);
      expect(result).toEqual({
        name: nameCodec,
        age: ageCodec,
      });
    });

    it("skips columns without codecs", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
              // no codec
            },
          },
        },
      ];

      const result = buildUrlCodecs(columns);
      expect(result).toEqual({});
    });

    it("skips localStorage persistence columns even with codecs", () => {
      const testCodec = {
        parse: (s: string) => s,
        format: (v: unknown) => String(v),
      };

      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "localStorage",
              codec: testCodec,
            },
          },
        },
      ];

      const result = buildUrlCodecs(columns);
      expect(result).toEqual({});
    });
  });

  describe("column flattening", () => {
    it("extracts codecs from grouped columns", () => {
      const nameCodec = {
        parse: (s: string) => s,
        format: (v: unknown) => String(v),
      };

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
                  codec: nameCodec,
                },
              },
            },
          ],
        },
      ];

      const result = buildUrlCodecs(groupedColumns);
      expect(result).toEqual({ name: nameCodec });
    });

    it("extracts codecs from nested grouped columns", () => {
      const nameCodec = {
        parse: (s: string) => s,
        format: (v: unknown) => String(v),
      };

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
                      codec: nameCodec,
                    },
                  },
                },
              ],
            } as ColumnDefMaybeGroup<TestData>,
          ],
        },
      ];

      const result = buildUrlCodecs(nestedColumns);
      expect(result).toEqual({ name: nameCodec });
    });

    it("handles mixed regular and grouped columns", () => {
      const nameCodec = {
        parse: (s: string) => s,
        format: (v: unknown) => String(v),
      };

      const ageCodec = {
        parse: (s: string) => Number(s),
        format: (v: unknown) => String(v),
      };

      const mixedColumns: ColumnDefMaybeGroup<TestData>[] = [
        {
          id: "id",
          accessorKey: "id",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
              codec: nameCodec,
            },
          },
        },
        {
          id: "group",
          header: "Group",
          columns: [
            {
              id: "age",
              accessorKey: "age",
              meta: {
                filter: {
                  variant: "number",
                  persistenceStorage: "url",
                  codec: ageCodec,
                },
              },
            },
          ],
        },
      ];

      const result = buildUrlCodecs(mixedColumns);
      expect(result).toEqual({
        id: nameCodec,
        age: ageCodec,
      });
    });
  });

  describe("edge cases", () => {
    it("handles columns with no ID but uses getColumnIdentifier", () => {
      const testCodec = {
        parse: (s: string) => s,
        format: (v: unknown) => String(v),
      };

      const columns: ColumnDef<TestData, unknown>[] = [
        {
          accessorKey: "name", // No explicit id
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
              codec: testCodec,
            },
          },
        },
      ];

      const result = buildUrlCodecs(columns);
      expect(result).toEqual({ name: testCodec });
    });

    it("throws error for columns where getColumnIdentifier fails", () => {
      const testCodec = {
        parse: (s: string) => s,
        format: (v: unknown) => String(v),
      };

      const columns: ColumnDef<TestData, unknown>[] = [
        {
          // No id and no accessorKey - getColumnIdentifier will throw
          header: "Test Header",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
              codec: testCodec,
            },
          },
        },
      ];

      expect(() => buildUrlCodecs(columns)).toThrow(
        "Column must have either an 'id' or 'accessorKey' property defined"
      );
    });

    it("handles undefined filter meta", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
        },
      ];

      const result = buildUrlCodecs(columns);
      expect(result).toEqual({});
    });

    it("handles empty meta object", () => {
      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {},
        },
      ];

      const result = buildUrlCodecs(columns);
      expect(result).toEqual({});
    });

    it("handles columns with different persistenceStorage values", () => {
      const urlCodec = {
        parse: (s: string) => s,
        format: (v: unknown) => String(v),
      };

      const localCodec = {
        parse: (s: string) => s.toUpperCase(),
        format: (v: unknown) => String(v).toLowerCase(),
      };

      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "urlColumn",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
              codec: urlCodec,
            },
          },
        },
        {
          id: "localColumn",
          accessorKey: "age",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "localStorage",
              codec: localCodec,
            },
          },
        },
        {
          id: "noStorageColumn",
          accessorKey: "active",
          meta: {
            filter: {
              variant: "text",
              // no persistenceStorage
              codec: localCodec,
            },
          },
        },
      ];

      const result = buildUrlCodecs(columns);
      expect(result).toEqual({ urlColumn: urlCodec });
    });

    it("preserves codec references", () => {
      const originalCodec = {
        parse: (s: string) => s,
        format: (v: unknown) => String(v),
      };

      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "name",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
              codec: originalCodec,
            },
          },
        },
      ];

      const result = buildUrlCodecs(columns);
      expect(result.name).toBe(originalCodec); // Same reference
    });

    it("handles complex codec objects", () => {
      const complexCodec = {
        parse: (s: string) => {
          try {
            return JSON.parse(s) as string;
          } catch {
            return s;
          }
        },
        format: (v: unknown) => {
          if (typeof v === "object") {
            return JSON.stringify(v);
          }
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          return String(v);
        },
        metadata: { type: "complex" },
      };

      const columns: ColumnDef<TestData, unknown>[] = [
        {
          id: "complex",
          accessorKey: "name",
          meta: {
            filter: {
              variant: "text",
              persistenceStorage: "url",
              codec: complexCodec,
            },
          },
        },
      ];

      const result = buildUrlCodecs(columns);
      expect(result.complex).toBe(complexCodec);
      expect((result.complex as typeof complexCodec).metadata).toEqual({
        type: "complex",
      });
    });
  });
});
