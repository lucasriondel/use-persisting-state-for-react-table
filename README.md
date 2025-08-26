# 📊 usePersistingStateForReactTable

A powerful React hook for managing TanStack Table state with automatic persistence across page reloads and browser sessions. Seamlessly persist table configurations including pagination, sorting, filtering, column visibility, and row selection using URL parameters or localStorage with full TypeScript support.

[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-%3E%3D16.8.0-blue.svg)](https://reactjs.org/)
[![TanStack Table](https://img.shields.io/badge/TanStack%20Table-v8-orange.svg)](https://tanstack.com/table)

## ✨ Features

- 🎯 **Type-safe** - Full TypeScript support with generic types for table data
- 🔄 **Automatic persistence** - State changes are persisted instantly to URL or localStorage
- 📋 **Complete table state** - Handles pagination, sorting, filters, column visibility, global filter, and row selection
- 🌐 **Flexible storage** - Choose URL parameters or localStorage for each state aspect
- 🚀 **Optimistic updates** - Support for async filter validation with optimistic update
- 📦 **Custom filter codecs** - Define custom serialization for complex filter types
- 🎨 **Filter variants** - Built-in support for text, select, date, number, and range filters
- ⚡ **Performance optimized** - Efficient state management with minimal re-renders
- 🪶 **Lightweight** - Minimal dependencies focused on React Table integration

## 📦 Installation

```bash
# Using npm
npm install use-persisting-state-for-react-table

# Using yarn
yarn add use-persisting-state-for-react-table

# Using pnpm
pnpm add use-persisting-state-for-react-table
```

### Peer Dependencies

This hook requires the following peer dependencies:

```bash
npm install @tanstack/react-table react react-dom
```

## 🚀 Quick Start

```tsx
import { usePersistingStateForReactTable } from "use-persisting-state-for-react-table";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
} from "@tanstack/react-table";

interface User {
  id: string;
  name: string;
  role: string;
  status: "active" | "inactive";
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "role",
    header: "Role",
    meta: {
      filter: {
        variant: "select",
        persistenceStorage: "url",
        options: [
          { value: "admin", label: "Admin" },
          { value: "user", label: "User" },
          { value: "guest", label: "Guest" },
        ],
      },
    },
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];

function UsersTable() {
  const { state, handlers, resetPagination } = usePersistingStateForReactTable({
    columns,
    persistence: {
      urlNamespace: "users-table",
      pagination: {
        pageIndex: { persistenceStorage: "url" },
        pageSize: { persistenceStorage: "url" },
      },
      sorting: { persistenceStorage: "url" },
      globalFilter: { persistenceStorage: "url", key: "search" },
      columnVisibility: { persistenceStorage: "localStorage" },
    },
  });

  const [data, setData] = useState<User[]>([]);

  const table = useReactTable({
    data,
    columns,
    state,
    ...handlers,
    getCoreRowModel: getCoreRowModel(),
    // ... other table configuration
  });

  return <div>{/* Your table UI */}</div>;
}
```

Your table state will automatically persist across page reloads!

## 📚 API Reference

### `usePersistingStateForReactTable(options)`

Returns an object with state values, their setters, and utility functions:

- State values: `pagination`, `sorting`, `columnFilters`, `columnVisibility`, `globalFilter`, `rowSelection`
- State setters: `setPagination`, `setSorting`, `setColumnFilters`, `setColumnVisibility`, `setGlobalFilter`, `setRowSelection`
- Utility functions: `resetPagination`

#### Parameters

| Parameter | Type                            | Description                                 |
| --------- | ------------------------------- | ------------------------------------------- |
| `options` | `PersistingTableOptions<TData>` | Configuration options for table persistence |

#### Main Options

| Option               | Type                 | Default | Description                                                            |
| -------------------- | -------------------- | ------- | ---------------------------------------------------------------------- |
| `columns`            | `ColumnDef<TData>[]` | -       | Array of column definitions for the table                              |
| `automaticPageReset` | `boolean`            | `true`  | Automatically resets page index to 0 when filters/global filter change |
| `initialState`       | `InitialState`       | `{}`    | Initial state values for table features                                |
| `persistence`        | `PersistenceConfig`  | `{}`    | Configuration for state persistence behavior                           |

#### Initial State Configuration

| Option             | Type                                    | Default                        | Description                          |
| ------------------ | --------------------------------------- | ------------------------------ | ------------------------------------ |
| `columnVisibility` | `Record<string, boolean>`               | `{}`                           | Initial visibility state for columns |
| `columnFilters`    | `Array<{id: string, value: any}>`       | `[]`                           | Initial column filter values         |
| `globalFilter`     | `string`                                | `""`                           | Initial global filter value          |
| `rowSelection`     | `Record<string, boolean>`               | `{}`                           | Initial row selection state          |
| `sorting`          | `Array<{id: string, desc: boolean}>`    | `[]`                           | Initial sorting configuration        |
| `pagination`       | `{pageIndex: number, pageSize: number}` | `{pageIndex: 0, pageSize: 10}` | Initial pagination state             |

#### Persistence Configuration

| Option                    | Type                 | Default        | Description                                            |
| ------------------------- | -------------------- | -------------- | ------------------------------------------------------ |
| `urlNamespace`            | `string`             | `undefined`    | Namespace prefix for URL parameters to avoid conflicts |
| `localStorageKey`         | `string`             | `"data-table"` | Key for localStorage persistence                       |
| `pagination`              | `PaginationConfig`   | Disabled       | Pagination persistence settings                        |
| `sorting`                 | `SortingConfig`      | Disabled       | Sorting state persistence                              |
| `columnVisibility`        | `VisibilityConfig`   | Disabled       | Column visibility persistence                          |
| `globalFilter`            | `GlobalFilterConfig` | Disabled       | Global filter persistence                              |
| `rowSelection`            | `RowSelectionConfig` | Disabled       | Row selection persistence                              |
| `filters.optimisticAsync` | `boolean`            | `false`        | Enable optimistic updates for async filter validation  |

#### PaginationConfig

| Option                         | Type                      | Default       | Description                             |
| ------------------------------ | ------------------------- | ------------- | --------------------------------------- |
| `pageIndex.persistenceStorage` | `"url" \| "localStorage"` | Required      | Where to persist the current page index |
| `pageIndex.key`                | `string`                  | `"pageIndex"` | Key name for pageIndex persistence      |
| `pageSize.persistenceStorage`  | `"url" \| "localStorage"` | Required      | Where to persist the page size          |
| `pageSize.key`                 | `string`                  | `"pageSize"`  | Key name for pageSize persistence       |

#### SortingConfig

| Option                | Type                      | Default              | Description                       |
| --------------------- | ------------------------- | -------------------- | --------------------------------- |
| `persistenceStorage`  | `"url" \| "localStorage"` | Required             | Where to persist sorting state    |
| `sortingColumnKey`    | `string`                  | `"sortingColumn"`    | Key name for the sorted column ID |
| `sortingDirectionKey` | `string`                  | `"sortingDirection"` | Key name for the sort direction   |

#### VisibilityConfig

| Option               | Type                      | Default              | Description                              |
| -------------------- | ------------------------- | -------------------- | ---------------------------------------- |
| `persistenceStorage` | `"url" \| "localStorage"` | Required             | Where to persist column visibility state |
| `key`                | `string`                  | `"columnVisibility"` | Key name for persistence                 |

#### GlobalFilterConfig

| Option               | Type                      | Default          | Description                          |
| -------------------- | ------------------------- | ---------------- | ------------------------------------ |
| `persistenceStorage` | `"url" \| "localStorage"` | Required         | Where to persist global filter state |
| `key`                | `string`                  | `"globalFilter"` | Key name for persistence             |

#### RowSelectionConfig

| Option               | Type                      | Default          | Description                          |
| -------------------- | ------------------------- | ---------------- | ------------------------------------ |
| `persistenceStorage` | `"url" \| "localStorage"` | Required         | Where to persist row selection state |
| `key`                | `string`                  | `"rowSelection"` | Key name for persistence             |

#### Return Object

| Property                            | Type                        | Description                                                           |
| ----------------------------------- | --------------------------- | --------------------------------------------------------------------- |
| `state`                             | `TableState`                | Object containing all current table state values                      |
| `state.pagination`                  | `PaginationState`           | Current pagination state                                              |
| `state.sorting`                     | `SortingState`              | Current sorting state                                                 |
| `state.columnFilters`               | `ColumnFiltersState`        | Current column filters state                                          |
| `state.columnVisibility`            | `VisibilityState`           | Current column visibility state                                       |
| `state.globalFilter`                | `string`                    | Current global filter state                                           |
| `state.rowSelection`                | `RowSelectionState`         | Current row selection state                                           |
| `handlers`                          | `TableHandlers`             | Object containing handler functions for React Table                   |
| `handlers.onPaginationChange`       | `(updater) => void`         | Handler for pagination changes with automatic persistence             |
| `handlers.onSortingChange`          | `(updater) => void`         | Handler for sorting changes with automatic persistence                |
| `handlers.onColumnFiltersChange`    | `(updater) => void`         | Handler for column filter changes with automatic persistence          |
| `handlers.onColumnVisibilityChange` | `(updater) => void`         | Handler for column visibility changes with automatic persistence      |
| `handlers.onGlobalFilterChange`     | `(updater: string) => void` | Handler for global filter changes with automatic persistence          |
| `handlers.onRowSelectionChange`     | `(updater) => void`         | Handler for row selection changes with automatic persistence          |
| `resetPagination`                   | `() => void`                | Function to reset pagination to first page while preserving page size |

## 🎯 Examples

### Basic Usage with URL Persistence

```tsx
import { usePersistingStateForReactTable } from "use-persisting-state-for-react-table";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";

function BasicTable() {
  const { state, handlers } = usePersistingStateForReactTable({
    columns,
    persistence: {
      urlNamespace: "products",
      pagination: {
        pageIndex: { persistenceStorage: "url", key: "page" },
        pageSize: { persistenceStorage: "url", key: "size" },
      },
      sorting: { persistenceStorage: "url" },
      globalFilter: { persistenceStorage: "url", key: "search" },
    },
  });

  const table = useReactTable({
    data,
    columns,
    state,
    ...handlers,
    getCoreRowModel: getCoreRowModel(),
  });
}
```

### Custom Filter Variants with Persistence

```tsx
const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Product Name",
    meta: {
      filter: {
        variant: "text",
        persistenceStorage: "url",
        key: "product-name",
      },
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    meta: {
      filter: {
        variant: "multiSelect",
        persistenceStorage: "localStorage",
        key: "categories",
        options: [
          { value: "electronics", label: "Electronics" },
          { value: "clothing", label: "Clothing" },
          { value: "books", label: "Books" },
        ],
      },
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    meta: {
      filter: {
        variant: "numberRange",
        persistenceStorage: "url",
        min: 0,
        max: 1000,
        step: 10,
      },
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    meta: {
      filter: {
        variant: "dateRange",
        persistenceStorage: "url",
        fromDate: new Date(2020, 0, 1),
        toDate: new Date(),
      },
    },
  },
];
```

### Custom Serialization for Complex Filters

```tsx
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "tags",
    header: "Tags",
    meta: {
      filter: {
        variant: "multiSelect",
        persistenceStorage: "url",
        codec: {
          // Custom URL serialization for array of tags
          parse: (str: string) => str.split(",").filter(Boolean),
          format: (tags: string[]) => tags.join(","),
        },
        options: tagOptions,
      },
    },
  },
  {
    accessorKey: "preferences",
    header: "User Preferences",
    meta: {
      filter: {
        variant: "text",
        persistenceStorage: "localStorage",
        codec: {
          // Store complex objects in localStorage
          parse: (str: string) => JSON.parse(str),
          format: (obj: any) => JSON.stringify(obj),
        },
      },
    },
  },
];
```

## 🔧 Advanced Configuration

### Async Filters

The hook provides a way to automatically validate filters values for `multi-select` or `select` variants based on values defined on the `columns` array. Those values can come asynchronously from an API and be validated after the first render:

```tsx
  const { data: filtersFromApi, isLoading: isFiltersLoading } = useQuery({
    queryKey: ["filters"],
    queryFn: () => fetchFilters(),
    enabled: true,
  });

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      ...
      {
        accessorKey: "role",
        id: "Role",
        meta: {
          filter: {
            isLoading: isFiltersLoading,
            variant: "multiSelect",
            options: filtersFromApi?.roles,
            codec: {
              parse: (value) => value.split(","),
              format: (value: string[]) => value.join(",")
            },
            persistenceStorage: "url"
          },
        }
      },
      ...
  , [filtersFromApi, filtersLoading])

  const { state, handlers } = usePersistingStateForReactTable({
    columns,
    ...
  });
```

If the API gives to us the roles `admin`, `user` and `manager` for example, and when loading the page we have this query param `?role=admin,WRONG-ROLE`, this is what's going to happen:

#### First render

```tsx
  const { state, handlers } = usePersistingStateForReactTable({
    columns,
    ...
  });

  console.log({ columnFilters: state.columnFilters })
  // {
  //   "columnFilters": []
  // }
```

#### After API has finished fetching

```tsx
console.log({ columnFilters: state.columnFilters });
// {
//   "columnFilters":
//   [
//       { "id": "role", "value": ["admin"] }
//   ]
// }

// query params are now: `?role=admin`
```

#### With `optimisticAsync` = true

Enable optimistic updates for filters that trigger async operations to trust the parameter we get first hand

```tsx
const { state, handlers } = usePersistingStateForReactTable({
  columns,
  persistence: {
    filters: {
      optimisticAsync: true, // Enable optimistic updates
    },
    // ... other persistence config
  },
});

console.log({ columnFilters: state.columnFilters });
// {
//   "columnFilters":
//   [
//       { "id": "role", "value": ["admin", "WRONG-VALUE"] }
//   ]
// }
```

### URL Namespacing

Prevent URL parameter conflicts when using multiple tables:

```tsx
// Users table
const usersTableState = usePersistingStateForReactTable({
  columns: userColumns,
  persistence: {
    urlNamespace: "users",
    // Results in URL params like: ?users-page=1&users-search=john
  },
});

// Products table
const productsTableState = usePersistingStateForReactTable({
  columns: productColumns,
  persistence: {
    urlNamespace: "products",
    // Results in URL params like: ?products-page=1&products-category=electronics
  },
});
```

### Custom Storage Keys

Customize storage keys for better organization:

```tsx
const { state, handlers } = usePersistingStateForReactTable({
  setGlobalFilter,
  // ... other state and setters
} = usePersistingStateForReactTable({
  columns,
  persistence: {
    localStorageKey: "admin-dashboard-table", // Custom localStorage key
    columnVisibility: {
      persistenceStorage: "localStorage",
      key: "column-prefs", // Custom key within localStorage object
    },
    globalFilter: {
      persistenceStorage: "url",
      key: "q", // Short URL parameter for search
    },
    pagination: {
      pageIndex: {
        persistenceStorage: "url",
        key: "p", // Short URL parameter for page
      },
      pageSize: {
        persistenceStorage: "localStorage",
        key: "page-size",
      },
    },
  },
});
```

## 🎨 Filter Variants

The hook supports multiple built-in filter variants with automatic persistence:

### Text Filter

```tsx
meta: {
  filter: {
    variant: "text",
    persistenceStorage: "url",
    key: "search-term",
  },
}
```

### Select Filter

```tsx
meta: {
  filter: {
    variant: "select",
    persistenceStorage: "url",
    options: [
      { value: "active", label: "Active", count: 42 },
      { value: "inactive", label: "Inactive", count: 8, disabled: true },
    ],
  },
}
```

### Multi-Select Filter

```tsx
meta: {
  filter: {
    variant: "multiSelect",
    persistenceStorage: "localStorage",
    options: categoryOptions,
  },
}
```

### Date Filter

```tsx
meta: {
  filter: {
    variant: "date",
    persistenceStorage: "url",
    fromDate: new Date(2020, 0, 1),
    toDate: new Date(),
    captionLayout: "dropdown",
  },
}
```

### Date Range Filter

```tsx
meta: {
  filter: {
    variant: "dateRange",
    persistenceStorage: "url",
    rangeMinDays: 1,
    rangeMaxDays: 365,
  },
}
```

### Number Filter

```tsx
meta: {
  filter: {
    variant: "number",
    persistenceStorage: "url",
  },
}
```

### Number Range Filter

```tsx
meta: {
  filter: {
    variant: "numberRange",
    persistenceStorage: "url",
    min: 0,
    max: 1000,
    step: 50,
    orientation: "horizontal",
  },
}
```

### Getting the meta properties

You can access the meta properties you've defined for each filter in your component that will be using the `table` helper provided by Tanstack Table:

```tsx
interface Props<TData> {
  table: Table<TData>;
}

export function Component<TData>({
  table,
}: Props<TData>) {
  const columns = table.getAllColumns();

  return (
    <div>
      {columns.filter((col) => col.getCanFilter())
        .map((column) => {
          const meta = column.columnDef.meta
          return <div>{meta.filter.key} is of type {meta.filter.variant}</div>
      })
    </div>
  )
}

```

## 📝 TypeScript Support

The hook provides full TypeScript support with generic types:

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
  isActive: boolean;
  createdAt: Date;
}

// Full type safety for table data
const { state, handlers } = usePersistingStateForReactTable({
  setColumnFilters,
  columnVisibility,
  setColumnVisibility,
} = usePersistingStateForReactTable<User>({
  columns: userColumns,
  initialState: {
    sorting: [{ id: "name", desc: false }], // ✅ Valid column ID
    columnFilters: [{ id: "role", value: "admin" }], // ✅ Valid
    pagination: { pageIndex: 0, pageSize: 25 }, // ✅ Valid
  },
  persistence: {
    columnVisibility: { persistenceStorage: "localStorage" }, // ✅ Valid
  },
});

// TypeScript will catch errors
const invalidConfig = usePersistingStateForReactTable<User>({
  columns: userColumns,
  initialState: {
    sorting: [{ id: "invalidColumn", desc: false }], // ❌ TypeScript error
    pagination: { pageIndex: "invalid", pageSize: 25 }, // ❌ TypeScript error
  },
});
```

### Extending ColumnMeta

This package extends TanStack Table's `ColumnMeta` interface to add filter metadata. If you need to add your own custom properties to `ColumnMeta`, you can use the provided `ExtendColumnMeta` utility type:

```tsx
import { ExtendColumnMeta } from "use-persisting-state-for-react-table";
import "@tanstack/react-table";

// Define your custom meta properties
type MyColumnMeta = ExtendColumnMeta<{
  newProp: string;
}>;

// Extend the ColumnMeta interface
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> extends MyColumnMeta {}
}

// Now you can use both filter properties and your custom properties
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: {
      // Filter metadata from this package
      filter: {
        variant: "text",
        persistenceStorage: "url",
      },
      // Your custom properties
      newProp: "Custom value",
    },
  },
];
```

This approach ensures that:

- ✅ You get full TypeScript support for both filter metadata and your custom properties
- ✅ The filter functionality from this package continues to work
- ✅ Your custom properties are type-safe and available in IntelliSense
- ✅ No conflicts occur between different extensions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/lucasriondel/use-persisting-state-for-react-table.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the package
pnpm build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on top of [TanStack Table](https://tanstack.com/table) for powerful table functionality
- Uses [use-url-state-reacthook](https://github.com/lucasriondel/use-url-state-reacthook) for URL state management
- Uses [@lucasriondel/use-local-storage-reacthook](https://github.com/lucasriondel/use-local-storage-reacthook) for localStorage persistence
- Inspired by the need for better table state persistence in React applications
- Designed to handle complex table scenarios with ease
- Supports modern React patterns and best practices

---

**Happy coding!** 🚀 If you find this hook useful, please consider giving it a ⭐ on GitHub!
