import { describe, expect, it, vi } from "vitest";
import type { UrlApiActions } from "../../useUrlState";
import type { LocalStorageApiActions } from "../@lucasriondel/use-local-storage-reacthook";
import { createGlobalFilterChangeHandler } from "../createGlobalFilterChangeHandler";

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

describe("createGlobalFilterChangeHandler", () => {
  describe("function updater", () => {
    it("calls updater function with current state and patches result", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "current search";
      const updaterFn = vi.fn((old: string) => old + " updated");

      handler(updaterFn, currentState);

      expect(updaterFn).toHaveBeenCalledWith(currentState);
      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: "current search updated",
      });
    });

    it("handles function that returns completely new string", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "old search";
      const updaterFn = () => "brand new search";

      handler(updaterFn, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: "brand new search",
      });
    });

    it("handles function that returns empty string", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "some search";
      const updaterFn = () => "";

      handler(updaterFn, currentState);

      // Empty strings trigger remove() instead of patch()
      expect(mockBucketApi.remove).toHaveBeenCalledWith(key);
      expect(mockBucketApi.patch).not.toHaveBeenCalled();
    });

    it("handles function that manipulates current state", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "search";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "Hello World";
      const updaterFn = (old: string) => old.toLowerCase().replace(" ", "_");

      handler(updaterFn, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: "hello_world",
      });
    });

    it("handles function that adds to existing value", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "search";
      const updaterFn = (old: string) => `${old} term`;

      handler(updaterFn, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: "search term",
      });
    });

    it("preserves currentState parameter unchanged", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "immutable state";
      let capturedState: string;

      const updaterFn = (old: string) => {
        capturedState = old;
        return "new state";
      };

      handler(updaterFn, currentState);

      expect(capturedState!).toBe(currentState);
      expect(currentState).toBe("immutable state"); // unchanged
    });
  });

  describe("direct value updater", () => {
    it("patches bucket with provided string value", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "old search";
      const newValue = "new search term";

      handler(newValue, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: newValue,
      });
    });

    it("handles empty string as direct value", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "some search";
      const newValue = "";

      handler(newValue, currentState);

      // Empty strings trigger remove() instead of patch()
      expect(mockBucketApi.remove).toHaveBeenCalledWith(key);
      expect(mockBucketApi.patch).not.toHaveBeenCalled();
    });

    it("handles string with special characters", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "normal";
      const newValue = "search with @#$%^&*()_+ special chars";

      handler(newValue, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: newValue,
      });
    });

    it("handles unicode strings", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "english";
      const newValue = "búsqueda en español 中文 🔍";

      handler(newValue, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: newValue,
      });
    });

    it("handles very long strings", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "short";
      const newValue = "very long search ".repeat(100);

      handler(newValue, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: newValue,
      });
    });

    it("handles whitespace-only strings", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "normal";
      const newValue = "   \t\n\r   ";

      handler(newValue, currentState);

      // Whitespace-only strings are considered empty after trim()
      expect(mockBucketApi.remove).toHaveBeenCalledWith(key);
      expect(mockBucketApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("custom keys", () => {
    it("uses custom key for patching", () => {
      const mockBucketApi = createMockBucketApi();
      const customKey = "searchTerm";
      const handler = createGlobalFilterChangeHandler(customKey, mockBucketApi);

      const currentState = "current";
      const newValue = "updated search";

      handler(newValue, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [customKey]: newValue,
      });
    });

    it("handles special characters in key names", () => {
      const mockBucketApi = createMockBucketApi();
      const specialKey = "global-filter.search_v2";
      const handler = createGlobalFilterChangeHandler(
        specialKey,
        mockBucketApi
      );

      const currentState = "test";
      const newValue = "new value";

      handler(newValue, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [specialKey]: newValue,
      });
    });

    it("handles empty string as key", () => {
      const mockBucketApi = createMockBucketApi();
      const emptyKey = "";
      const handler = createGlobalFilterChangeHandler(emptyKey, mockBucketApi);

      const currentState = "test";
      const newValue = "value";

      handler(newValue, currentState);

      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [emptyKey]: newValue,
      });
    });
  });

  describe("bucket API integration", () => {
    it("works with URL bucket API", () => {
      const mockUrlApi: UrlApiActions<Record<string, unknown>> =
        createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockUrlApi);

      const currentState = "test";
      const newValue = "url search";

      handler(newValue, currentState);

      expect(mockUrlApi.patch).toHaveBeenCalledWith({
        [key]: newValue,
      });
    });

    it("works with localStorage bucket API", () => {
      const mockLocalApi: LocalStorageApiActions<Record<string, unknown>> =
        createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockLocalApi);

      const currentState = "test";
      const newValue = "local search";

      handler(newValue, currentState);

      expect(mockLocalApi.patch).toHaveBeenCalledWith({
        [key]: newValue,
      });
    });

    it("calls patch exactly once per handler call", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      handler("search1", "current");
      handler("search2", "current");
      handler("search3", "current");

      expect(mockBucketApi.patch).toHaveBeenCalledTimes(3);
    });
  });

  describe("error handling", () => {
    it("handles bucket API patch throwing error", () => {
      const mockBucketApi = createMockBucketApi();
      mockBucketApi.patch = vi.fn().mockImplementation(() => {
        throw new Error("Bucket API error");
      });

      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "test";
      const newValue = "new search";

      expect(() => handler(newValue, currentState)).toThrow("Bucket API error");
    });

    it("handles updater function throwing error", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "test";
      const badUpdater = () => {
        throw new Error("Updater error");
      };

      expect(() => handler(badUpdater, currentState)).toThrow("Updater error");
      expect(mockBucketApi.patch).not.toHaveBeenCalled();
    });

    it("handles updater function returning non-string", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "test";
      // This would be a type error in real usage, but testing runtime behavior
      const badUpdater = () => 123 as unknown as string;

      // Should throw an error because trim() is called on a number
      expect(() => handler(badUpdater, currentState)).toThrow(
        "next.trim is not a function"
      );
      expect(mockBucketApi.patch).not.toHaveBeenCalled();
      expect(mockBucketApi.remove).not.toHaveBeenCalled();
    });
  });

  describe("type coercion edge cases", () => {
    it("handles non-string direct values", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "test";
      // This would be a type error in real usage, but testing runtime behavior
      const nonStringValue = { search: "object" } as unknown as string;

      // Should throw an error because trim() is called on an object
      expect(() => handler(nonStringValue, currentState)).toThrow(
        "next.trim is not a function"
      );
      expect(mockBucketApi.patch).not.toHaveBeenCalled();
      expect(mockBucketApi.remove).not.toHaveBeenCalled();
    });

    it("handles null as direct value", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "test";
      const nullValue = null as unknown as string;

      handler(nullValue, currentState);

      // null is falsy, so it triggers remove()
      expect(mockBucketApi.remove).toHaveBeenCalledWith(key);
      expect(mockBucketApi.patch).not.toHaveBeenCalled();
    });

    it("handles undefined as direct value", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentState = "test";
      const undefinedValue = undefined as unknown as string;

      handler(undefinedValue, currentState);

      // undefined is falsy, so it triggers remove()
      expect(mockBucketApi.remove).toHaveBeenCalledWith(key);
      expect(mockBucketApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("state consistency", () => {
    it("uses currentTableState as base for function updaters", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentTableState = "table state";

      const updaterFn = vi.fn((old: string) => old + " modified");

      // The function should use currentTableState, not some other state
      handler(updaterFn, currentTableState);

      expect(updaterFn).toHaveBeenCalledWith(currentTableState);
      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: "table state modified",
      });
    });

    it("ignores currentTableState for direct value updates", () => {
      const mockBucketApi = createMockBucketApi();
      const key = "globalFilter";
      const handler = createGlobalFilterChangeHandler(key, mockBucketApi);

      const currentTableState = "ignored state";
      const directValue = "direct value";

      handler(directValue, currentTableState);

      // Direct value should be used, currentTableState ignored
      expect(mockBucketApi.patch).toHaveBeenCalledWith({
        [key]: directValue,
      });
    });
  });
});
