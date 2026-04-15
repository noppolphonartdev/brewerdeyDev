import React, { useEffect } from "react";
import { cn } from "../../utils/cn";

const Modal = React.forwardRef(
  ({ isOpen, onClose, className, children, ...props }, ref) => {
    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[var(--z-modal)]">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div
            ref={ref}
            className={cn(
              "relative w-full max-w-md scale-in ui-surface max-h-[90vh] overflow-auto",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = "Modal";

const ModalHeader = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const classes = cn("p-6 pb-4", className);
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

ModalHeader.displayName = "ModalHeader";

const ModalContent = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const classes = cn("p-6 pt-0", className);
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

ModalContent.displayName = "ModalContent";

const ModalFooter = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const classes = cn("p-6 pt-0 border-t border-slate-200 flex gap-3 justify-end", className);
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

ModalFooter.displayName = "ModalFooter";

export { Modal, ModalHeader, ModalContent, ModalFooter };
