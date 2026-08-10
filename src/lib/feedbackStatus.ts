import type { TicketStatus } from "../stores/feedbackStore";

const STATUS_URL =
  "https://raw.githubusercontent.com/verrucosity/skrrtthing/main/feedback-status.json";

/**
 * Pulls the shared status file from the repo and returns it as a map of
 * ticket id -> status. Editing this one file (and pushing) is how status
 * updates get back to whoever's running the app, no server needed. Fails
 * silently since this is a nice-to-have, not core functionality.
 */
export async function fetchFeedbackStatuses(): Promise<Record<string, TicketStatus>> {
  try {
    const res = await fetch(`${STATUS_URL}?t=${Date.now()}`);
    if (!res.ok) return {};
    return (await res.json()) as Record<string, TicketStatus>;
  } catch {
    return {};
  }
}
