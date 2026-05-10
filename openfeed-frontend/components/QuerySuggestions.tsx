"use client";

interface QuerySuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function QuerySuggestions({
  suggestions,
  onSelect,
}: QuerySuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="inline-flex items-center text-sm text-left text-neutral-500 cursor-pointer font-bold underline hover:text-neutral-700 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export function QuerySuggestionsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-7 w-24" />
      ))}
    </div>
  );
}
