/**
 * DictaFlow — Score Board Component
 */

import { h, formatTime } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { ROUTES } from '../utils/constants.js';

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
                h('span', { className: `badge badge-${r.score >= 50 ? 'blue' : 'orange'}` }, `${r.score}%`)
              ),
              h('div', { style: { lineHeight: '1.6' } }, r.expected)
            )
          )
        )
      ) : null

    )
  );

  return page;
}
