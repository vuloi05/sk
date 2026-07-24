import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { loadKanjiData } from '../core/kanjiService.js';
import { calculateNextReview, getCardStatus } from '../core/srsAlgorithm.js';
import { syncKanjiProgress, saveKanjiProgress } from '../core/supabase.js';

let cloudSyncDone = false;

let kanjiList = [];
let srsData = {}; // key: literal, value: { ease, interval, reps, nextReview }
let currentTab = 4; // N5 (4), N4 (3), N3 (2), N2 (1), N1 (0 -> actually KANJIDIC doesn't use 0, N1 is 1). Wait, jlpt: 4,3,2,1
let currentMode = 'dashboard'; // 'dashboard', 'flashcard', 'grid'
let flashcardQueue = [];
let currentFlashcardIndex = 0;
let showBack = false;

// Kanjidic uses: 4 (N5/N4), 3 (N4/N3), 2 (N3/N2), 1 (N1)
// We'll map: N5 (4), N4 (3), N3 (2), N2 (some 2), N1 (1). Let's use 4, 3, 2, 1 as tabs.
const TABS = [
  { id: 4, label: 'N5/N4' },
  { id: 3, label: 'N4/N3' },
  { id: 2, label: 'N3/N2' },
  { id: 1, label: 'N1' }
];

export function renderVocabulary() {
  const page = h('div', { className: 'page vocabulary-page animate-fade-in' });
  
  // Header
  const header = h('div', { className: 'flex justify-between items-center mb-lg' },
    h('h1', {}, '🧠 Học Kanji (SRS)'),
    h('div', { className: 'text-sm text-secondary' }, 'Dựa trên thuật toán Anki SM-2')
  );
  page.appendChild(header);

  // Loading state
  if (kanjiList.length === 0) {
    const loading = h('div', { className: 'text-center mt-xl' }, 'Đang tải dữ liệu Kanji...');
    page.appendChild(loading);
    
    // Load data
    Promise.all([
      loadKanjiData(),
      new Promise(resolve => {
        srsData = JSON.parse(localStorage.getItem('dictaflow_kanji_srs') || '{}');
        resolve();
      })
    ]).then(async ([data]) => {
      // Convert to array
      kanjiList = Object.entries(data).map(([literal, k]) => ({
        literal,
        jlpt: k.j,
        on: k.on,
        kun: k.kun,
        viet: k.v,
        meaning: k.m
      })).filter(k => k.jlpt != null);
      
      // Inject missing kanjis from dictaflow_kanji_history if they were learned before
      const history = JSON.parse(localStorage.getItem('dictaflow_kanji_history') || '[]');
      for (const hItem of history) {
        if (!srsData[hItem.literal]) {
          srsData[hItem.literal] = { ease: 2.5, interval: 0, reps: 0, nextReview: Date.now() - 1000 };
        }
      }

      // Cloud sync: merge localStorage with Supabase data (if user is logged in)
      if (!cloudSyncDone) {
        try {
          const merged = await syncKanjiProgress(srsData);
          if (merged) {
            srsData = merged;
            localStorage.setItem('dictaflow_kanji_srs', JSON.stringify(srsData));
            console.log('[Vocabulary] Cloud sync complete. Total entries:', Object.keys(srsData).length);
          }
        } catch (err) {
          console.warn('[Vocabulary] Cloud sync failed, using local data:', err);
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

function renderContent(page) {
  page.innerHTML = '';
  const header = h('div', { className: 'flex justify-between items-center mb-lg' },
    h('h1', {}, '🧠 Học Kanji (SRS)'),
    currentMode !== 'dashboard' 
      ? h('button', { 
          className: 'btn btn-outline btn-sm',
          onClick: () => { currentMode = 'dashboard'; renderContent(page); }
        }, '← Quay lại')
      : h('div', { className: 'text-sm text-secondary' }, 'Thuật toán SM-2')
  );
  page.appendChild(header);

  if (currentMode === 'dashboard') {
    page.appendChild(renderDashboard(page));
  } else if (currentMode === 'flashcard') {
    page.appendChild(renderFlashcard(page));
  } else if (currentMode === 'grid') {
    page.appendChild(renderGrid(page));
  }
}

function renderDashboard(page) {
  const container = h('div', { className: 'stagger-children' });

  // Tabs
  const tabs = h('div', { className: 'tab-switcher mb-lg' });
  for (const tab of TABS) {
    const btn = h('button', {
      className: `tab-btn ${currentTab === tab.id ? 'active' : ''}`,
      onClick: () => { currentTab = tab.id; renderContent(page); }
    }, tab.label);
    tabs.appendChild(btn);
  }
  container.appendChild(tabs);

  // Calculate stats for current tab
  const tabKanji = kanjiList.filter(k => k.jlpt === currentTab);
  const now = Date.now();
  let newCount = 0;
  let learningDueCount = 0;
  let learnedCount = 0;

  const dueQueue = [];

  for (const k of tabKanji) {
    const status = getCardStatus(srsData[k.literal], now);
    if (status === 'new') {
      newCount++;
    } else if (status === 'learning' || status === 'due') {
      learningDueCount++;
      dueQueue.push(k);
    } else {
      learnedCount++;
    }
  }

  // Fallback: If no due cards, can we study new cards?
  // We allow studying up to 10 new cards at a time.
  const newQueue = tabKanji.filter(k => getCardStatus(srsData[k.literal], now) === 'new').slice(0, 10);

  // Stats Card
  const statsCard = h('div', { className: 'card text-center py-xl mb-lg' });
  statsCard.appendChild(h('h2', { className: 'mb-md' }, `Thống kê Kanji ${TABS.find(t => t.id === currentTab).label}`));
  
  const statsRow = h('div', { className: 'flex justify-center gap-xl mb-xl text-lg' });
  
  statsRow.appendChild(h('div', {},
    h('div', { style: { color: 'var(--color-accent-blue)', fontSize: '2rem', fontWeight: 'bold' } }, newCount),
    h('div', { className: 'text-sm text-secondary' }, 'Từ mới')
  ));
  statsRow.appendChild(h('div', {},
    h('div', { style: { color: 'var(--color-accent-red)', fontSize: '2rem', fontWeight: 'bold' } }, learningDueCount),
    h('div', { className: 'text-sm text-secondary' }, 'Cần học (Due)')
  ));
  statsRow.appendChild(h('div', {},
    h('div', { style: { color: 'var(--color-correct)', fontSize: '2rem', fontWeight: 'bold' } }, learnedCount),
    h('div', { className: 'text-sm text-secondary' }, 'Đã thuộc')
  ));
  
  statsCard.appendChild(statsRow);

  // Actions
  const actions = h('div', { className: 'flex justify-center gap-md' });
  
  if (learningDueCount > 0) {
    actions.appendChild(h('button', {
      className: 'btn btn-primary btn-lg',
      onClick: () => startFlashcards(dueQueue, page)
    }, `Học ${learningDueCount} từ đang tới hạn`));
  } else if (newCount > 0) {
    actions.appendChild(h('button', {
      className: 'btn btn-blue btn-lg',
      onClick: () => startFlashcards(newQueue, page)
    }, `Học 10 từ mới`));
  } else {
    actions.appendChild(h('div', { className: 'text-success font-bold' }, '🎉 Bạn đã hoàn thành bài học hôm nay!'));
  }

  actions.appendChild(h('button', {
    className: 'btn btn-outline btn-lg',
    onClick: () => { currentMode = 'grid'; renderContent(page); }
  }, 'Xem danh sách (Grid)'));

  statsCard.appendChild(actions);
  container.appendChild(statsCard);

  return container;
}

function startFlashcards(queue, page) {
  // Shuffle queue
  flashcardQueue = queue.sort(() => Math.random() - 0.5);
  currentFlashcardIndex = 0;
  showBack = false;
  currentMode = 'flashcard';
  renderContent(page);
}

function renderFlashcard(page) {
  const container = h('div', { className: 'flex flex-col items-center justify-center', style: { minHeight: '60vh' } });

  if (currentFlashcardIndex >= flashcardQueue.length) {
    container.appendChild(h('h2', { className: 'mb-md' }, '🎉 Đã hoàn thành phiên học!'));
    container.appendChild(h('button', {
      className: 'btn btn-primary',
      onClick: () => { currentMode = 'dashboard'; renderContent(page); }
    }, 'Về màn hình chính'));
    return container;
  }

  const k = flashcardQueue[currentFlashcardIndex];
  
  // Progress
  container.appendChild(h('div', { className: 'text-secondary mb-md' }, 
    `Thẻ ${currentFlashcardIndex + 1} / ${flashcardQueue.length}`
  ));

  // Card
  const card = h('div', { 
    className: 'card text-center', 
    style: { width: '100%', maxWidth: '400px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } 
  });
  
  // Front
  card.appendChild(h('div', { style: { fontSize: '6rem', fontWeight: 'bold', lineHeight: '1' } }, k.literal));

  // Back
  if (showBack) {
    const backInfo = h('div', { className: 'mt-md animate-slide-up', style: { borderTop: '2px solid var(--color-border)', paddingTop: 'var(--space-md)' } });
    
    // Readings
    if (k.on && k.on.length > 0) {
      backInfo.appendChild(h('div', { className: 'mb-sm text-lg' }, 
        h('span', { className: 'kanji-reading-label', style: { marginRight: '8px' } }, '音'),
        k.on.join(', ')
      ));
    }
    if (k.kun && k.kun.length > 0) {
      backInfo.appendChild(h('div', { className: 'mb-sm text-lg' }, 
        h('span', { className: 'kanji-reading-label kun', style: { marginRight: '8px' } }, '訓'),
        k.kun.join(', ')
      ));
    }
    if (k.viet && k.viet.length > 0) {
      backInfo.appendChild(h('div', { className: 'mb-sm text-lg text-secondary' }, 
        h('span', { className: 'kanji-reading-label viet', style: { marginRight: '8px' } }, '越'),
        k.viet.join(', ')
      ));
    }
    
    // Meaning
    if (k.meaning && k.meaning.length > 0) {
      backInfo.appendChild(h('div', { className: 'mt-md italic text-lg' }, k.meaning.join(', ')));
    }
    
    card.appendChild(backInfo);
  }

  container.appendChild(card);

  // Buttons
  const btnContainer = h('div', { className: 'flex gap-md mt-lg flex-wrap justify-center' });

  if (!showBack) {
    btnContainer.appendChild(h('button', {
      className: 'btn btn-primary btn-lg',
      style: { width: '200px' },
      onClick: () => { showBack = true; renderContent(page); }
    }, 'Hiện đáp án'));
  } else {
    // Current SRS state
    const currentSrs = srsData[k.literal] || { ease: 2.5, interval: 0, reps: 0 };
    
    // Calculate previews to show intervals on buttons
    const ansAgain = calculateNextReview(0, currentSrs);
    const ansHard = calculateNextReview(1, currentSrs);
    const ansGood = calculateNextReview(2, currentSrs);
    const ansEasy = calculateNextReview(3, currentSrs);

    const formatInterval = (intv) => intv === 0 ? '<1m' : `${intv}d`;

    const makeBtn = (label, grade, srsResult, color) => {
      const btn = h('button', {
        className: 'btn',
        style: { 
          backgroundColor: color, 
          color: 'white', 
          borderColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '80px'
        },
        onClick: () => {
          srsData[k.literal] = srsResult;
          localStorage.setItem('dictaflow_kanji_srs', JSON.stringify(srsData));
          
          // Background cloud sync (fire-and-forget, no blocking UI)
          saveKanjiProgress(k.literal, srsResult).catch(err => {
            console.warn('[Vocabulary] Cloud save failed for', k.literal, err);
          });
          
          if (grade === 0) {
            // Again -> re-add to end of queue to learn again today
            flashcardQueue.push(k);
          }
          
          currentFlashcardIndex++;
          showBack = false;
          renderContent(page);
        }
      });
      btn.innerHTML = `<span style="font-size:0.8rem;opacity:0.9">${formatInterval(srsResult.interval)}</span><strong style="font-size:1.1rem">${label}</strong>`;
      return btn;
    };

    btnContainer.appendChild(makeBtn('Lại', 0, ansAgain, '#da3633')); // Red
    btnContainer.appendChild(makeBtn('Khó', 1, ansHard, '#db6d28')); // Orange
    btnContainer.appendChild(makeBtn('Tốt', 2, ansGood, '#2da44e')); // Green
    btnContainer.appendChild(makeBtn('Dễ', 3, ansEasy, '#0969da')); // Blue
  }

  container.appendChild(btnContainer);

  return container;
}

function renderGrid(page) {
  const container = h('div', { className: 'animate-slide-up' });
  const tabKanji = kanjiList.filter(k => k.jlpt === currentTab);
  
  const grid = h('div', { 
    style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'var(--space-md)' } 
  });

  const now = Date.now();

  for (const k of tabKanji) {
    const status = getCardStatus(srsData[k.literal], now);
    let bgColor = 'var(--color-surface)';
    let borderColor = 'var(--color-border)';

    if (status === 'review') {
      bgColor = 'var(--color-correct-bg)';
      borderColor = 'var(--color-correct)';
    } else if (status === 'due' || status === 'learning') {
      bgColor = 'var(--color-missing-bg)';
      borderColor = 'var(--color-accent-orange)';
    }

    const box = h('div', {
      className: 'card text-center',
      style: { 
        width: '50px', height: '50px', padding: '0', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', fontWeight: 'bold',
        backgroundColor: bgColor,
        borderColor: borderColor,
        cursor: 'pointer'
      },
      title: `${k.literal} - ${k.meaning ? k.meaning[0] : ''}`
    }, k.literal);
    
    grid.appendChild(box);
  }

  container.appendChild(grid);
  return container;
}
