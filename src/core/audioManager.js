/**
 * DictaFlow — Audio Playback Manager
 *
 * Handles audio loading, play/pause, speed control,
 * and sentence-level playback with timestamps.
 */

import { PLAYBACK_SPEEDS } from '../utils/constants.js';
import { clamp } from '../utils/helpers.js';

class AudioManager {
  constructor() {
    /** @type {HTMLAudioElement|null} */
    this._audio = null;
    /** @type {string|null} */
    this._objectUrl = null;
    /** @type {number} */
    this._speed = 1;
    /** @type {number|null} Sentence end time — auto-pause when reached */
    this._sentenceEnd = null;
    /** @type {Function|null} */
    this._onTimeUpdate = null;
    /** @type {Function|null} */
    this._onEnded = null;
    /** @type {number} */
    this._repeatCount = 0;
    /** @type {number} */
    this._currentRepeat = 0;
    /** @type {number|null} */
    this._sentenceStart = null;
  }

  /**
   * Load audio from a File object.
   * @param {File} file
   */
  loadFile(file) {
    this.dispose();
    this._audio = new Audio();
    this._objectUrl = URL.createObjectURL(file);
    this._audio.src = this._objectUrl;
    this._audio.playbackRate = this._speed;
    this._setupListeners();
  }

  /**
   * Load audio from a URL (e.g., Supabase storage).
   * @param {string} url
   */
  loadUrl(url) {
    this.dispose();
    this._audio = new Audio();
    this._audio.src = url;
    this._audio.crossOrigin = 'anonymous';
    this._audio.playbackRate = this._speed;
    this._setupListeners();
  }

  /**
   * Setup internal event listeners.
   */
  _setupListeners() {
    if (!this._audio) return;

    this._audio.addEventListener('timeupdate', () => {
      // Auto-pause at sentence end
      if (this._sentenceEnd !== null && this._audio.currentTime >= this._sentenceEnd) {
        if (this._currentRepeat < this._repeatCount) {
          // Repeat: seek back to sentence start
          this._currentRepeat++;
          this._audio.currentTime = this._sentenceStart || 0;
        } else {
          this._audio.pause();
          this._sentenceEnd = null;
          this._onEnded?.();
        }
      }
      this._onTimeUpdate?.(this._audio.currentTime, this._audio.duration);
    });

    this._audio.addEventListener('ended', () => {
      this._onEnded?.();
    });
  }

  /**
   * Play the entire audio or resume.
   */
  async play() {
    if (!this._audio) return;
    this._sentenceEnd = null;
    try {
      await this._audio.play();
    } catch (err) {
      console.error('[AudioManager] Play error:', err);
    }
  }

  /**
   * Pause playback.
   */
  pause() {
    this._audio?.pause();
  }

  /**
   * Toggle play/pause.
   * @returns {boolean} New playing state
   */
  togglePlay() {
    if (!this._audio) return false;
    if (this._audio.paused) {
      this.play();
      return true;
    } else {
      this.pause();
      return false;
    }
  }

  /**
   * Play a specific sentence segment.
   * @param {number} startTime - Start time in seconds
   * @param {number} endTime - End time in seconds
   * @param {number} [repeatCount=0] - How many extra times to repeat (0 = play once)
   */
  async playSentence(startTime, endTime, repeatCount = 0) {
    if (!this._audio) return;
    this._sentenceStart = startTime;
    this._sentenceEnd = endTime;
    this._repeatCount = repeatCount;
    this._currentRepeat = 0;
    this._audio.currentTime = this._sentenceStart;
    try {
      await this._audio.play();
    } catch (err) {
      console.error('[AudioManager] playSentence error:', err);
    }
  }

  /**
   * Seek to a specific time.
   * @param {number} time - Time in seconds
   */
  seek(time) {
    if (!this._audio) return;
    this._audio.currentTime = clamp(time, 0, this._audio.duration || 0);
  }

  /**
   * Set playback speed.
   * @param {number} speed
   */
  setSpeed(speed) {
    this._speed = speed;
    if (this._audio) {
      this._audio.playbackRate = speed;
    }
  }

  /**
   * Cycle through playback speeds.
   * @returns {number} New speed
   */
  cycleSpeed() {
    const currentIdx = PLAYBACK_SPEEDS.indexOf(this._speed);
    const nextIdx = (currentIdx + 1) % PLAYBACK_SPEEDS.length;
    this.setSpeed(PLAYBACK_SPEEDS[nextIdx]);
    return this._speed;
  }

  /**
   * Get current speed.
   * @returns {number}
   */
  getSpeed() {
    return this._speed;
  }

  /**
   * Check if audio is currently playing.
   * @returns {boolean}
   */
  isPlaying() {
    return this._audio ? !this._audio.paused : false;
  }

  /**
   * Get current playback time.
   * @returns {number}
   */
  getCurrentTime() {
    return this._audio?.currentTime || 0;
  }

  /**
   * Get total duration.
   * @returns {number}
   */
  getDuration() {
    return this._audio?.duration || 0;
  }

  /**
   * Set callback for time updates.
   * @param {Function} fn - Called with (currentTime, duration)
   */
  onTimeUpdate(fn) {
    this._onTimeUpdate = fn;
  }

  /**
   * Set callback for when playback ends (or sentence ends).
   * @param {Function} fn
   */
  onEnded(fn) {
    this._onEnded = fn;
  }

  /**
   * Clean up resources.
   */
  dispose() {
    if (this._audio) {
      this._audio.pause();
      this._audio.src = '';
      this._audio = null;
    }
    if (this._objectUrl) {
      URL.revokeObjectURL(this._objectUrl);
      this._objectUrl = null;
    }
    this._sentenceEnd = null;
    this._sentenceStart = null;
  }
}

/** Singleton instance */
export const audioManager = new AudioManager();
