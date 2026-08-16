/**
 * DictaFlow — Kanji Lookup Service
 * 
 * Lazy-loads kanji.json and provides lookup utilities.
 */

/** @type {Object<string, {g?:number, s?:number, f?:number, j?:number, on?:string[], kun?:string[], v?:string[], m?:string[]}>|null} */
let kanjiData = null;
let loading = false;

/**
 * Unicode range check: is this character a CJK Unified Ideograph (Kanji)?
 * @param {string} char - Single character
 * @returns {boolean}
 */
export function isKanji(char) {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9faf) ||  // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) ||  // CJK Unified Ideographs Extension A
    (code >= 0x20000 && code <= 0x2a6df)   // CJK Unified Ideographs Extension B
  );
}

/**
 * Load kanji data from public/kanji.json (lazy, cached).
 * @returns {Promise<Object>}
 */
export async function loadKanjiData() {
  if (kanjiData) return kanjiData;
  if (loading) {
    // Wait for ongoing load
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (kanjiData) {
          clearInterval(interval);
          resolve(kanjiData);
        }
      }, 50);
    });
  }

  loading = true;
  try {
    const response = await fetch('/kanji.json');
    if (!response.ok) throw new Error(`Failed to load kanji.json: ${response.status}`);
    kanjiData = await response.json();
    console.log(`[KanjiService] Loaded ${Object.keys(kanjiData).length} kanji entries.`);
    return kanjiData;
  } catch (err) {
    console.error('[KanjiService] Error loading kanji data:', err);
    kanjiData = {};
    return kanjiData;
  } finally {
    loading = false;
  }
}

/**
 * Look up a single kanji character.
 * @param {string} char - A single kanji character
 * @returns {Promise<{literal:string, grade?:number, strokes?:number, freq?:number, jlpt?:number, on?:string[], kun?:string[], viet?:string[], meaning?:string[]}|null>}
 */
export async function lookupKanji(char) {
  const data = await loadKanjiData();
  const entry = data[char];
  if (!entry) return null;

  return {
    literal: char,
    grade: entry.g ?? null,
    strokes: entry.s ?? null,
    freq: entry.f ?? null,
    jlpt: entry.j ?? null,
    on: entry.on ?? [],
    kun: entry.kun ?? [],
    viet: entry.v ?? [],
    meaning: entry.m ?? [],
  };
}

/**
 * Extract all unique kanji from a text string, with their info.
 * @param {string} text
 * @returns {Promise<Array<{literal:string, jlpt?:number, meaning?:string[]}>>}
 */
export async function analyzeText(text) {
  const data = await loadKanjiData();
  const seen = new Set();
  const results = [];

  for (const char of text) {
    if (isKanji(char) && !seen.has(char)) {
      seen.add(char);
      const entry = data[char];
      results.push({
        literal: char,
        jlpt: entry?.j ?? null,
        strokes: entry?.s ?? null,
        meaning: entry?.m ?? [],
        viet: entry?.v ?? [],
      });
    }
  }

  // Sort by JLPT level (easiest first: 4→1, null last)
  results.sort((a, b) => {
    if (a.jlpt === null && b.jlpt === null) return 0;
    if (a.jlpt === null) return 1;
    if (b.jlpt === null) return -1;
    return b.jlpt - a.jlpt; // Higher number = easier (4=N4, 1=N1)
  });

  return results;
}

/**
 * Analyze text and determine the overall JLPT difficulty level.
 * Returns distribution + suggested level.
 * @param {string} text
 * @returns {Promise<{distribution: Object<string, number>, suggested: string, totalKanji: number, uniqueKanji: number}>}
 */
export async function getJlptLevel(text) {
  const kanjiList = await analyzeText(text);

  const distribution = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0, unknown: 0 };
  for (const k of kanjiList) {
    if (k.jlpt === 4) distribution.N5++;      // KANJIDIC uses 4 for N5-level
    else if (k.jlpt === 3) distribution.N4++;  // 3 for N4-level
    else if (k.jlpt === 2) distribution.N3++;  // 2 for N3-level  
    else if (k.jlpt === 1) distribution.N1++;  // 1 for N1-level
    else distribution.unknown++;
  }

  // Note: KANJIDIC2 JLPT field uses old scale (1-4), not new N1-N5.
  // jlpt=4 → easiest (roughly N5/N4), jlpt=1 → hardest (N1)
  // We'll map: 4→Beginner, 3→Beginner, 2→Intermediate, 1→Advanced

  // Determine suggested level based on hardest kanji present
  let suggested = 'beginner';
  const total = kanjiList.length;
  if (total === 0) {
    suggested = 'beginner';
  } else {
    const advancedRatio = distribution.N1 / total;
    const intermediateRatio = (distribution.N2 + distribution.N3) / total;

    if (advancedRatio > 0.2 || distribution.N1 >= 3) {
      suggested = 'advanced';
    } else if (intermediateRatio > 0.3 || distribution.N2 >= 2 || distribution.N3 >= 3) {
      suggested = 'intermediate';
    }
  }

  return {
    distribution,
    suggested,
    totalKanji: total,
    uniqueKanji: kanjiList.length,
  };
}
