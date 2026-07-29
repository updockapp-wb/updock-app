# Deferred items — Phase 02

Out-of-scope findings logged during execution (not fixed — see execute-plan scope boundary).

## From plan 02-03

| Item | File | Detail | Why deferred |
|------|------|--------|--------------|
| `react-hooks/set-state-in-effect` lint error | `src/App.tsx:47` | `setShowWelcome(true)` called synchronously inside the email-confirmation redirect effect (pre-existing code, untouched by 02-03). | Pre-existing failure in code the plan does not touch. Fixing it changes the auth-redirect flow — out of scope for a byte-identical chrome refactor. |
| `@typescript-eslint/no-explicit-any` lint error | `src/components/FiltersModal.tsx` (`onFilterChange(f.id as any)`) | Pre-existing cast, carried over verbatim during the DS migration. | The plan mandates preserving the filter rows verbatim; typing `filters[].id` as `StartType \| 'All'` is a behavioral/typing change beyond the migration's scope. |
