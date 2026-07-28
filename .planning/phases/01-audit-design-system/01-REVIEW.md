---
phase: 01-audit-design-system
reviewed: 2026-07-28T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - vite.config.ts
  - package.json
  - src/index.css
  - src/ui/Modal.tsx
  - src/ui/Input.tsx
  - src/ui/Button.tsx
  - src/ui/Card.tsx
  - src/ui/Header.tsx
  - src/components/AuthModal.tsx
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-07-28
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the design-system master components (`Modal`, `Header`, `Input`, `Button`, `Card`), the `AuthModal` migration onto them, and the supporting `vite.config.ts` / `src/index.css` / `package.json` changes.

**Auth security check (explicit ask):** Diffed `AuthModal.tsx` against its pre-migration version (`c17e421~1`). The entire logic block — `mapAuthError`, `handleSubmit`, all `supabase.auth.signInWithPassword` / `supabase.auth.signUp` / `supabase.from('profiles').upsert` calls, `emailRedirectTo`, `required`/`minLength={6}` constraints — is byte-identical pre- and post-migration. No auth-security regression was introduced by the JSX re-authoring. Close-button wiring is also correct: exactly one close affordance is rendered (via `Modal`), matching the original single-close-button behavior; `Header` is not passed `onClose` in `AuthModal`, so it renders the stacked title/subtitle shape, not the row-with-close shape — pixel-identity preserved.

No Critical/Blocker issues found. The Warnings below are primarily internal-consistency defects in the newly introduced master components themselves (duplicated styling instead of composition, a dropped prop, missing a11y wiring) — the kind of thing this design-system consolidation phase exists to prevent, so they're worth fixing before other screens are migrated onto these components.

## Warnings

### WR-01: Modal's close button duplicates Button's `ghost` variant instead of using it

**File:** `src/ui/Modal.tsx:22-27`
**Issue:** `Button.tsx` explicitly documents its `ghost` variant as extracted verbatim from this exact control (`// AuthModal:93 — the sole visual anchor` / `// AuthModal:93 (icon-only close button)` in `src/ui/Button.tsx:23-24`), and the class strings are identical:
- `Button` ghost variant (`src/ui/Button.tsx:24`): `'bg-white/5 hover:bg-white/10 rounded-full transition-colors'`
- `Modal` close button (`src/ui/Modal.tsx:24`): `"absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"`

Instead of `Modal` rendering `<Button variant="ghost" iconOnly aria-label="Close" onClick={onClose}><X size={20} /></Button>`, it hand-rolls a raw `<button>` with the same styling. This is a consolidation phase (DS-02) whose entire purpose is to eliminate exactly this kind of duplicate styling; as written, the two copies can silently drift apart on the next visual tweak.
**Fix:**
```tsx
<Button variant="ghost" iconOnly aria-label="Close" onClick={onClose} className="absolute top-4 right-4 !p-2">
    <X size={20} className="text-white/70" />
</Button>
```

### WR-02: `Header` silently drops the `subtitle` prop when `onClose` is supplied

**File:** `src/ui/Header.tsx:25-38`
**Issue:** The row-with-close branch (`if (onClose) { ... }`) never reads `subtitle` at all — it's accepted by the `HeaderProps` interface (line 5) but has no effect in that render path. A future caller that passes both `onClose` and `subtitle` (a legitimate-looking combination given the typed API) will have `subtitle` disappear with no warning, dev error, or documentation of the constraint beyond an inline comment that's easy to miss.
**Fix:** Either render the subtitle in the row-with-close branch too, or guard/`console.warn` when both `onClose` and `subtitle` are passed together so the incompatibility is discoverable at the API surface rather than only in a code comment:
```tsx
if (onClose) {
    if (subtitle && process.env.NODE_ENV !== 'production') {
        console.warn('Header: `subtitle` is ignored when `onClose` is provided.');
    }
    return ( /* ... */ );
}
```

### WR-03: Close buttons in `Modal`/`Header` bypass the a11y contract `Button` itself enforces

**File:** `src/ui/Modal.tsx:22-27`, `src/ui/Header.tsx:30-35`
**Issue:** `Button.tsx:50-52` enforces (with a runtime `console.error`) that icon-only controls must carry an `aria-label`. Yet the two icon-only close buttons that actually ship in this component set — `Modal`'s X and `Header`'s row-with-close X — are raw `<button>` elements with no `aria-label` at all, and don't route through `Button`. The a11y contract this phase just built is immediately violated by the phase's own components.
**Fix:** Add `aria-label="Close"` (or an i18n key) to both raw buttons, or better, route them through `<Button iconOnly aria-label="Close" variant="ghost">` (see WR-01) so the guard actually applies.

### WR-04: `Input` label is not associated with its input (`htmlFor`/`id` missing)

**File:** `src/ui/Input.tsx:26,29-37`
**Issue:** `<label>` has no `htmlFor`, and the `<input>` has no `id`, so clicking/tapping the label text won't focus the field and screen readers won't announce the label when the input receives focus via other means. This was true of the pre-migration inline markup too, but now that it's the single shared `Input` master component, the gap propagates to every form field in the app rather than being a one-off.
**Fix:**
```tsx
const inputId = useId();
...
<label htmlFor={inputId} className="...">{label}</label>
...
<input id={inputId} ... />
```

### WR-05: `vite.config.ts` unconditionally wires an audit-only plugin into the production build path

**File:** `vite.config.ts:9-14`
**Issue:** `rollup-plugin-visualizer` lives in `devDependencies` (`package.json:49`), but `vite.config.ts` includes it unconditionally in the `plugins` array, meaning `npm run build` (`"tsc -b && vite build"`, `package.json:8`) — the actual production build command — always generates and writes `stats.html` into `.planning/phases/01-audit-design-system/audit/`, and the build now hard-depends on this devDependency being present in whatever environment runs `vite build`. This mixes a one-off audit tool into the permanent build pipeline and writes build artifacts into the planning/docs tree on every build.
**Fix:** Gate the plugin behind an env var so normal builds don't pay this cost or depend on the package, e.g.:
```ts
plugins: [
  react(),
  ...(process.env.ANALYZE ? [visualizer({ filename: '...', template: 'treemap' })] : []),
]
```

## Info

### IN-01: `--glass-bg` / `--glass-border` tokens claim consumption that doesn't exist

**File:** `src/index.css:36-38`
**Issue:** The comment states `/* Glassmorphism token source (D-05) — consumed by DS-02 components */`, but a repo-wide search finds zero references to `--glass-bg` or `--glass-border` outside their own declaration. The two components that would plausibly be "the DS-02 components" consuming a glass token — `Modal.tsx:19` (`bg-white/10 backdrop-blur-xl`) and `Card.tsx:24` (`bg-white/95 backdrop-blur-md`) — both use hardcoded literals instead. Either wire the components to the token or update the comment; as-is it's misleading about the current state of the design system.
**Fix:** `background-color: var(--glass-bg); border-color: var(--glass-border);` in `Modal.tsx`/`Card.tsx`'s glass variant, or remove the stale "consumed by" claim from the comment until it's true.

### IN-02: `--color-primary`/`secondary`/`accent`/`muted` theme tokens have no current consumers

**File:** `src/index.css:8-13`
**Issue:** These `@theme` tokens generate Tailwind utilities (`bg-primary`, `text-muted`, etc.), but no `.tsx` file in the reviewed set uses any of them — all colors are still hardcoded literals (`bg-sky-500`, `text-white/50`, `text-slate-800`, etc.) in `Button.tsx`, `Header.tsx`, `Input.tsx`, `Card.tsx`. This may be intentional groundwork for a later migration wave, but as it stands these are unused declarations.
**Fix:** No action required if a later phase plan already covers migrating literals to these tokens; otherwise flag as dead config.

### IN-03: `console.error` a11y guard runs unconditionally on every render

**File:** `src/ui/Button.tsx:50-52`
**Issue:** The `iconOnly && !ariaLabel` check executes in the component body (i.e., on every render, including production builds), logging to the browser console in production rather than only during development. It's a reasonable guard in intent, but as written it ships noise to production consoles.
**Fix:** Gate with `process.env.NODE_ENV !== 'production'`, or move the check to a lint rule / prop-types-style dev-only assertion.

### IN-04: `err: any` / unguarded `err.message` in `AuthModal.handleSubmit`

**File:** `src/components/AuthModal.tsx:76-77`
**Issue:** Pre-existing (confirmed byte-identical to pre-migration), so not introduced by this phase, but noted since it's a real robustness gap: `catch (err: any) { setError(mapAuthError(err.message)); }` will throw a `TypeError` inside the catch block if `err` is a non-`Error` throw without a `.message` (e.g., certain network-layer rejections), leaving `loading` reset via `finally` but no error message shown, and an unhandled exception logged. Out of scope for this migration's pixel-identity requirement, so no fix required here — flagged for awareness only.
**Fix (optional, future phase):** `mapAuthError(err instanceof Error ? err.message : String(err))`.

---

_Reviewed: 2026-07-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
