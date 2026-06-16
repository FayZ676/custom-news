import { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("skeleton", className)} />;
}
