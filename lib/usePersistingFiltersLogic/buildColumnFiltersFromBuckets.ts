import { ColumnDef, ColumnFiltersState, RowData } from "@tanstack/react-table";
import { getColumnIdentifier } from "../getColumnIdentifier";
import { flattenColumns } from "./flattenColumns";
import { isEmptyValue } from "./isEmptyValue";

export function buildColumnFiltersFromBuckets<TData extends RowData>(
  columns: Array<ColumnDef<TData, unknown>>,
  urlState: Record<string, unknown>,
  localState: Record<string, unknown>
): ColumnFiltersState | null {
  const flat = flattenColumns(columns);

  const out: ColumnFiltersState = [];

  for (const col of flat) {
    const filterMeta = col.meta?.filter;
    if (!filterMeta?.persistenceStorage) continue;

    const columnId = getColumnIdentifier(col);
    if (!columnId) continue;

    const raw =
      filterMeta.persistenceStorage === "url"
        ? urlState[columnId]
        : localState[columnId];

    if (isEmptyValue(raw)) continue;
    out.push({ id: columnId, value: raw });
  }

  return out.length > 0 ? out : null;
}
