import { ColumnDef, RowData } from "@tanstack/react-table";
import { useEffect, useMemo } from "react";
import { PersistenceStorage } from "./types";
import { PersistingTableOptions } from "./usePersistingStateForReactTable";

type ColumnDefMaybeGroup<TData extends RowData> = ColumnDef<TData, unknown> & {
  columns?: Array<ColumnDef<TData, unknown>>;
};

export function useLocalStorageKeyValidation<TData extends RowData>(
  options: PersistingTableOptions<TData>
): PersistingTableOptions<TData> {
  const hasLocalStoragePersistence = useMemo(() => {
    // Check direct persistence settings
    const directPersistence =
      options.persistence?.pagination?.pageIndex?.persistenceStorage ===
        "localStorage" ||
      options.persistence?.pagination?.pageSize?.persistenceStorage ===
        "localStorage" ||
      options.persistence?.sorting?.persistenceStorage === "localStorage" ||
      options.persistence?.columnVisibility?.persistenceStorage ===
        "localStorage" ||
      options.persistence?.globalFilter?.persistenceStorage ===
        "localStorage" ||
      options.persistence?.rowSelection?.persistenceStorage === "localStorage";

    // Check column filter persistence
    const flattenColumns = (
      cols: Array<ColumnDef<TData, unknown>>
    ): Array<ColumnDef<TData, unknown>> => {
      const out: Array<ColumnDef<TData, unknown>> = [];
      for (const c of cols) {
        out.push(c);
        const children = (c as ColumnDefMaybeGroup<TData>).columns;
        if (children && children.length) out.push(...flattenColumns(children));
      }
      return out;
    };

    const columnFilterPersistence = options.columns
      ? flattenColumns(options.columns).some((c) => {
          const meta = (
            c as ColumnDef<TData, unknown> & {
              meta?: { filter?: { persistenceStorage?: PersistenceStorage } };
            }
          ).meta;
          return meta?.filter?.persistenceStorage === "localStorage";
        })
      : false;

    return directPersistence || columnFilterPersistence;
  }, [options.persistence, options.columns]);

  useEffect(() => {
    if (hasLocalStoragePersistence && !options.persistence?.localStorageKey) {
      console.warn(
        "[usePersistingStateForReactTable] localStorage persistence is configured but no localStorageKey is provided. " +
          "Falling back to 'data-table' as the localStorage key."
      );
    }
  }, [hasLocalStoragePersistence, options.persistence?.localStorageKey]);

  // Apply fallback localStorageKey if needed
  const optionsWithFallback: PersistingTableOptions<TData> = useMemo(() => {
    return hasLocalStoragePersistence && !options.persistence?.localStorageKey
      ? {
          ...options,
          persistence: {
            ...options.persistence,
            localStorageKey: "data-table",
          },
        }
      : options;
  }, [hasLocalStoragePersistence, options]);

  return optionsWithFallback;
}
