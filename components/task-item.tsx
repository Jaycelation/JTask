"use client";

import { Bell, CalendarDays, ChevronRight, RotateCw, Star } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { formatDateLabel, formatRecurrenceLabel, formatReminderLabel } from "@/lib/date";
import type { TaskDto } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskItemProps = {
  task: TaskDto;
  selected?: boolean;
  selectionMode?: boolean;
  multiSelected?: boolean;
  onToggleMultiSelect?: (task: TaskDto) => void;
  onToggleComplete: (task: TaskDto) => void;
  onToggleStar: (task: TaskDto) => void;
  onSelect: (task: TaskDto) => void;
};

export function TaskItem({
  task,
  selected,
  selectionMode,
  multiSelected,
  onToggleMultiSelect,
  onToggleComplete,
  onToggleStar,
  onSelect,
}: TaskItemProps) {
  return (
    <div
      className={cn(
        "group glass flex cursor-pointer items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5",
        (selected || multiSelected) && "ring-2 ring-primary/40",
      )}
      onClick={() => {
        if (selectionMode) {
          onToggleMultiSelect?.(task);
          return;
        }
        onSelect(task);
      }}
    >
      <Checkbox
        checked={selectionMode ? Boolean(multiSelected) : task.isCompleted}
        onCheckedChange={() => {
          if (selectionMode) {
            onToggleMultiSelect?.(task);
            return;
          }
          onToggleComplete(task);
        }}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate font-medium", task.isCompleted && "text-muted-foreground line-through")}>
          {task.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.list?.name ? <span>{task.list.name}</span> : null}
          {task.dueDate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-1">
              <CalendarDays className="h-3 w-3" />
              {formatDateLabel(task.dueDate)}
            </span>
          ) : null}
          {task.reminderAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
              <Bell className="h-3 w-3" />
              {formatReminderLabel(task.reminderAt)}
            </span>
          ) : null}
          {task.recurrencePattern !== "NONE" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-600 dark:text-emerald-300">
              <RotateCw className="h-3 w-3" />
              {formatRecurrenceLabel(task.recurrencePattern, task.recurrenceInterval)}
            </span>
          ) : null}
          {task._count?.subtasks ? <span>{task._count.subtasks} công việc con</span> : null}
        </div>
      </div>
      <button
        type="button"
        className={cn(
          "rounded-full p-2 transition-colors hover:bg-accent",
          task.isStarred ? "text-amber-400" : "text-muted-foreground",
          selectionMode && "pointer-events-none opacity-60",
        )}
        onClick={(event) => {
          event.stopPropagation();
          if (selectionMode) return;
          onToggleStar(task);
        }}
        aria-label="Đánh dấu quan trọng"
      >
        <Star className={cn("h-4 w-4", task.isStarred && "fill-current")} />
      </button>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
