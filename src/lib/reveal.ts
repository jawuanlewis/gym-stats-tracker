import { useEffect, useRef, type RefObject } from "react";

import { motionDuration } from "./motion";

/**
 * Something that opens in place grows downward, and near the bottom of the
 * screen it grows out of view: the page does not follow it on its own. Revealing
 * scrolls just far enough to bring its bottom edge on screen, and no further.
 *
 * It does not predict where the element will end up. Each frame of the opening
 * transition it nudges the page by however far the element has overflowed so
 * far, so the scroll runs on the same `--motion-*` clock as the growth itself,
 * nested folds and late growth (an error line) included, and reduced motion
 * needs no special case: the layout is already final on the first frame.
 *
 * It never scrolls up, never pushes the element's top off screen (a tall list
 * ends with its heading at the top, not its last item at the bottom), measures
 * against the visual viewport so an open keyboard counts as off screen, and
 * stops as soon as the user scrolls themselves.
 *
 * The keyboard opens on its own clock, often after the transition is over, so
 * while the element is open and a text field inside it has focus, `useReveal`
 * also reveals it again whenever the visible area shrinks.
 */

/** Breathing room kept between the revealed element and the screen edge — the page gutter. */
const MARGIN = 16;
/** Frames to keep following after the transition should have ended, for late layout. */
const SLACK_MS = 50;
/** Input that means the user has taken over scrolling. */
const USER_SCROLL_EVENTS = ["wheel", "touchstart"] as const;

/**
 * Keeps `element` scrolled into view while it grows. Returns a function that
 * stops early; it also stops by itself once the transition is over.
 */
export function revealWhileGrowing(element: HTMLElement): () => void {
  const end = performance.now() + motionDuration() + SLACK_MS;
  let frame = 0;

  function stop() {
    cancelAnimationFrame(frame);
    for (const type of USER_SCROLL_EVENTS) window.removeEventListener(type, stop);
  }

  function step(now: number) {
    scrollToShow(element);
    if (now < end) frame = requestAnimationFrame(step);
    else stop();
  }

  for (const type of USER_SCROLL_EVENTS) {
    window.addEventListener(type, stop, { passive: true });
  }
  frame = requestAnimationFrame(step);
  return stop;
}

/**
 * Reveals the element in `ref` each time `open` turns true. Not on mount: a
 * section that starts open was not opened by anyone, and must not move the page.
 *
 * While it is open, the on-screen keyboard coming up over a field inside it
 * reveals it again.
 */
export function useReveal(ref: RefObject<HTMLElement | null>, open: boolean): void {
  const wasOpen = useRef(open);

  useEffect(() => {
    const opened = open && !wasOpen.current;
    wasOpen.current = open;
    if (!opened || !ref.current) return;
    // Closing again mid-reveal stops it, rather than chasing a shrinking element.
    return revealWhileGrowing(ref.current);
  }, [ref, open]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !viewport) return;
    let lastHeight = viewport.height;

    // An arrow, not a function declaration: TypeScript keeps the null check
    // above inside an arrow, but not inside a hoisted declaration.
    const onResize = () => {
      const shrank = viewport.height < lastHeight;
      lastHeight = viewport.height;
      // Only a shrink, and only with a field focused: that is the keyboard. A
      // browser toolbar sliding away mid-scroll grows the viewport, and a focused
      // button opens no keyboard — reacting to either would yank the page.
      const element = ref.current;
      if (
        shrank &&
        element &&
        isTextEntry(document.activeElement) &&
        element.contains(document.activeElement)
      ) {
        scrollToShow(element);
      }
    };

    viewport.addEventListener("resize", onResize);
    return () => viewport.removeEventListener("resize", onResize);
  }, [ref, open]);
}

/** Whether focusing `element` brings up the on-screen keyboard. */
function isTextEntry(element: Element | null): boolean {
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLInputElement) {
    return !["button", "checkbox", "radio", "range", "reset", "submit", "hidden"].includes(
      element.type,
    );
  }
  return element instanceof HTMLElement && element.isContentEditable;
}

function scrollToShow(element: HTMLElement) {
  // getBoundingClientRect is relative to the layout viewport; the visual one is
  // what is actually visible, and is shorter while the on-screen keyboard is up.
  const viewTop = window.visualViewport?.offsetTop ?? 0;
  const viewHeight = window.visualViewport?.height ?? window.innerHeight;
  const { top, bottom } = element.getBoundingClientRect();

  const overflow = bottom - (viewTop + viewHeight - MARGIN);
  const roomAbove = top - (viewTop + MARGIN);
  const distance = Math.min(overflow, roomAbove);
  // Sub-pixel distances would scroll by a rounded zero forever; skip them.
  if (distance >= 1) window.scrollBy(0, distance);
}
