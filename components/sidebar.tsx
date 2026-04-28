"use client";

import Link from "next/link";
import { CalendarRange, CheckCheck, ListTodo, Star, SunMedium } from "lucide-react";

import { ListManager } from "@/components/list-manager";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { ListSummary } from "@/lib/types";

const entries = [
  { href: "/my-day", label: "My Day", icon: SunMedium },
  { href: "/important", label: "Important", icon: Star },
  { href: "/planned", label: "Planned", icon: CalendarRange },
  { href: "/all", label: "All", icon: ListTodo },
  { href: "/completed", label: "Completed", icon: CheckCheck },
];

type SidebarProps = {
  pathname: string;
  lists: ListSummary[];
  activeListId?: string | null;
  className?: string;
  onCreateList: (payload: { name: string; color?: string | null }) => Promise<void>;
  onUpdateList: (id: string, payload: { name?: string; color?: string | null }) => Promise<void>;
  onDeleteList: (id: string, mode: "move-to-default" | "delete-tasks") => Promise<void>;
  onSelectList: (id: string) => void;
};

export function Sidebar({ className, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        "glass hidden h-[calc(100vh-2rem)] w-[320px] shrink-0 rounded-[2rem] p-5 lg:flex lg:flex-col",
        className,
      )}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">FocusFlow</p>
          <h2 className="mt-2 text-2xl font-semibold">Tasks</h2>
        </div>
        <ThemeToggle />
      </div>

      <nav className="space-y-2">
        {entries.map((entry) => {
          const Icon = entry.icon;
          const active = props.pathname === entry.href;
          return (
            <Link
              key={entry.href}
              href={entry.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              {entry.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 flex-1 overflow-auto pr-1 scrollbar-thin">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Danh sách
          </h3>
        </div>
        <ListManager
          lists={props.lists}
          activeListId={props.activeListId}
          onCreate={props.onCreateList}
          onUpdate={props.onUpdateList}
          onDelete={props.onDeleteList}
          onSelect={props.onSelectList}
        />
      </div>
    </aside>
  );
}
