# Checklist de déploiement Updock

---

## Après n'importe quel changement de code

### Site web (Vercel) — 2 min
```
git add .
git commit -m "description du changement"
git push
```
Vercel redéploie automatiquement. Vérifier sur https://updock-app.vercel.app

---

## Après un changement qui affecte l'app native (iOS / Android)

### 1. Builder le projet web
```
npm run build
```

### 2. Synchroniser Capacitor
```
npx cap sync
```
> Cette commande copie le build dans les projets iOS et Android ET met à jour les plugins natifs.

---

## Déploiement iOS (App Store)

### Prérequis : être sur Mac avec Xcode installé

1. `npx cap open ios` — ouvre Xcode
2. Incrémenter le numéro de version dans Xcode (Target → General → Version)
3. Sélectionner "Any iOS Device (arm64)" comme destination
4. Product → Archive
5. Dans l'Organizer → Distribute App → App Store Connect
6. Soumettre pour review sur https://appstoreconnect.apple.com

---

## Déploiement Android (Play Store)

### Prérequis : Android Studio installé

1. `npx cap open android` — ouvre Android Studio
2. Incrémenter `versionCode` et `versionName` dans `android/app/build.gradle`
3. Build → Generate Signed Bundle / APK → Android App Bundle (.aab)
4. Uploader le .aab sur https://play.google.com/console

---

## Changements qui nécessitent une action supplémentaire

| Changement | Action supplémentaire |
|---|---|
| Nouveau plugin Capacitor (`npm install @capacitor/xxx`) | `npx cap sync` obligatoire |
| Modification de `capacitor.config.ts` | `npx cap sync` + rebuild store |
| Modification des icônes / splash screen | `npx cap assets` puis `npx cap sync` |
| Modification de `Info.plist` (iOS) | Rebuild App Store uniquement |
| Nouvelle permission (caméra, GPS, etc.) | Rebuild les deux stores |
| Changement de Bundle ID | Tout reconfigurer (Supabase, Apple, Google) |

---

## Configuration Supabase (dashboard uniquement)

URL : https://supabase.com → ton projet → Authentication → URL Configuration

- **Site URL** : `https://updock-app.vercel.app`
- **Redirect URLs** : `https://updock-app.vercel.app`

> À mettre à jour si tu changes de domaine.

---

## Universal Links iOS — étape restante à faire sur Mac

1. Ouvrir le projet dans Xcode (`npx cap open ios`)
2. Target → Signing & Capabilities → **+ Capability** → Associated Domains
3. Ajouter : `applinks:updock-app.vercel.app`
4. Rebuild et soumettre une nouvelle version sur l'App Store

> Sans cette étape, les liens email ouvrent Safari au lieu de l'app.

---

## Numéro de version actuel
- App : `1.1.1` (défini dans `package.json` et dans Xcode/Android Studio)
- Penser à incrémenter à chaque soumission store.
