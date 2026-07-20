/** Twitch sub tiers as they appear in EventSub payloads. Prime reports as "1000". */
export type SubTier = "1000" | "2000" | "3000";

export type ContributionKind = "bits" | "sub" | "gift-sub" | "donation" | "manual";

export interface LogEntry {
  id: string;
  /** ISO timestamp */
  at: string;
  kind: ContributionKind;
  /** e.g. "600 Bits", "Tier 3 Sub", "Donation $6.00" */
  label: string;
  /** e.g. username, power-up name, banked remainder */
  detail?: string;
  points: number;
}

export interface Stats {
  totalBits: number;
  /** Every sub counted once, including each gifted sub. */
  totalSubs: number;
  totalGiftSubs: number;
  totalDonations: number;
  totalDonationCents: number;
  /** Lifetime points broken down by where they came from. */
  pointsFromBits: number;
  pointsFromSubs: number;
  pointsFromDonations: number;
}

export interface WeekState {
  /** ISO date (yyyy-mm-dd) of the Saturday this week started on. */
  start: string;
  /** Counter value when the week started, used to compute goals completed this week. */
  startPoints: number;
  points: number;
  bits: number;
  subs: number;
  donationCents: number;
}

export interface WeekSummary {
  start: string;
  points: number;
  goalsCompleted: number;
}

export interface SaturdayState {
  /**
   * ISO date key of the Saturday window this snapshot belongs to, or null
   * if the window hasn't been snapshotted yet (either it's not active, or
   * the app hasn't run since it opened).
   */
  windowStart: string | null;
  /**
   * The Saturday counter. Set once per window from the weekly "left number"
   * divided by 3, then every contribution during the window adds its full,
   * undivided value on top.
   */
  points: number;
}

export interface GoalData {
  /**
   * The lifetime counter, as a running decimal. Every bit and cent counts
   * immediately toward it, nothing is hidden in a remainder until it
   * reaches a whole point.
   */
  points: number;
  stats: Stats;
  week: WeekState;
  saturday: SaturdayState;
  history: WeekSummary[];
  log: LogEntry[];
}

export interface Settings {
  /** False until the first-launch setup wizard has been completed or skipped. */
  onboardingComplete: boolean;
  twitchToken: string;
  streamlabsToken: string;
  autoConnect: boolean;
  /** Weekly goal (57, 114, 171...) text file output. */
  weeklyOutputEnabled: boolean;
  weeklyOutputPath: string;
  weeklyOutputTemplate: string;
  /** Saturday goal (19, 38, 57...) text file output (Sat 8pm - Sun 7:59pm PT). */
  saturdayOutputEnabled: boolean;
  saturdayOutputPath: string;
  saturdayOutputTemplate: string;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface ServiceState {
  status: ConnectionStatus;
  /** Channel login for Twitch once validated. */
  channel?: string;
  error?: string;
}
