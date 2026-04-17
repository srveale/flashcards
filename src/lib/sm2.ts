/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality ratings:
 *   0 - Complete blackout
 *   1 - Incorrect; correct answer remembered upon seeing it
 *   2 - Incorrect; correct answer seemed easy to recall
 *   3 - Correct with serious difficulty
 *   4 - Correct after hesitation
 *   5 - Perfect response
 *
 * A rating of 3+ counts as "correct" and advances the card.
 * A rating below 3 resets repetitions to 0 (card goes back to learning).
 */

export interface SM2Card {
  repetitions: number;   // number of consecutive correct reviews
  ease_factor: number;   // easiness factor (>= 1.3)
  interval: number;      // current interval in days
  next_review: string;   // ISO date string for next review
}

export interface SM2Result {
  repetitions: number;
  ease_factor: number;
  interval: number;
  next_review: string;
}

export function sm2(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): SM2Result {
  // Clamp quality to 0-5
  quality = Math.max(0, Math.min(5, Math.round(quality)));

  let newRepetitions: number;
  let newInterval: number;
  let newEaseFactor: number;

  if (quality >= 3) {
    // Correct response
    switch (repetitions) {
      case 0:
        newInterval = 1;
        break;
      case 1:
        newInterval = 6;
        break;
      default:
        newInterval = Math.round(interval * easeFactor);
        break;
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect response — reset
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor using SM-2 formula
  newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ease factor must not drop below 1.3
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  // Calculate next review date
  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    ease_factor: Math.round(newEaseFactor * 100) / 100,
    interval: newInterval,
    next_review: nextReview.toISOString(),
  };
}

/** Returns true if a card is due for review */
export function isDue(nextReview: string): boolean {
  return new Date(nextReview) <= new Date();
}

/** Default values for a brand-new card */
export const NEW_CARD_DEFAULTS: Pick<SM2Card, "repetitions" | "ease_factor" | "interval"> = {
  repetitions: 0,
  ease_factor: 2.5,
  interval: 0,
};
