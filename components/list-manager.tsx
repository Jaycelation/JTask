"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ListSummary } from "@/lib/types";

const COLOR_OPTIONS = ["#3B82F6", "#6366F1", "#14B8A6", "#F59E0B", "#EF4444", "#EC4899"];

type ListManagerProps = {
  lists: ListSummary[];
  activeListId?: string | null;
  onCreate: (payload: { name: string; color?: string | null }) => Promise<void>;
  onUpdate: (id: string, payload: { name?: string; color?: string | null }) => Promise<void>;
  onDelete: (id: string, mode: "move-to-default" | "delete-tasks") => Promise<void>;
  onSelect: (id: string) => void;
};

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          className={`h-6 w-6 rounded-full border-2 ${value === color ? "border-foreground" : "border-transparent"}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          aria-label={`Chọn màu ${color}`}
        />
      ))}
    </div>
  );
}

export function ListManager({
  lists,
  activeListId,
  onCreate,
  onUpdate,
  onDelete,
  onSelect,
}: ListManagerProps) {
  const [newName, setNewName] = React.useState("");
  const [newColor, setNewColor] = React.useState("#6366F1");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [editingColor, setEditingColor] = React.useState("#6366F1");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const deletableList = lists.find((item) => item.id === deleteId);

  async function handleCreate() {
    if (!newName.trim()) return;
    await onCreate({ name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor("#6366F1");
  }

  async function commitEdit(listId: string) {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    await onUpdate(listId, { name: editingName.trim(), color: editingColor });
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-background/40 p-3">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && newName.trim()) {
                void handleCreate();
              }
            }}
            placeholder="Tạo danh sách mới"
          />
          <Button size="icon" variant="secondary" onClick={() => void handleCreate()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3">
          <ColorPicker value={newColor} onChange={setNewColor} />
        </div>
      </div>

      <div className="space-y-2">
        {lists.map((list) => (
          <div
            key={list.id}
            className={`rounded-2xl px-3 py-2 ${activeListId === list.id ? "bg-accent" : "hover:bg-accent/60"}`}
          >
            {editingId === list.id ? (
              <div className="space-y-3">
                <Input
                  value={editingName}
                  autoFocus
                  onChange={(event) => setEditingName(event.target.value)}
                  onBlur={() => void commitEdit(list.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void commitEdit(list.id);
                    }
                  }}
                />
                <ColorPicker value={editingColor} onChange={setEditingColor} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button type="button" className="flex flex-1 items-center gap-3 text-left" onClick={() => onSelect(list.id)}>
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: list.color ?? "#94A3B8" }}
                  />
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="truncate font-medium">{list.name}</span>
                    <span className="text-xs text-muted-foreground">{list.taskCount}</span>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingId(list.id);
                    setEditingName(list.name);
                    setEditingColor(list.color ?? "#6366F1");
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(list.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Xóa danh sách"
        description={`Chọn cách xử lý task trong "${deletableList?.name ?? ""}".`}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => undefined}
        actions={[
          {
            label: "Chuyển về mặc định",
            variant: "secondary",
            onClick: () => {
              if (!deleteId) return;
              void onDelete(deleteId, "move-to-default");
              setDeleteId(null);
            },
          },
          {
            label: "Xóa cả task",
            variant: "destructive",
            onClick: () => {
              if (!deleteId) return;
              void onDelete(deleteId, "delete-tasks");
              setDeleteId(null);
            },
          },
        ]}
      />
    </div>
  );
}
