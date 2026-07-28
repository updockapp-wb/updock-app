# Phase 7: Spot Ownership - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Afficher l'identité du créateur d'un spot dans SpotDetail, et permettre au créateur (ou à l'admin) de modifier les informations du spot — nom, type, description, difficulté, et photos — directement depuis SpotDetail.

Hors scope : suppression de spots, transfert de propriété, modération communautaire, modifications en masse.

</domain>

<decisions>
## Implementation Decisions

### Affichage de l'uploader
- Ligne discrète **sous le titre du spot** dans SpotDetail — `Ajouté par [Avatar] [Nom]`
- Visible dès l'ouverture du SpotDetail (pas dans un onglet spécifique)
- Réutiliser le pattern existant des reviews : `user_id → profiles` (fetch avatar + display_name)
- Si le créateur n'a pas de profil ou `user_id` null : ne rien afficher (spot importé ou pré-profils)

### Bouton Modifier — placement et visibilité
- Bouton **inline à côté de l'uploader** : `Ajouté par Wandrille · [Modifier]`
- Visible **uniquement** pour : le créateur du spot (`user.id === spot.user_id`) ou l'admin (`user.email === 'updock.app@gmail.com'`)
- Pour un utilisateur anonyme ou un autre utilisateur connecté : seule la ligne "Ajouté par" est visible, sans bouton

### Overlay d'édition — champs
- Réutiliser la structure de l'overlay existant dans `AdminDashboard.tsx` (nom, type, description, difficulté)
- **Ajouter la gestion des photos** : upload de nouvelles photos depuis l'appareil + suppression de photos existantes
- Upload photos via Supabase Storage (pattern déjà utilisé pour les avatars dans Profile.tsx)
- L'overlay s'ouvre depuis SpotDetail (pas depuis AdminDashboard)

### Détection admin
- Réutiliser le pattern existant : `user?.email === 'updock.app@gmail.com'` (défini dans `Profile.tsx:125`)
- Pas de nouvelle table ni de colonne — conserver la logique centrée email

### Type Spot — champ user_id
- Ajouter `user_id?: string` au type `Spot` dans `src/data/spots.ts`
- Le champ est optionnel (les spots existants sans créateur identifiable ont `user_id: null`)

### Claude's Discretion
- Wording exact du lien "Modifier" (texte vs icône crayon)
- Gestion du loading state pendant le fetch du profil uploader
- Comportement après sauvegarde (fermeture overlay + refresh données spot)
- Validation des champs dans l'overlay de modification

</decisions>

<specifics>
## Specific Ideas

- Ligne uploader : `Ajouté par [Avatar 20px] Wandrille · Modifier` — compact, sobre, contextuel
- Le pattern reviews (`user_id → profiles`) est bien établi dans SpotDetail — réutiliser exactement la même logique de fetch

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Composants à modifier
- `src/components/SpotDetail.tsx` — Composant principal : ajouter ligne uploader + bouton Modifier + overlay d'édition
- `src/components/AdminDashboard.tsx` — Source de l'overlay d'édition existant à extraire/réutiliser
- `src/data/spots.ts` — Type `Spot` : ajouter `user_id?: string`

### Patterns à réutiliser
- `src/components/Profile.tsx` (ligne 125) — Détection admin via `user?.email === 'updock.app@gmail.com'`
- `src/context/AuthContext.tsx` — `user` pour vérifier créateur vs admin vs anonyme
- `src/context/SpotsContext.tsx` — `updateSpot()` déjà utilisé dans AdminDashboard — vérifier signature

### Internationalisation
- `src/translations/fr.json` + `src/translations/en.json` — Ajouter clés pour "Ajouté par", "Modifier", messages overlay

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AdminDashboard.tsx` — Overlay d'édition complet (état `editingSpot`, champs nom/type/description/difficulté) — à extraire en composant partagé ou copier dans SpotDetail
- `SpotDetail.tsx` — Fetch profils depuis `user_id` déjà en place (lignes 85-90, pattern reviews) — réutiliser pour uploader
- `Profile.tsx` — Upload avatar via Supabase Storage — pattern à adapter pour photos de spots

### Established Patterns
- Fetch profil uploader : `supabase.from('profiles').select('display_name, avatar_url').in('id', [spot.user_id])`
- Admin check : `user?.email === 'updock.app@gmail.com'` — simple, cohérent avec l'existant
- Overlay inline avec state local : `const [editingSpot, setEditingSpot] = useState<Spot | null>(null)`

### Integration Points
- `SpotsContext.updateSpot()` — Point d'entrée pour sauvegarder les modifications (déjà wired dans AdminDashboard)
- Supabase Storage bucket `spot-images` (ou `avatars` selon config existante) — pour upload photos

</code_context>

<deferred>
## Deferred Ideas

- Suppression de spot par le créateur — hors scope, à évaluer en backlog
- Bugs AdminDashboard + lightbox fermeture — Phase 8
- Stats globales communauté — Phase 9

</deferred>

---

*Phase: 07-spot-ownership*
*Context gathered: 2026-04-05*
