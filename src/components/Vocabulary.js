/**
 * DictaFlow — Vocabulary (Kanji SRS) Component
 *
 * Anki-faithful flashcard learning with:
 * - 3 queues (New + Learning + Review) interleaved
 * - Learning steps (1min → 10min → graduate)
 * - Lapse handling
 * - Cloud sync via Supabase
 */

import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { loadKanjiData } from '../core/kanjiService.js';
import {
  calculateNextReview,
  getCardStatus,
  buildSessionQueue,
  getButtonPreviews,
  createNewCard,
  NEW_CARDS_PER_DAY,
} from '../core/srsAlgorithm.js';
import { syncKanjiProgress, saveKanjiProgress } from '../core/supabase.js';

// ─── Module State ───
let kanjiList = [];
let srsData = {};
let currentTab = 4;
let currentMode = 'dashboard'; // 'dashboard' | 'session' | 'grid'
let sessionQueue = [];
let sessionIndex = 0;
let showBack = false;
let cloudSyncDone = false;
let sessionStats = { newCount: 0, dueCount: 0, reviewCount: 0 };
let sessionNewLearned = 0; // new cards studied in this session

const TABS = [
  { id: 4, label: 'N5/N4' },
  { id: 3, label: 'N4/N3' },
  { id: 2, label: 'N3/N2' },
  { id: 1, label: 'N1' },
];

// ─── Entry Point ───
export function renderVocabulary() {
  const page = h('div', { className: 'page vocabulary-page animate-fade-in' });

  if (kanjiList.length === 0) {
    page.appendChild(h('div', { className: 'text-center mt-xl' }, 'Đang tải dữ liệu Kanji...'));

    Promise.all([
      loadKanjiData(),
      new Promise(resolve => {
        srsData = JSON.parse(localStorage.getItem('dictaflow_kanji_srs') || '{}');
        resolve();
      }),
    ]).then(async ([data]) => {
      kanjiList = Object.entries(data)
        .map(([literal, k]) => ({
          literal,
          jlpt: k.j,
          on: k.on,
          kun: k.kun,
          viet: k.v,
          meaning: k.m,
        }))
        .filter(k => k.jlpt != null);

      // Cloud sync (once per session)
      if (!cloudSyncDone) {
        try {
          const merged = await syncKanjiProgress(srsData);
          if (merged) {
            srsData = merged;
            localStorage.setItem('dictaflow_kanji_srs', JSON.stringify(srsData));
          }
        } catch (err) {
          console.warn('[Vocabulary] Cloud sync failed:', err);
        }
        cloudSyncDone = true;
      }

      renderContent(page);
    });

    return page;
  }

  renderContent(page);
  return page;
}

// ─── Content Router ───
function renderContent(page) {
  page.innerHTML = '';

  const header = h(
    'div',
    { className: 'flex justify-between items-center mb-lg' },
    h('h1', {}, '🧠 Học Kanji (SRS)'),
    currentMode !== 'dashboard'
      ? h(
          'button',
          {
            className: 'btn btn-outline btn-sm',
            onClick: () => {
              currentMode = 'dashboard';
              renderContent(page);
            },
          },
          '← Quay lại'
        )
      : h('div', { className: 'text-sm text-secondary' }, '')
  );
  page.appendChild(header);

  switch (currentMode) {
    case 'dashboard':
      page.appendChild(renderDashboard(page));
      break;
    case 'session':
      page.appendChild(renderSession(page));
      break;
    case 'grid':
      page.appendChild(renderGrid(page));
      break;
  }
}

// ─── Dashboard ───
function renderDashboard(page) {
  const container = h('div', { className: 'stagger-children' });

  // Tabs
  const tabs = h('div', { className: 'tab-switcher mb-lg' });
  for (const tab of TABS) {
    tabs.appendChild(
      h(
        'button',
        {
          className: `tab-btn ${currentTab === tab.id ? 'active' : ''}`,
          onClick: () => {
            currentTab = tab.id;
            renderContent(page);
          },
        },
        tab.label
      )
    );
  }
  container.appendChild(tabs);

  // Build queue to get stats
  const { queue, stats } = buildSessionQueue(kanjiList, srsData, currentTab);
  sessionStats = stats;

  // Stats Card
  const statsCard = h('div', { className: 'card text-center py-xl mb-lg' });
  const tabLabel = TABS.find(t => t.id === currentTab).label;
  statsCard.appendChild(h('h2', { className: 'mb-md' }, `Thống kê ${tabLabel}`));

  const statsRow = h('div', { className: 'flex justify-center gap-xl mb-xl text-lg' });

  statsRow.appendChild(
    h(
      'div',
      {},
      h('div', { style: { color: '#0969da', fontSize: '2rem', fontWeight: 'bold' } }, stats.newCount),
      h('div', { className: 'text-sm text-secondary' }, 'Từ mới')
    )
  );
  statsRow.appendChild(
    h(
      'div',
      {},
      h('div', { style: { color: '#da3633', fontSize: '2rem', fontWeight: 'bold' } }, stats.dueCount),
      h('div', { className: 'text-sm text-secondary' }, 'Cần ôn')
    )
  );
  statsRow.appendChild(
    h(
      'div',
      {},
      h('div', { style: { color: '#2da44e', fontSize: '2rem', fontWeight: 'bold' } }, stats.reviewCount),
      h('div', { className: 'text-sm text-secondary' }, 'Đã thuộc')
    )
  );

  statsCard.appendChild(statsRow);

  // Progress bar
  const total = stats.newCount + stats.dueCount + stats.reviewCount;
  if (total > 0) {
    const pct = Math.round((stats.reviewCount / total) * 100);
    const progressOuter = h('div', {
      style: {
        width: '80%',
        maxWidth: '400px',
        height: '12px',
        background: 'var(--color-border)',
        borderRadius: '6px',
        margin: '0 auto var(--space-lg)',
        overflow: 'hidden',
      },
    });
    progressOuter.appendChild(
      h('div', {
        style: {
          width: `${pct}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #2da44e, #3fb950)',
          borderRadius: '6px',
          transition: 'width 0.5s ease',
        },
      })
    );
    statsCard.appendChild(progressOuter);
    statsCard.appendChild(
      h('div', { className: 'text-sm text-secondary mb-lg' }, `Tiến độ: ${pct}% (${stats.reviewCount}/${total})`)
    );
  }

  // Actions
  const actions = h('div', { className: 'flex justify-center gap-md flex-wrap' });

  if (queue.length > 0) {
    actions.appendChild(
      h(
        'button',
        {
          className: 'btn btn-primary btn-lg',
          onClick: () => startSession(queue, page),
        },
        `Bắt đầu học (${queue.length} thẻ)`
      )
    );
  } else {
    actions.appendChild(
      h('div', { className: 'text-success font-bold mb-md' }, '🎉 Bạn đã hoàn thành bài học hôm nay!')
    );
  }

  actions.appendChild(
    h(
      'button',
      {
        className: 'btn btn-outline btn-lg',
        onClick: () => {
          currentMode = 'grid';
          renderContent(page);
        },
      },
      'Xem danh sách (Grid)'
    )
  );

  statsCard.appendChild(actions);
  container.appendChild(statsCard);

  // Info card about SRS
  const infoCard = h('div', { className: 'card', style: { borderColor: 'var(--color-accent-blue)', borderWidth: '2px' } });
  infoCard.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px">
      <span style="font-size:1.5rem">ℹ️</span>
      <div>
        <strong>Cách hoạt động (giống Anki)</strong>
        <ul style="margin-top:8px;padding-left:20px;line-height:1.8">
          <li><strong>Thẻ mới</strong>: Đi qua 2 bước lặp (1 phút → 10 phút) trước khi "tốt nghiệp"</li>
          <li><strong>Tốt nghiệp</strong>: Thẻ vào hàng đợi ôn tập với chu kỳ giãn dần (1n → 3n → 8n → ...)</li>
          <li><strong>Quên (Lại)</strong>: Thẻ cũ bị quên sẽ quay lại hàng đợi học lại 10 phút</li>
          <li><strong>Giới hạn</strong>: Tối đa ${NEW_CARDS_PER_DAY} thẻ mới mỗi ngày/cấp độ</li>
        </ul>
      </div>
    </div>
  `;
  container.appendChild(infoCard);

  return container;
}

// ─── Start Session ───
function startSession(queue, page) {
  sessionQueue = [...queue];
  sessionIndex = 0;
  sessionNewLearned = 0;
  showBack = false;
  currentMode = 'session';
  renderContent(page);
}

// ─── Session (Flashcard) ───
function renderSession(page) {
  const container = h('div', {
    className: 'flex flex-col items-center justify-center',
    style: { minHeight: '60vh' },
  });

  // Session complete
  if (sessionIndex >= sessionQueue.length) {
    // Track new cards studied today
    if (sessionNewLearned > 0) {
      const todayKey = new Date().toDateString();
      const prev = parseInt(localStorage.getItem(`dictaflow_new_${currentTab}_${todayKey}`) || '0');
      localStorage.setItem(`dictaflow_new_${currentTab}_${todayKey}`, String(prev + sessionNewLearned));
    }

    container.appendChild(h('div', { style: { fontSize: '4rem' } }, '🎉'));
    container.appendChild(h('h2', { className: 'mb-md mt-md' }, 'Đã hoàn thành phiên học!'));
    container.appendChild(
      h('div', { className: 'text-secondary mb-lg' }, `Đã ôn tập ${sessionQueue.length} thẻ`)
    );
    container.appendChild(
      h(
        'button',
        {
          className: 'btn btn-primary',
          onClick: () => {
            currentMode = 'dashboard';
            renderContent(page);
          },
        },
        'Về màn hình chính'
      )
    );
    return container;
  }

  const k = sessionQueue[sessionIndex];
  const cardSrs = srsData[k.literal] || createNewCard();
  const isNew = !srsData[k.literal] || cardSrs.state === 'new';
  const isLearning = cardSrs.state === 'learning' || cardSrs.state === 'relearning';

  // Progress bar
  const progressText = `Thẻ ${sessionIndex + 1} / ${sessionQueue.length}`;
  const stateLabel = isNew ? '🔵 Mới' : isLearning ? '🟡 Đang học' : '🟢 Ôn tập';
  container.appendChild(
    h(
      'div',
      { className: 'flex gap-md items-center mb-md' },
      h('span', { className: 'text-secondary' }, progressText),
      h(
        'span',
        {
          className: 'text-sm',
          style: {
            padding: '2px 10px',
            borderRadius: '12px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          },
        },
        stateLabel
      )
    )
  );

  // Flashcard
  const card = h('div', {
    className: 'card text-center',
    style: {
      width: '100%',
      maxWidth: '440px',
      minHeight: '320px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      cursor: showBack ? 'default' : 'pointer',
    },
    onClick: () => {
      if (!showBack) {
        showBack = true;
        renderContent(page);
      }
    },
  });

  // Front: Kanji character
  card.appendChild(
    h('div', { style: { fontSize: '7rem', fontWeight: 'bold', lineHeight: '1', userSelect: 'none' } }, k.literal)
  );

  // Back: readings + meaning
  if (showBack) {
    const divider = h('div', {
      style: {
        borderTop: '2px solid var(--color-border)',
        margin: 'var(--space-md) 0',
      },
    });
    card.appendChild(divider);

    const backInfo = h('div', { className: 'animate-slide-up' });

    if (k.on && k.on.length > 0) {
      backInfo.appendChild(
        h(
          'div',
          { className: 'mb-sm text-lg' },
          h('span', { className: 'kanji-reading-label', style: { marginRight: '8px' } }, '音'),
          k.on.join('、 ')
        )
      );
    }
    if (k.kun && k.kun.length > 0) {
      backInfo.appendChild(
        h(
          'div',
          { className: 'mb-sm text-lg' },
          h('span', { className: 'kanji-reading-label kun', style: { marginRight: '8px' } }, '訓'),
          k.kun.join('、 ')
        )
      );
    }
    if (k.viet && k.viet.length > 0) {
      backInfo.appendChild(
        h(
          'div',
          { className: 'mb-sm text-lg text-secondary' },
          h('span', { className: 'kanji-reading-label viet', style: { marginRight: '8px' } }, '越'),
          k.viet.join(', ')
        )
      );
    }
    if (k.meaning && k.meaning.length > 0) {
      backInfo.appendChild(h('div', { className: 'mt-md italic text-lg' }, k.meaning.join(', ')));
    }

    card.appendChild(backInfo);
  } else {
    card.appendChild(
      h('div', { className: 'text-secondary mt-md text-sm' }, 'Bấm vào thẻ hoặc nút bên dưới để xem đáp án')
    );
  }

  container.appendChild(card);

  // Buttons
  const btnContainer = h('div', { className: 'flex gap-md mt-lg flex-wrap justify-center' });

  if (!showBack) {
    btnContainer.appendChild(
      h(
        'button',
        {
          className: 'btn btn-primary btn-lg',
          style: { width: '220px' },
          onClick: () => {
            showBack = true;
            renderContent(page);
          },
        },
        'Hiện đáp án'
      )
    );
  } else {
    // Get interval previews
    const previews = getButtonPreviews(cardSrs);

    const gradeCard = (grade) => {
      const updatedSrs = calculateNextReview(grade, cardSrs);

      // Save locally
      srsData[k.literal] = updatedSrs;
      localStorage.setItem('dictaflow_kanji_srs', JSON.stringify(srsData));

      // Cloud sync (background, fire-and-forget)
      saveKanjiProgress(k.literal, updatedSrs).catch(() => {});

      // Track new cards
      if (isNew) sessionNewLearned++;

      // If Again (grade 0): re-insert card later in the queue for re-learning
      if (grade === 0) {
        // Insert 5-10 cards later (or at end if queue is short)
        const insertAt = Math.min(sessionIndex + 5 + Math.floor(Math.random() * 5), sessionQueue.length);
        sessionQueue.splice(insertAt, 0, k);
      }
      // If learning/relearning and not graduated yet, re-insert for next step
      else if (
        (updatedSrs.state === 'learning' || updatedSrs.state === 'relearning') &&
        grade !== 3 // Easy always graduates
      ) {
        const insertAt = Math.min(sessionIndex + 3 + Math.floor(Math.random() * 3), sessionQueue.length);
        sessionQueue.splice(insertAt, 0, k);
      }

      sessionIndex++;
      showBack = false;
      renderContent(page);
    };

    const makeBtn = (label, preview, grade, bgColor) => {
      const btn = h('button', {
        className: 'btn',
        style: {
          backgroundColor: bgColor,
          color: 'white',
          borderColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '80px',
          padding: '8px 16px',
        },
        onClick: () => gradeCard(grade),
      });
      btn.innerHTML = `<span style="font-size:0.75rem;opacity:0.85">${preview}</span><strong style="font-size:1.05rem">${label}</strong>`;
      return btn;
    };

    btnContainer.appendChild(makeBtn('Lại', previews.again, 0, '#da3633'));
    btnContainer.appendChild(makeBtn('Khó', previews.hard, 1, '#db6d28'));
    btnContainer.appendChild(makeBtn('Tốt', previews.good, 2, '#2da44e'));
    btnContainer.appendChild(makeBtn('Dễ', previews.easy, 3, '#0969da'));
  }

  container.appendChild(btnContainer);

  return container;
}

// ─── Grid View ───
function renderGrid(page) {
  const container = h('div', { className: 'animate-slide-up' });
  const tabKanji = kanjiList.filter(k => k.jlpt === currentTab);
  const now = Date.now();

  // Legend
  const legend = h('div', {
    className: 'flex gap-md mb-md flex-wrap',
    style: { fontSize: '0.85rem' },
  });
  legend.appendChild(_legendItem('var(--color-surface)', 'var(--color-border)', 'Chưa học'));
  legend.appendChild(_legendItem('var(--color-missing-bg)', '#db6d28', 'Đang học / Cần ôn'));
  legend.appendChild(_legendItem('var(--color-correct-bg)', '#2da44e', 'Đã thuộc'));
  container.appendChild(legend);

  // Grid
  const grid = h('div', {
    style: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  });

  for (const k of tabKanji) {
    const status = getCardStatus(srsData[k.literal], now);
    let bgColor = 'var(--color-surface)';
    let borderColor = 'var(--color-border)';

    if (status === 'review') {
      bgColor = 'var(--color-correct-bg)';
      borderColor = '#2da44e';
    } else if (status === 'due' || status === 'learning') {
      bgColor = 'var(--color-missing-bg)';
      borderColor = '#db6d28';
    }

    grid.appendChild(
      h(
        'div',
        {
          className: 'card text-center',
          style: {
            width: '48px',
            height: '48px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            backgroundColor: bgColor,
            borderColor: borderColor,
            cursor: 'default',
          },
          title: `${k.literal} — ${k.meaning ? k.meaning[0] : ''}`,
        },
        k.literal
      )
    );
  }

  container.appendChild(grid);
  return container;
}

function _legendItem(bg, border, label) {
  return h(
    'div',
    { className: 'flex items-center gap-sm' },
    h('div', {
      style: {
        width: '16px',
        height: '16px',
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: '4px',
      },
    }),
    h('span', {}, label)
  );
}
