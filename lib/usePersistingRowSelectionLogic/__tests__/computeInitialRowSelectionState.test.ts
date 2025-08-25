import { describe, expect, it } from "vitest";
import { computeInitialRowSelectionState } from "../computeInitialRowSelectionState";

describe("computeInitialRowSelectionState", () => {
  describe("when shouldPersist is false", () => {
    it("returns initialState when provided", () => {
      const result = computeInitialRowSelectionState(
        false,
        "url",
        "rowSelection",
        { rowSelection: { "1": true } },
        {},
        { "0": true, "2": true }
      );
      expect(result).toEqual({ "0": true, "2": true });
    });

    it("returns initialState when undefined", () => {
      const result = computeInitialRowSelectionState(
        false,
        "localStorage",
        "rowSelection",
        {},
        { rowSelection: { "1": true } },
        undefined
      );
      expect(result).toBeUndefined();
    });

    it("ignores bucket data when shouldPersist is false", () => {
      const result = computeInitialRowSelectionState(
        false,
        "url",
        "rowSelection",
        { rowSelection: { "1": true, "2": true } },
        { rowSelection: { "3": true } },
        { "0": true }
      );
      expect(result).toEqual({ "0": true });
    });
  });

  describe("when shouldPersist is true", () => {
    describe("with URL target", () => {
      it("returns URL bucket value when present", () => {
        const urlBucket = { rowSelection: { "1": true, "2": true } };
        const result = computeInitialRowSelectionState(
          true,
          "url",
          "rowSelection",
          urlBucket,
          {},
          { "0": true }
        );
        expect(result).toEqual({ "1": true, "2": true });
      });

      it("returns initialState when URL bucket is empty", () => {
        const result = computeInitialRowSelectionState(
          true,
          "url",
          "rowSelection",
          {},
          { rowSelection: { "1": true } },
          { "0": true }
        );
        expect(result).toEqual({ "0": true });
      });

      it("returns initialState when URL bucket key is undefined", () => {
        const urlBucket = { rowSelection: undefined };
        const result = computeInitialRowSelectionState(
          true,
          "url",
          "rowSelection",
          urlBucket,
          {},
          { "0": true }
        );
        expect(result).toEqual({ "0": true });
      });

      it("returns undefined when no URL bucket data and no initialState", () => {
        const result = computeInitialRowSelectionState(
          true,
          "url",
          "rowSelection",
          {},
          { rowSelection: { "1": true } },
          undefined
        );
        expect(result).toBeUndefined();
      });
    });

    describe("with localStorage target", () => {
      it("returns localStorage bucket value when present", () => {
        const localBucket = { rowSelection: { "3": true, "4": true } };
        const result = computeInitialRowSelectionState(
          true,
          "localStorage",
          "rowSelection",
          { rowSelection: { "1": true } },
          localBucket,
          { "0": true }
        );
        expect(result).toEqual({ "3": true, "4": true });
      });

      it("returns initialState when localStorage bucket is empty", () => {
        const result = computeInitialRowSelectionState(
          true,
          "localStorage",
          "rowSelection",
          { rowSelection: { "1": true } },
          {},
          { "0": true }
        );
        expect(result).toEqual({ "0": true });
      });

      it("returns initialState when localStorage bucket key is undefined", () => {
        const localBucket = { rowSelection: undefined };
        const result = computeInitialRowSelectionState(
          true,
          "localStorage",
          "rowSelection",
          {},
          localBucket,
          { "0": true }
        );
        expect(result).toEqual({ "0": true });
      });

      it("returns undefined when no localStorage bucket data and no initialState", () => {
        const result = computeInitialRowSelectionState(
          true,
          "localStorage",
          "rowSelection",
          { rowSelection: { "1": true } },
          {},
          undefined
        );
        expect(result).toBeUndefined();
      });
    });

    describe("with undefined target", () => {
      it("uses localStorage bucket when target is undefined", () => {
        const result = computeInitialRowSelectionState(
          true,
          undefined,
          "rowSelection",
          { rowSelection: { "1": true } },
          { rowSelection: { "2": true } },
          { "0": true }
        );
        expect(result).toEqual({ "2": true });
      });

      it("returns initialState when no localStorage bucket data and target is undefined", () => {
        const result = computeInitialRowSelectionState(
          true,
          undefined,
          "rowSelection",
          { rowSelection: { "1": true } },
          {},
          { "0": true }
        );
        expect(result).toEqual({ "0": true });
      });

      it("returns undefined when no localStorage bucket data and no initialState and target is undefined", () => {
        const result = computeInitialRowSelectionState(
          true,
          undefined,
          "rowSelection",
          { rowSelection: { "1": true } },
          {},
          undefined
        );
        expect(result).toBeUndefined();
      });
    });

    describe("edge cases", () => {
      it("handles empty row selection objects", () => {
        const result = computeInitialRowSelectionState(
          true,
          "url",
          "rowSelection",
          { rowSelection: {} },
          {},
          undefined
        );
        expect(result).toEqual({});
      });

      it("handles falsy values in buckets", () => {
        const urlBucket = { rowSelection: null };
        const result = computeInitialRowSelectionState(
          true,
          "url",
          "rowSelection",
          urlBucket,
          {},
          { "0": true }
        );
        expect(result).toEqual({ "0": true });
      });

      it("handles zero and false values in row selection", () => {
        const urlBucket = { rowSelection: { "0": false, "1": true, "2": false } };
        const result = computeInitialRowSelectionState(
          true,
          "url",
          "rowSelection",
          urlBucket,
          {},
          undefined
        );
        expect(result).toEqual({ "0": false, "1": true, "2": false });
      });

      it("prioritizes URL bucket over localStorage when target is url", () => {
        const urlBucket = { rowSelection: { "1": true } };
        const localBucket = { rowSelection: { "2": true } };
        const result = computeInitialRowSelectionState(
          true,
          "url",
          "rowSelection",
          urlBucket,
          localBucket,
          { "0": true }
        );
        expect(result).toEqual({ "1": true });
      });

      it("prioritizes localStorage bucket over URL when target is localStorage", () => {
        const urlBucket = { rowSelection: { "1": true } };
        const localBucket = { rowSelection: { "2": true } };
        const result = computeInitialRowSelectionState(
          true,
          "localStorage",
          "rowSelection",
          urlBucket,
          localBucket,
          { "0": true }
        );
        expect(result).toEqual({ "2": true });
      });
    });
  });
});