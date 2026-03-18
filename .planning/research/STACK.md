# Stack Research

**Domain:** Application mobile communautaire (spots pumpfoil) — ajout de profils, avis/notation, sessions programmées avec push notifications
**Researched:** 2026-03-18
**Confidence:** MEDIUM — stack existant HIGH confidence ; push notifications MEDIUM (configuration native non testée) ; sessions pattern LOW (peu de précédent direct)

---

## Contexte : Stack existant à conserver

L'app tourne sur React 19 + TypeScript 5.9 + Supabase 2.87 + Mapbox GL 2 + Capacitor 8 + Tailwind v4 + Framer Motion 12. **Aucun de ces choix n'est à remettre en cause.** La recherche porte uniquement sur les ajouts nécessaires pour les trois nouvelles fonctionnalités.

---

## Recommended Stack — Ajouts uniquement

### Push Notifications (fonctionnalité la plus risquée)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@capacitor-firebase/messaging` | 8.1.0 | Réception de push notifications sur iOS + Android | Seul plugin à retourner un **FCM token unifié** sur les deux plateformes. `@capacitor/push-notifications` retourne un token APNs natif (hexadécimal) sur iOS — inutilisable directement avec FCM. Maintenu activement par l'équipe Capawesome, aligne sur Capacitor 8.x. Confidence : MEDIUM |
| Firebase project (FCM) | N/A (service Google) | Transport des notifications iOS + Android | Couche de livraison incontournable : APNs (iOS) et FCM (Android) exigent chacun leur canal natif. Firebase unifie les deux derrière une seule API. Gratuit en dessous de millions de messages/mois. Confidence : HIGH |
| Supabase Edge Functions (Deno) | intégré Supabase | Envoi FCM côté serveur sur événement DB | Supabase recommande officiellement ce pattern : webhook DB → Edge Function → appel HTTP FCM v1 API. Pas de serveur dédié, coût zéro sur le tier gratuit, même backend que le reste. Confidence : HIGH |
| `firebase` (SDK web) | 11.x | Initialisation Firebase sur web uniquement | Requis par `@capacitor-firebase/messaging` pour la cible web. Sur native, le SDK natif Android/iOS est utilisé directement — **ne pas initialiser le JS SDK sur native**. Confidence : MEDIUM |

### Profils utilisateurs

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase (tables + RLS) | existant 2.87 | Stockage profil étendu | La table `profiles` existe déjà (`id`, `avatar_id`). Il suffit d'ajouter `display_name text`, `bio text`, `fcm_token text` par migration SQL. RLS existante à étendre. Pas de nouvelle dépendance. Confidence : HIGH |
| Supabase Storage | existant | Upload avatar personnalisé | Bucket `avatars` à créer si on sort des avatars prédéfinis. Pattern identique au bucket `spots` existant. Confidence : HIGH |

### Avis et notation des spots

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase (table `reviews`) | existant | Persistance des avis + notes | Nouvelle table PostgreSQL avec RLS (un avis par user par spot — contrainte UNIQUE). Pas de librairie externe nécessaire. Confidence : HIGH |
| `@supabase/supabase-js` | existant 2.87 | Realtime subscription pour afficher les nouveaux avis | Supabase Realtime sur INSERT de `reviews` permet l'affichage instantané des avis. SDK déjà présent. Confidence : HIGH |

### Sessions programmées

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase (table `sessions`) | existant | Persistance des sessions planifiées | Nouvelle table avec `spot_id`, `user_id`, `scheduled_at`, `created_at`. Pattern simple, cohérent avec la base existante. Confidence : HIGH |
| Supabase Edge Functions + DB Webhook | existant | Envoi push notification à l'heure de la session | Un webhook sur INSERT de `sessions` déclenche une Edge Function qui schedule l'envoi. Alternative : cron job Supabase (disponible sur plans payants). Confidence : MEDIUM |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | 3.x | Formatage dates sessions (heure locale, relative) | Pour afficher "dans 2h" ou "demain 14h30" sans alourdir le bundle. Préférer à `moment.js` (legacy, trop lourd) ou `dayjs` (bon aussi mais date-fns est déjà très standard en 2025). Confidence : HIGH |
| `react-hook-form` | 7.x | Formulaires profil + avis | L'app n'a pas de librairie de formulaire actuellement. react-hook-form est le standard 2025 pour React (uncontrolled, minimal re-renders, TypeScript natif). Alternatif : ne rien ajouter et gérer useState — acceptable pour 2-3 champs simples. Confidence : HIGH |

### Ce qu'il ne faut PAS ajouter

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@capacitor/push-notifications` (officiel Capacitor) | Retourne un token APNs natif hexadécimal sur iOS, pas un FCM token. Impossible à utiliser directement avec FCM sans couche supplémentaire. | `@capacitor-firebase/messaging` 8.1.0 |
| `@capacitor-community/fcm` | Nécessite d'être combiné avec `@capacitor/push-notifications` — double plugin, double complexité. Moins maintenu que la suite capawesome. | `@capacitor-firebase/messaging` 8.1.0 |
| Expo Notifications | Conçu pour Expo/React Native, pas pour Capacitor. Incompatible avec le build natif Xcode/Android Studio actuel. | Firebase FCM via `@capacitor-firebase/messaging` |
| OneSignal / Pusher / SendBird | Services tiers payants. Supabase Edge Functions + FCM couvrent le besoin à coût zéro. Ajoutent une dépendance externe non nécessaire. | Supabase Edge Functions + FCM |
| Redux / RTK | L'app utilise React Context — suffisant pour la taille du projet. Redux est un over-engineering majeur ici. | React Context existant, éventuellement Zustand si la complexité augmente |
| TanStack Query | Utile pour des apps avec beaucoup de fetching complex et cache invalidation. L'app fait du fetching simple via Supabase client. Alourdirait le bundle sans bénéfice net à ce stade. | `@supabase/supabase-js` avec `useEffect` + React Context (pattern existant) |

---

## Installation

```bash
# Push notifications
npm install @capacitor-firebase/messaging firebase
npx cap sync

# Formulaires (si adopté)
npm install react-hook-form

# Dates (si adopté)
npm install date-fns
```

---

## Architecture Push Notifications — Détail critique

La partie la plus complexe du milestone. Le pattern recommandé par Supabase (documentation officielle) :

```
1. App démarre → @capacitor-firebase/messaging.getToken() → FCM token
2. FCM token stocké en DB : profiles.fcm_token (UPDATE à chaque login)
3. Événement déclencheur (ex: INSERT dans sessions)
   → DB Webhook Supabase → Edge Function (Deno)
   → Edge Function lit le fcm_token du user cible
   → Appel HTTP POST à FCM v1 API (googleapis.com)
   → Notification livrée sur iOS/Android
```

Points de vigilance :
- **iOS** : Requiert une APNs Authentication Key (.p8) uploadée dans Firebase Console. Utiliser une clé d'auth (pas un certificat) — les certificats APNs expirent annuellement.
- **Android** : `google-services.json` à placer dans `android/app/`. Capacitor sync ne le copie pas automatiquement.
- **Foreground vs Background** : Les push notifications s'affichent différemment selon l'état de l'app. Sur iOS foreground, `@capacitor-firebase/messaging` expose `addListener('notificationReceived', ...)` pour afficher un toast in-app.
- **Permissions iOS** : Les utilisateurs doivent accepter explicitement (taux d'opt-in ~51%). Afficher la demande de permission dans un contexte pertinent (ex: au moment de planifier une session), pas au démarrage.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@capacitor-firebase/messaging` | `@capacitor/push-notifications` officiel | Si l'app ne cible QUE Android (FCM natif sans problème APNs) et ne veut pas dépendre de Firebase. Peu probable pour une app iOS/Android. |
| Supabase Edge Functions pour FCM | Cron job Supabase | Si les notifications doivent être envoyées exactement à l'heure programmée (pas à l'insertion). Le plan Supabase Free n'inclut pas les crons — à vérifier selon le plan actuel. |
| `date-fns` | `dayjs` | Si le bundle size est critique (dayjs ~2kb vs date-fns tree-shakable). Les deux sont valides. |
| `react-hook-form` | `useState` natif | Pour des formulaires très simples (1-2 champs). Le formulaire profil (nom + bio + avatar) ne justifie pas forcément react-hook-form. |

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@capacitor-firebase/messaging@8.1.0` | `@capacitor/core@8.0.0` | Versions majeures alignées — critique. La v7 du plugin est incompatible avec Capacitor 8. |
| `@capacitor-firebase/messaging@8.1.0` | `firebase@11.x` | Peer dependency déclarée. Ne pas utiliser firebase@9 ou firebase@10. |
| `@supabase/supabase-js@2.87` | Supabase Realtime | Compatible. Realtime est intégré au SDK 2.x. |
| `react-hook-form@7.x` | `react@19.x` | Compatible — react-hook-form 7 supporte React 18+. |

---

## Schéma DB à ajouter (résumé)

```sql
-- Extension profiles existante
ALTER TABLE profiles ADD COLUMN display_name TEXT;
ALTER TABLE profiles ADD COLUMN bio TEXT;
ALTER TABLE profiles ADD COLUMN fcm_token TEXT; -- token push notification

-- Nouveau : avis/notation
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (spot_id, user_id) -- un avis par user par spot
);

-- Nouveau : sessions programmées
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS à activer sur les deux tables (pattern identique aux tables existantes)
```

---

## Sources

- [Supabase Push Notifications Docs](https://supabase.com/docs/guides/functions/examples/push-notifications) — Architecture FCM + Edge Functions, pattern officiel — MEDIUM confidence (documentation officielle mais non testée sur codebase)
- [capawesome-team/capacitor-firebase README](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/messaging/README.md) — Version 8.1.0, compatibilité Capacitor 8, steps d'installation — HIGH confidence (dépôt officiel)
- [@capacitor/push-notifications docs v8](https://capacitorjs.com/docs/apis/push-notifications) — Limitations confirmées : pas de support Silent Push iOS, token APNs vs FCM token — HIGH confidence (docs officielles Capacitor)
- [Complete Guide to Capacitor Push Notifications - DEV.to](https://dev.to/saltorgil/the-complete-guide-to-capacitor-push-notifications-ios-android-firebase-bh4) — Comparaison des deux plugins, raison du choix @capacitor-firebase/messaging — MEDIUM confidence (article communautaire)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) — Subscriptions temps réel sur tables — HIGH confidence (docs officielles)
- [React State Management 2025 - DEV Community](https://dev.to/themachinepulse/do-you-need-state-management-in-2025-react-context-vs-zustand-vs-jotai-vs-redux-1ho) — Justification de ne pas ajouter Redux/TanStack Query — MEDIUM confidence (consensus communautaire)

---

*Stack research for: Updock — community features (profiles, reviews, scheduled sessions + push notifications)*
*Researched: 2026-03-18*
