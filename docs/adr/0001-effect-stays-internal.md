# 0001. Effect stays internal

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The rewrite (#2) is built on Effect-TS v4. Most users of a React table library do not use Effect, and should not need to learn it to declare filters.

## Decision

Effect is an implementation detail. The public API is plain TypeScript: plain options in, plain values or promises out. Codecs are plain `{ encode, decode }` objects; Effect Schema is used internally only.

## Alternatives considered

- **Effect-native public API** (Effects, Schemas and Layers in the signatures). Rejected: it forces every user to adopt Effect.

## Consequences

- The API stays simple for users who do not know Effect.
- The library converts between Effect and plain values at its boundary.
- An Effect-native entry point can be added later without breaking the plain API.
