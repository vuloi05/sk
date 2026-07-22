/**
 * DictaFlow — Multiple Choice Mode Component
 */

import { h, shuffleArray } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { audioManager } from '../core/audioManager.js';
import { scoreMCQ } from '../core/scorer.js';
import { renderPlayerControls } from './PlayerControls.js';
import { ROUTES } from '../utils/constants.js';
import { safeJsonParse } from '../utils/helpers.js';

/**
 * Render the MCQ practice screen.
 * @returns {HTMLElement}
 */
export function renderMultipleChoice() {
  const sentences = store.get('currentSentences') || [];
  const idx = store.get('currentSentenceIndex') || 0;
  const sentence = sentences[idx];
  const settings = store.get('settings') || {};

  if (!sentence) {
    store.set('route', ROUTES.SCORE);
    return h('div');
  }

  const total = sentences.length;
  const progress = ((idx) / total) * 100;

  // Prepare MCQ data
  let mcqData = safeJsonParse(sentence.mcq_data, null);
  let mcqItem = null;

  if (mcqData && mcqData.length > 0) {
    // Pick the first MCQ item for this sentence (simplification for MVP)
    mcqItem = mcqData[0];
  }

  // If no MCQ data, skip to next sentence automatically or show fallback
  if (!mcqItem) {
    // Skip sentence logic
    setTimeout(() => {
      const isLast = idx >= sentences.length - 1;
      if (isLast) {
        store.set('route', ROUTES.SCORE);
      } else {
        store.set('currentSentenceIndex', idx + 1);
        store.set('route', ROUTES.PRACTICE);
      }
    }, 100);
    return h('div', { className: 'page' },
      h('div', { className: 'container text-center mt-xl' },
        h('div', { className: 'loading-spinner', style: { margin: '0 auto var(--space-md)' } }),
        h('p', {}, 'Đang chuyển câu...'),
      ),
    );
  }

  // Build sentence text with blank
  let gapData = safeJsonParse(sentence.gap_fill_data, null);
  let words = [];
  
  if (gapData && gapData.words) {
    words = [...gapData.words];
  } else {
    words = sentence.content.split(/\s+/).filter(Boolean);
  }

  if (mcqItem.wordIndex !== undefined && mcqItem.wordIndex >= 0 && mcqItem.wordIndex < words.length) {
    words[mcqItem.wordIndex] = '____';
  } else {
    // Fallback: replace the answer word if index is missing/wrong
    const idx = words.findIndex(w => w === mcqItem.answer);
    if (idx !== -1) words[idx] = '____';
  }
  const displaySentence = words.join(' ');

  // Shuffle options (1 answer + up to 3 distractors)
  let distractors = mcqItem.distractors;
  if (!distractors || distractors.length === 0) {
    // Fallback: pick random words from the sentence itself
    const otherWords = words.filter(w => w !== mcqItem.answer && w !== '____' && w.length > 2);
    distractors = shuffleArray(otherWords).slice(0, 3);
    while (distractors.length < 3) {
      distractors.push(['(trống)', '(ẩn)', '(lỗi)'][distractors.length]);
    }
  }
  const options = shuffleArray([mcqItem.answer, ...distractors.slice(0, 3)]);
  const letters = ['A', 'B', 'C', 'D'];

  const page = h('div', { className: 'page' },
    h('div', { className: 'practice-container animate-fade-in' },
      // Progress
      h('div', { className: 'practice-header' },
        h('span', { className: 'practice-progress-text' }, `Câu ${idx + 1} / ${total}`),
        h('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => {
            audioManager.pause();
            store.set('route', ROUTES.MODE_SELECT);
          },
        }, '✕ Thoát'),
      ),
      h('div', { className: 'progress-bar' },
        h('div', { className: 'progress-bar-fill', style: { width: `${progress}%` } }),
      ),

      // Player
      renderPlayerControls({
        startTime: sentence.start_time,
        endTime: sentence.end_time,
        repeatCount: (settings.repeatCount || 1) - 1,
      }),

      // Question
      h('div', { className: 'practice-sentence-box' },
        h('div', { className: 'practice-instruction' }, '🔤 Nghe và chọn từ điền vào chỗ trống'),
        h('div', { className: 'mcq-question' }, displaySentence),

        // Options
        h('div', { className: 'mcq-options' },
          ...options.map((opt, i) =>
            h('div', {
              className: 'mcq-option',
              id: `mcq-opt-${i}`,
              onClick: () => checkMCQ(opt, mcqItem.answer, i, options.length),
            },
              h('div', { className: 'mcq-option-letter' }, letters[i]),
              h('div', { className: 'mcq-option-text' }, opt),
            ),
          ),
        ),
      ),

      // Actions
      h('div', { className: 'practice-actions', id: 'mcq-actions' },
        h('button', {
          className: 'btn btn-outline',
          onClick: () => {
            audioManager.playSentence(
              sentence.start_time,
              sentence.end_time,
              (settings.repeatCount || 1) - 1,
            );
          },
        }, '🔁 Nghe lại'),
      ),
    ),
  );

  // Auto-play
  setTimeout(() => {
    audioManager.playSentence(
      sentence.start_time,
      sentence.end_time,
      (settings.repeatCount || 1) - 1,
    );
  }, 300);

  return page;
}

let isAnswered = false;

/**
 * Check selected MCQ answer.
 */
function checkMCQ(selectedOpt, correctOpt, selectedIdx, totalOptions) {
  if (isAnswered) return;
  isAnswered = true;

  const isCorrect = scoreMCQ(correctOpt, selectedOpt);

  // Reveal all
  for (let i = 0; i < totalOptions; i++) {
    const el = document.getElementById(`mcq-opt-${i}`);
    if (!el) continue;
    
    // Disable clicks via pointer-events in CSS or just letting isAnswered block it
    el.style.pointerEvents = 'none';

    const text = el.querySelector('.mcq-option-text')?.textContent;
    if (scoreMCQ(correctOpt, text)) {
      el.classList.add('correct');
      if (i === selectedIdx) el.classList.add('animate-pulse');
    } else if (i === selectedIdx && !isCorrect) {
      el.classList.add('wrong');
      el.classList.add('animate-shake');
    }
  }

  // Save result
  const sentences = store.get('currentSentences') || [];
  const idx = store.get('currentSentenceIndex') || 0;
  const sentence = sentences[idx];

  const results = [...(store.get('practiceResults') || [])];
  results.push({
    sentenceIndex: idx,
    expected: sentence.content,
    score: isCorrect ? 100 : 0,
    mode: 'mcq',
  });
  store.set('practiceResults', results);

  // Change actions
  const actionsDiv = document.getElementById('mcq-actions');
  if (actionsDiv) {
    actionsDiv.innerHTML = '';
    const isLast = idx >= sentences.length - 1;
    actionsDiv.appendChild(
      h('button', {
        className: `btn ${isLast ? 'btn-primary' : 'btn-blue'} btn-lg animate-slide-up`,
        onClick: () => {
          isAnswered = false;
          if (isLast) {
            audioManager.pause();
            store.set('route', ROUTES.SCORE);
          } else {
            store.set('currentSentenceIndex', idx + 1);
            store.set('route', ROUTES.PRACTICE);
          }
        },
      }, isLast ? '🏆 Xem kết quả' : '➡️ Câu tiếp theo'),
    );
  }
}
