import React from "react";
import { cn } from "../../utils/cn";

const badgeVariants = {
  variant: {
    primary: "badge-primary",
    success: "badge-success",
    warning: "badge-warning", 
    error: "badge-error",
  },
};

const Badge = React.forwardRef(
  ({ className, variant = "primary", children, ...props }, ref) => {
    const classes = cn(
      "badge",
      badgeVariants.variant[variant],
      className
    );

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
