"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type AddTaskInputProps = {
  placeholder?: string;
  loading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onSubmit: (title: string) => Promise<void>;
};

export function AddTaskInput({
  placeholder = "Thêm task mới",
  loading,
  inputRef,
  onSubmit,
}: AddTaskInputProps) {
  const [title, setTitle] = React.useState("");

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed || loading) {
      return;
    }

    setTitle("");
    await onSubmit(trimmed);
  }

  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-3">
      <div className="rounded-xl bg-primary/10 p-2 text-primary">
        <Plus className="h-4 w-4" />
      </div>
      <Input
        ref={inputRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void handleSubmit();
          }
        }}
        placeholder={placeholder}
        className="border-none bg-transparent shadow-none focus-visible:ring-0"
      />
      <Button size="sm" onClick={() => void handleSubmit()} disabled={loading || !title.trim()}>
        {loading ? <Spinner /> : "Thêm"}
      </Button>
    </div>
  );
}
