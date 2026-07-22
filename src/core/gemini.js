/**
 * DictaFlow — Gemini API Wrapper
 *
 * Handles:
 * 1. Audio transcription (multimodal)
 * 2. Gap-fill generation (pre-compute)
 * 3. MCQ distractor generation (pre-compute)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { sleep } from '../utils/helpers.js';

/** @type {GoogleGenerativeAI|null} */
let genAI = null;

/**
 * Initialize the Gemini client with user's API key.
 * @param {string} apiKey
 */
export async function initGemini(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log('Available Models:', data.models.map(m => m.name));
  } catch (err) {
    console.error('Failed to list models:', err);
  }
}

/**
 * Check if Gemini is initialized.
 * @returns {boolean}
 */
export function isGeminiReady() {
  return genAI !== null;
}

/**
 * Transcribe an audio file using Gemini's multimodal capability.
 * @param {File} audioFile - The audio file to transcribe
 * @param {string} language - 'ja' or 'en'
 * @returns {Promise<Array<{text: string, startTime: number, endTime: number}>>}
 */
export async function transcribeAudio(audioFile, language) {
  if (!genAI) throw new Error('Vui lòng nhập Gemini API key trước.');

  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  // Convert file to base64
  const arrayBuffer = await audioFile.arrayBuffer();
  const base64Data = arrayBufferToBase64(arrayBuffer);

  const langName = language === 'ja' ? 'Japanese' : 'English';

  const prompt = `You are a professional transcription assistant. Listen to this audio file and transcribe it accurately in ${langName}.

Return a JSON array of sentences. Each sentence should have:
- "text": the transcribed text of that sentence
- "startTime": EXACT start time in seconds with 2 decimal precision (e.g. 1.25)
- "endTime": EXACT end time in seconds with 2 decimal precision (e.g. 3.40)

Rules:
- Split the audio into natural sentence-level segments
- For Japanese, use standard kanji and hiragana (no romaji)
- For English, use standard capitalization and punctuation
- Be as accurate as possible with the transcription
- EXACT TIMESTAMPS are critical for a dictation app. Do not estimate, listen closely for the exact millisecond a sentence starts and stops.
- Return ONLY the JSON array, no markdown fences, no explanation

Example output:
[
  {"text": "Good morning everyone.", "startTime": 0, "endTime": 2.5},
  {"text": "Today we will learn about...", "startTime": 2.5, "endTime": 5.0}
]`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: audioFile.type || 'audio/mpeg',
        data: base64Data,
      },
    },
  ]);

  const responseText = result.response.text().trim();

  // Parse JSON from response (handle potential markdown fences)
  const jsonStr = responseText
    .replace(/^```json?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const sentences = JSON.parse(jsonStr);
    if (!Array.isArray(sentences)) throw new Error('Response is not an array');
    return sentences;
  } catch (err) {
    console.error('[Gemini] Failed to parse transcript:', responseText);
    throw new Error('Không thể phân tích transcript từ Gemini. Vui lòng thử lại.');
  }
}

/**
 * Transcribe a YouTube video using Gemini's multimodal capability.
 * Gemini supports YouTube URLs directly via fileData.
 * Returns the same interface as transcribeAudio (DIP principle).
 * @param {string} youtubeUrl - Full YouTube URL (e.g. https://www.youtube.com/watch?v=...)
 * @param {string} language - 'ja' or 'en'
 * @returns {Promise<Array<{text: string, startTime: number, endTime: number}>>}
 */
export async function transcribeYouTube(youtubeUrl, language) {
  if (!genAI) throw new Error('Vui lòng nhập Gemini API key trước.');

  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const langName = language === 'ja' ? 'Japanese' : 'English';

  const prompt = `You are a professional transcription assistant. Watch this YouTube video and transcribe the spoken audio accurately in ${langName}.

Return a JSON array of sentences. Each sentence should have:
- "text": the transcribed text of that sentence
- "startTime": EXACT start time in seconds with 2 decimal precision (e.g. 1.25)
- "endTime": EXACT end time in seconds with 2 decimal precision (e.g. 3.40)

Rules:
- Split the audio into natural sentence-level segments
- For Japanese, use standard kanji and hiragana (no romaji)
- For English, use standard capitalization and punctuation
- Be as accurate as possible with the transcription
- EXACT TIMESTAMPS are critical for a dictation app. Do not estimate, listen closely for the exact millisecond a sentence starts and stops.
- Ignore any background music, sound effects, or non-speech audio
- Return ONLY the JSON array, no markdown fences, no explanation

Example output:
[
  {"text": "Good morning everyone.", "startTime": 0, "endTime": 2.5},
  {"text": "Today we will learn about...", "startTime": 2.5, "endTime": 5.0}
]`;

  const result = await model.generateContent([
    prompt,
    {
      fileData: {
        fileUri: youtubeUrl,
        mimeType: 'video/mp4',
      },
    },
  ]);

  const responseText = result.response.text().trim();

  // Parse JSON from response (handle potential markdown fences)
  const jsonStr = responseText
    .replace(/^```json?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const sentences = JSON.parse(jsonStr);
    if (!Array.isArray(sentences)) throw new Error('Response is not an array');
    return sentences;
  } catch (err) {
    console.error('[Gemini] Failed to parse YouTube transcript:', responseText);
    throw new Error('Không thể phân tích transcript từ video YouTube. Vui lòng thử lại.');
  }
}

/**
 * Generate gap-fill data for a list of sentences.
 * AI chooses which words to hide based on word type and difficulty.
 * @param {Array<{text: string}>} sentences
 * @param {string} language - 'ja' or 'en'
 * @param {string} difficulty - 'beginner', 'intermediate', 'advanced'
 * @returns {Promise<Array<{hiddenIndices: number[], words: string[]}>>}
 */
export async function generateGapFillBatch(sentences, language, difficulty) {
  if (!genAI) throw new Error('Vui lòng nhập Gemini API key trước.');

  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const langName = language === 'ja' ? 'Japanese' : 'English';

  const sentenceList = sentences.map((s, i) => `${i}: "${s.text}"`).join('\n');

  const hideRatio = difficulty === 'beginner' ? '1-2' : difficulty === 'intermediate' ? '2-3' : '3-5';

  const prompt = `For each ${langName} sentence below, choose ${hideRatio} important words to hide for a gap-fill exercise.

Prioritize hiding:
- Content words (nouns, verbs, adjectives, adverbs)
- Words that test listening comprehension
- For Japanese: kanji words, important particles
- For English: key vocabulary words

Sentences:
${sentenceList}

Return a JSON array where each element has:
- "sentenceIndex": the sentence number
- "hiddenIndices": array of word indices to hide (0-based, words split by spaces)
- "words": the full list of words in the sentence (split by spaces)

For Japanese, split by spaces between word groups (not individual characters).

Return ONLY the JSON array, no explanation.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();
  const jsonStr = responseText
    .replace(/^```json?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error('[Gemini] Failed to parse gap-fill data:', responseText);
    // Return fallback: hide random words
    return sentences.map((s, i) => {
      const words = s.text.split(/\s+/);
      const hiddenIndices = [];
      const count = Math.min(2, Math.floor(words.length / 3));
      while (hiddenIndices.length < count) {
        const idx = Math.floor(Math.random() * words.length);
        if (!hiddenIndices.includes(idx)) hiddenIndices.push(idx);
      }
      return { sentenceIndex: i, hiddenIndices, words };
    });
  }
}

/**
 * Generate MCQ distractors for hidden words in sentences.
 * @param {Array<{text: string, hiddenWord: string}>} items
 * @param {string} language - 'ja' or 'en'
 * @returns {Promise<Array<{answer: string, distractors: string[]}>>}
 */
export async function generateMCQBatch(items, language) {
  if (!genAI) throw new Error('Vui lòng nhập Gemini API key trước.');

  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const langName = language === 'ja' ? 'Japanese' : 'English';

  const itemList = items
    .map((item, i) => `${i}: sentence="${item.text}", answer="${item.hiddenWord}"`)
    .join('\n');

  const prompt = `For each ${langName} sentence and correct answer below, generate 3 plausible but wrong distractors (wrong answers) for a multiple-choice listening quiz.

The distractors should:
- Be the same word type as the answer
- Sound somewhat similar or be commonly confused
- Be grammatically possible in the sentence

Items:
${itemList}

Return a JSON array where each element has:
- "itemIndex": the item number
- "answer": the correct answer
- "distractors": array of 3 wrong answers

Return ONLY the JSON array, no explanation.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();
  const jsonStr = responseText
    .replace(/^```json?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error('[Gemini] Failed to parse MCQ data:', responseText);
    return items.map((item, i) => ({
      itemIndex: i,
      answer: item.hiddenWord,
      distractors: ['___', '___', '___'],
    }));
  }
}

/**
 * Enrich all sentences with gap-fill and MCQ data.
 * Called once when creating a lesson to pre-compute practice data.
 * @param {Array<{text: string, startTime: number, endTime: number}>} sentences
 * @param {string} language
 * @param {string} level
 * @returns {Promise<Array>} Sentences enriched with gapFillData and mcqData
 */
export async function enrichSentences(sentences, language, level) {
  // Wait to avoid rate limit (429) between transcription and enrich on free tier
  await sleep(4000);

  // Step 1: Generate gap-fill data
  let gapFillResults = [];
  try {
    gapFillResults = await generateGapFillBatch(sentences, language, level);
  } catch (err) {
    console.warn('[Gemini] Gap fill batch failed, skipping to avoid crash:', err);
    return sentences; // Return raw sentences to degrade gracefully
  }

  // Wait again to avoid rate limit before MCQ generation
  await sleep(4000);

  // Step 2: Prepare MCQ items from gap-fill hidden words
  const mcqItems = [];
  for (const gf of gapFillResults) {
    const sentence = sentences[gf.sentenceIndex];
    if (!sentence) continue;
    for (const idx of gf.hiddenIndices) {
      const word = gf.words[idx];
      if (word) {
        mcqItems.push({
          text: sentence.text,
          hiddenWord: word,
          sentenceIndex: gf.sentenceIndex,
          wordIndex: idx,
        });
      }
    }
  }

  // Step 3: Generate MCQ distractors
  let mcqResults = [];
  if (mcqItems.length > 0) {
    mcqResults = await generateMCQBatch(mcqItems, language);
  }

  // Step 4: Merge into sentences
  return sentences.map((s, i) => {
    const gf = gapFillResults.find(g => g.sentenceIndex === i);
    const mcqs = mcqResults
      .filter(m => {
        const item = mcqItems[m.itemIndex];
        return item && item.sentenceIndex === i;
      })
      .map(m => {
        const item = mcqItems[m.itemIndex];
        return {
          wordIndex: item.wordIndex,
          answer: item.hiddenWord,
          distractors: m.distractors,
        };
      });

    return {
      ...s,
      gapFillData: gf ? { hiddenIndices: gf.hiddenIndices, words: gf.words } : null,
      mcqData: mcqs.length > 0 ? mcqs : null,
    };
  });
}

/**
 * Convert ArrayBuffer to base64 string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
