import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";
import { RowData } from "@tanstack/react-table";
import { useMemo } from "react";
import { Codec, useUrlState } from "use-url-state-reacthook";
import { buildUrlCodecs } from "./usePersistingFiltersLogic/buildUrlCodecs";
import { PersistingTableOptions } from "./usePersistingStateForReactTable";

export const useSharedBuckets = <TData extends RowData>(
  options: PersistingTableOptions<TData>
) => {
  const urlCodecs = useMemo(
    () => buildUrlCodecs(options.columns ?? []),
    [options.columns]
  );

  const [centralUrlBucket, centralUrlBucketApi] = useUrlState<
    Record<string, unknown>
  >(
    {},
    {
      codecs: urlCodecs as Partial<{
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        [x: string]: Codec<{}>;
      }>,
      ...(options.persistence?.urlNamespace && {
        namespace: options.persistence.urlNamespace,
      }),
      history: "replace",
      debounceMs: 0,
    }
  );

  const [centralLocalBucket, centralLocalBucketApi] = useLocalStorageState<
    Record<string, unknown>
  >(
    {},
    {
      key: options.persistence?.localStorageKey ?? "data-table",
    }
  );

  // Create buckets object to pass to all hooks
  const sharedBuckets = useMemo(
    () => ({
      urlBucket: centralUrlBucket,
      urlBucketApi: centralUrlBucketApi,
      localBucket: centralLocalBucket,
      localBucketApi: centralLocalBucketApi,
    }),
    [
      centralUrlBucket,
      centralUrlBucketApi,
      centralLocalBucket,
      centralLocalBucketApi,
    ]
  );

  return sharedBuckets;
};
