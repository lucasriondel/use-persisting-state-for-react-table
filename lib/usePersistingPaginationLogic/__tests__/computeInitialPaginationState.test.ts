import { describe, expect, it } from "vitest";
import { computeInitialPaginationState } from "../computeInitialPaginationState";
import type { PaginationState } from "@tanstack/react-table";

describe("computeInitialPaginationState", () => {
  describe("default behavior", () => {
    it("returns default pagination when no persistence and no initialState", () => {
      const result = computeInitialPaginationState(
        false, // shouldPersistPageIndex
        false, // shouldPersistPageSize
        undefined,
        undefined,
        "pageIndex",
        "pageSize",
        {},
        {},
        undefined
      );

      expect(result).toEqual({
        pageIndex: 0,
        pageSize: 10,
      });
    });

    it("returns provided initialState when no persistence", () => {
      const initialState: PaginationState = {
        pageIndex: 5,
        pageSize: 25,
      };

      const result = computeInitialPaginationState(
        false,
        false,
        undefined,
        undefined,
        "pageIndex",
        "pageSize",
        {},
        {},
        initialState
      );

      expect(result).toEqual(initialState);
    });

    it("returns initialState when neither pageIndex nor pageSize should persist", () => {
      const initialState: PaginationState = {
        pageIndex: 3,
        pageSize: 50,
      };
      const urlBucket = { pageIndex: 10, pageSize: 100 };
      const localBucket = { pageIndex: 20, pageSize: 200 };

      const result = computeInitialPaginationState(
        false,
        false,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual(initialState);
    });
  });

  describe("pageIndex persistence", () => {
    describe("from URL", () => {
      it("uses persisted pageIndex from URL bucket when available", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageIndex: 7 };
        const localBucket = {};

        const result = computeInitialPaginationState(
          true,
          false,
          "url",
          undefined,
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: 7,
          pageSize: 10,
        });
      });

      it("ignores non-number pageIndex values from URL", () => {
        const initialState: PaginationState = {
          pageIndex: 3,
          pageSize: 25,
        };
        const urlBucket = { pageIndex: "invalid" };
        const localBucket = {};

        const result = computeInitialPaginationState(
          true,
          false,
          "url",
          undefined,
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual(initialState);
      });

      it("uses custom pageIndex key from URL", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { 
          customPageIndex: 15,
          pageIndex: 5 // should be ignored
        };
        const localBucket = {};

        const result = computeInitialPaginationState(
          true,
          false,
          "url",
          undefined,
          "customPageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: 15,
          pageSize: 10,
        });
      });

      it("handles negative pageIndex values", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageIndex: -5 };
        const localBucket = {};

        const result = computeInitialPaginationState(
          true,
          false,
          "url",
          undefined,
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: -5,
          pageSize: 10,
        });
      });

      it("handles zero pageIndex", () => {
        const initialState: PaginationState = {
          pageIndex: 5,
          pageSize: 10,
        };
        const urlBucket = { pageIndex: 0 };
        const localBucket = {};

        const result = computeInitialPaginationState(
          true,
          false,
          "url",
          undefined,
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: 0,
          pageSize: 10,
        });
      });
    });

    describe("from localStorage", () => {
      it("uses persisted pageIndex from localStorage bucket when available", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = {};
        const localBucket = { pageIndex: 12 };

        const result = computeInitialPaginationState(
          true,
          false,
          "localStorage",
          undefined,
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: 12,
          pageSize: 10,
        });
      });

      it("ignores non-number pageIndex values from localStorage", () => {
        const initialState: PaginationState = {
          pageIndex: 3,
          pageSize: 25,
        };
        const urlBucket = {};
        const localBucket = { pageIndex: { invalid: "object" } };

        const result = computeInitialPaginationState(
          true,
          false,
          "localStorage",
          undefined,
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual(initialState);
      });
    });

    describe("undefined target", () => {
      it("uses localStorage bucket when pageIndexTarget is undefined", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageIndex: 5 };
        const localBucket = { pageIndex: 8 };

        const result = computeInitialPaginationState(
          true,
          false,
          undefined,
          undefined,
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: 8, // from localStorage
          pageSize: 10,
        });
      });
    });
  });

  describe("pageSize persistence", () => {
    describe("from URL", () => {
      it("uses persisted pageSize from URL bucket when available", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageSize: 50 };
        const localBucket = {};

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: 0,
          pageSize: 50,
        });
      });

      it("ignores non-number pageSize values from URL", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 25,
        };
        const urlBucket = { pageSize: "50" }; // string instead of number
        const localBucket = {};

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual(initialState);
      });

      it("uses custom pageSize key from URL", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { 
          customPageSize: 75,
          pageSize: 25 // should be ignored
        };
        const localBucket = {};

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "customPageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: 0,
          pageSize: 75,
        });
      });

      it("handles zero pageSize", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageSize: 0 };
        const localBucket = {};

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: 0,
          pageSize: 0,
        });
      });

      it("handles large pageSize values", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageSize: 10000 };
        const localBucket = {};

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: 0,
          pageSize: 10000,
        });
      });
    });

    describe("from localStorage", () => {
      it("uses persisted pageSize from localStorage bucket when available", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = {};
        const localBucket = { pageSize: 100 };

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "localStorage",
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual({
          pageIndex: 0,
          pageSize: 100,
        });
      });

      it("ignores non-number pageSize values from localStorage", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 25,
        };
        const urlBucket = {};
        const localBucket = { pageSize: [50] }; // array instead of number

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "localStorage",
          "pageIndex",
          "pageSize",
          urlBucket,
          localBucket,
          initialState
        );

        expect(result).toEqual(initialState);
      });
    });
  });

  describe("both pageIndex and pageSize persistence", () => {
    it("uses both persisted values when both are available and valid", () => {
      const initialState: PaginationState = {
        pageIndex: 0,
        pageSize: 10,
      };
      const urlBucket = { pageIndex: 7, pageSize: 50 };
      const localBucket = {};

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual({
        pageIndex: 7,
        pageSize: 50,
      });
    });

    it("uses mix of persisted and initial values", () => {
      const initialState: PaginationState = {
        pageIndex: 3,
        pageSize: 25,
      };
      const urlBucket = { pageIndex: 10 }; // pageSize missing
      const localBucket = {};

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "url",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual({
        pageIndex: 10, // from URL
        pageSize: 25,  // from initialState
      });
    });

    it("handles pageIndex and pageSize from different targets", () => {
      const initialState: PaginationState = {
        pageIndex: 0,
        pageSize: 10,
      };
      const urlBucket = { pageIndex: 15 };
      const localBucket = { pageSize: 100 };

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual({
        pageIndex: 15,  // from URL
        pageSize: 100,  // from localStorage
      });
    });

    it("uses different keys for pageIndex and pageSize", () => {
      const initialState: PaginationState = {
        pageIndex: 0,
        pageSize: 10,
      };
      const urlBucket = { 
        currentPage: 8,
        itemsPerPage: 75,
        pageIndex: 1, // should be ignored
        pageSize: 20   // should be ignored
      };
      const localBucket = {};

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "url",
        "currentPage",
        "itemsPerPage",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual({
        pageIndex: 8,
        pageSize: 75,
      });
    });
  });

  describe("edge cases", () => {
    it("handles missing buckets gracefully", () => {
      const initialState: PaginationState = {
        pageIndex: 2,
        pageSize: 20,
      };

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        {},
        {},
        initialState
      );

      expect(result).toEqual(initialState);
    });

    it("handles null values in buckets", () => {
      const initialState: PaginationState = {
        pageIndex: 2,
        pageSize: 20,
      };
      const urlBucket = { pageIndex: null };
      const localBucket = { pageSize: null };

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual(initialState);
    });

    it("handles undefined values in buckets", () => {
      const initialState: PaginationState = {
        pageIndex: 2,
        pageSize: 20,
      };
      const urlBucket = { pageIndex: undefined };
      const localBucket = { pageSize: undefined };

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual(initialState);
    });

    it("handles boolean values in buckets", () => {
      const initialState: PaginationState = {
        pageIndex: 2,
        pageSize: 20,
      };
      const urlBucket = { pageIndex: true };
      const localBucket = { pageSize: false };

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual(initialState);
    });

    it("handles string numbers in buckets", () => {
      const initialState: PaginationState = {
        pageIndex: 2,
        pageSize: 20,
      };
      const urlBucket = { pageIndex: "5" };
      const localBucket = { pageSize: "100" };

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      // String numbers are not treated as numbers
      expect(result).toEqual(initialState);
    });

    it("handles floating point numbers", () => {
      const initialState: PaginationState = {
        pageIndex: 0,
        pageSize: 10,
      };
      const urlBucket = { pageIndex: 3.7 };
      const localBucket = { pageSize: 25.9 };

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual({
        pageIndex: 3.7,
        pageSize: 25.9,
      });
    });

    it("handles Infinity and -Infinity", () => {
      const initialState: PaginationState = {
        pageIndex: 0,
        pageSize: 10,
      };
      const urlBucket = { pageIndex: Infinity };
      const localBucket = { pageSize: -Infinity };

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      expect(result).toEqual({
        pageIndex: Infinity,
        pageSize: -Infinity,
      });
    });

    it("handles NaN values", () => {
      const initialState: PaginationState = {
        pageIndex: 2,
        pageSize: 20,
      };
      const urlBucket = { pageIndex: NaN };
      const localBucket = { pageSize: NaN };

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      // NaN is still of type "number" in JavaScript
      expect(result).toEqual({
        pageIndex: NaN,
        pageSize: NaN,
      });
    });
  });

  describe("return value optimization", () => {
    it("returns original base when no changes made", () => {
      const initialState: PaginationState = {
        pageIndex: 3,
        pageSize: 30,
      };
      const urlBucket = {};
      const localBucket = {};

      const result = computeInitialPaginationState(
        true,
        true,
        "url",
        "localStorage",
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      // Should return the same reference when unchanged
      expect(result).toBe(initialState);
    });

    it("returns new object when changes made", () => {
      const initialState: PaginationState = {
        pageIndex: 0,
        pageSize: 10,
      };
      const urlBucket = { pageIndex: 5 };
      const localBucket = {};

      const result = computeInitialPaginationState(
        true,
        false,
        "url",
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        initialState
      );

      // Should return a new object when changes were made
      expect(result).not.toBe(initialState);
      expect(result).toEqual({
        pageIndex: 5,
        pageSize: 10,
      });
    });

    it("returns default object when no initialState provided", () => {
      const urlBucket = {};
      const localBucket = {};

      const result = computeInitialPaginationState(
        false,
        false,
        undefined,
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        undefined
      );

      expect(result).toEqual({
        pageIndex: 0,
        pageSize: 10,
      });
    });

    it("uses provided initialState even when incomplete", () => {
      const incompleteInitialState = {} as PaginationState;
      const urlBucket = {};
      const localBucket = {};

      const result = computeInitialPaginationState(
        false,
        false,
        undefined,
        undefined,
        "pageIndex",
        "pageSize",
        urlBucket,
        localBucket,
        incompleteInitialState
      );

      // The function uses initialState ?? defaults, so empty object is used as-is
      expect(result).toEqual({});
    });
  });

  describe("pageSize validation with allowedPageSizes", () => {
    describe("with default allowed values", () => {
      it("accepts valid pageSize from URL bucket", () => {
        const defaultAllowed = [10, 20, 50];
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageSize: 20 };

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          {},
          initialState,
          defaultAllowed
        );

        expect(result.pageSize).toBe(20);
      });

      it("falls back to first allowed value when persisted pageSize is invalid", () => {
        const defaultAllowed = [10, 20, 50];
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageSize: 15 }; // 15 is not in default [10, 20, 50]

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          {},
          initialState,
          defaultAllowed
        );

        expect(result.pageSize).toBe(10); // First default value
      });

      it("validates pageSize from localStorage bucket", () => {
        const defaultAllowed = [10, 20, 50];
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const localBucket = { pageSize: 25 }; // Invalid in default allowed values

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "localStorage",
          "pageIndex",
          "pageSize",
          {},
          localBucket,
          initialState,
          defaultAllowed
        );

        expect(result.pageSize).toBe(10); // Falls back to first default value
      });
    });

    describe("with custom allowed values", () => {
      it("accepts valid pageSize from custom allowed list", () => {
        const customAllowed = [5, 15, 25, 100];
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageSize: 15 };

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          {},
          initialState,
          customAllowed
        );

        expect(result.pageSize).toBe(15);
      });

      it("falls back to first custom value when persisted pageSize is invalid", () => {
        const customAllowed = [5, 15, 25, 100];
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageSize: 20 }; // 20 is not in custom allowed values

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          {},
          initialState,
          customAllowed
        );

        expect(result.pageSize).toBe(5); // First custom value
      });

      it("handles non-number values in storage", () => {
        const customAllowed = [5, 15, 25, 100];
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageSize: "invalid" };

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          {},
          initialState,
          customAllowed
        );

        // Non-number values should not trigger validation - should keep initial state
        expect(result.pageSize).toBe(10); // Keeps initial state value
      });
    });

    describe("edge cases", () => {
      it("handles empty allowed values array", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageSize: 20 };

        const result = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          {},
          initialState,
          []
        );

        expect(result.pageSize).toBe(10); // Falls back to default 10
      });

      it("does not validate when pageSize persistence is disabled", () => {
        const initialState: PaginationState = {
          pageIndex: 0,
          pageSize: 10,
        };
        const urlBucket = { pageSize: 999 }; // Invalid value

        const result = computeInitialPaginationState(
          false,
          false, // pageSize persistence disabled
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          urlBucket,
          {},
          initialState,
          [5, 15, 25]
        );

        expect(result.pageSize).toBe(10); // Keeps initial state value
      });

      it("validates both URL and localStorage sources", () => {
        const customAllowed = [5, 15, 25, 100];
        
        // Test URL source
        const urlResult = computeInitialPaginationState(
          false,
          true,
          undefined,
          "url",
          "pageIndex",
          "pageSize",
          { pageSize: 30 }, // Invalid
          {},
          { pageIndex: 0, pageSize: 10 },
          customAllowed
        );
        expect(urlResult.pageSize).toBe(5);

        // Test localStorage source
        const localResult = computeInitialPaginationState(
          false,
          true,
          undefined,
          "localStorage",
          "pageIndex",
          "pageSize",
          {},
          { pageSize: 30 }, // Invalid
          { pageIndex: 0, pageSize: 10 },
          customAllowed
        );
        expect(localResult.pageSize).toBe(5);
      });
    });
  });
});