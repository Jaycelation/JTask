"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

export function Checkbox({ checked, onCheckedChange, className }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/40 bg-background/80 text-transparent hover:border-primary/60",
        className,
      )}
      aria-pressed={checked}
    >
      <Check className="h-3.5 w-3.5" />
    </button>
  );
}
