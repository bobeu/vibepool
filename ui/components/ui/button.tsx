import * as React from "react";
import { cn } from "@/utils/format";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "white" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", type = "button", ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default: "brutal-btn-primary",
      primary: "brutal-btn-primary",
      secondary: "brutal-btn-secondary",
      white: "brutal-btn-white",
      outline: "brutal-btn bg-transparent text-foreground border-[3px] border-black",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          variants[variant],
          sizes[size],
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
