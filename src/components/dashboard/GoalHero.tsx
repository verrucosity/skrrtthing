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
  const weekPoints = useGoalStore((s) => s.week.points);
  const saturday = useGoalStore((s) => s.saturday);
  const saturdayForced = useSettingsStore((s) => s.saturdayForced);
  const weeklyStep = useSettingsStore((s) => s.weeklyStepOverride) ?? WEEKLY_STEP;
  const saturdayStep = useSettingsStore((s) => s.saturdayStepOverride) ?? SATURDAY_STEP;
  const now = useNow();

  const weeklyTargetValue = weeklyTarget(weekPoints, weeklyStep);
  const weeklyProg = weeklyProgress(weekPoints, weeklyStep);
  const weeklyCompleted = completedWeeklyGoals(weekPoints, weeklyStep);

  const saturdayTargetValue = saturdayTarget(saturday.points, saturdayStep);
  const saturdayProg = weeklyProgress(saturday.points, saturdayStep);
  const saturdayCompleted = completedSaturdayGoals(saturday.points, saturdayStep);

  const inSaturdayWindow = isInSaturdayWindow(now) || saturdayForced;

  const weeklyGoal = {
    label: "Weekly Goal",
    current: weekPoints,
    target: weeklyTargetValue,
    step: weeklyStep,
    done: weeklyProg.done,
    ratio: weeklyProg.ratio,
    completed: weeklyCompleted,
    stars: weeklyStars(weekPoints, weeklyStep),
  };
  const saturdayGoal = {
    label: "Saturday Goal",
    current: saturday.points,
    target: saturdayTargetValue,
    step: saturdayStep,
    done: saturdayProg.done,
    ratio: saturdayProg.ratio,
    completed: saturdayCompleted,
    stars: saturdayStars(saturday.points, saturdayStep),
  };

  const big = inSaturdayWindow ? saturdayGoal : weeklyGoal;
  const small = inSaturdayWindow ? weeklyGoal : saturdayGoal;
  const smallStatus = inSaturdayWindow
    ? "(frozen, Saturday's active)"
    : "(inactive)";
  const smallNote = !inSaturdayWindow ? "Activates Saturday 7pm PT" : null;

  return (
    <section className="rounded-lg border border-edge bg-surface px-6 py-7">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {big.label}
      </p>
      <div className="flex items-end justify-center gap-3">
        <span className="text-6xl font-bold tabular-nums tracking-tight text-zinc-50">
          {formatPoints(big.current)}
          <span className="mx-3 text-zinc-600">/</span>
          {formatPoints(big.target)}
        </span>
        {big.completed > 0 && (
          <span
            className="pb-1.5 font-mono text-2xl tracking-widest text-accent-hover"
            title={`${big.completed} ${big.label.toLowerCase()}${big.completed === 1 ? "" : "s"} completed`}
          >
            {big.stars}
          </span>
        )}
      </div>
      <p className="mt-1 text-center text-xs text-zinc-600" title="Exact stored value, only you see this">
        {formatPointsExact(big.current)} exact
      </p>

      <div className="mx-auto mt-6 max-w-xl">
        <ProgressBar ratio={big.ratio} />
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>
            {formatPoints(big.done)} / {big.step} toward goal #{big.completed + 1}
          </span>
          <span>{formatPoints(big.step - big.done)} to go</span>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-xl border-t border-edge pt-4 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {small.label} {smallStatus}
        </p>
        <div className="flex items-center justify-center gap-2">
          <p className="text-2xl font-semibold tabular-nums text-zinc-600">
            {formatPoints(small.current)} / {small.target}
          </p>
          {small.completed > 0 && (
            <span
              className="font-mono text-lg tracking-widest text-accent-hover"
              title={`${small.completed} ${small.label.toLowerCase()}${small.completed === 1 ? "" : "s"} completed`}
            >
              {small.stars}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-600" title="Exact stored value, only you see this">
          {formatPointsExact(small.current)} exact
        </p>
        {smallNote && <p className="mt-1 text-xs text-zinc-600">{smallNote}</p>}
      </div>
    </section>
  );
}
