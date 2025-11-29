import { forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-10 rounded-[--radius-sm] border border-border-default bg-bg-secondary px-3 text-sm text-text-primary transition-all duration-150 placeholder:text-text-muted hover:border-border-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`rounded-[--radius-sm] border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary transition-all duration-150 placeholder:text-text-muted hover:border-border-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-muted ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Input, Textarea };
