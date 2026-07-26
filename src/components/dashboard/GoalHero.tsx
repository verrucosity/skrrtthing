import { useGoalStore } from "../../stores/goalStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useNow } from "../../hooks/useNow";
import {
  completedSaturdayGoals,
  completedWeeklyGoals,
  saturdayStars,
  saturdayTarget,
  SATURDAY_STEP,
  weeklyProgress,
  weeklyStars,
  weeklyTarget,
  WEEKLY_STEP,
} from "../../lib/weeklyGoal";
import { isInSaturdayWindow } from "../../lib/weeklyWindow";
import { formatPoints, formatPointsExact } from "../../lib/format";
import { ProgressBar } from "../ui/ProgressBar";

export function GoalHero() {
  const points = useGoalStore((s) => s.points);
  const saturday = useGoalStore((s) => s.saturday);
  const saturdayForced = useSettingsStore((s) => s.saturdayForced);
  const weeklyStep = useSettingsStore((s) => s.weeklyStepOverride) ?? WEEKLY_STEP;
  const saturdayStep = useSettingsStore((s) => s.saturdayStepOverride) ?? SATURDAY_STEP;
  const now = useNow();

  const target = weeklyTarget(points, weeklyStep);
  const { done, ratio } = weeklyProgress(points, weeklyStep);
  const completed = completedWeeklyGoals(points, weeklyStep);
  const saturdayCompleted = completedSaturdayGoals(saturday.points, saturdayStep);
  const inSaturdayWindow = isInSaturdayWindow(now) || saturdayForced;

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
            {weeklyStars(points, weeklyStep)}
          </span>
        )}
      </div>
      <p className="mt-1 text-center text-xs text-zinc-600" title="Exact stored value, only you see this">
        {formatPointsExact(points)} exact
      </p>

      <div className="mx-auto mt-6 max-w-xl">
        <ProgressBar ratio={ratio} />
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>
            {formatPoints(done)} / {weeklyStep} toward goal #{completed + 1}
          </span>
          <span>{formatPoints(weeklyStep - done)} to go</span>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-xl border-t border-edge pt-4 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Saturday Goal {inSaturdayWindow ? "(active)" : "(inactive)"}
        </p>
        <div className="flex items-center justify-center gap-2">
          <p
            className={
              inSaturdayWindow
                ? "text-2xl font-semibold tabular-nums text-zinc-100"
                : "text-2xl font-semibold tabular-nums text-zinc-600"
            }
          >
            {formatPoints(saturday.points)} / {saturdayTarget(saturday.points, saturdayStep)}
          </p>
          {saturdayCompleted > 0 && (
            <span
              className="font-mono text-lg tracking-widest text-accent-hover"
              title={`${saturdayCompleted} Saturday goal${saturdayCompleted === 1 ? "" : "s"} completed`}
            >
              {saturdayStars(saturday.points, saturdayStep)}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-600" title="Exact stored value, only you see this">
          {formatPointsExact(saturday.points)} exact
        </p>
        {!inSaturdayWindow && (
          <p className="mt-1 text-xs text-zinc-600">Activates Saturday 7:50pm PT</p>
        )}
      </div>
    </section>
  );
}
