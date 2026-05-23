---
phase: quick
plan: 260523-tjv
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/AuthModal.tsx
  - src/translations/fr.json
  - src/translations/en.json
  - supabase/migrations/006_backfill_display_name_from_firstname.sql
autonomous: true
requirements: []
must_haves:
  truths:
    - "A l'inscription, le champ 'Nom d'affichage' est pre-rempli avec le prenom saisi"
    - "Le champ 'Nom d'affichage' est obligatoire a l'inscription"
    - "Le display_name est sauvegarde dans le profil a l'inscription"
    - "Les utilisateurs existants sans display_name recoivent leur prenom comme fallback"
  artifacts:
    - path: "src/components/AuthModal.tsx"
      provides: "Signup form with required display_name pre-filled from firstName"
    - path: "supabase/migrations/006_backfill_display_name_from_firstname.sql"
      provides: "Backfill migration for existing users"
  key_links:
    - from: "src/components/AuthModal.tsx"
      to: "profiles table"
      via: "supabase.from('profiles').upsert()"
      pattern: "display_name"
---

<objective>
Rendre le nom d'affichage (display_name) obligatoire a l'inscription, pre-rempli avec le prenom, et migrer les utilisateurs existants.

Purpose: Chaque utilisateur a un pseudo visible des l'inscription, avec le prenom comme valeur par defaut intuitive.
Output: AuthModal modifie + migration SQL de backfill.
</objective>

<execution_context>
@.planning/STATE.md
</execution_context>

<context>
@src/components/AuthModal.tsx
@src/translations/fr.json
@src/translations/en.json
@supabase/migrations/005_display_name_from_metadata.sql
</context>

<tasks>

<task type="auto">
  <name>Task 1: Champ display_name obligatoire et pre-rempli dans AuthModal</name>
  <files>src/components/AuthModal.tsx, src/translations/fr.json, src/translations/en.json</files>
  <action>
In AuthModal.tsx:

1. Replace the `username` state variable with `displayName` state. Initialize to empty string.

2. Add a useEffect that auto-fills displayName from firstName when displayName has not been manually edited by the user. Track manual edit with a useRef boolean `displayNameTouched`. When firstName changes AND displayNameTouched.current is false, set displayName to firstName. When the user types in the displayName field, set displayNameTouched.current to true.

3. Replace the "Pseudo" (username) input field with a "Nom d'affichage" (display_name) input field. Keep the same styling (User icon, rounded-xl, etc.). Use translation key `auth.display_name` for the label and `auth.placeholder_display_name` for placeholder. Mark as `required`.

4. In handleSubmit signup branch: change the metadata `username` to `display_name: displayName` in the signUp options.data. In the profiles upsert, change `display_name: username` to `display_name: displayName`.

5. Reset displayNameTouched.current to false inside the mode toggle (when switching between login/signup via setIsLogin).

In translation files:
- fr.json: Replace `"auth.username": "Pseudo"` with `"auth.display_name": "Nom d'affichage"`. Replace `"auth.placeholder_username": "CaptainDock"` with `"auth.placeholder_display_name": "CaptainDock"`. Remove the old username keys.
- en.json: Replace `"auth.username": "Username (Pseudo)"` with `"auth.display_name": "Display Name"`. Replace `"auth.placeholder_username": "CaptainDock"` with `"auth.placeholder_display_name": "CaptainDock"`. Remove the old username keys.
  </action>
  <verify>
    <automated>cd /Users/wandrillebasse/updock-app && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Le formulaire d'inscription affiche un champ "Nom d'affichage" obligatoire, pre-rempli avec le prenom. Le build TypeScript passe sans erreur.</done>
</task>

<task type="auto">
  <name>Task 2: Migration backfill display_name depuis first_name pour utilisateurs existants</name>
  <files>supabase/migrations/006_backfill_display_name_from_firstname.sql</files>
  <action>
Create a new migration file. This migration updates profiles where display_name is NULL or empty string, setting it to the first_name from auth.users raw_user_meta_data.

The SQL should:
1. UPDATE profiles p SET display_name = TRIM(u.raw_user_meta_data->>'first_name') FROM auth.users u WHERE p.id = u.id AND (p.display_name IS NULL OR TRIM(p.display_name) = '') AND NULLIF(TRIM(u.raw_user_meta_data->>'first_name'), '') IS NOT NULL.

2. Also update the handle_new_user trigger to use display_name as primary (instead of username), falling back to first_name: COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'display_name'), ''), NULLIF(TRIM(new.raw_user_meta_data->>'first_name'), ''))

This ensures new signups (which now send display_name in metadata instead of username) are handled correctly by the trigger, and the trigger also falls back to first_name if display_name is somehow missing.
  </action>
  <verify>
    <automated>test -f /Users/wandrillebasse/updock-app/supabase/migrations/006_backfill_display_name_from_firstname.sql && grep -q "display_name" /Users/wandrillebasse/updock-app/supabase/migrations/006_backfill_display_name_from_firstname.sql && echo "OK"</automated>
  </verify>
  <done>Migration SQL prete a etre appliquee. Le backfill cible les profils sans display_name et le trigger est mis a jour pour utiliser le champ display_name des metadata.</done>
</task>

</tasks>

<verification>
1. TypeScript build passes: `npx tsc --noEmit`
2. AuthModal shows "Nom d'affichage" field pre-filled from first name on signup
3. Migration file exists and contains correct UPDATE + trigger logic
</verification>

<success_criteria>
- Le champ "Nom d'affichage" apparait dans le formulaire d'inscription, pre-rempli avec le prenom
- Le champ est obligatoire (attribut `required`)
- Le display_name est envoye dans les metadata Supabase et upsert dans profiles
- La migration backfill les utilisateurs existants sans display_name
- Le trigger handle_new_user est mis a jour pour lire display_name au lieu de username
</success_criteria>

<output>
Create `.planning/quick/260523-tjv-affichage-du-pr-nom-comme-pseudo-par-d-f/260523-tjv-SUMMARY.md` when done
</output>
