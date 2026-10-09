/**
 * Any change in what is on screen is animated — nothing snaps. The app has two
 * speeds of motion, and only two.
 *
 * - Feedback: a control changing color under a tap. Tailwind's bare
 *   `transition-colors` (150ms) — nothing to import.
 * - Layout: something appearing, disappearing, or changing size or position —
 *   a section folding, a card making room for a drag handle, a dialog opening.
 *   Slower, so the eye can follow where things went, and switched off for
 *   people who ask for reduced motion.
 *
 * `LAYOUT_TRANSITION` is the timing for the second kind. Pair it with a
 * `transition-*` class naming the properties that move, so every layout change
 * in the app runs on the same clock:
 *
 *   className={`transition-[width,opacity] ${LAYOUT_TRANSITION}`}
 *
 * Reach for a ready-made piece before applying it by hand:
 *
 * - `<Collapse>`, `<Fade>`, `<Stack>` (src/components/motion.tsx) — folding
 *   height, fading in place, and swapping one thing for another.
 * - `animate-enter` — a fade-in for content that replaced something by
 *   remounting (a `key` change), where keeping both mounted is not practical.
 * - `<dialog>` needs nothing: globals.css fades every one.
 *
 * The numbers themselves are the `--motion-*` variables in globals.css.
 */
export const LAYOUT_TRANSITION =
  "duration-(--motion-duration) ease-(--motion-ease) motion-reduce:transition-none";
