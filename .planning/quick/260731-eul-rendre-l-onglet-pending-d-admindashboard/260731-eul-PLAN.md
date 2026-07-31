---
phase: quick-260731-eul
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/translations/fr.json
  - src/translations/en.json
  - src/components/AdminDashboard.tsx
autonomous: false
requirements: [QUICK-EUL]
must_haves:
  truths:
    - "The Pending tab label and All Spots tab label render in the active language (fr/en), not hardcoded English"
    - "The Preview Modal shows Difficulté/Coordonnées/Description/Voir sur la carte/Approuver in the active language"
    - "The empty All-Spots message renders in the active language"
    - "Approve/Delete buttons on Pending cards and the 3 Preview Modal footer buttons are rendered via the DS Button component"
    - "The Pending card padding/radius matches the All Spots card (p-4 rounded-xl)"
    - "fr.json and en.json have strict key parity (identical key sets)"
  artifacts:
    - path: "src/translations/fr.json"
      provides: "5 new admin.* keys in French"
      contains: "admin.view_on_map"
    - path: "src/translations/en.json"
      provides: "5 new admin.* keys in English"
      contains: "admin.view_on_map"
    - path: "src/components/AdminDashboard.tsx"
      provides: "i18n-clean Pending tab + Preview Modal, DS Button migration, harmonized card padding"
      contains: "t('admin.tab_pending')"
  key_links:
    - from: "src/components/AdminDashboard.tsx"
      to: "src/translations/fr.json"
      via: "t('admin.*') lookups"
      pattern: "t\\('admin\\.(tab_pending|tab_all|no_spots|coordinates|view_on_map)'\\)"
    - from: "src/components/AdminDashboard.tsx"
      to: "src/ui/Button.tsx"
      via: "Button component import (already present, line 9)"
      pattern: "<Button"
---

<objective>
Make the AdminDashboard Pending tab and its Spot Preview Modal visually and linguistically
consistent with the rest of the app. Three concerns: (1) replace hardcoded fr/en strings with
i18n lookups, (2) migrate raw `<button>` elements to the DS `Button` component, (3) harmonize
the Pending card padding/radius to match the All Spots card.

Purpose: The Pending tab was never migrated in Phase 4 (04-05 covered the inline edit form and
the All Spots tab only). This closes the DS-coherence gap for the admin surface.
Output: 5 new i18n keys (fr + en with strict parity) and an updated AdminDashboard.tsx.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/todos/pending/2026-07-31-admindashboard-onglet-pending-non-migre-ds.md
@src/components/AdminDashboard.tsx
@src/ui/Button.tsx
@src/translations/fr.json
@src/translations/en.json

<interfaces>
<!-- DS Button contract (src/ui/Button.tsx) — use directly, no exploration needed. -->
<!-- variant ∈ primary | secondary | ghost | danger  (NO emerald, NO soft-rose variant exists) -->
<!-- size ∈ sm(py-2) | md(py-3) | lg(py-4)  ·  props: loading, disabled, iconOnly, aria-label, onClick, className, children -->
<!-- variant styles (verbatim):
     primary : bg-primary hover:bg-sky-400 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 active:scale-[0.98]
     danger  : bg-accent hover:bg-rose-600 text-white rounded-xl font-bold transition-colors  (bg-accent === rose-500)
   Button appends `${variantClasses} ${sizeClasses} flex items-center justify-center gap-2 disabled:opacity-50 ${className}`
   and prepends a <Loader2> spinner when loading=true.
   iconOnly WITHOUT aria-label logs a console.error — always pass aria-label for icon-only buttons. -->

<!-- t() is a plain lookup: `t: (key: string) => string`. NO variable interpolation.
     Counters stay concatenated in JSX: {t('admin.tab_pending')} ({pendingSpots.length}) -->

<!-- Existing keys to REUSE (do NOT duplicate):
     admin.approve = Valider / Approve
     admin.delete  = Supprimer / Delete
     spot.difficulty = Difficulté / Difficulty
     spot.desc     = Description / Description -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add 5 new admin.* i18n keys to fr.json and en.json with strict parity</name>
  <files>src/translations/fr.json, src/translations/en.json</files>
  <action>
    In BOTH src/translations/fr.json and src/translations/en.json, insert the following 5 keys
    immediately after the existing "admin.delete" line (currently line 76). Insert the SAME keys
    in the SAME order in both files so key parity holds:
      - admin.tab_pending  → fr "En attente"        / en "Pending"
      - admin.tab_all      → fr "Tous les spots"     / en "All Spots"
      - admin.no_spots     → fr "Aucun spot"         / en "No spots yet"
      - admin.coordinates  → fr "Coordonnées"        / en "Coordinates"
      - admin.view_on_map  → fr "Voir sur la carte"  / en "View on Map"
    Do NOT reuse spot.navigate for view_on_map — spot.navigate ("Y Aller"/"Start Navigation")
    means external Maps navigation, a different action. Keep valid JSON (trailing commas correct,
    no duplicate keys). Do not touch any other key.
  </action>
  <verify>
    <automated>node -e "const fr=require('./src/translations/fr.json'),en=require('./src/translations/en.json'); const need=['admin.tab_pending','admin.tab_all','admin.no_spots','admin.coordinates','admin.view_on_map']; const miss=need.filter(k=>!(k in fr)||!(k in en)); if(miss.length){console.error('MISSING',miss);process.exit(1)} const fk=Object.keys(fr).sort(),ek=Object.keys(en).sort(); if(JSON.stringify(fk)!==JSON.stringify(ek)){console.error('KEY PARITY MISMATCH');process.exit(1)} console.log('OK parity + 5 keys present')"</automated>
  </verify>
  <done>Both files are valid JSON, contain the 5 new keys with correct fr/en values, and have identical key sets (strict parity).</done>
</task>

<task type="auto">
  <name>Task 2: Replace hardcoded strings + harmonize Pending card padding in AdminDashboard.tsx</name>
  <files>src/components/AdminDashboard.tsx</files>
  <action>
    Apply these text replacements (leave all surrounding logic untouched):
      - Tabs: line ~90 `Pending ({pendingSpots.length})` → `{t('admin.tab_pending')} ({pendingSpots.length})`
      - Tabs: line ~101 `All Spots ({allSpots.length})` → `{t('admin.tab_all')} ({allSpots.length})`
      - All-Spots empty state: line ~182 `No spots yet` → `{t('admin.no_spots')}`
      - Preview Modal details grid: line ~413 `Difficulté` → `{t('spot.difficulty')}` (reuse existing key)
      - Preview Modal details grid: line ~417 `Coordonnées` → `{t('admin.coordinates')}`
      - Preview Modal: line ~426 `Description` → `{t('spot.desc')}` (reuse existing key)
      - Preview Modal footer: line ~443 `Voir sur la carte` → `{t('admin.view_on_map')}`
      - Preview Modal footer: line ~455 `Approuver` → `{t('admin.approve')}` (reuse existing key)
    Do NOT change line ~358 `Photos ({...})` (identical fr/en, intentionally left). Do NOT touch
    the `Pending` badge at line ~191 — it is inside the All Spots tab, which is OUT OF SCOPE.
    Do NOT touch the Edit Overlay (lines ~218-305) or handleSaveEdit — migrated in Phase 4.

    Padding harmonization: on the Pending card wrapper (line ~121) change ONLY `p-6` → `p-4` and
    `rounded-2xl` → `rounded-xl` so it matches the All Spots card (line ~187: `p-4 rounded-xl`).
    Keep the rest of the class list (flex flex-col gap-4 cursor-pointer hover:border-sky-300
    hover:shadow-md transition-all shadow-sm border border-slate-100) unchanged.
  </action>
  <verify>
    <automated>grep -n "Pending ({pendingSpots" src/components/AdminDashboard.tsx | grep -c . | grep -qx 0 && grep -n "All Spots ({allSpots" src/components/AdminDashboard.tsx | grep -c . | grep -qx 0 && ! grep -q ">Voir sur la carte<\|>Approuver<\|>Coordonnées<\|>No spots yet<" src/components/AdminDashboard.tsx && ! grep -q "p-6 rounded-2xl" src/components/AdminDashboard.tsx && echo "OK strings replaced + padding harmonized"</automated>
  </verify>
  <done>No target hardcoded strings remain in the Pending tab or Preview Modal; the Pending card uses p-4 rounded-xl; All Spots tab and Edit Overlay untouched.</done>
</task>

<task type="auto">
  <name>Task 3: Migrate the 5 raw buttons (Pending card + Preview Modal footer) to the DS Button</name>
  <files>src/components/AdminDashboard.tsx</files>
  <action>
    Migrate these raw `<button>` elements to `<Button>` (import already present, line 9). Preserve
    every existing onClick handler body byte-for-byte. Since no DS variant matches emerald or
    soft-rose, use `variant="danger"` as the structural base and override color via className with
    Tailwind `!` important modifiers (deterministic — beats the variant's bg/text). Use `size="md"`
    (py-3, matches the current py-3 buttons) unless noted.

    Pending card (lines ~149-171), inside the `onClick={(e) => e.stopPropagation()}` row:
      - Approve button → `<Button variant="danger" size="md" className="flex-1 !bg-emerald-500 hover:!bg-emerald-600" loading={actionLoadingId === spot.id} disabled={actionLoadingId === spot.id} onClick={<existing approve handler>}>` with children `<Check size={18} /> {t('admin.approve')}`. Button already renders a spinner when loading, so the old `? '...' :` text is no longer needed — children are just the icon + label.
      - Delete button → `<Button variant="danger" size="md" iconOnly aria-label={t('admin.delete')} disabled={actionLoadingId === spot.id} className="px-4 !bg-rose-50 hover:!bg-rose-100 !text-rose-500" onClick={<existing delete handler>}>` with child `<Trash2 size={18} />`.

    Preview Modal footer (lines ~434-467):
      - "Voir sur la carte" → `<Button variant="primary" size="md" className="flex-1" onClick={<existing onSpotSelect handler>}>` with children `<MapPin size={18} /> {t('admin.view_on_map')}`. (primary IS the sky button — clean match, no color override needed.)
      - "Approuver" → `<Button variant="danger" size="md" className="px-6 !bg-emerald-500 hover:!bg-emerald-600" onClick={<existing approve handler>}>` with children `<Check size={18} /> {t('admin.approve')}`.
      - Modal delete → `<Button variant="danger" size="md" iconOnly aria-label={t('admin.delete')} className="px-6" onClick={<existing delete handler>}>` with child `<Trash2 size={18} />`. (Solid rose = danger's native color, no override needed.)

    Do NOT migrate any other button: the header close, tab buttons, modal close (X), photo nav
    arrows, thumbnails, Edit Overlay buttons, and All Spots edit/delete buttons are OUT OF SCOPE.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -5 && grep -c "<Button" src/components/AdminDashboard.tsx | awk '{if($1>=6)print "OK "$1" Button usages"; else {print "FAIL only "$1; exit 1}}'</automated>
  </verify>
  <done>tsc + vite build pass; the 5 targeted raw buttons are now `<Button>` (approve/delete on Pending cards + 3 modal footer buttons); handlers preserved; no other buttons changed.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>i18n cleanup, DS Button migration, and padding harmonization on the AdminDashboard Pending tab + Spot Preview Modal.</what-built>
  <how-to-verify>
    1. Run `npm run dev`, open the app, go to Profile → Admin Dashboard.
    2. Pending tab: confirm the tab label, "All Spots" tab label, and card look match the language toggle (switch fr/en). Confirm Pending cards now have the tighter p-4 rounded-xl padding matching the All Spots cards.
    3. Confirm the green Approve button renders EMERALD (not rose) and the icon-only Delete button renders SOFT rose (bg-rose-50 / text-rose-500) — verifies the `!` important overrides won. Tap Approve on a test spot and confirm the loading spinner shows.
    4. Open a pending spot card → Spot Preview Modal. Confirm "Difficulté/Difficulty", "Coordonnées/Coordinates", "Description", and the footer "Voir sur la carte/View on Map" + "Approuver/Approve" all follow the active language.
    5. Footer buttons: "Voir sur la carte" = sky/blue, "Approuver" = emerald, delete icon = solid rose. All tappable and functional.
  </how-to-verify>
  <resume-signal>Type "approved" or describe any color/label/padding issue.</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` passes (tsc -b + vite build).
- `npm run lint` reports no new errors in AdminDashboard.tsx.
- fr.json / en.json valid JSON with strict key parity and 5 new admin.* keys.
- No hardcoded fr/en target strings remain in the Pending tab or Preview Modal.
- Human-check confirms emerald approve / soft-rose delete render correctly and labels follow language.
</verification>

<success_criteria>
- Pending tab and Preview Modal are fully bilingual via t() (no hardcoded fr/en strings in scope).
- The 5 targeted raw buttons use the DS Button component with handlers preserved.
- Pending card padding/radius matches the All Spots card (p-4 rounded-xl).
- All Spots tab, Edit Overlay, handleSaveEdit, and all other components untouched.
</success_criteria>

<output>
Create `.planning/quick/260731-eul-rendre-l-onglet-pending-d-admindashboard/260731-eul-SUMMARY.md` when done.
</output>
