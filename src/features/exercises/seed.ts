import type { NewExercise } from "./types";

/**
 * Seeded from the original Google Sheet. The sheet tracked name + weight only,
 * so sets/reps start at a plain 3 × 10 and get corrected in the app.
 */
export const SEED_EXERCISES: NewExercise[] = [
  { name: "Shoulder Press", category: "upper", weight: 110, sets: [10, 10, 10] },
  { name: "Seated Row", category: "upper", weight: 205, sets: [10, 10, 10] },
  { name: "Ab Crunch", category: "upper", weight: 225, sets: [10, 10, 10] },
  { name: "Chest Press", category: "upper", weight: 165, sets: [10, 10, 10] },
  { name: "Lat Pulldown", category: "upper", weight: 200, sets: [10, 10, 10] },
  { name: "Tricep Press", category: "upper", weight: 225, sets: [10, 10, 10] },
  { name: "Front Pulldown", category: "upper", weight: 110, sets: [10, 10, 10] },
  { name: "Back Extension", category: "upper", weight: 200, sets: [10, 10, 10] },
  { name: "Leg Press", category: "lower", weight: 380, sets: [10, 10, 10] },
  { name: "Hip Abductor", category: "lower", weight: 165, sets: [10, 10, 10] },
  { name: "Hip Adductor", category: "lower", weight: 165, sets: [10, 10, 10] },
  { name: "Leg Extension", category: "lower", weight: 155, sets: [10, 10, 10] },
  { name: "Calf Extension", category: "lower", weight: 207.5, sets: [10, 10, 10] },
  { name: "Leg Curl", category: "lower", weight: 90, sets: [10, 10, 10] },
  { name: "Prone Leg Curl", category: "lower", weight: 120, sets: [10, 10, 10] },
  { name: "Glutes", category: "lower", weight: 90, sets: [10, 10, 10] },
];
