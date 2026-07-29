# Phase 2: Navigation & Vue Carte / Spots - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-29
**Phase:** 2-navigation-vue-carte-spots
**Areas discussed:** Couleurs markers Mapbox, Migration modaux vue Carte, Portée MAP-02 (cache/médias)

---

## Couleurs des markers Mapbox

| Option | Description | Selected |
|--------|-------------|----------|
| Constante centralisée locale | Un objet JS unique consommé par les layers Mapbox ; pas de tokens CSS (Mapbox GL ne les lit pas nativement) ; la plupart des 12 couleurs distinctes n'ont pas d'équivalent parmi les 6 tokens sémantiques existants | ✓ |
| Étendre les tokens CSS existants | Nouveaux tokens sémantiques par type de spot, lus via getComputedStyle() | |

**User's choice:** Constante centralisée locale (recommandé)
**Notes:** Décision alignée avec la discipline établie en Phase 1 : ne câbler que les correspondances 1:1 réelles avec les tokens existants ; étendre le token set pour ces couleurs aurait été un scope creep DS-01.

---

## FiltersModal — migration vers src/ui/Modal

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, migrer maintenant | FiltersModal fait partie de la vue Carte (NAV-01/MAP-01) ; AddSpotForm/AddSpotInfoModal restent reportés (Phase 4) | ✓ |
| Non, reporter tous les modaux carte | Phase 2 se concentre uniquement sur nav + perf carte | |

**User's choice:** Oui, migrer maintenant (recommandé)
**Notes:** FiltersModal duplique exactement le pattern modal extrait en Phase 1 (backdrop + AnimatePresence) — cohérent de l'inclure dans le périmètre de cette phase.

---

## Portée exacte de MAP-02 (cache/médias)

| Option | Description | Selected |
|--------|-------------|----------|
| Preview marker à l'ajout de spot | Marqueur temporaire animé pendant l'ajout | |
| Cache offline des spots/images | cacheSpotImages() dans offline.ts | |
| Autre chose | À préciser par l'utilisateur | (réponse initiale : "je ne sais pas") |

**User's choice (après investigation Claude):** Fix ciblé du bug useEffect dans AddSpotForm.tsx (lignes 62-66) — révocation prématurée des URLs d'aperçu photo à chaque ajout d'image.
**Notes:** L'utilisateur ne savait pas initialement à quoi correspondait la formulation du roadmap. Claude a recherché dans le code et identifié un bug précis correspondant exactement à la formulation "fuite mémoire sur les aperçus" (cf. CONCERNS.md "Image Upload Memory Leak in AddSpotForm"). Proposition présentée avec preuve de code, acceptée par l'utilisateur. Portée explicitement limitée au fix du bug — aucune modification visuelle du formulaire (qui reste Phase 4).

---

## Claude's Discretion

- Stratégie technique exacte de mémoïsation pour MAP-01 (séparer génération de features du filtrage vs régénération complète du GeoJSON) — CONCERNS.md documente déjà une piste, laissée au planner/exécuteur.
- Nommage et emplacement de la constante de couleurs markers (D-01).
- Structure interne du fix du useEffect de cleanup dans AddSpotForm.tsx (D-03).
- Refactor éventuel de la duplication NavBar mobile/desktop (signalé dans CONCERNS.md comme zone fragile) — pas explicitement demandé par l'utilisateur.

## Deferred Ideas

- Extension des tokens CSS aux couleurs de type de spot — écartée pour cette phase, candidate DS-04 (hors v2.0) si un besoin futur émerge.
- Migration de AddSpotForm, AddSpotInfoModal, AdminDashboard, SpotDetail vers src/ui/Modal — reportée à leurs phases respectives (3 et 4).
- Refactor de la duplication NavBar mobile/desktop — laissé à l'appréciation du planner plutôt qu'imposé.
- Optimisation de cacheSpotImages() (offline.ts, bloque le thread principal) — envisagée comme candidate MAP-02 puis écartée au profit du bug AddSpotForm (correspondance plus précise). Candidate possible pour Phase 5 (nettoyage final).
