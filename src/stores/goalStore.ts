import { create } from "zustand";
import type { GoalData, LogEntry, SubTier } from "../types";
import { BITS_PER_POINT, CENTS_PER_POINT, SUB_POINTS, bankedPoints } from "../lib/goal";
import { completedWeeklyGoals } from "../lib/weeklyGoal";
import { weeklyKey } from "../lib/weeklyWindow";
import { formatUsd } from "../lib/format";
import { loadData, saveData } from "../lib/storage";

const LOG_LIMIT = 500;
const HISTORY_LIMIT = 104; // two years of weeks

function emptyData(now = new Date()): GoalData {
  return {
    points: 0,
    bitsRemainder: 0,
    donationRemainderCents: 0,
    stats: {
      totalBits: 0,
      totalSubs: 0,
      totalGiftSubs: 0,
      totalDonations: 0,
      totalDonationCents: 0,
      pointsFromBits: 0,
      pointsFromSubs: 0,
      pointsFromDonations: 0,
    },
    week: {
      start: weeklyKey(now),
      startPoints: 0,
      points: 0,
      bits: 0,
      subs: 0,
      donationCents: 0,
    },
    history: [],
    log: [],
  };
}

function tierLabel(tier: SubTier): string {
  return { "1000": "Tier 1", "2000": "Tier 2", "3000": "Tier 3" }[tier];
}

interface GoalStore extends GoalData {
  hydrated: boolean;
  hydrate(): Promise<void>;
  addBits(bits: number, meta?: { user?: string; via?: string }): void;
  addSub(tier: SubTier, meta?: { user?: string; isResub?: boolean; months?: number }): void;
  addGiftSubs(tier: SubTier, count: number, meta?: { user?: string }): void;
  addDonation(cents: number, meta?: { user?: string; formatted?: string }): void;
  rolloverIfNeeded(now?: Date): void;
  clearLog(): void;
  resetEverything(): void;
  setPoints(points: number): void;
}

export const useGoalStore = create<GoalStore>((set, get) => {
  /** Apply a contribution: bump the counter, weekly window and log, then persist. */
  function apply(
    points: number,
    entry: Omit<LogEntry, "id" | "at" | "points">,
    patch: (data: GoalData) => Partial<GoalData>,
  ): void {
    set((state) => {
      const changes = patch(state);
      return {
        ...changes,
        points: state.points + points,
        week: {
          ...state.week,
          ...changes.week,
          points: state.week.points + points,
        },
        log: [
          { id: crypto.randomUUID(), at: new Date().toISOString(), points, ...entry },
          ...state.log,
        ].slice(0, LOG_LIMIT),
      };
    });
    persist();
  }

  function persist(): void {
    const s = get();
    const data: GoalData = {
      points: s.points,
      bitsRemainder: s.bitsRemainder,
      donationRemainderCents: s.donationRemainderCents,
      stats: s.stats,
      week: s.week,
      history: s.history,
      log: s.log,
    };
    saveData(data);
  }

  return {
    ...emptyData(),
    hydrated: false,

    async hydrate() {
      const saved = await loadData<GoalData>();
      if (saved) set({ ...emptyData(), ...saved });
      set({ hydrated: true });
      get().rolloverIfNeeded();
    },

    addBits(bits, meta = {}) {
      if (bits <= 0) return;
      const state = get();
      const banked = bankedPoints(state.bitsRemainder, bits, BITS_PER_POINT);
      const detailParts = [
        meta.user,
        meta.via,
        banked.remainder > 0 ? `${banked.remainder}/${BITS_PER_POINT} banked` : null,
      ].filter(Boolean);
      apply(
        banked.points,
        {
          kind: "bits",
          label: `${bits.toLocaleString("en-US")} Bits`,
          detail: detailParts.join(" · ") || undefined,
        },
        (s) => ({
          bitsRemainder: banked.remainder,
          stats: {
            ...s.stats,
            totalBits: s.stats.totalBits + bits,
            pointsFromBits: s.stats.pointsFromBits + banked.points,
          },
          week: { ...s.week, bits: s.week.bits + bits },
        }),
      );
    },

    addSub(tier, meta = {}) {
      const points = SUB_POINTS[tier];
      const label = meta.isResub ? `${tierLabel(tier)} Resub` : `${tierLabel(tier)} Sub`;
      const detailParts = [
        meta.user,
        meta.isResub && meta.months ? `${meta.months} months` : null,
      ].filter(Boolean);
      apply(
        points,
        { kind: "sub", label, detail: detailParts.join(" · ") || undefined },
        (s) => ({
          stats: {
            ...s.stats,
            totalSubs: s.stats.totalSubs + 1,
            pointsFromSubs: s.stats.pointsFromSubs + points,
          },
          week: { ...s.week, subs: s.week.subs + 1 },
        }),
      );
    },

    addGiftSubs(tier, count, meta = {}) {
      if (count <= 0) return;
      const points = SUB_POINTS[tier] * count;
      apply(
        points,
        {
          kind: "gift-sub",
          label: count === 1 ? `Gifted ${tierLabel(tier)} Sub` : `${count}x Gifted ${tierLabel(tier)} Subs`,
          detail: meta.user,
        },
        (s) => ({
          stats: {
            ...s.stats,
            totalSubs: s.stats.totalSubs + count,
            totalGiftSubs: s.stats.totalGiftSubs + count,
            pointsFromSubs: s.stats.pointsFromSubs + points,
          },
          week: { ...s.week, subs: s.week.subs + count },
        }),
      );
    },

    addDonation(cents, meta = {}) {
      if (cents <= 0) return;
      const state = get();
      const banked = bankedPoints(state.donationRemainderCents, cents, CENTS_PER_POINT);
      const detailParts = [
        meta.user,
        banked.remainder > 0 ? `${formatUsd(banked.remainder)} banked` : null,
      ].filter(Boolean);
      apply(
        banked.points,
        {
          kind: "donation",
          label: `Donation ${meta.formatted ?? formatUsd(cents)}`,
          detail: detailParts.join(" · ") || undefined,
        },
        (s) => ({
          donationRemainderCents: banked.remainder,
          stats: {
            ...s.stats,
            totalDonations: s.stats.totalDonations + 1,
            totalDonationCents: s.stats.totalDonationCents + cents,
            pointsFromDonations: s.stats.pointsFromDonations + banked.points,
          },
          week: { ...s.week, donationCents: s.week.donationCents + cents },
        }),
      );
    },

    rolloverIfNeeded(now = new Date()) {
      const state = get();
      const key = weeklyKey(now);
      if (state.week.start === key) return;

      // Archive the finished week (skip completely empty ones) and start fresh.
      const history = [...state.history];
      if (state.week.points > 0) {
        history.unshift({
          start: state.week.start,
          points: state.week.points,
          goalsCompleted:
            completedWeeklyGoals(state.points) - completedWeeklyGoals(state.week.startPoints),
        });
      }
      set({
        history: history.slice(0, HISTORY_LIMIT),
        week: {
          start: key,
          startPoints: state.points,
          points: 0,
          bits: 0,
          subs: 0,
          donationCents: 0,
        },
      });
      persist();
    },

    clearLog() {
      set({ log: [] });
      persist();
    },

    resetEverything() {
      set(emptyData());
      persist();
    },

    /**
     * Manually set the lifetime counter to a specific value, e.g. when
     * first linking a channel that already has an existing goal in
     * progress. Logs the change so it's visible in the Event Log, but
     * doesn't touch stats (bits/subs/donations totals) since this isn't a
     * real contribution — just a starting point correction.
     */
    setPoints(points) {
      if (!Number.isFinite(points) || points < 0) return;
      const rounded = Math.floor(points);
      set((state) => {
        const delta = rounded - state.points;
        return {
          points: rounded,
          week: { ...state.week, points: state.week.points + delta },
          log: [
            {
              id: crypto.randomUUID(),
              at: new Date().toISOString(),
              kind: "manual" as const,
              label: "Manual adjustment",
              detail: `Set to ${rounded}`,
              points: delta,
            },
            ...state.log,
          ].slice(0, LOG_LIMIT),
        };
      });
      persist();
    },
  };
});
