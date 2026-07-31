# Phase 4 : Formulaires & Interactions — Carte des patterns

**Mappé :** 2026-07-30
**Fichiers analysés :** 8 (7 modifiés + 2 fichiers de traduction)
**Analogs trouvés :** 8 / 8 (100 % — phase 100 % interne, tous les précédents existent dans le repo)

> Phase de **migration UI + durcissement**, pas de nouvelle feature. Chaque fichier modifie du code existant en copiant un pattern déjà présent dans le repo. Aucun fichier « from scratch » sauf l'extension d'`Input` (qui suit la convention `surface` verbatim de `Modal`/`Header`).

---

## Classification des fichiers

| Fichier modifié | Rôle | Data Flow | Analog le plus proche | Qualité du match |
|-----------------|------|-----------|----------------------|------------------|
| `src/ui/Input.tsx` | component (primitive DS) | transform (rendu de champ) | `src/ui/Modal.tsx` + `src/ui/Header.tsx` (prop `surface`) | exact (convention DS) |
| `src/components/AddSpotForm.tsx` | component (form) | request-response | `src/components/AuthModal.tsx` | exact (form → Input/Button/inline error) |
| `src/components/SpotDetail.tsx` | component (form inline + action) | request-response + event-driven | `src/components/AuthModal.tsx` (form) + `Button iconOnly` (favori) | exact / role-match |
| `src/components/AdminDashboard.tsx` | component (form inline admin) | request-response | `src/components/SpotDetail.tsx` overlay édition (L555-677) | exact (même logique d'édition) |
| `src/context/SpotsContext.tsx` | provider/store | CRUD | son propre `addSpot` (`Toast.show`, L128-215) | exact (auto-analog) |
| `src/context/FavoritesContext.tsx` | provider/store | event-driven (optimistic) | `SpotsContext.addSpot` `Toast.show` (L133) | role-match |
| `src/App.tsx` (liste favoris ~L174-182) | component (action) | event-driven | `Button iconOnly` + `SpotDetail` fav button (L300-319) | role-match |
| `src/translations/{fr,en}.json` | config (i18n) | — | clés existantes `add.*` / `auth.*` | exact (parité) |

---

## Pattern Assignments

### `src/ui/Input.tsx` (component DS — à ÉTENDRE)

**Analog :** `src/ui/Modal.tsx` (L24-30) et `src/ui/Header.tsx` (L16-26) — convention DS « prop `surface: 'glass' | 'light'`, défaut `'glass'` pour que les consommateurs existants restent byte-identiques ».

**État actuel — `Input.tsx` complet (L1-44) :** un seul rendu, fond sombre glass, `<input>` uniquement (pas de textarea). Label glass = `text-xs font-bold text-white/70 uppercase tracking-wider` (L28). Champ glass = `w-full bg-black/20 border border-white/10 rounded-xl py-3 … text-white … focus:ring-2 focus:ring-primary` (L39).

**Pattern de branchement `surface` par défaut (verbatim de `Header.tsx` L25-26) :**
```typescript
// Header.tsx — le modèle exact à reproduire dans Input :
const titleColor = surface === 'glass' ? 'text-white' : 'text-text';
const subtitleColor = surface === 'glass' ? 'text-white/50' : 'text-muted';
```

**Ce qu'il faut ajouter à `InputProps` (L4-13 actuel) :**
- `surface?: 'glass' | 'light'` — défaut `'glass'` (NE PAS changer le défaut, sinon régression `AuthModal` — Pitfall 2 RESEARCH)
- `multiline?: boolean` — rend un `<textarea>` au lieu de `<input>`
- `maxLength?: number` — support D-02
- `error?: string` — message inline sous le champ
- Élargir `onChange` à `React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>`

**Classes « light » à EXTRAIRE VERBATIM (source `AddSpotForm.tsx`) :**
```
// champ light (input L206 / textarea L218) :
'w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none transition-colors'
// textarea ajoute : 'min-h-[100px]'
// label light (L200, graisse normalisée font-medium → font-normal par UI-SPEC) :
'block text-sm font-normal text-slate-700 mb-2'
```
**Régression à éviter :** la variante `light` NE DOIT PAS rendre le label glass `uppercase text-white/70` (Component Contract UI-SPEC L150). Reproduire `text-sm text-slate-700 mb-2`.

**Message d'erreur inline sous le champ (surface light) — classe cible UI-SPEC L105 :**
```
'bg-red-50 border border-red-200 text-red-600 text-sm'
```

---

### `src/components/AddSpotForm.tsx` (component, request-response)

**Analog :** `src/components/AuthModal.tsx` — le seul formulaire déjà entièrement migré vers le DS (Input + Button + inline error + `handleSubmit` try/catch).

**Imports pattern à reproduire (`AuthModal.tsx` L1-8) :**
```typescript
import { useLanguage } from '../context/LanguageContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
// (Modal/Header déjà importés dans AuthModal ; AddSpotForm garde son shell propre — voir Pitfall 1)
```

**Core pattern — `handleSubmit` avec état inline (`AuthModal.tsx` L40-81) :**
```typescript
const [error, setError] = useState<string | null>(null);
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        // ... appel API ...
    } catch (err: any) {
        setError(mapAuthError(err.message));   // ← garde les données saisies (D-07)
    } finally {
        setLoading(false);
    }
};
```
> État actuel d'`AddSpotForm.handleSubmit` (L95-122) : `if (!position) return`, PAS de `setError`, le catch se contente de `setIsSending(false)`. À enrichir avec la validation client + l'état `error` inline.

**Validation client légère (ROBUST-01, D-02/D-03) — fonction pure à insérer avant l'appel `addSpot`, modèle dérivé de `mapAuthError` :**
```typescript
// toutes les chaînes via t(), clés form.error.* définies dans UI-SPEC Copywriting Contract
const trimmed = name.trim();
if (!trimmed) return setError(t('form.error.name_required'));       // couvre "espaces seuls"
if (trimmed.length > 100) return setError(t('form.error.name_too_long'));   // D-02 = 100
if (description.length > 2000) return setError(t('form.error.desc_too_long')); // D-02 = 2000
if (type.length === 0) return setError(t('form.error.type_required'));       // D-03
```

**Affichage inline (verbatim `AuthModal.tsx` L149-153, adapté surface light) :**
```typescript
{error && (
    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
        {error}
    </div>
)}
```
> Note : classe originale `bg-red-500/20 … text-red-200` pensée fond sombre. Sur ce formulaire clair, adapter en `bg-red-50 border-red-200 text-red-600` (UI-SPEC L105).

**Bouton submit — remplacer le `<button>` custom (L262-268) par `Button` :**
```typescript
// Button gère déjà spinner Loader2 + disabled (src/ui/Button.tsx L65)
<Button type="submit" variant="primary" size="lg" loading={isSending} className="w-full">
    {isSending ? t('add.sending') : t('add.submit')}
</Button>
```

**Champs → `Input surface="light"` :** remplacer `<input>` (L201-208) et `<textarea>` (L214-219) par `<Input surface="light" .../>` et `<Input surface="light" multiline .../>`. Passer `maxLength={100}` / `maxLength={2000}`.

**Pills de type (L167-179) et grille photos : CONSERVER VERBATIM** (A4 RESEARCH — `Button` n'a pas de variante pill sélectionnable). Bouton suppression photo : `p-1.5` → `p-2` (UI-SPEC L60).

**Confirmation « pas de photo » (D-04) — master `Modal surface="light" layout="center"` :**
```typescript
// après validation OK, si imageFiles.length === 0 → ouvrir un Modal light+center
// (src/ui/Modal.tsx L37-63) avec 2 actions : t('form.confirm.no_photo.confirm') / .cancel
// titre t('form.confirm.no_photo.title'), corps t('form.confirm.no_photo.body')
```

---

### `src/components/SpotDetail.tsx` (component — form inline édition + bouton favori)

**Deux migrations distinctes dans ce fichier.**

**(A) Bouton favori (D-10) — analog `Button iconOnly` :**

État actuel (L300-319) : `<button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 …">` avec `<Heart>`. À migrer vers `Button iconOnly` :
```typescript
// src/ui/Button.tsx impose aria-label sur iconOnly (L53). Cible tactile 44px (UI-SPEC L56).
<Button
    variant="ghost" iconOnly
    aria-label={user && isFavorite(spot.id) ? t('fav.remove') : t('fav.add')}
    onClick={(e) => { e.stopPropagation(); if (!user) { onOpenAuth?.(); return; } toggleFavorite(spot.id); }}
    className="…adapter classe fond clair + padding pour 44px…"
>
    <Heart size={20} className={user && isFavorite(spot.id) ? 'fill-accent text-accent' : 'text-slate-600'} />
</Button>
```
> Attention : `variant="ghost"` = `bg-white/5 hover:bg-white/10 rounded-full` (fond sombre, Button.tsx L26). Sur fond clair, override via `className` (extraire `bg-slate-100 hover:bg-slate-200`). Conserver le badge cadenas `!user` (L315-319).

**Toast de revert favori (D-08) — depuis le composant, pas le context (Résolution Q2 UI-SPEC L181) :**
```typescript
import { Toast } from '@capacitor/toast';   // déjà dépendance repo
// toggleFavorite renvoie une promesse ; sur rejet :
await Toast.show({ text: t('fav.error.revert'), duration: 'short' });
```

**(B) Formulaire d'édition inline (L557-677) — analog `AddSpotForm` migré + inline error `AuthModal` :**

Champs `<input>` (L561-566) / `<textarea>` (L596-600) → `Input surface="light"` (+ `multiline`, `maxLength`). Bouton Save (L669-676) → `Button variant="primary" loading={isSaving}`. Pills type/difficulté (L573-616) : CONSERVER verbatim.

Ajouter la même validation client + inline error que `AddSpotForm` dans `handleSaveEdit` (L197-224).

**Dette optionnelle à signaler (Pitfall 3) :** `src/components/SpotDetail.tsx:638` fait `src={URL.createObjectURL(file)}` dans le JSX sans révocation (fuite). Si la migration réécrit cette zone, appliquer le pattern ref+revoke d'`AddSpotForm` (L27-129). Sinon laisser tel quel (bug préexistant, pas une régression introduite).

---

### `src/components/AdminDashboard.tsx` (component — form inline admin, D-09)

**Analog :** l'overlay d'édition de `SpotDetail.tsx` (L555-677) — logique d'édition **identique** (même `updateSpot`, mêmes champs, mêmes pills). Appliquer exactement la même migration.

**Overlay actuel (L200-281) :** `<input>` (L217-222), `<textarea>` (L249-253), pills type (L228-244), pills difficulté (L259-266), bouton Save custom (L272-278) `<button className="w-full bg-sky-500 …">`.

**Migration :**
```typescript
// champs → Input surface="light" (+ multiline pour description, maxLength)
// bouton Save → Button variant="primary" size="lg" loading (src/ui/Button.tsx)
// pills → conserver verbatim
// labels "Name"/"Type"/... actuellement EN DUR → passer par t() (parité i18n)
```

**Feedback d'échec admin (approve/delete/update) → toast (Pitfall 5) :** les actions `approveSpot`/`deleteSpot` déclenchées ici (L132, L144, L186, L426, L436) verront leurs `alert()` remplacés côté `SpotsContext` (voir ci-dessous). L'édition (`handleSaveEdit` L29-31) doit propager l'échec pour affichage inline/toast.

---

### `src/context/SpotsContext.tsx` (provider/store, CRUD)

**Analog :** son propre `addSpot` (L128-215) — le pattern `Toast.show` natif est déjà utilisé ici, à réutiliser pour remplacer les `alert()`.

**Pattern toast existant (verbatim L205-208 / L212-215) :**
```typescript
import { Toast } from '@capacitor/toast';   // déjà importé L5
Toast.show({ text: 'Spot envoyé ! …', duration: 'long' });
// erreur :
Toast.show({ text: `Erreur : ${error.message || '…'}`, duration: 'long' });
```

**`alert()` à remplacer dans le périmètre (Pitfall 5 — NE PAS chasser tous les alert du repo) :**
- `approveSpot` L230 `alert('Failed to approve.')` → `Toast.show` (admin, D-09)
- `deleteSpot` L262 `alert('[DEBUG] Failed to delete spot: …')` → `Toast.show` **+ retirer le préfixe `[DEBUG]`** (UI-SPEC L140, State of the Art RESEARCH)
- `updateSpot` L285 `alert('Failed to update spot.')` → **rethrow** pour que le formulaire d'édition affiche l'erreur inline (D-07 : garde les données)

**Point critique pour le planner :** `updateSpot` (L266-287) **avale** actuellement l'erreur (catch → alert, pas de rethrow). Les `handleSaveEdit` de `SpotDetail`/`AdminDashboard` ne voient donc jamais l'échec. Pour le pattern inline (D-07), `updateSpot` doit **`throw`** dans son catch (ou retourner un statut d'erreur) afin que le composant puisse `setError(...)`.

**NE PAS toucher :** `type: JSON.stringify(...)` (L170, L273) — fragile mais hors scope (Anti-Pattern RESEARCH). Le `confirm('Delete this spot?')` L235 reste (comportement conservé, UI-SPEC L140).

---

### `src/context/FavoritesContext.tsx` (provider/store, event-driven optimistic)

**Analog :** `SpotsContext.addSpot` `Toast.show` (L133) pour le mécanisme toast ; le revert optimistic existe déjà ici.

**Revert silencieux actuel (L95-103) — le mécanisme NE change PAS, D-08 ajoute juste un toast :**
```typescript
} catch (err) {
    console.error('Error updating favorites:', err);
    setFavorites(prev => isCurrentlyFavorite ? [...prev, spotId] : prev.filter(id => id !== spotId));
    // ← D-08 : ajouter le feedback ici OU (recommandé) propager l'échec au composant
}
```

**Décision i18n (Pitfall 4 + Résolution Q2 UI-SPEC L181) :** `FavoritesContext` n'a **pas** accès à `t()`. NE PAS coder le toast en dur en français. Option recommandée : `toggleFavorite` propage/rejette l'échec, le **composant appelant** (`App.tsx`, `SpotDetail.tsx`) déclenche `Toast.show({ text: t('fav.error.revert') })`. Actuellement `toggleFavorite` est `async` mais ne rethrow pas — le planner devra le faire rejeter (ou renvoyer un booléen d'échec) pour que le composant réagisse.

---

### `src/App.tsx` (component — bouton favori liste, ~L174-182)

**Analog :** `Button iconOnly` (`src/ui/Button.tsx`) + le bouton favori de `SpotDetail` (L300-319).

État actuel (L174-182) : `<button className="p-2 text-rose-500 hover:bg-rose-50 rounded-full">` + `<Heart className="fill-rose-500">`. Migration identique au bouton favori de SpotDetail :
```typescript
<Button variant="ghost" iconOnly aria-label={t('fav.remove')}
    onClick={(e) => { e.stopPropagation(); toggleFavorite(spot.id); }}
    className="…hover clair + 44px…">
    <Heart size={20} className="fill-rose-500 text-rose-500" />
</Button>
```
> Cible tactile 44px (UI-SPEC L56). Toast de revert D-08 depuis ce handler (voir FavoritesContext ci-dessus).

---

### `src/translations/fr.json` + `src/translations/en.json` (config i18n)

**Analog :** clés existantes `add.*`, `auth.*`, `fav.*`, `spot.edit_*`.

**Parité obligatoire** — chaque clé ajoutée dans un fichier DOIT l'être dans l'autre (`t()` renvoie la clé brute si absente → texte cassé en anglais, Pitfall Anti-Pattern RESEARCH).

**Clés NOUVELLES à créer (copy exact dans UI-SPEC Copywriting Contract L121-134) :**
`form.error.name_required`, `form.error.name_too_long`, `form.error.desc_too_long`, `form.error.type_required`, `form.error.submit_failed`, `fav.error.revert`, `form.confirm.no_photo.{title,body,confirm,cancel}`, `fav.remove`, `fav.add`.

**Correctif copy existant :** `fr.json` `spot.edit_save` → `"Enregistrer les modifications"` (UI-SPEC L134 ; en.json `"Save Changes"` déjà conforme).

---

## Shared Patterns

### Feedback d'erreur — 2 contextes, 2 patterns (précédents codebase, aucune incohérence introduite)

| Contexte | Pattern | Source verbatim | S'applique à |
|----------|---------|-----------------|--------------|
| Échec **soumission de formulaire** (add/edit spot) | inline `{error && <div>}` — garde les données (D-07) | `AuthModal.tsx:149-153` (adapter classe claire `bg-red-50 border-red-200 text-red-600`) | `AddSpotForm`, `SpotDetail` (édit), `AdminDashboard` (édit) |
| Échec **action transitoire** (revert favori D-08, approve/delete admin) | `Toast.show({ duration:'short' })` natif Capacitor | `SpotsContext.addSpot` L205-215 | `App.tsx`, `SpotDetail` (favori), `AdminDashboard` (actions) |

### Convention DS `surface: 'glass' | 'light'` (défaut `glass`)

**Source :** `src/ui/Modal.tsx` L24-30, `src/ui/Header.tsx` L16-26.
**Apply to :** extension de `src/ui/Input.tsx`. Défaut `glass` = consommateurs existants (`AuthModal`) byte-identiques. Classes light extraites verbatim de `AddSpotForm` (jamais réinventées).

### Bouton via `Button` DS (submit + iconOnly)

**Source :** `src/ui/Button.tsx` (loading/Loader2 L65, iconOnly + aria-label garde-fou L53, variantes L18-30).
**Apply to :** tous les submit (`variant="primary" loading`) et tous les favoris (`iconOnly` + `aria-label`). Attention `variant="ghost"` = fond sombre → override `className` sur fond clair.

### i18n `t()` centralisé

**Source :** `useLanguage().t(key)` (utilisé partout, ex `AuthModal` L16). Toute chaîne user via `t()`, parité `fr.json`/`en.json`. Les contexts (`SpotsContext`, `FavoritesContext`) n'ont PAS `t()` → déclencher les toasts depuis le composant.

### Traduction d'erreur backend

**Source :** `mapAuthError()` (`AuthModal.tsx:33-38`) — `switch`-like centralisé → `t()`. Modèle pour un éventuel `mapSpotError()` de soumission de spot.

---

## No Analog Found

_Aucun._ Tous les fichiers ont un précédent verbatim dans le repo. La phase est 100 % interne (RESEARCH confidence HIGH). Le seul « build » réel est l'extension d'`Input` (surface light + multiline) — mais elle suit la convention `surface` déjà établie par `Modal`/`Header`/`Card`, donc pattern existant.

---

## Metadata

**Analog search scope :** `src/ui/`, `src/components/`, `src/context/`, `src/translations/`
**Fichiers scannés (lecture directe) :** `Input.tsx`, `Button.tsx`, `Modal.tsx`, `Header.tsx`, `AuthModal.tsx`, `AddSpotForm.tsx`, `SpotDetail.tsx` (sections favori + édition), `AdminDashboard.tsx` (section édition), `SpotsContext.tsx` (L125-289), `FavoritesContext.tsx`, `App.tsx` (section favoris)
**Pattern extraction date :** 2026-07-30
