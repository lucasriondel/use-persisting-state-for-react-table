# 0003. One published package

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The rewrite (#2) splits the code into a Bun monorepo: persistence, filters, non-filter state (#3) and a TanStack Table + React adapter. The library must decide how these parts reach users.

## Decision

Only `use-persisting-state-for-react-table` is published, as `1.0.0`. The persistence, filters, state and adapter workspace packages are `"private": true` and bundled into it at build time. Everything is exported from the package root.

`effect` is a regular dependency, not bundled, so apps already using Effect do not load it twice. `react` and `@tanstack/react-table` are peer dependencies.

## Alternatives considered

- **Publish each workspace package.** Rejected: users would install and version several packages for one feature.

## Consequences

- Users install one package.
- The internal package split is code organisation only and can change without affecting users.
- Internal packages cannot be used on their own.
