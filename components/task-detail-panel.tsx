"use client";

import * as React from "react";
import { CalendarDays, Star, SunMedium, Trash2 } from "lucide-react";

import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ListSummary, SubtaskDto, TaskDto } from "@/lib/types";

type TaskDetailPanelProps = {
  task: TaskDto | null;
  lists: ListSummary[];
  loading?: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, payload: Record<string, unknown>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCreateSubtask: (taskId: string, title: string) => Promise<void>;
  onUpdateSubtask: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
};

function SubtaskRow({
  subtask,
  onUpdate,
  onDelete,
}: {
  subtask: SubtaskDto;
  onUpdate: (payload: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [title, setTitle] = React.useState(subtask.title);

  React.useEffect(() => {
    setTitle(subtask.title);
  }, [subtask.title]);

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-background/40 p-3">
      <Checkbox checked={subtask.isCompleted} onCheckedChange={(checked) => void onUpdate({ isCompleted: checked })} />
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={() => {
          if (title.trim() && title.trim() !== subtask.title) {
            void onUpdate({ title: title.trim() });
          }
        }}
        className={cn("border-none bg-transparent px-0", subtask.isCompleted && "line-through text-muted-foreground")}
      />
      <Button variant="ghost" size="icon" onClick={() => void onDelete()}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function TaskDetailPanel({
  task,
  lists,
  loading,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}: TaskDetailPanelProps) {
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftDescription, setDraftDescription] = React.useState("");
  const [subtaskTitle, setSubtaskTitle] = React.useState("");

  React.useEffect(() => {
    setDraftTitle(task?.title ?? "");
    setDraftDescription(task?.description ?? "");
  }, [task?.id, task?.title, task?.description]);

  if (!task) {
    return (
      <aside className="glass hidden h-[calc(100vh-2rem)] w-[380px] shrink-0 rounded-[2rem] p-6 xl:block">
        <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
          Chọn một task để xem chi tiết và chỉnh sửa nhanh.
        </div>
      </aside>
    );
  }

  return (
    <aside className="glass fixed inset-x-4 bottom-4 top-24 z-30 overflow-auto rounded-[2rem] p-5 lg:static lg:inset-auto lg:block lg:h-[calc(100vh-2rem)] lg:w-[380px] xl:w-[400px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chi tiết task</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Đóng
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-5 w-5" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={task.isCompleted}
                onCheckedChange={(checked) => void onUpdateTask(task.id, { isCompleted: checked })}
                className="mt-1"
              />
              <Input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onBlur={() => {
                  if (draftTitle.trim() && draftTitle.trim() !== task.title) {
                    void onUpdateTask(task.id, { title: draftTitle.trim() });
                  }
                }}
                className="border-none bg-transparent px-0 text-lg font-semibold focus-visible:ring-0"
              />
            </div>

            <Textarea
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              onBlur={() => {
                if (draftDescription !== (task.description ?? "")) {
                  void onUpdateTask(task.id, { description: draftDescription || null });
                }
              }}
              placeholder="Thêm ghi chú cho task"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={task.isStarred ? "default" : "secondary"}
              onClick={() => void onUpdateTask(task.id, { isStarred: !task.isStarred })}
            >
              <Star className={cn("h-4 w-4", task.isStarred && "fill-current")} />
              Quan trọng
            </Button>
            <Button
              variant={task.isMyDay ? "default" : "secondary"}
              onClick={() => void onUpdateTask(task.id, { isMyDay: !task.isMyDay })}
            >
              <SunMedium className="h-4 w-4" />
              My Day
            </Button>
          </div>

          <DatePicker
            label="Ngày đến hạn"
            value={task.dueDate}
            onChange={(value) => void onUpdateTask(task.id, { dueDate: value })}
          />

          <DatePicker
            label="Nhắc nhở"
            value={task.reminderAt}
            onChange={(value) => void onUpdateTask(task.id, { reminderAt: value })}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Danh sách</label>
            <select
              className="flex h-10 w-full rounded-xl border border-input bg-background/70 px-3 py-2 text-sm"
              value={task.listId}
              onChange={(event) => void onUpdateTask(task.id, { listId: event.target.value })}
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Subtasks</h3>
            </div>
            <div className="flex gap-2">
              <Input
                value={subtaskTitle}
                onChange={(event) => setSubtaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && subtaskTitle.trim()) {
                    void onCreateSubtask(task.id, subtaskTitle.trim());
                    setSubtaskTitle("");
                  }
                }}
                placeholder="Thêm subtask"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!subtaskTitle.trim()) return;
                  void onCreateSubtask(task.id, subtaskTitle.trim());
                  setSubtaskTitle("");
                }}
              >
                Thêm
              </Button>
            </div>
            <div className="space-y-2">
              {task.subtasks?.map((subtask) => (
                <SubtaskRow
                  key={subtask.id}
                  subtask={subtask}
                  onUpdate={(payload) => onUpdateSubtask(subtask.id, payload)}
                  onDelete={() => onDeleteSubtask(subtask.id)}
                />
              ))}
            </div>
          </div>

          <Button variant="destructive" className="w-full" onClick={() => void onDeleteTask(task.id)}>
            <Trash2 className="h-4 w-4" />
            Xóa task
          </Button>
        </div>
      )}
    </aside>
  );
}
