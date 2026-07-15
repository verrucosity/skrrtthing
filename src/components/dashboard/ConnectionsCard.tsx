import { useConnectionStore } from "../../stores/connectionStore";
import type { ServiceState } from "../../types";
import { Card } from "../ui/Card";
import { StatusDot, statusLabels } from "../ui/StatusDot";

export function ConnectionsCard() {
  const twitch = useConnectionStore((s) => s.twitch);
  const streamlabs = useConnectionStore((s) => s.streamlabs);

  return (
    <Card title="Connections">
      <div className="space-y-3">
        <ServiceRow name="Twitch EventSub" state={twitch} />
        <ServiceRow name="Streamlabs" state={streamlabs} />
      </div>
    </Card>
  );
}

function ServiceRow({ name, state }: { name: string; state: ServiceState }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">
          {name}
          {state.channel && <span className="text-zinc-500"> · {state.channel}</span>}
        </span>
        <span className="flex items-center gap-2 text-zinc-400">
          <StatusDot status={state.status} />
          {statusLabels[state.status]}
        </span>
      </div>
      {state.status === "error" && state.error && (
        <p className="mt-1 text-xs text-red-400">{state.error}</p>
      )}
    </div>
  );
}
