import { ColumnDef, RowData } from "@tanstack/react-table";

export type ColumnDefMaybeGroup<TData extends RowData> = ColumnDef<
  TData,
  unknown
> & {
  columns?: Array<ColumnDef<TData, unknown>>;
};
