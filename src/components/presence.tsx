"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type Key,
  type ReactElement,
} from "react";

import { motionDuration } from "@/lib/motion";

import { Collapse } from "./motion";

type Entry = {
  key: Key;
  element: ReactElement;
  /** False while it folds away after being removed. */
  present: boolean;
  /** Added after the list first rendered, so it grows in rather than just being there. */
  added: boolean;
};

/**
 * A list whose items fold in when added and out when removed, instead of
 * snapping. Pass keyed children as for any list; each is wrapped in a
 * `<Collapse as="li">`, so render it inside a `<ul>` and give it the row
 * content, not `<li>`s.
 *
 * A removed item stays rendered, closed and inert, until its fold finishes.
 * Keys must therefore be stable identities: an index key would make removing
 * the second item look like the last one leaving while the rest change.
 *
 * Space items with padding inside them, not `space-y-*` or `gap-*` on the
 * list: those leave a gap around an item that has folded to nothing.
 *
 * `wrap={false}` leaves the `<li>` to each child, which must then render a
 * `<PresenceItem>` as its root — for an item that needs the list item itself,
 * like a sortable card passing its node ref and drag transform.
 */
export function Presence({
  wrap = true,
  children,
}: Readonly<{ wrap?: boolean; children: React.ReactNode }>) {
  const [entries, setEntries] = useState<Entry[]>(() =>
    toElements(children).map((element) => ({
      key: element.key!,
      element,
      present: true,
      added: false,
    })),
  );
  const [source, setSource] = useState(children);

  // Merged during render, not in an effect, so a new item is in the very first
  // frame that shows it — @starting-style needs that frame to grow it from zero.
  let rendered = entries;
  if (source !== children) {
    rendered = merge(entries, toElements(children));
    setSource(children);
    setEntries(rendered);
  }

  // Drops folded-away items once their transition is over. Keyed on which
  // items are leaving, so a second removal restarts the wait for both.
  const leaving = rendered
    .filter((entry) => !entry.present)
    .map((entry) => String(entry.key))
    .join("\n");
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(
      () => setEntries((current) => current.filter((entry) => entry.present)),
      motionDuration(),
    );
    return () => clearTimeout(timer);
  }, [leaving]);

  return rendered.map((entry) => (
    <ItemContext key={entry.key} value={entry.present ? entry.added : null}>
      {wrap ? <PresenceItem>{entry.element}</PresenceItem> : entry.element}
    </ItemContext>
  ));
}

/**
 * Per item: whether it grows in on arrival (`added`), or `null` while it folds
 * away. A boolean rather than an object, so the context value is stable
 * across renders.
 */
const ItemContext = createContext<boolean | null | undefined>(undefined);

/**
 * The `<li>` that folds one `<Presence>` item in and out. Rendered for you
 * unless the list has `wrap={false}`; `ref`, `style` and `className` reach the
 * `<li>`.
 */
export function PresenceItem({
  ref,
  style,
  className,
  children,
}: Readonly<{
  ref?: React.RefCallback<HTMLElement>;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}>) {
  const state = useContext(ItemContext);
  if (state === undefined) throw new Error("PresenceItem is used outside <Presence>");
  return (
    <Collapse
      as="li"
      open={state !== null}
      appear={state === true}
      ref={ref}
      style={style}
      className={className}
    >
      {children}
    </Collapse>
  );
}

/** False while the surrounding `<Presence>` item is folding away after removal. */
export function useIsPresent(): boolean {
  return useContext(ItemContext) !== null;
}

function toElements(children: React.ReactNode): ReactElement[] {
  return Children.toArray(children).filter(isValidElement);
}

/**
 * The new children in order, with each removed item kept where it was: just
 * after whichever item preceded it before.
 */
function merge(previous: Entry[], next: ReactElement[]): Entry[] {
  const before = new Map(previous.map((entry) => [entry.key, entry]));
  const result: Entry[] = next.map((element) => ({
    key: element.key!,
    element,
    present: true,
    added: before.get(element.key!)?.added ?? true,
  }));

  const kept = new Set(result.map((entry) => entry.key));
  previous.forEach((entry, index) => {
    if (kept.has(entry.key)) return;
    const precedingKey = previous
      .slice(0, index)
      .findLast((candidate) => result.some((placed) => placed.key === candidate.key))?.key;
    const at = result.findIndex((placed) => placed.key === precedingKey) + 1;
    result.splice(at, 0, { ...entry, present: false });
  });
  return result;
}
