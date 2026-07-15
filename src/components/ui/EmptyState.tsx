import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
}

export function EmptyState({ icon: Icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Icon size={22} className="text-zinc-600" />
      <p className="text-sm text-zinc-400">{title}</p>
      {hint && <p className="max-w-xs text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}
