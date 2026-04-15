import React from "react";
import { cn } from "../../utils/cn";

const Card = React.forwardRef(
  ({ className, hover = false, children, ...props }, ref) => {
    const classes = cn(
      "card",
      hover && "card-hover",
      className
    );

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const classes = cn("p-6 pb-4", className);
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const classes = cn("p-6 pt-0", className);
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const classes = cn("p-6 pt-0 border-t border-slate-200", className);
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardContent, CardFooter };
