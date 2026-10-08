import { LAYOUT_TRANSITION } from "@/lib/motion";

/**
 * Eases its children between their natural height and zero.
 *
 * Animating a grid row between 0fr and 1fr is the way to transition to a
 * content-sized height without measuring it. `inert` stands in for `hidden`,
 * which cannot animate: it keeps folded content out of the tab order and the
 * accessibility tree. Children stay mounted, so they keep their state.
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
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
