import { History } from "lucide-react";
import { Page } from "../components/layout/Page";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { useGoalStore } from "../stores/goalStore";
import { completedWeeklyGoals } from "../lib/weeklyGoal";
import { formatDate, formatNumber, formatPoints, formatUsd } from "../lib/format";

export function Statistics() {
  const stats = useGoalStore((s) => s.stats);
  const points = useGoalStore((s) => s.points);
  const history = useGoalStore((s) => s.history);

  return (
    <Page title="Statistics" description="Lifetime totals across every week.">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Bits" value={formatNumber(stats.totalBits)} />
        <StatCard
          label="Total Subs"
          value={formatNumber(stats.totalSubs)}
          sub={stats.totalGiftSubs > 0 ? `${formatNumber(stats.totalGiftSubs)} gifted` : undefined}
        />
        <StatCard
          label="Total Donations"
          value={formatUsd(stats.totalDonationCents)}
          sub={`${formatNumber(stats.totalDonations)} donation${stats.totalDonations === 1 ? "" : "s"}`}
        />
        <StatCard label="Lifetime Contributions" value={formatPoints(points)} sub="points" />
        <StatCard
          label="Weekly Goals Completed"
          value={formatNumber(completedWeeklyGoals(points))}
          sub="groups of 57"
        />
      </div>

      <Card title="Past Weeks" className="mt-4">
        {history.length === 0 ? (
          <EmptyState
            icon={History}
            title="No completed weeks yet"
            hint="Each Sunday at 8pm PT the current week is archived here."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="pb-2 font-medium">Week of</th>
                <th className="pb-2 text-right font-medium">Contributions</th>
                <th className="pb-2 text-right font-medium">Goals completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge/60">
              {history.map((week) => (
                <tr key={week.start}>
                  <td className="py-2 text-zinc-300">{formatDate(week.start)}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-200">
                    +{formatPoints(week.points)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-zinc-200">
                    {week.goalsCompleted || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Page>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-edge bg-surface px-4 py-3.5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
