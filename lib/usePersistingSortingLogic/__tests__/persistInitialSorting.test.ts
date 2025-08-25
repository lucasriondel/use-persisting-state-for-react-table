import { describe, expect, it, vi } from "vitest";
import { UrlApiActions } from "../../useUrlState";
import { LocalStorageApiActions } from "../@lucasriondel/use-local-storage-reacthook";
import { persistInitialSorting } from "../persistInitialSorting";

describe("persistInitialSorting", () => {
  describe("when shouldPersist is false", () => {
    it("does not persist to URL when shouldPersist is false", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      persistInitialSorting(
        false,
        "url",
        "sortColumn",
        "sortDirection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        [{ id: "name", desc: true }]
      );

      expect(urlBucketApi.patch).not.toHaveBeenCalled();
      expect(localBucketApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist to localStorage when shouldPersist is false", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      persistInitialSorting(
        false,
        "localStorage",
        "sortColumn",
        "sortDirection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        [{ id: "age", desc: false }]
      );

      expect(urlBucketApi.patch).not.toHaveBeenCalled();
      expect(localBucketApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("when shouldPersist is true but no initialSorting", () => {
    it("does not persist when initialSorting is undefined", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      persistInitialSorting(
        true,
        "url",
        "sortColumn",
        "sortDirection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        undefined
      );

      expect(urlBucketApi.patch).not.toHaveBeenCalled();
      expect(localBucketApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist when initialSorting is empty array", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      persistInitialSorting(
        true,
        "url",
        "sortColumn",
        "sortDirection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        []
      );

      expect(urlBucketApi.patch).not.toHaveBeenCalled();
      expect(localBucketApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("when shouldPersist is true with initialSorting", () => {
    describe("with URL target", () => {
      it("persists to URL when no existing column data", () => {
        const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
          setState: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          patch: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        };
        const localBucketApi: LocalStorageApiActions<Record<string, unknown>> =
          {
            setState: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            patch: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          };

        persistInitialSorting(
          true,
          "url",
          "sortColumn",
          "sortDirection",
          {},
          {},
          urlBucketApi,
          localBucketApi,
          [{ id: "name", desc: true }]
        );

        expect(urlBucketApi.patch).toHaveBeenCalledWith({
          sortColumn: "name",
          sortDirection: "desc",
        });
        expect(localBucketApi.patch).not.toHaveBeenCalled();
      });

      it("persists to URL when no existing direction data", () => {
        const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
          setState: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          patch: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        };
        const localBucketApi: LocalStorageApiActions<Record<string, unknown>> =
          {
            setState: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            patch: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          };

        persistInitialSorting(
          true,
          "url",
          "sortColumn",
          "sortDirection",
          { sortColumn: "age" }, // missing direction
          {},
          urlBucketApi,
          localBucketApi,
          [{ id: "email", desc: false }]
        );

        expect(urlBucketApi.patch).toHaveBeenCalledWith({
          sortColumn: "email",
          sortDirection: "asc",
        });
        expect(localBucketApi.patch).not.toHaveBeenCalled();
      });

      it("does not persist to URL when both column and direction exist", () => {
        const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
          setState: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          patch: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        };
        const localBucketApi: LocalStorageApiActions<Record<string, unknown>> =
          {
            setState: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            patch: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          };

        persistInitialSorting(
          true,
          "url",
          "sortColumn",
          "sortDirection",
          { sortColumn: "existing", sortDirection: "desc" },
          {},
          urlBucketApi,
          localBucketApi,
          [{ id: "name", desc: false }]
        );

        expect(urlBucketApi.patch).not.toHaveBeenCalled();
        expect(localBucketApi.patch).not.toHaveBeenCalled();
      });

      it("persists to URL when column exists but is falsy", () => {
        const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
          setState: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          patch: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        };
        const localBucketApi: LocalStorageApiActions<Record<string, unknown>> =
          {
            setState: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            patch: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          };

        persistInitialSorting(
          true,
          "url",
          "sortColumn",
          "sortDirection",
          { sortColumn: null, sortDirection: "asc" },
          {},
          urlBucketApi,
          localBucketApi,
          [{ id: "name", desc: true }]
        );

        expect(urlBucketApi.patch).toHaveBeenCalledWith({
          sortColumn: "name",
          sortDirection: "desc",
        });
        expect(localBucketApi.patch).not.toHaveBeenCalled();
      });

      it("persists to URL when direction exists but is falsy", () => {
        const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
          setState: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          patch: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        };
        const localBucketApi: LocalStorageApiActions<Record<string, unknown>> =
          {
            setState: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            patch: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          };

        persistInitialSorting(
          true,
          "url",
          "sortColumn",
          "sortDirection",
          { sortColumn: "age", sortDirection: undefined },
          {},
          urlBucketApi,
          localBucketApi,
          [{ id: "name", desc: false }]
        );

        expect(urlBucketApi.patch).toHaveBeenCalledWith({
          sortColumn: "name",
          sortDirection: "asc",
        });
        expect(localBucketApi.patch).not.toHaveBeenCalled();
      });
    });

    describe("with localStorage target", () => {
      it("persists to localStorage when no existing data", () => {
        const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
          setState: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          patch: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        };
        const localBucketApi: LocalStorageApiActions<Record<string, unknown>> =
          {
            setState: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            patch: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          };

        persistInitialSorting(
          true,
          "localStorage",
          "sortColumn",
          "sortDirection",
          {},
          {},
          urlBucketApi,
          localBucketApi,
          [{ id: "age", desc: true }]
        );

        expect(localBucketApi.patch).toHaveBeenCalledWith({
          sortColumn: "age",
          sortDirection: "desc",
        });
        expect(urlBucketApi.patch).not.toHaveBeenCalled();
      });

      it("does not persist to localStorage when data already exists", () => {
        const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
          setState: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          patch: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        };
        const localBucketApi: LocalStorageApiActions<Record<string, unknown>> =
          {
            setState: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            patch: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          };

        persistInitialSorting(
          true,
          "localStorage",
          "sortColumn",
          "sortDirection",
          {},
          { sortColumn: "existing", sortDirection: "asc" },
          urlBucketApi,
          localBucketApi,
          [{ id: "name", desc: false }]
        );

        expect(localBucketApi.patch).not.toHaveBeenCalled();
        expect(urlBucketApi.patch).not.toHaveBeenCalled();
      });

      it("persists to localStorage when column exists but direction is missing", () => {
        const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
          setState: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          patch: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        };
        const localBucketApi: LocalStorageApiActions<Record<string, unknown>> =
          {
            setState: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            patch: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          };

        persistInitialSorting(
          true,
          "localStorage",
          "sortColumn",
          "sortDirection",
          {},
          { sortColumn: "existing" }, // missing direction
          urlBucketApi,
          localBucketApi,
          [{ id: "name", desc: true }]
        );

        expect(localBucketApi.patch).toHaveBeenCalledWith({
          sortColumn: "name",
          sortDirection: "desc",
        });
        expect(urlBucketApi.patch).not.toHaveBeenCalled();
      });
    });

    describe("with undefined target", () => {
      it("persists to localStorage when target is undefined", () => {
        const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
          setState: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          patch: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        };
        const localBucketApi: LocalStorageApiActions<Record<string, unknown>> =
          {
            setState: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            patch: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          };

        persistInitialSorting(
          true,
          undefined,
          "sortColumn",
          "sortDirection",
          {},
          {},
          urlBucketApi,
          localBucketApi,
          [{ id: "name", desc: false }]
        );

        expect(localBucketApi.patch).toHaveBeenCalledWith({
          sortColumn: "name",
          sortDirection: "asc",
        });
        expect(urlBucketApi.patch).not.toHaveBeenCalled();
      });

      it("does not persist to localStorage when target is undefined but data exists", () => {
        const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
          setState: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
          patch: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        };
        const localBucketApi: LocalStorageApiActions<Record<string, unknown>> =
          {
            setState: vi.fn(),
            get: vi.fn(),
            set: vi.fn(),
            patch: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          };

        persistInitialSorting(
          true,
          undefined,
          "sortColumn",
          "sortDirection",
          {},
          { sortColumn: "existing", sortDirection: "desc" },
          urlBucketApi,
          localBucketApi,
          [{ id: "name", desc: false }]
        );

        expect(localBucketApi.patch).not.toHaveBeenCalled();
        expect(urlBucketApi.patch).not.toHaveBeenCalled();
      });
    });
  });

  describe("edge cases", () => {
    it("handles different key names", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      persistInitialSorting(
        true,
        "url",
        "customColumn",
        "customDirection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        [{ id: "name", desc: true }]
      );

      expect(urlBucketApi.patch).toHaveBeenCalledWith({
        customColumn: "name",
        customDirection: "desc",
      });
    });

    it("checks the correct bucket based on target", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      // URL bucket has data, localStorage doesn't, target is localStorage
      persistInitialSorting(
        true,
        "localStorage",
        "sortColumn",
        "sortDirection",
        { sortColumn: "url_existing", sortDirection: "desc" },
        {},
        urlBucketApi,
        localBucketApi,
        [{ id: "name", desc: false }]
      );

      expect(localBucketApi.patch).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "asc",
      });
      expect(urlBucketApi.patch).not.toHaveBeenCalled();
    });

    it("uses only first sort from initialSorting array", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const multiSort = [
        { id: "name", desc: true },
        { id: "age", desc: false },
        { id: "email", desc: true },
      ];

      persistInitialSorting(
        true,
        "url",
        "sortColumn",
        "sortDirection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        multiSort
      );

      expect(urlBucketApi.patch).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "desc",
      });
    });

    it("handles complex column IDs", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      persistInitialSorting(
        true,
        "url",
        "sortColumn",
        "sortDirection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        [{ id: "nested.field.name", desc: false }]
      );

      expect(urlBucketApi.patch).toHaveBeenCalledWith({
        sortColumn: "nested.field.name",
        sortDirection: "asc",
      });
    });

    it("handles empty string values in buckets", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      persistInitialSorting(
        true,
        "url",
        "sortColumn",
        "sortDirection",
        { sortColumn: "", sortDirection: "" }, // empty strings are falsy
        {},
        urlBucketApi,
        localBucketApi,
        [{ id: "name", desc: true }]
      );

      expect(urlBucketApi.patch).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "desc",
      });
    });

    it("respects existing non-falsy values", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      persistInitialSorting(
        true,
        "url",
        "sortColumn",
        "sortDirection",
        { sortColumn: "existing", sortDirection: "asc" },
        {},
        urlBucketApi,
        localBucketApi,
        [{ id: "name", desc: true }]
      );

      expect(urlBucketApi.patch).not.toHaveBeenCalled();
      expect(localBucketApi.patch).not.toHaveBeenCalled();
    });

    it("handles desc boolean conversion correctly", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const testCases = [
        { desc: true, expected: "desc" },
        { desc: false, expected: "asc" },
      ];

      testCases.forEach(({ desc, expected }) => {
        (urlBucketApi.patch as any).mockClear();
        persistInitialSorting(
          true,
          "url",
          "sortColumn",
          "sortDirection",
          {},
          {},
          urlBucketApi,
          localBucketApi,
          [{ id: "test", desc }]
        );
        expect(urlBucketApi.patch).toHaveBeenCalledWith({
          sortColumn: "test",
          sortDirection: expected,
        });
      });
    });

    it("handles zero and numeric column IDs", () => {
      const urlBucketApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };
      const localBucketApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      persistInitialSorting(
        true,
        "url",
        "sortColumn",
        "sortDirection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        [{ id: "0", desc: false }] // "0" as string column ID
      );

      expect(urlBucketApi.patch).toHaveBeenCalledWith({
        sortColumn: "0",
        sortDirection: "asc",
      });
    });
  });
});
