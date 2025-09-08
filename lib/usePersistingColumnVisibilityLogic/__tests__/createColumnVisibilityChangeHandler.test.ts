import type { LocalStorageApiActions } from "@lucasriondel/use-local-storage-reacthook";
import type { VisibilityState } from "@tanstack/react-table";
import type { UrlApiActions } from "use-url-state-reacthook";
import { describe, expect, it, vi } from "vitest";
import { createColumnVisibilityChangeHandler } from "../createColumnVisibilityChangeHandler";

// Mock bucket API for testing
const createMockBucketApi = ():
  | LocalStorageApiActions<Record<string, unknown>>
  | UrlApiActions<Record<string, unknown>> => ({
  setState: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
});

describe("createColumnVisibilityChangeHandler", () => {
  describe("function updater", () => {
    it("calls updater function with current state and patches result", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = { col1: true, col2: false };
      const updaterFn = vi.fn((old: VisibilityState) => ({
        ...old,
        col1: false,
      }));

      handler(updaterFn, currentState);

      expect(updaterFn).toHaveBeenCalledWith(currentState);
      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: { col1: false, col2: false },
      });
    });

    it("handles complex state transformations", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = {
        col1: true,
        col2: false,
        col3: true,
      };

      const updaterFn = (old: VisibilityState) => {
        // Toggle all columns
        const result: VisibilityState = {};
        Object.keys(old).forEach((col) => {
          result[col] = !old[col];
        });
        return result;
      };

      handler(updaterFn, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: { col1: false, col2: true, col3: false },
      });
    });

    it("handles updater that returns empty object", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = { col1: true, col2: false };
      const updaterFn = () => ({});

      handler(updaterFn, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: {},
      });
    });

    it("handles updater that adds new columns", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = { col1: true };
      const updaterFn = (old: VisibilityState) => ({
        ...old,
        col2: false,
        col3: true,
      });

      handler(updaterFn, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: { col1: true, col2: false, col3: true },
      });
    });
  });

  describe("direct value updater", () => {
    it("patches bucket with provided VisibilityState object", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = { col1: true, col2: false };
      const newState: VisibilityState = {
        col1: false,
        col2: true,
        col3: false,
      };

      handler(newState, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: newState,
      });
    });

    it("handles empty object as direct value", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = { col1: true, col2: false };
      const newState: VisibilityState = {};

      handler(newState, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: {},
      });
    });

    it("handles undefined as direct value", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = { col1: true, col2: false };

      handler(undefined as unknown as VisibilityState, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: undefined,
      });
    });
  });

  describe("custom keys", () => {
    it("uses custom key for patching", () => {
      const mockBucketApi = createMockBucketApi();
      const customKey = "myCustomVisibilityKey";
      const handler = createColumnVisibilityChangeHandler(
        mockBucketApi,
        customKey
      );

      const currentState: VisibilityState = { col1: true };
      const newState: VisibilityState = { col1: false };

      handler(newState, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [customKey]: newState,
      });
    });

    it("handles special characters in key", () => {
      const mockBucketApi = createMockBucketApi();
      const specialKey = "column-visibility.state_v2";
      const handler = createColumnVisibilityChangeHandler(
        mockBucketApi,
        specialKey
      );

      const currentState: VisibilityState = { col1: true };
      const newState: VisibilityState = { col1: false };

      handler(newState, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [specialKey]: newState,
      });
    });
  });

  describe("bucket API integration", () => {
    it("works with URL bucket API", () => {
      const mockUrlApi: UrlApiActions<Record<string, unknown>> =
        createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockUrlApi, key);

      const currentState: VisibilityState = { col1: true };
      const newState: VisibilityState = { col1: false };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        [key]: newState,
      });
    });

    it("works with localStorage bucket API", () => {
      const mockLocalApi: LocalStorageApiActions<Record<string, unknown>> =
        createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockLocalApi, key);

      const currentState: VisibilityState = { col1: true };
      const newState: VisibilityState = { col1: false };

      handler(newState, currentState);

      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        [key]: newState,
      });
    });
  });

  describe("error handling", () => {
    it("handles bucket API patch throwing error", () => {
      const mockBucketApi = createMockBucketApi();
      mockBucketApi.patch = vi.fn().mockImplementation(() => {
        throw new Error("Bucket API error");
      });

      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = { col1: true };
      const newState: VisibilityState = { col1: false };

      // Should not throw, but if it does, that's the current behavior
      expect(() => handler(newState, currentState)).toThrow("Bucket API error");
    });

    it("handles updater function throwing error", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = { col1: true };
      const badUpdater = () => {
        throw new Error("Updater error");
      };

      expect(() => handler(badUpdater, currentState)).toThrow("Updater error");
      expect(mockBucketApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("type coercion edge cases", () => {
    it("handles non-boolean values in visibility state", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = { col1: true };
      const stateWithNonBooleans = {
        col1: 0,
        col2: "false",
        col3: null,
      } as unknown as VisibilityState;

      handler(stateWithNonBooleans, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: stateWithNonBooleans,
      });
    });

    it("preserves currentState when passed to function updater", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "columnVisibility";
      const handler = createColumnVisibilityChangeHandler(mockBucketApi, key);

      const currentState: VisibilityState = { col1: true, col2: false };
      let capturedState: VisibilityState;

      const updaterFn = (old: VisibilityState) => {
        capturedState = old;
        return { col3: true };
      };

      handler(updaterFn, currentState);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(capturedState!).toBe(currentState);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(capturedState!).toEqual({ col1: true, col2: false });
    });
  });
});
