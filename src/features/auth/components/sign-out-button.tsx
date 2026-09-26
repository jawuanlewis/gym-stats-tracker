import { signOutAction } from "../actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-lg border border-border px-3 py-2 text-xs text-muted transition-colors active:border-accent active:text-accent"
      >
        Sign out
      </button>
    </form>
  );
}
