interface ChipProps {
  label: string;
  active?: boolean;
  onTap: () => void;
}

export default function Chip({ label, active = false, onTap }: ChipProps) {
  return (
    <button onClick={onTap} data-active={active || undefined} className="btn-soft">
      {label}
    </button>
  );
}
