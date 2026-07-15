import clsx from "clsx";
import type { ConnectionStatus } from "../../types";

const colors: Record<ConnectionStatus, string> = {
  connected: "bg-emerald-400",
  connecting: "bg-amber-400 animate-pulse",
  disconnected: "bg-zinc-600",
  error: "bg-red-500",
};

export const statusLabels: Record<ConnectionStatus, string> = {
  connected: "Connected",
  connecting: "Connecting…",
  disconnected: "Disconnected",
  error: "Error",
};

export function StatusDot({ status }: { status: ConnectionStatus }) {
  return <span className={clsx("inline-block h-2 w-2 shrink-0 rounded-full", colors[status])} />;
}
