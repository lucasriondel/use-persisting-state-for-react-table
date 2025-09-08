import { DeepPartial } from "@lucasriondel/use-local-storage-reacthook";
import { RowData } from "@tanstack/react-table";
import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { PersistingTableOptions } from "../usePersistingStateForReactTable";
import { useSharedBuckets } from "../useSharedBuckets";

/**
 * Creates a mock SharedBuckets object for testing purposes.
 *
 * This helper provides a complete mock implementation of the SharedBuckets interface
 * by wrapping the real useSharedBuckets hook with Vitest mocks. The mock includes:
 * - urlBucket: Real URL state storage from useSharedBuckets
 * - urlBucketApi: Mock API actions that wrap real URL state management
 * - localBucket: Real localStorage state storage from useSharedBuckets
 * - localBucketApi: Mock API actions that wrap real localStorage state management
 *
 * All API methods are mocked using Vitest's vi.fn() and delegate to the real implementations,
 * allowing tests to verify method calls while maintaining full functionality.
 *
 * @param options - Optional PersistingTableOptions for the useSharedBuckets hook
 * @returns A complete SharedBuckets mock object with spyable methods
 *
 * @example
 * ```typescript
 * import { createMockSharedBuckets } from './createMockSharedBuckets';
 *
 * describe('My test', () => {
 *   it('should work with shared buckets', () => {
 *     const sharedBuckets = createMockSharedBuckets();
 *
 *     // Use the mock in your test
 *     const result = myFunction(sharedBuckets);
 *
 *     // Assert on mock calls - these will verify the real methods were called
 *     expect(sharedBuckets.urlBucketApi.patch).toHaveBeenCalledWith(expectedData);
 *     expect(sharedBuckets.localBucketApi.set).toHaveBeenCalledWith('key', 'value');
 *   });
 * });
 * ```
 */
export const createMockSharedBuckets = <TData extends RowData>(
  options: PersistingTableOptions<TData> = {
    columns: [],
  } as PersistingTableOptions<TData>
) => {
  const { result } = renderHook(() => useSharedBuckets(options));

  return {
    ...result.current,
    urlBucketApi: {
      ...result.current.urlBucketApi,
      patch: vi
        .fn()
        .mockImplementation((updates: DeepPartial<Record<string, unknown>>) => {
          result.current.urlBucketApi.patch(updates);
        }),
      setState: vi.fn().mockImplementation((state: Record<string, unknown>) => {
        result.current.urlBucketApi.setState(state);
      }),
      get: vi.fn().mockImplementation((key: string) => {
        return result.current.urlBucketApi.get(key);
      }),
      set: vi.fn().mockImplementation((key: string, value: unknown) => {
        result.current.urlBucketApi.set(key, value);
      }),
      remove: vi.fn().mockImplementation((...keys: string[]) => {
        result.current.urlBucketApi.remove(...keys);
      }),
      clear: vi.fn().mockImplementation(() => {
        result.current.urlBucketApi.clear();
      }),
    },
    localBucketApi: {
      ...result.current.localBucketApi,
      patch: vi
        .fn()
        .mockImplementation((updates: DeepPartial<Record<string, unknown>>) => {
          result.current.localBucketApi.patch(updates);
        }),
      setState: vi.fn().mockImplementation((state: Record<string, unknown>) => {
        result.current.localBucketApi.setState(state);
      }),
      get: vi.fn().mockImplementation((key: string) => {
        return result.current.localBucketApi.get(key);
      }),
      set: vi.fn().mockImplementation((key: string, value: unknown) => {
        result.current.localBucketApi.set(key, value);
      }),
      remove: vi.fn().mockImplementation((...keys: string[]) => {
        result.current.localBucketApi.remove(...keys);
      }),
      clear: vi.fn().mockImplementation(() => {
        result.current.localBucketApi.clear();
      }),
    },
  };
};
