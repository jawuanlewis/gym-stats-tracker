"use client";

import { useState } from "react";

import { Collapse } from "./motion";

/**
 * Whether to show a form's error. For a form that stays mounted after it is
 * closed — which, with `Collapse` and `Fade`, is every form — so the last
 * submit's error would otherwise still be showing when it is opened again.
 *
 * Whatever error is current while the form is closed gets dismissed. That
 * covers a cancel, and also a submit that fails after the form was already
 * closed. It remembers which result was dismissed rather than clearing
 * anything: the next submit returns a new state object, so a fresh error
 * shows as usual.
 */
export function useDismissibleError<State extends { error?: string }>(
  state: State,
  open: boolean,
): boolean {
  const [dismissed, setDismissed] = useState<State | null>(null);
  // Adjusting state during render, not in an effect: an effect would paint the
  // stale error for a frame first.
  if (!open && state.error && state !== dismissed) setDismissed(state);
  return open && Boolean(state.error) && state !== dismissed;
}

/**
 * A form's error line, folding open and closed. The message stays rendered
 * while it folds away, so it does not blank mid-animation.
 *
 * `className` carries the gap above the line (`pt-*`). Padding rather than the
 * parent's `space-y-*`, which would leave a gap around the folded line too —
 * so place this beside the element it follows, inside one wrapper.
 */
export function FormError({
  show,
  message,
  className = "",
}: Readonly<{
  show: boolean;
  message: string | undefined;
  className?: string;
}>) {
  return (
    <Collapse open={show}>
      <p className={`text-sm text-danger ${className}`}>{message}</p>
    </Collapse>
  );
}
