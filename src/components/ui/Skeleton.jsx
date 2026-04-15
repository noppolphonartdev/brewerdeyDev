import React from "react";
import { cn } from "../../utils/cn";

const Skeleton = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "h-4 w-full",
      text: "h-4 w-full",
      circular: "h-12 w-12 rounded-full",
      rectangular: "h-24 w-full",
      card: "h-48 w-full rounded-xl",
      avatar: "h-10 w-10 rounded-full",
      button: "h-10 w-20 rounded-lg",
    };

    const classes = cn(
      "skeleton-shimmer rounded-md",
      variants[variant],
      className
    );

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
