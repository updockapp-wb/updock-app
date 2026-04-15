# Déploiement iOS — Updock

> Nécessite un Mac avec Xcode installé et un compte Apple Developer actif.
> Fais ces étapes dans l'ordre. Ne saute rien.

---

## Étape 1 — Incrémenter la version

Mets à jour `"version"` dans `package.json` pour rester cohérent (ex: `"1.1.4"`).
La version dans Xcode sera mise à jour à l'étape 4.

---

## Étape 2 — Builder le web

```bash
npm run build
```

> Génère le dossier `dist/`. Ça prend ~30 secondes.

---

## Étape 3 — Synchroniser Capacitor

```bash
npx cap sync
```

> Copie `dist/` dans le projet iOS et met à jour les plugins natifs.
> À faire obligatoirement après chaque `npm run build`.

---

## Étape 4 — Ouvrir Xcode

```bash
npx cap open ios
```

> Ouvre Xcode avec le bon projet. Attends que l'indexation se termine (barre de progression en haut).

---

## Étape 5 — Incrémenter la version dans Xcode

1. Dans le panneau gauche, clique sur **App** (l'icône bleue tout en haut, nom du projet)
2. Clique sur la target **App** sous "TARGETS"
3. Onglet **General**
4. Section **Identity** :
   - **Version** : mets le numéro lisible (ex: `1.1.4`)
   - **Build** : mets un entier +1 par rapport au précédent (ex: `6`)

> Le Build number doit toujours augmenter, sinon App Store Connect refuse l'upload.

---

## Étape 6 — Sélectionner la bonne destination

En haut de Xcode, à gauche du bouton Play ▶ :
- Clique sur le sélecteur de destination (il affiche un nom de simulateur ou d'appareil)
- Sélectionne **Any iOS Device (arm64)**

> Si tu sélectionnes un simulateur, l'Archive sera grisée.

---

## Étape 7 — Archiver l'app

1. Dans la barre du haut : **Product → Archive**
2. Xcode compile et archive (~2-5 minutes)
3. À la fin, l'**Organizer** s'ouvre automatiquement avec l'archive

> Si l'Organizer ne s'ouvre pas : **Window → Organizer** dans la barre du haut.

---

## Étape 8 — Distribuer sur l'App Store

Dans l'Organizer :
1. Sélectionne l'archive que tu viens de créer
2. Clique **Distribute App** à droite
3. Sélectionne **App Store Connect** → **Next**
4. Sélectionne **Upload** → **Next**
5. Laisse toutes les options par défaut → **Next** → **Next**
6. Clique **Upload**

> L'upload prend 1-5 minutes. Xcode affiche "Upload Successful" à la fin.

---

## Étape 9 — Soumettre pour review

1. Va sur https://appstoreconnect.apple.com
2. Sélectionne **Updock** dans "Mes apps"
3. Clique sur **iOS App** dans le menu gauche
4. Tu verras le nouveau build apparaître sous **TestFlight** ou directement dans **Prêt à soumettre**
   - Si le build n'apparaît pas encore, attends 5-15 minutes (traitement Apple)
5. Clique sur **+** à côté de "Version iOS" pour créer une nouvelle version
6. Sélectionne le build uploadé
7. Remplis les **nouveautés de la version**
8. Clique **Ajouter à la review** puis **Soumettre à l'App Review**

> La review Apple prend généralement 1-3 jours.

---

## Étape bonus — Associated Domains (Universal Links)

> À faire une seule fois si pas encore fait — permet aux liens email d'ouvrir l'app directement.

1. Dans Xcode : cible **App** → onglet **Signing & Capabilities**
2. Clique **+ Capability** (bouton en haut à gauche de l'onglet)
3. Double-clique **Associated Domains**
4. Clique **+** dans la section Associated Domains et ajoute : `applinks:updock-app.vercel.app`
5. Rebuild et soumettre une nouvelle version

> Sans ça, les liens de confirmation email ouvrent Safari au lieu de l'app.

---

## Quand faire ça (et quand ne pas le faire)

| Changement | Rebuild iOS nécessaire ? |
|---|---|
| Modification du code web (JS/CSS/React) | Oui — toujours |
| Nouveau plugin Capacitor | Oui + `npx cap sync` |
| Modification de `capacitor.config.ts` | Oui |
| Modification des icônes / splash screen | Oui (`npx cap assets` d'abord) |
| Nouvelle permission (GPS, caméra, notifications...) | Oui (+ modifier `Info.plist`) |
| Changement Supabase / variables d'env | Oui (rebuild web inclus) |
| Hotfix CSS ou texte uniquement (web app) | Non — juste `git push` (Vercel) |

---

## Version actuelle
- Version : **1.1.3**
- Build : **5**
- Prochain déploiement → Version `1.1.4`, Build `6` (ou les numéros de ta prochaine version)
