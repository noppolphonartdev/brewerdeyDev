import React from "react";
import { cn } from "../../utils/cn";

const SectionHeader = React.forwardRef(
  ({ className, title, subtitle, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-center mb-12 reveal-up", className)}
        {...props}
      >
        {title && (
          <h2 className="text-3xl font-bold text-slate-900 mb-4 brand-gradient-text">
            {title}
          </h2>
        )}
        
        {subtitle && (
          <p className="text-lg font-medium text-slate-600 mb-2">
            {subtitle}
          </p>
        )}
        
        {description && (
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
        
        {children}
      </div>
    );
  }
);

SectionHeader.displayName = "SectionHeader";

export { SectionHeader };
