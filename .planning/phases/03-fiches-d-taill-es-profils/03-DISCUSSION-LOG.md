# Phase 3: Fiches Détaillées & Profils - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-29
**Phase:** 3-fiches-d-taill-es-profils
**Areas discussed:** Conteneur de SpotDetail, Périmètre de l'écran Profil, Lazy loading, PremiumModal

---

## Conteneur de SpotDetail (vaul Drawer vs Modal DS)

| Option | Description | Selected |
|--------|-------------|----------|
| Garder vaul, migrer l'intérieur | Préserve le swipe-to-dismiss natif ; migre Header/badges vers DS | ✓ |
| Remplacer par Modal DS (sheet) | Cohérence totale mais perd le drag-to-dismiss natif | |
| Étendre Modal DS avec drag-to-dismiss | Union des deux, scope technique plus large | |

**User's choice:** Garder vaul, migrer l'intérieur (Recommandé)

| Option | Description | Selected |
|--------|-------------|----------|
| Non, rester natifs | Comme NavBar Phase 2 D-04 — icon-buttons de header | ✓ |
| Oui, migrer vers Button | Nécessiterait un nouveau variant icon-only | |
| À l'appréciation du planner | Pas de préférence forte | |

**User's choice:** Non, rester natifs (Recommandé)

| Option | Description | Selected |
|--------|-------------|----------|
| Reste tel quel | Viewer plein écran spécifique, aucun composant DS équivalent | ✓ |
| Migrer vers Modal DS | Changerait l'UX du viewer | |

**User's choice:** Reste tel quel (Recommandé)

| Option | Description | Selected |
|--------|-------------|----------|
| Garder tel quel | Créer un Tabs étendrait DS-02 hors périmètre ; DS-04 hors v2.0 | ✓ |
| Créer un composant Tabs maître | Étend le DS maintenant, scope creep | |

**User's choice:** Garder tel quel (Recommandé)
**Notes:** Toutes les décisions de cette zone suivent le précédent D-04 de la Phase 2 (composants natifs non-migrés quand aucun variant DS ne correspond).

---

## Périmètre exact de l'écran Profil (UI-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Inclure CommunityStatsScreen | Atteint depuis Profil, cohérent d'harmoniser ensemble | ✓ |
| Profile.tsx uniquement | Comme AdminDashboard en Phase 2, satellites hors scope | |
| Les deux satellites inclus | CommunityStatsScreen ET PremiumModal | |

**User's choice:** Inclure CommunityStatsScreen (Recommandé)

| Option | Description | Selected |
|--------|-------------|----------|
| Une seule passe complète | 450 lignes, taille gérable pour un plan | ✓ |
| Découper en plusieurs plans | Plus de granularité si le fichier est jugé trop dense | |

**User's choice:** Une seule passe complète (Recommandé)

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, c'est un bouton dans Profile.tsx | Le bouton d'entrée fait partie du fichier migré | ✓ |
| Non, exclure toute référence à l'admin | Rester strictement aligné sur l'exclusion AdminDashboard | |

**User's choice:** Oui, c'est un bouton dans Profile.tsx (Recommandé)

---

## Lazy loading (PERF-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Attribut natif loading="lazy" | Support natif WebView, zéro dépendance, zéro risque | ✓ |
| Intersection Observer + placeholder blur | Plus de contrôle, plus de complexité/risque | |

**User's choice:** Attribut natif loading="lazy" (Recommandé)

| Option | Description | Selected |
|--------|-------------|----------|
| Image visible + voisines immédiates | Équilibre perf/UX pour le carrousel | ✓ |
| Uniquement l'image visible | Perf max, léger délai possible au clic next/prev | |
| À l'appréciation du planner | Détail d'implémentation | |

**User's choice:** Image visible + voisines immédiates (Recommandé)

| Option | Description | Selected |
|--------|-------------|----------|
| Mesure avant/après chiffrée | Cohérent avec la méthodologie Phase 2 | ✓ |
| Vérification visuelle simple | Plus rapide, moins rigoureux | |

**User's choice:** Mesure avant/après chiffrée (Recommandé)

---

## PremiumModal — migrer ou pas cette phase ?

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, migrer maintenant | Petit fichier, pattern glass-center déjà supporté, coût marginal faible | ✓ |
| Non, laisser pour Phase 4 ou 5 | Rester strictement au périmètre nommé dans le roadmap | |

**User's choice:** Oui, migrer maintenant (Recommandé)

---

## Claude's Discretion

- Wiring exact des couleurs/tokens dans `SpotDetail.tsx` et `Profile.tsx` (quelles classes Tailwind correspondent 1:1 à quels tokens).
- Structure interne de la migration Header/badges dans `SpotDetail` (D-01), tant que la coque `vaul` reste intacte.
- Méthode exacte d'outillage pour la mesure avant/après du lazy loading (D-06).

## Deferred Ideas

- Composant Tabs maître pour Info/Avis/Sessions — candidat DS-04 (hors v2.0).
- Extension de `Modal` DS avec drag-to-dismiss — écartée, pas nécessaire tant que `vaul` fonctionne.
- Migration Button pour les icônes de header — resterait pertinente si un variant icon-only est ajouté à `Button` plus tard.
- Bug pays incomplet (`country-list-incomplete-other-emoji.md`) — vit dans un fichier inclus au périmètre (CommunityStatsScreen) mais reste un bug de données, pas une tâche DS ; pas folded dans cette phase.
