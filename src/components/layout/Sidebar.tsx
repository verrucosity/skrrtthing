import { BarChart3, LayoutDashboard, ScrollText, Settings, Target } from "lucide-react";
import clsx from "clsx";
import { useConnectionStore } from "../../stores/connectionStore";
import { StatusDot } from "../ui/StatusDot";
import type { PageId } from "../../pages";

const nav: Array<{ id: PageId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "log", label: "Event Log", icon: ScrollText },
  { id: "stats", label: "Statistics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  page: PageId;
  onNavigate(page: PageId): void;
}

export function Sidebar({ page, onNavigate }: SidebarProps) {
  const twitch = useConnectionStore((s) => s.twitch);
  const streamlabs = useConnectionStore((s) => s.streamlabs);

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-edge bg-surface">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Target size={17} />
        </span>
        <span className="text-sm font-semibold tracking-tight text-zinc-100">skrrt</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={clsx(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              page === id
                ? "bg-accent/15 font-medium text-accent-hover"
                : "text-zinc-400 hover:bg-raised hover:text-zinc-200",
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="space-y-1.5 border-t border-edge px-4 py-3 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <StatusDot status={twitch.status} />
          <span>Twitch{twitch.channel ? ` · ${twitch.channel}` : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status={streamlabs.status} />
          <span>Streamlabs</span>
        </div>
      </div>
    </aside>
  );
}
