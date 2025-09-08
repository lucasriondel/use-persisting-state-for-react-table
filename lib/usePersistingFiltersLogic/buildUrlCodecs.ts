import { Codec } from "@lucasriondel/use-local-storage-reacthook";
import { ColumnDef, RowData } from "@tanstack/react-table";
import { getColumnIdentifier } from "../getColumnIdentifier";
import { flattenColumns } from "./flattenColumns";

export function buildUrlCodecs<TData extends RowData>(
  columns: Array<ColumnDef<TData, unknown>>
): Record<string, Codec<unknown>> {
  const flat = flattenColumns(columns);
  const codecs: Record<string, Codec<unknown>> = {};

  for (const col of flat) {
    const filterMeta = col.meta?.filter;
    if (filterMeta?.persistenceStorage === "url" && filterMeta.codec) {
      const key = getColumnIdentifier(col);
      if (key) {
        codecs[key] = filterMeta.codec as Codec<unknown>;
      }
    }
  }
  return codecs;
}
