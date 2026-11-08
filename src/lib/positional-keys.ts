import { useState } from "react";

type State = { keys: number[]; next: number };

/**
 * Stable React keys for a list whose items have no identity of their own —
 * only a position, like an exercise's sets. An index key would make removing
 * set 2 look, to anything animating the list, like set 3 leaving while the
 * values above it change.
 *
 * Call `append` / `remove` in the same event handler as the change to the list
 * itself, so both land in one render. A length that changes any other way (a
 * failed optimistic update rolling back) is matched by adding or dropping keys
 * at the end.
 */
export function usePositionalKeys(length: number): {
  keys: number[];
  append: () => void;
  remove: (index: number) => void;
} {
  const [state, setState] = useState<State>(() => ({
    keys: Array.from({ length }, (_, index) => index),
    next: length,
  }));

  // Adjusted during render rather than in an effect, which would render one
  // frame with a key missing.
  let current = state;
  if (state.keys.length !== length) {
    current = resize(state, length);
    setState(current);
  }

  return {
    keys: current.keys,
    append: () => setState(({ keys, next }) => ({ keys: [...keys, next], next: next + 1 })),
    remove: (index) =>
      setState(({ keys, next }) => ({ keys: keys.filter((_, at) => at !== index), next })),
  };
}

function resize({ keys, next }: State, length: number): State {
  if (keys.length > length) return { keys: keys.slice(0, length), next };
  const added = Array.from({ length: length - keys.length }, (_, offset) => next + offset);
  return { keys: [...keys, ...added], next: next + added.length };
}
