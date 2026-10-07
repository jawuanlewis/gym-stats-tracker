/**
 * Which category sections are collapsed, remembered per device in a cookie.
 *
 * A cookie rather than localStorage so the server can render a collapsed section
 * collapsed on first paint — no flash of the full list on every app open.
 *
 * Client-safe. Ids are plain strings, not `Category`, so user-defined categories
 * need no change here; they only have to stay cookie-safe tokens without the
 * separator (enum keys today, UUIDs later).
 */

export const COLLAPSED_CATEGORIES_COOKIE = "collapsed-categories";

const SEPARATOR = ".";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function parseCollapsedCategories(value: string | undefined): Set<string> {
  return new Set(value ? value.split(SEPARATOR).filter(Boolean) : []);
}

/** Browser only — call from an event handler. */
export function persistCategoryCollapsed(id: string, collapsed: boolean): void {
  const prefix = `${COLLAPSED_CATEGORIES_COOKIE}=`;
  const current = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);

  // Re-read rather than trusting React state: each section only knows about itself.
  const ids = parseCollapsedCategories(current);
  if (collapsed) ids.add(id);
  else ids.delete(id);

  document.cookie = `${prefix}${[...ids].join(SEPARATOR)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}
