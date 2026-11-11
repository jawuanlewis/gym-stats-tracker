"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useOptimistic, useTransition } from "react";

import { Presence, PresenceItem, useIsPresent } from "@/components/presence";
import { LAYOUT_TRANSITION } from "@/lib/motion";
import type { Increments } from "@/lib/settings";

import { reorderExercisesAction } from "../actions";
import type { Exercise } from "../types";
import { useEditMode } from "./edit-mode";
import { ExerciseCard } from "./exercise-card";

/**
 * One category's exercises, reorderable by drag while the page is in edit mode.
 * Each list is its own drag context, so a card cannot leave its category.
 *
 * Renders bare `<li>`s — the surrounding `<ul>` belongs to the caller. Cards
 * fold in when added and out when deleted, so each carries its own gap below
 * (`pb-3`, see `<Presence>`); the `<ul>` cancels the last one with `-mb-3`.
 */
export function ExerciseList({
  exercises,
  increments,
}: Readonly<{
  exercises: Exercise[];
  increments: Increments;
}>) {
  const editing = useEditMode();
  // Same shape as every other mutation: show the new order now, then persist it.
  const [ordered, applyOrder] = useOptimistic(exercises, (state: Exercise[], ids: string[]) =>
    ids.flatMap((id) => state.find((exercise) => exercise.id === id) ?? []),
  );
  const [, startTransition] = useTransition();
  // Without a stable id, dnd-kit's generated aria ids differ between server and client.
  const dndId = useId();

  const sensors = useSensors(
    // No press delay needed: only the handle starts a drag, never the card itself.
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const ids = ordered.map((exercise) => exercise.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    startTransition(async () => {
      applyOrder(next);
      await reorderExercisesAction(next);
    });
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ordered} strategy={verticalListSortingStrategy}>
        {/* Keyed by id, so a reorder moves items rather than removing and re-adding them. */}
        <Presence wrap={false}>
          {ordered.map((exercise) => (
            <SortableExercise
              key={exercise.id}
              exercise={exercise}
              increments={increments}
              editing={editing}
            />
          ))}
        </Presence>
      </SortableContext>
    </DndContext>
  );
}

function SortableExercise({
  exercise,
  increments,
  editing,
}: Readonly<{
  exercise: Exercise;
  increments: Increments;
  editing: boolean;
}>) {
  const present = useIsPresent();
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.id,
    // A card folding away after deletion is no longer in the list: not a drop target.
    disabled: !editing || !present,
  });

  return (
    // The sortable node is the <li> itself, outside the fold's clip, or a dragged
    // card would be cut off at its own slot's edges. dnd-kit's inline `transition`
    // only exists mid-sort, when nothing is folding.
    <PresenceItem
      ref={setNodeRef}
      // Translate, not Transform: cards differ in height, and scaling would squash them.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "relative z-10" : ""}
    >
      <div className="flex items-center pb-3">
        {/*
        The drag ring is drawn inside the card's edge, over its border: the fold
        clips anything outside the card, and an inset box-shadow on this wrapper
        would sit under the card's own background.
      */}
        <div
          className={`relative min-w-0 flex-1 rounded-2xl after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-inset after:transition-shadow ${
            isDragging ? "after:ring-accent" : "after:ring-transparent"
          }`}
        >
          <ExerciseCard exercise={exercise} increments={increments} />
        </div>

        {/* Always mounted so the card can ease narrower and wider; inert while folded away. */}
        <div
          inert={!editing}
          className={`shrink-0 overflow-hidden transition-[width,opacity] ${LAYOUT_TRANSITION} ${
            editing ? "w-12 opacity-100" : "w-0 opacity-0"
          }`}
        >
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Reorder ${exercise.name}`}
            // touch-none: without it the browser claims the gesture as a scroll.
            className="ml-1 flex h-11 w-11 cursor-grab touch-none items-center justify-center rounded-full text-muted active:cursor-grabbing active:text-accent"
            {...attributes}
            {...listeners}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M3 5h10M3 8h10M3 11h10" />
            </svg>
          </button>
        </div>
      </div>
    </PresenceItem>
  );
}
