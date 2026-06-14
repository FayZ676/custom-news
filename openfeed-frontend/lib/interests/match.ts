import {
  normalizeNewsQueryPayload,
  type NewsQueryPayload,
} from "@/lib/interests/refine";

// ─── matchesQuery (pure, client-safe) ─────────────────────────────────────────
// The local-filter counterpart of payloadToParams: NewsData.io evaluates a
// NewsQueryPayload server-side, while RSS/Atom feeds (which aren't query-
// searchable) are filtered here against the SAME payload, so an interest means
// the same thing regardless of provider.
//
// The `q` syntax mirrors NewsData.io's: AND / OR / NOT, parentheses, and
// "quoted phrases". Bare space-separated terms default to AND. When `qInTitle`
// is set it is matched against the title only. `timeframe` (when present) bounds
// recency. `category`/`country` have no meaning for a fixed feed and are ignored.

export interface MatchableItem {
  title: string;
  summary: string | null;
  published_at?: string | null;
}

// ─── Boolean expression parsing ───────────────────────────────────────────────

type Token =
  | { type: "term"; value: string }
  | { type: "op"; value: "AND" | "OR" | "NOT" }
  | { type: "lparen" }
  | { type: "rparen" };

type Node =
  | { type: "term"; value: string }
  | { type: "and"; left: Node; right: Node }
  | { type: "or"; left: Node; right: Node }
  | { type: "not"; operand: Node };

function tokenize(query: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < query.length) {
    const ch = query[i];

    if (ch === " " || ch === "\t" || ch === "\n") {
      i += 1;
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i += 1;
      continue;
    }

    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i += 1;
      continue;
    }

    if (ch === '"') {
      // Quoted phrase — consume up to the closing quote (or end of string).
      const end = query.indexOf('"', i + 1);
      const phrase = end === -1 ? query.slice(i + 1) : query.slice(i + 1, end);
      const trimmed = phrase.trim();
      if (trimmed) tokens.push({ type: "term", value: trimmed.toLowerCase() });
      i = end === -1 ? query.length : end + 1;
      continue;
    }

    // Bare word: read until whitespace or a paren/quote.
    let j = i;
    while (j < query.length && !/[\s()"]/.test(query[j])) j += 1;
    const word = query.slice(i, j);
    i = j;

    const upper = word.toUpperCase();
    if (upper === "AND" || upper === "OR" || upper === "NOT") {
      tokens.push({ type: "op", value: upper });
    } else {
      tokens.push({ type: "term", value: word.toLowerCase() });
    }
  }

  return tokens;
}

// Recursive-descent parser with precedence NOT > AND > OR. Adjacent terms with
// no explicit operator are treated as AND (NewsData.io's implicit behaviour).
function parse(tokens: Token[]): Node | null {
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];

  function parsePrimary(): Node | null {
    const token = peek();
    if (!token) return null;

    if (token.type === "lparen") {
      pos += 1;
      const expr = parseOr();
      if (peek()?.type === "rparen") pos += 1;
      return expr;
    }

    if (token.type === "op" && token.value === "NOT") {
      pos += 1;
      const operand = parsePrimary();
      return operand ? { type: "not", operand } : null;
    }

    if (token.type === "term") {
      pos += 1;
      return { type: "term", value: token.value };
    }

    // Stray operator/paren — skip it so parsing can continue.
    pos += 1;
    return parsePrimary();
  }

  function startsOperand(token: Token | undefined): boolean {
    if (!token) return false;
    return (
      token.type === "term" ||
      token.type === "lparen" ||
      (token.type === "op" && token.value === "NOT")
    );
  }

  function parseAnd(): Node | null {
    let left = parsePrimary();
    if (!left) return null;

    while (true) {
      const token = peek();
      if (token?.type === "op" && token.value === "AND") {
        pos += 1;
        const right = parsePrimary();
        if (!right) break;
        left = { type: "and", left, right };
      } else if (startsOperand(token)) {
        // Implicit AND between adjacent operands.
        const right = parsePrimary();
        if (!right) break;
        left = { type: "and", left, right };
      } else {
        break;
      }
    }

    return left;
  }

  function parseOr(): Node | null {
    let left = parseAnd();
    if (!left) return null;

    while (peek()?.type === "op" && (peek() as { value: string }).value === "OR") {
      pos += 1;
      const right = parseAnd();
      if (!right) break;
      left = { type: "or", left, right };
    }

    return left;
  }

  return parseOr();
}

function evaluate(node: Node, haystack: string): boolean {
  switch (node.type) {
    case "term":
      return haystack.includes(node.value);
    case "and":
      return evaluate(node.left, haystack) && evaluate(node.right, haystack);
    case "or":
      return evaluate(node.left, haystack) || evaluate(node.right, haystack);
    case "not":
      return !evaluate(node.operand, haystack);
  }
}

function tokensFromQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Evaluate a single query string against text. Falls back to OR-matching the
// bare tokens if the expression can't be parsed, so a source never silently
// returns nothing.
function queryMatchesText(query: string, haystack: string): boolean {
  const ast = parse(tokenize(query));
  if (ast) return evaluate(ast, haystack);

  const tokens = tokensFromQuery(query);
  if (tokens.length === 0) return true;
  return tokens.some((token) => haystack.includes(token));
}

function withinTimeframe(
  timeframe: string,
  publishedAt: string | null | undefined,
): boolean {
  if (!publishedAt) return false;
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) return false;

  const minutesMatch = /^(\d+)m$/.exec(timeframe);
  const windowMs = minutesMatch
    ? Number(minutesMatch[1]) * 60_000
    : Number(timeframe) * 3_600_000;
  if (!Number.isFinite(windowMs) || windowMs <= 0) return true;

  return Date.now() - published <= windowMs;
}

export function matchesQuery(
  payload: NewsQueryPayload,
  item: MatchableItem,
): boolean {
  const normalized = normalizeNewsQueryPayload(payload);

  const title = (item.title ?? "").toLowerCase();
  const body = `${title} ${(item.summary ?? "").toLowerCase()}`;

  if (normalized.q && !queryMatchesText(normalized.q, body)) return false;
  if (normalized.qInTitle && !queryMatchesText(normalized.qInTitle, title)) {
    return false;
  }
  if (
    normalized.timeframe &&
    !withinTimeframe(normalized.timeframe, item.published_at)
  ) {
    return false;
  }

  return true;
}
