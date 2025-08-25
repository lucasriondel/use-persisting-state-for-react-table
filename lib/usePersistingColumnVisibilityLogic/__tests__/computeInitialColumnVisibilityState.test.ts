import { describe, expect, it } from "vitest";
import { computeInitialColumnVisibilityState } from "../computeInitialColumnVisibilityState";
import type { VisibilityState } from "@tanstack/react-table";

describe("computeInitialColumnVisibilityState", () => {
  describe("when shouldPersist is false", () => {
    it("returns initialState when provided", () => {
      const initialState: VisibilityState = { col1: false, col2: true };
      const urlBucket = { columnVisibility: { col1: true } };
      const localBucket = { columnVisibility: { col1: true } };

      const result = computeInitialColumnVisibilityState(
        false,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual(initialState);
    });

    it("returns undefined when no initialState provided", () => {
      const urlBucket = { columnVisibility: { col1: true } };
      const localBucket = { columnVisibility: { col1: true } };

      const result = computeInitialColumnVisibilityState(
        false,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket
      );

      expect(result).toBeUndefined();
    });
  });

  describe("when shouldPersist is true", () => {
    describe("with URL target", () => {
      it("returns persisted state from URL bucket when available", () => {
        const persistedState: VisibilityState = { col1: false, col2: true };
        const initialState: VisibilityState = { col1: true, col2: false };
        const urlBucket = { columnVisibility: persistedState };
        const localBucket = {};

        const result = computeInitialColumnVisibilityState(
          true,
          "url",
          "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual(persistedState);
      });

      it("returns initialState when URL bucket has no data", () => {
        const initialState: VisibilityState = { col1: true, col2: false };
        const urlBucket = {};
        const localBucket = {};

        const result = computeInitialColumnVisibilityState(
          true,
          "url",
          "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual(initialState);
      });

      it("returns undefined when both URL bucket and initialState are missing", () => {
        const urlBucket = {};
        const localBucket = {};

        const result = computeInitialColumnVisibilityState(
          true,
          "url",
          "columnVisibility",
          urlBucket,
          localBucket
        );

        expect(result).toBeUndefined();
      });

      it("uses custom key to fetch from URL bucket", () => {
        const persistedState: VisibilityState = { col1: false, col2: true };
        const urlBucket = { 
          customKey: persistedState,
          columnVisibility: { col1: true, col2: false }
        };
        const localBucket = {};

        const result = computeInitialColumnVisibilityState(
          true,
          "url",
          "customKey",
          urlBucket,
          localBucket
        );

        expect(result).toEqual(persistedState);
      });
    });

    describe("with localStorage target", () => {
      it("returns persisted state from localStorage bucket when available", () => {
        const persistedState: VisibilityState = { col1: false, col2: true };
        const initialState: VisibilityState = { col1: true, col2: false };
        const urlBucket = {};
        const localBucket = { columnVisibility: persistedState };

        const result = computeInitialColumnVisibilityState(
          true,
          "localStorage",
          "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual(persistedState);
      });

      it("returns initialState when localStorage bucket has no data", () => {
        const initialState: VisibilityState = { col1: true, col2: false };
        const urlBucket = {};
        const localBucket = {};

        const result = computeInitialColumnVisibilityState(
          true,
          "localStorage",
          "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual(initialState);
      });

      it("uses custom key to fetch from localStorage bucket", () => {
        const persistedState: VisibilityState = { col1: false, col2: true };
        const urlBucket = {};
        const localBucket = { 
          customKey: persistedState,
          columnVisibility: { col1: true, col2: false }
        };

        const result = computeInitialColumnVisibilityState(
          true,
          "localStorage",
          "customKey",
          urlBucket,
          localBucket
        );

        expect(result).toEqual(persistedState);
      });
    });

    describe("with undefined target", () => {
      it("returns value from localBucket when target is undefined", () => {
        const initialState: VisibilityState = { col1: true, col2: false };
        const urlBucket = { columnVisibility: { col1: false } };
        const localBucket = { columnVisibility: { col1: false } };

        const result = computeInitialColumnVisibilityState(
          true,
          undefined,
          "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        );

        // When target is undefined, it uses localBucket[key]
        expect(result).toEqual({ col1: false });
      });
    });

    describe("edge cases", () => {
      it("handles falsy values in buckets correctly", () => {
        const initialState: VisibilityState = { col1: true };
        const urlBucket = { columnVisibility: null };
        const localBucket = {};

        const result = computeInitialColumnVisibilityState(
          true,
          "url",
          "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual(initialState);
      });

      it("handles empty objects in buckets", () => {
        const initialState: VisibilityState = { col1: true };
        const urlBucket = { columnVisibility: {} };
        const localBucket = {};

        const result = computeInitialColumnVisibilityState(
          true,
          "url",
          "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({});
      });

      it("handles 0 as a falsy value that falls back to initialState", () => {
        const initialState: VisibilityState = { col1: true };
        const urlBucket = { columnVisibility: 0 };
        const localBucket = {};

        const result = computeInitialColumnVisibilityState(
          true,
          "url",
          "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        );

        // 0 is falsy, so it falls back to initialState
        expect(result).toEqual(initialState);
      });

      it("handles empty string as falsy", () => {
        const initialState: VisibilityState = { col1: true };
        const urlBucket = { columnVisibility: "" };
        const localBucket = {};

        const result = computeInitialColumnVisibilityState(
          true,
          "url",
          "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual(initialState);
      });
    });
  });
});