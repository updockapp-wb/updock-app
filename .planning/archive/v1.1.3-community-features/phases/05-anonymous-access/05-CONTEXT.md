# Phase 5: Anonymous Access - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Permettre à un utilisateur sans compte de naviguer dans l'app : voir la carte, ouvrir les fiches spots (info, avis, sessions en lecture), et utiliser la navigation GPS. Toutes les actions communautaires (favoris, avis, sessions, ajout de spot, profil) déclenchent une invitation à se connecter via AuthModal.

Hors scope : nouvelles fonctionnalités, onboarding multi-étapes, partage de spots.

</domain>

<decisions>
## Implementation Decisions

### Écran de démarrage
- L'app lance directement sur la carte (onglet Map) pour les utilisateurs non connectés — aucun mur d'auth
- La `LandingPage` existante est supprimée — elle n'a plus de raison d'être
- Le `WelcomeScreen` (post-confirmation email) est conservé tel quel, inchangé

### Gating des actions auth-required
- Quand un anonyme clique sur une action protégée : l'`AuthModal` existante s'ouvre directement
- Actions protégées : mettre en favori, laisser un avis, rejoindre/créer une session, ajouter un spot
- Les boutons d'actions restent **visibles avec une icône cadenas** (🔒) — vitrine de ce qui est possible avec un compte
- L'onglet **Favoris dans la NavBar est visible** pour les anonymes, mais le clic déclenche l'AuthModal

### Onglet Profil anonyme
- L'onglet Profil affiche un **écran de connexion dédié** (pas de redirection) : illustration + titre "Rejoins la communauté Updock" + boutons "Se connecter" et "S'inscrire"
- Après connexion depuis cet écran, l'utilisateur **reste sur l'onglet Profil** (qui se transforme en profil réel)

### SpotDetail pour anonyme
- Tous les onglets de SpotDetail sont visibles : Info, Avis, Sessions — en lecture seule
- Les boutons d'action dans SpotDetail (laisser un avis, rejoindre une session, mettre en favori) sont visibles avec cadenas et déclenchent AuthModal au clic
- La navigation GPS ("Naviguer vers ce spot") est **toujours accessible** sans compte — fonctionnalité core
- Le bouton "Ajouter un spot" reste visible dans la NavBar/Map mais déclenche AuthModal pour les anonymes

### Claude's Discretion
- Choix du composant/icône cadenas exact (lucide-react a `Lock` icon)
- Wording exact des messages dans l'écran Profil anonyme
- Placement précis du cadenas sur les boutons (overlay, suffix, etc.)
- Gestion du contexte après connexion (ex: ouvrir le favori cliqué automatiquement)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentification
- `src/context/AuthContext.tsx` — `user`, `session`, `loading`, `signOut` — point central de détection de l'état anonyme
- `src/components/AuthModal.tsx` — composant existant à réutiliser pour tous les triggers d'auth

### Fichiers à modifier
- `src/App.tsx` — Mur d'auth actuel (`!user → LandingPage`) à supprimer ; logique de routing anonyme à implémenter
- `src/components/NavBar.tsx` — Adapter pour l'état anonyme (onglet Favoris, bouton ajouter spot)
- `src/components/SpotDetail.tsx` — Ajouter cadenas sur actions protégées, tous onglets visibles en lecture
- `src/components/Profile.tsx` — Ajouter écran de connexion dédié quand `!user`

### Fichiers à supprimer
- `src/components/LandingPage.tsx` — Suppression complète

### Contexts impactés
- `src/context/FavoritesContext.tsx` — Actuellement implicitement auth-gated ; vérifier comportement pour anonyme
- `src/context/SessionsContext.tsx` — Vérifier que les fetches de données (lecture) fonctionnent sans user
- `src/context/SpotsContext.tsx` — Déjà public (spots disponibles sans auth côté Supabase)

### Internationalisation
- `src/translations/fr.json` + `src/translations/en.json` — Ajouter clés pour l'écran Profil anonyme

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AuthModal.tsx` : composant d'auth complet à réutiliser tel quel pour tous les triggers
- `lucide-react` `Lock` icon : disponible sans installation pour les indicateurs cadenas
- `WelcomeScreen.tsx` : conservé sans modification

### Established Patterns
- **Mur d'auth actuel** (`App.tsx:93`) : `{!user ? <LandingPage/> : <AppContent/>}` — à transformer en rendu conditionnel partiel
- **AuthModal** est déjà géré via `isAuthModalOpen` state dans AppContent — pattern à propager aux composants enfants via callback ou context
- **Onglets SpotDetail** : `activeTab` union `'info' | 'reviews' | 'sessions'` dans SpotDetail — pas de changement structurel, juste ajout du cadenas sur les CTAs
- **Framer Motion** : animations déjà en place dans App.tsx pour les transitions d'onglets

### Integration Points
- `App.tsx` : supprimer le `!user → LandingPage` block, rendre `AppContent` accessible à tous, propager `onOpenAuth` callback aux composants qui en ont besoin
- `NavBar.tsx` : recevoir `user` ou `onOpenAuth` pour intercepter le clic Favoris et le clic "+" en mode anonyme
- `Profile.tsx` : brancher sur `user` de `useAuth()` pour switcher entre profil réel et écran de connexion dédié
- `SpotDetail.tsx` : brancher sur `user` pour conditionner l'affichage du cadenas sur les CTAs d'action

</code_context>

<specifics>
## Specific Ideas

- Principe directeur : "Les spots, avant tout" — l'anonyme accède immédiatement à la valeur core de l'app
- Le cadenas est une vitrine, pas une punition — l'utilisateur voit ce qu'il peut débloquer
- Après connexion depuis l'onglet Profil, l'utilisateur reste sur Profil (pas de redirection vers Map)

</specifics>

<deferred>
## Deferred Ideas

None — la discussion est restée dans le scope de la phase.

</deferred>

---

*Phase: 05-anonymous-access*
*Context gathered: 2026-03-22*
