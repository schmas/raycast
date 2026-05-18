import fuzzysort from "fuzzysort";

/**
 * Prefix query with ' for exact (case-insensitive substring) matching.
 * Otherwise filters items by fuzzy match against the key field.
 * Returns all items if query is empty. Caller is responsible for ordering.
 */
export function fuzzySearch<T>(items: T[], query: string, key: keyof T): T[] {
  if (!query) return items;

  if (query.startsWith("'")) {
    const exact = query.slice(1).toLowerCase();
    if (!exact) return items;
    return items.filter((item) => String(item[key]).toLowerCase().includes(exact));
  }

  return fuzzysort.go(query, items, { key: key as string }).map((r) => r.obj);
}
