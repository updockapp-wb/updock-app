# Phase 9: Community Stats - Research

**Researched:** 2026-04-15
**Domain:** Supabase aggregate queries, React UI components, i18n
**Confidence:** HIGH

## Summary

Phase 9 adds community statistics to the Profile tab. For authenticated users, a navigation row opens a dedicated CommunityStatsScreen showing total spots, total users, and spots-per-country. For anonymous users, two discreet metrics (total spots, total users) appear below the signup CTA.

The implementation is straightforward -- it reuses established Supabase query patterns (count queries with `head: true`), the existing Profile settings row visual style, and the overlay/modal pattern used by AdminDashboard. The main technical concern is the "spots by country" KPI: **no `country` column exists** in the `spots` table or `Spot` interface. This must be derived from GPS coordinates using reverse geocoding, or a `country` column must be added.

**Primary recommendation:** Add a `country` TEXT column to `spots` via a new migration, backfill it for existing DB spots using a lightweight reverse-geocoding approach (static spots already have country info in `spots.ts` comments), then use `GROUP BY country` for the per-country breakdown. Alternatively, derive country client-side from lat/lng using a static country-boundaries lookup (no API call needed).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Navigation row "Statistiques communaute" placed between Stats Grid and Settings section in Profile (authenticated)
- Style: white card, `rounded-3xl`, `border border-slate-100`, icon + label + ChevronRight
- Dedicated CommunityStatsScreen page with KPIs: total spots (validated), total users, spots by country (all countries with >= 1 spot)
- Anonymous screen: total spots + total users below "Creer un compte" button, subtle `text-slate-400` style
- Supabase direct queries from component (useEffect pattern), no dedicated context
- Spots by country: GROUP BY `country` on spots table, sorted descending by count
- Format spots by country: `[Flag emoji or country name] . N spots`

### Claude's Discretion
- Icon for the "Statistiques communaute" row (Globe or BarChart2 from lucide-react)
- Loading state handling (skeleton or spinner)
- Wording for page title ("Statistiques" vs "La communaute")
- Number formatting (thousand separator: `1 234` vs `1234`)
- Exact column name for country in spots table (must verify schema)

### Deferred Ideas (OUT OF SCOPE)
- Reviews and sessions in community KPIs
- Breakdown by difficulty/start type
- "Most popular spot" metric
- Personal advanced stats (rankings, badges)
</user_constraints>

## Critical Finding: No `country` Column in Spots Table

**Confidence: HIGH** (verified by reading all migrations + Spot interface + SpotsContext)

The `spots` table has columns: `id`, `name`, `description`, `type`, `lat`, `lng`, `difficulty`, `height`, `image_url`, `image_urls`, `is_approved`, `user_id`, `created_at`. There is **no `country` column**.

The `Spot` TypeScript interface also has no `country` field.

Static spots in `spots.ts` have country information only in code comments (`// --- FRANCE ---`), not as a data field.

### Recommended Approach: Derive Country from Coordinates Client-Side

Rather than adding a DB column + migration + backfill (which adds complexity and requires reverse geocoding API calls or manual data entry for existing spots), **derive the country client-side from lat/lng coordinates** using a lightweight approach:

**Option A (recommended): Reverse geocode with a static lookup library**
Use a library like `latlon-country` or `country-reverse-geocoding` that ships a bundled GeoJSON of country borders. No API calls, works offline, adds ~200-500KB to the bundle. This works for ALL spots (static + DB) without any schema change.

**Option B: Add `country` column to DB**
New migration adds `country TEXT` to `spots`, backfill existing rows. Problem: static spots (hardcoded in `spots.ts`) are not in the DB, so the country derivation must still happen client-side for them. The app merges static + DB spots.

**Recommendation: Option A** -- client-side derivation from coordinates. It handles both static and DB spots uniformly, requires no migration, no backfill, and no external API. The CommunityStatsScreen simply fetches all approved spots with their lat/lng, derives country for each, then aggregates.

However, since the CONTEXT.md says to query Supabase with `GROUP BY country`, the user may prefer Option B. **The planner should note this discrepancy and choose accordingly.** If Option B is chosen, static spots must either be excluded from the per-country breakdown or their country must be derived separately.

### Simplest Viable Approach

Given that this is a read-only stats page, the simplest approach that fully works:
1. Fetch all approved spots with `select('lat, lng')` from Supabase
2. Combine with static spots (already in memory via SpotsContext)
3. Derive country from lat/lng using a simple "point in polygon" check against a country boundaries dataset
4. Aggregate counts client-side

## Architecture Patterns

### Navigation Pattern: State-Driven Overlay

The app uses **no router** -- all navigation is state-driven in `App.tsx`. AdminDashboard is rendered as an overlay controlled by `isAdminOpen` state. CommunityStatsScreen should follow the same pattern:

1. Add `isCommunityStatsOpen` state to `Profile.tsx` (or lift to `App.tsx`)
2. CommunityStatsScreen renders as a full-screen overlay when open
3. Back button / X closes it

Since the CONTEXT.md specifies this is triggered from Profile and does not need cross-component state, **keep the state in Profile.tsx itself** (simpler than AdminDashboard which needs App.tsx because it selects spots on the map).

### Component Structure

```
src/components/
  Profile.tsx              -- Modified: add nav row + anonymous stats
  CommunityStatsScreen.tsx -- NEW: dedicated stats page
```

### Supabase Query Pattern (existing in Profile.tsx)

```typescript
// Count query pattern (already used for spotsCount)
supabase
  .from('spots')
  .select('id', { count: 'exact', head: true })
  .eq('is_approved', true)
  .then(({ count }) => setTotalSpots(count ?? 0));

// Profiles count
supabase
  .from('profiles')
  .select('id', { count: 'exact', head: true })
  .then(({ count }) => setTotalUsers(count ?? 0));
```

### Spots By Country Aggregation

For the per-country breakdown, fetch lat/lng of all approved spots and aggregate client-side:

```typescript
// Fetch coordinates
const { data } = await supabase
  .from('spots')
  .select('lat, lng')
  .eq('is_approved', true);

// Combine with static spots
const allPositions = [
  ...(data || []).map(s => ({ lat: s.lat, lng: s.lng })),
  ...staticSpots.map(s => ({ lat: s.position[0], lng: s.position[1] }))
];

// Derive country for each and aggregate
const countryCounts: Record<string, number> = {};
for (const pos of allPositions) {
  const country = getCountryFromCoords(pos.lat, pos.lng); // from lookup lib
  countryCounts[country] = (countryCounts[country] || 0) + 1;
}

// Sort descending
const sorted = Object.entries(countryCounts)
  .sort(([,a], [,b]) => b - a);
```

### Country Flag Emoji

Map ISO country codes to flag emojis using the regional indicator symbol technique:

```typescript
function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('');
}
// countryCodeToFlag('FR') => flag emoji
```

### Profile.tsx Insertion Point

The nav row goes between the Stats Grid (`mb-8` div at line 234) and the Settings header (`h3` at line 279). Specifically:
- After the `grid grid-cols-2` div (Spots Added / Favorites) which ends at line ~243
- After the Upcoming Sessions section (lines 246-276)
- Before the `<h3>` "Reglages" at line 279

### Anonymous Screen Insertion Point

In the `!user` branch (line 54-122), add metrics between the "Creer un compte" button (ends ~line 90) and the language toggle div (starts ~line 93).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Country from coordinates | Manual lat/lng range checks | `country-reverse-geocoding` npm package or inline static lookup table | Edge cases at borders, overseas territories, complex polygons |
| Flag emoji from country code | Manual emoji mapping | Simple 2-line function (regional indicator symbols) | Standard Unicode technique, trivial |
| Number formatting | Manual string manipulation | `Intl.NumberFormat` | Built-in, locale-aware, handles thousands separators |

**Note on country reverse geocoding:** For a small app with ~100 spots, a simple hardcoded mapping (lat/lng ranges per country) or even fetching from a small GeoJSON file is viable. A full npm package may be overkill. The planner should weigh bundle size.

**Simplest alternative:** Since the static spots already have country info in comments and the app currently has very few DB spots, the implementer could use a simple lookup table mapping known coordinate ranges to countries (e.g., lat 43-51, lng -5 to 8 = France). This is fragile but adequate for the current spot distribution. A proper library is better long-term.

## Common Pitfalls

### Pitfall 1: Static Spots Not in Supabase
**What goes wrong:** Count queries against Supabase miss the 10 static spots hardcoded in `spots.ts`.
**Why it happens:** The app merges static spots with DB spots in SpotsContext, but Supabase queries only see DB rows.
**How to avoid:** For total spots count, add static spots count to DB count. For spots-by-country, include static spot positions in the aggregation. Alternatively, query from SpotsContext which already has merged data.
**Warning signs:** Stats page shows fewer spots than visible on the map.

### Pitfall 2: `is_approved` vs `validated` Column Name
**What goes wrong:** CONTEXT.md mentions `eq('validated', true)` but the actual column is `is_approved`.
**Why it happens:** CONTEXT.md was written before verifying the schema.
**How to avoid:** Always use `is_approved` (verified in migrations and SpotsContext).
**Warning signs:** Supabase query errors or empty results.

### Pitfall 3: RLS Blocking Anon Count Queries
**What goes wrong:** Anonymous users cannot read spots count because RLS policies may not allow `anon` SELECT on spots.
**Why it happens:** The `003_anon_read_access.sql` migration only added anon policies for reviews, sessions, and session_attendees -- NOT for spots.
**How to avoid:** Check existing RLS on spots table. The spots table likely has a public SELECT policy already (spots are visible to everyone on the map). If not, add one.
**Warning signs:** Anonymous profile shows 0 spots / 0 users.

### Pitfall 4: Profiles RLS for Anon Count
**What goes wrong:** Profiles table has `"Public profiles are viewable by everyone"` policy but this uses `TO authenticated` vs `TO public`. Need to verify it allows anon.
**Why it happens:** Original policy wording says "everyone" but may only apply to authenticated role.
**How to avoid:** Verify the exact policy. If it says `FOR SELECT USING (true)` without a role restriction, it applies to all roles including anon.
**Warning signs:** Total users count returns 0 for anonymous users.

### Pitfall 5: Bundle Size from Country Library
**What goes wrong:** A full GeoJSON country boundaries library adds 500KB+ to the bundle.
**Why it happens:** Accurate country polygons are large datasets.
**How to avoid:** Use a simplified/low-resolution boundaries file, or use a minimal bounding-box approach for the ~20 countries likely to have spots.
**Warning signs:** Noticeably slower app load on mobile.

## Code Examples

### Settings Row Pattern (from Profile.tsx)

```typescript
// Existing pattern for settings rows (e.g., Language, Notifications, Premium)
<div
    onClick={() => setIsCommunityStatsOpen(true)}
    className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
>
    <div className="flex items-center gap-3 text-slate-700">
        <BarChart2 size={20} className="text-sky-500" />
        <span className="font-medium">{t('profile.community_stats')}</span>
    </div>
    <ChevronRight size={20} className="text-slate-300" />
</div>
```

### Supabase Count Query Pattern (from Profile.tsx line 36-41)

```typescript
// Already used for personal spots count
useEffect(() => {
    supabase
        .from('spots')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true)
        .then(({ count }) => setTotalSpots(count ?? 0));
}, []);
```

### Number Formatting

```typescript
// French locale: 1 234, English locale: 1,234
const formatNumber = (n: number, locale: string) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(n);
```

### Anonymous Stats Preview

```typescript
// Subtle metrics below signup CTA
<div className="flex items-center justify-center gap-4 mt-6">
    <span className="text-sm text-slate-400">
        {totalSpots} spots
    </span>
    <span className="text-slate-300">|</span>
    <span className="text-sm text-slate-400">
        {totalUsers} riders
    </span>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side aggregation (RPC/Edge Function) | Client-side count with `head: true` | Supabase v2 | No custom backend needed for simple counts |
| Custom number formatting | `Intl.NumberFormat` | ES2015+ | Built-in, locale-aware |

## Open Questions

1. **Country derivation strategy**
   - What we know: No `country` column exists in DB; static spots have no country field either
   - What's unclear: Does the user prefer a DB migration or client-side derivation?
   - Recommendation: Client-side derivation is simpler and handles both static + DB spots. Use a lightweight lookup. If the user later wants server-side aggregation, add the column then.

2. **RLS on spots for anon role**
   - What we know: Spots are visible on the map for anonymous users (Phase 5), so anon SELECT must work
   - What's unclear: Whether the existing spots RLS explicitly includes `anon` role or relies on no RLS / public policy
   - Recommendation: Planner should verify and add anon SELECT policy on spots if missing

3. **Static spots in counts**
   - What we know: 10 static spots exist in `spots.ts`, not in DB
   - What's unclear: Should they be included in community stats?
   - Recommendation: Include them -- they appear on the map, so excluding them from stats would be confusing. Use SpotsContext (which merges both) as the data source, supplemented by Supabase count for DB-only counts.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected (no test config files found) |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map

No formal requirement IDs assigned to Phase 9 yet. Based on CONTEXT.md decisions:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STATS-01 | Nav row visible between stats grid and settings | manual | Visual inspection | N/A |
| STATS-02 | CommunityStatsScreen shows 3 KPIs | manual | Visual inspection | N/A |
| STATS-03 | Anonymous screen shows 2 metrics | manual | Visual inspection | N/A |
| STATS-04 | Spots count matches approved spots | manual | Compare with map | N/A |
| STATS-05 | Country breakdown sums to total spots | manual | Visual inspection | N/A |

### Wave 0 Gaps
No test framework exists in this project. All validation is manual/visual. This is consistent with all prior phases.

## Sources

### Primary (HIGH confidence)
- `src/components/Profile.tsx` -- Existing UI structure, Supabase query patterns, settings row style
- `src/context/SpotsContext.tsx` -- Spot interface, DB-to-client mapping, static+DB merge logic
- `src/data/spots.ts` -- Spot interface definition, static spots data
- `supabase/migrations/*.sql` -- All table schemas, RLS policies, column definitions
- `src/App.tsx` -- Navigation pattern (state-driven, no router), overlay pattern

### Secondary (MEDIUM confidence)
- `src/translations/fr.json` + `en.json` -- Existing i18n key patterns

### Tertiary (LOW confidence)
- Country reverse geocoding library recommendations -- based on training data, not verified against npm registry

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- uses only existing libraries (Supabase, React, lucide-react, Intl)
- Architecture: HIGH -- follows exact patterns already established in the codebase
- Pitfalls: HIGH -- verified by reading actual code and migrations
- Country derivation: MEDIUM -- library choice needs validation at implementation time

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable domain, no fast-moving dependencies)
