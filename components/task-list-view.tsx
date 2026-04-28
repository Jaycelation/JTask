"use client";

import type { TaskDto } from "@/lib/types";
import { getPlannedGroupLabel } from "@/lib/date";
import { TaskItem } from "@/components/task-item";

type TaskListViewProps = {
  tasks: TaskDto[];
  selectedTaskId?: string | null;
  groupByPlanned?: boolean;
  onToggleComplete: (task: TaskDto) => void;
  onToggleStar: (task: TaskDto) => void;
  onSelect: (task: TaskDto) => void;
};

export function TaskListView({
  tasks,
  selectedTaskId,
  groupByPlanned,
  onToggleComplete,
  onToggleStar,
  onSelect,
}: TaskListViewProps) {
  if (!groupByPlanned) {
    return (
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            selected={selectedTaskId === task.id}
            onToggleComplete={onToggleComplete}
            onToggleStar={onToggleStar}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  const groups = tasks.reduce<Record<string, TaskDto[]>>((acc, task) => {
    const key = getPlannedGroupLabel(task.dueDate);
    acc[key] ??= [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {["Overdue", "Today", "Tomorrow", "Later"].map((group) =>
        groups[group]?.length ? (
          <section key={group}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {group}
            </h3>
            <div className="space-y-3">
              {groups[group].map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  selected={selectedTaskId === task.id}
                  onToggleComplete={onToggleComplete}
                  onToggleStar={onToggleStar}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
}
