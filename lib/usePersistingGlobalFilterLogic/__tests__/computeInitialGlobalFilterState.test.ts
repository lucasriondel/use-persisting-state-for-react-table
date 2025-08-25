import { describe, expect, it } from "vitest";
import { computeInitialGlobalFilterState } from "../computeInitialGlobalFilterState";

describe("computeInitialGlobalFilterState", () => {
  describe("when shouldPersist is false", () => {
    it("returns initialState when provided", () => {
      const initialState = "initial search";
      const urlBucket = { globalFilter: "persisted search" };
      const localBucket = { globalFilter: "local search" };

      const result = computeInitialGlobalFilterState(
        false,
        "url",
        "globalFilter",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toBe(initialState);
    });

    it("returns undefined when no initialState provided", () => {
      const urlBucket = { globalFilter: "persisted search" };
      const localBucket = { globalFilter: "local search" };

      const result = computeInitialGlobalFilterState(
        false,
        "url",
        "globalFilter",
        urlBucket,
        localBucket
      );

      expect(result).toBe("");
    });

    it("ignores bucket data even if present", () => {
      const initialState = "initial";
      const urlBucket = { globalFilter: "url data" };
      const localBucket = { globalFilter: "local data" };

      const result = computeInitialGlobalFilterState(
        false,
        "localStorage",
        "globalFilter",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toBe(initialState);
    });
  });

  describe("when shouldPersist is true", () => {
    describe("with URL target", () => {
      it("returns persisted string from URL bucket when available", () => {
        const persistedSearch = "persisted search term";
        const initialState = "initial search";
        const urlBucket = { globalFilter: persistedSearch };
        const localBucket = { globalFilter: "local search" };

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(persistedSearch);
      });

      it("returns initialState when URL bucket has no string data", () => {
        const initialState = "initial search";
        const urlBucket = { globalFilter: 123 }; // non-string
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });

      it("returns initialState when URL bucket key is missing", () => {
        const initialState = "initial search";
        const urlBucket = {};
        const localBucket = { globalFilter: "local search" };

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });

      it("returns empty string when both URL bucket and initialState are missing", () => {
        const urlBucket = {};
        const localBucket = { globalFilter: "local search" };

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket
        );

        expect(result).toBe("");
      });

      it("uses custom key to fetch from URL bucket", () => {
        const persistedSearch = "custom search";
        const urlBucket = {
          customSearchKey: persistedSearch,
          globalFilter: "default search",
        };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "customSearchKey",
          urlBucket,
          localBucket
        );

        expect(result).toBe(persistedSearch);
      });

      it("handles empty string as valid value", () => {
        const urlBucket = { globalFilter: "" };
        const localBucket = {};
        const initialState = "default search";

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe("");
      });
    });

    describe("with localStorage target", () => {
      it("returns persisted string from localStorage bucket when available", () => {
        const persistedSearch = "local search term";
        const initialState = "initial search";
        const urlBucket = { globalFilter: "url search" };
        const localBucket = { globalFilter: persistedSearch };

        const result = computeInitialGlobalFilterState(
          true,
          "localStorage",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(persistedSearch);
      });

      it("returns initialState when localStorage bucket has no string data", () => {
        const initialState = "initial search";
        const urlBucket = {};
        const localBucket = { globalFilter: null }; // non-string

        const result = computeInitialGlobalFilterState(
          true,
          "localStorage",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });

      it("returns initialState when localStorage bucket key is missing", () => {
        const initialState = "initial search";
        const urlBucket = { globalFilter: "url search" };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "localStorage",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });

      it("uses custom key to fetch from localStorage bucket", () => {
        const persistedSearch = "custom local search";
        const urlBucket = {};
        const localBucket = {
          customLocalKey: persistedSearch,
          globalFilter: "default search",
        };

        const result = computeInitialGlobalFilterState(
          true,
          "localStorage",
          "customLocalKey",
          urlBucket,
          localBucket
        );

        expect(result).toBe(persistedSearch);
      });
    });

    describe("with undefined target", () => {
      it("returns data from localStorage bucket when target is undefined", () => {
        const persistedSearch = "local search";
        const initialState = "initial search";
        const urlBucket = { globalFilter: "url search" };
        const localBucket = { globalFilter: persistedSearch };

        const result = computeInitialGlobalFilterState(
          true,
          undefined,
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(persistedSearch);
      });

      it("returns initialState when localStorage bucket has no data and target is undefined", () => {
        const initialState = "initial search";
        const urlBucket = { globalFilter: "url search" };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          undefined,
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });
    });

    describe("type validation", () => {
      it("rejects non-string numbers", () => {
        const initialState = "initial search";
        const urlBucket = { globalFilter: 42 };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });

      it("rejects non-string booleans", () => {
        const initialState = "initial search";
        const urlBucket = { globalFilter: true };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });

      it("rejects non-string objects", () => {
        const initialState = "initial search";
        const urlBucket = { globalFilter: { search: "nested" } };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });

      it("rejects non-string arrays", () => {
        const initialState = "initial search";
        const urlBucket = { globalFilter: ["search", "terms"] };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });

      it("rejects null values", () => {
        const initialState = "initial search";
        const urlBucket = { globalFilter: null };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });

      it("rejects undefined values", () => {
        const initialState = "initial search";
        const urlBucket = { globalFilter: undefined };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(initialState);
      });

      it("accepts string with special characters", () => {
        const specialString = "search with @#$%^&*()_+ symbols";
        const urlBucket = { globalFilter: specialString };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket
        );

        expect(result).toBe(specialString);
      });

      it("accepts string with unicode characters", () => {
        const unicodeString = "search with 中文 and émojis 🔍";
        const urlBucket = { globalFilter: unicodeString };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket
        );

        expect(result).toBe(unicodeString);
      });
    });

    describe("edge cases", () => {
      it("handles very long strings", () => {
        const longString = "a".repeat(10000);
        const urlBucket = { globalFilter: longString };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket
        );

        expect(result).toBe(longString);
        expect(result?.length).toBe(10000);
      });

      it("handles whitespace-only strings", () => {
        const whitespaceString = "   \t\n\r   ";
        const urlBucket = { globalFilter: whitespaceString };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket
        );

        expect(result).toBe(whitespaceString);
      });

      it("prefers string value over initialState when both exist", () => {
        const persistedString = "persisted";
        const initialState = "initial";
        const urlBucket = { globalFilter: persistedString };
        const localBucket = {};

        const result = computeInitialGlobalFilterState(
          true,
          "url",
          "globalFilter",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toBe(persistedString);
      });
    });
  });
});
