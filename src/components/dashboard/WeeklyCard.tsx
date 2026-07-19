import { useGoalStore } from "../../stores/goalStore";
import { useNow } from "../../hooks/useNow";
import { completedWeeklyGoals } from "../../lib/weeklyGoal";
import { nextWeeklyStart } from "../../lib/weeklyWindow";
import { formatDate, formatPoints, formatUntil } from "../../lib/format";
import { Card } from "../ui/Card";

export function WeeklyCard() {
  const week = useGoalStore((s) => s.week);
  const points = useGoalStore((s) => s.points);
  const now = useNow();

  const goalsThisWeek = completedWeeklyGoals(points) - completedWeeklyGoals(week.startPoints);

  return (
    <Card title="This Week">
      <dl className="space-y-2.5 text-sm">
        <Row label="Contributions" value={`+${formatPoints(week.points)}`} strong />
        <Row
          label="Weekly goals completed"
          value={goalsThisWeek > 0 ? `${goalsThisWeek} 🎉` : "—"}
        />
        <Row label="Week started" value={formatDate(week.start)} />
        <Row label="Resets in" value={formatUntil(nextWeeklyStart(now), now)} />
      </dl>
    </Card>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={strong ? "font-semibold text-accent-hover" : "text-zinc-200"}>{value}</dd>
    </div>
  );
}
