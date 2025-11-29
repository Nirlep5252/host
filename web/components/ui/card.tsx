import { forwardRef } from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-[--radius-md] border border-border-default bg-bg-secondary p-4 ${
          hoverable
            ? "transition-all duration-200 hover:border-border-subtle hover:bg-bg-tertiary"
            : ""
        } ${className}`}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`flex flex-col gap-1.5 ${className}`} {...props} />
));

CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
  <h3
    ref={ref}
    className={`font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary ${className}`}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", ...props }, ref) => (
  <p ref={ref} className={`text-sm text-text-secondary ${className}`} {...props} />
));

CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`pt-4 ${className}`} {...props} />
));

CardContent.displayName = "CardContent";

export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  subtext?: string;
}

const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  ({ className = "", label, value, subtext, ...props }, ref) => {
    return (
      <Card ref={ref} className={className} {...props}>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-text-muted">{label}</span>
          <span className="font-[family-name:var(--font-display)] text-3xl font-semibold text-text-primary">
            {value}
          </span>
          {subtext && (
            <span className="text-xs text-text-secondary">{subtext}</span>
          )}
        </div>
      </Card>
    );
  }
);

StatsCard.displayName = "StatsCard";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, StatsCard };
