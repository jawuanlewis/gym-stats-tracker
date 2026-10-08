"use client";

import { createContext, useContext, useState } from "react";

/**
 * Edit mode is a page-wide switch: the toggle lives in the header while the
 * things it affects (drag handles on every card) live far below it, so the flag
 * travels by context instead of being threaded through the server page.
 */
const EditModeContext = createContext<{ editing: boolean; toggle: () => void } | null>(null);

export function EditModeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [editing, setEditing] = useState(false);
  return (
    <EditModeContext value={{ editing, toggle: () => setEditing((on) => !on) }}>
      {children}
    </EditModeContext>
  );
}

function useEditModeContext() {
  const context = useContext(EditModeContext);
  if (!context) throw new Error("Edit mode is used outside <EditModeProvider>");
  return context;
}

export function useEditMode(): boolean {
  return useEditModeContext().editing;
}

export function EditModeToggle() {
  const { editing, toggle } = useEditModeContext();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={editing}
      className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
        editing ? "border-accent text-accent" : "border-border text-muted"
      }`}
    >
      {editing ? "Done" : "Edit"}
    </button>
  );
}
