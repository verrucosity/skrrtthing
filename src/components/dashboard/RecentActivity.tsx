import { Inbox } from "lucide-react";
import { useGoalStore } from "../../stores/goalStore";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { LogRow } from "../log/LogRow";

export function RecentActivity() {
  const log = useGoalStore((s) => s.log);
  const recent = log.slice(0, 8);

  return (
    <Card title="Recent Activity">
      {recent.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing yet"
          hint="Contributions show up here as soon as they come in."
        />
      ) : (
        <div className="divide-y divide-edge/60">
          {recent.map((entry) => (
            <LogRow key={entry.id} entry={entry} compact />
          ))}
        </div>
      )}
    </Card>
  );
}
