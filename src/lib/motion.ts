/**
 * The app has two speeds of motion, and only two.
 *
 * - Feedback: a control changing color under a tap. Tailwind's bare
 *   `transition-colors` (150ms) — nothing to import.
 * - Layout: something changing size or position — a section folding, a card
 *   making room for a drag handle. Slower, so the eye can follow where things
 *   went, and switched off for people who ask for reduced motion.
 *
 * `LAYOUT_TRANSITION` is the timing for the second kind. Pair it with a
 * `transition-*` class naming the properties that move, so every layout change
 * in the app runs on the same clock:
 *
 *   className={`transition-[width,opacity] ${LAYOUT_TRANSITION}`}
 *
 * For height, use `<Collapse>` rather than applying this by hand.
 */
export const LAYOUT_TRANSITION = "duration-300 ease-out motion-reduce:transition-none";
