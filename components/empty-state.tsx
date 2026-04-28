import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="glass flex min-h-80 flex-col items-center justify-center rounded-[2rem] px-6 py-12 text-center">
      <div className="mb-5 rounded-full bg-primary/10 p-4 text-primary">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
