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

The data layer sits behind a single `ExerciseRepository` interface in
`src/features/exercises/repository.ts`. Nothing above it — service, actions,
components — knows where the data lives.

Right now the only implementation is a JSON file at `.data/exercises.json`
(gitignored). It persists across restarts and makes local development real, but it
**will not work on Vercel**, whose filesystem is read-only.

Moving to Supabase means writing a second implementation of that interface and
reassigning `exerciseRepository` at the bottom of the file. The Postgres schema is
ready in [`supabase/schema.sql`](supabase/schema.sql) — it includes an append-only
`exercise_events` table so progression history starts accumulating before anything
reads it.

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
