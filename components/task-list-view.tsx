"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { TaskItem } from "@/components/task-item";
import { Button } from "@/components/ui/button";
import { getPlannedGroupLabel } from "@/lib/date";
import type { TaskDto } from "@/lib/types";

type TaskListViewProps = {
  tasks: TaskDto[];
  selectedTaskId?: string | null;
  groupByPlanned?: boolean;
  completedOnly?: boolean;
  onToggleComplete: (task: TaskDto) => void;
  onToggleStar: (task: TaskDto) => void;
  onSelect: (task: TaskDto) => void;
};

function TaskCollection({
  tasks,
  selectedTaskId,
  onToggleComplete,
  onToggleStar,
  onSelect,
}: Omit<TaskListViewProps, "groupByPlanned" | "completedOnly">) {
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

export function TaskListView({
  tasks,
  selectedTaskId,
  groupByPlanned,
  completedOnly,
  onToggleComplete,
  onToggleStar,
  onSelect,
}: TaskListViewProps) {
  const [showCompleted, setShowCompleted] = React.useState(true);
  const activeTasks = tasks.filter((task) => !task.isCompleted);
  const completedTasks = tasks.filter((task) => task.isCompleted);

  if (completedOnly) {
    return (
      <TaskCollection
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        onToggleComplete={onToggleComplete}
        onToggleStar={onToggleStar}
        onSelect={onSelect}
      />
    );
  }

  if (!groupByPlanned) {
    return (
      <div className="space-y-6">
        <TaskCollection
          tasks={activeTasks}
          selectedTaskId={selectedTaskId}
          onToggleComplete={onToggleComplete}
          onToggleStar={onToggleStar}
          onSelect={onSelect}
        />

        {completedTasks.length ? (
          <section>
            <Button
              variant="ghost"
              className="mb-3 h-auto px-0 text-sm font-semibold text-muted-foreground"
              onClick={() => setShowCompleted((current) => !current)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showCompleted ? "" : "-rotate-90"}`} />
              Completed ({completedTasks.length})
            </Button>
            {showCompleted ? (
              <TaskCollection
                tasks={completedTasks}
                selectedTaskId={selectedTaskId}
                onToggleComplete={onToggleComplete}
                onToggleStar={onToggleStar}
                onSelect={onSelect}
              />
            ) : null}
          </section>
        ) : null}
      </div>
    );
  }

  const groups = activeTasks.reduce<Record<string, TaskDto[]>>((acc, task) => {
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
            <TaskCollection
              tasks={groups[group]}
              selectedTaskId={selectedTaskId}
              onToggleComplete={onToggleComplete}
              onToggleStar={onToggleStar}
              onSelect={onSelect}
            />
          </section>
        ) : null,
      )}

      {completedTasks.length ? (
        <section>
          <Button
            variant="ghost"
            className="mb-3 h-auto px-0 text-sm font-semibold text-muted-foreground"
            onClick={() => setShowCompleted((current) => !current)}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showCompleted ? "" : "-rotate-90"}`} />
            Completed ({completedTasks.length})
          </Button>
          {showCompleted ? (
            <TaskCollection
              tasks={completedTasks}
              selectedTaskId={selectedTaskId}
              onToggleComplete={onToggleComplete}
              onToggleStar={onToggleStar}
              onSelect={onSelect}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
