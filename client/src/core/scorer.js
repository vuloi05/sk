/**
 * DictaFlow — Scoring Engine
 *
 * Implements exact-match word-by-word comparison with diff display.
 * Uses a simple LCS (Longest Common Subsequence) approach for alignment.
 */

/**
 * @typedef {Object} DiffToken
 * @property {string} text - The word text
 * @property {'correct'|'wrong'|'missing'|'extra'} type - Diff type
 * @property {string} [expected] - Expected word (for 'wrong' type)
 */

/**
 * @typedef {Object} ScoreResult
 * @property {number} score - Score percentage (0-100)
 * @property {number} totalWords - Total expected words
 * @property {number} correctWords - Correctly typed words
 * @property {number} wrongWords - Wrong words
 * @property {number} missingWords - Missing words
 * @property {number} extraWords - Extra words typed
 * @property {DiffToken[]} diff - Token-level diff for display
 */

/**
 * Normalize text for comparison.
 * - Lowercase
 * - Remove punctuation (keep letters, numbers, CJK characters)
 * - Trim whitespace
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize text into words for comparison.
 * For Japanese, split by spaces (since Gemini provides spaced output).
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized.split(/\s+/);
}

/**
 * Compute LCS (Longest Common Subsequence) table.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number[][]}
 */
function lcsTable(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

/**
 * Build diff from LCS table.
 * @param {string[]} expected - Expected words
 * @param {string[]} actual - User's words
 * @returns {DiffToken[]}
 */
function buildDiff(expected, actual) {
  const dp = lcsTable(expected, actual);
  const diff = [];

  let i = expected.length;
  let j = actual.length;

  // Backtrack to build diff
  const operations = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expected[i - 1] === actual[j - 1]) {
      operations.unshift({ type: 'correct', text: expected[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      operations.unshift({ type: 'extra', text: actual[j - 1] });
      j--;
    } else {
      operations.unshift({ type: 'missing', text: expected[i - 1] });
      i--;
    }
  }

  // Merge adjacent missing + extra into "wrong" (substitution)
  for (let k = 0; k < operations.length; k++) {
    const op = operations[k];

    if (
      op.type === 'missing' &&
      k + 1 < operations.length &&
      operations[k + 1].type === 'extra'
    ) {
      diff.push({
        type: 'wrong',
        text: operations[k + 1].text,
        expected: op.text,
      });
      k++; // skip next
    } else if (
      op.type === 'extra' &&
      k + 1 < operations.length &&
      operations[k + 1].type === 'missing'
    ) {
      diff.push({
        type: 'wrong',
        text: op.text,
        expected: operations[k + 1].text,
      });
      k++;
    } else {
      diff.push(op);
    }
  }

  return diff;
}

/**
 * Score a dictation attempt by comparing user input to expected text.
 * @param {string} expectedText - The correct transcript
 * @param {string} userText - What the user typed
 * @returns {ScoreResult}
 */
export function scoreDictation(expectedText, userText) {
  const expected = tokenize(expectedText);
  const actual = tokenize(userText);

  if (expected.length === 0) {
    return {
      score: actual.length === 0 ? 100 : 0,
      totalWords: 0,
      correctWords: 0,
      wrongWords: 0,
      missingWords: 0,
      extraWords: actual.length,
      diff: actual.map(w => ({ type: 'extra', text: w })),
    };
  }

  const diff = buildDiff(expected, actual);

  let correctWords = 0;
  let wrongWords = 0;
  let missingWords = 0;
  let extraWords = 0;

  for (const token of diff) {
    switch (token.type) {
      case 'correct': correctWords++; break;
      case 'wrong': wrongWords++; break;
      case 'missing': missingWords++; break;
      case 'extra': extraWords++; break;
    }
  }

  const totalWords = expected.length;
  const score = Math.round((correctWords / totalWords) * 100);

  return {
    score,
    totalWords,
    correctWords,
    wrongWords,
    missingWords,
    extraWords,
    diff,
  };
}

/**
 * Score a gap-fill answer (exact match for a single word).
 * @param {string} expected
 * @param {string} actual
 * @returns {boolean}
 */
export function scoreGapFill(expected, actual) {
  return normalizeText(expected) === normalizeText(actual);
}

/**
 * Score a multiple-choice answer.
 * @param {string} expected
 * @param {string} actual
 * @returns {boolean}
 */
export function scoreMCQ(expected, actual) {
  return normalizeText(expected) === normalizeText(actual);
}
