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
  const lesson = store.get('currentLesson') || {};

  if (!sentence) {
    store.set('route', ROUTES.SCORE);
    return h('div');
  }

  const total = sentences.length;
  const progress = ((idx) / total) * 100;

  const page = h('div', { className: 'page' },
    h('div', { className: 'practice-layout animate-fade-in' },
      
      // Header (Spans both columns)
      h('div', { className: 'practice-header', style: { gridColumn: '1 / -1', justifyContent: 'flex-start', gap: '16px', marginBottom: '0' } },
        h('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => {
            audioManager.pause();
            store.set('route', ROUTES.MODE_SELECT);
          },
        }, '⬅ Thoát'),
        h('span', { className: 'practice-progress-text' }, `Câu ${idx + 1} / ${total}`),
      ),

      // Left Panel (Video)
      h('div', { className: 'practice-left-panel' },
        // Anime Cinematic Video Player (if YouTube)
        lesson.youtube_id ? 
          h('div', { className: 'anime-video-player', id: 'yt-visible-container', style: { marginBottom: 0 } }) 
          : null,
      ),

      // Right Panel (Controls & Practice Area)
      h('div', { className: 'practice-right-panel' },
        // Player
        renderPlayerControls({
          startTime: sentence.start,
          endTime: sentence.end,
          repeatCount: (settings.repeatCount || 1) - 1,
        }),

        // Instruction
        h('div', { className: 'practice-sentence-box' },
          h('div', { className: 'practice-instruction' }, 'Nghe và chép lại câu bạn nghe được'),
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
                sentence.start,
                sentence.end,
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
    ),
  );

  // Auto-play sentence on load
  setTimeout(() => {
    if (lesson.youtube_id) {
      audioManager.attachToVisibleContainer('yt-visible-container');
    }
    audioManager.playSentence(
      sentence.start,
      sentence.end,
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
  const result = scoreDictation(sentence.en, userText);

  // Gửi API lưu tiến độ (Atomic)
  const currentLesson = store.get('currentLesson');
  if (currentLesson && store.get('currentUser')) {
    import('../core/api.js').then(({ saveProgressAPI }) => {
      // Tìm lỗi sai đầu tiên để gửi (nếu có)
      let mistake = null;
      const wrongTokens = result.diff.filter(t => t.type === 'wrong' || t.type === 'missing');
      if (wrongTokens.length > 0) {
        mistake = {
          sentence_id: sentence.id || `s_${idx}`,
          wrong_word: userText // Lưu lại nguyên câu sai để dễ phân tích
        };
      }
      
      saveProgressAPI(
        currentLesson._id,
        sentence.id || `s_${idx}`,
        result.score,
        mistake
      );
    });
  }

  // Save result locally for ScoreBoard
  const results = [...(store.get('practiceResults') || [])];
  results.push({
    sentenceIndex: idx,
    expected: sentence.en,
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
        style: { justifyContent: 'center', flexWrap: 'wrap', gap: '12px' },
      },
        h('span', { className: 'diff-legend-item diff-correct' }, 'Đúng'),
        h('span', { className: 'diff-legend-item diff-wrong', style: {textDecoration: 'none'} }, 'Sai → Đáp án'),
        h('span', { className: 'diff-legend-item diff-missing' }, '[Thiếu]'),
        h('span', { className: 'diff-legend-item diff-extra', style: {textDecoration: 'none'} }, 'Thừa'),
      ),

      // Translation Hint
      sentence.vi ? h('div', { 
        className: 'mt-md text-center text-secondary',
        style: { fontStyle: 'italic' }
      }, `Dịch nghĩa: ${sentence.vi}`) : null,
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
