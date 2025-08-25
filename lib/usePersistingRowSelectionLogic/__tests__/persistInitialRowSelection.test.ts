import { describe, expect, it, vi } from "vitest";
import { UrlApiActions } from "../../useUrlState";
import { LocalStorageApiActions } from "../@lucasriondel/use-local-storage-reacthook";
import { persistInitialRowSelection } from "../persistInitialRowSelection";

describe("persistInitialRowSelection", () => {
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

      persistInitialRowSelection(
        false,
        "url",
        "rowSelection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        { "0": true, "1": true }
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

      persistInitialRowSelection(
        false,
        "localStorage",
        "rowSelection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        { "0": true, "1": true }
      );

      expect(urlBucketApi.patch).not.toHaveBeenCalled();
      expect(localBucketApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("when shouldPersist is true but no initialRowSelection", () => {
    it("does not persist when initialRowSelection is undefined", () => {
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

      persistInitialRowSelection(
        true,
        "url",
        "rowSelection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        undefined
      );

      expect(urlBucketApi.patch).not.toHaveBeenCalled();
      expect(localBucketApi.patch).not.toHaveBeenCalled();
    });

    it("does not persist when initialRowSelection is empty object", () => {
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

      persistInitialRowSelection(
        true,
        "url",
        "rowSelection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        {}
      );

      expect(urlBucketApi.patch).toHaveBeenCalledWith({ rowSelection: {} });
      expect(localBucketApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("when shouldPersist is true with initialRowSelection", () => {
    describe("with URL target", () => {
      it("persists to URL when no existing data", () => {
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

        persistInitialRowSelection(
          true,
          "url",
          "rowSelection",
          {},
          {},
          urlBucketApi,
          localBucketApi,
          { "0": true, "1": true }
        );

        expect(urlBucketApi.patch).toHaveBeenCalledWith({
          rowSelection: { "0": true, "1": true },
        });
        expect(localBucketApi.patch).not.toHaveBeenCalled();
      });

      it("does not persist to URL when data already exists", () => {
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

        persistInitialRowSelection(
          true,
          "url",
          "rowSelection",
          { rowSelection: { "2": true } },
          {},
          urlBucketApi,
          localBucketApi,
          { "0": true, "1": true }
        );

        expect(urlBucketApi.patch).not.toHaveBeenCalled();
        expect(localBucketApi.patch).not.toHaveBeenCalled();
      });

      it("persists to URL when key exists but is falsy", () => {
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

        persistInitialRowSelection(
          true,
          "url",
          "rowSelection",
          { rowSelection: null },
          {},
          urlBucketApi,
          localBucketApi,
          { "0": true }
        );

        expect(urlBucketApi.patch).toHaveBeenCalledWith({
          rowSelection: { "0": true },
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

        persistInitialRowSelection(
          true,
          "localStorage",
          "rowSelection",
          {},
          {},
          urlBucketApi,
          localBucketApi,
          { "0": true, "1": true }
        );

        expect(localBucketApi.patch).toHaveBeenCalledWith({
          rowSelection: { "0": true, "1": true },
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

        persistInitialRowSelection(
          true,
          "localStorage",
          "rowSelection",
          {},
          { rowSelection: { "2": true } },
          urlBucketApi,
          localBucketApi,
          { "0": true, "1": true }
        );

        expect(localBucketApi.patch).not.toHaveBeenCalled();
        expect(urlBucketApi.patch).not.toHaveBeenCalled();
      });

      it("persists to localStorage when key exists but is falsy", () => {
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

        persistInitialRowSelection(
          true,
          "localStorage",
          "rowSelection",
          {},
          { rowSelection: undefined },
          urlBucketApi,
          localBucketApi,
          { "0": true }
        );

        expect(localBucketApi.patch).toHaveBeenCalledWith({
          rowSelection: { "0": true },
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

        persistInitialRowSelection(
          true,
          undefined,
          "rowSelection",
          {},
          {},
          urlBucketApi,
          localBucketApi,
          { "0": true, "1": true }
        );

        expect(localBucketApi.patch).toHaveBeenCalledWith({
          rowSelection: { "0": true, "1": true },
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

        persistInitialRowSelection(
          true,
          undefined,
          "rowSelection",
          {},
          { rowSelection: { existing: true } },
          urlBucketApi,
          localBucketApi,
          { "0": true, "1": true }
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

      persistInitialRowSelection(
        true,
        "url",
        "customSelection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        { "0": true }
      );

      expect(urlBucketApi.patch).toHaveBeenCalledWith({
        customSelection: { "0": true },
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
      persistInitialRowSelection(
        true,
        "localStorage",
        "rowSelection",
        { rowSelection: { "0": true } },
        {},
        urlBucketApi,
        localBucketApi,
        { "1": true }
      );

      expect(localBucketApi.patch).toHaveBeenCalledWith({
        rowSelection: { "1": true },
      });
      expect(urlBucketApi.patch).not.toHaveBeenCalled();
    });

    it("handles complex row selection objects", () => {
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

      const complexSelection = {
        "row-1": true,
        "row-2": false,
        "row-3": true,
        "row-4": false,
      };

      persistInitialRowSelection(
        true,
        "url",
        "rowSelection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        complexSelection
      );

      expect(urlBucketApi.patch).toHaveBeenCalledWith({
        rowSelection: complexSelection,
      });
    });

    it("handles zero and empty string keys", () => {
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

      const selectionWithSpecialKeys = {
        "0": true,
        "": false,
      };

      persistInitialRowSelection(
        true,
        "url",
        "rowSelection",
        {},
        {},
        urlBucketApi,
        localBucketApi,
        selectionWithSpecialKeys
      );

      expect(urlBucketApi.patch).toHaveBeenCalledWith({
        rowSelection: selectionWithSpecialKeys,
      });
    });

    it("respects existing truthy values", () => {
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

      persistInitialRowSelection(
        true,
        "url",
        "rowSelection",
        { rowSelection: { existing: true } },
        {},
        urlBucketApi,
        localBucketApi,
        { "0": true }
      );

      expect(urlBucketApi.patch).not.toHaveBeenCalled();
      expect(localBucketApi.patch).not.toHaveBeenCalled();
    });

    it("persists when existing value is false", () => {
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

      persistInitialRowSelection(
        true,
        "url",
        "rowSelection",
        { rowSelection: false },
        {},
        urlBucketApi,
        localBucketApi,
        { "0": true }
      );

      expect(urlBucketApi.patch).toHaveBeenCalledWith({
        rowSelection: { "0": true },
      });
    });
  });
});
