import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { Page } from "../components/layout/Page";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { LogRow } from "../components/log/LogRow";
import { useGoalStore } from "../stores/goalStore";

export function EventLog() {
  const log = useGoalStore((s) => s.log);
  const clearLog = useGoalStore((s) => s.clearLog);
  const [confirming, setConfirming] = useState(false);

  // A two-step clear beats a modal for something this small.
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <Page
      title="Event Log"
      description={`${log.length} entr${log.length === 1 ? "y" : "ies"} · newest first`}
      action={
        log.length > 0 && (
          <Button
            variant={confirming ? "danger" : "secondary"}
            onClick={() => {
              if (confirming) {
                clearLog();
                setConfirming(false);
              } else {
                setConfirming(true);
              }
            }}
          >
            {confirming ? "Really clear?" : "Clear log"}
          </Button>
        )
      }
    >
      <Card>
        {log.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="The log is empty"
            hint="Every bit cheer, sub, gift and donation is recorded here with its point value."
          />
        ) : (
          <div className="divide-y divide-edge/60">
            {log.map((entry) => (
              <LogRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </Card>
    </Page>
  );
}
