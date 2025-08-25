import { ColumnDef, RowData } from "@tanstack/react-table";

export function flattenColumns<TData extends RowData>(
  cols: Array<ColumnDef<TData, unknown>>
): Array<ColumnDef<TData, unknown>> {
  const out: Array<ColumnDef<TData, unknown>> = [];
  for (const c of cols) {
    out.push(c);
    // Check if this column has children columns
    if ("columns" in c && Array.isArray(c.columns) && c.columns.length > 0) {
      out.push(...flattenColumns(c.columns));
    }
  }
  return out;
}
