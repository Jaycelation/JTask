"use client";

import { CalendarX2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateLabel } from "@/lib/date";

type DatePickerProps = {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
};

function toInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function DatePicker({ label, value, onChange }: DatePickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
          <CalendarX2 className="h-4 w-4" />
          Xóa
        </Button>
      </div>
      <Input
        type="date"
        value={toInputValue(value)}
        onChange={(event) => onChange(event.target.value ? new Date(event.target.value).toISOString() : null)}
      />
      <p className="text-xs text-muted-foreground">{formatDateLabel(value)}</p>
    </div>
  );
}
