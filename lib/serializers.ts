import type { ListSummary, RecurrenceDay, RecurrencePattern, SubtaskDto, SuggestionDto, TaskDto } from "@/lib/types";

type ListRecord = {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { tasks: number };
};

type SubtaskRecord = {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  isStarred: boolean;
  isMyDay: boolean;
  dueDate: Date | null;
  reminderAt: Date | null;
  completedAt: Date | null;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval: number;
  recurrenceDays: RecurrenceDay[];
  recurringSourceId: string | null;
  listId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  list?: { id: string; name: string; color: string | null };
  subtasks?: SubtaskRecord[];
  _count?: { subtasks: number };
};

export function serializeList(list: ListRecord): ListSummary {
  return {
    id: list.id,
    name: list.name,
    color: list.color,
    taskCount: list._count?.tasks ?? 0,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  };
}

export function serializeSubtask(subtask: SubtaskRecord): SubtaskDto {
  return {
    id: subtask.id,
    title: subtask.title,
    isCompleted: subtask.isCompleted,
    createdAt: subtask.createdAt.toISOString(),
    updatedAt: subtask.updatedAt.toISOString(),
  };
}

export function serializeTask(task: TaskRecord): TaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    isCompleted: task.isCompleted,
    isStarred: task.isStarred,
    isMyDay: task.isMyDay,
    dueDate: task.dueDate?.toISOString() ?? null,
    reminderAt: task.reminderAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    recurrencePattern: task.recurrencePattern,
    recurrenceInterval: task.recurrenceInterval,
    recurrenceDays: task.recurrenceDays,
    recurringSourceId: task.recurringSourceId,
    listId: task.listId,
    userId: task.userId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    ...(task.list ? { list: task.list } : {}),
    ...(task.subtasks ? { subtasks: task.subtasks.map(serializeSubtask) } : {}),
    ...(task._count ? { _count: task._count } : {}),
  };
}

export function serializeSuggestion(suggestion: {
  id: string;
  title: string;
  reason: string;
  dueDate: Date | null;
  listId: string;
}): SuggestionDto {
  return {
    id: suggestion.id,
    title: suggestion.title,
    reason: suggestion.reason,
    dueDate: suggestion.dueDate?.toISOString() ?? null,
    listId: suggestion.listId,
  };
}
