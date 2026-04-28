export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  total?: number;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type SmartFilter = "myday" | "important" | "planned" | "completed" | "all";

export type ListSummary = {
  id: string;
  name: string;
  color: string | null;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SubtaskDto = {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaskDto = {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  isStarred: boolean;
  isMyDay: boolean;
  dueDate: string | null;
  reminderAt: string | null;
  completedAt: string | null;
  listId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  list?: {
    id: string;
    name: string;
    color: string | null;
  };
  subtasks?: SubtaskDto[];
  _count?: {
    subtasks: number;
  };
};

export type SuggestionDto = {
  id: string;
  title: string;
  reason: string;
  dueDate: string | null;
  listId: string;
};

export type DashboardSummaryDto = {
  counts: {
    myDay: number;
    important: number;
    planned: number;
    all: number;
    completed: number;
  };
  hasAnyTasks: boolean;
};
