import { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "text";

const variants: Record<Variant, string> = {
  primary:
    "inline-flex items-center justify-center h-10 px-5 gap-2 font-sans text-sm font-medium cursor-pointer rounded-md bg-accent text-accent-foreground transition-opacity ease-soft duration-fast hover:opacity-80 active:opacity-70 disabled:opacity-40",
  secondary:
    "inline-flex items-center justify-center h-10 px-4 gap-2 font-sans text-sm font-medium cursor-pointer select-none whitespace-nowrap rounded-md border-none bg-surface-sunken text-text-muted transition-all ease-soft duration-fast hover:bg-border hover:text-text active:opacity-70 disabled:opacity-40 disabled:pointer-events-none data-[active=true]:bg-text data-[active=true]:text-surface",
  text: "cursor-pointer font-sans text-sm text-text-subtle underline-offset-2 transition-colors ease-soft duration-fast disabled:opacity-40 hover:text-text hover:underline",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(variants[variant], className)}
    />
  );
}
