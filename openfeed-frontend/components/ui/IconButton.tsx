import { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

interface IconButtonProps extends ComponentProps<"button"> {
  "aria-label": string;
}

export function IconButton({ className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-md border-none bg-surface-sunken text-text-muted cursor-pointer select-none transition-all ease-soft duration-fast hover:bg-border hover:text-text active:opacity-70 disabled:opacity-40 disabled:pointer-events-none",
        className,
      )}
    />
  );
}
