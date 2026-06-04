type ChipVariant = "solid" | "outlined";

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  onTap: () => void;
  active?: boolean;
}

export default function Chip({
  label,
  variant = "solid",
  onTap,
  active = false,
}: ChipProps) {
  const base =
    "inline-flex items-center gap-1 px-[11px] py-[5px] rounded-sm text-[11px] font-medium tracking-[0.04em] cursor-pointer transition-all duration-150 whitespace-nowrap select-none";

  const variantClass =
    variant === "outlined"
      ? "bg-transparent text-base-content border border-base-content"
      : active
        ? "bg-base-content text-base-100 border border-transparent"
        : "bg-base-200 text-base-content border border-transparent";

  return (
    <button onClick={onTap} className={`${base} ${variantClass}`}>
      {variant === "outlined" && <span className="text-xs">+</span>}
      {label}
    </button>
  );
}
