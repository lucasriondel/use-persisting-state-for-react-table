import type { PaginationState } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { createPaginationChangeHandler } from "../createPaginationChangeHandler";

// Mock bucket API for testing
const createMockBucketApi = () => ({
  setState: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
});

describe("createPaginationChangeHandler", () => {
  describe("function updater", () => {
    it("calls updater function with current state and persists changes", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const updaterFn = vi.fn((old: PaginationState) => ({
        ...old,
        pageIndex: old.pageIndex + 1,
        pageSize: old.pageSize * 2,
      }));

      handler(updaterFn, currentState);

      expect(updaterFn).toHaveBeenCalledWith(currentState);
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 1 });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 20 });
      expect(mockUrlApi.patch).toHaveBeenCalledTimes(2);
    });

    it("handles updater that changes only pageIndex", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "localStorage",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 5, pageSize: 25 };
      const updaterFn = (old: PaginationState) => ({
        ...old,
        pageIndex: 10,
      });

      handler(updaterFn, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 10 });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 25 });
    });

    it("handles updater that changes only pageSize", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "localStorage",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 3, pageSize: 50 };
      const updaterFn = (old: PaginationState) => ({
        ...old,
        pageSize: 100,
      });

      handler(updaterFn, currentState);

      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageIndex: 3 });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 100 });
    });

    it("handles updater that returns completely new state", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const updaterFn = () => ({ pageIndex: 99, pageSize: 500 });

      handler(updaterFn, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 99 });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 500 });
    });

    it("handles updater that returns state with undefined values", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 5, pageSize: 25 };
      const updaterFn = () => ({
        pageIndex: undefined as unknown as number,
        pageSize: 50,
      });

      handler(updaterFn, currentState);

      // pageIndex is undefined, so it shouldn't be persisted
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 50 });
      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
    });
  });

  describe("direct value updater", () => {
    it("persists direct PaginationState object", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "localStorage",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 7, pageSize: 50 };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 7 });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 50 });
    });

    it("handles partial PaginationState objects", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const partialState = { pageIndex: 3 } as PaginationState;

      handler(partialState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 3 });
      // pageSize is undefined, so it shouldn't be persisted
      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
    });

    it("handles empty PaginationState object", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 5, pageSize: 25 };
      const emptyState = {} as PaginationState;

      handler(emptyState, currentState);

      // Both values are undefined, so nothing should be persisted
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("selective persistence", () => {
    it("persists only pageIndex when pageSize persistence is disabled", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: false,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 8, pageSize: 100 };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 8 });
      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("persists only pageSize when pageIndex persistence is disabled", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: false,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "localStorage",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 8, pageSize: 100 };

      handler(newState, currentState);

      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 100 });
      expect(mockLocalApi.patch).toHaveBeenCalledTimes(1);
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("persists nothing when both persistence flags are false", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: false,
        shouldPersistPageSize: false,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 8, pageSize: 100 };

      handler(newState, currentState);

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("custom keys", () => {
    it("uses custom keys for both pageIndex and pageSize", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "currentPage",
        pageSizeTarget: "localStorage",
        pageSizeKey: "itemsPerPage",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 3, pageSize: 50 };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ currentPage: 3 });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ itemsPerPage: 50 });
    });

    it("handles special characters in keys", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "page-index.v2",
        pageSizeTarget: "url",
        pageSizeKey: "page_size_setting",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 1, pageSize: 20 };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ "page-index.v2": 1 });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ page_size_setting: 20 });
    });
  });

  describe("target routing", () => {
    it("routes pageIndex to URL and pageSize to localStorage", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "localStorage",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 2, pageSize: 20 };
      const newState: PaginationState = { pageIndex: 5, pageSize: 100 };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 5 });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 100 });
      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
      expect(mockLocalApi.patch).toHaveBeenCalledTimes(1);
    });

    it("routes both values to same target", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "localStorage",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "localStorage",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 1, pageSize: 15 };
      const newState: PaginationState = { pageIndex: 3, pageSize: 30 };

      handler(newState, currentState);

      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageIndex: 3 });
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 30 });
      expect(mockLocalApi.patch).toHaveBeenCalledTimes(2);
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("undefined value handling", () => {
    it("skips persistence when pageIndex is undefined", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 5, pageSize: 25 };
      const newState: PaginationState = {
        pageIndex: undefined as unknown as number,
        pageSize: 50,
      };

      handler(newState, currentState);

      // Only pageSize should be persisted
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 50 });
      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
    });

    it("skips persistence when pageSize is undefined", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 5, pageSize: 25 };
      const newState: PaginationState = {
        pageIndex: 8,
        pageSize: undefined as unknown as number,
      };

      handler(newState, currentState);

      // Only pageIndex should be persisted
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 8 });
      expect(mockUrlApi.patch).toHaveBeenCalledTimes(1);
    });

    it("skips persistence when both values are undefined", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 5, pageSize: 25 };
      const newState: PaginationState = {
        pageIndex: undefined as unknown as number,
        pageSize: undefined as unknown as number,
      };

      handler(newState, currentState);

      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("edge case values", () => {
    it("persists zero values correctly", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 5, pageSize: 25 };
      const newState: PaginationState = { pageIndex: 0, pageSize: 0 };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 0 });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 0 });
    });

    it("persists negative values", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 5, pageSize: 25 };
      const newState: PaginationState = { pageIndex: -1, pageSize: -10 };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: -1 });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: -10 });
    });

    it("persists large values", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 999999, pageSize: 10000 };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 999999 });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 10000 });
    });

    it("persists floating point values", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 3.7, pageSize: 25.5 };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 3.7 });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 25.5 });
    });

    it("persists Infinity and -Infinity", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = {
        pageIndex: Infinity,
        pageSize: -Infinity,
      };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: Infinity });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: -Infinity });
    });

    it("persists NaN values", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: NaN, pageSize: NaN };

      handler(newState, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: NaN });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: NaN });
    });
  });

  describe("error handling", () => {
    it("handles URL bucket API errors", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      mockUrlApi.patch = vi.fn().mockImplementation(() => {
        throw new Error("URL API error");
      });

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: false,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 5, pageSize: 50 };

      expect(() => handler(newState, currentState)).toThrow("URL API error");
    });

    it("handles localStorage bucket API errors", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      mockLocalApi.patch = vi.fn().mockImplementation(() => {
        throw new Error("LocalStorage API error");
      });

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: false,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "localStorage",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 5, pageSize: 50 };

      expect(() => handler(newState, currentState)).toThrow(
        "LocalStorage API error"
      );
    });

    it("handles updater function throwing error", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const badUpdater = () => {
        throw new Error("Updater error");
      };

      expect(() => handler(badUpdater, currentState)).toThrow("Updater error");
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("state consistency", () => {
    it("uses currentTableState as base for function updaters", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentTableState: PaginationState = {
        pageIndex: 10,
        pageSize: 100,
      };
      let capturedState: PaginationState;

      const updaterFn = (old: PaginationState) => {
        capturedState = old;
        return { ...old, pageIndex: old.pageIndex + 1 };
      };

      handler(updaterFn, currentTableState);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(capturedState!).toBe(currentTableState);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(capturedState!).toEqual({ pageIndex: 10, pageSize: 100 });
    });

    it("preserves unchanged values in state", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 3, pageSize: 30 };
      const updaterFn = (old: PaginationState) => ({
        ...old,
        pageIndex: old.pageIndex + 1,
        // pageSize unchanged
      });

      handler(updaterFn, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 4 });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 30 });
    });
  });

  describe("type coercion scenarios", () => {
    it("handles non-standard PaginationState properties", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: true,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const stateWithExtra = {
        pageIndex: 5,
        pageSize: 25,
        extraProperty: "ignored",
      } as unknown as PaginationState;

      handler(stateWithExtra, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageIndex: 5 });
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 25 });
    });
  });

  describe("pageSize validation with allowedPageSizes", () => {
    it("does not validate when allowedPageSizes is not provided (backward compatibility)", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: false,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: undefined,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 0, pageSize: 15 }; // Any value should be allowed

      handler(newState, currentState);

      // Should persist the provided value without validation
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 15 });
    });

    it("validates pageSize with custom allowed values", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const customAllowed = [5, 15, 25, 100];

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: false,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: customAllowed,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };

      // Test valid value
      handler({ pageIndex: 0, pageSize: 15 }, currentState);
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 15 });

      // Reset mock
      mockUrlApi.patch.mockClear();

      // Test invalid value - should fallback to first allowed value
      handler({ pageIndex: 0, pageSize: 20 }, currentState); // 20 is not in custom allowed
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 5 });
    });

    it("validates pageSize for localStorage target", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const customAllowed = [5, 15, 25, 100];

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: false,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "localStorage",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: customAllowed,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 0, pageSize: 30 }; // Invalid

      handler(newState, currentState);

      // Should persist to localStorage with validated value
      expect(mockLocalApi.patch).toHaveBeenCalledWith({ pageSize: 5 });
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
    });

    it("does not validate when pageSize persistence is disabled", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const customAllowed = [5, 15, 25, 100];

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: false,
        shouldPersistPageSize: false,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: customAllowed,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 0, pageSize: 999 }; // Invalid but won't be persisted

      handler(newState, currentState);

      // No pageSize should be persisted since it's disabled
      expect(mockUrlApi.patch).not.toHaveBeenCalled();
      expect(mockLocalApi.patch).not.toHaveBeenCalled();
    });

    it("validates pageSize with function updater", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();
      const customAllowed = [10, 20, 50];

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: false,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: customAllowed,
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const updaterFn = vi.fn((old: PaginationState) => ({
        ...old,
        pageSize: 15, // Invalid value
      }));

      handler(updaterFn, currentState);

      expect(updaterFn).toHaveBeenCalledWith(currentState);
      // Should persist first allowed value (10) instead of 15
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 10 });
    });

    it("handles edge case with empty allowed values", () => {
      const mockUrlApi = createMockBucketApi();
      const mockLocalApi = createMockBucketApi();

      const handler = createPaginationChangeHandler({
        shouldPersistPageIndex: false,
        shouldPersistPageSize: true,
        pageIndexTarget: "url",
        pageIndexKey: "pageIndex",
        pageSizeTarget: "url",
        pageSizeKey: "pageSize",
        urlBucketApi: mockUrlApi,
        localBucketApi: mockLocalApi,
        allowedPageSizes: [], // Empty allowed values
      });

      const currentState: PaginationState = { pageIndex: 0, pageSize: 10 };
      const newState: PaginationState = { pageIndex: 0, pageSize: 25 };

      handler(newState, currentState);

      // Should fall back to default value (10) when allowed values is empty
      expect(mockUrlApi.patch).toHaveBeenCalledWith({ pageSize: 10 });
    });
  });
});
