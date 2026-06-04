import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  onClear: () => void;
  showClear: boolean;
}

export default function SectionLabel({
  children,
  onClear,
  showClear,
}: SectionLabelProps) {
  return (
    <div className="flex justify-between items-baseline mb-[10px]">
      <span className="text-[9px] tracking-[0.12em] uppercase text-base-content/40">
        {children}
      </span>
      {showClear && (
        <button
          onClick={onClear}
          className="text-[9px] text-error bg-transparent border-none cursor-pointer p-0 tracking-[0.06em]"
        >
          Clear
        </button>
      )}
    </div>
  );
}
