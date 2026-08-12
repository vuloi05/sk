/**
 * DictaFlow — SRS Algorithm (Anki-faithful SM-2)
 *
 * Implements a Spaced Repetition System closely matching Anki's behavior:
 * - Learning Steps (1min → 10min → graduate)
 * - 3 card states: learning, review, relearning
 * - Lapse handling (review card forgotten → relearning)
 * - Fuzz factor to prevent card clustering
 */

// ============================================
// Configuration (mirrors Anki defaults)
// ============================================
const LEARNING_STEPS = [1, 10];       // minutes — steps for new cards
const RELEARNING_STEPS = [10];        // minutes — steps for lapsed cards
const GRADUATING_INTERVAL = 1;        // days — interval after graduating from learning
const EASY_INTERVAL = 4;              // days — interval when pressing Easy on a learning card
const NEW_CARDS_PER_DAY = 20;         // daily limit for new cards
const STARTING_EASE = 2.5;            // default ease factor
const MINIMUM_EASE = 1.3;             // floor for ease factor

// ============================================
// Card States
// ============================================
// 'new'        — never been studied
// 'learning'   — in learning steps (new card being learned)
// 'review'     — graduated, scheduled for spaced review
// 'relearning' — was review but lapsed (forgotten), re-doing learning steps

/**
 * Create a fresh SRS record for a new card.
 * @returns {Object}
 */
export function createNewCard() {
  return {
    state: 'new',
    ease: STARTING_EASE,
    interval: 0,
    reps: 0,
    step: 0,
    lapses: 0,
    nextReview: 0,
  };
}

/**
 * Add fuzz (±5%) to intervals > 2 days to prevent card clustering.
 * @param {number} interval - interval in days
 * @returns {number}
 */
function addFuzz(interval) {
  if (interval < 3) return interval;
  const fuzz = Math.max(1, Math.round(interval * 0.05));
  const offset = Math.floor(Math.random() * (fuzz * 2 + 1)) - fuzz;
  return Math.max(1, interval + offset);
}

/**
 * Calculate the next review based on grade and current card state.
 *
 * @param {number} grade - 0=Again, 1=Hard, 2=Good, 3=Easy
 * @param {Object} card - Current SRS state of the card
 * @returns {Object} Updated card state with new nextReview
 */
export function calculateNextReview(grade, card) {
  // Clone to avoid mutation
  const c = { ...card };
  const now = Date.now();

  // Ensure defaults
  if (c.state === undefined || c.state === 'new') c.state = 'learning';
  if (c.ease === undefined) c.ease = STARTING_EASE;
  if (c.step === undefined) c.step = 0;
  if (c.lapses === undefined) c.lapses = 0;
  if (c.reps === undefined) c.reps = 0;
  if (c.interval === undefined) c.interval = 0;

  // ─── LEARNING / RELEARNING state ───
  if (c.state === 'learning' || c.state === 'relearning') {
    const steps = c.state === 'learning' ? LEARNING_STEPS : RELEARNING_STEPS;

    switch (grade) {
      case 0: // Again — reset to step 0
        c.step = 0;
        c.nextReview = now + steps[0] * 60 * 1000;
        break;

      case 1: // Hard — repeat current step
        c.nextReview = now + steps[c.step] * 60 * 1000;
        break;

      case 2: // Good — advance to next step, or graduate
        if (c.step + 1 >= steps.length) {
          // Graduate!
          const wasRelearning = c.state === 'relearning';
          c.state = 'review';
          c.interval = wasRelearning
            ? Math.max(1, Math.round(card.interval * 0.7)) // Lapsed: reduced interval
            : GRADUATING_INTERVAL;
          c.reps = wasRelearning ? c.reps : c.reps + 1;
          c.nextReview = _daysFromNow(c.interval);
        } else {
          c.step += 1;
          c.nextReview = now + steps[c.step] * 60 * 1000;
        }
        break;

      case 3: // Easy — graduate immediately with bonus interval
        c.state = 'review';
        c.interval = EASY_INTERVAL;
        c.ease = Math.max(MINIMUM_EASE, c.ease + 0.15);
        c.reps += 1;
        c.nextReview = _daysFromNow(c.interval);
        break;
    }

    return c;
  }

  // ─── REVIEW state ───
  switch (grade) {
    case 0: // Again — LAPSE! Enter relearning
      c.state = 'relearning';
      c.step = 0;
      c.lapses += 1;
      c.ease = Math.max(MINIMUM_EASE, c.ease - 0.2);
      // Don't reset interval yet — it's preserved for graduation calculation
      c.nextReview = now + RELEARNING_STEPS[0] * 60 * 1000;
      break;

    case 1: { // Hard — shorter interval, decrease ease
      const hardInterval = Math.max(c.interval + 1, Math.round(c.interval * 1.2));
      c.interval = addFuzz(hardInterval);
      c.ease = Math.max(MINIMUM_EASE, c.ease - 0.15);
      c.reps += 1;
      c.nextReview = _daysFromNow(c.interval);
      break;
    }

    case 2: { // Good — normal interval
      const goodInterval = Math.max(c.interval + 1, Math.round(c.interval * c.ease));
      c.interval = addFuzz(goodInterval);
      c.reps += 1;
      c.nextReview = _daysFromNow(c.interval);
      break;
    }

    case 3: { // Easy — boosted interval, increase ease
      const easyInterval = Math.max(c.interval + 1, Math.round(c.interval * c.ease * 1.3));
      c.interval = addFuzz(easyInterval);
      c.ease += 0.15;
      c.reps += 1;
      c.nextReview = _daysFromNow(c.interval);
      break;
    }
  }

  return c;
}

/**
 * Determine the display status of a card for the dashboard.
 * @param {Object} srsData - Stored SRS data for a card (or null/undefined)
 * @param {number} [nowMs] - Current timestamp in ms
 * @returns {'new' | 'learning' | 'due' | 'review'}
 */
export function getCardStatus(srsData, nowMs = Date.now()) {
  if (!srsData || srsData.state === 'new') return 'new';
  if (srsData.state === 'learning' || srsData.state === 'relearning') {
    return srsData.nextReview <= nowMs ? 'due' : 'learning';
  }
  // state === 'review'
  if (srsData.nextReview <= nowMs) return 'due';
  return 'review'; // Scheduled for the future, not due yet
}

/**
 * Build the session queue (mimics Anki's queue builder).
 * Interleaves new + learning/relearning + review cards.
 *
 * @param {Array} allCards - Array of { literal, jlpt, ... }
 * @param {Object} srsMap - Map of literal -> srsData
 * @param {number} jlptLevel - JLPT tab filter
 * @returns {{ queue: Array, stats: { newCount, dueCount, reviewCount } }}
 */
export function buildSessionQueue(allCards, srsMap, jlptLevel) {
  const now = Date.now();
  const tabCards = allCards.filter(k => k.jlpt === jlptLevel);

  const newCards = [];
  const learningDue = [];
  const reviewDue = [];
  let reviewFutureCount = 0;

  for (const k of tabCards) {
    const srs = srsMap[k.literal];
    const status = getCardStatus(srs, now);

    switch (status) {
      case 'new':
        newCards.push(k);
        break;
      case 'due':
        if (srs.state === 'learning' || srs.state === 'relearning') {
          learningDue.push(k);
        } else {
          reviewDue.push(k);
        }
        break;
      case 'learning':
        // Learning but not yet due — skip for now
        break;
      case 'review':
        reviewFutureCount++;
        break;
    }
  }

  // Limit new cards per day
  const todayKey = new Date().toDateString();
  const studiedToday = parseInt(localStorage.getItem(`dictaflow_new_${jlptLevel}_${todayKey}`) || '0');
  const newLimit = Math.max(0, NEW_CARDS_PER_DAY - studiedToday);
  const newSlice = newCards.slice(0, newLimit);

  // Build interleaved queue:
  // 1. Learning/relearning due cards first (they need immediate attention)
  // 2. Then interleave new + review
  const queue = [...learningDue];

  // Shuffle review and new, then interleave
  const shuffled = [...reviewDue.sort(() => Math.random() - 0.5)];
  const newShuffled = [...newSlice.sort(() => Math.random() - 0.5)];

  // Interleave: insert 1 new card every ~5 review cards (Anki's approach)
  let ni = 0;
  let ri = 0;
  let count = 0;
  while (ni < newShuffled.length || ri < shuffled.length) {
    // Every 5th card, try to insert a new card
    if (ni < newShuffled.length && (count % 5 === 0 || ri >= shuffled.length)) {
      queue.push(newShuffled[ni++]);
    } else if (ri < shuffled.length) {
      queue.push(shuffled[ri++]);
    }
    count++;
  }

  return {
    queue,
    stats: {
      newCount: newCards.length,
      dueCount: learningDue.length + reviewDue.length,
      reviewCount: reviewFutureCount,
    },
  };
}

/**
 * Get the preview text for each button (shows next interval).
 * @param {Object} card - Current SRS data
 * @returns {{ again: string, hard: string, good: string, easy: string }}
 */
export function getButtonPreviews(card) {
  const c = card || createNewCard();
  const isLearning = c.state === 'learning' || c.state === 'relearning' || c.state === 'new';
  const steps = (c.state === 'relearning') ? RELEARNING_STEPS : LEARNING_STEPS;

  if (isLearning) {
    const step = c.step || 0;
    return {
      again: `${steps[0]}p`,                                    // Reset to step 0
      hard: `${steps[step]}p`,                                  // Repeat current step
      good: step + 1 >= steps.length ? `${GRADUATING_INTERVAL}n` : `${steps[step + 1]}p`, // Next step or graduate
      easy: `${EASY_INTERVAL}n`,                                // Graduate immediately
    };
  }

  // Review state
  const hardIntv = Math.max(c.interval + 1, Math.round(c.interval * 1.2));
  const goodIntv = Math.max(c.interval + 1, Math.round(c.interval * c.ease));
  const easyIntv = Math.max(c.interval + 1, Math.round(c.interval * c.ease * 1.3));

  return {
    again: `${RELEARNING_STEPS[0]}p`,
    hard: _formatDays(hardIntv),
    good: _formatDays(goodIntv),
    easy: _formatDays(easyIntv),
  };
}

// ============================================
// Helpers
// ============================================

function _daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function _formatDays(days) {
  if (days < 30) return `${days}n`;
  if (days < 365) return `${Math.round(days / 30)}th`;
  return `${(days / 365).toFixed(1)}n\u0103m`;
}

export { NEW_CARDS_PER_DAY };
