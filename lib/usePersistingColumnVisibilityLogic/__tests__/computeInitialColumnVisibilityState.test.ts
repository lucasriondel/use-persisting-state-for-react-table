import { describe, expect, it } from "vitest";
import { computeInitialColumnVisibilityState } from "../computeInitialColumnVisibilityState";
import type { VisibilityState } from "@tanstack/react-table";

describe("computeInitialColumnVisibilityState", () => {
  describe("when shouldPersist is false", () => {
    it("returns initialState when provided", () => {
      const initialState: VisibilityState = { col1: false, col2: true };
      const urlBucket = { columnVisibility: { col1: true } };
      const localBucket = { columnVisibility: { col1: true } };

      const result = computeInitialColumnVisibilityState({
        shouldPersist: false,
        target: "url",
        key: "columnVisibility",
        urlBucket,
        localBucket,
        initialState
      });

      expect(result).toEqual(initialState);
    });

    it("returns undefined when no initialState provided", () => {
      const urlBucket = { columnVisibility: { col1: true } };
      const localBucket = { columnVisibility: { col1: true } };

      const result = computeInitialColumnVisibilityState({
        shouldPersist: false,
        target: "url",
        key: "columnVisibility",
        urlBucket,
        localBucket
      });

      expect(result).toBeUndefined();
    });
  });

  describe("when shouldPersist is true", () => {
    describe("with URL target", () => {
      it("returns persisted state from URL bucket when available", () => {
        const persistedState = { col1: false, col2: true };
        const urlBucket = { columnVisibility: persistedState };
        const localBucket = {};
        const initialState = { col1: true, col2: false };

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "url",
          key: "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        });

        expect(result).toEqual(persistedState);
      });

      it("returns initialState when URL bucket has no data", () => {
        const urlBucket = {};
        const localBucket = {};
        const initialState = { col1: true, col2: false };

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "url",
          key: "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        });

        expect(result).toEqual(initialState);
      });

      it("returns undefined when both URL bucket and initialState are missing", () => {
        const urlBucket = {};
        const localBucket = {};

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "url",
          key: "columnVisibility",
          urlBucket,
          localBucket
        });

        expect(result).toBeUndefined();
      });

      it("uses custom key to fetch from URL bucket", () => {
        const persistedState = { col1: false, col2: true };
        const urlBucket = { customKey: persistedState };
        const localBucket = {};
        const initialState = { col1: true, col2: false };

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "url",
          key: "customKey",
          urlBucket,
          localBucket,
          initialState
        });

        expect(result).toEqual(persistedState);
      });
    });

    describe("with localStorage target", () => {
      it("returns persisted state from localStorage bucket when available", () => {
        const persistedState = { col1: false, col2: true };
        const urlBucket = {};
        const localBucket = { columnVisibility: persistedState };
        const initialState = { col1: true, col2: false };

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "localStorage",
          key: "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        });

        expect(result).toEqual(persistedState);
      });

      it("returns initialState when localStorage bucket has no data", () => {
        const urlBucket = {};
        const localBucket = {};
        const initialState = { col1: true, col2: false };

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "localStorage",
          key: "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        });

        expect(result).toEqual(initialState);
      });

      it("uses custom key to fetch from localStorage bucket", () => {
        const persistedState = { col1: false, col2: true };
        const urlBucket = {};
        const localBucket = { customKey: persistedState };
        const initialState = { col1: true, col2: false };

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "localStorage",
          key: "customKey",
          urlBucket,
          localBucket,
          initialState
        });

        expect(result).toEqual(persistedState);
      });
    });

    describe("with undefined target", () => {
      it("returns value from localBucket when target is undefined", () => {
        const urlBucket = {};
        const localBucket = { columnVisibility: { col1: false } };

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: undefined,
          key: "columnVisibility",
          urlBucket,
          localBucket
        });

        // When target is undefined, it uses localBucket[key]
        expect(result).toEqual({ col1: false });
      });
    });

    describe("edge cases", () => {
      it("handles falsy values in buckets correctly", () => {
        const urlBucket = { columnVisibility: null };
        const localBucket = {};
        const initialState = { col1: true };

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "url",
          key: "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        });

        expect(result).toEqual(initialState);
      });

      it("handles empty objects in buckets", () => {
        const urlBucket = { columnVisibility: {} };
        const localBucket = {};

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "url",
          key: "columnVisibility",
          urlBucket,
          localBucket
        });

        expect(result).toEqual({});
      });

      it("handles 0 as a falsy value that falls back to initialState", () => {
        const urlBucket = { columnVisibility: 0 };
        const localBucket = {};
        const initialState = { col1: true };

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "url",
          key: "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        });

        // 0 is falsy, so it falls back to initialState
        expect(result).toEqual(initialState);
      });

      it("handles empty string as falsy", () => {
        const urlBucket = { columnVisibility: "" };
        const localBucket = {};
        const initialState = { col1: true };

        const result = computeInitialColumnVisibilityState({
          shouldPersist: true,
          target: "url",
          key: "columnVisibility",
          urlBucket,
          localBucket,
          initialState
        });

        expect(result).toEqual(initialState);
      });
    });
  });
});