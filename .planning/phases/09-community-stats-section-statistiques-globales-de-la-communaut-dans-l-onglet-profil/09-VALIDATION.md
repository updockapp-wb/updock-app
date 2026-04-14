---
phase: 9
slug: community-stats-section-statistiques-globales-de-la-communaut-dans-l-onglet-profil
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — all validation is manual/visual |
| **Config file** | none — no test framework in project |
| **Quick run command** | N/A |
| **Full suite command** | N/A |
| **Estimated runtime** | N/A |

---

## Sampling Rate

- **After every task commit:** Visual inspection in simulator/browser
- **After every plan wave:** Full visual check of modified screens
- **Before `/gsd:verify-work`:** All manual verifications must be confirmed
- **Max feedback latency:** immediate (visual)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| STATS-01 | 01 | 1 | Nav row placement | manual | Visual inspection — row between stats grid and settings | N/A | ⬜ pending |
| STATS-02 | 01 | 2 | CommunityStatsScreen 3 KPIs | manual | Visual inspection — total spots, total users, spots by country | N/A | ⬜ pending |
| STATS-03 | 01 | 2 | Anonymous screen 2 metrics | manual | Visual inspection — metrics visible under "Créer un compte" | N/A | ⬜ pending |
| STATS-04 | 01 | 2 | Spots count matches DB | manual | Compare displayed count with Supabase approved spots | N/A | ⬜ pending |
| STATS-05 | 01 | 2 | Country breakdown correctness | manual | Verify country list sums to total spots count | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test framework exists in this project — all prior phases used manual/visual validation only.

*Existing infrastructure covers all phase requirements (visual verification only).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nav row visible between stats grid and settings | STATS-01 | No test framework | Open Profile tab as logged-in user, verify "Statistiques communauté" row appears between personal stats and settings section |
| CommunityStatsScreen shows 3 KPIs | STATS-02 | UI component | Tap nav row, verify total spots + total users + spots by country list all appear |
| Anonymous screen shows 2 metrics | STATS-03 | UI component | Log out, open Profile tab, verify 2 metrics appear under "Créer un compte" button |
| Spots count accuracy | STATS-04 | Requires DB | Cross-check displayed count with Supabase dashboard count of is_approved=true spots |
| Country breakdown sums to total | STATS-05 | Data logic | Sum all country counts in list, verify equals total spots count |

---

## Validation Sign-Off

- [ ] All tasks have visual verification instructions
- [ ] Sampling continuity: each task has manual verification steps
- [ ] Wave 0 not applicable (no test framework in project)
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter when all items checked

**Approval:** pending
