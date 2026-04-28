"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AddTaskInput } from "@/components/add-task-input";
import { EmptyState } from "@/components/empty-state";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Sidebar } from "@/components/sidebar";
import { SmartListHeader } from "@/components/smart-list-header";
import { SuggestionsPanel } from "@/components/suggestions-panel";
import { TaskDetailPanel } from "@/components/task-detail-panel";
import { TaskListView } from "@/components/task-list-view";
import { Spinner } from "@/components/ui/spinner";
import type { ApiResponse, ListSummary, SuggestionDto, TaskDto } from "@/lib/types";
import type { FocusView } from "@/lib/view-config";
import { getViewMeta, getViewQuery } from "@/lib/view-config";

type AppShellProps = {
  view: FocusView;
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !json.success) {
    throw new Error(json.success ? "Request failed." : json.error.message);
  }

  return json.data;
}

export function AppShell({ view }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const meta = getViewMeta(view);
  const query = getViewQuery(view);

  const [lists, setLists] = React.useState<ListSummary[]>([]);
  const [tasks, setTasks] = React.useState<TaskDto[]>([]);
  const [selectedTask, setSelectedTask] = React.useState<TaskDto | null>(null);
  const [suggestions, setSuggestions] = React.useState<SuggestionDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const loadLists = React.useCallback(async () => {
    const data = await apiFetch<ListSummary[]>("/api/lists");
    setLists(data);
  }, []);

  const loadTasks = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (query.filter) params.set("filter", query.filter);
    if (query.listId) params.set("listId", query.listId);
    if (query.filter === "planned") {
      params.set("sort", "dueDate");
      params.set("order", "asc");
    }
    if (query.filter === "completed") {
      params.set("sort", "completedAt");
      params.set("order", "desc");
    }

    const data = await apiFetch<TaskDto[]>(`/api/tasks?${params.toString()}`);
    setTasks(data);

    setSelectedTask((current) => {
      if (!current) return null;
      const next = data.find((task) => task.id === current.id);
      return next ?? null;
    });
  }, [query.filter, query.listId]);

  const loadSuggestions = React.useCallback(async () => {
    if (view.type !== "smart" || view.key !== "my-day") {
      setSuggestions([]);
      return;
    }

    const data = await apiFetch<SuggestionDto[]>("/api/tasks/suggestions");
    setSuggestions(data);
  }, [view]);

  React.useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        setLoading(true);
        await Promise.all([loadLists(), loadTasks(), loadSuggestions()]);
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Không thể tải dữ liệu.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [loadLists, loadTasks, loadSuggestions]);

  const activeListId = view.type === "list" ? view.listId : null;
  const activeList = activeListId ? lists.find((list) => list.id === activeListId) : null;
  const headerTitle = view.type === "list" ? activeList?.name ?? "Danh sách" : meta.title;

  async function refreshTaskDetails(taskId: string) {
    setDetailLoading(true);
    try {
      const data = await apiFetch<TaskDto>(`/api/tasks/${taskId}`);
      setSelectedTask(data);
      setTasks((current) => current.map((task) => (task.id === data.id ? { ...task, ...data } : task)));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSelectTask(task: TaskDto) {
    setSelectedTask(task);
    await refreshTaskDetails(task.id);
  }

  async function handleCreateTask(title: string) {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { title };
      if (view.type === "list") {
        payload.listId = view.listId;
      } else if (view.key === "my-day") {
        payload.isMyDay = true;
      } else if (view.key === "important") {
        payload.isStarred = true;
      } else if (view.key === "planned") {
        payload.dueDate = new Date().toISOString();
      }

      const created = await apiFetch<TaskDto>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setTasks((current) => [created, ...current]);
      toast.success("Đã tạo task.");
      await loadLists();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo task.");
    } finally {
      setSubmitting(false);
    }
  }

  async function patchTask(taskId: string, payload: Record<string, unknown>) {
    const previousTasks = tasks;
    const previousSelected = selectedTask;

    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...payload } as TaskDto : task)),
    );
    setSelectedTask((current) => (current?.id === taskId ? ({ ...current, ...payload } as TaskDto) : current));

    try {
      const updated = await apiFetch<TaskDto>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
      setSelectedTask((current) => (current?.id === taskId ? updated : current));
      await Promise.all([loadLists(), loadTasks(), loadSuggestions()]);
    } catch (error) {
      setTasks(previousTasks);
      setSelectedTask(previousSelected);
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật task.");
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await apiFetch<null>(`/api/tasks/${taskId}`, { method: "DELETE" });
      setTasks((current) => current.filter((task) => task.id !== taskId));
      setSelectedTask((current) => (current?.id === taskId ? null : current));
      toast.success("Đã xóa task.");
      await Promise.all([loadLists(), loadSuggestions()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa task.");
    }
  }

  async function createList(payload: { name: string; color?: string | null }) {
    try {
      await apiFetch<ListSummary>("/api/lists", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Đã tạo danh sách.");
      await loadLists();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo danh sách.");
    }
  }

  async function updateList(id: string, payload: { name?: string; color?: string | null }) {
    try {
      await apiFetch<ListSummary>(`/api/lists/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      toast.success("Đã cập nhật danh sách.");
      await loadLists();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật danh sách.");
    }
  }

  async function deleteList(id: string, mode: "move-to-default" | "delete-tasks") {
    try {
      await apiFetch<null>(`/api/lists/${id}?mode=${mode}`, { method: "DELETE" });
      toast.success("Đã xóa danh sách.");
      if (view.type === "list" && view.listId === id) {
        router.push("/all");
      }
      await Promise.all([loadLists(), loadTasks()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa danh sách.");
    }
  }

  async function createSubtask(taskId: string, title: string) {
    try {
      await apiFetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      toast.success("Đã thêm subtask.");
      await Promise.all([refreshTaskDetails(taskId), loadTasks()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo subtask.");
    }
  }

  async function updateSubtask(subtaskId: string, payload: Record<string, unknown>) {
    try {
      await apiFetch(`/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (selectedTask) {
        await Promise.all([refreshTaskDetails(selectedTask.id), loadTasks()]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật subtask.");
    }
  }

  async function deleteSubtask(subtaskId: string) {
    try {
      await apiFetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" });
      toast.success("Đã xóa subtask.");
      if (selectedTask) {
        await Promise.all([refreshTaskDetails(selectedTask.id), loadTasks()]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa subtask.");
    }
  }

  const content = (
    <>
      <SmartListHeader
        title={headerTitle}
        subtitle={view.type === "list" ? meta.subtitle : meta.subtitle}
        viewKey={view.type === "list" ? "list" : meta.viewKey}
        count={tasks.length}
      />

      {view.type === "smart" && view.key === "my-day" ? (
        <SuggestionsPanel
          suggestions={suggestions}
          onAddToMyDay={(taskId) => void patchTask(taskId, { isMyDay: true })}
        />
      ) : null}

      <AddTaskInput
        loading={submitting}
        placeholder="Thêm task nhanh và nhấn Enter"
        onSubmit={handleCreateTask}
      />

      {loading ? (
        <div className="glass flex min-h-72 items-center justify-center rounded-[2rem]">
          <Spinner className="h-5 w-5" />
        </div>
      ) : tasks.length ? (
        <TaskListView
          tasks={tasks}
          selectedTaskId={selectedTask?.id}
          groupByPlanned={view.type === "smart" && view.key === "planned"}
          onToggleComplete={(task) => void patchTask(task.id, { isCompleted: !task.isCompleted })}
          onToggleStar={(task) => void patchTask(task.id, { isStarred: !task.isStarred })}
          onSelect={(task) => void handleSelectTask(task)}
        />
      ) : (
        <EmptyState title={meta.emptyTitle} description={meta.emptyDescription} />
      )}
    </>
  );

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mx-auto flex max-w-[1800px] gap-6">
        <Sidebar
          pathname={pathname}
          lists={lists}
          activeListId={activeListId}
          className="hidden lg:flex"
          onCreateList={createList}
          onUpdateList={updateList}
          onDeleteList={deleteList}
          onSelectList={(id) => router.push(`/lists/${id}`)}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <MobileSidebar
            title={headerTitle}
            pathname={pathname}
            lists={lists}
            activeListId={activeListId}
            onCreateList={createList}
            onUpdateList={updateList}
            onDeleteList={deleteList}
            onSelectList={(id) => {
              router.push(`/lists/${id}`);
            }}
          />
          {content}
        </div>

        <TaskDetailPanel
          task={selectedTask}
          lists={lists}
          loading={detailLoading}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={patchTask}
          onDeleteTask={handleDeleteTask}
          onCreateSubtask={createSubtask}
          onUpdateSubtask={updateSubtask}
          onDeleteSubtask={deleteSubtask}
        />
      </div>
    </div>
  );
}
