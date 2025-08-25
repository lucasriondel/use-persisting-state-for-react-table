import type { PaginationState } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { persistInitialPagination } from "../persistInitialPagination";

// Mock bucket API for testing
const createMockBucketApi = () => ({
  setState: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
});

describe("persistInitialPagination", () => {
  describe("when no initialPagination provided", () => {
    it("does not persist anything when initialPagination is undefined", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        undefined
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist anything when initialPagination is null", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        null as unknown as PaginationState
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("pageIndex persistence", () => {
    it("persists pageIndex to URL when not already present", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 5, pageSize: 25 };
      const urlBucket = {}; // pageIndex not present
      const localBucket = {};

      persistInitialPagination(
        true, // shouldPersistPageIndex
        false, // shouldPersistPageSize
        "url",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 5 });
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists pageIndex to localStorage when not already present", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = {
        pageIndex: 10,
        pageSize: 50,
      };
      const urlBucket = {};
      const localBucket = {}; // pageIndex not present

      persistInitialPagination(
        true,
        false,
        "localStorage",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageIndex: 10 });
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist pageIndex when already present as number in URL", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 5, pageSize: 25 };
      const urlBucket = { pageIndex: 3 }; // already present
      const localBucket = {};

      persistInitialPagination(
        true,
        false,
        "url",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists pageIndex when bucket contains non-number value", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 8, pageSize: 40 };
      const urlBucket = { pageIndex: "invalid" }; // non-number
      const localBucket = {};

      persistInitialPagination(
        true,
        false,
        "url",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 8 });
    });

    it("persists pageIndex when bucket contains null", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 2, pageSize: 20 };
      const urlBucket = { pageIndex: null };
      const localBucket = {};

      persistInitialPagination(
        true,
        false,
        "url",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 2 });
    });

    it("persists pageIndex when bucket contains undefined", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 7, pageSize: 35 };
      const urlBucket = { pageIndex: undefined };
      const localBucket = {};

      persistInitialPagination(
        true,
        false,
        "url",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 7 });
    });

    it("persists pageIndex when bucket contains boolean", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 4, pageSize: 20 };
      const urlBucket = { pageIndex: false };
      const localBucket = {};

      persistInitialPagination(
        true,
        false,
        "url",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 4 });
    });

    it("does not persist pageIndex when zero is present (valid number)", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 5, pageSize: 25 };
      const urlBucket = { pageIndex: 0 }; // zero is a valid number
      const localBucket = {};

      persistInitialPagination(
        true,
        false,
        "url",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist pageIndex when negative number is present", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 5, pageSize: 25 };
      const urlBucket = { pageIndex: -1 };
      const localBucket = {};

      persistInitialPagination(
        true,
        false,
        "url",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("uses custom pageIndex key", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 3, pageSize: 30 };
      const urlBucket = {
        pageIndex: 1, // should be ignored
        customPageIndex: "invalid", // should trigger persistence
      };
      const localBucket = {};

      persistInitialPagination(
        true,
        false,
        "url",
        undefined,
        "customPageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ customPageIndex: 3 });
    });

    it("does not persist when shouldPersistPageIndex is false", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 5, pageSize: 25 };
      const urlBucket = {}; // pageIndex not present
      const localBucket = {};

      persistInitialPagination(
        false, // shouldPersistPageIndex
        false,
        "url",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("pageSize persistence", () => {
    it("persists pageSize to URL when not already present", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = {
        pageIndex: 0,
        pageSize: 100,
      };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        false,
        true, // shouldPersistPageSize
        undefined,
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 100 });
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists pageSize to localStorage when not already present", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 0, pageSize: 75 };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        false,
        true,
        undefined,
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 75 });
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist pageSize when already present as number", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = {
        pageIndex: 0,
        pageSize: 100,
      };
      const urlBucket = { pageSize: 50 }; // already present
      const localBucket = {};

      persistInitialPagination(
        false,
        true,
        undefined,
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists pageSize when bucket contains non-number value", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 0, pageSize: 25 };
      const urlBucket = { pageSize: "25" }; // string, not number
      const localBucket = {};

      persistInitialPagination(
        false,
        true,
        undefined,
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 25 });
    });

    it("uses custom pageSize key", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = {
        pageIndex: 0,
        pageSize: 200,
      };
      const urlBucket = {
        pageSize: 50, // should be ignored
        itemsPerPage: "invalid", // should trigger persistence
      };
      const localBucket = {};

      persistInitialPagination(
        false,
        true,
        undefined,
        "url",
        "pageIndex",
        "itemsPerPage",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ itemsPerPage: 200 });
    });

    it("does not persist when shouldPersistPageSize is false", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 0, pageSize: 25 };
      const urlBucket = {}; // pageSize not present
      const localBucket = {};

      persistInitialPagination(
        false,
        false, // shouldPersistPageSize
        undefined,
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("both pageIndex and pageSize persistence", () => {
    it("persists both values when both are missing", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 7, pageSize: 70 };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        pageIndex: 7,
        pageSize: 70,
      });
      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists only missing values", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 5, pageSize: 50 };
      const urlBucket = { pageIndex: 2 }; // pageIndex already present
      const localBucket = {}; // pageSize missing

      persistInitialPagination(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      // Only pageSize should be persisted to localStorage
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 50 });
      expect(mockLocalApi.patch).toHaveBeenCalledTimes(1);
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("persists values to different targets", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 3, pageSize: 30 };
      const urlBucket = {}; // pageIndex missing
      const localBucket = {}; // pageSize missing

      persistInitialPagination(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 3 });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 30 });
      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
      expect(mockLocalApi.patch).toHaveBeenCalledTimes(1);
    });

    it("does not persist when both values are already present", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 5, pageSize: 50 };
      const urlBucket = { pageIndex: 2, pageSize: 20 }; // both present
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("uses custom keys for both values", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 8, pageSize: 80 };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "localStorage",
        "currentPage",
        "itemsPerPage",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ currentPage: 8 });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ itemsPerPage: 80 });
    });
  });

  describe("target handling", () => {
    it("handles undefined pageIndexTarget by using localStorage", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 6, pageSize: 60 };
      const urlBucket = { pageIndex: 1 }; // should be ignored
      const localBucket = {}; // pageIndex missing here

      persistInitialPagination(
        true,
        false,
        undefined, // pageIndexTarget
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageIndex: 6 });
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("handles undefined pageSizeTarget by using localStorage", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 0, pageSize: 40 };
      const urlBucket = { pageSize: 20 }; // should be ignored
      const localBucket = {}; // pageSize missing here

      persistInitialPagination(
        false,
        true,
        undefined,
        undefined, // pageSizeTarget
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 40 });
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles zero values in initialPagination", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 0, pageSize: 0 };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        pageIndex: 0,
        pageSize: 0,
      });
    });

    it("handles negative values in initialPagination", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = {
        pageIndex: -1,
        pageSize: -10,
      };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        pageIndex: -1,
        pageSize: -10,
      });
    });

    it("handles large values in initialPagination", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = {
        pageIndex: 999999,
        pageSize: 10000,
      };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        pageIndex: 999999,
        pageSize: 10000,
      });
    });

    it("handles floating point values in initialPagination", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = {
        pageIndex: 3.7,
        pageSize: 25.5,
      };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        pageIndex: 3.7,
        pageSize: 25.5,
      });
    });

    it("handles special characters in keys", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 1, pageSize: 10 };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "page-index.v2",
        "page_size_setting",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        "page-index.v2": 1,
        page_size_setting: 10,
      });
    });

    it("handles complex bucket structures", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 2, pageSize: 20 };
      const urlBucket = {
        otherData: "value",
        nested: { data: "complex" },
        // pageIndex and pageSize missing
      };
      const localBucket = {
        localData: "value",
        pageSize: { complex: "object" }, // non-number pageSize
      };

      persistInitialPagination(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 2 });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 20 });
    });
  });

  describe("optimization", () => {
    it("makes single patch call when both values go to same target", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 4, pageSize: 40 };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        pageIndex: 4,
        pageSize: 40,
      });
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("makes separate patch calls when values go to different targets", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 6, pageSize: 60 };
      const urlBucket = {};
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
      expect(mockLocalApi.patch).toHaveBeenCalledTimes(1);
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 6 });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 60 });
    });

    it("does not make any patch calls when no updates needed", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const initialPagination: PaginationState = { pageIndex: 3, pageSize: 30 };
      const urlBucket = { pageIndex: 1, pageSize: 20 }; // both present
      const localBucket = {};

      persistInitialPagination(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        mockUrlApi,
        mockLocalApi,
        initialPagination
      );

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("handles URL bucket API errors", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      mockUrlApi.patch = vi.fn().mockImplementation(() => {
        throw new Error("URL API error");
      });

      const initialPagination: PaginationState = { pageIndex: 1, pageSize: 10 };
      const urlBucket = {};
      const localBucket = {};

      expect(() => {
        persistInitialPagination(
          true,
          false,
          "url",
          undefined,
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          mockUrlApi,
          mockLocalApi,
          initialPagination
        );
      }).toThrow("URL API error");
    });

    it("handles localStorage bucket API errors", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      mockLocalApi.patch = vi.fn().mockImplementation(() => {
        throw new Error("LocalStorage API error");
      });

      const initialPagination: PaginationState = { pageIndex: 0, pageSize: 25 };
      const urlBucket = {};
      const localBucket = {};

      expect(() => {
        persistInitialPagination(
          false,
          true,
          undefined,
          "localStorage",
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          mockUrlApi,
          mockLocalApi,
          initialPagination
        );
      }).toThrow("LocalStorage API error");
    });

    it("continues with remaining operations if one target fails", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      // Make URL API fail
      mockUrlApi.patch = vi.fn().mockImplementation(() => {
        throw new Error("URL API error");
      });

      const initialPagination: PaginationState = { pageIndex: 1, pageSize: 10 };
      const urlBucket = {}; // pageIndex needs to be persisted to URL
      const localBucket = {}; // pageSize needs to be persisted to localStorage

      expect(() => {
        persistInitialPagination(
          true,
          true,
          "url",
          "localStorage",
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          mockUrlApi,
          mockLocalApi,
          initialPagination
        );
      }).toThrow("URL API error");

      // URL API should have been called (and failed)
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 1 });
      // localStorage API should not have been called yet due to the error
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });
});
