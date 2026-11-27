# 0002. State manager, not a row filter

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

TanStack Table already matches rows against filter values through each column's `filterFn`. The library needs to decide whether its Filters also do this matching.

## Decision

Filter factories carry no per-row matching. The library manages Filter state only: declaration, defaults, options, validation and Persistence. The adapter hands typed Filter state to TanStack `columnFilters`. Client-side tables keep their own `filterFn`, typed from the Filter's value.

## Alternatives considered

- **Built-in per-row matchers** in each factory. Rejected: duplicates TanStack's `filterFn` and blurs the library's purpose.
- **Server-side only.** Rejected: client-side tables would lose typed state for their own `filterFn`.

## Consequences

- The library's purpose stays clear: it manages and persists table state.
- No duplicate matching logic to maintain alongside TanStack.
- Client-side users write or reuse a `filterFn` per column.
