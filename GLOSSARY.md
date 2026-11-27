# Glossary

**Filter**
One user-facing way to narrow table rows (for example "status is one of…"), with its current value.

**Filter factory**
A function such as `selectFilter` or `dateFilter` that declares one Filter of a given type.

**Resolver**
What supplies a Filter's options (for example the choices of a select). It can be a static list, a sync function or an async function. An async Resolver makes its Filter async.

**Persistence**
Keeping Filter values across reloads, in the URL or in local storage.
