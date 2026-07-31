# Phase 4 : Formulaires & Interactions — Recherche

**Recherché :** 2026-07-30
**Domaine :** Migration de formulaires React vers un design system existant + fiabilisation validation/erreurs (React 19, Tailwind v4, Capacitor)
**Confiance :** HIGH (tout le périmètre est du code interne déjà lu et vérifié ; aucune dépendance externe nouvelle)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-03 :** Le champ type de spot reste à sélection multiple avec **au moins 1 type obligatoire** (comportement existant conservé). Ajouter un message d'erreur explicite si 0 type sélectionné (edge case actuellement géré silencieusement).
- **D-04 :** Les photos restent **optionnelles** à la soumission (zéro régression). Si soumission sans photo → confirmation **douce, non bloquante** ("Vous n'avez pas mis de photo, êtes-vous sûr de vouloir publier ?"), ton engageant/encourageant (pas culpabilisant), explique la valeur d'une photo et rappelle qu'on peut en ajouter plus tard via l'édition.
- **D-05 :** **Pas** de validation de type de fichier (`image/*`) ni de taille max sur les photos — **hors scope** de cette phase.
- **D-07 :** **Pas** de bouton "Réessayer" explicite. En cas d'échec, le formulaire **garde ses données saisies** et l'utilisateur relance via le bouton de soumission normal.
- **D-08 :** Toggle favori (optimistic update) : en cas d'échec → revert de l'état visuel (existant) **+ toast discret** ("Échec, réessaie" ou équivalent).
- **D-09 :** L'édition inline dans `AdminDashboard.tsx` (réservée admin) **fait partie** du périmètre de migration UI-03.
- **D-10 :** Tous les boutons favori (coeur) migrent vers `Button` (variante `iconOnly`) : liste favoris `App.tsx` (~L174-182) + `SpotDetail.tsx` (~L300-320).
- **D-11 :** L'icône coeur dans `NavBar.tsx` (onglet navigation "Favoris") est **HORS périmètre** (élément de nav traité en Phase 2 / NAV-01).

### Claude's Discretion
- **D-01 :** Décider en planification si `Input` maître doit être étendu (textarea, sélection type/difficulté, fond clair) ou si les champs non-texte restent natifs stylés aux tokens. Précédent Phase 2/3 : **étendre** les composants existants plutôt qu'en créer — privilégier cette cohérence sauf risque de régression visuelle identifié.
- **D-02 :** Limites exactes de longueur nom/description (options : nom 100 / desc 2000 [reco CONCERNS.md], ou nom 50 / desc 500). Choisir des limites raisonnables au planning.
- **D-06 :** Pattern de remplacement des `alert()` natifs dans le périmètre formulaires/favoris : message inline (pattern `AuthModal` `{error && <div>{error}</div>}`) ou toast. **Contrainte à réconcilier :** D-08 requiert déjà un toast pour les favoris — si un toast est introduit, envisager de le réutiliser pour la cohérence.

### Deferred Ideas (OUT OF SCOPE)
- Aucune — la discussion est restée dans le périmètre de la phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Support recherche |
|----|-------------|-------------------|
| **UI-03** | Les formulaires d'ajout/édition de spot et le système de favoris utilisent les composants du design system (Input, Button, Modal) | `Button` couvre déjà 100% des besoins (submit `loading`, favori `iconOnly`). `Input` doit être étendu (surface claire + textarea) — voir Standard Stack & D-01. `Modal` a déjà les variantes `light+sheet`/`light+center` mais largeur `max-w-sm` ≠ formulaire `max-w-lg` (risque de régression, voir Pitfall 1). |
| **ROBUST-01** | Les formulaires valident les données saisies et affichent des messages d'erreur clairs et cohérents | Validation actuelle quasi nulle (`if (!position) return`). Recommandation : validation légère hand-rolled (pas de lib), affichage inline via pattern `AuthModal`. Voir Architecture Patterns. |
| **ROBUST-02** | Les appels API en échec sont gérés avec un feedback cohérent (loading / erreur / retry) sans crash ni état bloqué | `alert()` à remplacer dans `SpotsContext` (`approveSpot`, `deleteSpot`, `updateSpot`). `@capacitor/toast` **déjà installé et utilisé** — réutilisable pour favoris (D-08) et actions admin. Erreurs de formulaire → inline. Voir Architecture Patterns. |
</phase_requirements>

## Summary

Cette phase est une **migration UI interne + durcissement**, pas un développement de feature. Le design system (Phase 1) fournit déjà des composants matures (`Button`, `Modal`, `Header`, `Card`, `Input`) suivant tous une convention `variant`/`surface` = `'glass' | 'light'`. Trois familles de travaux : (1) brancher `Button` sur les boutons submit/favori, (2) faire passer les champs texte des formulaires par `Input` — ce qui nécessite d'**étendre `Input`** (aujourd'hui exclusivement fond sombre `bg-black/20 text-white`, sans textarea), (3) ajouter une couche de validation + un feedback d'erreur cohérent.

**Découverte majeure :** `@capacitor/toast` (v8.0.0) est **déjà installé et déjà utilisé** dans `SpotsContext.addSpot` (toasts natifs iOS/Android). Le "toast" que D-08 demande pour le revert favori **n'a donc pas besoin d'être créé** — il faut réutiliser le mécanisme natif existant. Cela résout la contrainte de réconciliation de D-06 sans introduire de dépendance ni de composant de toast custom.

**Aucun package externe à installer.** Tout le travail est du code applicatif. La contrainte projet « pas de tests automatisés » (validation par recette manuelle QA-01) et la contrainte « zéro régression » du milestone v2.0 dominent l'approche : chaque migration doit produire un rendu visuellement identique (les composants DS ont été construits en extrayant les classes verbatim de l'existant — même discipline attendue ici).

**Recommandation principale :** Étendre `Input` avec un prop `surface: 'glass' | 'light'` et un support textarea (`multiline`), en extrayant les classes verbatim des formulaires actuels ; migrer submit/favori sur `Button` ; valider en inline léger (sans lib) ; réutiliser `@capacitor/toast` pour les feedbacks transitoires (favori D-08, actions admin) et le pattern inline `{error && <div>}` pour les erreurs de soumission de formulaire (garde les données visibles, D-07).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rendu des champs de formulaire | Browser / Client (React components) | — | Composants UI purs (`Input`, `Button`) dans `src/ui/` |
| Validation de saisie (longueur, type requis) | Browser / Client (avant soumission) | Database (contraintes Postgres) | Reco CONCERNS.md : validation client + garde-fou RLS/Postgres. Cette phase = couche client uniquement. |
| Feedback d'erreur (inline / toast) | Browser / Client | OS natif (Capacitor Toast) | Toast = pont natif Capacitor ; inline = React state |
| Mutation de données spot/favori | API / Backend (Supabase) | Browser (optimistic UI + revert) | `SpotsContext`/`FavoritesContext` orchestrent l'appel Supabase et l'état optimiste |
| Persistance | Database / Storage (Supabase Postgres + Storage) | Browser (localStorage cache) | Hors scope de modification ; ne pas toucher au schéma (type JSON string fragile) |

## Standard Stack

### Core (déjà présent — aucune installation)
| Composant / Lib | Version | Rôle | Pourquoi standard ici |
|-----------------|---------|------|----------------------|
| `src/ui/Button.tsx` | interne | Submit (`loading`), favori (`iconOnly` + `aria-label`), actions | Couvre **déjà** tous les besoins de la phase, aucune extension requise [VERIFIED: lecture de `src/ui/Button.tsx`] |
| `src/ui/Input.tsx` | interne | Champs texte (nom, description) | **À étendre** (surface claire + textarea) — voir D-01 [VERIFIED: lecture de `src/ui/Input.tsx`] |
| `src/ui/Modal.tsx` | interne | Enveloppe des formulaires modaux | Variantes `light+sheet`/`light+center` déjà présentes ; attention largeur (Pitfall 1) [VERIFIED: lecture de `src/ui/Modal.tsx`] |
| `@capacitor/toast` | 8.0.0 | Feedback transitoire (favori D-08, actions admin) | **Déjà installé + déjà utilisé** dans `SpotsContext` [VERIFIED: package.json L20 + grep usage] |
| `framer-motion` | 12.23.25 | Animations des overlays d'édition (existantes) | Déjà le standard du repo [VERIFIED: package.json L25] |
| `lucide-react` | 0.556.0 | Icônes (Heart, X, Save…) | Déjà le standard du repo [VERIFIED: package.json L26] |
| `react` / `react-dom` | 19.2.0 | Runtime | [VERIFIED: package.json L28-29] |

### Supporting (déjà présent)
| Élément | Rôle | Quand l'utiliser |
|---------|------|------------------|
| `useLanguage().t(key)` (`LanguageContext`) | i18n FR/EN via dictionnaires `src/translations/{fr,en}.json` | **Toute** nouvelle chaîne utilisateur (validation, confirmation D-04, toast D-08) doit passer par `t()` et ajouter la clé dans **fr.json ET en.json** [VERIFIED: lecture LanguageContext + translations] |
| Pattern `mapAuthError()` (`AuthModal.tsx:33-38`) | Traduction erreur backend → message user | Modèle direct pour un `mapSpotError()` de soumission de spot [VERIFIED: lecture AuthModal] |
| Pattern inline `{error && <div className="…bg-red-500/20…">{error}</div>}` (`AuthModal.tsx:149-153`) | Affichage d'erreur dans un formulaire | Erreurs de soumission (garde les données saisies, D-07) [VERIFIED: lecture AuthModal] |

### Alternatives Considered
| Au lieu de | On pourrait utiliser | Compromis |
|------------|---------------------|-----------|
| Validation hand-rolled légère | `zod` (suggéré par CONCERNS.md) | `zod` est robuste mais = **nouvelle dépendance** pour 2 champs texte. Sur un milestone "refactor sans nouvelle feature / bundle à réduire (PERF-03)", ajouter une lib de validation est du scope creep. Recommandation : **hand-roll** (2-3 règles triviales). `zod` reste pertinent si la validation devait couvrir tout le schéma Supabase — hors scope ici. |
| Réutiliser `@capacitor/toast` natif | Composant toast React custom (`DS-04`) | Un composant toast custom est **explicitement listé en Future Requirement (DS-04, hors v2.0)**. Le toast natif Capacitor existe déjà et marche sur mobile (cible QA-01). Ne pas anticiper DS-04. |
| Étendre `Input` (surface + multiline) | Créer `Textarea.tsx` / `Select.tsx` séparés | La convention DS établie (Modal, Header, Card ajoutent tous un prop `surface`/`variant`) est **d'étendre, pas de dupliquer**. Créer de nouveaux composants romprait la cohérence (D-01). |

**Installation :** Aucune. `npm install` inutile — tous les composants et libs sont déjà dans le repo.

## Package Legitimacy Audit

> **Non applicable.** Cette phase n'installe **aucun** package externe. Tous les outils (`@capacitor/toast`, `framer-motion`, `lucide-react`, composants `src/ui/*`) sont déjà présents dans `package.json` et déjà utilisés en production. Aucun risque de slopsquatting introduit par cette phase.

## Architecture Patterns

### System Architecture Diagram — flux de soumission/édition d'un spot

```
[Utilisateur saisit]                    [Utilisateur toggle favori]
       |                                          |
       v                                          v
 <Input surface="light" />              <Button iconOnly aria-label />
 <textarea via Input multiline>                   |
 boutons pill (type/difficulté)                   v
       |                              FavoritesContext.toggleFavorite
       v                                          |
 [handleSubmit]                          setFavorites(optimistic)  <-- MAJ immédiate
       |                                          |
       v                                          v
 VALIDATION CLIENT  --échec-->  {error && <div>}  supabase.insert/delete
 (nom non vide/trim,            (inline, données          |
  longueurs, >=1 type,           conservées, D-07)   --échec-->
  confirm si 0 photo D-04)             |                  |
       |  --OK-->                      |          revert setFavorites
       v                               |                + Toast.show (D-08)
 SpotsContext.addSpot / updateSpot     |          [@capacitor/toast natif]
       |                               |
       v                               |
 supabase.storage.upload (photos)      |
 supabase.from('spots').insert/update  |
       |                               |
   --échec-->  Toast.show (addSpot, existant)
               ou {error inline} (updateSpot/edit)
       |
   --OK--> setSpots + fermeture form
```

### Recommended Project Structure (existante — pas de nouveau dossier)
```
src/
├── ui/
│   ├── Input.tsx        # À ÉTENDRE : prop surface + multiline
│   ├── Button.tsx       # inchangé (déjà complet)
│   └── Modal.tsx        # inchangé (variantes light déjà là)
├── components/
│   ├── AddSpotForm.tsx      # migration champs → Input/Button + validation + confirm D-04
│   ├── SpotDetail.tsx       # overlay édition (~L541-680) + bouton favori (~L300)
│   └── AdminDashboard.tsx   # overlay édition admin (~L199-282) — D-09
├── context/
│   ├── SpotsContext.tsx     # remplacer alert() (approve/delete/update) par toast/inline
│   └── FavoritesContext.tsx # ajouter Toast.show au revert (D-08)
└── translations/
    ├── fr.json          # AJOUTER clés validation/confirmation/toast
    └── en.json          # AJOUTER les mêmes clés (parité obligatoire)
```

### Pattern 1 : Extension d'`Input` par prop `surface` (précédent DS verbatim)
**What :** Ajouter `surface?: 'glass' | 'light'` (défaut `'glass'` pour ne PAS casser `AuthModal`) et `multiline?: boolean` (rend un `<textarea>`).
**When to use :** Tous les champs texte des formulaires spot (fond clair `bg-slate-50`).
**Pourquoi ce défaut :** `AuthModal` consomme `Input` sans prop → doit rester byte-identique (glass). Exactement la même stratégie que `Modal`/`Header`/`Card` (défaut `glass`, les consommateurs existants ne changent pas).
```typescript
// Source: convention verbatim de src/ui/Modal.tsx L24-30 & src/ui/Header.tsx L16-26
// Classes "light" à EXTRAIRE VERBATIM de AddSpotForm.tsx L206 (input) et L218 (textarea) :
//   'w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl
//    focus:border-sky-500 focus:outline-none transition-colors font-medium'
// Classes "glass" = celles actuelles (bg-black/20 …). Aucun style inventé.
interface InputProps {
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    surface?: 'glass' | 'light';   // NOUVEAU — défaut 'glass'
    multiline?: boolean;           // NOUVEAU — rend <textarea>
    maxLength?: number;            // NOUVEAU — support D-02
    error?: string;               // NOUVEAU (optionnel) — message inline sous le champ
    icon?: LucideIcon; type?: string; placeholder?: string; required?: boolean; minLength?: number;
}
```
**Note régression :** l'`Input` glass rend un `<label>` en `uppercase tracking-wider text-white/70`. Les labels des formulaires spot sont `text-sm font-medium text-slate-700`. La variante `light` doit reproduire CE style de label, sinon régression visuelle.

### Pattern 2 : Validation client légère avant soumission (ROBUST-01)
**What :** Fonction pure qui retourne un message d'erreur (ou `null`) ; pas de lib.
**When to use :** Dans `handleSubmit` de `AddSpotForm` et `handleSaveEdit` de `SpotDetail`/`AdminDashboard`, avant l'appel context.
```typescript
// Source: pattern dérivé de AuthModal.mapAuthError + "validation avant soumission"
// (CONVENTIONS.md § Error Handling). Toutes les chaînes via t().
function validateSpot(name: string, description: string, types: StartType[], t: (k:string)=>string): string | null {
    const trimmed = name.trim();
    if (!trimmed) return t('form.error.name_required');        // couvre le cas "espaces seuls"
    if (trimmed.length > 100) return t('form.error.name_too_long');   // D-02 (voir reco)
    if (description.length > 2000) return t('form.error.desc_too_long'); // D-02
    if (types.length === 0) return t('form.error.type_required'); // D-03 (edge case explicite)
    return null;
}
```

### Pattern 3 : Confirmation douce "pas de photo" (D-04)
**What :** Après validation OK, si `imageFiles.length === 0`, demander confirmation non bloquante AVANT d'appeler `addSpot`.
**When to use :** Uniquement à l'ajout (`AddSpotForm`), pas à l'édition.
**Recommandation :** utiliser le master `Modal` en `surface="light" layout="center"` pour un dialogue de confirmation cohérent DS (plutôt qu'un `confirm()` natif — cohérence UI-03 et ton engageant maîtrisé). Le texte (2 clés i18n : titre + corps) doit être encourageant, expliquer la valeur d'une photo pour les autres riders, et rappeler l'ajout ultérieur via l'édition. Deux actions : "Publier quand même" / "Ajouter une photo".

### Pattern 4 : Feedback d'erreur API — réconciliation D-06 / D-08
**What :** Deux contextes UX distincts, deux patterns **déjà présents dans le repo** (pas d'incohérence introduite) :

| Contexte | Pattern | Source précédent |
|----------|---------|------------------|
| Échec de **soumission de formulaire** (add/edit spot) | Inline `{error && <div>}` — garde les données saisies (D-07), contextuel | `AuthModal.tsx:149-153` |
| Échec d'**action transitoire** (revert favori D-08 ; approve/delete admin) | `Toast.show()` natif Capacitor — éphémère, non contextuel | `SpotsContext.addSpot` (L128-215) |

**Réconciliation explicite de D-06 :** la contrainte demandait, si un toast est introduit pour les favoris, d'envisager de le réutiliser pour les erreurs de formulaire. **Le toast n'est pas "introduit" — il existe déjà** (`@capacitor/toast`). Le choix recommandé n'est donc pas "inline vs toast" mais "quel pattern pour quel contexte" : inline pour un formulaire ouvert (l'utilisateur regarde le champ), toast pour une action de fond (favori déjà fermé, action admin dans une liste). Les deux ont un précédent codebase → cohérence respectée.
```typescript
// D-08 — dans FavoritesContext.toggleFavorite, bloc catch (remplace le revert silencieux) :
import { Toast } from '@capacitor/toast';   // déjà une dépendance du repo
// ... après le revert setFavorites(...) existant :
await Toast.show({ text: t('fav.error.revert'), duration: 'short' }); // "Échec, réessaie"
```

### Anti-Patterns to Avoid
- **Réécrire les classes Tailwind "au propre" pendant la migration.** Le DS a été construit en extrayant les classes **verbatim** (voir commentaires de `Button`/`Modal`/`Header`). Toute reformulation = risque de régression visuelle → viole la contrainte zéro-régression. Extraire, ne pas réinventer.
- **Toucher au stockage `type` en JSON string** (`JSON.stringify(newSpotData.type)`). Fragile mais fonctionnel, **hors scope** (Out of Scope REQUIREMENTS.md + blocker STATE.md). Ne pas "améliorer" en passant.
- **Ajouter la validation de fichier/MIME/taille.** Explicitement écarté par D-05. Ne pas l'implémenter même si CONCERNS.md le recommande — c'est une autre décision.
- **Introduire un composant Toast React.** = DS-04, hors v2.0. Utiliser le natif Capacitor.
- **Oublier la parité fr.json / en.json.** `t()` retourne la clé brute si absente → texte cassé en anglais. Chaque clé ajoutée dans un fichier doit l'être dans l'autre.
- **Rendre le label uppercase glass sur fond clair.** Régression visuelle directe (voir Pattern 1).

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser à la place | Pourquoi |
|----------|-------------------|---------------------|----------|
| Bouton submit avec spinner de chargement | Un `<button>` + `Loader2` custom (comme aujourd'hui L262-268 de AddSpotForm) | `Button` (`loading` prop, gère déjà `Loader2` + `disabled`) | Déjà fait, testé, cohérent DS |
| Bouton icône (favori) accessible | `<button aria-label>` manuel | `Button iconOnly` (garde-fou `aria-label` obligatoire intégré) | A11y déjà garantie par le composant |
| Toast natif mobile | Wrapper autour de l'API native / lib toast | `@capacitor/toast` (déjà installé + utilisé) | Zéro dépendance nouvelle |
| Enveloppe modale (backdrop, portail, animation, safe-area) | Nouveau `AnimatePresence` inline | `Modal` (`surface`/`layout`) — createPortal + z-index déjà gérés | Le fix de Phase 3 (modale masquée) vit dans `Modal` ; réinventer = re-risquer ce bug |
| Traduction d'erreur backend | `switch` ad hoc dispersé | `mapAuthError`-like centralisé + `t()` | Pattern établi, i18n cohérent |

**Key insight :** 90% de cette phase consiste à **remplacer du code custom existant par les composants DS qui font déjà mieux**. Le seul vrai "build" est l'extension d'`Input` (surface light + multiline) et la fonction de validation — les deux minimalistes.

## Runtime State Inventory

> Phase de refactor UI (pas un rename ni une migration de données). Inventaire pour due diligence :

| Catégorie | Éléments trouvés | Action requise |
|-----------|------------------|----------------|
| Stored data | **Aucune** — aucune chaîne renommée. Le champ `type` reste stocké en JSON string (inchangé, hors scope). Vérifié par lecture de `SpotsContext.updateSpot`/`addSpot`. | Aucune |
| Live service config | **Aucune** — Supabase (schéma `spots`/`favorites`) non modifié. Vérifié : la phase ne touche ni RLS ni colonnes. | Aucune |
| OS-registered state | **Aucun** — pas de tâche/registration OS. | Aucune |
| Secrets/env vars | **Aucun** — aucune nouvelle variable ; `VITE_SUPABASE_*` inchangées. | Aucune |
| Build artifacts | **Aucun** — pas de renommage de package ni de build natif ; `@capacitor/toast` déjà lié. | Aucune |

**Point de vigilance (pas un item d'inventaire) :** le parsing `type` JSON string est dupliqué (SpotsContext L84-100, L185-190) et fragile. Les formulaires édités écrivent via `JSON.stringify(type)`. Ne PAS modifier ce chemin — se contenter de faire transiter la même valeur.

## Common Pitfalls

### Pitfall 1 : Largeur du conteneur — `Modal light+sheet` (`max-w-sm`) vs formulaire (`max-w-lg`)
**What goes wrong :** `AddSpotForm` utilise aujourd'hui son propre shell `AnimatePresence` en `max-w-lg` (`AddSpotForm.tsx:138`). Le master `Modal` `light+sheet` est en `max-w-sm` (`Modal.tsx:86`). Migrer naïvement `AddSpotForm` vers `Modal` **rétrécit le formulaire** → régression visuelle + champs à l'étroit.
**Why it happens :** `Modal` a été dimensionné pour `FiltersModal` (petit), pas pour un formulaire riche.
**How to avoid :** Deux options à trancher au planning : (a) laisser `AddSpotForm` gérer son propre shell et ne migrer QUE les champs internes vers `Input`/`Button` (UI-03 parle de "composants du design system" — Input/Button suffisent, Modal n'est pas obligatoire sur CE formulaire) ; (b) ajouter au `Modal` un prop de largeur (`max-w-lg`) en extrayant verbatim. Option (a) = moindre risque de régression et probablement suffisante pour UI-03.
**Warning signs :** Formulaire visiblement plus étroit, champs qui wrap, grille photo 3-cols serrée.

### Pitfall 2 : `Input` glass casse `AuthModal` si le défaut change
**What goes wrong :** Si l'extension d'`Input` change le comportement par défaut (ex : défaut `surface='light'`), `AuthModal` (seul consommateur actuel) rend en fond clair sur une modale glass → régression majeure.
**How to avoid :** Défaut `surface='glass'`, exactement comme `Modal`/`Header`/`Card`. Les consommateurs existants ne passent aucun prop et restent byte-identiques.
**Warning signs :** Champs blancs dans la modale d'auth translucide.

### Pitfall 3 : Fuite d'`URL.createObjectURL` dans l'overlay d'édition de `SpotDetail`
**What goes wrong :** `SpotDetail.tsx:638` fait `src={URL.createObjectURL(file)}` **directement dans le rendu**, sans révocation — appelé à chaque render. `AddSpotForm` a déjà été corrigé (ref + `onExitComplete`, L27-129) mais **pas** l'overlay d'édition de `SpotDetail`.
**Why it happens :** `createObjectURL` dans le JSX crée une nouvelle URL non révoquée à chaque re-render.
**How to avoid :** Ne PAS aggraver en touchant ce chemin sans précaution. Si la migration réécrit cette zone, appliquer le même pattern que `AddSpotForm` (créer l'URL une fois, révoquer). Sinon, laisser tel quel (c'est un bug préexistant, pas une régression introduite). À signaler au planner comme dette optionnelle.
**Warning signs :** Mémoire qui croît en ajoutant/retirant des photos en édition.

### Pitfall 4 : Chaînes de toast codées en dur (français) hors i18n
**What goes wrong :** Les toasts existants dans `SpotsContext` sont en français codé en dur (`'Envoi du spot en cours...'`). Ajouter le toast D-08 dans `FavoritesContext` de la même façon perpétue l'incohérence i18n.
**Why it happens :** Les contexts n'ont pas d'accès direct au hook `useLanguage()` ; la tentation est de coder en dur.
**How to avoid :** Deux options : (a) déclencher le toast depuis le composant (qui a `t()`) plutôt que depuis le context ; (b) lire `localStorage.getItem('updock_language')` dans le context pour choisir la chaîne. Recommandation : (a) pour les erreurs de formulaire (inline, déjà côté composant) ; pour le revert favori, passer le message traduit au context ou lire localStorage. Trancher au planning.
**Warning signs :** Toast en français quand l'app est en anglais.

### Pitfall 5 : `alert()` restants hors périmètre formulaires/favoris
**What goes wrong :** `SpotsContext` a 3 `alert()` : `approveSpot` (L230), `deleteSpot` (L262, avec préfixe `[DEBUG]`), `updateSpot` (L285). Seuls `updateSpot` (édition = formulaire) et les actions admin (D-09) sont clairement dans le périmètre. `deleteSpot` utilise aussi `confirm()` (L235).
**How to avoid :** Périmètre net : remplacer `alert()` de `updateSpot` (édition) par inline/toast ; `approveSpot`/`deleteSpot` sont dans `AdminDashboard` (D-09 le met en scope) → toast. Ne pas partir en chasse aux `alert()` de tout le repo (scope creep) — s'en tenir aux chemins formulaires/favoris/admin-édition.
**Warning signs :** Un `alert()` natif surgit encore en cas d'échec API sur un chemin migré.

## Code Examples

### Migration d'un bouton favori vers `Button iconOnly` (D-10)
```typescript
// Source: signature vérifiée de src/ui/Button.tsx (iconOnly + aria-label obligatoire)
// AVANT (App.tsx L174-182) : <button onClick=... className="p-2 text-rose-500 ...">
//   <Heart size={20} className="fill-rose-500" /></button>
// APRÈS :
<Button
    variant="ghost"
    iconOnly
    aria-label={t('fav.remove')}   // clé i18n à ajouter fr+en
    onClick={(e) => { e.stopPropagation(); toggleFavorite(spot.id); }}
>
    <Heart size={20} className="fill-rose-500 text-rose-500" />
</Button>
```
> Attention : `Button variant="ghost"` = `bg-white/5 hover:bg-white/10 rounded-full` (pensé fond sombre). Sur fond clair (liste favoris), extraire/adapter la classe hover claire via `className` ou envisager un variant approprié — vérifier le rendu (Pitfall zéro-régression).

### Toast de revert favori (D-08)
```typescript
// Source: API @capacitor/toast déjà utilisée dans SpotsContext L133
import { Toast } from '@capacitor/toast';
// dans le catch de toggleFavorite, après le revert setFavorites existant :
await Toast.show({ text: 'Échec, réessaie', duration: 'short' });
// (idéalement chaîne via t() — voir Pitfall 4)
```

### Erreur de soumission inline (ROBUST-02, pattern AuthModal)
```typescript
// Source: AuthModal.tsx:149-153 (verbatim)
const [error, setError] = useState<string | null>(null);
// dans handleSubmit : setError(null) au début ; en cas d'échec validation ou API : setError(msg)
{error && (
    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
        {error}
    </div>
)}
// Note: cette classe est pensée fond sombre. Sur formulaire clair, adapter en
// bg-red-50 border-red-200 text-red-600 (à extraire cohérent avec les tokens existants).
```

## State of the Art

| Ancienne approche (dans ce repo) | Approche cible (cette phase) | Impact |
|----------------------------------|------------------------------|--------|
| `<button>`/`<input>`/`<textarea>` natifs stylés inline | Composants DS `Button`/`Input` | Cohérence visuelle (UI-03), a11y intégrée |
| `alert('Failed to …')` natif | Inline (`{error}`) + `Toast.show` natif | Feedback cohérent, pas d'alerte bloquante (ROBUST-02) |
| Revert favori silencieux | Revert + toast (D-08) | L'utilisateur sait que l'action a échoué |
| Validation `if (!position) return` uniquement | Validation nom/desc/type + confirm photo (D-04) | Données propres, messages clairs (ROBUST-01) |
| `<select>` natif pour la difficulté (AddSpotForm) vs boutons pill (SpotDetail/Admin) | Harmoniser sur boutons pill (pattern majoritaire, 2/3) | Cohérence — à confirmer au planning |

**Déprécié / à retirer dans le périmètre :**
- `alert()` sur les chemins formulaires/favoris/admin-édition.
- Chaîne `[DEBUG]` dans `deleteSpot` (L262) — string de debug en prod (CONCERNS.md § Unstructured Error Handling).

## Assumptions Log

| # | Claim | Section | Risque si faux |
|---|-------|---------|----------------|
| A1 | Limites recommandées : **nom max 100 / description max 2000** (aligné CONCERNS.md) | Pattern 2 / D-02 | Faible — décision discrétionnaire D-02 ; ajuster au planning si l'utilisateur préfère 50/500. Aucune contrainte technique bloquante. |
| A2 | `@capacitor/toast` a un rendu correct sur la cible de recette (mobile natif iOS/Android) | Stack / D-08 | Faible — déjà utilisé en prod dans `addSpot` ; comportement web possiblement différent mais QA-01 = recette mobile. |
| A3 | Migrer `AddSpotForm` vers le master `Modal` n'est **pas** obligatoire pour satisfaire UI-03 (Input+Button suffisent) | Pitfall 1 | Moyen — dépend de l'interprétation de "utilisent les composants du design system (Input, Button, Modal)". À confirmer au planning : le verifier pourrait exiger `Modal`. Voir Open Question 1. |
| A4 | Boutons pill de type/difficulté restent des `<button>` stylés aux tokens (pas passés par `Button`) | D-01 / State of the Art | Faible — ce sont des toggles de sélection, pas des actions ; `Button` n'a pas de variante "pill sélectionnable". Cohérent avec le rôle de `Button`. |
| A5 | Harmoniser la difficulté sur des boutons pill (comme SpotDetail/Admin) plutôt que le `<select>` natif d'AddSpotForm | State of the Art | Faible — améliore la cohérence mais change le rendu d'AddSpotForm ; à valider vs zéro-régression (c'est un changement UI voulu par UI-03, pas une régression). |

## Open Questions (RESOLVED)

1. **`Modal` obligatoire sur `AddSpotForm` ou Input/Button suffisent-ils pour UI-03 ?**
   - **RESOLVED :** NON — Input/Button suffisent ; le master `Modal` est utilisé pour le dialogue de confirmation « pas de photo » (D-04), pas pour l'enveloppe du form. Voir 04-UI-SPEC.md « Résolution des questions ouvertes » (Q1, L179), consommé par 04-03.
   - Ce qu'on sait : UI-03 cite "(Input, Button, Modal)". `AddSpotForm` a son propre shell sheet en `max-w-lg` ; le master `Modal light+sheet` est `max-w-sm` (Pitfall 1).
   - Ce qui est flou : le critère de succès #1 exige "utilisent les composants du design system" — le verifier acceptera-t-il un formulaire dont seuls les champs (Input/Button) sont DS mais dont l'enveloppe reste custom ?
   - Recommandation : trancher au planning. Le plus sûr côté zéro-régression = migrer les champs (Input/Button) et, si `Modal` est exigé, ajouter un prop largeur au `Modal` (extraction verbatim) plutôt que rétrécir le formulaire.

2. **Où déclencher le toast D-08 (context vs composant) pour rester i18n-cohérent ?**
   - **RESOLVED :** Depuis le composant (pas `FavoritesContext`, sans accès à `t()`) ; clé `fav.error.revert` dans `fr.json`/`en.json`. Voir 04-UI-SPEC.md « Résolution des questions ouvertes » (Q2, L181), consommé par 04-02.
   - Ce qu'on sait : `FavoritesContext` n'a pas `t()` ; toasts existants codés en dur en FR (Pitfall 4).
   - Recommandation : passer le message traduit au context, ou lire `localStorage` langue dans le context. Décision de planning.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@capacitor/toast` | Feedback D-08 + actions admin | ✓ | 8.0.0 | — |
| Node / npm (build) | `npm run build`, `npm run lint` | ✓ (repo actif) | — | — |
| Supabase (backend) | Mutations spot/favori (déjà en place) | ✓ | client 2.87.2 | — |

**Dépendances manquantes bloquantes :** aucune.
**Dépendances manquantes avec fallback :** aucune. La phase est 100% code applicatif sur une base déjà fonctionnelle.

> Note : `cap doctor/sync` requièrent Node >=22 (env actuel v20, cf. STATE Deferred). **Sans impact** sur cette phase : aucune resync Capacitor native n'est nécessaire (`@capacitor/toast` déjà lié dans le projet iOS existant).

## Validation Architecture

> `workflow.nyquist_validation: true` dans config.json. **Mais** contrainte projet formelle : **pas d'infra de test automatisé** (REQUIREMENTS.md Out of Scope + CODE-03 Future). La validation de ce milestone est la **recette manuelle QA-01**. Section renseignée en conséquence.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **Aucun** (décision projet : recette manuelle). Aucun `vitest`/`jest`/`*.test.*` détecté (vérifié par recherche filesystem). |
| Config file | none |
| Quick run command | `npm run lint` (ESLint, gate rapide) |
| Full suite command | `npm run build` (`tsc -b && vite build` — le typecheck TS est le principal filet automatique) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-03 | Champs/boutons rendus via composants DS | manual (recette visuelle) + typecheck | `npm run build` | ✅ (checklist QA manuelle) |
| ROBUST-01 | Validation nom/desc/type + message clair | manual (saisie invalide → message) | — (manuel) | ✅ QA |
| ROBUST-01 | Confirm douce si 0 photo (D-04) | manual | — | ✅ QA |
| ROBUST-02 | Échec API → feedback inline/toast, données conservées, pas de crash | manual (couper réseau, soumettre) | — | ✅ QA |
| ROBUST-02 | Revert favori + toast (D-08) | manual (couper réseau, toggle) | — | ✅ QA |
| tous | Pas de régression TS / lint | typecheck + lint | `npm run build && npm run lint` | ✅ automatisé |

### Sampling Rate
- **Per task commit :** `npm run lint` (rapide, attrape les erreurs de type/import de migration).
- **Per wave merge :** `npm run build` (typecheck complet + build Vite).
- **Phase gate :** `npm run build` vert + **checklist recette manuelle QA-01** à 100% (critère de succès #4) avant `/gsd:verify-work`.

### Wave 0 Gaps
- Aucun test automatisé à créer (contrainte projet « pas de tests »). Le filet automatique se limite à `tsc`/eslint déjà en place.
- **À produire par le planner :** une checklist de recette manuelle dédiée (ajout spot, édition spot user, édition spot admin, favori add/remove, favori offline, validation champ vide/trop long, soumission sans photo) — sur le modèle du `03-QA-CHECKLIST.md` existant.

## Security Domain

> `security_enforcement` absent de config.json → considéré activé. Section ciblée sur ce que la phase touche réellement.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | non | Non modifié (auth = phase antérieure) |
| V3 Session Management | non | Supabase SDK inchangé |
| V4 Access Control | partiel | Édition/suppression réservées propriétaire/admin (`user?.id === spot.user_id || email admin`, `SpotDetail:268`) — **existant, ne pas affaiblir** ; RLS Supabase reste la garde autoritaire |
| V5 Input Validation | **oui** | **Cœur de ROBUST-01.** Validation côté client (longueur nom/desc, ≥1 type). React échappe le rendu par défaut → pas d'injection HTML via description (`whitespace-pre-line` est sûr). Les limites de longueur atténuent l'abus de stockage. |
| V6 Cryptography | non | Aucun crypto touché |

### Known Threat Patterns for {React 19 + Supabase, formulaires}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS stocké via nom/description de spot | Tampering | React échappe par défaut (`{spot.description}`) ; ne jamais introduire `dangerouslySetInnerHTML`. `whitespace-pre-line` reste sûr. |
| Abus de stockage (champs très longs) | DoS | Limites de longueur client (D-02) + garde-fou Postgres/RLS (hors scope mais recommandé côté DB) |
| Upload de fichier non vérifié | Tampering / Malware | **Hors scope explicite (D-05)** — à traiter dans une phase ultérieure ; ne PAS l'implémenter ici |
| Contournement client de la validation | Tampering | La validation client est UX, pas une frontière de sécurité — la vraie garde reste RLS/contraintes Supabase (rappel : ne pas présenter la validation client comme suffisante côté sécurité) |

## Sources

### Primary (HIGH confidence)
- Lecture directe du code : `src/ui/{Input,Button,Modal,Header,Card}.tsx`, `src/components/{AddSpotForm,SpotDetail,AdminDashboard,AuthModal}.tsx`, `src/context/{SpotsContext,FavoritesContext,LanguageContext}.tsx`, `src/App.tsx`
- `package.json` — versions vérifiées (React 19.2, framer-motion 12.23.25, lucide 0.556.0, @capacitor/toast 8.0.0)
- `.planning/phases/04-formulaires-interactions/04-CONTEXT.md` — décisions D-01..D-11
- `.planning/codebase/CONCERNS.md` — dette (alert(), validation manquante, upload non vérifié, type JSON string)
- `.planning/codebase/CONVENTIONS.md` — patterns error handling / i18n / DS
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/config.json`
- Recherche filesystem : absence de test framework confirmée ; usages `Toast` confirmés (grep)

### Secondary (MEDIUM confidence)
- Aucune — aucune source externe nécessaire (phase 100% interne).

### Tertiary (LOW confidence)
- Aucune.

## Metadata

**Confidence breakdown :**
- Standard stack : HIGH — tous composants/libs lus dans le repo, versions confirmées via package.json.
- Architecture : HIGH — patterns extraits du code existant (AuthModal, SpotsContext, précédents Modal/Header/Card).
- Pitfalls : HIGH — dérivés d'observations directes du code (largeurs Modal, fuite createObjectURL, alerts, i18n hardcodé).
- Décisions discrétionnaires (D-01/02/06) : recommandations HIGH sur le "comment", décisions finales à confirmer au planning (voir Assumptions Log + Open Questions).

**Research date :** 2026-07-30
**Valid until :** ~2026-08-29 (30 j — base de code stable, aucune dépendance externe à mouvement rapide).
