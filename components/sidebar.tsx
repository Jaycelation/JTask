"use client";

import Link from "next/link";
import type { Route } from "next";
import { CalendarRange, CheckCheck, ListTodo, Star, SunMedium } from "lucide-react";

import { ListManager } from "@/components/list-manager";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { DashboardSummaryDto, ListSummary } from "@/lib/types";

const entries: Array<{
  href: Route;
  label: string;
  countKey: keyof DashboardSummaryDto["counts"];
  icon: typeof SunMedium;
}> = [
  { href: "/my-day", label: "My Day", countKey: "myDay", icon: SunMedium },
  { href: "/important", label: "Important", countKey: "important", icon: Star },
  { href: "/planned", label: "Planned", countKey: "planned", icon: CalendarRange },
  { href: "/all", label: "All", countKey: "all", icon: ListTodo },
  { href: "/completed", label: "Completed", countKey: "completed", icon: CheckCheck },
];

type SidebarProps = {
  pathname: string;
  lists: ListSummary[];
  summary: DashboardSummaryDto | null;
  activeListId?: string | null;
  className?: string;
  onNavigate?: () => void;
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
          const count = props.summary?.counts[entry.countKey] ?? 0;
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={props.onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{entry.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  active ? "bg-white/20 text-primary-foreground" : "bg-background/70 text-muted-foreground",
                )}
              >
                {count}
              </span>
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
          onSelect={(id) => {
            props.onSelectList(id);
            props.onNavigate?.();
          }}
        />
      </div>
    </aside>
  );
}
