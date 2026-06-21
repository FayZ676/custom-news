export function buildQueryFromClauses(
  all: string[],
  any: string[],
): string | null {
  const allPart = all.length > 0 ? all.join(" AND ") : null;
  const anyPart =
    any.length > 0
      ? any.length === 1
        ? any[0]
        : `(${any.join(" OR ")})`
      : null;
  if (allPart && anyPart) return `${allPart} AND ${anyPart}`;
  return allPart ?? anyPart ?? null;
}
