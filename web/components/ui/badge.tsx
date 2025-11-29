export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "accent";
}

function Badge({
  className = "",
  variant = "default",
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-bg-tertiary text-text-secondary border-border-default",
    success: "bg-success-muted text-success border-transparent",
    warning: "bg-warning-muted text-warning border-transparent",
    error: "bg-error-muted text-error border-transparent",
    accent: "bg-accent-muted text-accent border-transparent",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export { Badge };
