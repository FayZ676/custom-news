import { useEffect, useState } from "react";

interface SearchBarProps {
  onSearchQueryChange: (query: string) => void;
}

export default function SearchBar({
  onSearchQueryChange,
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearchQueryChange(searchValue.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [onSearchQueryChange, searchValue]);

  return (
    <input
      type="search"
      value={searchValue}
      onChange={(event) => setSearchValue(event.target.value)}
      placeholder="Search articles"
      className="w-full rounded-sm bg-base-200 border border-base-300 px-3 h-9.5 text-sm text-base-content placeholder:text-base-content-4 focus:outline-none focus:ring-1 focus:ring-base-content/35"
      aria-label="Search articles"
    />
  );
}
