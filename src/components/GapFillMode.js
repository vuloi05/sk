/**
 * DictaFlow — Gap-fill Mode Component
 */

import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { audioManager } from '../core/audioManager.js';
import { scoreGapFill } from '../core/scorer.js';
import { generateLocalGapFill, applyGapFill } from '../core/gapGenerator.js';
import { renderPlayerControls } from './PlayerControls.js';
import { ROUTES } from '../utils/constants.js';
import { safeJsonParse } from '../utils/helpers.js';

/**
 * Render the gap-fill practice screen.
 * @returns {HTMLElement}
 */
export function renderGapFill() {
  const sentences = store.get('currentSentences') || [];
  const idx = store.get('currentSentenceIndex') || 0;
  const sentence = sentences[idx];
  const lesson = store.get('currentLesson');
  const settings = store.get('settings') || {};

  if (!sentence) {
    store.set('route', ROUTES.SCORE);
    return h('div');
  }

  const total = sentences.length;
  const progress = ((idx) / total) * 100;

  // Get or generate gap-fill data
  let gapData = safeJsonParse(sentence.gap_fill_data, null);
  if (!gapData) {
    gapData = generateLocalGapFill(
      sentence.content,
      lesson?.language || 'en',
      lesson?.level || 'intermediate',
    );
  }

  const tokens = applyGapFill(sentence.content, gapData);
  const blanks = tokens.filter(t => t.isBlank);

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

      // Gap-fill sentence
      h('div', { className: 'practice-sentence-box' },
        h('div', { className: 'practice-instruction' }, '📝 Nghe và điền từ còn thiếu'),
        h('div', { className: 'gapfill-sentence', id: 'gapfill-sentence' },
          ...tokens.map((token, ti) => {
            if (token.isBlank) {
              const blankIdx = blanks.indexOf(token);
              return h('input', {
                className: 'gapfill-blank',
                type: 'text',
                id: `blank-${blankIdx}`,
                dataset: { answer: token.answer, index: String(blankIdx) },
                style: { width: `${Math.max(60, token.answer.length * 14 + 20)}px` },
                onKeydown: (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // Focus next blank or check
                    const nextBlank = document.getElementById(`blank-${blankIdx + 1}`);
                    if (nextBlank) {
                      nextBlank.focus();
                    } else {
                      checkGapFill(blanks);
                    }
                  }
                },
              });
            }
            return h('span', { className: 'gapfill-word' }, token.text + ' ');
          }),
        ),
      ),

      // Actions
      h('div', { className: 'practice-actions', id: 'gapfill-actions' },
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
        h('button', {
          className: 'btn btn-primary btn-lg',
          id: 'gapfill-check-btn',
          onClick: () => checkGapFill(blanks),
        }, '✅ Kiểm tra'),
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
    // Focus first blank
    document.getElementById('blank-0')?.focus();
  }, 300);

  return page;
}

/**
 * Check all gap-fill answers.
 * @param {Array} blanks - Array of blank token objects
 */
function checkGapFill(blanks) {
  const sentences = store.get('currentSentences') || [];
  const idx = store.get('currentSentenceIndex') || 0;
  const sentence = sentences[idx];

  let correctCount = 0;
  const userInputs = [];

  for (let i = 0; i < blanks.length; i++) {
    const input = document.getElementById(`blank-${i}`);
    if (!input) continue;

    const userAnswer = input.value.trim();
    userInputs.push(userAnswer);
    const expected = blanks[i].answer;
    const isCorrect = scoreGapFill(expected, userAnswer);

    input.disabled = true;

    if (isCorrect) {
      input.classList.add('correct');
      input.classList.add('animate-pulse');
      correctCount++;
    } else {
      input.classList.add('wrong');
      input.classList.add('animate-shake');
      // Show correct answer after animation
      setTimeout(() => {
        const correctionEl = h('span', {
          style: {
            color: 'var(--color-primary-dark)',
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            marginLeft: '4px',
          },
        }, ` → ${expected}`);
        input.parentNode.insertBefore(correctionEl, input.nextSibling);
      }, 500);
    }
  }

  const score = blanks.length > 0 ? Math.round((correctCount / blanks.length) * 100) : 100;

  // Save result
  const results = [...(store.get('practiceResults') || [])];
  results.push({
    sentenceIndex: idx,
    expected: sentence.content,
    userInput: userInputs.join(', '),
    score,
    correctBlanks: correctCount,
    totalBlanks: blanks.length,
    mode: 'gapfill',
  });
  store.set('practiceResults', results);

  // Change actions
  const actionsDiv = document.getElementById('gapfill-actions');
  if (actionsDiv) {
    actionsDiv.innerHTML = '';
    const isLast = idx >= sentences.length - 1;
    actionsDiv.appendChild(
      h('span', {
        className: `badge badge-${score >= 80 ? 'green' : score >= 50 ? 'blue' : 'orange'}`,
        style: { fontSize: 'var(--font-size-base)', padding: '6px 16px' },
      }, `${correctCount}/${blanks.length} đúng`),
    );
    actionsDiv.appendChild(
      h('button', {
        className: `btn ${isLast ? 'btn-primary' : 'btn-blue'} btn-lg`,
        onClick: () => {
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
