"use client";

import { useState } from "react";

import { Collapse } from "@/components/motion";
import { LAYOUT_TRANSITION } from "@/lib/motion";

import { persistCategoryCollapsed } from "../collapsed-categories";

/**
 * A category heading that folds its exercises away. The list is hidden rather
 * than unmounted, so cards keep their expanded state and any in-flight
 * optimistic update while the section is closed.
 */
export function CategorySection({
  id,
  label,
  count,
  defaultCollapsed,
  children,
}: Readonly<{
  id: string;
  label: string;
  count: number;
  defaultCollapsed: boolean;
  children: React.ReactNode;
}>) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const listId = `category-list-${id}`;

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    persistCategoryCollapsed(id, next);
  }

  return (
    <section>
      <h2>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls={listId}
          // min-h-11: the whole row is the tap target, not just the caret.
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-xs font-semibold uppercase tracking-widest text-muted"
        >
          <span className="min-w-0 truncate">{label}</span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="font-normal tabular-nums tracking-normal">{count}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform ${LAYOUT_TRANSITION} ${collapsed ? "-rotate-90" : ""}`}
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </span>
        </button>
      </h2>
      <Collapse id={listId} open={!collapsed}>
        <ul className="mt-1 space-y-3">{children}</ul>
      </Collapse>
    </section>
  );
}
