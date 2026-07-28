# Phase 01 — Environment Preflight

**Date:** 2026-07-28
**Purpose:** Record the pristine-state environment and the Lighthouse run-or-fallback
decision before any token/component change (DS-02/DS-03 prerequisites, plan 01-01).

---

## Environment Availability

| Tool | Version |
|------|---------|
| Node | v26.0.0 |
| npm | 11.12.1 |
| Vite | 7.2.7 (darwin-arm64) |
| Capacitor CLI | 8.2.0 |
| Capacitor Core | 8.0.0 |

## Chrome / Chromium Availability

Probed with `command -v google-chrome chromium chromium-browser chrome` and the macOS
default path `/Applications/Google Chrome.app`.

- **Result: ABSENT** — no Chrome/Chromium binary on `PATH`, and `/Applications/Google Chrome.app`
  not present.

## Lighthouse Decision

**Lighthouse: DEFERRED / manual (documented fallback).**

Because Chrome is absent, the automated Lighthouse mobile run cannot execute in this
environment. Per RESEARCH §Open Question Q2 and decision D-08 (perf is *directional*, not
a hard gate), the documented fallback is used instead:

- **Vite compressed-size report** — captured in plan 01-02 (`audit/build-size.txt`, firm
  gzip baseline).
- **React Profiler notes** — for Map/nav screens, recorded qualitatively in `01-AUDIT.md`.

Lighthouse is marked manual/deferred; its absence downgrades but does **not** block the
phase. If a Chrome environment becomes available later, the Lighthouse mobile run against
`http://localhost:4173` (preview, not dev) can be added to `audit/lighthouse.*`.

## Test Framework

No test-runner dependency was installed (locked project constraint — REQUIREMENTS Out of
Scope). Validation is build/lint gates + audit-artifact existence + manual visual parity.

## Screenshot Oracle (Task 2 — human-action)

Target folder `audit/screenshots/before/` is scaffolded and awaits three pristine-state
AuthModal screenshots (`login.png`, `signup.png`, `error.png`) — the pixel-parity oracle
for the D-09 migration (plan 01-06). These MUST be captured on unmodified source, before
Wave 2 token changes.
