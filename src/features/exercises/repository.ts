import "server-only";

import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { SEED_EXERCISES } from "./seed";
import type { Exercise, ExercisePatch, NewExercise } from "./types";

/**
 * The single seam between the app and its storage.
 *
 * Everything above this line (service, actions, components) is storage-agnostic,
 * so moving to Supabase means writing one more implementation of this interface
 * and reassigning `exerciseRepository` at the bottom of the file.
 */
export interface ExerciseRepository {
  list(): Promise<Exercise[]>;
  findById(id: string): Promise<Exercise | null>;
  findByName(name: string): Promise<Exercise | null>;
  create(input: NewExercise): Promise<Exercise>;
  update(id: string, patch: ExercisePatch): Promise<Exercise>;
  remove(id: string): Promise<void>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "exercises.json");

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

async function readAll(): Promise<Exercise[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Exercise[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const seeded = SEED_EXERCISES.map(toExercise);
    await writeAll(seeded);
    return seeded;
  }
}

async function writeAll(exercises: Exercise[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(exercises, null, 2), "utf8");
}

function toExercise(input: NewExercise): Exercise {
  const now = new Date().toISOString();
  return { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
}

/**
 * Local-development store: a JSON file on disk.
 *
 * Deliberately not production storage — it does not survive Vercel's read-only
 * filesystem. It exists so the UI runs against real, persistent data before the
 * Supabase project is wired up.
 */
const jsonFileRepository: ExerciseRepository = {
  async list() {
    return readAll();
  },

  async findById(id) {
    const all = await readAll();
    return all.find((exercise) => exercise.id === id) ?? null;
  },

  async findByName(name) {
    const all = await readAll();
    const target = normalizeName(name);
    return all.find((exercise) => normalizeName(exercise.name) === target) ?? null;
  },

  async create(input) {
    const all = await readAll();
    const created = toExercise(input);
    await writeAll([...all, created]);
    return created;
  },

  async update(id, patch) {
    const all = await readAll();
    const index = all.findIndex((exercise) => exercise.id === id);
    if (index === -1) throw new Error(`Exercise ${id} not found`);

    const updated: Exercise = {
      ...all[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    all[index] = updated;
    await writeAll(all);
    return updated;
  },

  async remove(id) {
    const all = await readAll();
    await writeAll(all.filter((exercise) => exercise.id !== id));
  },
};

export const exerciseRepository: ExerciseRepository = jsonFileRepository;
