import { CalendarDays, Sparkles, Star, SunMedium } from "lucide-react";

import type { SmartListKey } from "@/lib/constants";

const iconMap: Record<SmartListKey, typeof SunMedium> = {
  "my-day": SunMedium,
  important: Star,
  planned: CalendarDays,
  all: Sparkles,
  completed: Sparkles,
};

type SmartListHeaderProps = {
  title: string;
  subtitle: string;
  viewKey: SmartListKey | "list";
  count: number;
};

export function SmartListHeader({ title, subtitle, viewKey, count }: SmartListHeaderProps) {
  const Icon = viewKey === "list" ? Sparkles : iconMap[viewKey];

  return (
    <div className="glass rounded-[2rem] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex rounded-full bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-full bg-background/70 px-4 py-2 text-sm font-medium">
          {count} task
        </div>
      </div>
    </div>
  );
}
