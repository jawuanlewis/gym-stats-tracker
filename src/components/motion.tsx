import { LAYOUT_TRANSITION } from "@/lib/motion";

/**
 * The building blocks for every animated change of state in the app. See
 * src/lib/motion.ts for the rules they implement.
 *
 * All three keep their children mounted and use `inert` to take hidden content
 * out of the tab order, the accessibility tree and hit-testing — `hidden` and
 * unmounting cannot animate. Children therefore keep their state while hidden,
 * and must not rely on `autoFocus`, which would fire on page load.
 */

/**
 * Eases its children between their natural height and zero.
 *
 * Animating a grid row between 0fr and 1fr is the way to transition to a
 * content-sized height without measuring it.
 */
export function Collapse({
  open,
  id,
  children,
}: Readonly<{
  open: boolean;
  id?: string;
  children: React.ReactNode;
}>) {
  return (
    <div
      id={id}
      inert={!open}
      className={`grid transition-[grid-template-rows,opacity] ${LAYOUT_TRANSITION} ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      {/*
        clip, not hidden: `overflow: hidden` makes a scroll container, and
        focusing a field inside one that is still zero-height scrolls it — the
        content jumps up, then slides back down as the box grows. Unlike
        hidden, clip leaves the grid item's automatic minimum size in place,
        so both axes are zeroed by hand.
      */}
      <div className="min-h-0 min-w-0 overflow-clip">{children}</div>
    </div>
  );
}

/** Fades its children in and out without changing the space they take up. */
export function Fade({
  show,
  children,
}: Readonly<{
  show: boolean;
  children: React.ReactNode;
}>) {
  return (
    <div
      inert={!show}
      className={`transition-opacity ${LAYOUT_TRANSITION} ${show ? "opacity-100" : "opacity-0"}`}
    >
      {children}
    </div>
  );
}

/**
 * Lays its children on top of one another, for swapping one thing for another
 * in place. It is as tall as its tallest child, so:
 *
 * - two `<Fade>`s crossfade with no change in size, the space for the taller
 *   one being reserved up front;
 * - a `<Fade>` and a `<Collapse>` let the replacement grow out of the spot the
 *   original occupied, rather than pushing in from below it.
 *
 * `className` sets how children shorter than the stack are aligned, replacing
 * the top-aligned default — pass exactly one `items-*` class with it.
 */
export function Stack({
  className = "items-start",
  children,
}: Readonly<{
  className?: string;
  children: React.ReactNode;
}>) {
  return (
    // grid-cols-1 is minmax(0, 1fr): without it the column is as wide as its
    // widest child wants to be, and a form row can push the card off-screen.
    <div className={`grid grid-cols-1 *:col-start-1 *:row-start-1 ${className}`}>{children}</div>
  );
}
