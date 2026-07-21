import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FormField({
  label,
  htmlFor,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-muted-foreground"> *</span> : null}
      </label>
      {children}
    </div>
  );
}
