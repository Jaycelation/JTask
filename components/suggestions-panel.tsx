"use client";

import { Lightbulb, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/date";
import type { SuggestionDto } from "@/lib/types";

type SuggestionsPanelProps = {
  suggestions: SuggestionDto[];
  onAddToMyDay: (taskId: string) => void;
};

export function SuggestionsPanel({ suggestions, onAddToMyDay }: SuggestionsPanelProps) {
  if (!suggestions.length) {
    return null;
  }

  return (
    <div className="glass rounded-[2rem] p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold">Suggestions</h2>
          <p className="text-sm text-muted-foreground">Các task đáng để đưa vào My Day.</p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((item) => (
          <div key={item.id} className="rounded-2xl border bg-background/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                {item.dueDate ? (
                  <p className="mt-2 text-xs text-primary">Hạn: {formatDateLabel(item.dueDate)}</p>
                ) : null}
              </div>
              <Button size="sm" variant="secondary" onClick={() => onAddToMyDay(item.id)}>
                <Plus className="h-4 w-4" />
                My Day
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
