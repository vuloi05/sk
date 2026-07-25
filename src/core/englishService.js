import { syncEnglishProgress, saveEnglishProgress } from './supabase.js';
import { calculateNextReview, NEW_CARDS_PER_DAY } from './srsAlgorithm.js';

class EnglishService {
  constructor() {
    this.oxfordData = [];
    this.srsData = {};
    this.cloudSyncDone = false;
  }

  async loadData() {
    if (this.oxfordData.length > 0) return;

    // Load static oxford data with vietnamese definitions
    const res = await fetch('/oxford_5000_vi.json');
    this.oxfordData = await res.json();

    // Load SRS data from local storage
    const stored = localStorage.getItem('dictaflow_english_srs');
    if (stored) {
      try {
        this.srsData = JSON.parse(stored);
      } catch (e) {
        console.error('Invalid english srs data in localstorage', e);
        this.srsData = {};
      }
    }

    // Sync with cloud once
    if (!this.cloudSyncDone) {
      try {
        const merged = await syncEnglishProgress(this.srsData);
        if (merged) {
          this.srsData = merged;
          localStorage.setItem('dictaflow_english_srs', JSON.stringify(this.srsData));
        }
      } catch (err) {
        console.warn('[EnglishService] Cloud sync failed:', err);
      }
      this.cloudSyncDone = true;
    }
  }

  getDashboardStats(level) {
    const tabWords = this.oxfordData.filter(w => w.level === level);
    const now = Date.now();

    const todayKey = new Date().toDateString();
    const studiedToday = parseInt(localStorage.getItem(`dictaflow_english_new_${level}_${todayKey}`) || '0');
    const newLimit = Math.max(0, NEW_CARDS_PER_DAY - studiedToday);

    const newCards = [];
    const learningDue = [];
    const learningAll = [];
    const reviewDue = [];

    for (const w of tabWords) {
      const card = this.srsData[w.word];
      if (!card || card.state === 'new') {
        newCards.push(w);
      } else if (card.state === 'learning' || card.state === 'relearning') {
        learningAll.push(w);
        if (now >= card.nextReview) learningDue.push(w);
      } else if (card.state === 'review') {
        if (now >= card.nextReview) reviewDue.push(w);
      }
    }

    const totalDue = Math.min(newCards.length, newLimit) + learningDue.length + reviewDue.length;

    return {
      totalWords: tabWords.length,
      newCards,
      learningDue,
      learningAll,
      reviewDue,
      newLimit,
      totalDue
    };
  }

  buildSessionQueue(stats) {
    const newSlice = stats.newCards.slice(0, stats.newLimit);
    return [...stats.learningDue, ...stats.reviewDue, ...newSlice].sort(() => Math.random() - 0.5);
  }

  async fetchDictionaryDef(word) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) {
        return { error: true, word };
      }
      const data = await res.json();
      return { ...data[0], word };
    } catch (err) {
      return { error: true, word };
    }
  }

  gradeCard(word, grade, cardSrs, sessionQueue, sessionIndex, currentTab) {
    const isNew = !cardSrs || cardSrs.state === 'new';
    const updatedSrs = calculateNextReview(grade, cardSrs || { state: 'new' });
    
    this.srsData[word] = updatedSrs;
    localStorage.setItem('dictaflow_english_srs', JSON.stringify(this.srsData));
    saveEnglishProgress(word, updatedSrs).catch(() => {});

    if (isNew) {
      const todayKey = new Date().toDateString();
      const studiedKey = `dictaflow_english_new_${currentTab}_${todayKey}`;
      const studiedToday = parseInt(localStorage.getItem(studiedKey) || '0');
      localStorage.setItem(studiedKey, studiedToday + 1);
    }

    if (grade === 0) {
      const insertAt = Math.min(sessionIndex + 5 + Math.floor(Math.random() * 5), sessionQueue.length);
      sessionQueue.splice(insertAt, 0, sessionQueue[sessionIndex]);
    } else if ((updatedSrs.state === 'learning' || updatedSrs.state === 'relearning') && grade !== 3) {
      const insertAt = Math.min(sessionIndex + 3 + Math.floor(Math.random() * 3), sessionQueue.length);
      sessionQueue.splice(insertAt, 0, sessionQueue[sessionIndex]);
    }
    
    return updatedSrs;
  }
}

export const englishService = new EnglishService();
