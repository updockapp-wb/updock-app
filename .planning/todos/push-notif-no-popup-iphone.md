---
title: Push notifications ne s'affichent pas sur iPhone (TestFlight)
area: notifications
priority: high
captured: 2026-05-24
status: active
---

## Symptome
Session creee depuis le simulateur Mac, aucune notification push visible sur iPhone physique via TestFlight (v1.1.5).

## Contexte
- Webhook DB -> Edge Function fonctionne (HTTP 200)
- Edge Function `notify-session-created` deployee avec `--no-verify-jwt`
- Trigger `on_session_insert_notify` actif sur `public.sessions`
- Dernier test: "no recipients (all opted out)" -> verifier `notif_session_enabled` et `push_tokens`

## Pistes
1. Token FCM de l'iPhone pas enregistre dans `push_tokens`
2. `notif_session_enabled` a false pour l'utilisateur
3. L'utilisateur iPhone n'a pas le spot en favori
4. Permission notification pas accordee sur l'iPhone
5. Edge Function retourne 200 mais FCM echoue silencieusement
