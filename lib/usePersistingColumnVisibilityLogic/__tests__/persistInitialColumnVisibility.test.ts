import type { VisibilityState } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { persistInitialColumnVisibility } from "../persistInitialColumnVisibility";

// Mock bucket API for testing
const createMockBucketApi = () => ({
  setState: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
});

describe("persistInitialColumnVisibility", () => {
  describe("when shouldPersist is false", () => {
    it("does not persist anything regardless of other parameters", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true, col2: false };
      const urlBucket = {};
      const localBucket = {};

      persistInitialColumnVisibility(
        false,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist even with localStorage target", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true };
      const urlBucket = {};
      const localBucket = {};

      persistInitialColumnVisibility(
        false,
        "localStorage",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("when shouldPersist is true but no initialColumnVisibility", () => {
    it("does not persist when initialColumnVisibility is undefined", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const urlBucket = {};
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        undefined
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist when initialColumnVisibility is null", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const urlBucket = {};
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        null as unknown as VisibilityState
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists when initialColumnVisibility is an empty object", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const urlBucket = {};
      const localBucket = {};
      const initialState: VisibilityState = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        columnVisibility: {},
      });
    });
  });

  describe("URL target persistence", () => {
    it("persists to URL when no existing data in URL bucket", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true, col2: false };
      const urlBucket = {};
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        columnVisibility: initialState,
      });
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist to URL when data already exists in URL bucket", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true, col2: false };
      const urlBucket = { columnVisibility: { col1: false } };
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("uses custom key for URL persistence", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true };
      const urlBucket = {};
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "customVisibilityKey",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        customVisibilityKey: initialState,
      });
    });

    it("persists when bucket contains falsy value 0", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true };
      const urlBucket = { columnVisibility: 0 };
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      // 0 is falsy, so !raw is true, and it will persist
      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        columnVisibility: initialState,
      });
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("treats empty string as no data", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true };
      const urlBucket = { columnVisibility: "" };
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        columnVisibility: initialState,
      });
    });
  });

  describe("localStorage target persistence", () => {
    it("persists to localStorage when no existing data in localStorage bucket", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true, col2: false };
      const urlBucket = {};
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "localStorage",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        columnVisibility: initialState,
      });
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist to localStorage when data already exists", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true, col2: false };
      const urlBucket = {};
      const localBucket = { columnVisibility: { col1: false } };

      persistInitialColumnVisibility(
        true,
        "localStorage",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("uses custom key for localStorage persistence", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true };
      const urlBucket = {};
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "localStorage",
        "customKey",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        customKey: initialState,
      });
    });
  });

  describe("undefined target", () => {
    it("persists to localStorage when target is undefined", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true };
      const urlBucket = {};
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        undefined,
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      // When target is undefined, it falls through to localStorage
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        columnVisibility: initialState,
      });
    });
  });

  describe("edge cases", () => {
    it("handles null values in buckets correctly", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true };
      const urlBucket = { columnVisibility: null };
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        columnVisibility: initialState,
      });
    });

    it("handles undefined values in buckets correctly", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true };
      const urlBucket = { columnVisibility: undefined };
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        columnVisibility: initialState,
      });
    });

    it("persists when bucket contains false (falsy value)", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true };
      const urlBucket = { columnVisibility: false };
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      // false is falsy, so !raw is true, and it will persist
      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        columnVisibility: initialState,
      });
    });

    it("works with complex initial state objects", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const complexInitialState: VisibilityState = {
        col1: true,
        col2: false,
        col3: true,
        "complex-column-name": false,
        column_with_underscores: true,
      };
      const urlBucket = {};
      const localBucket = {};

      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        complexInitialState
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        columnVisibility: complexInitialState,
      });
    });
  });

  describe("bucket API interaction", () => {
    it("handles bucket API errors gracefully", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      mockUrlApi.patch = vi.fn().mockImplementation(() => {
        throw new Error("URL API error");
      });

      const initialState: VisibilityState = { col1: true };
      const urlBucket = {};
      const localBucket = {};

      expect(() => {
        persistInitialColumnVisibility(
          true,
          "url",
          "columnVisibility",
          urlBucket,
          localBucket,
          mockUrlApi,
          mockLocalApi,
          initialState
        );
      }).toThrow("URL API error");
    });

    it("only calls the correct API based on target", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialState: VisibilityState = { col1: true };
      const urlBucket = {};
      const localBucket = {};

      // Test URL target
      persistInitialColumnVisibility(
        true,
        "url",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
      expect(mockLocalApi.patch).not.toHaveBeenCalled();

      // Reset mocks
      mockUrlApi.patch.mockClear();
      mockLocalApi.patch.mockClear();

      // Test localStorage target
      persistInitialColumnVisibility(
        true,
        "localStorage",
        "columnVisibility",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialState
      );

      expect(mockLocalApi.patch).toHaveBeenCalledTimes(1);
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });
  });
});
