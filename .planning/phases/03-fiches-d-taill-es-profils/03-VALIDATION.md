---
phase: 3
slug: fiches-d-taill-es-profils
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-30
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Aucun — contrainte projet explicite « pas d'infra de test automatisé » (`REQUIREMENTS.md` § Out of Scope ; CODE-03 futur). Validation manuelle + instrumentée, comme en Phase 2. |
| **Config file** | none |
| **Quick run command** | `npm run build` (typecheck `tsc -b` + build) puis `npm run dev` + vérification visuelle de l'écran touché |
| **Full suite command** | Recette manuelle mobile (checklist QA-01) + comparaison `03-BASELINE.md` avant/après |
| **Estimated runtime** | ~5 min (build) / ~20 min (recette manuelle complète) |

---

## Sampling Rate

- **Après chaque commit de tâche :** `npm run build` (le typecheck `tsc -b` attrape les erreurs de props sur les composants DS) + vérification visuelle de l'écran touché en `npm run dev`
- **Après chaque wave :** recette du flux impacté (fiche spot / profil / premium / stats) + comparaison de captures avant/après
- **Avant `/gsd:verify-work` :** `03-BASELINE.md` renseigné avant/après (métriques A/B/C) + checklist QA-01 à 100% sur mobile réel + `getComputedStyle` prouvant chaque wiring de token
- **Max feedback latency:** ~30s (build) / manuel pour le reste

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-00-01 | 00 | 0 | PERF-02 | — | N/A | baseline | `npm run dev` + chrome-devtools-mcp (métriques A/B/C, voir Protocole ci-dessous) | ✅ | ⬜ pending |
| 03-01-01 | 01 | 1 | UI-02 | — | N/A | build+visual | `npm run build` puis vérif visuelle `AuthModal`/`FiltersModal` non régressés | ✅ | ⬜ pending |
| 03-02-01 | 02 | 2 | UI-02 | V4 (non-régression) | Gardes `!user`/`isAdmin` préservées | build+visual | `npm run build` + recette non-authentifiée | ✅ | ⬜ pending |
| 03-03-01 | 03 | 3 | UI-01 | V4 (non-régression) | Gardes favoris/lightbox/édition préservées | build+visual+device | `npm run build` + recette device (drag-to-dismiss, layoutId, lightbox) | ✅ | ⬜ pending |
| 03-04-01 | 04 | 4 | PERF-02 | — | N/A | network | chrome-devtools-mcp Network, métriques A/B/C rejouées, comparaison `03-BASELINE.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Note : les Task ID exacts seront affinés par le planner selon le découpage réel des plans/waves.*

---

## Wave 0 Requirements

- [ ] `03-BASELINE.md` — créé et renseigné avec des chiffres réels (métriques A, B, B bis, C) **avant** toute modification de source
- [ ] Lecture de `src/lib/offline.ts` / `cacheSpotImages()` — documenter son effet sur la baseline (Open Q6 / A7 du RESEARCH.md)
- [ ] Spot de référence choisi et consigné (≥ 5 photos, plusieurs avis avec avatars)
- [ ] `grep -rn "from '../ui/" src/` rejoué pour reconfirmer les consommateurs de `Modal` avant extension (attendu : `AuthModal`, `FiltersModal`)
- [ ] Captures « avant » archivées des 5 surfaces : fiche (3 onglets, snap 0.35 et 0.95), profil anonyme, profil authentifié, PremiumModal, CommunityStats

*(Aucun fichier de test à créer — contrainte projet « pas de tests ».)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-to-dismiss + snap points + lightbox + `layoutId` liste↔fiche intacts | UI-01 | Gestuelle tactile, non scriptable | Recette device : `Map → clic marker → SpotDetail s'ouvre au snap 0.35 → drag vers 0.95 → onglet Avis → ouverture lightbox → next/prev → fermeture` |
| Support `loading="lazy"` sur WebView iOS réelle (bug Safari 15.4, incertitude support < 16.4) | PERF-02 | Comportement spécifique WebView, non reproductible desktop | Vérification device iOS dans checklist QA-01 (Pitfall 5 du RESEARCH.md) |
| Safe-area de `CommunityStatsScreen` non régressée | UI-02 | Rendu physique sur iPhone à encoche | Ouvrir l'écran sur iPhone à encoche, vérifier que le titre n'est pas sous la status bar |
| Byte-identité visuelle (captures avant/après) | UI-01, UI-02 | Jugement visuel humain sur rendu réel | Comparaison captures avant/après des 5 surfaces (snap 0.35/0.95, 3 onglets, profil anonyme/authentifié, PremiumModal, CommunityStats) |
| Checklist QA-01 complète | UI-01, UI-02, PERF-02 | Recette fonctionnelle bout-en-bout | Checklist QA-01 : carte, fiche spot, favoris, avis, session, profil, auth, premium, stats communauté |

---

## Validation Sign-Off

- [ ] Tous les tasks ont une méthode de vérification (build, visuelle, device, ou réseau)
- [ ] Sampling continuity : `npm run build` après chaque tâche de code
- [ ] Wave 0 couvre la baseline PERF-02 et les captures « avant »
- [ ] Pas de mode watch
- [ ] Feedback latency < 30s pour le build
- [ ] `nyquist_compliant: true` à définir une fois le plan validé

**Approval:** pending
