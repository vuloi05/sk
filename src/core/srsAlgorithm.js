/**
 * DictaFlow — SRS Algorithm (Simplified SM-2)
 *
 * Implements a Spaced Repetition System based on Anki's SM-2 algorithm.
 */

/**
 * Calculate the next review date and updated SRS metrics.
 * 
 * @param {number} grade - User's rating (0=Again, 1=Hard, 2=Good, 3=Easy)
 * @param {Object} currentSrs - Current state of the card
 * @param {number} currentSrs.ease - Ease factor (default 2.5)
 * @param {number} currentSrs.interval - Current interval in days (default 0)
 * @param {number} currentSrs.reps - Successful consecutive reps (default 0)
 * @returns {Object} { ease, interval, reps, nextReview }
 */
export function calculateNextReview(grade, currentSrs) {
  let ease = currentSrs?.ease ?? 2.5;
  let interval = currentSrs?.interval ?? 0;
  let reps = currentSrs?.reps ?? 0;

  switch (grade) {
    case 0: // Again (Lại - Quên)
      reps = 0;
      interval = 0; // Due today
      ease = Math.max(1.3, ease - 0.2);
      break;

    case 1: // Hard (Khó - Nhớ mang máng)
      reps = Math.max(1, reps);
      interval = Math.max(1, Math.round(interval * 1.2));
      ease = Math.max(1.3, ease - 0.15);
      break;

    case 2: // Good (Tốt - Nhớ)
      reps += 1;
      if (reps === 1) interval = 1;
      else if (reps === 2) interval = 3;
      else interval = Math.max(interval + 1, Math.round(interval * ease));
      break;

    case 3: // Easy (Dễ - Quá thuộc)
      reps += 1;
      if (reps === 1) interval = 4;
      else interval = Math.max(interval + 1, Math.round(interval * ease * 1.3));
      ease += 0.15;
      break;
  }

  const now = new Date();
  const nextReview = new Date(now);

  if (interval === 0) {
    // If Again, review in 1 minute
    nextReview.setMinutes(now.getMinutes() + 1);
  } else {
    // Otherwise, review starts at midnight of the target day
    nextReview.setDate(now.getDate() + interval);
    nextReview.setHours(0, 0, 0, 0);
  }

  return { 
    ease, 
    interval, 
    reps, 
    nextReview: nextReview.getTime() 
  };
}

/**
 * Determine the status of a card relative to current time.
 * @param {Object} srsData - The stored SRS data for a card
 * @param {number} nowMs - Current time in ms
 * @returns {'new' | 'learning' | 'review' | 'due'}
 */
export function getCardStatus(srsData, nowMs = Date.now()) {
  if (!srsData) return 'new';
  if (srsData.nextReview <= nowMs) return 'due';
  if (srsData.interval === 0) return 'learning';
  return 'review'; // Scheduled for the future
}
