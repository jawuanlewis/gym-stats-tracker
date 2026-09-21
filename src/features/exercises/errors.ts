/**
 * Thrown when a write loses the race against the `exercises_name_unique` index.
 * The service layer's friendly check is a read-then-write, so the database is
 * what actually guarantees the rule.
 *
 * Lives in its own module so the repository interface and its implementation
 * do not have to import each other at runtime.
 */
export class DuplicateExerciseNameError extends Error {
  constructor(name: string) {
    super(`An exercise named "${name}" already exists.`);
    this.name = "DuplicateExerciseNameError";
  }
}
