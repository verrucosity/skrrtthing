import { useGoalStore } from "../../stores/goalStore";
import { formatPoints } from "../../lib/format";
import { Card } from "../ui/Card";

/** Where this week's points have come from, as simple proportional bars. */
export function BreakdownCard() {
  const week = useGoalStore((s) => s.week);
  const rows = [
    { label: "Bits", points: week.pointsFromBits ?? 0 },
    { label: "Subs", points: week.pointsFromSubs ?? 0 },
    { label: "Donations", points: week.pointsFromDonations ?? 0 },
  ];
  const max = Math.max(1, ...rows.map((r) => r.points));

  return (
    <Card title="Contribution Breakdown">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-zinc-400">{row.label}</span>
              <span className="tabular-nums text-zinc-200">{formatPoints(row.points)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full rounded-full bg-accent/70"
                style={{ width: `${(row.points / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
