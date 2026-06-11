import { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "text";

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-soft",
  text: "btn-text",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={[variants[variant], className].filter(Boolean).join(" ")}
    />
  );
}
