import { AddExerciseForm } from "@/features/exercises/components/add-exercise-form";
import { ExerciseCard } from "@/features/exercises/components/exercise-card";
import { listExercises } from "@/features/exercises/service";
import { CATEGORIES, CATEGORY_LABELS } from "@/features/exercises/types";
import { getIncrements } from "@/lib/settings";

// The list changes on every mutation, so it is never a build-time static shell.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [exercises, increments] = await Promise.all([listExercises(), getIncrements()]);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Gym Stats</h1>
        <p className="mt-1 text-sm text-muted">
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"} tracked
        </p>
      </header>

      <div className="space-y-8">
        {exercises.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
            Nothing tracked yet. Add your first exercise below.
          </p>
        ) : null}

        {CATEGORIES.map((category) => {
          const inCategory = exercises.filter((exercise) => exercise.category === category);
          if (inCategory.length === 0) return null;

          return (
            <section key={category}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
                {CATEGORY_LABELS[category]}
              </h2>
              <ul className="space-y-3">
                {inCategory.map((exercise) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} increments={increments} />
                ))}
              </ul>
            </section>
          );
        })}

        <AddExerciseForm />
      </div>
    </main>
  );
}
