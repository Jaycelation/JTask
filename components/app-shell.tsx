"use client";

import * as React from "react";
import { Bell, CheckSquare, LogOut, Search, Sparkles, Trash2, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { toast } from "sonner";

import { AddTaskInput } from "@/components/add-task-input";
import { AuthScreen } from "@/components/auth-screen";
import { EmptyState } from "@/components/empty-state";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { OnboardingCard } from "@/components/onboarding-card";
import { Sidebar } from "@/components/sidebar";
import { SmartListHeader } from "@/components/smart-list-header";
import { SuggestionsPanel } from "@/components/suggestions-panel";
import { TaskDetailPanel } from "@/components/task-detail-panel";
import { TaskListView } from "@/components/task-list-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type {
  ApiResponse,
  DashboardSummaryDto,
  DemoSeedResult,
  ListSummary,
  SessionUserDto,
  SuggestionDto,
  TaskDto,
} from "@/lib/types";
import type { FocusView } from "@/lib/view-config";
import { getViewMeta, getViewQuery } from "@/lib/view-config";

type AppShellProps = {
  view: FocusView;
};

type StatusChip = "all" | "active" | "completed";

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

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

export function AppShell({ view }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const meta = getViewMeta(view);
  const query = getViewQuery(view);
  const [isRouting, startTransition] = React.useTransition();

  const searchRef = React.useRef<HTMLInputElement>(null);
  const quickAddRef = React.useRef<HTMLInputElement>(null);

  const [user, setUser] = React.useState<SessionUserDto | null>(null);
  const [sessionLoading, setSessionLoading] = React.useState(true);
  const [authSubmitting, setAuthSubmitting] = React.useState(false);

  const [lists, setLists] = React.useState<ListSummary[]>([]);
  const [summary, setSummary] = React.useState<DashboardSummaryDto | null>(null);
  const [tasks, setTasks] = React.useState<TaskDto[]>([]);
  const [selectedTask, setSelectedTask] = React.useState<TaskDto | null>(null);
  const [suggestions, setSuggestions] = React.useState<SuggestionDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [seedingDemo, setSeedingDemo] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusChip>("all");
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);
  const deferredSearch = React.useDeferredValue(search);

  const loadSession = React.useCallback(async () => {
    try {
      const current = await apiFetch<SessionUserDto>("/api/auth/session");
      setUser(current);
      return current;
    } catch {
      setUser(null);
      return null;
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const loadLists = React.useCallback(async () => {
    const data = await apiFetch<ListSummary[]>("/api/lists");
    setLists(data);
  }, []);

  const loadSummary = React.useCallback(async () => {
    const data = await apiFetch<DashboardSummaryDto>("/api/summary");
    setSummary(data);
  }, []);

  const loadTasks = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (query.filter) params.set("filter", query.filter);
    if (query.listId) params.set("listId", query.listId);
    if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
    if (view.type !== "smart" || view.key !== "completed") {
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
    }
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
  }, [deferredSearch, query.filter, query.listId, statusFilter, view]);

  const loadSuggestions = React.useCallback(async () => {
    if (view.type !== "smart" || view.key !== "my-day") {
      setSuggestions([]);
      return;
    }

    const data = await apiFetch<SuggestionDto[]>("/api/tasks/suggestions");
    setSuggestions(data);
  }, [view]);

  const refreshAll = React.useCallback(async () => {
    await Promise.all([loadLists(), loadSummary(), loadTasks(), loadSuggestions()]);
  }, [loadLists, loadSummary, loadTasks, loadSuggestions]);

  React.useEffect(() => {
    let active = true;

    async function bootstrap() {
      const currentUser = await loadSession();
      if (!active || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await refreshAll();
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
  }, [loadSession, refreshAll]);

  React.useEffect(() => {
    setStatusFilter(view.type === "smart" && view.key === "completed" ? "completed" : "all");
    setSelectionMode(false);
    setSelectedTaskIds([]);
  }, [view]);

  React.useEffect(() => {
    if (!user) return;

    async function pollDueReminders() {
      try {
        const due = await apiFetch<TaskDto[]>("/api/reminders/due");
        const seen = new Set<string>(JSON.parse(window.localStorage.getItem("focusflow_seen_reminders") ?? "[]"));
        const unseen = due.filter((task) => !seen.has(task.id));

        unseen.forEach((task) => {
          seen.add(task.id);
          toast(task.title, {
            description: task.reminderAt ? `Nhắc nhở đến hạn: ${new Date(task.reminderAt).toLocaleString("vi-VN")}` : "Đã đến lúc xử lý task này.",
            action: {
              label: "Mở",
              onClick: () => {
                void handleSelectTask(task);
              },
            },
          });

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("FocusFlow Reminder", {
              body: task.title,
            });
          }
        });

        window.localStorage.setItem("focusflow_seen_reminders", JSON.stringify(Array.from(seen)));
      } catch {
        // Ignore reminder polling failures to keep the main UI responsive.
      }
    }

    void pollDueReminders();
    const interval = window.setInterval(() => {
      void pollDueReminders();
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [user]);

  React.useEffect(() => {
    if (!user) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (event.key.toLowerCase() === "n" && !isEditableTarget(event.target)) {
        event.preventDefault();
        quickAddRef.current?.focus();
        return;
      }

      if (event.key === "Escape") {
        if (selectionMode) {
          setSelectionMode(false);
          setSelectedTaskIds([]);
          return;
        }
        if (selectedTask) {
          setSelectedTask(null);
          return;
        }

        if (search) {
          setSearch("");
        }
        return;
      }

      if (isEditableTarget(event.target) || !selectedTask) {
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void patchTask(selectedTask.id, { isStarred: !selectedTask.isStarred });
      }

      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        void patchTask(selectedTask.id, { isMyDay: !selectedTask.isMyDay });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [user, selectedTask, search, selectionMode]);

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

      await apiFetch<TaskDto>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Đã tạo task.");
      await refreshAll();
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
      current.map((task) => (task.id === taskId ? ({ ...task, ...payload } as TaskDto) : task)),
    );
    setSelectedTask((current) => (current?.id === taskId ? ({ ...current, ...payload } as TaskDto) : current));

    try {
      const updated = await apiFetch<TaskDto>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
      setSelectedTask((current) => (current?.id === taskId ? updated : current));
      await refreshAll();
    } catch (error) {
      setTasks(previousTasks);
      setSelectedTask(previousSelected);
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật task.");
    }
  }

  function toggleSelection(task: TaskDto) {
    setSelectedTaskIds((current) =>
      current.includes(task.id) ? current.filter((id) => id !== task.id) : [...current, task.id],
    );
  }

  async function handleBulkAction(action: "complete" | "uncomplete" | "star" | "unstar" | "myday" | "remove-myday" | "delete") {
    if (!selectedTaskIds.length) return;

    try {
      await apiFetch<{ affected: number }>("/api/tasks/bulk", {
        method: "POST",
        body: JSON.stringify({
          ids: selectedTaskIds,
          action,
        }),
      });
      toast.success(`Đã xử lý ${selectedTaskIds.length} task.`);
      setSelectionMode(false);
      setSelectedTaskIds([]);
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xử lý thao tác hàng loạt.");
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await apiFetch<null>(`/api/tasks/${taskId}`, { method: "DELETE" });
      setSelectedTask((current) => (current?.id === taskId ? null : current));
      toast.success("Đã xóa task.");
      await refreshAll();
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
      await Promise.all([loadLists(), loadSummary()]);
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
      await Promise.all([loadLists(), loadSummary(), loadTasks()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật danh sách.");
    }
  }

  async function deleteList(id: string, mode: "move-to-default" | "delete-tasks") {
    try {
      await apiFetch<null>(`/api/lists/${id}?mode=${mode}`, { method: "DELETE" });
      toast.success("Đã xóa danh sách.");
      if (view.type === "list" && view.listId === id) {
        startTransition(() => {
          router.push("/all");
        });
      }
      await refreshAll();
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
      toast.success("Đã thêm công việc con.");
      await Promise.all([refreshTaskDetails(taskId), loadTasks()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo công việc con.");
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
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật công việc con.");
    }
  }

  async function deleteSubtask(subtaskId: string) {
    try {
      await apiFetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" });
      toast.success("Đã xóa công việc con.");
      if (selectedTask) {
        await Promise.all([refreshTaskDetails(selectedTask.id), loadTasks()]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa công việc con.");
    }
  }

  async function seedDemoData() {
    try {
      setSeedingDemo(true);
      const result = await apiFetch<DemoSeedResult>("/api/demo/seed", {
        method: "POST",
      });
      toast.success(`Đã tạo ${result.createdTasks} task demo trong ${result.createdLists} danh sách.`);
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo dữ liệu demo.");
    } finally {
      setSeedingDemo(false);
    }
  }

  async function handleLogin(payload: { email: string; name?: string }) {
    try {
      setAuthSubmitting(true);
      const session = await apiFetch<SessionUserDto>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setUser(session);
      toast.success("Đăng nhập thành công.");
      setLoading(true);
      await refreshAll();
      setLoading(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đăng nhập.");
      setLoading(false);
    } finally {
      setAuthSubmitting(false);
      setSessionLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await apiFetch<null>("/api/auth/session", { method: "DELETE" });
      setUser(null);
      setLists([]);
      setTasks([]);
      setSummary(null);
      setSelectedTask(null);
      setSuggestions([]);
      toast.success("Đã đăng xuất.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đăng xuất.");
    }
  }

  function navigateToList(id: string) {
    startTransition(() => {
      router.push(`/lists/${id}` as Route);
    });
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      toast.error("Trình duyệt này không hỗ trợ thông báo.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Đã bật thông báo trình duyệt.");
    } else {
      toast.error("Bạn đã từ chối thông báo trình duyệt.");
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen p-4 lg:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
          <div className="glass flex items-center gap-3 rounded-[2rem] px-6 py-4">
            <Spinner className="h-5 w-5" />
            <span>Đang kiểm tra phiên đăng nhập...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen loading={authSubmitting} onSubmit={handleLogin} />;
  }

  const emptyTitle = deferredSearch.trim() ? "Không tìm thấy task phù hợp." : meta.emptyTitle;
  const emptyDescription = deferredSearch.trim()
    ? `Không có kết quả cho "${deferredSearch.trim()}". Hãy thử từ khóa khác.`
    : meta.emptyDescription;
  const showOnboarding = !loading && !summary?.hasAnyTasks && !deferredSearch.trim();
  const showStatusChips = !(view.type === "smart" && view.key === "completed");

  const content = (
    <>
      <SmartListHeader
        title={headerTitle}
        subtitle={meta.subtitle}
        viewKey={view.type === "list" ? "list" : meta.viewKey}
        count={tasks.length}
      />

      <div className="glass flex flex-col gap-3 rounded-[2rem] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tiêu đề hoặc ghi chú"
              className="pl-9 pr-10"
            />
            {search ? (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => void enableBrowserNotifications()}>
              <Bell className="h-4 w-4" />
              Thông báo
            </Button>
            <div className="hidden rounded-xl bg-background/70 px-3 py-2 text-sm text-muted-foreground sm:block">
              {user.email}
            </div>
            <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>

        {showStatusChips ? (
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all" as const, label: "Tất cả" },
              { key: "active" as const, label: "Đang làm" },
              { key: "completed" as const, label: "Hoàn thành" },
            ].map((chip) => (
              <Button
                key={chip.key}
                size="sm"
                variant={statusFilter === chip.key ? "default" : "secondary"}
                onClick={() => setStatusFilter(chip.key)}
              >
                {chip.label}
              </Button>
            ))}
            <div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
              <Sparkles className="h-3.5 w-3.5" />
              `/` tìm kiếm, `n` task mới, `s` đánh sao, `m` My Day
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectionMode ? "default" : "secondary"}
            onClick={() => {
              setSelectionMode((current) => !current);
              setSelectedTaskIds([]);
              setSelectedTask(null);
            }}
          >
            <CheckSquare className="h-4 w-4" />
            {selectionMode ? "Hủy chọn nhiều" : "Chọn nhiều"}
          </Button>

          {selectionMode ? (
            <>
              <div className="rounded-xl bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                Đã chọn {selectedTaskIds.length} task
              </div>
              <Button size="sm" variant="secondary" disabled={!selectedTaskIds.length} onClick={() => void handleBulkAction("complete")}>
                Hoàn thành
              </Button>
              <Button size="sm" variant="secondary" disabled={!selectedTaskIds.length} onClick={() => void handleBulkAction("star")}>
                Gắn sao
              </Button>
              <Button size="sm" variant="secondary" disabled={!selectedTaskIds.length} onClick={() => void handleBulkAction("myday")}>
                Thêm My Day
              </Button>
              <Button size="sm" variant="destructive" disabled={!selectedTaskIds.length} onClick={() => void handleBulkAction("delete")}>
                <Trash2 className="h-4 w-4" />
                Xóa
              </Button>
            </>
          ) : null}
        </div>

        {(loading || isRouting) ? <Spinner className="h-4 w-4 text-muted-foreground" /> : null}
      </div>

      {view.type === "smart" && view.key === "my-day" ? (
        <SuggestionsPanel
          suggestions={suggestions}
          onAddToMyDay={(taskId) => void patchTask(taskId, { isMyDay: true })}
        />
      ) : null}

      <AddTaskInput
        inputRef={quickAddRef}
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
          completedOnly={view.type === "smart" && view.key === "completed"}
          selectionMode={selectionMode}
          selectedTaskIds={selectedTaskIds}
          onToggleMultiSelect={toggleSelection}
          onToggleComplete={(task) => void patchTask(task.id, { isCompleted: !task.isCompleted })}
          onToggleStar={(task) => void patchTask(task.id, { isStarred: !task.isStarred })}
          onSelect={(task) => void handleSelectTask(task)}
        />
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </>
  );

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mx-auto flex max-w-[1800px] gap-6">
        <Sidebar
          pathname={pathname}
          lists={lists}
          summary={summary}
          activeListId={activeListId}
          className="hidden lg:flex"
          onCreateList={createList}
          onUpdateList={updateList}
          onDeleteList={deleteList}
          onSelectList={navigateToList}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <MobileSidebar
            title={headerTitle}
            pathname={pathname}
            lists={lists}
            summary={summary}
            activeListId={activeListId}
            onCreateList={createList}
            onUpdateList={updateList}
            onDeleteList={deleteList}
            onSelectList={navigateToList}
          />
          {showOnboarding ? (
            <>
              <SmartListHeader
                title={headerTitle}
                subtitle={meta.subtitle}
                viewKey={view.type === "list" ? "list" : meta.viewKey}
                count={tasks.length}
              />
              <OnboardingCard
                onStart={() => quickAddRef.current?.focus()}
                onSeedDemo={() => {
                  void seedDemoData();
                }}
                seeding={seedingDemo}
              />
              <AddTaskInput
                inputRef={quickAddRef}
                loading={submitting}
                placeholder="Thêm task đầu tiên của bạn"
                onSubmit={handleCreateTask}
              />
            </>
          ) : (
            content
          )}
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
