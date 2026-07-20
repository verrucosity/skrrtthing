import { useGoalStore } from "../../stores/goalStore";
import { useNow } from "../../hooks/useNow";
import {
  completedWeeklyGoals,
  saturdayTarget,
  weeklyProgress,
  weeklyStars,
  weeklyTarget,
} from "../../lib/weeklyGoal";
import { isInSaturdayWindow } from "../../lib/weeklyWindow";
import { formatPoints } from "../../lib/format";
import { ProgressBar } from "../ui/ProgressBar";

export function GoalHero() {
  const points = useGoalStore((s) => s.points);
  const saturday = useGoalStore((s) => s.saturday);
  const now = useNow();

  const target = weeklyTarget(points);
  const { done, ratio } = weeklyProgress(points);
  const completed = completedWeeklyGoals(points);
  const inSaturdayWindow = isInSaturdayWindow(now);

  return (
    <section className="rounded-lg border border-edge bg-surface px-6 py-7">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Weekly Goal
      </p>
      <div className="flex items-end justify-center gap-3">
        <span className="text-6xl font-bold tabular-nums tracking-tight text-zinc-50">
          {formatPoints(points)}
          <span className="mx-3 text-zinc-600">/</span>
          {formatPoints(target)}
        </span>
        {completed > 0 && (
          <span
            className="pb-1.5 font-mono text-2xl tracking-widest text-accent-hover"
            title={`${completed} weekly goal${completed === 1 ? "" : "s"} completed`}
          >
            {weeklyStars(points)}
          </span>
        )}
      </div>

      <div className="mx-auto mt-6 max-w-xl">
        <ProgressBar ratio={ratio} />
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>
            {formatPoints(done)} / 57 toward goal #{completed + 1}
          </span>
          <span>{formatPoints(57 - done)} to go</span>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-xl border-t border-edge pt-4 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Saturday Goal {inSaturdayWindow ? "(active)" : "(inactive)"}
        </p>
        <p
          className={
            inSaturdayWindow
              ? "text-2xl font-semibold tabular-nums text-zinc-100"
              : "text-2xl font-semibold tabular-nums text-zinc-600"
          }
        >
          {formatPoints(saturday.points)} / {saturdayTarget(saturday.points)}
        </p>
        {!inSaturdayWindow && (
          <p className="mt-1 text-xs text-zinc-600">Activates Saturday 8pm PT</p>
        )}
      </div>
    </section>
  );
}
