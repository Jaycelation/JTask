"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import type { ListSummary } from "@/lib/types";

type MobileSidebarProps = React.ComponentProps<typeof Sidebar> & {
  title: string;
};

export function MobileSidebar({ title, ...props }: MobileSidebarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="glass mb-4 flex items-center justify-between rounded-2xl p-3 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold">{title}</h2>
        <div className="w-10" />
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden">
        <div className="h-full w-[90vw] max-w-sm p-4">
          <Sidebar {...props} className="flex h-full w-full flex-col" onNavigate={() => setOpen(false)} />
          </div>
          <button type="button" className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
        </div>
      ) : null}
    </>
  );
}
