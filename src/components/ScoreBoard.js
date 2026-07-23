/**
 * DictaFlow — Score Board Component
 */

import { h, formatTime } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { ROUTES } from '../utils/constants.js';
import { analyzeText } from '../core/kanjiService.js';
import { wrapKanjiChars } from './KanjiPopup.js';

/**
 * Render the final score board.
 * @returns {HTMLElement}
 */
export function renderScoreBoard() {
  const results = store.get('practiceResults') || [];
  const lesson = store.get('currentLesson');
  
  if (results.length === 0) {
    return h('div', { className: 'page' },
      h('div', { className: 'container text-center mt-xl' },
        h('p', {}, 'Chưa có kết quả luyện tập.'),
        h('button', { 
          className: 'btn btn-primary mt-md',
          onClick: () => store.set('route', ROUTES.LIBRARY)
        }, 'Về thư viện')
      )
    );
  }

  // Calculate stats
  const totalSentences = results.length;
  const avgScore = Math.round(results.reduce((acc, r) => acc + r.score, 0) / totalSentences);
  
  const perfectSentences = results.filter(r => r.score === 100).length;
  const needsWorkSentences = results.filter(r => r.score < 80);

  const scoreClass = avgScore >= 90 ? 'excellent' : avgScore >= 70 ? 'good' : avgScore >= 50 ? 'fair' : 'poor';

  const page = h('div', { className: 'page' },
    h('div', { className: 'container animate-fade-in', style: { maxWidth: '700px' } },
      
      h('div', { className: 'score-container' },
        // Score Circle
        h('div', { className: `score-circle animate-scale-in ${scoreClass}` },
          h('div', { className: 'score-value' }, `${avgScore}%`),
          h('div', { className: 'score-label' }, 'Độ chính xác')
        ),
        
        h('h2', { style: { marginBottom: '8px' } }, 
          avgScore >= 90 ? '🎉 Tuyệt vời!' : 
          avgScore >= 70 ? '👍 Rất tốt!' : 
          avgScore >= 50 ? '💪 Cố gắng lên!' : '📚 Cần luyện tập thêm!'
        ),
        h('p', { className: 'text-secondary mb-lg' }, `Bạn đã hoàn thành bài: ${lesson?.title || 'Bài luyện tập'}`),

        // Stats
        h('div', { className: 'score-stats stagger-children' },
          h('div', { className: 'score-stat' },
            h('div', { className: 'score-stat-value', style: { color: 'var(--color-text)' } }, totalSentences),
            h('div', { className: 'score-stat-label' }, 'Số câu')
          ),
          h('div', { className: 'score-stat' },
            h('div', { className: 'score-stat-value', style: { color: 'var(--color-primary-dark)' } }, perfectSentences),
            h('div', { className: 'score-stat-label' }, 'Hoàn hảo')
          ),
          h('div', { className: 'score-stat' },
            h('div', { className: 'score-stat-value', style: { color: 'var(--color-accent-orange)' } }, totalSentences - perfectSentences),
            h('div', { className: 'score-stat-label' }, 'Có lỗi sai')
          )
        ),

        // Actions
        h('div', { className: 'flex gap-md justify-center mt-xl' },
          h('button', { 
            className: 'btn btn-outline',
            onClick: () => {
              store.resetPractice();
              store.set('route', ROUTES.LIBRARY);
            }
          }, '📚 Về thư viện'),
          h('button', { 
            className: 'btn btn-primary',
            onClick: () => {
              store.set('currentSentenceIndex', 0);
              store.set('practiceResults', []);
              store.set('route', ROUTES.MODE_SELECT);
            }
          }, '🔁 Luyện lại bài này')
        )
      ),

      // Needs work section
      needsWorkSentences.length > 0 ? h('div', { className: 'mt-xl animate-slide-up' },
        h('h3', { className: 'mb-md' }, '🔍 Các câu cần lưu ý'),
        h('div', { className: 'flex flex-col gap-md' },
          ...needsWorkSentences.map(r => 
            h('div', { className: 'card', style: { padding: 'var(--space-md)' } },
              h('div', { className: 'flex justify-between items-center mb-xs' },
                h('span', { className: 'text-sm font-bold text-secondary' }, `Câu ${r.sentenceIndex + 1}`),
                r.score > 0 ? h('span', { className: `badge badge-${r.score >= 50 ? 'blue' : 'orange'}` }, `${r.score}%`) : null
              ),
              h('div', { style: { lineHeight: '1.6' } }, 
                h('div', { style: { color: 'var(--color-primary-dark)', fontWeight: '600' } }, `✓ Đáng lẽ phải là: ${r.expected || '...'}`),
                h('div', { style: { color: 'var(--color-accent-orange)', marginTop: '4px' } }, `✗ Bạn đã chọn/nhập: ${r.userInput || '(Bỏ trống)'}`)
              )
            )
          )
        )
      ) : null,

      // Kanji Stats (async loaded)
      (() => {
        const kanjiSection = h('div', { id: 'kanji-stats-section' });
        const allExpected = results.map(r => r.expected || '').join('');
        
        analyzeText(allExpected).then(kanjiList => {
          if (kanjiList.length === 0) return;

          // Save to localStorage for accumulation
          const stored = JSON.parse(localStorage.getItem('dictaflow_kanji_history') || '[]');
          const existingChars = new Set(stored.map(k => k.literal));
          for (const k of kanjiList) {
            if (!existingChars.has(k.literal)) {
              stored.push({ literal: k.literal, jlpt: k.jlpt, firstSeen: new Date().toISOString() });
            }
          }
          localStorage.setItem('dictaflow_kanji_history', JSON.stringify(stored));

          // Group by JLPT
          const groups = { easy: [], medium: [], hard: [], unknown: [] };
          for (const k of kanjiList) {
            if (k.jlpt === 4 || k.jlpt === 3) groups.easy.push(k);
            else if (k.jlpt === 2) groups.medium.push(k);
            else if (k.jlpt === 1) groups.hard.push(k);
            else groups.unknown.push(k);
          }

          kanjiSection.className = 'mt-xl animate-slide-up';
          kanjiSection.appendChild(
            h('h3', { className: 'mb-md' }, `🌿 Kanji trong bài (${kanjiList.length} chữ)`)
          );

          const statsCard = h('div', { className: 'card', style: { padding: 'var(--space-md)' } });

          // Distribution bar
          const total = kanjiList.length;
          const barItems = [
            { count: groups.easy.length, color: 'var(--color-correct)', label: 'N5/N4' },
            { count: groups.medium.length, color: 'var(--color-accent-orange)', label: 'N3/N2' },
            { count: groups.hard.length, color: 'var(--color-accent-purple)', label: 'N1' },
            { count: groups.unknown.length, color: 'var(--color-text-muted)', label: 'Khác' },
          ].filter(b => b.count > 0);

          const bar = h('div', { 
            style: { display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px', border: '1.5px solid var(--color-border)' } 
          });
          for (const item of barItems) {
            bar.appendChild(h('div', { 
              style: { width: `${(item.count / total) * 100}%`, background: item.color },
              title: `${item.label}: ${item.count}`
            }));
          }
          statsCard.appendChild(bar);

          // Legend
          const legend = h('div', { className: 'flex gap-md flex-wrap mb-md', style: { fontSize: 'var(--font-size-xs)' } });
          for (const item of barItems) {
            legend.appendChild(h('span', { className: 'flex items-center gap-xs' },
              h('span', { style: { width: '10px', height: '10px', borderRadius: '50%', background: item.color, display: 'inline-block' } }),
              `${item.label}: ${item.count}`
            ));
          }
          statsCard.appendChild(legend);

          // Kanji grid (clickable for popup)
          const grid = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } });
          for (const k of kanjiList) {
            const charEl = wrapKanjiChars(k.literal);
            const wrapper = h('span', { 
              className: 'kanji-badge',
              style: { fontSize: 'var(--font-size-base)', padding: '4px 8px', cursor: 'pointer' }
            });
            wrapper.appendChild(charEl);
            grid.appendChild(wrapper);
          }
          statsCard.appendChild(grid);

          // Total accumulated
          const totalAccumulated = JSON.parse(localStorage.getItem('dictaflow_kanji_history') || '[]').length;
          statsCard.appendChild(
            h('div', { className: 'text-sm text-muted mt-md', style: { textAlign: 'center' } },
              `📚 Tổng Kanji đã học qua tất cả các bài: ${totalAccumulated} chữ`
            )
          );

          kanjiSection.appendChild(statsCard);
        });

        return kanjiSection;
      })()

    )
  );

  return page;
}
