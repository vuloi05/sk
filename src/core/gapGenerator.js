/**
 * DictaFlow — Local Gap-fill Generator (Fallback)
 *
 * Used when gap-fill data is not pre-computed from Gemini.
 * Applies simple heuristic rules to choose words to hide.
 */

/**
 * Generate gap-fill data for a sentence using local heuristics.
 * @param {string} text - The sentence text
 * @param {string} language - 'ja' or 'en'
 * @param {string} difficulty - 'beginner', 'intermediate', 'advanced'
 * @returns {{words: string[], hiddenIndices: number[]}}
 */
export function generateLocalGapFill(text, language, difficulty) {
  const words = text.split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) {
    return { words: [], hiddenIndices: [] };
  }

  // Determine how many words to hide based on difficulty
  const ratioMap = { beginner: 0.15, intermediate: 0.25, advanced: 0.4 };
  const ratio = ratioMap[difficulty] || 0.25;
  const hideCount = Math.max(1, Math.round(words.length * ratio));

  // Score each word for "importance" (higher = more likely to hide)
  const scores = words.map((word, i) => {
    let score = 0;

    if (language === 'ja') {
      // Japanese: prefer kanji-heavy words, longer words
      const kanjiCount = (word.match(/[\u4e00-\u9faf]/g) || []).length;
      score += kanjiCount * 3;
      score += word.length;
      // Avoid hiding particles (single hiragana)
      if (word.length === 1 && /[\u3040-\u309f]/.test(word)) score -= 5;
    } else {
      // English: prefer longer content words
      score += word.length;
      // Common function words to avoid hiding
      const functionWords = new Set([
        'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were',
        'be', 'been', 'being', 'do', 'does', 'did',
        'have', 'has', 'had', 'will', 'would', 'could', 'should',
        'may', 'might', 'can', 'shall', 'must',
        'i', 'you', 'he', 'she', 'it', 'we', 'they',
        'me', 'him', 'her', 'us', 'them',
        'my', 'your', 'his', 'its', 'our', 'their',
        'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'and', 'or', 'but', 'not', 'no', 'if', 'so', 'as',
        'this', 'that', 'these', 'those',
      ]);
      const lowerWord = word.toLowerCase().replace(/[^\p{L}]/gu, '');
      if (functionWords.has(lowerWord)) score -= 5;
      if (lowerWord.length >= 5) score += 2;
    }

    // Add some randomness
    score += Math.random() * 2;

    return { index: i, score };
  });

  // Sort by score descending and pick top N
  scores.sort((a, b) => b.score - a.score);
  const hiddenIndices = scores
    .slice(0, hideCount)
    .map(s => s.index)
    .sort((a, b) => a - b);

  return { words, hiddenIndices };
}

/**
 * Apply gap-fill data to create a display structure.
 * @param {string} text
 * @param {{words: string[], hiddenIndices: number[]}} gapData
 * @returns {Array<{text: string, isBlank: boolean, answer?: string, index?: number}>}
 */
export function applyGapFill(text, gapData) {
  if (!gapData || !gapData.words) {
    // Fallback: just show the full sentence
    return [{ text, isBlank: false }];
  }

  return gapData.words.map((word, i) => {
    if (gapData.hiddenIndices.includes(i)) {
      return { text: '____', isBlank: true, answer: word, index: i };
    }
    return { text: word, isBlank: false };
  });
}
