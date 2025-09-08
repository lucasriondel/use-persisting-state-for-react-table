import { describe, expect, it } from "vitest";
import { computeInitialSortingState } from "../computeInitialSortingState";

describe("computeInitialSortingState", () => {
  describe("when shouldPersist is false", () => {
    it("returns initialState when provided", () => {
      const result = computeInitialSortingState({
        shouldPersist: false,
        target: "url",
        columnKey: "sortColumn",
        directionKey: "sortDirection",
        urlBucket: { sortColumn: "name", sortDirection: "asc" },
        localBucket: {},
        initialState: [{ id: "age", desc: true }]
      });
      expect(result).toEqual([{ id: "age", desc: true }]);
    });

    it("returns initialState when undefined", () => {
      const result = computeInitialSortingState({
        shouldPersist: false,
        target: "localStorage",
        columnKey: "sortColumn",
        directionKey: "sortDirection",
        urlBucket: {},
        localBucket: { sortColumn: "name", sortDirection: "asc" },
        initialState: undefined
      });
      expect(result).toEqual([]);
    });

    it("ignores bucket data when shouldPersist is false", () => {
      const result = computeInitialSortingState({
        shouldPersist: false,
        target: "url",
        columnKey: "sortColumn",
        directionKey: "sortDirection",
        urlBucket: { sortColumn: "name", sortDirection: "desc" },
        localBucket: { sortColumn: "age", sortDirection: "asc" },
        initialState: [{ id: "email", desc: false }]
      });
      expect(result).toEqual([{ id: "email", desc: false }]);
    });
  });

  describe("when shouldPersist is true", () => {
    describe("with URL target", () => {
      it("returns URL bucket value when both column and direction present", () => {
        const urlBucket = { sortColumn: "name", sortDirection: "desc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket: {},
          initialState: [{ id: "age", desc: false }]
        });
        expect(result).toEqual([{ id: "name", desc: true }]);
      });

      it("returns URL bucket value with asc direction", () => {
        const urlBucket = { sortColumn: "email", sortDirection: "asc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket: {},
          initialState: undefined
        });
        expect(result).toEqual([{ id: "email", desc: false }]);
      });

      it("returns initialState when URL bucket is missing column", () => {
        const urlBucket = { sortDirection: "desc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket: {},
          initialState: [{ id: "age", desc: true }]
        });
        expect(result).toEqual([{ id: "age", desc: true }]);
      });

      it("returns initialState when URL bucket is missing direction", () => {
        const urlBucket = { sortColumn: "name" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket: {},
          initialState: [{ id: "age", desc: true }]
        });
        expect(result).toEqual([{ id: "age", desc: true }]);
      });

      it("returns initialState when URL bucket is empty", () => {
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: {},
          localBucket: { sortColumn: "name", sortDirection: "asc" },
          initialState: [{ id: "age", desc: false }]
        });
        expect(result).toEqual([{ id: "age", desc: false }]);
      });

      it("returns undefined when no URL bucket data and no initialState", () => {
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: {},
          localBucket: { sortColumn: "name", sortDirection: "asc" },
          initialState: undefined
        });
        expect(result).toEqual([]);
      });
    });

    describe("with localStorage target", () => {
      it("returns localStorage bucket value when both column and direction present", () => {
        const localBucket = { sortColumn: "age", sortDirection: "desc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "localStorage",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: { sortColumn: "name", sortDirection: "asc" },
          localBucket,
          initialState: [{ id: "email", desc: false }]
        });
        expect(result).toEqual([{ id: "age", desc: true }]);
      });

      it("returns localStorage bucket value with asc direction", () => {
        const localBucket = { sortColumn: "name", sortDirection: "asc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "localStorage",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: {},
          localBucket,
          initialState: undefined
        });
        expect(result).toEqual([{ id: "name", desc: false }]);
      });

      it("returns initialState when localStorage bucket is missing column", () => {
        const localBucket = { sortDirection: "asc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "localStorage",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: {},
          localBucket,
          initialState: [{ id: "email", desc: true }]
        });
        expect(result).toEqual([{ id: "email", desc: true }]);
      });

      it("returns initialState when localStorage bucket is missing direction", () => {
        const localBucket = { sortColumn: "age" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "localStorage",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: {},
          localBucket,
          initialState: [{ id: "name", desc: false }]
        });
        expect(result).toEqual([{ id: "name", desc: false }]);
      });

      it("returns initialState when localStorage bucket is empty", () => {
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "localStorage",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: { sortColumn: "name", sortDirection: "asc" },
          localBucket: {},
          initialState: [{ id: "age", desc: false }]
        });
        expect(result).toEqual([{ id: "age", desc: false }]);
      });

      it("returns undefined when no localStorage bucket data and no initialState", () => {
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "localStorage",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: { sortColumn: "name", sortDirection: "asc" },
          localBucket: {},
          initialState: undefined
        });
        expect(result).toEqual([]);
      });
    });

    describe("with undefined target", () => {
      it("uses localStorage bucket when target is undefined", () => {
        const localBucket = { sortColumn: "email", sortDirection: "desc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: undefined,
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: { sortColumn: "name", sortDirection: "asc" },
          localBucket,
          initialState: [{ id: "age", desc: false }]
        });
        expect(result).toEqual([{ id: "email", desc: true }]);
      });

      it("returns initialState when no localStorage bucket data and target is undefined", () => {
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: undefined,
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: { sortColumn: "name", sortDirection: "asc" },
          localBucket: {},
          initialState: [{ id: "age", desc: false }]
        });
        expect(result).toEqual([{ id: "age", desc: false }]);
      });

      it("returns undefined when no localStorage bucket data and no initialState and target is undefined", () => {
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: undefined,
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: { sortColumn: "name", sortDirection: "asc" },
          localBucket: {},
          initialState: undefined
        });
        expect(result).toEqual([]);
      });
    });

    describe("edge cases", () => {
      it("handles falsy column values", () => {
        const urlBucket = { sortColumn: null, sortDirection: "asc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket: {},
          initialState: [{ id: "fallback", desc: true }]
        });
        expect(result).toEqual([{ id: "fallback", desc: true }]);
      });

      it("handles falsy direction values", () => {
        const urlBucket = { sortColumn: "name", sortDirection: undefined };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket: {},
          initialState: [{ id: "fallback", desc: false }]
        });
        expect(result).toEqual([{ id: "fallback", desc: false }]);
      });

      it("handles empty string column", () => {
        const urlBucket = { sortColumn: "", sortDirection: "desc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket: {},
          initialState: [{ id: "fallback", desc: true }]
        });
        expect(result).toEqual([{ id: "fallback", desc: true }]);
      });

      it("handles empty string direction", () => {
        const urlBucket = { sortColumn: "name", sortDirection: "" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket: {},
          initialState: [{ id: "fallback", desc: false }]
        });
        expect(result).toEqual([{ id: "fallback", desc: false }]);
      });

      it("handles invalid direction values as falsy", () => {
        const urlBucket = { sortColumn: "name", sortDirection: "invalid" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket: {},
          initialState: undefined
        });
        expect(result).toEqual([]);
      });

      it("prioritizes URL bucket over localStorage when target is url", () => {
        const urlBucket = { sortColumn: "url_col", sortDirection: "desc" };
        const localBucket = { sortColumn: "local_col", sortDirection: "asc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket,
          initialState: [{ id: "fallback", desc: false }]
        });
        expect(result).toEqual([{ id: "url_col", desc: true }]);
      });

      it("prioritizes localStorage bucket over URL when target is localStorage", () => {
        const urlBucket = { sortColumn: "url_col", sortDirection: "desc" };
        const localBucket = { sortColumn: "local_col", sortDirection: "asc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "localStorage",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket,
          localBucket,
          initialState: [{ id: "fallback", desc: false }]
        });
        expect(result).toEqual([{ id: "local_col", desc: false }]);
      });

      it("handles different key names", () => {
        const urlBucket = { customColumn: "name", customDirection: "desc" };
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "customColumn",
          directionKey: "customDirection",
          urlBucket,
          localBucket: {},
          initialState: undefined
        });
        expect(result).toEqual([{ id: "name", desc: true }]);
      });

      it("treats 'desc' as true, everything else as false", () => {
        const testCases = [
          { dir: "desc", expected: true },
          { dir: "asc", expected: false },
          { dir: "DESC", expected: false },
          { dir: "ascending", expected: false },
          { dir: "descending", expected: false },
        ];

        testCases.forEach(({ dir, expected }) => {
          const urlBucket = { sortColumn: "name", sortDirection: dir };
          const result = computeInitialSortingState({
            shouldPersist: true,
            target: "url",
            columnKey: "sortColumn",
            directionKey: "sortDirection",
            urlBucket,
            localBucket: {},
            initialState: undefined
          });
          // Only "desc" and "asc" are valid directions, others return empty array
          if (dir === "desc" || dir === "asc") {
            expect(result).toEqual([{ id: "name", desc: expected }]);
          } else {
            expect(result).toEqual([]);
          }
        });
      });

      it("handles complex sorting state with multiple sorts in initial state", () => {
        const multiSortInitial = [
          { id: "name", desc: false },
          { id: "age", desc: true },
        ];
        // Should still only return first sort when persisted data is incomplete
        const result = computeInitialSortingState({
          shouldPersist: true,
          target: "url",
          columnKey: "sortColumn",
          directionKey: "sortDirection",
          urlBucket: {},
          localBucket: {},
          initialState: multiSortInitial
        });
        expect(result).toEqual(multiSortInitial);
      });
    });
  });
});