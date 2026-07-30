# Phase 4: Formulaires & Interactions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-30
**Phase:** 4-Formulaires & Interactions
**Areas discussed:** Extension du composant Input, Règles de validation (ROBUST-01), Pattern de feedback d'erreur API (ROBUST-02), Périmètre exact du formulaire/favoris

---

## Extension du composant Input

| Option | Description | Selected |
|--------|-------------|----------|
| Étendre Input (variantes) | Ajouter variantes textarea/select-like/fond clair — cohérent avec le pattern Modal étendu en Phase 2/3 | |
| Éléments natifs stylés aux tokens | Garder textarea/select/boutons natifs consommant les tokens, sans passer par le composant Input | |
| Tu décides | Claude choisit au planning selon le risque de régression visuelle | ✓ |

**User's choice:** Tu décides
**Notes:** Aucune contrainte supplémentaire donnée.

---

## Règles de validation (ROBUST-01)

### Limites nom/description

| Option | Description | Selected |
|--------|-------------|----------|
| Recommandations CONCERNS.md | Nom max 100, description max 2000 | |
| Limites plus courtes | Nom max 50, description max 500 | |
| Tu décides | Claude choisit des limites raisonnables | ✓ |

**User's choice:** Tu décides

### Champ type de spot

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, au moins 1 obligatoire (existant) | Comportement actuel conservé sans message d'erreur explicite | |
| Oui + message d'erreur explicite si vide | Même comportement + message clair si 0 type (edge case) | ✓ |

**User's choice:** Oui + message d'erreur explicite si vide

### Photos obligatoires ?

| Option | Description | Selected |
|--------|-------------|----------|
| Non, optionnelles (existant) | Aucune régression fonctionnelle | |
| Oui, au moins 1 obligatoire | Changement de comportement — à éviter | |

**User's choice:** Réponse libre — photos restent optionnelles, mais ajout d'une confirmation douce ("Vous n'avez pas mis de photo, êtes-vous sûr de vouloir publier ?") expliquant la valeur d'une photo et rappelant qu'on peut en ajouter une plus tard en éditant le spot. Ton engageant, pas bloquant.
**Notes:** Décision D-04 dans CONTEXT.md.

### Validation fichier (type/taille)

| Option | Description | Selected |
|--------|-------------|----------|
| Type image/* + max 5 Mo (CONCERNS.md) | Rejette fichiers non-image / trop lourds avant upload | |
| Pas de validation fichier dans cette phase | Se concentrer sur la validation des champs texte | ✓ |

**User's choice:** Pas de validation fichier dans cette phase

---

## Pattern de feedback d'erreur API (ROBUST-02)

### Remplacement des alert()

| Option | Description | Selected |
|--------|-------------|----------|
| Message inline (pattern AuthModal) | Réutiliser {error && <div>{error}</div>} | |
| Toast global | Nouveau système de toast transverse | |
| Tu décides | Claude choisit au planning | ✓ |

**User's choice:** Tu décides

### Bouton retry

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, bouton retry explicite | Relancer l'action sans re-remplir le formulaire | |
| Non, l'utilisateur relance manuellement | Le formulaire garde ses données, re-clic normal | ✓ |

**User's choice:** Non, l'utilisateur relance manuellement

### Échec du toggle favori

| Option | Description | Selected |
|--------|-------------|----------|
| Revert silencieux (existant) | Juste console.error, pas de message | |
| Revert + toast discret | Ajout d'un feedback visuel éphémère | ✓ |

**User's choice:** Revert + toast discret
**Notes:** Cette décision introduit une tension avec le choix "Tu décides" du pattern d'erreur général — noté dans CONTEXT.md (D-06) comme point à réconcilier au planning : si un toast minimal existe déjà pour les favoris, il pourrait aussi couvrir les formulaires.

---

## Périmètre exact du formulaire/favoris

### AdminDashboard inclus ?

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, inclure AdminDashboard | Cohérence totale sur tous les formulaires d'édition de spot | ✓ |
| Non, hors périmètre | Se concentrer sur AddSpotForm + SpotDetail + favoris | |

**User's choice:** Oui, inclure AdminDashboard

### Boutons favori à migrer

| Option | Description | Selected |
|--------|-------------|----------|
| Tous (App.tsx liste + SpotDetail) | Les deux boutons coeur passent par Button iconOnly | ✓ |
| Uniquement SpotDetail | La liste favoris (App.tsx) reste native pour l'instant | |

**User's choice:** Tous (App.tsx liste + SpotDetail)

### NavBar dans le périmètre ?

| Option | Description | Selected |
|--------|-------------|----------|
| Non, hors périmètre | Déjà traité en Phase 2 (NAV-01) | ✓ |
| Oui, vérifier cohérence | Vérifier qu'elle suit bien les tokens actuels | |

**User's choice:** Non, hors périmètre

---

## Claude's Discretion

- Extension du composant Input (variantes textarea/select/fond clair) vs éléments natifs stylés
- Limites exactes de longueur nom/description
- Pattern de feedback d'erreur API général (inline vs toast) — à réconcilier avec le toast déjà requis pour les favoris (D-08)

## Deferred Ideas

None — discussion stayed within phase scope.
