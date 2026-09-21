<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Context - `gym-stats-tracker`

Mobile-first gym tracker: a list of exercises, each with a weight and per-set reps,
edited by tapping steppers. Replaces a Google Sheet. Single user, no auth.

> The heading above sits below the Next.js managed block because `next dev` rewrites
> that block at the top of this file on every run. Keep it that way.

## Architecture

Feature-foldered under `src/features/exercises/`, layered so storage is swappable:

```text
types.ts               shared types + MAX_SETS — client-safe, no server imports
format.ts              display formatting + roundValue — client-safe
errors.ts              DuplicateExerciseNameError (no deps, breaks an import cycle)
repository.ts          ExerciseRepository interface + the active impl (server-only)
repository.supabase.ts Supabase implementation + row mapping    (server-only)
service.ts             business rules: validation, dedupe, stepper math (server-only)
actions.ts             "use server" wrappers, each ending in refresh()
components/            client components
```

`src/lib/settings.ts` owns increment sizes (weight 2.5, reps 1) and minimums.

## Conventions

- **Never hardcode `2.5`** in a component. Read from `getIncrements()`, which is
  async today specifically so it can become a DB read when settings ship.
- **Never hardcode a color.** Every color is a CSS variable in `globals.css` under
  `:root, [data-theme="dark"]`. Light mode is a future second block.
- `types.ts` and `format.ts` must stay importable from client components — do not
  add server imports to them. `repository.ts` and `service.ts` carry `import
"server-only"` to enforce the other direction.
- Mutations follow one shape: optimistic patch, then `await` the Server Action, both
  inside the same `startTransition`. Read the _optimistic_ value when computing the
  next one, not the prop, or rapid taps drop increments.

## Tooling

`pnpm format` runs Prettier over the whole repo. SQL is covered by
`prettier-plugin-sql` (configured for the `postgresql` dialect, lowercase keywords
to match Supabase convention) — without that plugin Prettier silently skips `.sql`.
`public/*.svg` is in `.prettierignore`: Prettier has no SVG parser without
`@prettier/plugin-xml`, and those are unused Next.js scaffold assets anyway.

## Gotchas

- **`next build` generates the `LayoutProps` global type.** Running `tsc --noEmit` on
  a clean checkout fails with `Cannot find name 'LayoutProps'` until a build has run.
  That error is not a real type error; `pnpm build` runs TypeScript itself.
- **`refresh()` from `next/cache` is the Next 16 way** to re-render after a mutation
  from a Server Action. It only works inside Server Actions, not Route Handlers.
- **The page needs `export const dynamic = "force-dynamic"`.** Without it the list is
  prerendered as a static shell at build time, because nothing in it uses a dynamic
  API that Next tracks.
- **`numeric` arrives from PostgREST as an unquoted JSON number**, so `weight`
  needs no conversion; the `Number()` in the row mapping is a guard, not a fix.
  (The "numeric is a string" gotcha is real but belongs to node-postgres.)
- **The Supabase client is built lazily**, on first call rather than at module scope,
  so `next build` works on a machine with no credentials.
- **`findByName` compares in JS, not with `ilike`**, which would treat `%` and `_` in
  an exercise name as wildcards. The unique index is the real guarantee.
- **Server Actions are reachable by direct POST.** There is no auth today; if this
  ever gains a second user, every action in `actions.ts` needs an authorization check.
- **The preview tool resolves the `.claude/launch.json` in the parent workspace
  directory**, not this repo's. A `gym-stats-tracker` entry was added there.

## Product decisions

- Weight is per-exercise, reps are per-set. Per-set weight is deliberately deferred —
  `exercise_sets.weight` exists in the schema as the seam for it.
- The card summary collapses uniform reps to `3 × 10` and varied reps to `12 / 10 / 8`.
- Duplicate exercise names are rejected case-insensitively; the original sheet had
  drifted into two "Leg Extension" rows with different weights.
- Categories are a fixed `upper` / `lower` enum. User-defined categories are a known
  future feature — see README.
