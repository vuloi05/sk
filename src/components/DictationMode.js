/**
 * DictaFlow — Dictation Mode Component
 */

import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { audioManager } from '../core/audioManager.js';
import { scoreDictation } from '../core/scorer.js';
import { renderPlayerControls } from './PlayerControls.js';
import { ROUTES } from '../utils/constants.js';
import { wrapKanjiChars } from './KanjiPopup.js';

/**
 * Render the dictation practice screen.
 * @returns {HTMLElement}
 */
export function renderDictation() {
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

      // Instruction
      h('div', { className: 'practice-sentence-box' },
        h('div', { className: 'practice-instruction' }, '✍️ Nghe và chép lại câu bạn nghe được'),
        h('textarea', {
          className: 'dictation-textarea',
          id: 'dictation-input',
          placeholder: 'Gõ câu bạn nghe được ở đây...',
          rows: 3,
          onKeydown: (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              checkAnswer();
            }
          },
        }),

        // Result display
        h('div', { id: 'dictation-result', style: { display: 'none' } }),
      ),

      // Actions
      h('div', { className: 'practice-actions', id: 'dictation-actions' },
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
          id: 'check-btn',
          onClick: checkAnswer,
        }, '✅ Kiểm tra'),
      ),
    ),
  );

  // Auto-play sentence on load
  setTimeout(() => {
    audioManager.playSentence(
      sentence.start_time,
      sentence.end_time,
      (settings.repeatCount || 1) - 1,
    );
  }, 300);

  return page;
}

/**
 * Check the user's dictation answer.
 */
function checkAnswer() {
  const input = document.getElementById('dictation-input');
  const resultDiv = document.getElementById('dictation-result');
  const checkBtn = document.getElementById('check-btn');
  const actionsDiv = document.getElementById('dictation-actions');

  if (!input || !resultDiv) return;

  const userText = input.value.trim();
  if (!userText) {
    input.focus();
    input.classList.add('animate-shake');
    setTimeout(() => input.classList.remove('animate-shake'), 500);
    return;
  }

  const sentences = store.get('currentSentences') || [];
  const idx = store.get('currentSentenceIndex') || 0;
  const sentence = sentences[idx];
  if (!sentence) return;

  // Score
  const result = scoreDictation(sentence.content, userText);

  // Save result
  const results = [...(store.get('practiceResults') || [])];
  results.push({
    sentenceIndex: idx,
    expected: sentence.content,
    userInput: userText,
    score: result.score,
    diff: result.diff,
    mode: 'dictation',
  });
  store.set('practiceResults', results);

  // Display diff
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '';

  const scoreClass = result.score >= 80 ? 'excellent' : result.score >= 50 ? 'good' : 'poor';

  resultDiv.appendChild(
    h('div', { className: `animate-slide-up` },
      // Score badge
      h('div', {
        className: 'flex items-center gap-md mb-md',
        style: { justifyContent: 'center' },
      },
        h('span', {
          className: `badge badge-${scoreClass === 'excellent' ? 'green' : scoreClass === 'good' ? 'blue' : 'orange'}`,
          style: { fontSize: 'var(--font-size-lg)', padding: '4px 16px' },
        }, `${result.score}%`),
        h('span', { className: 'text-sm text-secondary' },
          `${result.correctWords}/${result.totalWords} từ đúng`,
        ),
      ),

      // Diff display
      h('div', { className: 'diff-display' },
        ...result.diff.map(token => {
          switch (token.type) {
            case 'correct': {
              const wrapper = wrapKanjiChars(token.text + ' ');
              wrapper.className = 'diff-correct';
              return wrapper;
            }
            case 'wrong':
              return h('span', {},
                h('span', { className: 'diff-wrong', title: `Bạn gõ: ${token.text}` }, token.text),
                (() => {
                  const w = wrapKanjiChars(` → ${token.expected} `);
                  w.className = 'diff-correct';
                  w.title = 'Đáp án đúng';
                  return w;
                })(),
              );
            case 'missing': {
              const wrapper = wrapKanjiChars(`[${token.text}] `);
              wrapper.className = 'diff-missing';
              wrapper.title = 'Thiếu';
              return wrapper;
            }
            case 'extra':
              return h('span', { className: 'diff-extra', title: 'Thừa' }, token.text + ' ');
            default:
              return h('span', {}, token.text + ' ');
          }
        }),
      ),

      // Legend
      h('div', {
        className: 'flex gap-md mt-md text-sm',
        style: { justifyContent: 'center', flexWrap: 'wrap' },
      },
        h('span', {}, '🟢 Đúng'),
        h('span', {}, '🔴 Sai → Đáp án'),
        h('span', {}, '🟡 [Thiếu]'),
        h('span', {}, '🟣 Thừa'),
      ),
    ),
  );

  // Disable input
  input.disabled = true;
  input.style.opacity = '0.6';

  // Change actions to Next
  if (actionsDiv) {
    actionsDiv.innerHTML = '';
    const isLast = idx >= sentences.length - 1;
    actionsDiv.appendChild(
      h('button', {
        className: `btn ${isLast ? 'btn-primary' : 'btn-blue'} btn-lg`,
        onClick: () => {
          if (isLast) {
            audioManager.pause();
            store.set('route', ROUTES.SCORE);
          } else {
            store.set('currentSentenceIndex', idx + 1);
            store.set('route', ROUTES.PRACTICE); // Re-render
          }
        },
      }, isLast ? '🏆 Xem kết quả' : '➡️ Câu tiếp theo'),
    );
  }
}
