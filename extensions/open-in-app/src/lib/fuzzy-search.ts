import fuzzysort from "fuzzysort";

const FRECENCY_BOOST = 3;

/**
 * Prefix query with ' for exact (case-insensitive substring) matching.
 * Otherwise fuzzy-ranks items by key field (best match first).
 * Returns all items if query is empty.
 */
export function fuzzySearch<T>(items: T[], query: string, key: keyof T, tiebreaker?: (item: T) => number): T[] {
  if (!query) return items;

  let scored: { obj: T; score: number }[];

  if (query.startsWith("'")) {
    const exact = query.slice(1).toLowerCase();
    if (!exact) return items;
    scored = items.filter((item) => String(item[key]).toLowerCase().includes(exact)).map((obj) => ({ obj, score: 0 }));
  } else {
    scored = fuzzysort.go(query, items, { key: key as string }).map((r) => ({ obj: r.obj, score: r.score }));
  }

  if (!tiebreaker) return scored.map((r) => r.obj);
  return scored
    .sort((a, b) => {
      const sa = a.score + tiebreaker(a.obj) * FRECENCY_BOOST;
      const sb = b.score + tiebreaker(b.obj) * FRECENCY_BOOST;
      return sb - sa;
    })
    .map((r) => r.obj);
}
