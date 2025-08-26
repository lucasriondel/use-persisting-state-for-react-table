import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";
import { ColumnDef, RowData } from "@tanstack/react-table";
import { useMemo } from "react";
import { Codec, useUrlState } from "use-url-state-reacthook";
import { buildUrlCodecs } from "./buildUrlCodecs";

interface UseFilterBucketsProps<TData extends RowData> {
  columns: ColumnDef<TData>[];
  urlNamespace: string | undefined;
  localStorageKey: string | undefined;
}

export function useFilterBuckets<TData extends RowData>({
  columns,
  urlNamespace,
  localStorageKey,
}: UseFilterBucketsProps<TData>) {
  const urlCodecs = useMemo(() => buildUrlCodecs(columns ?? []), [columns]);

  // Set up URL and LocalStorage state buckets
  const [urlBucket, urlBucketApi] = useUrlState<Record<string, unknown>>(
    {},
    {
      codecs: urlCodecs as Partial<{
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        [x: string]: Codec<{}>;
      }>,
      ...(urlNamespace && {
        namespace: urlNamespace,
      }),
      history: "replace",
      debounceMs: 0,
    }
  );

  const [localBucket, localBucketApi] = useLocalStorageState<
    Record<string, unknown>
  >(
    {},
    {
      key: localStorageKey ?? "filters",
    }
  );

  return { urlBucket, urlBucketApi, localBucket, localBucketApi };
}
