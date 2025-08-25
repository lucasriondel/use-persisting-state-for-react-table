import { ColumnDef, RowData } from "@tanstack/react-table";
import { ColumnDefMaybeGroup } from "./types";

export function flattenColumns<TData extends RowData>(
  cols: Array<ColumnDef<TData, unknown>>
): Array<ColumnDef<TData, unknown>> {
  const out: Array<ColumnDef<TData, unknown>> = [];
  for (const c of cols) {
    out.push(c);
    const children = (c as ColumnDefMaybeGroup<TData>).columns;
    if (children && children.length) out.push(...flattenColumns(children));
  }
  return out;
}