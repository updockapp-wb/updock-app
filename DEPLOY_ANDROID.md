# Déploiement Android — Updock

> Fais ces étapes dans l'ordre. Ne saute rien.

---

## Étape 1 — Incrémenter la version

Ouvre `android/app/build.gradle` et modifie ces deux lignes :

```gradle
versionCode 5        ← toujours +1 (entier, ex: 5 → 6)
versionName "1.1.3"  ← version lisible (ex: "1.1.4")
```

> `versionCode` doit être strictement supérieur au précédent, sinon le Play Store refuse l'upload.
> Mets à jour aussi `"version"` dans `package.json` pour rester cohérent.

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

> Copie `dist/` dans le projet Android et met à jour les plugins natifs.
> À faire obligatoirement après chaque `npm run build`.

---

## Étape 4 — Ouvrir Android Studio

```bash
npx cap open android
```

> Ouvre Android Studio avec le bon projet. Attends que le chargement Gradle en bas de l'écran se termine (barre de progression disparaît) avant de continuer.

---

## Étape 5 — Générer le bundle signé

1. Dans la barre du haut : **Build → Generate Signed Bundle / APK...**
2. Sélectionne **Android App Bundle** → **Next**
3. **Key store path** : sélectionne ton fichier `.jks` (keystore)
   - Si tu ne l'as pas encore : clique **Create new...** et suis les instructions
4. Remplis **Key store password**, **Key alias**, **Key password** → **Next**
5. Sélectionne **release** → **Finish**

> Le bundle `.aab` est généré dans `android/app/release/app-release.aab`.
> Un toast "Bundle(s) generated successfully" s'affiche en bas à droite.

---

## Étape 6 — Uploader sur le Play Store

1. Va sur https://play.google.com/console
2. Sélectionne l'app **Updock**
3. Dans le menu gauche : **Production → Créer une nouvelle version**
   - (ou **Tests internes** si tu veux tester avant de publier)
4. Clique **Ajouter des AAB** et sélectionne le fichier `app-release.aab`
5. Remplis les **notes de version** (ce qui a changé)
6. Clique **Enregistrer** puis **Examiner la version**
7. Clique **Commencer le déploiement en production**

> La review Google prend généralement quelques heures à quelques jours.

---

## Quand faire ça (et quand ne pas le faire)

| Changement | Rebuild Android nécessaire ? |
|---|---|
| Modification du code web (JS/CSS/React) | Oui — toujours |
| Nouveau plugin Capacitor | Oui + `npx cap sync` |
| Modification de `capacitor.config.ts` | Oui |
| Modification des icônes | Oui (`npx cap assets` d'abord) |
| Nouvelle permission (GPS, caméra...) | Oui |
| Changement Supabase / variables d'env | Oui (rebuild web inclus) |
| Hotfix CSS ou texte uniquement (web app) | Non — juste `git push` (Vercel) |

---

## Version actuelle
- `versionCode` : **5**
- `versionName` : **1.1.3**
- Prochain déploiement → `versionCode 6`, `versionName "1.1.4"` (ou le numéro de ta prochaine version)
