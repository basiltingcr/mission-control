import type { DecisionResolution } from "./types";

/**
 * Decide how an answer resolves a proposal (fork, MC-004).
 *
 * - An explicit resolution always wins (rejected / expired are set this way).
 * - Otherwise, an answer equal to the recommendation is "accepted", a different
 *   one is "edited", and with no recommendation there is nothing to compare → null.
 * - No answer → the existing resolution is kept.
 */
export function deriveResolution(
  decision: { recommendedOption: string | null; resolution: DecisionResolution | null },
  answer: string | null | undefined,
  explicit: DecisionResolution | null | undefined
): DecisionResolution | null {
  if (explicit !== undefined && explicit !== null) return explicit;
  if (answer === undefined || answer === null) return decision.resolution;
  if (decision.recommendedOption === null) return null;
  return answer.trim() === decision.recommendedOption.trim() ? "accepted" : "edited";
}
