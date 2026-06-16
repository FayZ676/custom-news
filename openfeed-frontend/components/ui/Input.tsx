import { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn("input-field", className)}
    />
  );
}
