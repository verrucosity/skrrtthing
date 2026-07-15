/** Twitch sub tiers as they appear in EventSub payloads. Prime reports as "1000". */
export type SubTier = "1000" | "2000" | "3000";

export type ContributionKind = "bits" | "sub" | "gift-sub" | "donation";

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

export interface GoalData {
  /** The lifetime counter. Never resets. */
  points: number;
  /** Bits below the 600 threshold, carried until they add up to a point. */
  bitsRemainder: number;
  /** Donation cents below the $6 threshold, carried the same way. */
  donationRemainderCents: number;
  stats: Stats;
  week: WeekState;
  history: WeekSummary[];
  log: LogEntry[];
}

export interface Settings {
  twitchToken: string;
  streamlabsToken: string;
  autoConnect: boolean;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface ServiceState {
  status: ConnectionStatus;
  /** Channel login for Twitch once validated. */
  channel?: string;
  error?: string;
}
