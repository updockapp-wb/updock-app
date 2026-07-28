# Phase 9: Community Stats — Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Ajouter une entrée "Statistiques communauté" dans l'onglet Profil qui ouvre une page dédiée affichant les KPIs globaux de la plateforme. Afficher également un aperçu minimal (total spots + total users) sur l'écran anonyme.

Hors scope : stats personnelles avancées, classements, gamification, reviews ou sessions dans les KPIs (phase future).

</domain>

<decisions>
## Implementation Decisions

### Placement dans l'onglet Profil — utilisateurs connectés
- Ligne de navigation **"Statistiques communauté"** insérée **entre le Stats Grid personnel et la section Réglages** (label "Réglages" / `t('profile.settings')`)
- Style identique aux autres lignes de settings : carte blanche, `rounded-3xl`, `border border-slate-100`, icône + label + `ChevronRight`
- Icône suggérée : `Globe` ou `BarChart2` de lucide-react (Claude's Discretion)
- Tapper la ligne ouvre une nouvelle page/vue dédiée

### Page dédiée — CommunityStatsScreen
- Même style visuel que le reste de l'app : fond `slate-50`, cartes blanches `rounded-2xl`, `border border-slate-100 shadow-sm`
- KPIs à afficher :
  1. **Total spots publiés** — COUNT sur table `spots` (spots validés uniquement)
  2. **Total utilisateurs inscrits** — COUNT sur table `profiles`
  3. **Spots par pays** — GROUP BY `country` sur table `spots`, triés par nombre décroissant, **tous les pays** ayant au moins un spot
- Format "Spots par pays" : liste `[Drapeau emoji ou nom pays] · N spots` triée par count décroissant
- Pas de reviews ni sessions dans cette page pour l'instant

### Écran anonyme — aperçu minimal
- Sur l'écran "Se connecter" existant (`Profile.tsx` branche `!user`), afficher **en dessous du bouton "Créer un compte"** (et au-dessus du bloc langue) deux métriques :
  - Total spots publiés
  - Total utilisateurs inscrits
- Style sobre — pas de cartes, juste deux chiffres avec label, type `text-slate-400` (ne pas voler l'attention des CTA)
- **Pas** de répartition par pays pour les anonymes

### Fetch des données
- Requêtes Supabase directes depuis le composant (pattern existant dans `Profile.tsx` — `useEffect` + `supabase.from(...).select(...count...)`)
- Pas de contexte dédié — les stats communautaires sont des données read-only sans besoin de partage global
- Pour "spots par pays" : `supabase.from('spots').select('country').eq('validated', true)` puis agrégation côté client, ou requête SQL avec `.select('country, count')` (Claude's Discretion selon ce que Supabase permet)

### Claude's Discretion
- Icône pour la ligne "Statistiques communauté"
- Gestion du loading state (skeleton ou spinner) sur la page dédiée
- Wording exact du titre de la page (ex: "Statistiques" vs "La communauté")
- Format exact des chiffres (ex: séparateur milliers : 1 234 vs 1234)
- Nom du champ `country` dans la table `spots` (à vérifier dans le schéma)

</decisions>

<specifics>
## Specific Ideas

- Ligne dans Profil : `[Globe icon] Statistiques communauté [ChevronRight]` — sobre, cohérent avec Langue/Notifs
- Page dédiée : titre en haut + grille 2×1 pour Total Spots / Total Users, puis liste scrollable pour pays
- Écran anonyme : sous "Créer un compte", deux lignes discrètes type `"142 spots • 89 riders"` (ou format séparé)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Composants à modifier
- `src/components/Profile.tsx` — Ajouter ligne "Statistiques communauté" dans la section connectée + aperçu minimal dans la section anonyme (`!user`)

### Nouveau composant à créer
- `src/components/CommunityStats.tsx` (ou `CommunityStatsScreen.tsx`) — Page dédiée avec les KPIs globaux

### Patterns à réutiliser
- `src/components/Profile.tsx` — Pattern fetch Supabase existant (`useEffect` + `.select('id', { count: 'exact', head: true })`) — réutiliser exactement
- `src/components/Profile.tsx` (lignes settings) — Structure visuelle des lignes de navigation à reproduire
- `src/context/AuthContext.tsx` — `user` pour distinguer connecté vs anonyme

### Internationalisation
- `src/translations/fr.json` + `src/translations/en.json` — Ajouter clés pour "Statistiques communauté", labels KPIs, titre page dédiée

### Schéma à vérifier
- Nom exact du champ pays dans la table `spots` (probablement `country` — à confirmer dans les migrations ou `src/data/spots.ts`)

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<deferred>
## Idées déférées (hors scope phase 9)

- Reviews et sessions dans les KPIs communautaires — potentiellement phase 10+
- Répartition par difficulté/type de départ — mentionné dans le todo original, reporté
- "Spot le plus populaire" — requiert de définir la métrique popularité, phase future
- Stats personnelles avancées (classement, badges) — hors vision actuelle

</deferred>
