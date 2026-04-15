import React from "react";
import { cn } from "../../utils/cn";

const buttonVariants = {
  variant: {
    primary: "btn-primary",
    secondary: "btn-secondary", 
    ghost: "btn-ghost",
  },
  size: {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  },
};

const Button = React.forwardRef(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    const classes = cn(
      "btn",
      buttonVariants.variant[variant],
      buttonVariants.size[size],
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    );

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
