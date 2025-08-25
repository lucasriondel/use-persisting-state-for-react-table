import { describe, expect, it, vi } from "vitest";
import { persistInitialGlobalFilter } from "../persistInitialGlobalFilter";

// Mock bucket API for testing
const createMockBucketApi = () => ({
  setState: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
});

describe("persistInitialGlobalFilter", () => {
  describe("when shouldPersist is false", () => {
    it("does not persist anything regardless of other parameters", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "initial search";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        false,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist even with localStorage target", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "search term";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        false,
        "localStorage",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("ignores existing bucket data when shouldPersist is false", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "initial";
      const urlBucket = { globalFilter: "existing url data" };
      const localBucket = { globalFilter: "existing local data" };

      persistInitialGlobalFilter(
        false,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("when shouldPersist is true but no initialGlobalFilter", () => {
    it("does not persist when initialGlobalFilter is undefined", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        undefined
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist when initialGlobalFilter is null", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        null as unknown as string
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist when initialGlobalFilter is an empty string", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const urlBucket = {};
      const localBucket = {};
      const initialFilter = "";

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      // Empty string is falsy, so it won't persist
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist when initialGlobalFilter is falsy string-like value", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const urlBucket = {};
      const localBucket = {};

      // Testing with a falsy string value that JavaScript treats as falsy
      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        "" // Empty string is falsy and won't be persisted
      );

      // Empty string is falsy, condition fails
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("URL target persistence", () => {
    it("persists to URL when no existing data in URL bucket", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "initial search term";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        globalFilter: initialFilter,
      });
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist to URL when data already exists in URL bucket", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "initial search";
      const urlBucket = { globalFilter: "existing search" };
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("uses custom key for URL persistence", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "search term";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "customSearchKey",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        customSearchKey: initialFilter,
      });
    });

    it("persists when URL bucket contains falsy value", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "new search";
      const urlBucket = { globalFilter: 0 }; // falsy value
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      // 0 is falsy, so !raw is true, and it will persist
      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        globalFilter: initialFilter,
      });
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists when URL bucket contains false", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "search";
      const urlBucket = { globalFilter: false };
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        globalFilter: initialFilter,
      });
    });

    it("persists when URL bucket contains null", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "search";
      const urlBucket = { globalFilter: null };
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        globalFilter: initialFilter,
      });
    });

    it("persists when URL bucket contains empty string", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "non-empty search";
      const urlBucket = { globalFilter: "" };
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        globalFilter: initialFilter,
      });
    });

    it("does not persist when URL bucket contains truthy string", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "initial";
      const urlBucket = { globalFilter: "existing search" };
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("localStorage target persistence", () => {
    it("persists to localStorage when no existing data in localStorage bucket", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "local search term";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "localStorage",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        globalFilter: initialFilter,
      });
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist to localStorage when data already exists", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "initial search";
      const urlBucket = {};
      const localBucket = { globalFilter: "existing local search" };

      persistInitialGlobalFilter(
        true,
        "localStorage",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("uses custom key for localStorage persistence", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "local search";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "localStorage",
        "customLocalKey",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        customLocalKey: initialFilter,
      });
    });

    it("persists when localStorage bucket contains falsy values", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "search";
      const localBucket = { globalFilter: false };
      const urlBucket = {};

      persistInitialGlobalFilter(
        true,
        "localStorage",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        globalFilter: initialFilter,
      });
    });
  });

  describe("undefined target", () => {
    it("persists to localStorage when target is undefined", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "default search";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        undefined,
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      // When target is undefined, it falls through to localStorage
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        globalFilter: initialFilter,
      });
    });

    it("does not persist when localStorage bucket has data and target is undefined", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "initial";
      const urlBucket = {};
      const localBucket = { globalFilter: "existing" };

      persistInitialGlobalFilter(
        true,
        undefined,
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles special characters in filter string", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const specialFilter = "search with @#$%^&*()_+ chars";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        specialFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        globalFilter: specialFilter,
      });
    });

    it("handles unicode characters in filter string", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const unicodeFilter = "búsqueda 中文 🔍";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        unicodeFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        globalFilter: unicodeFilter,
      });
    });

    it("handles very long filter strings", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const longFilter = "search term ".repeat(1000);
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        longFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        globalFilter: longFilter,
      });
    });

    it("handles whitespace-only filter strings", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const whitespaceFilter = "   \t\n\r   ";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        whitespaceFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        globalFilter: whitespaceFilter,
      });
    });

    it("works with complex bucket structures", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "search";
      const urlBucket = {
        otherKey: "other value",
        nested: { data: "value" },
        // globalFilter key is missing
      };
      const localBucket = {
        someLocalKey: "local value",
      };

      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        globalFilter: initialFilter,
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

      const initialFilter = "search";
      const urlBucket = {};
      const localBucket = {};

      expect(() => {
        persistInitialGlobalFilter(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          mockUrlApi,
          mockLocalApi,
          initialFilter
        );
      }).toThrow("URL API error");
    });

    it("only calls the correct API based on target", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "search";
      const urlBucket = {};
      const localBucket = {};

      // Test URL target
      persistInitialGlobalFilter(
        true,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
      expect(mockLocalApi.patch).not.toHaveBeenCalled();

      // Reset mocks
      mockUrlApi.patch.mockClear();
      mockLocalApi.patch.mockClear();

      // Test localStorage target
      persistInitialGlobalFilter(
        true,
        "localStorage",
        "globalFilter",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockLocalApi.patch).toHaveBeenCalledTimes(1);
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("creates correct patch object structure", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialFilter = "test search";
      const customKey = "myCustomKey";
      const urlBucket = {};
      const localBucket = {};

      persistInitialGlobalFilter(
        true,
        "url",
        customKey,
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialFilter
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        [customKey]: initialFilter,
      });

      // Verify the patch object structure
      const patchCall = mockUrlApi.patch.mock.calls[0][0];
      expect(Object.keys(patchCall)).toHaveLength(1);
      expect(patchCall[customKey]).toBe(initialFilter);
    });
  });
});
