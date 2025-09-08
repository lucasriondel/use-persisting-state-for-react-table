import { ColumnDef, RowData } from "@tanstack/react-table";

/**
 * Helper function to get a column identifier from a column definition.
 * Returns c.id ?? c.accessorKey, throwing an error if both are undefined.
 */
export function getColumnIdentifier<TData extends RowData>(
  c: ColumnDef<TData, unknown>
): string {
  let identifier = c.id;

  if (identifier === undefined && "accessorKey" in c) {
    identifier = String(c.accessorKey);
  }

  if (identifier === undefined) {
    throw new Error(
      `Column must have either an 'id' or 'accessorKey' property defined`
    );
  }
  return identifier;
}
