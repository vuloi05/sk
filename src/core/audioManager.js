/**
 * DictaFlow — Audio Playback Manager
 *
 * Handles audio loading, play/pause, speed control,
 * and sentence-level playback with timestamps.
 * 
 * Strategy Pattern: Supports both HTML5 Audio and YouTube IFrame Player.
 * The engine is selected automatically based on the source type.
 */

import { PLAYBACK_SPEEDS } from '../utils/constants.js';
import { clamp } from '../utils/helpers.js';

/** @typedef {'html5' | 'youtube'} EngineType */

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

    // YouTube-specific state
    /** @type {EngineType} */
    this._engine = 'html5';
    /** @type {Object|null} YouTube Player instance (YT.Player) */
    this._ytPlayer = null;
    /** @type {string|null} YouTube video ID */
    this._ytVideoId = null;
    /** @type {number|null} YouTube timeupdate interval */
    this._ytInterval = null;
    /** @type {boolean} YouTube player ready state */
    this._ytReady = false;
    /** @type {HTMLElement|null} YouTube container element */
    this._ytContainer = null;
  }

  /**
   * Load audio from a File object.
   * @param {File} file
   */
  loadFile(file) {
    this.dispose();
    this._engine = 'html5';
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
    this._engine = 'html5';
    this._audio = new Audio();
    this._audio.src = url;
    this._audio.crossOrigin = 'anonymous';
    this._audio.playbackRate = this._speed;
    this._setupListeners();
  }

  /**
   * Load a YouTube video for audio playback.
   * Creates a hidden YouTube IFrame Player.
   * @param {string} videoId - 11-character YouTube video ID
   * @returns {Promise<void>} Resolves when player is ready
   */
  async loadYouTube(videoId) {
    this.dispose();
    this._engine = 'youtube';
    this._ytVideoId = videoId;
    this._ytReady = false;

    // Ensure YouTube IFrame API is loaded
    await this._loadYouTubeAPI();

    // Create a container for the player (hidden, but must be in DOM)
    this._ytContainer = document.createElement('div');
    this._ytContainer.id = 'yt-player-container';
    this._ytContainer.style.cssText = 'position:fixed;bottom:0;right:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;';
    document.body.appendChild(this._ytContainer);

    const innerDiv = document.createElement('div');
    innerDiv.id = 'yt-player-inner';
    this._ytContainer.appendChild(innerDiv);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('YouTube player timed out.'));
      }, 15000);

      this._ytPlayer = new window.YT.Player('yt-player-inner', {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            clearTimeout(timeout);
            this._ytReady = true;
            this._ytPlayer.setPlaybackRate(this._speed);
            this._setupYouTubeTimeUpdate();
            resolve();
          },
          onError: (e) => {
            clearTimeout(timeout);
            console.error('[AudioManager] YouTube player error:', e.data);
            reject(new Error('Không thể phát video YouTube. Video có thể bị xóa hoặc giới hạn.'));
          },
          onStateChange: (e) => {
            // YT.PlayerState.ENDED === 0
            if (e.data === 0) {
              this._onEnded?.();
            }
          },
        },
      });
    });
  }

  /**
   * Load the YouTube IFrame API script if not already loaded.
   * @returns {Promise<void>}
   */
  _loadYouTubeAPI() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }

      // Set callback before loading script
      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        existingCallback?.();
        resolve();
      };

      // Check if script tag already exists
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    });
  }

  /**
   * Setup a polling interval to simulate timeupdate events for YouTube player.
   */
  _setupYouTubeTimeUpdate() {
    if (this._ytInterval) clearInterval(this._ytInterval);

    this._ytInterval = setInterval(() => {
      if (!this._ytPlayer || !this._ytReady) return;

      const state = this._ytPlayer.getPlayerState();
      // YT.PlayerState.PLAYING === 1
      if (state !== 1) return;

      const currentTime = this._ytPlayer.getCurrentTime();
      const duration = this._ytPlayer.getDuration();

      // Protect against YouTube API bug: if seekTo fails/is ignored near the end,
      // it might play from 0. If this happens, pause immediately.
      if (this._sentenceStart !== null && currentTime < this._sentenceStart - 1.5) {
        this._ytPlayer.pauseVideo();
        this._sentenceEnd = null;
        this._onEnded?.();
        return;
      }

      // Auto-pause at sentence end
      if (this._sentenceEnd !== null && currentTime >= this._sentenceEnd) {
        if (this._currentRepeat < this._repeatCount) {
          this._currentRepeat++;
          this._ytPlayer.seekTo(this._sentenceStart || 0, true);
        } else {
          this._ytPlayer.pauseVideo();
          this._sentenceEnd = null;
          this._onEnded?.();
        }
      }

      this._onTimeUpdate?.(currentTime, duration);
    }, 100); // Poll every 100ms
  }

  /**
   * Setup internal event listeners for HTML5 Audio.
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
    if (this._engine === 'youtube') {
      if (this._ytPlayer && this._ytReady) {
        this._sentenceEnd = null;
        this._ytPlayer.playVideo();
      }
      return;
    }

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
    if (this._engine === 'youtube') {
      if (this._ytPlayer && this._ytReady) this._ytPlayer.pauseVideo();
      return;
    }
    this._audio?.pause();
  }

  /**
   * Toggle play/pause.
   * @returns {boolean} New playing state
   */
  togglePlay() {
    if (this._engine === 'youtube') {
      if (!this._ytPlayer || !this._ytReady) return false;
      const state = this._ytPlayer.getPlayerState();
      if (state === 1) { // Playing
        this._ytPlayer.pauseVideo();
        return false;
      } else {
        this._ytPlayer.playVideo();
        return true;
      }
    }

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
    this._sentenceStart = startTime;
    this._sentenceEnd = endTime;
    this._repeatCount = repeatCount;
    this._currentRepeat = 0;

    if (this._engine === 'youtube') {
      if (!this._ytPlayer || !this._ytReady) return;
      
      // Catch AI hallucinations where timestamps exceed the video duration
      const duration = this._ytPlayer.getDuration();
      if (duration > 0 && startTime >= duration - 1) {
        console.warn(`[AudioManager] Out of bounds: startTime ${startTime} >= duration ${duration}`);
        this._ytPlayer.pauseVideo();
        setTimeout(() => this._onEnded?.(), 100); // Trigger ended immediately
        return;
      }

      this._ytPlayer.seekTo(startTime, true);
      this._ytPlayer.playVideo();
      return;
    }

    if (!this._audio) return;
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
    if (this._engine === 'youtube') {
      if (this._ytPlayer && this._ytReady) {
        this._ytPlayer.seekTo(time, true);
      }
      return;
    }
    if (!this._audio) return;
    this._audio.currentTime = clamp(time, 0, this._audio.duration || 0);
  }

  /**
   * Set playback speed.
   * @param {number} speed
   */
  setSpeed(speed) {
    this._speed = speed;
    if (this._engine === 'youtube') {
      if (this._ytPlayer && this._ytReady) this._ytPlayer.setPlaybackRate(speed);
      return;
    }
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
    if (this._engine === 'youtube') {
      return this._ytPlayer && this._ytReady && this._ytPlayer.getPlayerState() === 1;
    }
    return this._audio ? !this._audio.paused : false;
  }

  /**
   * Get current playback time.
   * @returns {number}
   */
  getCurrentTime() {
    if (this._engine === 'youtube') {
      return (this._ytPlayer && this._ytReady) ? this._ytPlayer.getCurrentTime() : 0;
    }
    return this._audio?.currentTime || 0;
  }

  /**
   * Get total duration.
   * @returns {number}
   */
  getDuration() {
    if (this._engine === 'youtube') {
      return (this._ytPlayer && this._ytReady) ? this._ytPlayer.getDuration() : 0;
    }
    return this._audio?.duration || 0;
  }

  /**
   * Get the current engine type.
   * @returns {EngineType}
   */
  getEngine() {
    return this._engine;
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
    // HTML5 Audio cleanup
    if (this._audio) {
      this._audio.pause();
      this._audio.src = '';
      this._audio = null;
    }
    if (this._objectUrl) {
      URL.revokeObjectURL(this._objectUrl);
      this._objectUrl = null;
    }

    // YouTube cleanup
    if (this._ytInterval) {
      clearInterval(this._ytInterval);
      this._ytInterval = null;
    }
    if (this._ytPlayer) {
      try { this._ytPlayer.destroy(); } catch (_) { /* ignore */ }
      this._ytPlayer = null;
    }
    if (this._ytContainer) {
      this._ytContainer.remove();
      this._ytContainer = null;
    }
    this._ytReady = false;
    this._ytVideoId = null;

    this._sentenceEnd = null;
    this._sentenceStart = null;
  }
}

/** Singleton instance */
export const audioManager = new AudioManager();

