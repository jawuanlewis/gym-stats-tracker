# Gym Stats Tracker

A mobile-first web app for tracking working weight, sets, and reps for every lift —
a replacement for the Google Sheet this started as.

Open it on your phone between sets, tap `+` on the weight, and move on. Weight steps
by 2.5 lb, reps by 1.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** — all colors are CSS custom properties, no hex values in components
- **Server Actions** for every mutation, with optimistic UI on the steppers
- **pnpm**
- Deploys to **Vercel**

## Getting started

```bash
pnpm install
pnpm dev
```

The app seeds itself on first run with the exercises from the original sheet.

```bash
pnpm format        # format everything
pnpm format:check  # verify without writing — for CI
pnpm lint
```

## Storage

Supabase (Postgres). The data layer sits behind a single `ExerciseRepository`
interface in `src/features/exercises/repository.ts` — service, actions, and
components have no idea where the data lives, so swapping stores means writing
another implementation and reassigning one export.

`sets` is a single `jsonb` column shaped `[{ "reps": 10, "weight": null }]`. A null
set weight means "inherit the exercise weight"; nothing writes a non-null value yet,
but per-set weight (drop sets) needs no migration because the shape already allows it.

Setup:

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the project URL and the
   **service_role** key from Project Settings → API.

The app starts empty — add your exercises through the UI.

## Architecture notes

- **Increments live in one place.** `src/lib/settings.ts` owns the step sizes.
  No component hardcodes `2.5`. When settings become user-editable, `getIncrements()`
  becomes a database read and nothing downstream changes.
- **Colors live in one place.** `src/app/globals.css` defines every color as a token
  under `:root, [data-theme="dark"]`. Light mode is a second block of the same
  variables plus a toggle — not a refactor.
- **Steppers are optimistic.** Each tap updates local state immediately and awaits the
  Server Action inside the same transition, so four quick taps on `+` land on `+10`
  rather than queueing behind round trips. Gym wifi is bad; this matters.
- **Duplicate names are rejected** case-insensitively, in the service layer and again
  as a unique index in the Postgres schema.

## Future Features

Deliberately out of scope for v1, but the code is shaped to accommodate them:

- **Settings configuration** — user-editable increment sizes (weight step, rep step),
  and a default sets/reps mode for new exercises
- **Theme toggle** — light/dark switching; dark navy is currently the only theme
- **Custom categories** — user-defined groupings beyond the built-in Upper/Lower,
  which needs UI design work around creating, ordering, and reassigning
- **Per-set weight** — drop sets, where each set carries its own weight instead of
  inheriting the exercise's
- **Progression history** — charts over time, backed by the `exercise_events` table
- **Auth** — the app is currently single-user with no login
