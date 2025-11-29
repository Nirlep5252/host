"use client";

import { forwardRef } from "react";

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className = "", checked, defaultChecked, onChange, ...props }, ref) => {
    const isControlled = checked !== undefined;

    const handleClick = () => {
      if (onChange) {
        onChange(!checked);
      }
    };

    const isChecked = isControlled ? checked : undefined;

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isChecked}
        data-state={isChecked ? "checked" : "unchecked"}
        onClick={handleClick}
        className={`group relative h-6 w-11 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent data-[state=unchecked]:bg-bg-tertiary ${className}`}
        {...props}
      >
        <span
          className={`pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isChecked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };
