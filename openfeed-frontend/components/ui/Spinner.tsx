import { cn } from "@/lib/utils/cn";

type SpinnerSize = "sm" | "md";

const sizes: Record<SpinnerSize, string> = {
  sm: "loading-sm",
  md: "",
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span className={cn("loading loading-spinner", sizes[size], className)} />
  );
}
