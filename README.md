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
  const { initialState, handlers, resetPagination } =
    usePersistingStateForReactTable({
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
    state: initialState,
    onPaginationChange: handlers.onPaginationChange,
    onSortingChange: handlers.onSortingChange,
    onColumnFiltersChange: handlers.onColumnFiltersChange,
    onColumnVisibilityChange: handlers.onColumnVisibilityChange,
    onGlobalFilterChange: handlers.onGlobalFilterChange,
    onRowSelectionChange: handlers.onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    // ... other table configuration
  });

  return <div>{/* Your table UI */}</div>;
}
```

Your table state will automatically persist across page reloads!

## 📚 API Reference

### `usePersistingStateForReactTable(options)`

Returns an object with `{ initialState, handlers, resetPagination }`:

- `initialState`: Complete initial state object for React Table
- `handlers`: Event handlers for table state changes
- `resetPagination`: Function to reset pagination to initial state

#### Parameters

| Parameter | Type                            | Description                                 |
| --------- | ------------------------------- | ------------------------------------------- |
| `options` | `PersistingTableOptions<TData>` | Configuration options for table persistence |

#### Options

| Option         | Type                 | Default  | Description                                  |
| -------------- | -------------------- | -------- | -------------------------------------------- |
| `columns`      | `ColumnDef<TData>[]` | Required | Array of column definitions                  |
| `initialState` | `TableState<TData>`  | `{}`     | Initial state values for table features      |
| `persistence`  | `PersistenceConfig`  | `{}`     | Configuration for state persistence behavior |

#### Persistence Configuration

| Option             | Type                 | Default        | Description                                     |
| ------------------ | -------------------- | -------------- | ----------------------------------------------- |
| `urlNamespace`     | `string`             | `undefined`    | Namespace for URL parameters to avoid conflicts |
| `localStorageKey`  | `string`             | `"data-table"` | Key for localStorage persistence                |
| `pagination`       | `PaginationConfig`   | URL storage    | Pagination persistence settings                 |
| `sorting`          | `SortingConfig`      | URL storage    | Sorting state persistence                       |
| `columnVisibility` | `VisibilityConfig`   | localStorage   | Column visibility persistence                   |
| `globalFilter`     | `GlobalFilterConfig` | URL storage    | Global filter persistence                       |
| `rowSelection`     | `RowSelectionConfig` | Disabled       | Row selection persistence                       |
| `filters`          | `FiltersConfig`      | `{}`           | Column filters configuration                    |

#### Return Object

| Property          | Type                | Description                      |
| ----------------- | ------------------- | -------------------------------- |
| `initialState`    | `TableState<TData>` | Initial state for React Table    |
| `handlers`        | `TableHandlers`     | Event handlers for state changes |
| `resetPagination` | `() => void`        | Function to reset pagination     |

#### Handlers

| Handler                    | Signature                 | Description                      |
| -------------------------- | ------------------------- | -------------------------------- |
| `onColumnFiltersChange`    | `(updater) => void`       | Handle column filter changes     |
| `onPaginationChange`       | `(updater) => void`       | Handle pagination changes        |
| `onSortingChange`          | `(updater) => void`       | Handle sorting changes           |
| `onColumnVisibilityChange` | `(updater) => void`       | Handle column visibility changes |
| `onGlobalFilterChange`     | `(value: string) => void` | Handle global filter changes     |
| `onRowSelectionChange`     | `(updater) => void`       | Handle row selection changes     |

## 🎯 Examples

### Basic Usage with URL Persistence

```tsx
import { usePersistingStateForReactTable } from "use-persisting-state-for-react-table";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";

function BasicTable() {
  const { initialState, handlers } = usePersistingStateForReactTable({
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
    state: initialState,
    ...handlers,
    getCoreRowModel: getCoreRowModel(),
  });
}
```

### Advanced Usage with Manual State Management

```tsx
function AdvancedTable() {
  const { initialState, handlers, resetPagination } =
    usePersistingStateForReactTable({
      columns,
      initialState: {
        pagination: { pageIndex: 3, pageSize: 10 },
        sorting: [{ id: "name", desc: false }],
        columnFilters: [{ id: "role", value: ["admin"] }],
        columnVisibility: { role: false, status: false },
      },
      persistence: {
        filters: { optimisticAsync: true },
        pagination: {
          pageIndex: { persistenceStorage: "url" },
          pageSize: { persistenceStorage: "url" },
        },
        sorting: { persistenceStorage: "url" },
        columnVisibility: { persistenceStorage: "localStorage" },
        globalFilter: { persistenceStorage: "url", key: "search" },
        rowSelection: { persistenceStorage: "url" },
      },
    });

  // Manual state management for server-side operations
  const [pagination, setPagination] = useState(initialState.pagination);
  const [sorting, setSorting] = useState(initialState.sorting);
  const [columnFilters, setColumnFilters] = useState(
    initialState.columnFilters
  );
  const [columnVisibility, setColumnVisibility] = useState(
    initialState.columnVisibility
  );
  const [globalFilter, setGlobalFilter] = useState(initialState.globalFilter);
  const [rowSelection, setRowSelection] = useState(initialState.rowSelection);

  // API request configuration
  const apiRequest = useMemo(
    () => ({
      pagination,
      sorting,
      filters: columnFilters,
      globalFilter,
    }),
    [pagination, sorting, columnFilters, globalFilter]
  );

  // Server-side data fetching
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["users", apiRequest],
    queryFn: () => fetchUsers(apiRequest),
  });

  const table = useReactTable({
    data: apiResponse?.data || [],
    columns,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount: apiResponse?.pageCount,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
    },
    onPaginationChange: (updater) => {
      handlers.onPaginationChange(updater, pagination);
      setPagination(updater);
    },
    onSortingChange: (updater) => {
      handlers.onSortingChange(updater, sorting);
      setSorting(updater);
    },
    onColumnFiltersChange: (updater) => {
      handlers.onColumnFiltersChange(updater, columnFilters);
      setColumnFilters(updater);
      resetPagination(pagination, setPagination);
    },
    onColumnVisibilityChange: (updater) => {
      handlers.onColumnVisibilityChange(updater, columnVisibility);
      setColumnVisibility(updater);
    },
    onGlobalFilterChange: (updater) => {
      handlers.onGlobalFilterChange(updater, globalFilter);
      setGlobalFilter(updater);
      resetPagination(pagination, setPagination);
    },
    onRowSelectionChange: (updater) => {
      handlers.onRowSelectionChange(updater, rowSelection);
      setRowSelection(updater);
    },
    getCoreRowModel: getCoreRowModel(),
  });
}
```

### Mixed Storage Strategy

```tsx
// Store user preferences in localStorage, but keep filters/search in URL for sharing
const { initialState, handlers } = usePersistingStateForReactTable({
  columns,
  persistence: {
    localStorageKey: "my-app-table-settings",
    columnVisibility: { persistenceStorage: "localStorage" },
    pagination: {
      pageIndex: { persistenceStorage: "url" },
      pageSize: { persistenceStorage: "localStorage" }, // Remember user's preferred page size
    },
    sorting: { persistenceStorage: "url" }, // Shareable via URL
    globalFilter: { persistenceStorage: "url" }, // Shareable via URL
    filters: { optimisticAsync: true }, // Individual filter storage defined in column meta
  },
});
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

### Optimistic Async Filters

Enable optimistic updates for filters that trigger async operations:

```tsx
const { initialState, handlers } = usePersistingStateForReactTable({
  columns,
  persistence: {
    filters: {
      optimisticAsync: true, // Enable optimistic updates
    },
    // ... other persistence config
  },
});

// Filters will update UI immediately while API requests are in flight
```

### URL Namespacing

Prevent URL parameter conflicts when using multiple tables:

```tsx
// Users table
const usersTable = usePersistingStateForReactTable({
  columns: userColumns,
  persistence: {
    urlNamespace: "users",
    // Results in URL params like: ?users-page=1&users-search=john
  },
});

// Products table
const productsTable = usePersistingStateForReactTable({
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
const { initialState, handlers } = usePersistingStateForReactTable({
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
const { initialState, handlers } = usePersistingStateForReactTable<User>({
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
