import React from "react";
import { cn } from "../../utils/cn";

const Input = React.forwardRef(
  ({ className, type, error, disabled, ...props }, ref) => {
    const classes = cn(
      "input",
      error && "border-red-500 focus:ring-red-500",
      disabled && "bg-slate-100 text-slate-500 cursor-not-allowed",
      className
    );

    return (
      <input
        type={type}
        className={classes}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
