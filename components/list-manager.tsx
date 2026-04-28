"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ListSummary } from "@/lib/types";

type ListManagerProps = {
  lists: ListSummary[];
  activeListId?: string | null;
  onCreate: (payload: { name: string; color?: string | null }) => Promise<void>;
  onUpdate: (id: string, payload: { name?: string; color?: string | null }) => Promise<void>;
  onDelete: (id: string, mode: "move-to-default" | "delete-tasks") => Promise<void>;
  onSelect: (id: string) => void;
};

export function ListManager({
  lists,
  activeListId,
  onCreate,
  onUpdate,
  onDelete,
  onSelect,
}: ListManagerProps) {
  const [newName, setNewName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const deletableList = lists.find((item) => item.id === deleteId);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && newName.trim()) {
              void onCreate({ name: newName.trim(), color: "#6366F1" });
              setNewName("");
            }
          }}
          placeholder="Tạo danh sách mới"
        />
        <Button
          size="icon"
          variant="secondary"
          onClick={() => {
            if (!newName.trim()) return;
            void onCreate({ name: newName.trim(), color: "#6366F1" });
            setNewName("");
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {lists.map((list) => (
          <div
            key={list.id}
            className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${activeListId === list.id ? "bg-accent" : "hover:bg-accent/60"}`}
          >
            <button type="button" className="flex-1 text-left" onClick={() => onSelect(list.id)}>
              {editingId === list.id ? (
                <Input
                  value={editingName}
                  autoFocus
                  onChange={(event) => setEditingName(event.target.value)}
                  onBlur={() => {
                    if (editingName.trim()) {
                      void onUpdate(list.id, { name: editingName.trim() });
                    }
                    setEditingId(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      if (editingName.trim()) {
                        void onUpdate(list.id, { name: editingName.trim() });
                      }
                      setEditingId(null);
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{list.name}</span>
                  <span className="text-xs text-muted-foreground">{list.taskCount}</span>
                </div>
              )}
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingId(list.id);
                setEditingName(list.name);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(list.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
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
