# Phase 3: Sessions - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Permettre aux utilisateurs connectés d'annoncer leur présence sur un spot à une date/heure précise, et aux autres de rejoindre ces sessions. Inclut la création, la visualisation dans SpotDetail, le join/leave, l'annulation, et une section "Sessions à venir" sur le profil.

Les notifications push (Phase 4) sont hors scope — les sessions fonctionnent en pull-only pour cette phase.

</domain>

<decisions>
## Implementation Decisions

### Compteur de participants à la création
- Le créateur est automatiquement inséré dans `session_attendees` à la création de la session
- La session affiche "1 participant" immédiatement après création (le créateur est compté)
- Cette approche rend le compteur cohérent et évite le paradoxe "0 participants" pour une session organisée

### Contrôles du créateur
- Le créateur voit uniquement le bouton "Annuler la session" — pas de bouton "Se désinscrire"
- S'il annule, la session disparaît pour tout le monde (`is_cancelled = true`)
- Pas de mécanisme "quitter puis transférer" — le créateur est responsable jusqu'à l'annulation

### Sessions sur le profil — interaction
- La section "Sessions à venir" dans le profil est limitée aux **3 prochaines sessions** (tri par `starts_at` ascendant, `LIMIT 3`)
- Appuyer sur une session navigue vers le **SpotDetail du spot concerné** (comportement naturel pour une app carte)
- La section n'est pas rendue si l'utilisateur n'a aucune session à venir

### Fenêtre temporelle "upcoming"
- Filtre : `starts_at >= (now - 1 heure)` — les sessions qui ont commencé il y a moins d'1h restent visibles
- Cette grâce de 1h s'applique **partout** : SpotDetail Sessions tab + section profil
- SQL : `.gte('starts_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())`
- Raison : permet de rejoindre une session à la dernière minute, même après l'heure officielle de début

### Claude's Discretion
- Format d'affichage du temps : `toLocaleDateString()` + `toLocaleTimeString()` comme défini dans UI-SPEC (absolu)
- Gestion du badge amber pour sessions dans les 24h (UI-SPEC)
- Implémentation du layout compact pour les items de profil (UI-SPEC)
- Gestion des erreurs inline (patterns définis dans UI-SPEC et mirrors ReviewForm)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schéma de base de données
- `supabase/migrations/001_community_schema.sql` — Tables `sessions` et `session_attendees` avec RLS policies ; définit les contraintes et foreign keys

### Specs et recherche phase 3
- `.planning/phases/03-sessions/03-RESEARCH.md` — Architecture recommandée, patterns Supabase, pièges datetime, anti-patterns N+1, exemples de code complets
- `.planning/phases/03-sessions/03-UI-SPEC.md` — Contrat visuel et d'interaction approuvé : SessionCard, SessionForm, SessionList, Sessions tab, compact profile list, animations, copywriting FR/EN

### Requirements
- `.planning/REQUIREMENTS.md` §Sessions programmées — SESS-01 à SESS-04 : critères d'acceptation précis

### Patterns miroir (à reproduire fidèlement)
- `src/components/ReviewForm.tsx` — Miroir pour SessionForm (structure, labels, error display, submit button)
- `src/components/ReviewList.tsx` — Miroir pour SessionList/SessionCard (animations Framer Motion, avatar resolution, loading/empty states)
- `src/context/ProfileContext.tsx` — Miroir pour SessionsContext (provider pattern, exported type interface)
- `src/components/SpotDetail.tsx` — Point d'intégration : ajouter onglet 'sessions' au activeTab union et tab button
- `src/components/Profile.tsx` — Point d'intégration : ajouter section Sessions à venir sous la stats grid

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ReviewForm.tsx` / `ReviewList.tsx` : structure identique à reproduire pour SessionForm/SessionCard/SessionList
- `framer-motion` (`^12.23.25`) : déjà utilisé dans ReviewList pour les animations d'entrée — même pattern pour SessionList
- `lucide-react` (`^0.556.0`) : Calendar, Users, Clock icons disponibles sans installation
- `ProfileContext.tsx` : pattern provider/consumer à reproduire pour SessionsContext

### Established Patterns
- **Mise à jour optimiste** : ReviewList met à jour la note moyenne client-side sans refetch → même approche pour le compteur de participants join/leave
- **Isolation read-only** : ReviewList est read-only, contrôles d'édition dans ReviewForm → SessionList read-only, actions dans SessionCard
- **Chargement des profils** : ReviewList collecte les creator_ids et fait une seule requête `.in()` → même approche pour les profils des créateurs de sessions
- **Reset on spot change** : SpotDetail reset reviews state synchronously quand `spot.id` change avant le fetch async → même mécanisme pour sessions

### Integration Points
- `SpotDetail.tsx` : étendre `useState<'info' | 'reviews'>` en `'info' | 'reviews' | 'sessions'`; ajouter troisième tab button avec Calendar icon
- `Profile.tsx` : ajouter section `<UpcomingSessions />` sous la stats grid (pas de nouveau tab — Profile n'a pas de navigation par onglets)
- `src/translations/fr.json` + `en.json` : ajouter toutes les clés `session.*` définies dans UI-SPEC §Copywriting Contract
- Provider placement : SessionsProvider à placer inside ProfileProvider (qui est lui-même inside FavoritesProvider) pour accès cohérent aux contextes

</code_context>

<specifics>
## Specific Ideas

- "1 participant" affiché dès la création — la session paraît vivante, pas vide
- Tap sur une session dans le profil = navigation vers le spot (comportement attendu pour une app carte-first)
- Grâce de 1h : un rider peut encore rejoindre une session qui a commencé à l'heure prévue

</specifics>

<deferred>
## Deferred Ideas

None — la discussion est restée dans le scope de la phase.

</deferred>

---

*Phase: 03-sessions*
*Context gathered: 2026-03-21*
