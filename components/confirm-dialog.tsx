"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConfirmAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "ghost" | "outline" | "destructive";
};

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  actions?: ConfirmAction[];
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  destructive,
  onConfirm,
  onCancel,
  actions,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-[2rem] p-6 shadow-2xl">
        <div className="mb-4 inline-flex rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          {actions?.length
            ? actions.map((action) => (
                <Button key={action.label} variant={action.variant ?? "default"} onClick={action.onClick}>
                  {action.label}
                </Button>
              ))
            : (
                <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              )}
        </div>
      </div>
    </div>
  );
}
