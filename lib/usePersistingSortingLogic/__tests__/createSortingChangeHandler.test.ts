import { describe, expect, it, vi } from "vitest";
import { UrlApiActions } from "../../useUrlState";
import { LocalStorageApiActions } from "../@lucasriondel/use-local-storage-reacthook";
import { createSortingChangeHandler } from "../createSortingChangeHandler";

describe("createSortingChangeHandler", () => {
  describe("with localStorage API", () => {
    it("creates a handler that patches column and direction when sort is present", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [];
      const newState = [{ id: "name", desc: true }];

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "desc",
      });
      expect(mockApi.remove).not.toHaveBeenCalled();
    });

    it("creates a handler that patches with asc direction", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [{ id: "age", desc: true }];
      const newState = [{ id: "email", desc: false }];

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "email",
        sortDirection: "asc",
      });
    });

    it("removes keys when no sort is present", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [{ id: "name", desc: true }];
      const newState = [];

      handler(newState, currentState);

      expect(mockApi.remove).toHaveBeenCalledWith(
        "sortColumn",
        "sortDirection"
      );
      expect(mockApi.patch).not.toHaveBeenCalled();
    });

    it("handles function updaters correctly", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [{ id: "name", desc: false }];
      const updater = vi.fn(() => [{ id: "age", desc: true }]);

      handler(updater, currentState);

      expect(updater).toHaveBeenCalledWith(currentState);
      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "age",
        sortDirection: "desc",
      });
    });

    it("uses only first sort item when multiple sorts provided", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [];
      const newState = [
        { id: "name", desc: true },
        { id: "age", desc: false },
      ];

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "desc",
      });
    });

    it("handles empty current state", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [];
      const newState = [{ id: "email", desc: false }];

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "email",
        sortDirection: "asc",
      });
    });

    it("handles function updater that returns empty array", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [{ id: "name", desc: true }];
      const updater = vi.fn(() => []);

      handler(updater, currentState);

      expect(updater).toHaveBeenCalledWith(currentState);
      expect(mockApi.remove).toHaveBeenCalledWith(
        "sortColumn",
        "sortDirection"
      );
      expect(mockApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("with URL API", () => {
    it("creates a handler that patches column and direction when sort is present", () => {
      const mockApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [];
      const newState = [{ id: "name", desc: true }];

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "desc",
      });
      expect(mockApi.remove).not.toHaveBeenCalled();
    });

    it("removes keys when no sort is present", () => {
      const mockApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [{ id: "name", desc: true }];
      const newState = [];

      handler(newState, currentState);

      expect(mockApi.remove).toHaveBeenCalledWith(
        "sortColumn",
        "sortDirection"
      );
      expect(mockApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles different key names", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "customCol",
        "customDir"
      );
      const currentState = [];
      const newState = [{ id: "name", desc: false }];

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        customCol: "name",
        customDir: "asc",
      });
    });

    it("handles sorting state with complex column IDs", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [];
      const newState = [{ id: "nested.field.name", desc: true }];

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "nested.field.name",
        sortDirection: "desc",
      });
    });

    it("properly handles desc boolean values", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const testCases = [
        { desc: true, expected: "desc" },
        { desc: false, expected: "asc" },
      ];

      testCases.forEach(({ desc, expected }) => {
        (mockApi.patch as any).mockClear();
        handler([{ id: "test", desc }], []);
        expect(mockApi.patch).toHaveBeenCalledWith({
          sortColumn: "test",
          sortDirection: expected,
        });
      });
    });

    it("handles function updater with complex logic", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [{ id: "name", desc: false }];
      const updater = vi.fn((old) => {
        // Toggle sort direction
        return old.length > 0 && old[0].id === "name"
          ? [{ id: "name", desc: !old[0].desc }]
          : [{ id: "name", desc: false }];
      });

      handler(updater, currentState);

      expect(updater).toHaveBeenCalledWith(currentState);
      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "desc",
      });
    });

    it("handles function updater that clears sorting", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [{ id: "name", desc: true }];
      const updater = vi.fn(() => []);

      handler(updater, currentState);

      expect(updater).toHaveBeenCalledWith(currentState);
      expect(mockApi.remove).toHaveBeenCalledWith(
        "sortColumn",
        "sortDirection"
      );
    });

    it("ignores additional sorts beyond the first", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const multiSort = [
        { id: "name", desc: true },
        { id: "age", desc: false },
        { id: "email", desc: true },
      ];

      handler(multiSort, []);

      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "name",
        sortDirection: "desc",
      });
    });

    it("handles empty column ID", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [];
      const newState = [{ id: "", desc: false }];

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "",
        sortDirection: "asc",
      });
    });

    it("type safety: ensures proper sorting state handling", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createSortingChangeHandler(
        mockApi,
        "sortColumn",
        "sortDirection"
      );
      const currentState = [{ id: "previous", desc: true }];
      const newState = [{ id: "current", desc: false }];

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        sortColumn: "current",
        sortDirection: "asc",
      });
    });
  });
});
