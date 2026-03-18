# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Trouver et découvrir des spots de pumpfoil partout dans le monde — simplicité et beauté avant tout.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 0 of 3 in current phase
Status: Ready to plan
Last activity: 2026-03-18 — Roadmap created, community features milestone initialized

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pre-roadmap: Profiles before reviews/sessions — profiles are a foreign key dependency for both
- Pre-roadmap: Capacitor CLI/core mismatch (v7 CLI vs v8 core) must be fixed before any native work
- Pre-roadmap: Sessions before push notifications — push is isolatable; sessions ship as pull-only if push blocks
- Pre-roadmap: Use @capacitor-firebase/messaging (not @capacitor/push-notifications) — unified FCM token on iOS

### Pending Todos

None yet.

### Blockers/Concerns

- **TECH-01 (Phase 1):** Capacitor CLI v7.4.4 vs core v8.0.0 mismatch confirmed. Must be resolved before any native plugin work. Run `npx cap doctor` first.
- **NOTIF (Phase 4):** Push notifications require physical iOS device (APNs does not work in Simulator). Confirm device availability before committing Phase 4 scope. This is a go/no-go gate.
- **NOTIF (Phase 4):** Firebase project setup (Xcode entitlements, google-services.json, APNs .p8 key upload) needs research during Phase 4 planning — flag for `/gsd:research-phase`.
- **SESS (Phase 3):** No native date/time picker in codebase. Evaluate options during Phase 3 planning (HTML `<input type="datetime-local">` vs Capacitor date picker plugin).

## Session Continuity

Last session: 2026-03-18
Stopped at: Roadmap created — ready to plan Phase 1
Resume file: None
