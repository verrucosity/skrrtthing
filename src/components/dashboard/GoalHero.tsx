import { useGoalStore } from "../../stores/goalStore";
import { GOAL_STEP, completedGoals, currentTarget, segmentProgress, stars } from "../../lib/goal";
import { formatNumber } from "../../lib/format";
import { ProgressBar } from "../ui/ProgressBar";

export function GoalHero() {
  const points = useGoalStore((s) => s.points);
  const target = currentTarget(points);
  const { done, ratio } = segmentProgress(points);
  const completed = completedGoals(points);

  return (
    <section className="rounded-lg border border-edge bg-surface px-6 py-7">
      <div className="flex items-end justify-center gap-3">
        <span className="text-6xl font-bold tabular-nums tracking-tight text-zinc-50">
          {formatNumber(points)}
          <span className="mx-3 text-zinc-600">/</span>
          {formatNumber(target)}
        </span>
        {completed > 0 && (
          <span
            className="pb-1.5 font-mono text-2xl tracking-widest text-accent-hover"
            title={`${completed} goal${completed === 1 ? "" : "s"} completed`}
          >
            {stars(points)}
          </span>
        )}
      </div>

      <div className="mx-auto mt-6 max-w-xl">
        <ProgressBar ratio={ratio} />
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>
            {done} / {GOAL_STEP} toward goal #{completed + 1}
          </span>
          <span>{GOAL_STEP - done} to go</span>
        </div>
      </div>
    </section>
  );
}
