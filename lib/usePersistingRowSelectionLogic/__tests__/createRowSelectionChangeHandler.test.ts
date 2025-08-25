import { describe, expect, it, vi } from "vitest";
import { UrlApiActions } from "../../useUrlState";
import { LocalStorageApiActions } from "../@lucasriondel/use-local-storage-reacthook";
import { createRowSelectionChangeHandler } from "../createRowSelectionChangeHandler";

describe("createRowSelectionChangeHandler", () => {
  describe("with localStorage API", () => {
    it("creates a handler that patches selected rows only", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = { "0": false, "1": true };
      const newState = { "0": true, "1": false, "2": true };

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        rowSelection: { "0": true, "2": true },
      });
      expect(mockApi.remove).not.toHaveBeenCalled();
    });

    it("removes key when no rows are selected", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = { "0": true, "1": true };
      const newState = { "0": false, "1": false };

      handler(newState, currentState);

      expect(mockApi.remove).toHaveBeenCalledWith("rowSelection");
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

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = { "0": false, "1": true };
      const updater = vi.fn((old) => ({ ...old, "0": true, "2": true }));

      handler(updater, currentState);

      expect(updater).toHaveBeenCalledWith(currentState);
      expect(mockApi.patch).toHaveBeenCalledWith({
        rowSelection: { "0": true, "1": true, "2": true },
      });
    });

    it("filters out false values correctly", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = {};
      const newState = { "0": true, "1": false, "2": true, "3": false };

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        rowSelection: { "0": true, "2": true },
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

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = {};
      const newState = { "0": true };

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        rowSelection: { "0": true },
      });
    });

    it("handles empty new state", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = { "0": true };
      const newState = {};

      handler(newState, currentState);

      expect(mockApi.remove).toHaveBeenCalledWith("rowSelection");
      expect(mockApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("with URL API", () => {
    it("creates a handler that patches selected rows only", () => {
      const mockApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = { "0": false, "1": true };
      const newState = { "0": true, "1": false, "2": true };

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        rowSelection: { "0": true, "2": true },
      });
      expect(mockApi.remove).not.toHaveBeenCalled();
    });

    it("removes key when no rows are selected", () => {
      const mockApi: UrlApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = { "0": true, "1": true };
      const newState = { "0": false, "1": false };

      handler(newState, currentState);

      expect(mockApi.remove).toHaveBeenCalledWith("rowSelection");
      expect(mockApi.patch).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles mixed true/false values", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = {};
      const newState = {
        "0": true,
        "1": false,
        "2": true,
        "3": false,
        "4": true,
      };

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        rowSelection: { "0": true, "2": true, "4": true },
      });
    });

    it("handles function updater that returns empty selection", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = { "0": true, "1": true };
      const updater = vi.fn(() => ({ "0": false, "1": false }));

      handler(updater, currentState);

      expect(updater).toHaveBeenCalledWith(currentState);
      expect(mockApi.remove).toHaveBeenCalledWith("rowSelection");
      expect(mockApi.patch).not.toHaveBeenCalled();
    });

    it("handles function updater that returns only selected rows", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = { "0": false };
      const updater = vi.fn(() => ({ "1": true, "2": true, "3": false }));

      handler(updater, currentState);

      expect(updater).toHaveBeenCalledWith(currentState);
      expect(mockApi.patch).toHaveBeenCalledWith({
        rowSelection: { "1": true, "2": true },
      });
    });

    it("handles different key names", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler(
        "customSelection",
        mockApi
      );
      const currentState = {};
      const newState = { "0": true };

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        customSelection: { "0": true },
      });
    });

    it("preserves type safety with proper row selection state", () => {
      const mockApi: LocalStorageApiActions<Record<string, unknown>> = {
        setState: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        patch: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      const handler = createRowSelectionChangeHandler("rowSelection", mockApi);
      const currentState = { "row-1": true, "row-2": false };
      const newState = { "row-1": false, "row-2": true, "row-3": true };

      handler(newState, currentState);

      expect(mockApi.patch).toHaveBeenCalledWith({
        rowSelection: { "row-2": true, "row-3": true },
      });
    });
  });
});
