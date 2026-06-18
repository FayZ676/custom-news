"use client";

import { useRef, useState } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}

export default function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const val = draft.trim().replace(/,+$/, "").trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div
      className="input-field h-auto flex flex-wrap gap-1.5 min-h-10.5 py-2 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-base-100 border border-base-300 text-base-content-2 text-sm font-medium"
        >
          {tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange(tags.filter((t) => t !== tag));
            }}
            aria-label={`Remove ${tag}`}
            className="text-muted hover:text-base-content leading-none"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="border-0 outline-none bg-transparent min-w-30 flex-1 text-sm p-0"
      />
    </div>
  );
}
