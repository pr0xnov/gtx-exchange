import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted transition-colors",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
            error && "border-danger focus:border-danger focus:ring-danger",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
