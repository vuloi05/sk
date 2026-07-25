/**
 * DictaFlow — English Vocabulary (Oxford 5000 SRS)
 */

import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import {
  calculateNextReview,
  getCardStatus,
  getButtonPreviews,
  createNewCard,
  NEW_CARDS_PER_DAY,
} from '../core/srsAlgorithm.js';
import { syncEnglishProgress, saveEnglishProgress } from '../core/supabase.js';

// ─── Module State ───
let oxfordData = [];
let srsData = {};
let currentTab = 'A1';
let currentMode = 'dashboard'; // 'dashboard' | 'session' | 'grid'
let sessionQueue = [];
let sessionIndex = 0;
let showBack = false;
let cloudSyncDone = false;
let sessionStats = { newCount: 0, dueCount: 0, reviewCount: 0 };
let sessionNewLearned = 0;
let currentDictData = null; // Cache for current word dictionary info

const TABS = ['A1', 'A2', 'B1', 'B2', 'C1'];

// ─── Entry Point ───
export function renderEnglishVocab() {
  const page = h('div', { className: 'page vocabulary-page animate-fade-in' });

  if (oxfordData.length === 0) {
    page.appendChild(h('div', { className: 'text-center mt-xl' }, 'Đang tải dữ liệu từ vựng...'));

    Promise.all([
      fetch('/oxford_5000.json').then(res => res.json()),
      new Promise(resolve => {
        srsData = JSON.parse(localStorage.getItem('dictaflow_english_srs') || '{}');
        resolve();
      })
    ]).then(async ([data]) => {
      oxfordData = data;

      if (!cloudSyncDone) {
        try {
          const merged = await syncEnglishProgress(srsData);
          if (merged) {
            srsData = merged;
            localStorage.setItem('dictaflow_english_srs', JSON.stringify(srsData));
          }
        } catch (err) {
          console.warn('[EnglishVocab] Cloud sync failed:', err);
        }
        cloudSyncDone = true;
      }

      renderContent(page);
    }).catch(err => {
      console.error('[EnglishVocab] Error fetching data:', err);
      page.innerHTML = '';
      page.appendChild(h('div', { style: { color: 'red', padding: '2rem' } }, 
        'ERROR: ' + err.message + '\n' + err.stack
      ));
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
    h('h1', {}, '🔤 Học Tiếng Anh (SRS)'),
    currentMode !== 'dashboard'
      ? h(
          'button',
          {
            className: 'btn btn-ghost',
            onClick: () => {
              currentMode = 'dashboard';
              renderContent(page);
            },
          },
          '← Quay lại'
        )
      : ''
  );
  page.appendChild(header);

  if (currentMode === 'dashboard') {
    page.appendChild(renderDashboard(page));
  } else if (currentMode === 'session') {
    page.appendChild(renderSession(page));
  } else if (currentMode === 'grid') {
    page.appendChild(renderGrid(page));
  }
}

// ─── Dashboard ───
function renderDashboard(page) {
  const container = h('div', { className: 'animate-slide-up' });

  // Tabs
  const tabContainer = h('div', { className: 'tab-switcher mb-lg' });
  TABS.forEach(lvl => {
    tabContainer.appendChild(
      h(
        'button',
        {
          className: `tab-btn ${currentTab === lvl ? 'active' : ''}`,
          onClick: () => {
            currentTab = lvl;
            renderContent(page);
          },
        },
        `Cấp ${lvl}`
      )
    );
  });
  container.appendChild(tabContainer);

  const tabWords = oxfordData.filter(w => w.level === currentTab);
  const now = Date.now();

  const newCards = [];
  const learningCards = [];
  const reviewCards = [];

  for (const w of tabWords) {
    const card = srsData[w.word];
    if (!card || card.state === 'new') {
      newCards.push(w);
    } else if (card.state === 'learning' || card.state === 'relearning') {
      if (now >= card.nextReview) learningCards.push(w);
    } else if (card.state === 'review') {
      if (now >= card.nextReview) reviewCards.push(w);
    }
  }

  sessionStats = {
    newCount: newCards.length,
    dueCount: learningCards.length,
    reviewCount: reviewCards.length,
  };

  const totalDue = Math.min(newCards.length, NEW_CARDS_PER_DAY) + learningCards.length + reviewCards.length;

  const statsCard = h('div', { className: 'card mb-lg text-center p-xl' });
  statsCard.appendChild(h('h2', { className: 'mb-sm' }, `Cấp độ ${currentTab}`));
  statsCard.appendChild(h('p', { className: 'text-secondary mb-lg' }, `Tổng cộng ${tabWords.length} từ vựng`));

  const statsFlex = h('div', { className: 'flex justify-center gap-xl mb-lg text-lg flex-wrap' });
  statsFlex.appendChild(_statItem('Từ mới', Math.min(newCards.length, NEW_CARDS_PER_DAY), '#0969da'));
  statsFlex.appendChild(_statItem('Đang học', learningCards.length, '#db6d28'));
  statsFlex.appendChild(_statItem('Cần ôn', reviewCards.length, '#2da44e'));
  statsCard.appendChild(statsFlex);

  const btnContainer = h('div', { className: 'flex justify-center gap-md flex-wrap' });

  const startBtn = h(
    'button',
    {
      className: 'btn btn-primary btn-lg',
      disabled: totalDue === 0,
      onClick: () => {
        const newSlice = newCards.slice(0, NEW_CARDS_PER_DAY);
        sessionQueue = [...learningCards, ...reviewCards, ...newSlice].sort(() => Math.random() - 0.5);
        sessionIndex = 0;
        showBack = false;
        currentDictData = null;
        sessionNewLearned = 0;
        currentMode = 'session';
        renderContent(page);
      },
    },
    totalDue > 0 ? `▶ Bắt đầu học (${totalDue})` : '🎉 Đã hoàn thành mục tiêu hôm nay!'
  );
  btnContainer.appendChild(startBtn);

  btnContainer.appendChild(
    h(
      'button',
      {
        className: 'btn btn-secondary btn-lg',
        onClick: () => {
          currentMode = 'grid';
          renderContent(page);
        },
      },
      'Tra cứu toàn bộ'
    )
  );

  statsCard.appendChild(btnContainer);
  container.appendChild(statsCard);

  return container;
}

function _statItem(label, count, color) {
  return h(
    'div',
    { className: 'flex flex-col items-center' },
    h('strong', { style: { color, fontSize: '2rem' } }, count),
    h('span', { className: 'text-secondary text-sm' }, label)
  );
}

// ─── Session ───
function renderSession(page) {
  const container = h('div', { className: 'flex flex-col items-center animate-slide-up w-full' });

  if (sessionIndex >= sessionQueue.length) {
    container.appendChild(h('h2', { className: 'mb-md text-success' }, '🎉 Chúc mừng!'));
    container.appendChild(h('p', { className: 'text-secondary mb-lg' }, 'Bạn đã hoàn thành phiên học tiếng Anh này.'));
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

  const w = sessionQueue[sessionIndex];
  if (!srsData[w.word]) {
    srsData[w.word] = createNewCard();
  }
  const cardSrs = srsData[w.word];

  const isNew = cardSrs.state === 'new';
  const isLearning = cardSrs.state === 'learning' || cardSrs.state === 'relearning';

  const progressText = `Thẻ ${sessionIndex + 1} / ${sessionQueue.length}`;
  const stateLabel = isNew ? '🆕 Từ mới' : isLearning ? '🔁 Đang học' : '✅ Ôn tập';
  
  container.appendChild(
    h('div', { className: 'flex gap-md items-center mb-md' },
      h('span', { className: 'text-secondary' }, progressText),
      h('span', {
          className: 'text-sm',
          style: {
            padding: '2px 10px',
            borderRadius: '12px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          },
        }, stateLabel)
    )
  );

  const card = h('div', {
    className: 'card text-center',
    style: {
      width: '100%',
      maxWidth: '500px',
      minHeight: '320px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      cursor: showBack ? 'default' : 'pointer',
    },
    onClick: () => {
      if (!showBack) {
        showBack = true;
        loadDictionary(w.word).then(() => renderContent(page));
        renderContent(page);
      }
    },
  });

  // Front
  card.appendChild(
    h('div', { style: { fontSize: '4rem', fontWeight: 'bold', lineHeight: '1', marginBottom: '10px' } }, w.word)
  );
  if (!showBack) {
    card.appendChild(h('div', { className: 'text-secondary mt-md text-sm' }, 'Bấm để lật thẻ'));
  }

  // Back
  if (showBack) {
    const divider = h('div', { style: { borderTop: '2px solid var(--color-border)', margin: 'var(--space-md) 0' } });
    card.appendChild(divider);

    const backInfo = h('div', { className: 'animate-slide-up text-left px-md' });

    // Header info (POS)
    const headerRow = h('div', { className: 'flex justify-between items-center mb-md' });
    headerRow.appendChild(h('span', { className: 'badge' }, w.pos));
    
    const playBtn = h('button', { className: 'btn btn-ghost btn-sm', title: 'Nghe phát âm' }, '🔊 Nghe');
    playBtn.onclick = (e) => {
      e.stopPropagation();
      playAudio(w.word, currentDictData);
    };
    headerRow.appendChild(playBtn);
    backInfo.appendChild(headerRow);

    if (!currentDictData) {
      backInfo.appendChild(h('div', { className: 'text-secondary text-center my-md' }, 'Đang tra từ điển...'));
    } else if (currentDictData.error) {
      backInfo.appendChild(h('div', { className: 'text-danger my-md' }, 'Không tìm thấy định nghĩa chi tiết.'));
    } else {
      // IPA Phonetic
      if (currentDictData.phonetic) {
        backInfo.appendChild(h('div', { className: 'text-secondary mb-sm' }, currentDictData.phonetic));
      }
      
      // Definitions
      const meanings = currentDictData.meanings || [];
      meanings.slice(0, 2).forEach(m => {
        backInfo.appendChild(h('div', { className: 'mb-sm font-bold text-primary' }, m.partOfSpeech));
        m.definitions.slice(0, 2).forEach(d => {
          backInfo.appendChild(h('div', { className: 'mb-xs' }, '• ' + d.definition));
          if (d.example) {
            backInfo.appendChild(h('div', { className: 'text-secondary italic ml-md mb-xs', style: { fontSize: '0.9rem' } }, `"${d.example}"`));
          }
        });
      });
    }

    card.appendChild(backInfo);
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
            loadDictionary(w.word).then(() => renderContent(page));
            renderContent(page);
          },
        },
        'Hiện đáp án'
      )
    );
  } else {
    const previews = getButtonPreviews(cardSrs);

    const gradeCard = (grade) => {
      const updatedSrs = calculateNextReview(grade, cardSrs);
      srsData[w.word] = updatedSrs;
      localStorage.setItem('dictaflow_english_srs', JSON.stringify(srsData));
      saveEnglishProgress(w.word, updatedSrs).catch(() => {});

      if (isNew) sessionNewLearned++;

      if (grade === 0) {
        const insertAt = Math.min(sessionIndex + 5 + Math.floor(Math.random() * 5), sessionQueue.length);
        sessionQueue.splice(insertAt, 0, w);
      } else if ((updatedSrs.state === 'learning' || updatedSrs.state === 'relearning') && grade !== 3) {
        const insertAt = Math.min(sessionIndex + 3 + Math.floor(Math.random() * 3), sessionQueue.length);
        sessionQueue.splice(insertAt, 0, w);
      }

      sessionIndex++;
      showBack = false;
      currentDictData = null; // reset dict cache
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
  const container = h('div', { className: 'animate-slide-up w-full' });
  
  // Tabs
  const tabContainer = h('div', { className: 'tab-switcher mb-lg justify-center' });
  TABS.forEach(lvl => {
    tabContainer.appendChild(
      h(
        'button',
        {
          className: `tab-btn ${currentTab === lvl ? 'active' : ''}`,
          onClick: () => {
            currentTab = lvl;
            renderContent(page);
          },
        },
        `Cấp ${lvl}`
      )
    );
  });
  container.appendChild(tabContainer);
  
  const tabWords = oxfordData.filter(w => w.level === currentTab);
  const now = Date.now();

  const legend = h('div', { className: 'flex gap-md mb-md flex-wrap justify-center', style: { fontSize: '0.85rem' }});
  legend.appendChild(_legendItem('var(--color-surface)', 'var(--color-border)', 'Chưa học'));
  legend.appendChild(_legendItem('var(--color-missing-bg)', '#db6d28', 'Đang học / Cần ôn'));
  legend.appendChild(_legendItem('var(--color-correct-bg)', '#2da44e', 'Đã thuộc'));
  container.appendChild(legend);

  const grid = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }});

  for (const w of tabWords) {
    const status = getCardStatus(srsData[w.word], now);
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
      h('div', {
          className: 'card text-center',
          style: {
            padding: '8px 12px',
            fontSize: '1rem',
            backgroundColor: bgColor,
            borderColor: borderColor,
            cursor: 'default',
          },
          title: w.pos,
        },
        w.word
      )
    );
  }

  container.appendChild(grid);
  return container;
}

function _legendItem(bg, border, label) {
  return h('div', { className: 'flex items-center gap-sm' },
    h('div', { style: { width: '16px', height: '16px', background: bg, border: `2px solid ${border}`, borderRadius: '4px' }}),
    h('span', {}, label)
  );
}

// ─── Dictionary Helpers ───
async function loadDictionary(word) {
  if (currentDictData && currentDictData.word === word) return;
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) {
      currentDictData = { error: true, word };
      return;
    }
    const data = await res.json();
    currentDictData = { ...data[0], word };
  } catch (err) {
    currentDictData = { error: true, word };
  }
}

function playAudio(word, dictData) {
  // Try to find audio URL from dictionary API
  let audioUrl = '';
  if (dictData && dictData.phonetics) {
    for (const ph of dictData.phonetics) {
      if (ph.audio) {
        audioUrl = ph.audio;
        break;
      }
    }
  }

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => speakFallback(word));
  } else {
    speakFallback(word);
  }
}

function speakFallback(word) {
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}
