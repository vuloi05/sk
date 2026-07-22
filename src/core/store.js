/**
 * DictaFlow — State Management (localStorage-based)
 */

import { STORAGE_KEYS, DEFAULTS } from '../utils/constants.js';
import { safeJsonParse } from '../utils/helpers.js';

/**
 * Simple reactive store with localStorage persistence.
 */
class Store {
  constructor() {
    this._listeners = new Map();
    this._state = {
      /** @type {Object|null} Current logged in user profile */
      currentUser: null,

      /** @type {string|null} Gemini API key */
      apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || null,

      /** @type {Object} User settings */
      settings: safeJsonParse(localStorage.getItem(STORAGE_KEYS.SETTINGS), { ...DEFAULTS }),

      /** @type {string} Current route */
      route: 'library',

      /** @type {Object|null} Current lesson being practiced */
      currentLesson: null,

      /** @type {Array} Sentences of current lesson */
      currentSentences: [],

      /** @type {string|null} Selected practice mode */
      currentMode: null,

      /** @type {number} Current sentence index in practice */
      currentSentenceIndex: 0,

      /** @type {Array} Practice results for scoring */
      practiceResults: [],

      /** @type {File|null} Uploaded audio file (for new lessons) */
      uploadedFile: null,

      /** @type {Object|null} Transcript data from Gemini */
      transcriptData: null,

      /** @type {boolean} Global loading state */
      loading: false,

      /** @type {string|null} Loading message */
      loadingMessage: null,
    };
  }

  /**
   * Get a state value.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Set a state value and notify listeners.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    const oldValue = this._state[key];
    this._state[key] = value;

    // Persist certain keys to localStorage
    if (key === 'apiKey') {
      if (value) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, value);
      } else {
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
      }
    }
    if (key === 'settings') {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(value));
    }

    // Notify listeners
    this._notify(key, value, oldValue);
  }

  /**
   * Update multiple state values at once.
   * @param {Object} updates
   */
  update(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this.set(key, value);
    }
  }

  /**
   * Subscribe to state changes.
   * @param {string} key - State key to watch
   * @param {Function} callback - Called with (newValue, oldValue)
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);
    return () => this._listeners.get(key)?.delete(callback);
  }

  /**
   * Notify all listeners for a key.
   * @param {string} key
   * @param {*} newValue
   * @param {*} oldValue
   */
  _notify(key, newValue, oldValue) {
    const listeners = this._listeners.get(key);
    if (listeners) {
      for (const cb of listeners) {
        cb(newValue, oldValue);
      }
    }
  }

  /**
   * Reset practice-related state.
   */
  resetPractice() {
    this.update({
      currentLesson: null,
      currentSentences: [],
      currentMode: null,
      currentSentenceIndex: 0,
      practiceResults: [],
    });
  }

  /**
   * Reset upload-related state.
   */
  resetUpload() {
    this.update({
      uploadedFile: null,
      transcriptData: null,
    });
  }

  /**
   * Show global loading overlay.
   * @param {string} message
   */
  showLoading(message = 'Đang xử lý...') {
    this.update({ loading: true, loadingMessage: message });
  }

  /**
   * Hide global loading overlay.
   */
  hideLoading() {
    this.update({ loading: false, loadingMessage: null });
  }
}

/** Singleton store instance */
export const store = new Store();
