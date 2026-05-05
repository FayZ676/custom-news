/**
 * Extracts potential entities/keywords from a user query.
 * Uses lightweight heuristics rather than GPT to keep queries fast.
 *
 * Extraction strategy:
 * 1. Capitalized words and sequences (likely proper nouns)
 * 2. Common technical terms and acronyms
 * 3. Quoted phrases
 */
export function extractQueryKeywords(query: string): string[] {
  const keywords: Set<string> = new Set();

  // Extract quoted phrases
  const quotedMatches = query.match(/"([^"]+)"/g);
  if (quotedMatches) {
    quotedMatches.forEach((match) => {
      const cleaned = match.replace(/"/g, "").trim();
      if (cleaned) keywords.add(cleaned);
    });
  }

  // Extract capitalized sequences (proper nouns)
  // Matches: "OpenAI", "New York", "GPT-4", "React Native", etc.
  const capitalizedSequence = /\b[A-Z][a-zA-Z0-9]*(?:[\s-][A-Z][a-zA-Z0-9]*)*\b/g;
  const capitalMatches = query.match(capitalizedSequence);
  if (capitalMatches) {
    capitalMatches.forEach((match) => {
      const cleaned = match.trim();
      // Filter out single-letter capitals and common short words
      if (cleaned.length > 1 && !['I', 'A'].includes(cleaned)) {
        keywords.add(cleaned);
      }
    });
  }

  // Extract acronyms (2+ consecutive capitals, optionally with numbers)
  const acronymPattern = /\b[A-Z]{2,}[0-9]*\b/g;
  const acronymMatches = query.match(acronymPattern);
  if (acronymMatches) {
    acronymMatches.forEach((match) => keywords.add(match));
  }

  // Extract common technical patterns
  // Version numbers with context: "Python 3.11", "Node.js", "C++", etc.
  const techPatterns = [
    /\b(?:Python|Java|JavaScript|TypeScript|Go|Rust|C\+\+|C#|Ruby|PHP)\s*[\d.]*\b/gi,
    /\b(?:Node\.js|React\.js|Vue\.js|Next\.js|Angular)\b/gi,
    /\b(?:AWS|GCP|Azure|Docker|Kubernetes|PostgreSQL|MySQL|MongoDB)\b/gi,
  ];

  techPatterns.forEach((pattern) => {
    const matches = query.match(pattern);
    if (matches) {
      matches.forEach((match) => keywords.add(match));
    }
  });

  return Array.from(keywords);
}
